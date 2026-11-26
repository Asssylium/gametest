export function createMessageRepository(pool) {
  return {
    async create({ senderId, receiverId, content }) {
      const [result] = await pool.query(
        `INSERT INTO direct_messages (sender_id, receiver_id, content)
         VALUES (?, ?, ?)`,
        [senderId, receiverId, content]
      );

      const [rows] = await pool.query(
        `SELECT id, sender_id AS senderId, receiver_id AS receiverId,
                content, is_read AS isRead, created_at AS createdAt
         FROM direct_messages WHERE id = ?`,
        [result.insertId]
      );
      return rows[0];
    },

    async getConversation(userId, otherUserId, { limit = 50 } = {}) {
      const [rows] = await pool.query(
        `SELECT id, sender_id AS senderId, receiver_id AS receiverId,
                content, is_read AS isRead, created_at AS createdAt
         FROM direct_messages
         WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)
         ORDER BY created_at ASC
         LIMIT ?`,
        [userId, otherUserId, otherUserId, userId, Number(limit)]
      );
      return rows;
    },

    async markConversationRead(userId, senderId) {
      await pool.query(
        `UPDATE direct_messages
         SET is_read = 1
         WHERE receiver_id = ? AND sender_id = ? AND is_read = 0`,
        [userId, senderId]
      );
    },

    async getRecentPartners(userId) {
      const [rows] = await pool.query(
        `SELECT
           a.id,
           a.full_name AS fullName,
           a.email,
           a.role_id AS roleId,
           MAX(m.created_at) AS lastMessageAt,
           SUM(CASE WHEN m.receiver_id = ? AND m.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
         FROM direct_messages m
         JOIN accounts a
           ON a.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
         WHERE m.sender_id = ? OR m.receiver_id = ?
         GROUP BY a.id, a.full_name, a.email, a.role_id
         ORDER BY lastMessageAt DESC`,
        [userId, userId, userId, userId]
      );
      return rows;
    },
  };
}
