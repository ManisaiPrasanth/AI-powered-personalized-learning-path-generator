import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { get, run } from '../db/connection';

export const aiContentRouter = Router();

type AiSection = { heading: string; body: string; bullets?: string[] };
type AiContent = {
  title: string;
  overview: string;
  keyTakeaways: string[];
  sections: AiSection[];
  practice: string[];
};

function extractJson(raw: string): AiContent | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  const json = raw.slice(start, end + 1);
  try {
    return JSON.parse(json) as AiContent;
  } catch {
    return null;
  }
}

function sanitize(content: AiContent): AiContent {
  return {
    title: String(content.title ?? '').trim(),
    overview: String(content.overview ?? '').trim(),
    keyTakeaways: (content.keyTakeaways ?? [])
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 6),
    sections: (content.sections ?? [])
      .map((s) => ({
        heading: String(s.heading ?? '').trim(),
        body: String(s.body ?? '').trim(),
        bullets: (s.bullets ?? []).map((b) => String(b).trim()).filter(Boolean).slice(0, 6)
      }))
      .filter((s) => s.heading && s.body)
      .slice(0, 8),
    practice: (content.practice ?? [])
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 8)
  };
}

function extractJsonArray(raw: string): unknown[] | null {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start < 0 || end <= start) return null;
  const slice = raw.slice(start, end + 1);
  try {
    const parsed = JSON.parse(slice);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type AiQuizQuestion = {
  question_text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct_option: string;
  explanation: string;
};

function sanitizeAiQuizQuestions(items: unknown): AiQuizQuestion[] {
  if (!Array.isArray(items)) return [];

  const out: AiQuizQuestion[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;

    const question_text = String(obj.question_text ?? '').trim();
    const a = String(obj.a ?? '').trim();
    const b = String(obj.b ?? '').trim();
    const c = String(obj.c ?? '').trim();
    const d = String(obj.d ?? '').trim();
    const correct_option = String(obj.correct_option ?? '').trim().toLowerCase();
    const explanation = String(obj.explanation ?? '').trim();

    if (!question_text) continue;
    if (!a || !b || !c || !d) continue;
    if (!['a', 'b', 'c', 'd'].includes(correct_option)) continue;
    if (!explanation) continue;

    out.push({
      question_text,
      a,
      b,
      c,
      d,
      correct_option,
      explanation
    });
  }

  return out.slice(0, 10);
}

type GeminiModel = {
  name?: string;
  supportedGenerationMethods?: string[];
};

async function discoverModelPaths(key: string): Promise<string[]> {
  const versions: Array<'v1beta' | 'v1'> = ['v1beta', 'v1'];
  const out: string[] = [];

  for (const v of versions) {
    const url = `https://generativelanguage.googleapis.com/${v}/models?key=${encodeURIComponent(key)}`;
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const data = (await r.json()) as { models?: GeminiModel[] };
      const models = data.models ?? [];
      for (const m of models) {
        const name = m.name?.trim(); // e.g. "models/gemini-2.5-flash"
        if (!name) continue;
        const methods = m.supportedGenerationMethods ?? [];
        if (!methods.includes('generateContent')) continue;
        out.push(`${v}/${name}:generateContent`);
      }
    } catch {
      // ignore and continue
    }
  }

  // stable order + no duplicates
  return Array.from(new Set(out));
}

aiContentRouter.post(
  '/ml-unit',
  [
    body('unitNumber').isInt({ min: 1, max: 14 }),
    body('unitTitle').isString().isLength({ min: 1, max: 200 }).trim(),
    body('language').optional().isIn(['en', 'hi', 'es'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) {
      return res.status(400).json({ message: 'GEMINI_API_KEY is not configured on backend.' });
    }

    const { unitNumber, unitTitle, language = 'en' } = req.body as {
      unitNumber: number;
      unitTitle: string;
      language?: 'en' | 'hi' | 'es';
    };

    const languageGuide =
      language === 'hi'
        ? 'Write all text in Hindi.'
        : language === 'es'
        ? 'Write all text in Spanish.'
        : 'Write all text in English.';

    const prompt = [
      'You are an expert Machine Learning tutor.',
      'Generate structured learning content for one unit.',
      languageGuide,
      'Return ONLY valid JSON (no markdown fences, no extra text).',
      'Schema:',
      '{',
      '  "title": string,',
      '  "overview": string,',
      '  "keyTakeaways": string[],',
      '  "sections": [{ "heading": string, "body": string, "bullets"?: string[] }],',
      '  "practice": string[]',
      '}',
      'Constraints:',
      '- 3 to 5 keyTakeaways',
      '- 3 to 6 sections',
      '- 3 to 5 practice tasks',
      '- Keep concise, practical, and beginner-friendly.',
      `Unit Number: ${unitNumber}`,
      `Unit Title: ${unitTitle}`
    ].join('\n');

    const discoveredPaths = await discoverModelPaths(key);
    const fallbackPaths = [
      'v1beta/models/gemini-1.5-flash-latest:generateContent',
      'v1beta/models/gemini-1.5-flash:generateContent',
      'v1beta/models/gemini-1.5-flash-8b:generateContent',
      'v1beta/models/gemini-2.0-flash:generateContent',
      'v1beta/models/gemini-pro:generateContent',
      'v1/models/gemini-1.5-flash:generateContent',
      'v1/models/gemini-pro:generateContent'
    ];
    const modelPaths = Array.from(new Set([...discoveredPaths, ...fallbackPaths]));

    let lastErr = '';

    for (const path of modelPaths) {
      const url = `https://generativelanguage.googleapis.com/${path}?key=${encodeURIComponent(key)}`;
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1600 }
          })
        });

        const raw = await r.text();
        if (!r.ok) {
          lastErr = `(${path}) ${raw.slice(0, 240)}`;
          continue;
        }

        let data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          lastErr = `(${path}) Invalid JSON from Gemini.`;
          continue;
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const parsed = extractJson(text);
        if (!parsed) {
          lastErr = `(${path}) Gemini response could not be parsed.`;
          continue;
        }

        const content = sanitize(parsed);
        if (!content.title || !content.overview || content.sections.length === 0) {
          lastErr = `(${path}) Gemini returned incomplete content.`;
          continue;
        }

        return res.json({ content });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        lastErr = `(${path}) ${msg}`;
      }
    }

    return res.status(502).json({
      message:
        `Gemini request failed on all model paths.` +
        ` Tried ${modelPaths.length} path(s). ` +
        `Last error: ${lastErr || 'Unknown error'}`
    });
  }
);

