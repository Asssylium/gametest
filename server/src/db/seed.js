import { config } from '../config.js';
import { createPool } from './database.js';
import { buildSeedGames, vendors as seedVendors } from '../data/seed.js';

const pool = createPool();

try {
  for (const vendor of seedVendors) {
    await pool.query(
      `INSERT INTO vendors (code, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE code = code`,
      [vendor.code, vendor.name]
    );
  }

  const [dbVendors] = await pool.query('SELECT id, code FROM vendors');
  const vendorMap = Object.fromEntries(dbVendors.map((v) => [v.code, v.id]));

  for (const game of buildSeedGames()) {
    await pool.query(
      `INSERT INTO games
        (vendor_id, game_code, title, title_jp, type, is_active, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE game_code = game_code`,
      [
        vendorMap[game.vendorCode],
        game.gameCode,
        game.title,
        game.titleJp,
        game.type,
        game.active,
        game.sort,
        new Date(game.createdAt),
      ]
    );
  }

  console.log('Sample data seeded successfully.');
  console.log(`Database: ${config.db.database}`);
} catch (err) {
  console.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
