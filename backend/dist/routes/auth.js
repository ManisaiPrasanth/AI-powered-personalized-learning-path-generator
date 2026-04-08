"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = require("../db/connection");
const auth_1 = require("../middleware/auth");
function todayStr() {
    return new Date().toISOString().slice(0, 10);
}
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post('/register', [
    (0, express_validator_1.body)('name').isString().isLength({ min: 2 }),
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 })
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const existing = await (0, connection_1.get)('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing) {
        return res.status(409).json({ message: 'Email already registered.' });
    }
    const hash = await bcryptjs_1.default.hash(password, 10);
    await (0, connection_1.run)('INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, hash, 'student']);
    const user = await (0, connection_1.get)('SELECT id, role FROM Users WHERE email = ?', [email]);
    if (!user) {
        return res.status(500).json({ message: 'Failed to create user.' });
    }
    const token = (0, auth_1.generateToken)({ userId: user.id, role: user.role });
    return res.status(201).json({ token, user: { id: user.id, name, email, role: user.role } });
});
exports.authRouter.post('/login', [(0, express_validator_1.body)('email').isEmail(), (0, express_validator_1.body)('password').isString().isLength({ min: 1 })], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await (0, connection_1.get)('SELECT id, name, email, password_hash, role FROM Users WHERE email = ?', [email]);
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const match = await bcryptjs_1.default.compare(password, user.password_hash);
    if (!match) {
        return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Daily activity for students (used in admin analytics)
    if (user.role === 'student') {
        try {
            await (0, connection_1.run)(`INSERT OR IGNORE INTO UserDailyActivity (user_id, active_date) VALUES (?, ?)`, [user.id, todayStr()]);
        }
        catch {
            // ignore if table missing in old DB until migrate
        }
    }
    const token = (0, auth_1.generateToken)({ userId: user.id, role: user.role });
    return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
});
exports.authRouter.get('/me', async (req, res) => {
    // This could be protected by requireAuth at route level if desired.
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    return res.status(200).json({ message: 'Token valid.' });
});
