import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

import { get, run } from '../db/connection';
import { generateToken } from '../middleware/auth';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const authRouter = Router();

authRouter.post(
  '/register',
  [
    body('name').isString().isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const existing = await get<{ id: number }>('SELECT id FROM Users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hash = await bcrypt.hash(password, 10);

    await run(
      'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'student']
    );

    const user = await get<{ id: number; role: string }>(
      'SELECT id, role FROM Users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(500).json({ message: 'Failed to create user.' });
    }

    const token = generateToken({ userId: user.id, role: user.role });
    return res.status(201).json({ token, user: { id: user.id, name, email, role: user.role } });
  }
);

authRouter.post(
  '/login',
  [body('email').isEmail(), body('password').isString().isLength({ min: 1 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body as { email: string; password: string };

    const user = await get<{ id: number; name: string; email: string; password_hash: string; role: string }>(
      'SELECT id, name, email, password_hash, role FROM Users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Daily activity for students (used in admin analytics)
    if (user.role === 'student') {
      try {
        await run(
          `INSERT OR IGNORE INTO UserDailyActivity (user_id, active_date) VALUES (?, ?)`,
          [user.id, todayStr()]
        );
      } catch {
        // ignore if table missing in old DB until migrate
      }
    }

    const token = generateToken({ userId: user.id, role: user.role });
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  }
);

authRouter.get('/me', async (req: Request, res: Response) => {
  // This could be protected by requireAuth at route level if desired.
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  return res.status(200).json({ message: 'Token valid.' });
});

