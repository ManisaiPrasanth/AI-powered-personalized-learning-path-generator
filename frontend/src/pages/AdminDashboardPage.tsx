import React, { useEffect, useState } from 'react';
import { useApi } from '../api/client';

type Overview = {
  today: string;
  totalStudents: number;
  activeStudyingToday: number;
  examsTakenToday: number;
  totalExamAttempts: number;
  averageScoreAcrossAttempts: number | null;
  learnersWithLowScores: number;
};

type StudentRow = {
  id: number;
  name: string;
  email: string;
  registeredAt: string;
  quizAttempts: number;
  bestScore: number | null;
  lastExamAt: string | null;
  unitsCompleted: number;
  latestUnitScore: number | null;
};

type SentMessage = {
  id: number;
  userId: number;
  subject: string;
  body: string;
  createdAt: string;
  studentName: string;
  studentEmail: string;
};

export const AdminDashboardPage: React.FC = () => {
  const api = useApi();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgUserId, setMsgUserId] = useState('');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [o, s, m] = await Promise.all([
        api.get<Overview>('/admin/overview'),
        api.get<{ students: StudentRow[] }>('/admin/students'),
        api.get<{ messages: SentMessage[] }>('/admin/messages')
      ]);
      setOverview(o.data);
      setStudents(s.data.students);
      setSent(m.data.messages);
    } catch {
      setFeedback('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [api]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = Number(msgUserId);
    if (!uid || !msgSubject.trim() || !msgBody.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      await api.post('/admin/messages', {
        userId: uid,
        subject: msgSubject.trim(),
        body: msgBody.trim()
      });
      setMsgSubject('');
      setMsgBody('');
      setFeedback('Message sent. The student will see it in their inbox.');
      await load();
    } catch (err: any) {
      setFeedback(err.response?.data?.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading && !overview) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">Loading admin dashboard…</p>;
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="mb-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Admin dashboard
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Monitor daily engagement, quiz activity, scores, and send guidance to learners who need
          support.
        </p>
      </section>

      {overview && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-[0.65rem] uppercase tracking-wide text-slate-600 dark:text-slate-500">
              Total students
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {overview.totalStudents}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-[0.65rem] uppercase tracking-wide text-emerald-400/80">
              Active today ({overview.today})
            </p>
            <p className="text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
              {overview.activeStudyingToday}
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-600 dark:text-slate-500">
              Logged in or pinged activity today
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4">
            <p className="text-[0.65rem] uppercase tracking-wide text-sky-400/80">Exams today</p>
            <p className="text-2xl font-semibold text-sky-800 dark:text-sky-200">
              {overview.examsTakenToday}
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-600 dark:text-slate-500">
              Quiz submissions recorded today
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-[0.65rem] uppercase tracking-wide text-slate-600 dark:text-slate-500">
              Total attempts
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {overview.totalExamAttempts}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="text-[0.65rem] uppercase tracking-wide text-slate-600 dark:text-slate-500">
              Avg score
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {overview.averageScoreAcrossAttempts ?? '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-[0.65rem] uppercase tracking-wide text-amber-400/80">
              Possibly struggling
            </p>
            <p className="text-2xl font-semibold text-amber-800 dark:text-amber-200">
              {overview.learnersWithLowScores}
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-600 dark:text-slate-500">
              Units incomplete with score &lt; 70
            </p>
          </div>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Message a student</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Sends an in-app notice (e.g. reminder to review a concept). Students see messages under
          their inbox.
        </p>
        {feedback && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{feedback}</p>
        )}
        <form onSubmit={handleSendMessage} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">
              Student (user ID)
            </label>
            <select
              value={msgUserId}
              onChange={(e) => setMsgUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              required
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email}) — ID {s.id}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Subject</label>
            <input
              value={msgSubject}
              onChange={(e) => setMsgSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="e.g. Follow-up on Unit 3 quiz"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-600 dark:text-slate-400">Message</label>
            <textarea
              value={msgBody}
              onChange={(e) => setMsgBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Encouragement and concrete next steps…"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={sending}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          Students & scores
        </h2>
        <table className="min-w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-500">
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Quiz attempts</th>
              <th className="py-2 pr-3">Best score</th>
              <th className="py-2 pr-3">Latest unit score</th>
              <th className="py-2 pr-3">Units done</th>
              <th className="py-2 pr-3">Last exam</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-slate-200/80 dark:border-slate-800/60">
                <td className="py-2 pr-3 font-mono">{s.id}</td>
                <td className="py-2 pr-3">{s.name}</td>
                <td className="py-2 pr-3">{s.email}</td>
                <td className="py-2 pr-3">{s.quizAttempts}</td>
                <td className="py-2 pr-3">{s.bestScore ?? '—'}</td>
                <td className="py-2 pr-3">
                  {s.latestUnitScore != null ? (
                    <span
                      className={
                        s.latestUnitScore < 70 ? 'text-amber-400' : 'text-emerald-400'
                      }
                    >
                      {s.latestUnitScore}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-2 pr-3">{s.unitsCompleted}</td>
                <td className="py-2 pr-3 text-slate-600 dark:text-slate-500">
                  {s.lastExamAt ? new Date(s.lastExamAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <p className="py-4 text-sm text-slate-600 dark:text-slate-500">No student accounts yet.</p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-950/40">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Recent admin messages
        </h2>
        <ul className="space-y-3 text-xs">
          {sent.slice(0, 20).map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <p className="font-medium text-slate-800 dark:text-slate-200">{m.subject}</p>
              <p className="text-slate-600 dark:text-slate-500">
                To: {m.studentName} &lt;{m.studentEmail}&gt; · {new Date(m.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-400">{m.body}</p>
            </li>
          ))}
        </ul>
        {sent.length === 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-500">No messages sent yet.</p>
        )}
      </section>
    </div>
  );
};
