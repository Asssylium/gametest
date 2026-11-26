export function createOtpRepository(pool) {
  return {
    async saveOtp(email, otp, expiresAt) {
      const query = `
        INSERT INTO email_verifications (email, otp, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))
      `;
      const [result] = await pool.query(query, [email, otp]);
      return result.insertId;
    },

    async getValidOtp(email, otp) {
      const query = `
        SELECT * FROM email_verifications
        WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const [rows] = await pool.query(query, [email, otp]);
      return rows[0];
    },

    async markAsUsed(id) {
      await pool.query('UPDATE email_verifications SET is_used = 1 WHERE id = ?', [id]);
    },
  };
}
