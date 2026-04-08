import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../state/AuthContext';
import { ThemeSelect } from '../components/ThemeSelect';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
      if (res.data.user?.role !== 'admin') {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: { msg: string }[] } } };
      const payload = ax?.response?.data;
      const message =
        payload?.message ??
        payload?.errors?.[0]?.msg ??
        'Failed to register. Please check your inputs and try again.';
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
        <h1 className="text-2xl font-semibold mb-2 text-center">Create your account</h1>
        <p className="text-sm text-slate-600 mb-6 text-center dark:text-slate-400">
          Start your adaptive Machine Learning path.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 dark:text-slate-300">
              Full name
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-600 text-center dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
