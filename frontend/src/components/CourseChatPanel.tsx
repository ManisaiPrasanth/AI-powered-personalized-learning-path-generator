import React, { useEffect, useState } from 'react';
import { useApi } from '../api/client';

type ChatMessage = {
  id: number;
  userId: number;
  userName: string;
  content: string;
  createdAt: string;
  isMe: boolean;
};

type ChatResponse = {
  course: { id: number; title: string; slug: string };
  messages: ChatMessage[];
};

interface CourseChatPanelProps {
  courseSlug: string;
  courseTitle: string;
}

export const CourseChatPanel: React.FC<CourseChatPanelProps> = ({ courseSlug, courseTitle }) => {
  const api = useApi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ChatResponse>(`/courses/${courseSlug}/chat`);
      setMessages(res.data.messages);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to load course discussion.';
      setError(msg);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!courseSlug) return;
    void loadMessages();
  }, [courseSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await api.post<{ message: ChatMessage }>(`/courses/${courseSlug}/chat`, {
        content: input.trim()
      });
      setMessages((prev) => [...prev, res.data.message]);
      setInput('');
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Failed to send message.';
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="card-elevated p-4 md:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="pill-muted inline-block text-[0.65rem] mb-1">Peer learning</p>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Course discussion</h2>
            <p className="text-[0.7rem] text-slate-600 dark:text-slate-400">
              Chat with other learners about{' '}
              <span className="font-medium">{courseTitle}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={loadMessages}
            className="text-[0.7rem] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Refresh
          </button>
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

        <div className="h-64 overflow-y-auto space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/60">
          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">Loading messages…</p>
          ) : messages.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-500">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                    m.isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'rounded-bl-sm bg-slate-200 text-slate-900 dark:bg-slate-800/80 dark:text-slate-100'
                  }`}
                >
                  {!m.isMe && (
                    <p className="text-[0.65rem] font-semibold text-slate-700 mb-0.5 dark:text-slate-300">
                      {m.userName}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className="mt-1 text-[0.6rem] opacity-70">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share a tip, question, or insight about this course…"
            className="flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </section>
  );
};

