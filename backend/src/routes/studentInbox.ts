/**
 * Student inbox: messages sent by admins.
 */
import { Router, Request, Response } from 'express';

import { all, run } from '../db/connection';

export const studentInboxRouter = Router();

studentInboxRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  if (req.user!.role !== 'student') {
    return res.json({ messages: [] });
  }

  const rows = await all<{
    id: number;
    subject: string;
    body: string;
    created_at: string;
    is_read: number;
    admin_name: string;
  }>(
    `SELECT m.id, m.subject, m.body, m.created_at, m.is_read, a.name as admin_name
     FROM AdminMessages m
     JOIN Users a ON a.id = m.admin_user_id
     WHERE m.user_id = ?
     ORDER BY m.created_at DESC`,
    [userId]
  );

  return res.json({
    messages: rows.map((r) => ({
      id: r.id,
      subject: r.subject,
      body: r.body,
      createdAt: r.created_at,
      isRead: !!r.is_read,
      fromAdmin: r.admin_name
    }))
  });
});

studentInboxRouter.post('/:id/read', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  await run(`UPDATE AdminMessages SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
  return res.json({ ok: true });
});
