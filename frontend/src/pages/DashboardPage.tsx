import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useApi } from '../api/client';

interface CourseSummary {
  id: number;
  slug: string;
  title: string;
  total_units: number;
  completionPercent: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();
  const [courses, setCourses] = useState<CourseSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<CourseSummary[]>('/courses');
        setCourses(res.data);
      } catch {
        // silent fail; dashboard is non-critical
      }
    };
    load();
  }, [api]);

  // Record daily activity for admin analytics (students only; backend ignores others)
  useEffect(() => {
    if (user?.role !== 'student') return;
    void api.post('/activity/ping').catch(() => undefined);
  }, [api, user?.role]);

  const mlCourse = courses.find((c) => c.slug === 'machine-learning');
  const completedUnits =
    mlCourse && mlCourse.total_units
      ? Math.round((mlCourse.completionPercent / 100) * mlCourse.total_units)
      : 0;
  const lockedUnits = mlCourse ? mlCourse.total_units - completedUnits : 0;

  return (
    <div className="space-y-6">
      <section className="card-elevated p-6 fade-in-up">
        <p className="pill-muted mb-3 inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
          Adaptive AI learning
        </p>
        <h1 className="text-2xl md:text-3xl font-semibold mb-2 text-slate-900 dark:text-slate-50">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-slate-700 mb-4 max-w-xl dark:text-slate-300">
          &quot;The best way to learn Machine Learning is to ship small models, often.&quot;
          This platform guides you unit by unit, with adaptive quizzes and detailed explanations.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/courses/machine-learning" className="btn-primary">
            Resume Machine Learning course
          </Link>
          <Link to="/courses" className="btn-outline">
            Browse all courses
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
          <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">Completed units</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {completedUnits}
            <span className="text-xs text-slate-600 ml-1 dark:text-slate-400">
              / {mlCourse?.total_units ?? 6}
            </span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
          <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">Overall progress</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {mlCourse?.completionPercent ?? 0}
            <span className="text-xs text-slate-600 ml-1 dark:text-slate-400">%</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
          <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">Locked units</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{lockedUnits}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/90 bg-white/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/70">
          <p className="text-xs text-slate-600 mb-1 dark:text-slate-400">Current track</p>
          <p className="text-sm font-semibold text-slate-900 mb-1 dark:text-slate-100">
            Machine Learning Fundamentals
          </p>
          <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">
            Master ML step-by-step with math, intuition, and hands-on quizzes.
          </p>
        </div>
      </section>
    </div>
  );
};
