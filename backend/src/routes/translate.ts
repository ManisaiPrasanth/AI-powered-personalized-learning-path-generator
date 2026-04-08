import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

export const translateRouter = Router();

type TranslateResponse = unknown[][];

async function translateOne(text: string, target: 'hi' | 'es'): Promise<string> {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${target}` +
    `&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) return text;

  let data: TranslateResponse;
  try {
    data = (await res.json()) as TranslateResponse;
  } catch {
    return text;
  }

  const parts = Array.isArray(data?.[0]) ? data[0] : [];
  const translated = parts
    .map((p) => (Array.isArray(p) && typeof p[0] === 'string' ? p[0] : ''))
    .join('')
    .trim();
  return translated || text;
}

translateRouter.post(
  '/',
  [
    body('target').isIn(['hi', 'es']),
    body('texts').isArray({ min: 1, max: 200 }),
    body('texts.*').isString().isLength({ min: 0, max: 4000 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { target, texts } = req.body as { target: 'hi' | 'es'; texts: string[] };
    const out = await Promise.all(
      texts.map(async (t) => {
        if (!t.trim()) return t;
        try {
          return await translateOne(t, target);
        } catch {
          return t;
        }
      })
    );
    return res.json({ translations: out });
  }
);

