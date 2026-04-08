/**
 * Ensures a default admin account exists (idempotent).
 * Credentials are documented in README / project docs — change password after first deploy.
 */
import bcrypt from 'bcryptjs';
import { get, run } from './connection';

export const DEFAULT_ADMIN_EMAIL = 'admin@ailearning.local';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@2025!';

export async function ensureAdminUser(): Promise<void> {
  const existing = await get<{ id: number }>('SELECT id FROM Users WHERE email = ?', [
    DEFAULT_ADMIN_EMAIL
  ]);
  if (existing) {
    return;
  }
  const hash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await run(
    `INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['Platform Admin', DEFAULT_ADMIN_EMAIL, hash, 'admin']
  );
}
