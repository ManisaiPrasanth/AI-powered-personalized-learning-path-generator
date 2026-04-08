import { Router } from 'express';
import { body, validationResult } from 'express-validator';

import { all, get, run } from '../db/connection';

export const courseRouter = Router();

courseRouter.get('/', async (req, res) => {
  const userId = req.user?.userId;

  const courses = await all<{
    id: number;
    title: string;
    slug: string;
    description: string | null;
    total_units: number;
  }>('SELECT id, title, slug, description, total_units FROM Courses ORDER BY id');

  if (!userId) {
    return res.json(
      courses.map((c) => ({
        ...c,
        completionPercent: 0
      }))
    );
  }

  const result = [];
  for (const course of courses) {
    if (course.total_units === 0) {
      result.push({ ...course, completionPercent: 0 });
      continue;
    }

    const completed = await get<{ completedCount: number }>(
      `SELECT COUNT(*) as completedCount
       FROM UserProgress up
       JOIN Units u ON u.id = up.unit_id
       WHERE up.user_id = ? AND up.course_id = ? AND up.is_completed = 1 AND u.is_detailed_version_of IS NULL`,
      [userId, course.id]
    );

    const completedCount = completed?.completedCount ?? 0;
    const completionPercent =
      course.total_units > 0 ? Math.round((completedCount / course.total_units) * 100) : 0;

    result.push({ ...course, completionPercent });
  }

  return res.json(result);
});

courseRouter.get('/:slug', async (req, res) => {
  const userId = req.user!.userId;
  const { slug } = req.params;

  const course = await get<{
    id: number;
    title: string;
    slug: string;
    description: string | null;
    total_units: number;
  }>('SELECT * FROM Courses WHERE slug = ?', [slug]);

  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  const baseUnits = await all<{
    id: number;
    unit_number: number;
    title: string;
  }>(
    'SELECT id, unit_number, title FROM Units WHERE course_id = ? AND is_detailed_version_of IS NULL ORDER BY unit_number',
    [course.id]
  );

  if (baseUnits.length > 0) {
    const progressRows = await all<{ unit_id: number }>(
      'SELECT unit_id FROM UserProgress WHERE user_id = ? AND course_id = ?',
      [userId, course.id]
    );

    if (progressRows.length === 0) {
      const firstUnit = baseUnits[0];
      await run(
        `INSERT INTO UserProgress (user_id, course_id, unit_id, is_unlocked, is_completed)
         VALUES (?, ?, ?, 1, 0)`,
        [userId, course.id, firstUnit.id]
      );
    }
  }

  const unitProgress = await all<{
    unit_id: number;
    is_unlocked: number;
    is_completed: number;
    last_score: number | null;
  }>(
    'SELECT unit_id, is_unlocked, is_completed, last_score FROM UserProgress WHERE user_id = ? AND course_id = ?',
    [userId, course.id]
  );

  const progressByUnit = new Map<
    number,
    { is_unlocked: boolean; is_completed: boolean; last_score: number | null }
  >();

  for (const p of unitProgress) {
    progressByUnit.set(p.unit_id, {
      is_unlocked: !!p.is_unlocked,
      is_completed: !!p.is_completed,
      last_score: p.last_score
    });
  }

  const detailedUnits = await all<{ id: number; is_detailed_version_of: number }>(
    'SELECT id, is_detailed_version_of FROM Units WHERE course_id = ? AND is_detailed_version_of IS NOT NULL',
    [course.id]
  );
  const hasDetailedByBaseId = new Set<number>();
  for (const du of detailedUnits) {
    hasDetailedByBaseId.add(du.is_detailed_version_of);
  }

  const unitsWithProgress = baseUnits.map((u) => {
    const progress = progressByUnit.get(u.id);
    return {
      id: u.id,
      unitNumber: u.unit_number,
      title: u.title,
      isUnlocked: progress?.is_unlocked ?? false,
      isCompleted: progress?.is_completed ?? false,
      lastScore: progress?.last_score ?? null,
      hasDetailedVersion: hasDetailedByBaseId.has(u.id)
    };
  });

  return res.json({
    course,
    units: unitsWithProgress
  });
});

