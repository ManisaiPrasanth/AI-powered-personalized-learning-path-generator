import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../api/client';

type UserItem = { id: number; name: string; email: string };
type RequestItem = {
  id: number;
  userId: number;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};
type ChatMessage = {
  id: number;
  userId: number;
  userName: string;
  content: string;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
  createdAt: string;
  isMe: boolean;
};

export const PrivateMessagesPage: React.FC = () => {
  const api = useApi();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [conversations, setConversations] = useState<UserItem[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const outgoingStatusByUserId = useMemo(
    () => Object.fromEntries(outgoing.map((o) => [String(o.userId), o.status])),
    [outgoing]
  );

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, requestsRes, convRes] = await Promise.all([
        api.get<{ users: UserItem[] }>('/private-messages/users'),
        api.get<{ incoming: RequestItem[]; outgoing: RequestItem[] }>('/private-messages/requests'),
        api.get<{ conversations: UserItem[] }>('/private-messages/conversations')
      ]);
      setUsers(usersRes.data.users ?? []);
      setIncoming(requestsRes.data.incoming ?? []);
      setOutgoing(requestsRes.data.outgoing ?? []);
      setConversations(convRes.data.conversations ?? []);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load private messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const sendRequest = async (toUserId: number) => {
    try {
      await api.post('/private-messages/requests', { toUserId });
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to send request.');
    }
  };

  const respondRequest = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      await api.post(`/private-messages/requests/${requestId}/respond`, { action });
      await loadAll();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to respond.');
    }
  };

  const loadConversation = async (otherUserId: number) => {
    setActiveUserId(otherUserId);
    setError(null);
    try {
      const res = await api.get<{ messages: ChatMessage[] }>(
        `/private-messages/conversations/${otherUserId}/messages`
      );
      setMessages(res.data.messages ?? []);
    } catch (err: any) {
      setMessages([]);
      setError(err.response?.data?.message ?? 'Failed to load conversation.');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserId || !input.trim()) return;
    try {
      const res = await api.post<{ message: ChatMessage }>(
        `/private-messages/conversations/${activeUserId}/messages`,
        {
          content: input.trim()
        }
      );
      setMessages((prev) => [...prev, res.data.message]);
      setInput('');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to send message.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Private Messages</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Send private chat requests by email user list. Chat unlocks after acceptance.
        </p>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-500">Loading...</p>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">All users</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {users.map((u) => {
                const status = outgoingStatusByUserId[String(u.id)];
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-400">{u.email}</p>
                    </div>
                    {status ? (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[0.65rem] capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {status}
                      </span>
                    ) : (
                      <button className="btn-outline text-xs" onClick={() => void sendRequest(u.id)}>
                        Send request
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Incoming requests</h2>
            {incoming.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-400">No incoming requests.</p>
            ) : (
              <div className="space-y-2">
                {incoming.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{r.email}</p>
                    </div>
                    {r.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button className="btn-primary text-xs" onClick={() => void respondRequest(r.id, 'accept')}>
                          Accept
                        </button>
                        <button className="btn-outline text-xs" onClick={() => void respondRequest(r.id, 'reject')}>
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs capitalize text-slate-600 dark:text-slate-400">{r.status}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Private chats</h2>
            <div className="flex flex-wrap gap-2">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">No accepted chats yet.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void loadConversation(c.id)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      activeUserId === c.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>
            {activeUserId && (
              <>
                <div className="h-64 overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60">
                  {messages.length === 0 ? (
                    <p className="text-slate-600 dark:text-slate-400">No messages yet.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-xl px-3 py-2 ${
                            m.isMe
                              ? 'bg-primary text-white'
                              : 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {!m.isMe && <p className="text-[0.65rem] font-semibold">{m.userName}</p>}
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.attachmentUrl && (
                            <a
                              href={m.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block text-[0.7rem] underline"
                            >
                              {m.attachmentName ?? 'Open attachment'}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={sendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Write a private message..."
                    className="flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <button type="submit" className="btn-primary text-xs" disabled={!input.trim()}>
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};
