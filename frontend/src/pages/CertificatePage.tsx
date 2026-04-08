import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../api/client';

interface CourseSummary {
  course: {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    total_units: number;
  };
  units: {
    isCompleted: boolean;
  }[];
}

export const CertificatePage: React.FC = () => {
  const api = useApi();
  const [data, setData] = useState<CourseSummary | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<CourseSummary>('/courses/machine-learning');
        setData(res.data);
      } catch {
        setData(null);
      }
    };
    load();
  }, [api]);

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          <Link to="/dashboard" className="hover:text-secondary">
            ← Back to dashboard
          </Link>
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">Loading certificate information...</p>
      </div>
    );
  }

  const completedUnits = data.units.filter((u) => u.isCompleted).length;
  const allCompleted = completedUnits === data.course.total_units && completedUnits > 0;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 dark:text-slate-400">
        <Link to="/dashboard" className="hover:text-secondary">
          ← Back to dashboard
        </Link>
      </p>
      <div className="card-elevated mx-auto max-w-2xl p-6">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Completion certificate
        </h1>
        {allCompleted ? (
          <>
            <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
              Congratulations, you have completed all units in the Machine Learning track. Here
              is your course completion certificate preview.
            </p>
            <div className="mb-4 rounded-2xl border border-slate-400/50 bg-slate-100 p-4 dark:border-slate-500/60 dark:bg-slate-900/80">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  AI Learning Platform Certificate
                </h2>
                <span className="badge-soft border border-secondary/60 bg-secondary/10 text-secondary">
                  Machine Learning
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">
                This certifies that you have successfully completed the Machine Learning course,
                demonstrating proficiency across all units and assessments.
              </p>
              <div className="mt-4 flex items-end justify-between text-[0.7rem] text-slate-600 dark:text-slate-400">
                <span>Instructor: AI Learning Platform</span>
                <span>Issued on: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary"
            >
              Download / Print certificate
            </button>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
              Complete all Machine Learning units to unlock your course certificate.
            </p>
            <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
              Progress: {completedUnits} / {data.course.total_units} units completed.
            </p>
            <Link to="/courses/machine-learning" className="btn-primary">
              Continue Machine Learning course
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

