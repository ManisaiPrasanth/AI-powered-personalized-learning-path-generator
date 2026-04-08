/**
 * Record daily study activity for analytics (students only).
 */
import { Router, Request, Response } from 'express';

import { run } from '../db/connection';

export const activityRouter = Router();

activityRouter.post('/ping', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  if (role !== 'student') {
    return res.json({ ok: true, skipped: true });
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    await run(
      `INSERT OR IGNORE INTO UserDailyActivity (user_id, active_date) VALUES (?, ?)`,
      [userId, today]
    );
  } catch {
    // ignore
  }
  return res.json({ ok: true, date: today });
});
