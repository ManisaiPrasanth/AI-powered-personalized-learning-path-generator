import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';

import { all, get, run } from '../db/connection';

export const privateMessagesRouter = Router();
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'private-messages');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

privateMessagesRouter.get('/users', async (req, res) => {
  const me = req.user!.userId;
  const users = await all<{ id: number; name: string; email: string }>(
    'SELECT id, name, email FROM Users WHERE id != ? ORDER BY name ASC',
    [me]
  );
  return res.json({ users });
});

privateMessagesRouter.get('/requests', async (req, res) => {
  const me = req.user!.userId;

  const incoming = await all<{
    id: number;
    from_user_id: number;
    status: string;
    created_at: string;
    responded_at: string | null;
    from_name: string;
    from_email: string;
  }>(
    `SELECT r.id, r.from_user_id, r.status, r.created_at, r.responded_at, u.name as from_name, u.email as from_email
     FROM PrivateChatRequests r
     JOIN Users u ON u.id = r.from_user_id
     WHERE r.to_user_id = ?
     ORDER BY r.created_at DESC`,
    [me]
  );

  const outgoing = await all<{
    id: number;
    to_user_id: number;
    status: string;
    created_at: string;
    responded_at: string | null;
    to_name: string;
    to_email: string;
  }>(
    `SELECT r.id, r.to_user_id, r.status, r.created_at, r.responded_at, u.name as to_name, u.email as to_email
     FROM PrivateChatRequests r
     JOIN Users u ON u.id = r.to_user_id
     WHERE r.from_user_id = ?
     ORDER BY r.created_at DESC`,
    [me]
  );

  return res.json({
    incoming: incoming.map((r) => ({
      id: r.id,
      userId: r.from_user_id,
      name: r.from_name,
      email: r.from_email,
      status: r.status,
      createdAt: r.created_at,
      respondedAt: r.responded_at
    })),
    outgoing: outgoing.map((r) => ({
      id: r.id,
      userId: r.to_user_id,
      name: r.to_name,
      email: r.to_email,
      status: r.status,
      createdAt: r.created_at,
      respondedAt: r.responded_at
    }))
  });
});

privateMessagesRouter.post(
  '/requests',
  [body('toUserId').isInt({ gt: 0 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const fromUserId = req.user!.userId;
    const { toUserId } = req.body as { toUserId: number };
    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'You cannot send a request to yourself.' });
    }

    const receiver = await get<{ id: number }>('SELECT id FROM Users WHERE id = ?', [toUserId]);
    if (!receiver) return res.status(404).json({ message: 'User not found.' });

    const existing = await get<{ id: number }>(
      'SELECT id FROM PrivateChatRequests WHERE from_user_id = ? AND to_user_id = ?',
      [fromUserId, toUserId]
    );
    if (existing) {
      await run(
        `UPDATE PrivateChatRequests
         SET status = 'pending', created_at = CURRENT_TIMESTAMP, responded_at = NULL
         WHERE id = ?`,
        [existing.id]
      );
    } else {
      await run(
        `INSERT INTO PrivateChatRequests (from_user_id, to_user_id, status)
         VALUES (?, ?, 'pending')`,
        [fromUserId, toUserId]
      );
    }

    return res.status(201).json({ status: 'pending' });
  }
);

