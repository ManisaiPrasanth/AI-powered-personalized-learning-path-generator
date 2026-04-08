"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentInboxRouter = void 0;
/**
 * Student inbox: messages sent by admins.
 */
const express_1 = require("express");
const connection_1 = require("../db/connection");
exports.studentInboxRouter = (0, express_1.Router)();
exports.studentInboxRouter.get('/', async (req, res) => {
    const userId = req.user.userId;
    if (req.user.role !== 'student') {
        return res.json({ messages: [] });
    }
    const rows = await (0, connection_1.all)(`SELECT m.id, m.subject, m.body, m.created_at, m.is_read, a.name as admin_name
     FROM AdminMessages m
     JOIN Users a ON a.id = m.admin_user_id
     WHERE m.user_id = ?
     ORDER BY m.created_at DESC`, [userId]);
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
exports.studentInboxRouter.post('/:id/read', async (req, res) => {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    await (0, connection_1.run)(`UPDATE AdminMessages SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
    return res.json({ ok: true });
});
