import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { ThemeSelect } from '../components/ThemeSelect';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } };
      const payload = ax?.response?.data;
      const message =
        payload?.message ??
        payload?.errors?.[0]?.msg ??
        'Failed to login. Please check your credentials and try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="absolute right-4 top-4 z-10">
        <ThemeSelect />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
        <h1 className="text-2xl font-semibold mb-2 text-center">Welcome back</h1>
        <p className="text-sm text-slate-600 mb-6 text-center dark:text-slate-400">
          Sign in to continue your AI learning journey.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-500 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-600 text-center dark:text-slate-400">
          New here?{' '}
          <Link to="/register" className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