courseRouter.get('/:slug/units/:unitNumber', async (req, res) => {
  const userId = req.user!.userId;
  const { slug, unitNumber } = req.params;

  const course = await get<{ id: number }>('SELECT id FROM Courses WHERE slug = ?', [slug]);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  const unit = await get<{ id: number; title: string; content: string | null }>(
    'SELECT id, title, content FROM Units WHERE course_id = ? AND unit_number = ? AND is_detailed_version_of IS NULL',
    [course.id, Number(unitNumber)]
  );

  if (!unit) {
    return res.status(404).json({ message: 'Unit not found.' });
  }

  const progress = await get<{ is_unlocked: number }>(
    'SELECT is_unlocked FROM UserProgress WHERE user_id = ? AND unit_id = ?',
    [userId, unit.id]
  );

  if (!progress || !progress.is_unlocked) {
    return res.status(403).json({ message: 'Unit is locked.' });
  }

  return res.json({
    id: unit.id,
    title: unit.title,
    unitNumber: Number(unitNumber),
    content: unit.content
  });
});

courseRouter.get('/:slug/units/:unitNumber/detailed', async (req, res) => {
  const userId = req.user!.userId;
  const { slug, unitNumber } = req.params;

  const course = await get<{ id: number }>('SELECT id FROM Courses WHERE slug = ?', [slug]);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  const baseUnit = await get<{ id: number; title: string }>(
    'SELECT id, title FROM Units WHERE course_id = ? AND unit_number = ? AND is_detailed_version_of IS NULL',
    [course.id, Number(unitNumber)]
  );
  if (!baseUnit) {
    return res.status(404).json({ message: 'Unit not found.' });
  }

  const progress = await get<{ last_score: number | null; is_completed: number }>(
    'SELECT last_score, is_completed FROM UserProgress WHERE user_id = ? AND unit_id = ?',
    [userId, baseUnit.id]
  );

  if (!progress || progress.is_completed) {
    return res.status(403).json({
      message: 'Detailed version is available only after failing the quiz.'
    });
  }

  const lastScore = progress.last_score ?? 0;
  if (lastScore >= 70) {
    return res.status(403).json({
      message: 'Detailed version is available only if score is below 70%.'
    });
  }

  const detailedUnit = await get<{ id: number; detailed_content: string | null }>(
    'SELECT id, detailed_content FROM Units WHERE course_id = ? AND unit_number = ? AND is_detailed_version_of = ?',
    [course.id, Number(unitNumber), baseUnit.id]
  );

  if (!detailedUnit) {
    return res.status(404).json({ message: 'Detailed unit not found.' });
  }

  return res.json({
    id: detailedUnit.id,
    baseUnitId: baseUnit.id,
    title: `${baseUnit.title} - Detailed Version`,
    content: detailedUnit.detailed_content
  });
});

