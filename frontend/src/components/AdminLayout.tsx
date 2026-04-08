import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { ThemeSelect } from './ThemeSelect';
import { LanguageSelect } from './LanguageSelect';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-black dark:text-slate-100">
      <header className="border-b border-amber-500/40 bg-white/90 backdrop-blur-md dark:border-amber-500/30 dark:bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-xs font-bold text-slate-950">
              AD
            </span>
            <div>
              <p className="text-sm font-semibold">Admin portal</p>
              <p className="text-[0.65rem] text-slate-600 dark:text-slate-400">
                Analytics & learner support
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm flex-wrap">
            <Link
              to="/admin/dashboard"
              className="text-slate-700 hover:text-amber-600 transition-colors dark:text-slate-200 dark:hover:text-amber-400"
            >
              Dashboard
            </Link>
            <LanguageSelect />
            <ThemeSelect />
            {user && (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:border-amber-500 hover:text-amber-700 dark:border-slate-600 dark:hover:border-amber-500 dark:hover:text-amber-200"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
