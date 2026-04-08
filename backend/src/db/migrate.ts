import { initDb } from './connection';

async function main() {
  try {
    await initDb();
    console.log('Database migrated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

main();

