"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = void 0;
/**
 * Record daily study activity for analytics (students only).
 */
const express_1 = require("express");
const connection_1 = require("../db/connection");
exports.activityRouter = (0, express_1.Router)();
exports.activityRouter.post('/ping', async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;
    if (role !== 'student') {
        return res.json({ ok: true, skipped: true });
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
        await (0, connection_1.run)(`INSERT OR IGNORE INTO UserDailyActivity (user_id, active_date) VALUES (?, ?)`, [userId, today]);
    }
    catch {
        // ignore
    }
    return res.json({ ok: true, date: today });
});
