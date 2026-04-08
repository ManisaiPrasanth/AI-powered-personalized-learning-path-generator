/**
 * Student inbox: messages sent by admins.
 */
import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

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

  const collabRequests = await all<{
    id: number;
    status: string;
    created_at: string;
    responded_at: string | null;
    from_user_id: number;
    from_name: string;
    course_slug: string;
    course_title: string;
  }>(
    `SELECT r.id, r.status, r.created_at, r.responded_at, r.from_user_id, u.name as from_name,
            c.slug as course_slug, c.title as course_title
     FROM CourseCollabRequests r
     JOIN Users u ON u.id = r.from_user_id
     JOIN Courses c ON c.id = r.course_id
     WHERE r.to_user_id = ?
     ORDER BY r.created_at DESC`,
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
    })),
    collaborationRequests: collabRequests.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      respondedAt: r.responded_at,
      fromUserId: r.from_user_id,
      fromName: r.from_name,
      courseSlug: r.course_slug,
      courseTitle: r.course_title
    }))
  });
});

studentInboxRouter.post('/:id/read', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = Number(req.params.id);
  await run(`UPDATE AdminMessages SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
  return res.json({ ok: true });
});

studentInboxRouter.post(
  '/collab-requests/:id/respond',
  [body('action').isIn(['accept', 'reject'])],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.userId;
    const id = Number(req.params.id);
    const { action } = req.body as { action: 'accept' | 'reject' };

    const existing = await all<{ id: number; status: string }>(
      `SELECT id, status
       FROM CourseCollabRequests
       WHERE id = ? AND to_user_id = ?`,
      [id, userId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Request not found.' });
    }
    if (existing[0].status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been processed.' });
    }

    await run(
      `UPDATE CourseCollabRequests
       SET status = ?, responded_at = CURRENT_TIMESTAMP
       WHERE id = ? AND to_user_id = ?`,
      [action === 'accept' ? 'accepted' : 'rejected', id, userId]
    );

    return res.json({ ok: true, status: action === 'accept' ? 'accepted' : 'rejected' });
  }
);
