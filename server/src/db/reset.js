// CLI: `npm run db:reset` recreates the tables in the configured database and loads sample data.
import { config } from '../config.js';
import { createPool, resetDatabase } from './database.js';

const pool = createPool();

try {
  await resetDatabase(pool);
  console.log(`Database "${config.db.database}" reset with sample data.`);
} catch (err) {
  console.error(`Reset failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