privateMessagesRouter.post(
  '/requests/:requestId/respond',
  [body('action').isIn(['accept', 'reject'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const me = req.user!.userId;
    const requestId = Number(req.params.requestId);
    const { action } = req.body as { action: 'accept' | 'reject' };

    const row = await get<{ id: number; status: string }>(
      'SELECT id, status FROM PrivateChatRequests WHERE id = ? AND to_user_id = ?',
      [requestId, me]
    );
    if (!row) return res.status(404).json({ message: 'Request not found.' });
    if (row.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed.' });
    }

    await run(
      `UPDATE PrivateChatRequests
       SET status = ?, responded_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [action === 'accept' ? 'accepted' : 'rejected', requestId]
    );

    return res.json({ status: action === 'accept' ? 'accepted' : 'rejected' });
  }
);

privateMessagesRouter.get('/conversations', async (req, res) => {
  const me = req.user!.userId;
  const peers = await all<{ id: number; name: string; email: string }>(
    `SELECT DISTINCT u.id, u.name, u.email
     FROM PrivateChatRequests r
     JOIN Users u ON u.id = CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END
     WHERE r.status = 'accepted'
       AND (r.from_user_id = ? OR r.to_user_id = ?)
     ORDER BY u.name ASC`,
    [me, me, me]
  );
  return res.json({ conversations: peers });
});

privateMessagesRouter.get('/conversations/:otherUserId/messages', async (req, res) => {
  const me = req.user!.userId;
  const other = Number(req.params.otherUserId);
  if (!other || other === me) return res.status(400).json({ message: 'Invalid user.' });

  const accepted = await get<{ id: number }>(
    `SELECT id
     FROM PrivateChatRequests
     WHERE status = 'accepted'
       AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))`,
    [me, other, other, me]
  );
  if (!accepted) return res.status(403).json({ message: 'Private chat requires accepted request.' });

  const messages = await all<{
    id: number;
    from_user_id: number;
    content: string;
    attachment_name: string | null;
    attachment_path: string | null;
    attachment_mime: string | null;
    created_at: string;
    sender_name: string;
  }>(
    `SELECT m.id, m.from_user_id, m.content, m.attachment_name, m.attachment_path, m.attachment_mime, m.created_at, u.name as sender_name
     FROM PrivateMessages m
     JOIN Users u ON u.id = m.from_user_id
     WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
     ORDER BY m.created_at ASC, m.id ASC
     LIMIT 500`,
    [me, other, other, me]
  );

  return res.json({
    messages: messages.map((m) => ({
      id: m.id,
      userId: m.from_user_id,
      userName: m.sender_name,
      content: m.content,
      attachmentName: m.attachment_name,
      attachmentUrl: m.attachment_path,
      attachmentMime: m.attachment_mime,
      createdAt: m.created_at,
      isMe: m.from_user_id === me
    }))
  });
});

privateMessagesRouter.post(
  '/conversations/:otherUserId/messages',
  [body('content').isString().isLength({ min: 1, max: 2000 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const me = req.user!.userId;
    const other = Number(req.params.otherUserId);
    const { content } = req.body as { content: string };
    if (!other || other === me) return res.status(400).json({ message: 'Invalid user.' });

    const accepted = await get<{ id: number }>(
      `SELECT id
       FROM PrivateChatRequests
       WHERE status = 'accepted'
         AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))`,
      [me, other, other, me]
    );
    if (!accepted) return res.status(403).json({ message: 'Private chat requires accepted request.' });

    await run('INSERT INTO PrivateMessages (from_user_id, to_user_id, content) VALUES (?, ?, ?)', [
      me,
      other,
      content.trim()
    ]);

    const created = await get<{ id: number; created_at: string; name: string }>(
      `SELECT m.id, m.created_at, u.name
       FROM PrivateMessages m
       JOIN Users u ON u.id = m.from_user_id
       WHERE m.from_user_id = ? AND m.to_user_id = ?
       ORDER BY m.id DESC
       LIMIT 1`,
      [me, other]
    );
    if (!created) return res.status(500).json({ message: 'Failed to send message.' });

    return res.status(201).json({
      message: {
        id: created.id,
        userId: me,
        userName: created.name,
        content: content.trim(),
        createdAt: created.created_at,
        isMe: true
      }
    });
  }
);

privateMessagesRouter.post(
  '/conversations/:otherUserId/files',
  [
    body('fileName').isString().isLength({ min: 1, max: 255 }),
    body('mimeType').isString().isLength({ min: 1, max: 120 }),
    body('dataBase64').isString().isLength({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const me = req.user!.userId;
    const other = Number(req.params.otherUserId);
    const { fileName, mimeType, dataBase64 } = req.body as {
      fileName: string;
      mimeType: string;
      dataBase64: string;
    };
    if (!other || other === me) return res.status(400).json({ message: 'Invalid user.' });

    const accepted = await get<{ id: number }>(
      `SELECT id
       FROM PrivateChatRequests
       WHERE status = 'accepted'
         AND ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))`,
      [me, other, other, me]
    );
    if (!accepted) return res.status(403).json({ message: 'Private chat requires accepted request.' });

    const buffer = Buffer.from(dataBase64, 'base64');
    const maxBytes = 10 * 1024 * 1024;
    if (!buffer.length || buffer.length > maxBytes) {
      return res.status(400).json({ message: 'File size must be between 1 byte and 10 MB.' });
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
    const fullPath = path.join(UPLOAD_DIR, storedName);
    fs.writeFileSync(fullPath, buffer);
    const publicPath = `/uploads/private-messages/${storedName}`;

    await run(
      `INSERT INTO PrivateMessages (from_user_id, to_user_id, content, attachment_name, attachment_path, attachment_mime)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [me, other, `[File] ${fileName}`, fileName, publicPath, mimeType]
    );

    const created = await get<{ id: number; created_at: string; name: string }>(
      `SELECT m.id, m.created_at, u.name
       FROM PrivateMessages m
       JOIN Users u ON u.id = m.from_user_id
       WHERE m.from_user_id = ? AND m.to_user_id = ?
       ORDER BY m.id DESC
       LIMIT 1`,
      [me, other]
    );
    if (!created) return res.status(500).json({ message: 'Failed to upload file.' });

    return res.status(201).json({
      message: {
        id: created.id,
        userId: me,
        userName: created.name,
        content: `[File] ${fileName}`,
        attachmentName: fileName,
        attachmentUrl: publicPath,
        attachmentMime: mimeType,
        createdAt: created.created_at,
        isMe: true
      }
    });
  }
);
