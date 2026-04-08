import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getMlUnitLocalized } from '../content/mlI18n';
import { ResourcesPanel } from '../components/ResourcesPanel';
import { WikiSummaryCard } from '../components/WikiSummaryCard';
import { useLanguage } from '../state/LanguageContext';
import { useApi } from '../api/client';
import type { MlUnitContent } from '../content/machineLearning';
import { translateBatch } from '../api/translate';

const deepDive: Record<number, { title: string; notes: string[]; steps: string[]; cases: string[] }> = {
  1: {
    title: 'Deep dive: framing ML problems',
    notes: [
      'Define your objective: what outcome do you want and how will you measure it?',
      'Define data: what fields do you have today, what do you need, and what’s “label noise”?',
      'Define constraints: latency, explainability, cost, privacy.'
    ],
    steps: [
      'Write the problem in one sentence (input → output).',
      'Choose the learning type (supervised/unsupervised/RL).',
      'Pick a baseline metric (accuracy, MAE, etc.).',
      'Start with a simple baseline model before anything complex.'
    ],
    cases: [
      'Spam filtering: trade precision vs recall depending on business cost.',
      'Recommendations: offline metrics + online A/B tests matter.'
    ]
  },
  2: {
    title: 'Deep dive: gradients with a tiny numeric example',
    notes: [
      'Gradients tell you how to change parameters to reduce loss.',
      'Learning rate is the “knob” controlling step size.'
    ],
    steps: [
      'Pick a simple loss (e.g., squared error).',
      'Compute derivative by hand for 1–2 steps.',
      'Update parameters and observe loss decrease.'
    ],
    cases: ['Fitting a line \(y = wx + b\) on 3 points; watch \(w,b\) move toward better fit.']
  },
  3: {
    title: 'Deep dive: metrics and thresholds',
    notes: [
      'A probability model becomes a decision rule only after choosing a threshold.',
      'Imbalanced data needs precision/recall and often ROC/PR curves.'
    ],
    steps: [
      'Compute confusion matrix.',
      'Compute precision/recall/F1.',
      'Try multiple thresholds and see trade-offs.'
    ],
    cases: ['Credit risk: false negatives vs false positives have different costs.']
  },
  4: {
    title: 'Deep dive: K-Means step-by-step',
    notes: [
      'Initialization can change results; use multiple restarts.',
      'Scaling features is critical for distance-based methods.'
    ],
    steps: [
      'Standardize features.',
      'Pick k (try elbow).',
      'Run K-Means with multiple initializations.',
      'Inspect clusters and validate interpretability.'
    ],
    cases: ['Customer segmentation for targeted marketing campaigns.']
  },
  5: {
    title: 'Deep dive: generalization toolkit',
    notes: [
      'Use cross-validation for reliable estimates.',
      'Regularization reduces overfitting; more data often helps the most.'
    ],
    steps: [
      'Plot learning curves.',
      'Try simpler model / add regularization.',
      'Tune hyperparameters on CV, not the test set.'
    ],
    cases: ['Polynomial regression: higher degree can fit noise and overfit quickly.']
  },
  6: {
    title: 'Deep dive: training neural networks',
    notes: [
      'Backprop computes gradients efficiently via the chain rule.',
      'Modern optimizers (Adam) and good activations (ReLU) help a lot.'
    ],
    steps: [
      'Start with a small network.',
      'Normalize inputs.',
      'Train, monitor loss curves, add dropout if overfitting.'
    ],
    cases: ['Digit classification: pixels → features → class probabilities.']
  }
};

