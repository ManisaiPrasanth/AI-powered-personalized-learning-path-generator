import type { AxiosInstance } from 'axios';
import type { Language } from '../state/LanguageContext';
import type { MlUnitContent, UnitSection } from './machineLearning';
import { mlUnits } from './machineLearning';
import { translateBatch } from '../api/translate';

function pushText(parts: string[], value?: string) {
  if (value) parts.push(value);
}

function pushList(parts: string[], list?: string[]) {
  if (!list) return;
  parts.push(...list);
}

function mapSection(section: UnitSection, next: () => string): UnitSection {
  if (section.type === 'code') {
    return { ...section, heading: next() };
  }
  if (section.type === 'diagram') {
    return { ...section, heading: next(), caption: section.caption ? next() : undefined };
  }
  if (section.type === 'callout') {
    return { ...section, heading: next(), body: next() };
  }
  return {
    ...section,
    heading: next(),
    body: next(),
    bullets: section.bullets?.map(() => next())
  };
}

const localizedUnitCache = new Map<string, MlUnitContent>();

export async function getMlUnitLocalized(
  unitNumber: number,
  language: Language,
  api: AxiosInstance
): Promise<MlUnitContent | undefined> {
  const base = mlUnits[unitNumber];
  if (!base) return undefined;
  if (language === 'en') return base;

  const cacheKey = `${language}:${unitNumber}`;
  const cached = localizedUnitCache.get(cacheKey);
  if (cached) return cached;

  const parts: string[] = [];
  pushText(parts, base.title);
  pushText(parts, base.overview);
  pushList(parts, base.keyTakeaways);
  pushList(parts, base.practice);
  pushList(
    parts,
    [...base.resources.youtube, ...base.resources.datasets, ...base.resources.docs].map((r) => r.label)
  );
  for (const s of base.sections) {
    pushText(parts, s.heading);
    if (s.type === 'text') {
      pushText(parts, s.body);
      pushList(parts, s.bullets);
    } else if (s.type === 'callout') {
      pushText(parts, s.body);
    } else if (s.type === 'diagram') {
      pushText(parts, s.caption);
    }
  }

  const translated = await translateBatch(api, language, parts);
  let i = 0;
  const next = () => translated[i++] ?? '';

  const localized: MlUnitContent = {
    ...base,
    title: next(),
    overview: next(),
    keyTakeaways: base.keyTakeaways.map(() => next()),
    practice: base.practice.map(() => next()),
    resources: {
      youtube: base.resources.youtube.map((r) => ({ ...r, label: next() })),
      datasets: base.resources.datasets.map((r) => ({ ...r, label: next() })),
      docs: base.resources.docs.map((r) => ({ ...r, label: next() }))
    },
    sections: base.sections.map((s) => mapSection(s, next))
  };

  localizedUnitCache.set(cacheKey, localized);
  return localized;
}

