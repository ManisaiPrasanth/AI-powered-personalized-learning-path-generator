import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../api/client';
import { ProgressBar } from '../components/ProgressBar';
import { CourseChatPanel } from '../components/CourseChatPanel';
import { useLanguage } from '../state/LanguageContext';
import { translateBatch } from '../api/translate';

interface UnitWithProgress {
  id: number;
  unitNumber: number;
  title: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  lastScore: number | null;
  hasDetailedVersion: boolean;
}

interface CourseResponse {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    total_units: number;
  };
  units: UnitWithProgress[];
}

export const CourseDetailPage: React.FC = () => {
  const api = useApi();
  const { language } = useLanguage();
  const { slug } = useParams();
  const [data, setData] = useState<CourseResponse | null>(null);
  const [viewData, setViewData] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const tx =
    language === 'hi'
      ? {
          loading: 'कोर्स लोड हो रहा है...',
          notFound: 'कोर्स नहीं मिला।',
          back: '← कोर्स सूची पर वापस',
          unitsOverview: 'मॉड्यूल अवलोकन',
          units: 'यूनिट्स',
          complete: 'पूर्ण',
          guide: 'हर यूनिट पूरी करें और अगली unlock करने के लिए क्विज़ पास करें।',
          completed: 'पूरा • अंतिम स्कोर',
          unlocked: 'अनलॉक • आप सीखना शुरू कर सकते हैं और क्विज़ दे सकते हैं।',
          locked: 'लॉक • unlock करने के लिए पिछली यूनिट पूरी करें।',
          openUnit: 'यूनिट खोलें',
          detailed: 'विस्तृत संस्करण',
          progress: 'पूर्ण'
        }
      : language === 'es'
      ? {
          loading: 'Cargando curso...',
          notFound: 'Curso no encontrado.',
          back: '← Volver a cursos',
          unitsOverview: 'Resumen de modulos',
          units: 'unidades',
          complete: 'completado',
          guide: 'Completa cada unidad y aprueba su quiz para desbloquear la siguiente.',
          completed: 'Completada • Última puntuación',
          unlocked: 'Desbloqueada • Puedes empezar a estudiar e intentar el quiz.',
          locked: 'Bloqueada • Completa las unidades anteriores para desbloquear.',
          openUnit: 'Abrir unidad',
          detailed: 'Versión detallada',
          progress: 'completado'
        }
      : {
          loading: 'Loading course...',
          notFound: 'Course not found.',
          back: '← Back to courses',
          unitsOverview: 'Module overview',
          units: 'units',
          complete: 'complete',
          guide: 'Complete each unit and pass its quiz to unlock the next one.',
          completed: 'Completed • Last score',
          unlocked: 'Unlocked • You can start learning and attempt the quiz.',
          locked: 'Locked • Complete previous units to unlock.',
          openUnit: 'Open unit',
          detailed: 'Detailed version',
          progress: 'complete'
        };

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await api.get<CourseResponse>(`/courses/${slug}`);
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api, slug]);

  useEffect(() => {
    let alive = true;
    if (!data) {
      setViewData(null);
      return;
    }
    if (language === 'en') {
      setViewData(data);
      return;
    }
    const parts = [
      data.course.title,
      data.course.description ?? '',
      ...data.units.map((u) => u.title)
    ];
    void translateBatch(api, language, parts).then((out) => {
      if (!alive) return;
      let i = 0;
      setViewData({
        ...data,
        course: { ...data.course, title: out[i++] ?? data.course.title, description: out[i++] ?? '' },
        units: data.units.map((u) => ({ ...u, title: out[i++] ?? u.title }))
      });
    });
    return () => {
      alive = false;
    };
  }, [api, data, language]);

  if (loading) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">{tx.loading}</p>;
  }

  if (!viewData) {
    return <p className="text-sm text-red-400">{tx.notFound}</p>;
  }

  const completedCount = viewData.units.filter((u) => u.isCompleted).length;
  const completionPercent =
    viewData.course.total_units > 0
      ? Math.round((completedCount / viewData.course.total_units) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">
        <Link to="/courses" className="hover:text-secondary">
          {tx.back}
        </Link>
      </p>
      <div className="grid gap-6 lg:grid-cols-[260px,1fr] items-start">
        <aside className="rounded-2xl border border-slate-200/90 bg-white/85 p-4 dark:border-slate-800/80 dark:bg-slate-950/70 lg:sticky lg:top-4 lg:self-start">
          <h2 className="text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide dark:text-slate-300">
            {tx.unitsOverview}
          </h2>
          <div className="space-y-2">
            {viewData.units.map((u) => (
              <Link
                key={u.id}
                to={u.isUnlocked ? `/courses/${viewData.course.slug}/units/${u.unitNumber}` : '#'}
                onClick={(e) => {
                  if (!u.isUnlocked) e.preventDefault();
                }}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                  u.isUnlocked
                    ? 'cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800/80'
                    : 'cursor-not-allowed bg-slate-50 opacity-70 dark:bg-slate-900/40'
                }`}
              >
                <div>
                  <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">Module {u.unitNumber}</p>
                  <p className="text-[0.75rem] truncate text-slate-900 dark:text-slate-100">{u.title}</p>
                </div>
                <div className="flex items-center gap-1">
                  {u.isCompleted && (
                    <span className="text-emerald-400 text-lg" aria-label="Completed">
                      ✓
                    </span>
                  )}
                  {!u.isCompleted && !u.isUnlocked && (
                    <span className="text-slate-500 text-lg" aria-label="Locked">
                      🔒
                    </span>
                  )}
                  {!u.isCompleted && u.isUnlocked && (
                    <span className="text-secondary text-lg" aria-label="In progress">
                      ●
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          <div className="card-elevated p-5">
            <h1 className="text-2xl font-semibold mb-1 text-slate-900 dark:text-slate-50">
              {viewData.course.title}
            </h1>
            <p className="text-sm text-slate-700 mb-4 dark:text-slate-300">{viewData.course.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mb-2 dark:text-slate-400">
              <span>{viewData.course.total_units} {tx.units}</span>
              <span>{completionPercent}% {tx.progress}</span>
            </div>
            <div className="space-y-1">
              <ProgressBar value={completionPercent} />
              <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">
                {tx.guide}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {viewData.units.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/85 p-4 dark:border-slate-800/80 dark:bg-slate-950/70 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">Module {u.unitNumber}</p>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 dark:text-slate-50">{u.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {u.isCompleted
                      ? `${tx.completed}: ${u.lastScore ?? '-'}`
                      : u.isUnlocked
                      ? tx.unlocked
                      : tx.locked}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <Link
                    to={`/courses/${viewData.course.slug}/units/${u.unitNumber}`}
                    className={`btn-primary ${
                      !u.isUnlocked ? 'pointer-events-none opacity-40' : ''
                    }`}
                    aria-disabled={!u.isUnlocked}
                    onClick={(e) => {
                      if (!u.isUnlocked) e.preventDefault();
                    }}
                  >
                    {tx.openUnit}
                  </Link>
                  {u.hasDetailedVersion &&
                    !u.isCompleted &&
                    u.lastScore !== null &&
                    u.lastScore < 70 && (
                      <Link
                        to={`/courses/${viewData.course.slug}/units/${u.unitNumber}/detailed`}
                        className="btn-outline border-amber-500/70 text-amber-800 dark:border-amber-400/70 dark:text-amber-300"
                      >
                        {tx.detailed}
                      </Link>
                    )}
                </div>
              </div>
            ))}
          </div>

          <CourseChatPanel courseSlug={viewData.course.slug} courseTitle={viewData.course.title} />
        </section>
      </div>
    </div>
  );
};
