export function createContactService(pool, emailService) {
  return {
    async getCompanyInfo() {
      const [rows] = await pool.query(
        `SELECT company_name AS companyName, address, phone, email,
                working_hours AS workingHours, lat, lng
         FROM company_settings WHERE id = 1`
      );
      return rows[0] || null;
    },

    async updateCompanyInfo({ companyName, address, phone, email, workingHours, lat, lng }) {
      await pool.query(
        `UPDATE company_settings
         SET company_name = ?, address = ?, phone = ?, email = ?, working_hours = ?, lat = ?, lng = ?
         WHERE id = 1`,
        [companyName, address, phone, email, workingHours, Number(lat), Number(lng)]
      );
      return this.getCompanyInfo();
    },

    async submitContact({ accountId, fullName, email, subject, address, lat, lng, message, io }) {
      const [result] = await pool.query(
        `INSERT INTO contact_messages (account_id, full_name, email, subject, address, lat, lng, message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [accountId || null, fullName, email, subject, address || null, lat ?? null, lng ?? null, message]
      );

      const [rows] = await pool.query(
        `SELECT id, account_id AS accountId, full_name AS fullName, email, subject,
                address, lat, lng, message, is_read AS isRead,
                admin_reply AS adminReply, replied_at AS repliedAt, created_at AS createdAt
         FROM contact_messages WHERE id = ?`,
        [result.insertId]
      );
      const createdMessage = rows[0];

      const company = await this.getCompanyInfo();
      const receiverEmail = process.env.EMAIL_USER || company?.email;

      const mapLink =
        lat && lng
          ? `<p><b>Tọa độ bản đồ:</b> <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}" target="_blank">${lat}, ${lng}</a></p>`
          : '';

      await emailService.sendMail({
        to: receiverEmail,
        subject: `[Liên hệ mới] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #1976d2;">Tin nhắn liên hệ mới từ Game Catalog</h2>
            <p><b>Người gửi:</b> ${fullName} (${email})</p>
            <p><b>Tiêu đề:</b> ${subject}</p>
            <p><b>Địa chỉ đã chọn:</b> ${address || 'Không cung cấp'}</p>
            ${mapLink}
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p><b>Nội dung:</b></p>
            <p style="white-space: pre-line; background: #f8f9fa; padding: 12px; border-radius: 6px;">${message}</p>
          </div>
        `,
      });

      if (io && createdMessage) {
        io.to('room:admins').emit('inbox:new_message', createdMessage);
      }

      return createdMessage;
    },

    async getMessages() {
      const [rows] = await pool.query(
        `SELECT id, account_id AS accountId, full_name AS fullName, email, subject,
                address, lat, lng, message, is_read AS isRead,
                admin_reply AS adminReply, replied_at AS repliedAt, created_at AS createdAt
         FROM contact_messages
         ORDER BY created_at DESC
         LIMIT 100`
      );
      const unreadCount = rows.filter((r) => !r.isRead).length;
      return { messages: rows, unreadCount };
    },

    async markAsRead(id) {
      await pool.query(`UPDATE contact_messages SET is_read = 1 WHERE id = ?`, [id]);
      const [rows] = await pool.query(
        `SELECT id, account_id AS accountId, full_name AS fullName, email, subject,
                address, lat, lng, message, is_read AS isRead,
                admin_reply AS adminReply, replied_at AS repliedAt, created_at AS createdAt
         FROM contact_messages WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    },

    async replyMessage(id, replyText) {
      const [rows] = await pool.query(
        `SELECT id, full_name AS fullName, email, subject, message
         FROM contact_messages WHERE id = ?`,
        [id]
      );
      const target = rows[0];
      if (!target) {
        const err = new Error('Không tìm thấy tin nhắn liên hệ.');
        err.statusCode = 404;
        throw err;
      }

      await emailService.sendMail({
        to: target.email,
        subject: `Re: ${target.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <p>Xin chào <b>${target.fullName}</b>,</p>
            <p style="white-space: pre-line; background: #f8f9fa; padding: 12px; border-radius: 6px;">${replyText}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="font-size: 12px; color: #777;">Tin nhắn gốc của bạn: "${target.message}"</p>
          </div>
        `,
      });

      await pool.query(
        `UPDATE contact_messages
         SET admin_reply = ?, replied_at = NOW(), is_read = 1
         WHERE id = ?`,
        [replyText, id]
      );

      const [updatedRows] = await pool.query(
        `SELECT id, account_id AS accountId, full_name AS fullName, email, subject,
                address, lat, lng, message, is_read AS isRead,
                admin_reply AS adminReply, replied_at AS repliedAt, created_at AS createdAt
         FROM contact_messages WHERE id = ?`,
        [id]
      );
      return updatedRows[0];
    },
  };
}
