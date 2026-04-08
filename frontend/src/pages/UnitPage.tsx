import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getMlUnitLocalized } from '../content/mlI18n';
import { ResourcesPanel } from '../components/ResourcesPanel';
import { WikiSummaryCard } from '../components/WikiSummaryCard';
import { useLanguage } from '../state/LanguageContext';
import { useApi } from '../api/client';
import type { MlUnitContent } from '../content/machineLearning';

type AiSection = { heading: string; body: string; bullets?: string[] };
type AiUnitContent = {
  title: string;
  overview: string;
  keyTakeaways: string[];
  sections: AiSection[];
  practice: string[];
};

const UI_TEXT = {
  en: {
    back: '← Back to course',
    intro: 'Read through this unit, then attempt the quiz to unlock the next unit.',
    overview: 'Overview',
    takeaways: 'Key takeaways',
    practice: 'Practice tasks',
    more: 'Want even more?',
    moreBody:
      'Best practice: don’t put paid API keys in the browser. If you want an AI “explain more” button powered by OpenAI/Groq/etc, we’ll add a secure backend proxy endpoint that reads the key from server env variables.',
    takeQuiz: 'Take quiz for this unit',
    loading: 'Translating content...',
    notFound: 'Unit content not found.',
    aiOn: 'Use AI-based content',
    aiOff: 'Use normal content',
    aiBusy: 'Generating AI content...',
    aiBadge: 'AI content (Gemini)',
    aiError: 'Could not generate AI content right now.'
  },
  hi: {
    back: '← कोर्स पर वापस जाएं',
    intro: 'इस यूनिट को पढ़ें, फिर अगली यूनिट unlock करने के लिए क्विज़ दें।',
    overview: 'सारांश',
    takeaways: 'मुख्य बिंदु',
    practice: 'अभ्यास कार्य',
    more: 'और भी सीखना चाहते हैं?',
    moreBody:
      'बेहतर सुरक्षा के लिए paid API keys browser में नहीं रखनी चाहिए। अगर आप AI “और समझाएं” बटन चाहते हैं, तो हम backend proxy endpoint जोड़ेंगे जो server env variables से key पढ़ेगा।',
    takeQuiz: 'इस यूनिट का क्विज़ दें',
    loading: 'सामग्री का अनुवाद हो रहा है...',
    notFound: 'यूनिट सामग्री नहीं मिली।',
    aiOn: 'AI आधारित सामग्री उपयोग करें',
    aiOff: 'सामान्य सामग्री उपयोग करें',
    aiBusy: 'AI सामग्री बन रही है...',
    aiBadge: 'AI सामग्री (Gemini)',
    aiError: 'अभी AI सामग्री नहीं बन सकी।'
  },
  es: {
    back: '← Volver al curso',
    intro: 'Lee esta unidad y luego realiza el quiz para desbloquear la siguiente.',
    overview: 'Resumen',
    takeaways: 'Puntos clave',
    practice: 'Tareas de práctica',
    more: '¿Quieres aprender más?',
    moreBody:
      'Buena práctica: no pongas claves de API pagadas en el navegador. Si quieres un botón de IA para “explicar más”, agregaremos un endpoint proxy seguro en backend que lea la clave desde variables del servidor.',
    takeQuiz: 'Tomar quiz de esta unidad',
    loading: 'Traduciendo contenido...',
    notFound: 'Contenido de la unidad no encontrado.',
    aiOn: 'Usar contenido con IA',
    aiOff: 'Usar contenido normal',
    aiBusy: 'Generando contenido con IA...',
    aiBadge: 'Contenido IA (Gemini)',
    aiError: 'No se pudo generar contenido IA ahora.'
  }
} as const;

