import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { ThemeSelect } from './ThemeSelect';
import { LanguageSelect } from './LanguageSelect';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-white to-slate-200 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-black dark:text-slate-100">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-xs font-bold text-slate-950 shadow-soft-xl">
              AI
            </span>
            <span className="text-lg font-semibold tracking-tight">AI Learning Platform</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap justify-end">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive
                  ? 'text-primary font-medium'
                  : 'text-slate-700 hover:text-primary transition-colors dark:text-slate-200'
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/courses"
              className={({ isActive }) =>
                isActive
                  ? 'text-primary font-medium'
                  : 'text-slate-700 hover:text-primary transition-colors dark:text-slate-200'
              }
            >
              Courses
            </NavLink>
            {user && user.role !== 'admin' && (
              <NavLink
                to="/inbox"
                className={({ isActive }) =>
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-slate-700 hover:text-primary transition-colors dark:text-slate-200'
                }
              >
                Inbox
              </NavLink>
            )}
            <LanguageSelect />
            <ThemeSelect />
            {user && (
              <button
                onClick={logout}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:border-primary hover:text-primary dark:border-slate-700 dark:hover:border-secondary dark:hover:text-secondary"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 fade-in-up">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
        © {new Date().getFullYear()} AI Learning Platform – Adaptive progression for ML learners.
      </footer>
    </div>
  );
};
