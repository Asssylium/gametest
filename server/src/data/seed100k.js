import { createPool } from '../db/database.js';

const TOTAL_GAMES = 100000;
const BATCH_SIZE = 5000;
const TYPES = ['SLOT', 'LIVE', 'TABLE'];

async function seed100k() {
  console.log(`Bắt đầu seed ${TOTAL_GAMES} games...`);
  const pool = createPool();

  try {
    const [vendors] = await pool.query('SELECT id FROM vendors');
    if (vendors.length === 0) throw new Error('Không có vendor nào, hãy chạy lệnh seed data mẫu trước!');
    const vendorIds = vendors.map((v) => v.id);

    for (let i = 0; i < TOTAL_GAMES; i += BATCH_SIZE) {
      const values = [];
      for (let j = 0; j < BATCH_SIZE; j++) {
        const index = i + j + 1;
        const vendorId = vendorIds[index % vendorIds.length];
        const type = TYPES[index % TYPES.length];
        const isActive = index % 2 === 0 ? 1 : 0;

        values.push([
          vendorId,
          `GAME_100K_${index}`,
          `Test Game Title ${index}`,
          null,
          type,
          isActive, // is_active
          index % 100, // sort_order
        ]);
      }

      await pool.query(
        `INSERT INTO games (vendor_id, game_code, title, title_jp, type, is_active, sort_order) VALUES ?`,
        [values]
      );
      console.log(`Đã insert ${i + BATCH_SIZE} / ${TOTAL_GAMES}`);
    }

    console.log('Seed 100.000 games hoàn tất!');
  } catch (error) {
    console.error('Lỗi trong quá trình seed:', error);
  } finally {
    await pool.end();
  }
}

seed100k();
