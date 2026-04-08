"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
/**
 * Admin module: analytics, learner scores, and targeted messages.
 */
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const connection_1 = require("../db/connection");
exports.adminRouter = (0, express_1.Router)();
/** GET /api/admin/overview — KPIs */
exports.adminRouter.get('/overview', async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const studentCount = await (0, connection_1.get)(`SELECT COUNT(*) as n FROM Users WHERE role = 'student'`);
    const activeToday = await (0, connection_1.get)(`SELECT COUNT(DISTINCT user_id) as n FROM UserDailyActivity WHERE active_date = ?`, [today]);
    const examsToday = await (0, connection_1.get)(`SELECT COUNT(*) as n FROM Scores WHERE date(created_at) = date('now')`);
    const totalExamAttempts = await (0, connection_1.get)(`SELECT COUNT(*) as n FROM Scores`);
    const avgScore = await (0, connection_1.get)(`SELECT AVG(score) as avg FROM Scores`);
    const laggingLearners = await (0, connection_1.get)(`SELECT COUNT(DISTINCT user_id) as n FROM UserProgress
     WHERE is_completed = 0 AND last_score IS NOT NULL AND last_score < 70`);
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
exports.adminRouter.get('/students', async (_req, res) => {
    const rows = await (0, connection_1.all)(`SELECT id, name, email, role, created_at FROM Users WHERE role = 'student' ORDER BY name`);
    const out = [];
    for (const u of rows) {
        const stats = await (0, connection_1.get)(`SELECT COUNT(*) as attempts, MAX(score) as best, MAX(created_at) as last FROM Scores WHERE user_id = ?`, [u.id]);
        const progress = await (0, connection_1.get)(`SELECT COUNT(*) as completed FROM UserProgress WHERE user_id = ? AND is_completed = 1`, [u.id]);
        const lastScoreRow = await (0, connection_1.get)(`SELECT last_score FROM UserProgress WHERE user_id = ? AND last_score IS NOT NULL ORDER BY last_attempt_at DESC LIMIT 1`, [u.id]);
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
exports.adminRouter.get('/students/:id/scores', async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ message: 'Invalid id.' });
    const user = await (0, connection_1.get)('SELECT id, name, email FROM Users WHERE id = ? AND role = ?', [id, 'student']);
    if (!user) {
        return res.status(404).json({ message: 'Student not found.' });
    }
    const scores = await (0, connection_1.all)(`SELECT s.id, s.score, s.passed, s.created_at, s.unit_id, u.unit_number, u.title
     FROM Scores s
     JOIN Units u ON u.id = s.unit_id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC`, [id]);
    return res.json({ user, scores });
});
/** POST /api/admin/messages — send message to a student */
exports.adminRouter.post('/messages', [
    (0, express_validator_1.body)('userId').isInt({ gt: 0 }),
    (0, express_validator_1.body)('subject').isString().isLength({ min: 1, max: 200 }).trim(),
    (0, express_validator_1.body)('body').isString().isLength({ min: 1, max: 4000 }).trim()
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const adminId = req.user.userId;
    const { userId, subject, body: text } = req.body;
    const target = await (0, connection_1.get)('SELECT id, role FROM Users WHERE id = ?', [userId]);
    if (!target || target.role !== 'student') {
        return res.status(400).json({ message: 'Target must be a student user.' });
    }
    await (0, connection_1.run)(`INSERT INTO AdminMessages (user_id, admin_user_id, subject, body) VALUES (?, ?, ?, ?)`, [userId, adminId, subject, text]);
    const row = await (0, connection_1.get)('SELECT id FROM AdminMessages WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
    return res.status(201).json({ messageId: row?.id ?? null, ok: true });
});
/** GET /api/admin/messages — recent admin messages sent */
exports.adminRouter.get('/messages', async (_req, res) => {
    const rows = await (0, connection_1.all)(`SELECT m.id, m.user_id, m.subject, m.body, m.created_at, u.name as student_name, u.email as student_email
     FROM AdminMessages m
     JOIN Users u ON u.id = m.user_id
     ORDER BY m.created_at DESC
     LIMIT 100`);
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
