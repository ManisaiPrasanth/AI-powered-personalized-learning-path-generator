"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ADMIN_PASSWORD = exports.DEFAULT_ADMIN_EMAIL = void 0;
exports.ensureAdminUser = ensureAdminUser;
/**
 * Ensures a default admin account exists (idempotent).
 * Credentials are documented in README / project docs — change password after first deploy.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connection_1 = require("./connection");
exports.DEFAULT_ADMIN_EMAIL = 'admin@ailearning.local';
exports.DEFAULT_ADMIN_PASSWORD = 'Admin@2025!';
async function ensureAdminUser() {
    const existing = await (0, connection_1.get)('SELECT id FROM Users WHERE email = ?', [
        exports.DEFAULT_ADMIN_EMAIL
    ]);
    if (existing) {
        return;
    }
    const hash = await bcryptjs_1.default.hash(exports.DEFAULT_ADMIN_PASSWORD, 10);
    await (0, connection_1.run)(`INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`, ['Platform Admin', exports.DEFAULT_ADMIN_EMAIL, hash, 'admin']);
}
