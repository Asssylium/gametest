export function createEmailRepository(pool) {
  return {
    async createScheduledEmail(data) {
      const { senderId, targets, subject, content, scheduledAt } = data;

      const targetsJson = JSON.stringify(targets);

      const [result] = await pool.query(
        `INSERT INTO scheduled_emails (sender_id, target_role, subject, content, scheduled_at, status) 
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        [senderId, targetsJson, subject, content, scheduledAt]
      );
      return result.insertId;
    },

    async getPendingEmails(now) {
      const [rows] = await pool.query(`SELECT * FROM scheduled_emails WHERE status = 'PENDING' AND scheduled_at <= ?`, [
        now,
      ]);
      return rows;
    },

    async updateStatus(id, status) {
      await pool.query(`UPDATE scheduled_emails SET status = ? WHERE id = ?`, [status, id]);
    },
  };
}
