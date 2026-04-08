import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import { initDb } from './db/connection';
import { ensureAdminUser } from './db/ensureAdmin';
import { authRouter } from './routes/auth';
import { courseRouter } from './routes/courses';
import { quizRouter } from './routes/quizzes';
import { adminRouter } from './routes/admin';
import { activityRouter } from './routes/activity';
import { studentInboxRouter } from './routes/studentInbox';
import { translateRouter } from './routes/translate';
import { aiContentRouter } from './routes/aiContent';
import { requireAuth, requireAdmin } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/courses', requireAuth, courseRouter);
app.use('/api/quizzes', requireAuth, quizRouter);
app.use('/api/admin', requireAuth, requireAdmin, adminRouter);
app.use('/api/activity', requireAuth, activityRouter);
app.use('/api/inbox', requireAuth, studentInboxRouter);
app.use('/api/translate', requireAuth, translateRouter);
app.use('/api/ai-content', requireAuth, aiContentRouter);

async function start() {
  await initDb();
  await ensureAdminUser();

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});

