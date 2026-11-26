export function createIdempotencyRepository(pool) {
  return {
    async findByScope({ key, userId, method, endpoint }) {
      const [rows] = await pool.query(
        `SELECT id, idempotency_key, user_id, http_method, endpoint, status, response_status, response_body
         FROM idempotency_keys
         WHERE idempotency_key = ? AND user_id = ? AND http_method = ? AND endpoint = ?
         LIMIT 1`,
        [key, userId, method, endpoint]
      );
      return rows[0] || null;
    },

    async insertProcessing({ key, userId, method, endpoint }) {
      try {
        const [result] = await pool.query(
          `INSERT INTO idempotency_keys (idempotency_key, user_id, http_method, endpoint, status)
           VALUES (?, ?, ?, ?, 'PROCESSING')`,
          [key, userId, method, endpoint]
        );
        return { inserted: true, id: result.insertId };
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return { inserted: false };
        }
        throw err;
      }
    },

    async markCompleted(id, { responseStatus, responseBody }) {
      await pool.query(
        `UPDATE idempotency_keys
         SET status = 'COMPLETED', response_status = ?, response_body = ?
         WHERE id = ?`,
        [responseStatus, JSON.stringify(responseBody), id]
      );
    },

    async markFailed(id) {
      await pool.query(
        `UPDATE idempotency_keys
         SET status = 'FAILED'
         WHERE id = ?`,
        [id]
      );
    },

    async retryFromFailed(id) {
      await pool.query(
        `UPDATE idempotency_keys
         SET status = 'PROCESSING', response_status = NULL, response_body = NULL
         WHERE id = ? AND status = 'FAILED'`,
        [id]
      );
    },
  };
}
