import type { AxiosInstance } from 'axios';
import type { Language } from '../state/LanguageContext';

const cache = new Map<string, string>();

function keyOf(language: Exclude<Language, 'en'>, text: string) {
  return `${language}::${text}`;
}

export async function translateBatch(
  api: AxiosInstance,
  language: Language,
  texts: string[]
): Promise<string[]> {
  if (language === 'en') return texts;

  const missing: string[] = [];
  const seen = new Set<string>();

  for (const t of texts) {
    if (!t.trim()) continue;
    const key = keyOf(language, t);
    if (!cache.has(key) && !seen.has(t)) {
      seen.add(t);
      missing.push(t);
    }
  }

  if (missing.length > 0) {
    const res = await api.post<{ translations: string[] }>('/translate', {
      target: language,
      texts: missing
    });
    missing.forEach((src, i) => {
      const translated = res.data.translations?.[i] ?? src;
      cache.set(keyOf(language, src), translated);
    });
  }

  return texts.map((t) => {
    if (!t.trim()) return t;
    return cache.get(keyOf(language, t)) ?? t;
  });
}

