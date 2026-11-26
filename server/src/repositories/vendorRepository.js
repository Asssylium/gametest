export function createVendorRepository({ pool }) {
  return {
    async findById(id) {
      const [rows] = await pool.query('SELECT * FROM vendors WHERE id = ? LIMIT 1', [id]);
      return rows[0] || null;
    },
    async findByCode(code) {
      const [rows] = await pool.query('SELECT * FROM vendors WHERE code = ? LIMIT 1', [code]);
      return rows[0] || null;
    },
    async update(id, data) {
      const [result] = await pool.query('UPDATE vendors SET name = ?, code = ? WHERE id = ?', [
        data.name,
        data.code,
        id,
      ]);
      return result.affectedRows > 0 ? this.findById(id) : null;
    },
    async delete(id) {
      const [result] = await pool.query('UPDATE vendors SET is_active = 0 WHERE id = ?', [id]);
      return result.affectedRows > 0;
    },
    async countGames(vendorId) {
      const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM games WHERE vendor_id = ?', [vendorId]);
      return Number(count);
    },
    async getGames(vendorId) {
      const [rows] = await pool.query('SELECT * FROM games WHERE vendor_id = ?', [vendorId]);
      return rows;
    },
    async findAll() {
      const [rows] = await pool.query('SELECT * FROM vendors ORDER BY sort_order ASC, code ASC');
      return rows;
    },
    async create(data) {
      const [result] = await pool.query('INSERT INTO vendors (code, name) VALUES (?, ?)', [data.code, data.name]);
      return this.findById(result.insertId);
    },
  };
}