export const UnitPage: React.FC = () => {
  const api = useApi();
  const { slug, unitNumber } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [content, setContent] = useState<MlUnitContent | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [useAi, setUseAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<AiUnitContent | null>(null);
  const unitIndex = Number(unitNumber);
  const tx = UI_TEXT[language];

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void getMlUnitLocalized(unitIndex, language, api)
      .then((unit) => {
        if (alive) setContent(unit);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [api, language, unitIndex]);

  useEffect(() => {
    setUseAi(false);
    setAiError(null);
    setAiContent(null);
  }, [unitIndex, language]);

  const generateAiContent = async () => {
    if (!content) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.post<{ content: AiUnitContent }>('/ai-content/ml-unit', {
        unitNumber: unitIndex,
        unitTitle: content.title,
        language
      });
      setAiContent(res.data.content);
      setUseAi(true);
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setAiError(payload?.message ?? tx.aiError);
    } finally {
      setAiLoading(false);
    }
  };

  if (!slug || !unitNumber || !content) {
    if (loading) {
      return <p className="text-sm text-slate-600 dark:text-slate-400">{tx.loading}</p>;
    }
    return <p className="text-sm text-red-600 dark:text-red-400">{tx.notFound}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">
          <Link to={`/courses/${slug}`} className="hover:text-sky-600 dark:hover:text-sky-400">
            {tx.back}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold mb-1 text-slate-900 dark:text-slate-50">
          Module {unitNumber}: {useAi && aiContent ? aiContent.title : content.title}
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400">{tx.intro}</p>
        {slug === 'machine-learning' && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (useAi) {
                  setUseAi(false);
                } else if (aiContent) {
                  setUseAi(true);
                } else {
                  void generateAiContent();
                }
              }}
              disabled={aiLoading}
              className="btn-outline disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {aiLoading ? tx.aiBusy : useAi ? tx.aiOff : tx.aiOn}
            </button>
            {useAi && aiContent && (
              <span className="text-[0.7rem] rounded-full border border-primary/50 bg-primary/10 px-2 py-1 text-primary">
                {tx.aiBadge}
              </span>
            )}
            {!useAi && aiContent && (
              <button type="button" onClick={() => setUseAi(true)} className="text-xs text-primary hover:underline">
                {tx.aiOn}
              </button>
            )}
          </div>
        )}
        {aiError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{aiError}</p>}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr,360px] items-start">
        <div className="space-y-4">
          <section className="card-elevated p-4 md:p-5 space-y-3">
            <p className="pill-muted inline-block">{tx.overview}</p>
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              {useAi && aiContent ? aiContent.overview : content.overview}
            </p>
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
              <p className="text-xs font-semibold text-slate-800 mb-2 dark:text-slate-200">
                {tx.takeaways}
              </p>
              <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
                {(useAi && aiContent ? aiContent.keyTakeaways : content.keyTakeaways).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </section>

          {(useAi && aiContent
            ? aiContent.sections.map((s): MlUnitContent['sections'][number] => ({
                type: 'text',
                heading: s.heading,
                body: s.body,
                bullets: s.bullets
              }))
            : content.sections
          ).map((s, idx) => {
            if (s.type === 'code') {
              return (
                <section key={idx} className="card-elevated space-y-2 p-4 md:p-5">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {s.heading}
                  </h2>
                  <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-100">
                    {s.code}
                  </pre>
                </section>
              );
            }

            if (s.type === 'diagram') {
              return (
                <section key={idx} className="card-elevated space-y-2 p-4 md:p-5">
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {s.heading}
                  </h2>
                  <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200">
                    {s.diagram}
                  </pre>
                  {s.caption && (
                    <p className="text-[0.75rem] text-slate-600 dark:text-slate-400">{s.caption}</p>
                  )}
                </section>
              );
            }

            if (s.type === 'callout') {
              const tone =
                s.tone === 'tip'
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : s.tone === 'warn'
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-sky-500/40 bg-sky-500/10';
              return (
                <section key={idx} className={`rounded-2xl border p-4 md:p-5 space-y-2 ${tone}`}>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {s.heading}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {s.body}
                  </p>
                </section>
              );
            }

            return (
              <section key={idx} className="card-elevated space-y-2 p-4 md:p-5">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {s.heading}
                </h2>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {s.body}
                </p>
                {s.bullets && (
                  <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}

          <section className="card-elevated space-y-3 p-4 md:p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {tx.practice}
            </h2>
            <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
              {(useAi && aiContent ? aiContent.practice : content.practice).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>

          <ResourcesPanel
            youtube={content.resources.youtube}
            datasets={content.resources.datasets}
            docs={content.resources.docs}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <WikiSummaryCard topic={content.wikiTopic} />
          <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 space-y-2 dark:border-slate-800/80 dark:bg-slate-950/40">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{tx.more}</p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{tx.moreBody}</p>
          </section>
        </aside>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() =>
            navigate(`/courses/${slug}/units/${unitNumber}/quiz`, { replace: false })
          }
          className="btn-primary"
        >
          {tx.takeQuiz}
        </button>
      </div>
    </div>
  );
};
