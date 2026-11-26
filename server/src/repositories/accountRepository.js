export function createAccountRepository(pool) {
  return {
    async findByEmail(email) {
      const query = 'SELECT * FROM accounts WHERE email = ? AND deleted_at IS NULL';
      const [rows] = await pool.query(query, [email]);
      return rows[0];
    },

    async findPage({ search, roleId, isActive, limit = 10, offset = 0 }) {
      const conditions = ['deleted_at IS NULL'];
      const params = [];

      if (search) {
        conditions.push('(email LIKE ? OR full_name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (roleId) {
        conditions.push('role_id = ?');
        params.push(roleId);
      }
      if (isActive !== undefined) {
        conditions.push('is_active = ?');
        params.push(isActive);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      const queryRows = `
        SELECT id, email, full_name as fullName, phone_number as phoneNumber, 
               address, role_id as roleId, avatar_url as avatarUrl, balance, is_active as isActive, created_at as createdAt 
        FROM accounts 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;

      const queryTotal = `SELECT COUNT(*) as total FROM accounts ${whereClause}`;

      const [[rows], [[{ total }]]] = await Promise.all([
        pool.query(queryRows, [...params, limit, offset]),
        pool.query(queryTotal, params),
      ]);

      return { rows, total };
    },

    async updateRole(id, roleId) {
      await pool.query('UPDATE accounts SET role_id = ? WHERE id = ? AND deleted_at IS NULL', [roleId, id]);
    },

    async updateStatus(id, isActive) {
      await pool.query('UPDATE accounts SET is_active = ? WHERE id = ? AND deleted_at IS NULL', [isActive, id]);
    },

    async create(accountData) {
      const { email, password, fullName, phoneNumber, address, roleId } = accountData;
      const query = `
        INSERT INTO accounts (email, password, full_name, phone_number, address, role_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.query(query, [
        email,
        password,
        fullName,
        phoneNumber || null,
        address || null,
        roleId || 3,
      ]);

      return result.insertId;
    },

    async findById(id) {
      const [rows] = await pool.query('SELECT * FROM accounts WHERE id = ?', [id]);
      return rows[0];
    },

    async updatePassword(id, newPasswordHash) {
      await pool.query('UPDATE accounts SET password = ? WHERE id = ?', [newPasswordHash, id]);
    },

    async updateProfile(id, profileData) {
      const query = `
        UPDATE accounts 
        SET 
          full_name = COALESCE(?, full_name),
          phone_number = COALESCE(?, phone_number),
          address = COALESCE(?, address),
          avatar_url = COALESCE(?, avatar_url)
        WHERE id = ?
      `;
      await pool.query(query, [
        profileData.fullName,
        profileData.phoneNumber,
        profileData.address,
        profileData.avatarUrl,
        id,
      ]);
    },
  };
}