// Simple course-level discussion chat for peer learning
courseRouter.get('/:slug/chat', async (req, res) => {
  const userId = req.user!.userId;
  const { slug } = req.params;

  const course = await get<{ id: number; title: string }>(
    'SELECT id, title FROM Courses WHERE slug = ?',
    [slug]
  );
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  // Ensure the user has some progress in this course before joining chat
  const progress = await get<{ count: number }>(
    'SELECT COUNT(*) as count FROM UserProgress WHERE user_id = ? AND course_id = ?',
    [userId, course.id]
  );
  if (!progress || !progress.count) {
    return res
      .status(403)
      .json({ message: 'You need progress in this course before joining the discussion.' });
  }

  const participants = await all<{ id: number; name: string; email: string }>(
    `SELECT DISTINCT u.id, u.name, u.email
     FROM UserProgress up
     JOIN Users u ON u.id = up.user_id
     WHERE up.course_id = ?
     ORDER BY u.name ASC`,
    [course.id]
  );

  const sentRequests = await all<{ to_user_id: number; status: string }>(
    `SELECT to_user_id, status
     FROM CourseCollabRequests
     WHERE course_id = ? AND from_user_id = ?`,
    [course.id, userId]
  );
  const sentRequestStatusByUserId = Object.fromEntries(
    sentRequests.map((r) => [String(r.to_user_id), r.status])
  );
  const acceptedCollaborators = await all<{ user_id: number; name: string; email: string }>(
    `SELECT u.id as user_id, u.name, u.email
     FROM CourseCollabRequests r
     JOIN Users u ON u.id =
       CASE WHEN r.from_user_id = ? THEN r.to_user_id ELSE r.from_user_id END
     WHERE r.course_id = ?
       AND r.status = 'accepted'
       AND (r.from_user_id = ? OR r.to_user_id = ?)
     ORDER BY u.name ASC`,
    [userId, course.id, userId, userId]
  );

  const messages = await all<{
    id: number;
    user_id: number;
    content: string;
    created_at: string;
    name: string;
  }>(
    `SELECT m.id, m.user_id, m.content, m.created_at, u.name
     FROM CourseMessages m
     JOIN Users u ON u.id = m.user_id
     WHERE m.course_id = ?
     ORDER BY m.created_at ASC, m.id ASC
     LIMIT 200`,
    [course.id]
  );

  return res.json({
    course: { id: course.id, title: course.title, slug },
    participants: participants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      isMe: p.id === userId
    })),
    acceptedCollaborators: acceptedCollaborators.map((c) => ({
      id: c.user_id,
      name: c.name,
      email: c.email
    })),
    sentRequestStatusByUserId,
    messages: messages.map((m) => ({
      id: m.id,
      userId: m.user_id,
      userName: m.name,
      content: m.content,
      createdAt: m.created_at,
      isMe: m.user_id === userId
    }))
  });
});

courseRouter.post(
  '/:slug/collab-requests',
  [body('toUserId').isInt({ gt: 0 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const fromUserId = req.user!.userId;
    const { slug } = req.params;
    const { toUserId } = req.body as { toUserId: number };

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'You cannot send a request to yourself.' });
    }

    const course = await get<{ id: number }>('SELECT id FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const senderProgress = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM UserProgress WHERE user_id = ? AND course_id = ?',
      [fromUserId, course.id]
    );
    const receiverProgress = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM UserProgress WHERE user_id = ? AND course_id = ?',
      [toUserId, course.id]
    );
    if (!senderProgress?.count || !receiverProgress?.count) {
      return res
        .status(403)
        .json({ message: 'Both users must have course progress to collaborate.' });
    }

    const existing = await get<{ id: number; status: string }>(
      `SELECT id, status
       FROM CourseCollabRequests
       WHERE course_id = ? AND from_user_id = ? AND to_user_id = ?`,
      [course.id, fromUserId, toUserId]
    );

    if (!existing) {
      await run(
        `INSERT INTO CourseCollabRequests (course_id, from_user_id, to_user_id, status)
         VALUES (?, ?, ?, 'pending')`,
        [course.id, fromUserId, toUserId]
      );
    } else {
      await run(
        `UPDATE CourseCollabRequests
         SET status = 'pending', created_at = CURRENT_TIMESTAMP, responded_at = NULL
         WHERE id = ?`,
        [existing.id]
      );
    }

    return res.status(201).json({ message: 'Collaboration request sent.', status: 'pending' });
  }
);

courseRouter.get('/:slug/private-chat/:otherUserId', async (req, res) => {
  const userId = req.user!.userId;
  const { slug, otherUserId } = req.params;
  const peerId = Number(otherUserId);

  const course = await get<{ id: number }>('SELECT id FROM Courses WHERE slug = ?', [slug]);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }
  if (!peerId || peerId === userId) {
    return res.status(400).json({ message: 'Invalid collaborator.' });
  }

  const accepted = await get<{ id: number }>(
    `SELECT id
     FROM CourseCollabRequests
     WHERE course_id = ?
       AND status = 'accepted'
       AND (
         (from_user_id = ? AND to_user_id = ?)
         OR
         (from_user_id = ? AND to_user_id = ?)
       )`,
    [course.id, userId, peerId, peerId, userId]
  );
  if (!accepted) {
    return res.status(403).json({ message: 'Private chat is available after request acceptance.' });
  }

  const messages = await all<{
    id: number;
    from_user_id: number;
    to_user_id: number;
    content: string;
    created_at: string;
    from_name: string;
  }>(
    `SELECT m.id, m.from_user_id, m.to_user_id, m.content, m.created_at, u.name as from_name
     FROM CourseCollabMessages m
     JOIN Users u ON u.id = m.from_user_id
     WHERE m.course_id = ?
       AND (
         (m.from_user_id = ? AND m.to_user_id = ?)
         OR
         (m.from_user_id = ? AND m.to_user_id = ?)
       )
     ORDER BY m.created_at ASC, m.id ASC
     LIMIT 300`,
    [course.id, userId, peerId, peerId, userId]
  );

  return res.json({
    messages: messages.map((m) => ({
      id: m.id,
      userId: m.from_user_id,
      userName: m.from_name,
      content: m.content,
      createdAt: m.created_at,
      isMe: m.from_user_id === userId
    }))
  });
});

