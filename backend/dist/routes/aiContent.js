"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiContentRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
exports.aiContentRouter = (0, express_1.Router)();
function extractJson(raw) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start)
        return null;
    const json = raw.slice(start, end + 1);
    try {
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
function sanitize(content) {
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
exports.aiContentRouter.post('/ml-unit', [
    (0, express_validator_1.body)('unitNumber').isInt({ min: 1, max: 14 }),
    (0, express_validator_1.body)('unitTitle').isString().isLength({ min: 1, max: 200 }).trim(),
    (0, express_validator_1.body)('language').optional().isIn(['en', 'hi', 'es'])
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const key = process.env.GEMINI_API_KEY?.trim();
    if (!key) {
        return res.status(400).json({ message: 'GEMINI_API_KEY is not configured on backend.' });
    }
    const { unitNumber, unitTitle, language = 'en' } = req.body;
    const languageGuide = language === 'hi'
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
    const modelPaths = [
        'v1beta/models/gemini-1.5-flash-latest:generateContent',
        'v1beta/models/gemini-1.5-flash:generateContent',
        'v1beta/models/gemini-1.5-flash-8b:generateContent',
        'v1beta/models/gemini-2.0-flash:generateContent',
        'v1beta/models/gemini-pro:generateContent',
        'v1/models/gemini-1.5-flash:generateContent',
        'v1/models/gemini-pro:generateContent'
    ];
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
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch {
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
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            lastErr = `(${path}) ${msg}`;
        }
    }
    return res.status(502).json({
        message: `Gemini request failed on all model paths. Last error: ${lastErr || 'Unknown error'}`
    });
});
