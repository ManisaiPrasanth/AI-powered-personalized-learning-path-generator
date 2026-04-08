/**
 * Admin module: analytics, learner scores, and targeted messages.
 */
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

import { all, get, run } from '../db/connection';

export const adminRouter = Router();

/** GET /api/admin/overview — KPIs */
adminRouter.get('/overview', async (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);

  const studentCount = await get<{ n: number }>(
    `SELECT COUNT(*) as n FROM Users WHERE role = 'student'`
  );

  const activeToday = await get<{ n: number }>(
    `SELECT COUNT(DISTINCT user_id) as n FROM UserDailyActivity WHERE active_date = ?`,
    [today]
  );

  const examsToday = await get<{ n: number }>(
    `SELECT COUNT(*) as n FROM Scores WHERE date(created_at) = date('now')`
  );

  const totalExamAttempts = await get<{ n: number }>(`SELECT COUNT(*) as n FROM Scores`);

  const avgScore = await get<{ avg: number | null }>(
    `SELECT AVG(score) as avg FROM Scores`
  );

  const laggingLearners = await get<{ n: number }>(
    `SELECT COUNT(DISTINCT user_id) as n FROM UserProgress
     WHERE is_completed = 0 AND last_score IS NOT NULL AND last_score < 70`
  );

  return res.json({
    today,
    totalStudents: studentCount?.n ?? 0,
    activeStudyingToday: activeToday?.n ?? 0,
    examsTakenToday: examsToday?.n ?? 0,
    totalExamAttempts: totalExamAttempts?.n ?? 0,
    averageScoreAcrossAttempts: avgScore?.avg != null ? Math.round(avgScore.avg * 10) / 10 : null,
    learnersWithLowScores: laggingLearners?.n ?? 0
  });
});

/** GET /api/admin/students — list with latest scores summary */
adminRouter.get('/students', async (_req: Request, res: Response) => {
  const rows = await all<{
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
  }>(`SELECT id, name, email, role, created_at FROM Users WHERE role = 'student' ORDER BY name`);

  const out = [];
  for (const u of rows) {
    const stats = await get<{ attempts: number; best: number | null; last: string | null }>(
      `SELECT COUNT(*) as attempts, MAX(score) as best, MAX(created_at) as last FROM Scores WHERE user_id = ?`,
      [u.id]
    );
    const progress = await get<{ completed: number }>(
      `SELECT COUNT(*) as completed FROM UserProgress WHERE user_id = ? AND is_completed = 1`,
      [u.id]
    );
    const lastScoreRow = await get<{ last_score: number | null }>(
      `SELECT last_score FROM UserProgress WHERE user_id = ? AND last_score IS NOT NULL ORDER BY last_attempt_at DESC LIMIT 1`,
      [u.id]
    );
    out.push({
      id: u.id,
      name: u.name,
      email: u.email,
      registeredAt: u.created_at,
      quizAttempts: stats?.attempts ?? 0,
      bestScore: stats?.best ?? null,
      lastExamAt: stats?.last ?? null,
      unitsCompleted: progress?.completed ?? 0,
      latestUnitScore: lastScoreRow?.last_score ?? null
    });
  }

  return res.json({ students: out });
});

/** GET /api/admin/students/:id/scores */
adminRouter.get('/students/:id/scores', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: 'Invalid id.' });

  const user = await get<{ id: number; name: string; email: string }>(
    'SELECT id, name, email FROM Users WHERE id = ? AND role = ?',
    [id, 'student']
  );
  if (!user) {
    return res.status(404).json({ message: 'Student not found.' });
  }

  const scores = await all<{
    id: number;
    score: number;
    passed: number;
    created_at: string;
    unit_id: number;
    unit_number: number;
    title: string;
  }>(
    `SELECT s.id, s.score, s.passed, s.created_at, s.unit_id, u.unit_number, u.title
     FROM Scores s
     JOIN Units u ON u.id = s.unit_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`,
    [id]
  );

  return res.json({ user, scores });
});

/** POST /api/admin/messages — send message to a student */
adminRouter.post(
  '/messages',
  [
    body('userId').isInt({ gt: 0 }),
    body('subject').isString().isLength({ min: 1, max: 200 }).trim(),
    body('body').isString().isLength({ min: 1, max: 4000 }).trim()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const adminId = req.user!.userId;
    const { userId, subject, body: text } = req.body as {
      userId: number;
      subject: string;
      body: string;
    };

    const target = await get<{ id: number; role: string }>(
      'SELECT id, role FROM Users WHERE id = ?',
      [userId]
    );
    if (!target || target.role !== 'student') {
      return res.status(400).json({ message: 'Target must be a student user.' });
    }

    await run(
      `INSERT INTO AdminMessages (user_id, admin_user_id, subject, body) VALUES (?, ?, ?, ?)`,
      [userId, adminId, subject, text]
    );

    const row = await get<{ id: number }>(
      'SELECT id FROM AdminMessages WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );

    return res.status(201).json({ messageId: row?.id ?? null, ok: true });
  }
);

/** GET /api/admin/messages — recent admin messages sent */
adminRouter.get('/messages', async (_req: Request, res: Response) => {
  const rows = await all<{
    id: number;
    user_id: number;
    subject: string;
    body: string;
    created_at: string;
    student_name: string;
    student_email: string;
  }>(
    `SELECT m.id, m.user_id, m.subject, m.body, m.created_at, u.name as student_name, u.email as student_email
     FROM AdminMessages m
     JOIN Users u ON u.id = m.user_id
     ORDER BY m.created_at DESC
     LIMIT 100`
  );

  return res.json({
    messages: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      subject: r.subject,
      body: r.body,
      createdAt: r.created_at,
      studentName: r.student_name,
      studentEmail: r.student_email
    }))
  });
});