export const UnitDetailedPage: React.FC = () => {
  const api = useApi();
  const { slug, unitNumber } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const idx = Number(unitNumber);
  const [base, setBase] = useState<MlUnitContent | undefined>();
  const [extra, setExtra] = useState<(typeof deepDive)[number] | undefined>();
  const [loading, setLoading] = useState(true);

  const tx =
    language === 'hi'
      ? {
          back: '← कोर्स पर वापस जाएं',
          title: `Unit ${unitNumber} – विस्तृत संस्करण`,
          subtitle:
            'आप विस्तृत संस्करण में हैं क्योंकि आपका पिछला क्विज़ स्कोर 70% से कम था। इस सामग्री को पढ़ें और फिर क्विज़ दोबारा दें।',
          moreExplanation: 'अधिक व्याख्या',
          keyTakeaways: 'मुख्य बिंदु (दोहराव)',
          extraNotes: 'अतिरिक्त नोट्स',
          stepByStep: 'स्टेप-बाय-स्टेप',
          cases: 'केस स्टडी',
          commonMistakes: 'खोलें: बचने योग्य सामान्य गलतियाँ',
          mistakes: [
            'tuning के लिए test set का उपयोग (data leakage)।',
            'class imbalance को नज़रअंदाज़ करके केवल accuracy पर भरोसा करना।',
            'distance-based methods में feature scaling छोड़ देना।',
            'baseline बनाए बिना model को जरूरत से ज्यादा जटिल बनाना।'
          ],
          noDeepDive:
            'इस यूनिट के लिए विस्तृत सामग्री जल्द जोड़ी जाएगी। अभी के लिए नीचे दिए गए संसाधनों का उपयोग करें और क्विज़ दोबारा दें।',
          strategy: 'पुनः प्रयास रणनीति',
          strategyBody:
            'विस्तृत सामग्री पढ़ने के बाद क्विज़ दोबारा दें। सिर्फ उत्तर याद करने के बजाय समझें कि कौन-सा विकल्प सही/गलत क्यों है।',
          retry: 'क्विज़ दोबारा दें',
          loading: 'सामग्री का अनुवाद हो रहा है...',
          notFound: 'विस्तृत सामग्री नहीं मिली।'
        }
      : language === 'es'
      ? {
          back: '← Volver al curso',
          title: `Unidad ${unitNumber} – Versión detallada`,
          subtitle:
            'Estás en la versión detallada porque tu último puntaje fue menor a 70%. Revisa esta explicación extendida y vuelve a intentar el quiz.',
          moreExplanation: 'Más explicación',
          keyTakeaways: 'Puntos clave (repetición)',
          extraNotes: 'Notas extra',
          stepByStep: 'Paso a paso',
          cases: 'Casos de estudio',
          commonMistakes: 'Expandir: errores comunes a evitar',
          mistakes: [
            'Usar el conjunto de prueba para ajustar el modelo (fuga de datos).',
            'Ignorar el desbalance de clases y confiar solo en accuracy.',
            'Omitir el escalado de variables en métodos basados en distancia.',
            'Complicar el modelo antes de construir una línea base.'
          ],
          noDeepDive:
            'El contenido detallado para esta unidad se ampliará pronto. Por ahora, usa los recursos y vuelve a intentar el quiz.',
          strategy: 'Estrategia de reintento',
          strategyBody:
            'Después de leer la explicación, vuelve a intentar el quiz. Enfócate en por qué cada opción es correcta o incorrecta.',
          retry: 'Reintentar quiz',
          loading: 'Traduciendo contenido...',
          notFound: 'Contenido detallado no encontrado.'
        }
      : {
          back: '← Back to course',
          title: `Module ${unitNumber} – Detailed Version`,
          subtitle:
            'You are in the detailed version because your last quiz score was below 70%. Review this extended explanation, then reattempt the quiz.',
          moreExplanation: 'More explanation',
          keyTakeaways: 'Key takeaways (repeat)',
          extraNotes: 'Extra notes',
          stepByStep: 'Step-by-step',
          cases: 'Case studies',
          commonMistakes: 'Expand: common mistakes to avoid',
          mistakes: [
            'Using the test set for tuning (leakage).',
            'Ignoring class imbalance and relying only on accuracy.',
            'Skipping feature scaling for distance-based methods.',
            'Overcomplicating models before building a baseline.'
          ],
          noDeepDive:
            'Detailed deep-dive content for this unit will be expanded next. For now, use the resources below and reattempt the quiz.',
          strategy: 'Reattempt strategy',
          strategyBody:
            'After reading the deep-dive, reattempt the quiz. Focus on "why" each option is right or wrong—not just memorizing answers.',
          retry: 'Reattempt quiz',
          loading: 'Translating content...',
          notFound: 'Detailed content not found.'
        };

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const localizeExtra = async () => {
      const src = deepDive[idx];
      if (!src || language === 'en') return src;
      const parts = [src.title, ...src.notes, ...src.steps, ...src.cases];
      const out = await translateBatch(api, language, parts);
      let p = 0;
      return {
        title: out[p++] ?? src.title,
        notes: src.notes.map(() => out[p++] ?? ''),
        steps: src.steps.map(() => out[p++] ?? ''),
        cases: src.cases.map(() => out[p++] ?? '')
      };
    };

    void Promise.all([getMlUnitLocalized(idx, language, api), localizeExtra()])
      .then(([unit, localizedExtra]) => {
        if (!alive) return;
        setBase(unit);
        setExtra(localizedExtra);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [api, idx, language]);

  if (!slug || !unitNumber || !base) {
    if (loading) return <p className="text-sm text-slate-600 dark:text-slate-400">{tx.loading}</p>;
    return <p className="text-sm text-red-600 dark:text-red-400">{tx.notFound}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-xs text-slate-600 dark:text-slate-400">
          <Link to={`/courses/${slug}`} className="hover:text-sky-600 dark:hover:text-sky-400">
            {tx.back}
          </Link>
        </p>
        <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
          {tx.title}
        </h1>
        <p className="text-xs text-amber-800 dark:text-amber-300">{tx.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px] items-start">
        <div className="space-y-4">
          <section className="card-elevated p-4 md:p-5 space-y-3">
            <p className="pill-muted inline-block">{tx.moreExplanation}</p>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {base.title} (extended)
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{base.overview}</p>
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
              <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {tx.keyTakeaways}
              </p>
              <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
                {base.keyTakeaways.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </section>

          {extra ? (
            <section className="card-elevated p-4 md:p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{extra.title}</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
                  <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {tx.extraNotes}
                  </p>
                  <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
                    {extra.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
                  <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {tx.stepByStep}
                  </p>
                  <ol className="space-y-1 list-decimal pl-5 text-xs text-slate-700 dark:text-slate-300">
                    {extra.steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
                <p className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {tx.cases}
                </p>
                <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
                  {extra.cases.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>

              <details className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
                <summary className="cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {tx.commonMistakes}
                </summary>
                <ul className="mt-3 space-y-1 list-disc pl-5 text-xs text-slate-700 dark:text-slate-300">
                  {tx.mistakes.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </details>
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
              <p className="text-xs text-slate-700 dark:text-slate-300">{tx.noDeepDive}</p>
            </section>
          )}

          <ResourcesPanel
            youtube={base.resources.youtube}
            datasets={base.resources.datasets}
            docs={base.resources.docs}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <WikiSummaryCard topic={base.wikiTopic} />
          <section className="space-y-2 rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800/80 dark:bg-slate-950/40">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{tx.strategy}</p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{tx.strategyBody}</p>
          </section>
        </aside>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={() =>
            navigate(`/courses/${slug}/units/${unitNumber}/quiz`, { replace: false })
          }
          className="btn-primary"
        >
          {tx.retry}
        </button>
      </div>
    </div>
  );
};
