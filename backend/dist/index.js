"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const connection_1 = require("./db/connection");
const ensureAdmin_1 = require("./db/ensureAdmin");
const auth_1 = require("./routes/auth");
const courses_1 = require("./routes/courses");
const quizzes_1 = require("./routes/quizzes");
const admin_1 = require("./routes/admin");
const activity_1 = require("./routes/activity");
const studentInbox_1 = require("./routes/studentInbox");
const translate_1 = require("./routes/translate");
const aiContent_1 = require("./routes/aiContent");
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_1.authRouter);
app.use('/api/courses', auth_2.requireAuth, courses_1.courseRouter);
app.use('/api/quizzes', auth_2.requireAuth, quizzes_1.quizRouter);
app.use('/api/admin', auth_2.requireAuth, auth_2.requireAdmin, admin_1.adminRouter);
app.use('/api/activity', auth_2.requireAuth, activity_1.activityRouter);
app.use('/api/inbox', auth_2.requireAuth, studentInbox_1.studentInboxRouter);
app.use('/api/translate', auth_2.requireAuth, translate_1.translateRouter);
app.use('/api/ai-content', auth_2.requireAuth, aiContent_1.aiContentRouter);
async function start() {
    await (0, connection_1.initDb)();
    await (0, ensureAdmin_1.ensureAdminUser)();
    app.listen(PORT, () => {
        console.log(`API server listening on port ${PORT}`);
    });
}
start().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});
