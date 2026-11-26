import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { config } from '../config.js';
import { buildSeedGames, vendors as seedVendors } from '../data/seed.js';

const SCHEMA_FILE = new URL('../../db/schema.sql', import.meta.url);

export function createPool(overrides = {}) {
  return mysql.createPool({
    ...config.db,
    ...overrides,
    timezone: 'Z',
    connectionLimit: 5,
  });
}

export async function resetDatabase(pool) {
  const schema = await readFile(SCHEMA_FILE, 'utf8');
  const statements = schema
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map((sql) => sql.trim())
    .filter(Boolean);

  for (const sql of statements) await pool.query(sql);

  await pool.query('INSERT INTO vendors (id, code, name) VALUES ?', [
    seedVendors.map((vendor, index) => [index + 1, vendor.code, vendor.name]),
  ]);

  const vendorMap = Object.fromEntries(seedVendors.map((v, i) => [v.code, i + 1]));

  await pool.query(
    'INSERT INTO games (id, vendor_id, game_code, title, title_jp, type, is_active, sort_order, created_at) VALUES ?',
    [
      buildSeedGames().map((game) => [
        game.id,
        vendorMap[game.vendorCode],
        game.gameCode,
        game.title,
        game.titleJp,
        game.type,
        game.active,
        game.sort,
        new Date(game.createdAt),
      ]),
    ]
  );
}