aiContentRouter.post(
  '/ml-quiz',
  [
    body('unitId').isInt({ min: 1 }),
    body('unitNumber').optional().isInt({ min: 1 }),
    body('unitTitle').isString().isLength({ min: 1, max: 200 }).trim(),
    body('language').optional().isIn(['en', 'hi', 'es']),
    body('quizContext').isString().isLength({ min: 1, max: 8000 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) {
      return res.status(400).json({ message: 'GEMINI_API_KEY is not configured on backend.' });
    }

    const {
      unitId,
      unitTitle,
      language = 'en',
      unitNumber,
      quizContext
    } = req.body as {
      unitId: number;
      unitNumber?: number;
      unitTitle: string;
      language?: 'en' | 'hi' | 'es';
      quizContext: string;
    };

    const quiz = await get<{ id: number }>('SELECT id FROM Quizzes WHERE unit_id = ?', [unitId]);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found for this unit.' });
    }

    const countRow = await get<{ n: number }>(
      'SELECT COUNT(*) as n FROM Questions WHERE quiz_id = ?',
      [quiz.id]
    );
    const currentCount = countRow?.n ?? 0;

    // Seed has 10 questions. We append 10 more once.
    if (currentCount >= 20) {
      return res.json({
        added: 0,
        total: currentCount,
        message: 'AI quiz questions already generated.'
      });
    }

    const languageGuide =
      language === 'hi'
        ? 'Write all questions, options, and explanations in Hindi.'
        : language === 'es'
        ? 'Write all questions, options, and explanations in Spanish.'
        : 'Write all questions, options, and explanations in English.';

    const prompt = [
      'You are an expert Machine Learning tutor.',
      'Generate ONLY 10 multiple-choice questions (MCQs) for the given unit.',
      languageGuide,
      'Return ONLY a valid JSON array (no markdown, no extra text).',
      'Each array item MUST match this schema exactly:',
      '{',
      '  "question_text": string,',
      '  "a": string,',
      '  "b": string,',
      '  "c": string,',
      '  "d": string,',
      '  "correct_option": "a" | "b" | "c" | "d",',
      '  "explanation": string',
      '}',
      'Constraints:',
      '- Questions should be conceptually correct and non-trivial.',
      '- Options should be plausible distractors.',
      '- Avoid code blocks; focus on conceptual understanding.',
      `Unit Number: ${unitNumber ?? ''}`.trim(),
      `Unit Title: ${unitTitle}`,
      'Learning context:',
      quizContext
    ].join('\n');

    const discoveredPaths = await discoverModelPaths(key);
    const fallbackPaths = [
      'v1beta/models/gemini-1.5-flash-latest:generateContent',
      'v1beta/models/gemini-1.5-flash:generateContent',
      'v1beta/models/gemini-1.5-flash-8b:generateContent',
      'v1beta/models/gemini-2.0-flash:generateContent',
      'v1beta/models/gemini-pro:generateContent',
      'v1/models/gemini-1.5-flash:generateContent',
      'v1/models/gemini-pro:generateContent'
    ];
    const modelPaths = Array.from(new Set([...discoveredPaths, ...fallbackPaths]));

    let lastErr = '';
    for (const path of modelPaths) {
      const url = `https://generativelanguage.googleapis.com/${path}?key=${encodeURIComponent(key)}`;
      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2200 }
          })
        });

        const raw = await r.text();
        if (!r.ok) {
          lastErr = `(${path}) ${raw.slice(0, 240)}`;
          continue;
        }

        let data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          lastErr = `(${path}) Invalid JSON from Gemini.`;
          continue;
        }

        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const parsed = extractJsonArray(text);
        if (!parsed) {
          lastErr = `(${path}) Gemini response JSON array could not be parsed.`;
          continue;
        }

        const questions = sanitizeAiQuizQuestions(parsed);
        if (questions.length < 10) {
          lastErr = `(${path}) Gemini returned fewer than 10 valid questions.`;
          continue;
        }

        for (const q of questions) {
          await run(
            `INSERT INTO Questions
             (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [quiz.id, q.question_text, q.a, q.b, q.c, q.d, q.correct_option, q.explanation]
          );
        }

        const finalCount = currentCount + questions.length;
        return res.json({
          added: questions.length,
          total: finalCount,
          message: 'AI quiz questions added successfully.'
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        lastErr = `(${path}) ${msg}`;
      }
    }

    return res.status(502).json({
      message: `Gemini request failed on all model paths. Last error: ${lastErr || 'Unknown error'}`
    });
  }
);

