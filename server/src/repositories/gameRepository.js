const GAME_COLUMNS = `
  id, vendor_id AS vendorId, game_code AS gameCode, title, title_jp AS titleJp,
  image_url AS imageUrl,type, is_active AS isActive, sort_order AS sortOrder, created_at AS createdAt
`;

const UPDATABLE_COLUMNS = {
  isActive: 'is_active',
  sortOrder: 'sort_order',
  titleJp: 'title_jp',
  title: 'title',
  type: 'type',
  imageUrl: 'image_url',
};
const SORTABLE_COLUMNS = { sortOrder: 'sort_order', title: 'title', createdAt: 'created_at' };

export function createGameRepository({ pool }) {
  async function findOne(where, params) {
    const [rows] = await pool.query(`SELECT ${GAME_COLUMNS} FROM games WHERE ${where} LIMIT 1`, params);
    return toGame(rows[0]);
  }

  return {
    async findPage({ search, vendorId, type, isActive, sortBy, order, limit, offset }) {
      const conditions = ['1=1'];
      const params = [];

      if (search) {
        const pattern = `%${escapeLike(search)}%`;
        conditions.push('(title LIKE ? OR game_code LIKE ? OR title_jp LIKE ?)');
        params.push(pattern, pattern, pattern);
      }
      if (vendorId) {
        conditions.push('vendor_id = ?');
        params.push(vendorId);
      }
      if (type) {
        conditions.push('type = ?');
        params.push(type);
      }
      if (typeof isActive === 'boolean') {
        conditions.push('is_active = ?');
        params.push(isActive);
      }

      const where = `WHERE ${conditions.join(' AND ')}`;
      const column = SORTABLE_COLUMNS[sortBy] ?? 'sort_order';
      const direction = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const [[rows], [[{ total }]]] = await Promise.all([
        pool.query(
          `SELECT ${GAME_COLUMNS} FROM games ${where} ORDER BY ${column} ${direction}, id ${direction} LIMIT ? OFFSET ?`,
          [...params, limit, offset]
        ),
        pool.query(`SELECT COUNT(*) AS total FROM games ${where}`, params),
      ]);

      return { rows: rows.map(toGame), total };
    },

    findById(id) {
      return findOne('id = ?', [id]);
    },

    findByVendorAndCode(vendorId, gameCode) {
      return findOne('vendor_id = ? AND game_code = ?', [vendorId, gameCode]);
    },

    async create(data) {
      const [result] = await pool.query(
        `INSERT INTO games (vendor_id, game_code, title, title_jp, image_url, type, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.vendorId,
          data.gameCode,
          data.title,
          data.titleJp,
          data.imageUrl || null,
          data.type,
          data.isActive ?? 1,
          data.sortOrder ?? 0,
        ]
      );
      return this.findById(result.insertId);
    },

    async update(id, changes) {
      const fields = Object.keys(changes).filter((field) => field in UPDATABLE_COLUMNS);
      if (!fields.length) return this.findById(id);

      const assignments = fields.map((field) => `${UPDATABLE_COLUMNS[field]} = ?`).join(', ');
      const values = fields.map((field) => changes[field]);
      const [result] = await pool.query(`UPDATE games SET ${assignments} WHERE id = ?`, [...values, id]);

      return result.affectedRows ? this.findById(id) : null;
    },

    async bulkUpdateActive(ids, isActive) {
      if (!ids || ids.length === 0) return 0;
      const [result] = await pool.query(`UPDATE games SET is_active = ? WHERE id IN (?)`, [isActive, ids]);
      return result.affectedRows;
    },

    async delete(id) {
      const [result] = await pool.query('UPDATE games SET is_active = 0 WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },

    async findVendors() {
      const [rows] = await pool.query('SELECT id, code, name FROM vendors ORDER BY code');
      return rows.map((row) => ({ ...row }));
    },

    async checkDuplicateTitle(vendorId, title, excludeGameId = null) {
      let query = `
        SELECT id FROM games 
        WHERE vendor_id = ? 
        AND LOWER(TRIM(title)) = LOWER(TRIM(?))
      `;
      const params = [vendorId, title];

      if (excludeGameId) {
        query += ' AND id != ?';
        params.push(excludeGameId);
      }

      const [rows] = await pool.query(query, params);
      return rows.length > 0;
    },

    async getStats() {
      const [[totals]] = await pool.query(`
        SELECT
          COUNT(*) AS totalGames,
          COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS activeGames
        FROM games
      `);

      const [vendorStats] = await pool.query(`
        SELECT
          v.id AS vendorId,
          v.code AS vendorCode,
          v.name AS vendorName,
          COUNT(g.id) AS gameCount
        FROM vendors v
        LEFT JOIN games g ON g.vendor_id = v.id
        GROUP BY v.id, v.code, v.name
        ORDER BY v.code
      `);

      return {
        totalGames: Number(totals.totalGames),
        activeGames: Number(totals.activeGames),
        gamesByVendor: vendorStats.map((row) => ({
          vendorId: row.vendorId,
          vendorCode: row.vendorCode,
          vendorName: row.vendorName,
          gameCount: Number(row.gameCount),
        })),
      };
    },

    async vendorExists(id) {
      const [rows] = await pool.query('SELECT 1 FROM vendors WHERE id = ? LIMIT 1', [id]);
      return rows.length > 0;
    },
  };
}

function toGame(row) {
  return row ? { ...row, isActive: row.isActive === 1, createdAt: row.createdAt.toISOString() } : null;
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}
