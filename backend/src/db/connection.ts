import path from 'path';
import fs from 'fs';
import sqlite3 from 'sqlite3';

sqlite3.verbose();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

export let db: sqlite3.Database;

export async function initDb(): Promise<void> {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new sqlite3.Database(DB_PATH);

  await run(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS Courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      total_units INTEGER NOT NULL DEFAULT 0
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS Units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      unit_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      is_detailed_version_of INTEGER,
      content TEXT,
      detailed_content TEXT,
      FOREIGN KEY (course_id) REFERENCES Courses(id),
      FOREIGN KEY (is_detailed_version_of) REFERENCES Units(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS Quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      total_marks INTEGER NOT NULL,
      FOREIGN KEY (unit_id) REFERENCES Units(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS Questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL,
      explanation TEXT,
      FOREIGN KEY (quiz_id) REFERENCES Quizzes(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS UserProgress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      is_unlocked INTEGER NOT NULL DEFAULT 0,
      last_score INTEGER,
      last_attempt_at DATETIME,
      UNIQUE (user_id, unit_id),
      FOREIGN KEY (user_id) REFERENCES Users(id),
      FOREIGN KEY (course_id) REFERENCES Courses(id),
      FOREIGN KEY (unit_id) REFERENCES Units(id)
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS Scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id),
      FOREIGN KEY (quiz_id) REFERENCES Quizzes(id),
      FOREIGN KEY (unit_id) REFERENCES Units(id)
    );
  `);

  // Multi-AI summary: store combined summaries from ChatGPT, Gemini, Grok, etc.
  await run(`
    CREATE TABLE IF NOT EXISTS AISummaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      prompt_used TEXT NOT NULL,
      combined_summary TEXT NOT NULL,
      providers_used TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id)
    );
  `);

  // Course-level discussion messages for peer learning
  await run(`
    CREATE TABLE IF NOT EXISTS CourseMessages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES Courses(id),
      FOREIGN KEY (user_id) REFERENCES Users(id)
    );
  `);

  // Daily study activity (one row per user per calendar day)
  await run(`
    CREATE TABLE IF NOT EXISTS UserDailyActivity (
      user_id INTEGER NOT NULL,
      active_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES Users(id),
      PRIMARY KEY (user_id, active_date)
    );
  `);

  // Admin → student messages (nudges, lag alerts)
  await run(`
    CREATE TABLE IF NOT EXISTS AdminMessages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      admin_user_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id),
      FOREIGN KEY (admin_user_id) REFERENCES Users(id)
    );
  `);
}

export function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

export function all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