courseRouter.post(
  '/:slug/private-chat/:otherUserId',
  [body('content').isString().isLength({ min: 1, max: 2000 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.userId;
    const { slug, otherUserId } = req.params;
    const peerId = Number(otherUserId);
    const { content } = req.body as { content: string };

    const course = await get<{ id: number }>('SELECT id FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    if (!peerId || peerId === userId) {
      return res.status(400).json({ message: 'Invalid collaborator.' });
    }

    const accepted = await get<{ id: number }>(
      `SELECT id
       FROM CourseCollabRequests
       WHERE course_id = ?
         AND status = 'accepted'
         AND (
           (from_user_id = ? AND to_user_id = ?)
           OR
           (from_user_id = ? AND to_user_id = ?)
         )`,
      [course.id, userId, peerId, peerId, userId]
    );
    if (!accepted) {
      return res.status(403).json({ message: 'Private chat is available after request acceptance.' });
    }

    await run(
      `INSERT INTO CourseCollabMessages (course_id, from_user_id, to_user_id, content)
       VALUES (?, ?, ?, ?)`,
      [course.id, userId, peerId, content.trim()]
    );

    const created = await get<{ id: number; created_at: string; name: string }>(
      `SELECT m.id, m.created_at, u.name
       FROM CourseCollabMessages m
       JOIN Users u ON u.id = m.from_user_id
       WHERE m.course_id = ? AND m.from_user_id = ? AND m.to_user_id = ?
       ORDER BY m.id DESC
       LIMIT 1`,
      [course.id, userId, peerId]
    );
    if (!created) {
      return res.status(500).json({ message: 'Failed to send private message.' });
    }

    return res.status(201).json({
      message: {
        id: created.id,
        userId,
        userName: created.name,
        content: content.trim(),
        createdAt: created.created_at,
        isMe: true
      }
    });
  }
);

courseRouter.post(
  '/:slug/chat',
  [body('content').isString().isLength({ min: 1, max: 1000 }).trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!.userId;
    const { slug } = req.params;
    const { content } = req.body as { content: string };

    const course = await get<{ id: number; title: string }>(
      'SELECT id, title FROM Courses WHERE slug = ?',
      [slug]
    );
    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const progress = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM UserProgress WHERE user_id = ? AND course_id = ?',
      [userId, course.id]
    );
    if (!progress || !progress.count) {
      return res
        .status(403)
        .json({ message: 'You need progress in this course before joining the discussion.' });
    }

    await run(
      `INSERT INTO CourseMessages (course_id, user_id, content)
       VALUES (?, ?, ?)`,
      [course.id, userId, content.trim()]
    );

    const created = await get<{
      id: number;
      user_id: number;
      content: string;
      created_at: string;
      name: string;
    }>(
      `SELECT m.id, m.user_id, m.content, m.created_at, u.name
       FROM CourseMessages m
       JOIN Users u ON u.id = m.user_id
       WHERE m.course_id = ? AND m.user_id = ?
       ORDER BY m.id DESC
       LIMIT 1`,
      [course.id, userId]
    );

    if (!created) {
      return res.status(500).json({ message: 'Failed to create message.' });
    }

    return res.status(201).json({
      message: {
        id: created.id,
        userId: created.user_id,
        userName: created.name,
        content: created.content,
        createdAt: created.created_at,
        isMe: true
      }
    });
  }
);

