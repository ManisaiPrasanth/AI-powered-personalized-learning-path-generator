"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const connection_1 = require("../db/connection");
exports.courseRouter = (0, express_1.Router)();
exports.courseRouter.get('/', async (req, res) => {
    const userId = req.user?.userId;
    const courses = await (0, connection_1.all)('SELECT id, title, slug, description, total_units FROM Courses ORDER BY id');
    if (!userId) {
        return res.json(courses.map((c) => ({
            ...c,
            completionPercent: 0
        })));
    }
    const result = [];
    for (const course of courses) {
        if (course.total_units === 0) {
            result.push({ ...course, completionPercent: 0 });
            continue;
        }
        const completed = await (0, connection_1.get)(`SELECT COUNT(*) as completedCount
       FROM UserProgress up
       JOIN Units u ON u.id = up.unit_id
       WHERE up.user_id = ? AND up.course_id = ? AND up.is_completed = 1 AND u.is_detailed_version_of IS NULL`, [userId, course.id]);
        const completedCount = completed?.completedCount ?? 0;
        const completionPercent = course.total_units > 0 ? Math.round((completedCount / course.total_units) * 100) : 0;
        result.push({ ...course, completionPercent });
    }
    return res.json(result);
});
exports.courseRouter.get('/:slug', async (req, res) => {
    const userId = req.user.userId;
    const { slug } = req.params;
    const course = await (0, connection_1.get)('SELECT * FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
    }
    const baseUnits = await (0, connection_1.all)('SELECT id, unit_number, title FROM Units WHERE course_id = ? AND is_detailed_version_of IS NULL ORDER BY unit_number', [course.id]);
    if (baseUnits.length > 0) {
        const progressRows = await (0, connection_1.all)('SELECT unit_id FROM UserProgress WHERE user_id = ? AND course_id = ?', [userId, course.id]);
        if (progressRows.length === 0) {
            const firstUnit = baseUnits[0];
            await (0, connection_1.run)(`INSERT INTO UserProgress (user_id, course_id, unit_id, is_unlocked, is_completed)
         VALUES (?, ?, ?, 1, 0)`, [userId, course.id, firstUnit.id]);
        }
    }
    const unitProgress = await (0, connection_1.all)('SELECT unit_id, is_unlocked, is_completed, last_score FROM UserProgress WHERE user_id = ? AND course_id = ?', [userId, course.id]);
    const progressByUnit = new Map();
    for (const p of unitProgress) {
        progressByUnit.set(p.unit_id, {
            is_unlocked: !!p.is_unlocked,
            is_completed: !!p.is_completed,
            last_score: p.last_score
        });
    }
    const detailedUnits = await (0, connection_1.all)('SELECT id, is_detailed_version_of FROM Units WHERE course_id = ? AND is_detailed_version_of IS NOT NULL', [course.id]);
    const hasDetailedByBaseId = new Set();
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
exports.courseRouter.get('/:slug/units/:unitNumber', async (req, res) => {
    const userId = req.user.userId;
    const { slug, unitNumber } = req.params;
    const course = await (0, connection_1.get)('SELECT id FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
    }
    const unit = await (0, connection_1.get)('SELECT id, title, content FROM Units WHERE course_id = ? AND unit_number = ? AND is_detailed_version_of IS NULL', [course.id, Number(unitNumber)]);
    if (!unit) {
        return res.status(404).json({ message: 'Unit not found.' });
    }
    const progress = await (0, connection_1.get)('SELECT is_unlocked FROM UserProgress WHERE user_id = ? AND unit_id = ?', [userId, unit.id]);
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
exports.courseRouter.get('/:slug/units/:unitNumber/detailed', async (req, res) => {
    const userId = req.user.userId;
    const { slug, unitNumber } = req.params;
    const course = await (0, connection_1.get)('SELECT id FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
    }
    const baseUnit = await (0, connection_1.get)('SELECT id, title FROM Units WHERE course_id = ? AND unit_number = ? AND is_detailed_version_of IS NULL', [course.id, Number(unitNumber)]);
    if (!baseUnit) {
        return res.status(404).json({ message: 'Unit not found.' });
    }
    const progress = await (0, connection_1.get)('SELECT last_score, is_completed FROM UserProgress WHERE user_id = ? AND unit_id = ?', [userId, baseUnit.id]);
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
    const detailedUnit = await (0, connection_1.get)('SELECT id, detailed_content FROM Units WHERE course_id = ? AND unit_number = ? AND is_detailed_version_of = ?', [course.id, Number(unitNumber), baseUnit.id]);
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
exports.courseRouter.get('/:slug/chat', async (req, res) => {
    const userId = req.user.userId;
    const { slug } = req.params;
    const course = await (0, connection_1.get)('SELECT id, title FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
    }
    // Ensure the user has some progress in this course before joining chat
    const progress = await (0, connection_1.get)('SELECT COUNT(*) as count FROM UserProgress WHERE user_id = ? AND course_id = ?', [userId, course.id]);
    if (!progress || !progress.count) {
        return res
            .status(403)
            .json({ message: 'You need progress in this course before joining the discussion.' });
    }
    const messages = await (0, connection_1.all)(`SELECT m.id, m.user_id, m.content, m.created_at, u.name
     FROM CourseMessages m
     JOIN Users u ON u.id = m.user_id
     WHERE m.course_id = ?
     ORDER BY m.created_at ASC, m.id ASC
     LIMIT 200`, [course.id]);
    return res.json({
        course: { id: course.id, title: course.title, slug },
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
exports.courseRouter.post('/:slug/chat', [(0, express_validator_1.body)('content').isString().isLength({ min: 1, max: 1000 }).trim()], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const userId = req.user.userId;
    const { slug } = req.params;
    const { content } = req.body;
    const course = await (0, connection_1.get)('SELECT id, title FROM Courses WHERE slug = ?', [slug]);
    if (!course) {
        return res.status(404).json({ message: 'Course not found.' });
    }
    const progress = await (0, connection_1.get)('SELECT COUNT(*) as count FROM UserProgress WHERE user_id = ? AND course_id = ?', [userId, course.id]);
    if (!progress || !progress.count) {
        return res
            .status(403)
            .json({ message: 'You need progress in this course before joining the discussion.' });
    }
    await (0, connection_1.run)(`INSERT INTO CourseMessages (course_id, user_id, content)
       VALUES (?, ?, ?)`, [course.id, userId, content.trim()]);
    const created = await (0, connection_1.get)(`SELECT m.id, m.user_id, m.content, m.created_at, u.name
       FROM CourseMessages m
       JOIN Users u ON u.id = m.user_id
       WHERE m.course_id = ? AND m.user_id = ?
       ORDER BY m.id DESC
       LIMIT 1`, [course.id, userId]);
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
});
