import React from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from './ProgressBar';

interface Props {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  totalUnits: number;
  completionPercent: number;
  isImplemented: boolean;
}

export const CourseCard: React.FC<Props> = ({
  title,
  slug,
  description,
  totalUnits,
  completionPercent,
  isImplemented
}) => {
  const difficulty = isImplemented ? 'Intermediate' : 'Coming soon';

  return (
    <div
      className={`card-elevated p-4 md:p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-soft-xl ${
        isImplemented ? 'ring-1 ring-primary/40' : 'opacity-80'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg ${
              isImplemented
                ? 'bg-primary/20 text-primary'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {title[0]}
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
            <p className="text-[0.7rem] text-slate-600 mt-0.5 dark:text-slate-400">{difficulty}</p>
          </div>
        </div>
        {isImplemented ? (
          <span className="badge-soft border border-emerald-400/60 bg-emerald-500/10 text-emerald-300">
            Live track
          </span>
        ) : (
          <span className="badge-soft border border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-xs text-slate-700 mb-3 dark:text-slate-300">
        {isImplemented
          ? description
          : 'Course content coming soon. You will be notified when this track is released.'}
      </p>
      {isImplemented && (
        <>
          <div className="flex items-center justify-between mb-2 text-[0.7rem] text-slate-600 dark:text-slate-400">
            <span>{totalUnits} units</span>
            <span>{completionPercent}% complete</span>
          </div>
          <ProgressBar value={completionPercent} />
        </>
      )}
      <div className="mt-4 flex justify-end">
        {isImplemented ? (
          <Link to={`/courses/${slug}`} className="btn-primary">
            Go to course
          </Link>
        ) : (
          <button disabled className="btn-outline cursor-not-allowed opacity-60">
            Course content coming soon
          </button>
        )}
      </div>
    </div>
  );
};
