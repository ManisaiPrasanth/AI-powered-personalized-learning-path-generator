import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../api/client';

type InboxMsg = {
  id: number;
  subject: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  fromAdmin: string;
};

export const StudentInboxPage: React.FC = () => {
  const api = useApi();
  const [messages, setMessages] = useState<InboxMsg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ messages: InboxMsg[] }>('/inbox');
        setMessages(res.data.messages);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [api]);

  const markRead = async (id: number) => {
    try {
      await api.post(`/inbox/${id}/read`);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <p className="mb-1 text-xs text-slate-600 dark:text-slate-400">
        <Link to="/dashboard" className="hover:text-secondary">
          ← Back to dashboard
        </Link>
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Messages from your instructors
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        When admins send you tips or follow-ups about your progress, they appear here.
      </p>
      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-500">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-500">No messages yet.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-2xl border p-4 ${
                m.isRead
                  ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40'
                  : 'border-primary/40 bg-primary/5'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{m.subject}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500">
                    From {m.fromAdmin} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                {!m.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(m.id)}
                    className="text-xs text-sky-600 hover:underline dark:text-sky-400"
                  >
                    Mark as read
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                {m.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
