import { nextId } from '../db/mongoDatabase.js';

function toMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    fullName: row.full_name,
    email: row.email,
    subject: row.subject,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    message: row.message,
    isRead: row.is_read,
    adminReply: row.admin_reply,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  };
}

export function createMongoContactService(db, emailService) {
  const settings = db.collection('company_settings');
  const messages = db.collection('contact_messages');
  return {
    async getCompanyInfo() {
      const row = await settings.findOne({ id: 1 });
      return row
        ? {
            companyName: row.company_name,
            address: row.address,
            phone: row.phone,
            email: row.email,
            workingHours: row.working_hours,
            lat: row.lat,
            lng: row.lng,
          }
        : null;
    },
    async updateCompanyInfo(data) {
      await settings.updateOne(
        { id: 1 },
        {
          $set: {
            company_name: data.companyName,
            address: data.address,
            phone: data.phone,
            email: data.email,
            working_hours: data.workingHours,
            lat: Number(data.lat),
            lng: Number(data.lng),
          },
        },
        { upsert: true }
      );
      return this.getCompanyInfo();
    },
    async submitContact({ accountId, fullName, email, subject, address, lat, lng, message, io }) {
      const row = {
        id: await nextId(db, 'contact_messages'),
        account_id: accountId || null,
        full_name: fullName,
        email,
        subject,
        address: address || null,
        lat: lat == null ? null : Number(lat),
        lng: lng == null ? null : Number(lng),
        message,
        is_read: 0,
        admin_reply: null,
        replied_at: null,
        created_at: new Date(),
      };
      await messages.insertOne(row);
      const company = await this.getCompanyInfo();
      const mapLink =
        lat != null && lng != null
          ? `<p><a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}">${lat}, ${lng}</a></p>`
          : '';
      await emailService.sendMail({
        to: process.env.EMAIL_USER || company?.email,
        subject: `[Liên hệ mới] ${subject}`,
        html: `<p>${fullName} (${email})</p><p>${subject}</p><p>${address || ''}</p>${mapLink}<p>${message}</p>`,
      });
      const created = toMessage(row);
      if (io) io.to('room:admins').emit('inbox:new_message', created);
      return created;
    },
    async getMessages() {
      const rows = (await messages.find({}).sort({ created_at: -1 }).limit(100).toArray()).map(toMessage);
      return { messages: rows, unreadCount: rows.filter((row) => !row.isRead).length };
    },
    async markAsRead(id) {
      return toMessage(
        await messages.findOneAndUpdate({ id: Number(id) }, { $set: { is_read: 1 } }, { returnDocument: 'after' })
      );
    },
    async replyMessage(id, replyText) {
      const target = await messages.findOne({ id: Number(id) });
      if (!target) {
        const error = new Error('Không tìm thấy tin nhắn liên hệ.');
        error.statusCode = 404;
        throw error;
      }
      await emailService.sendMail({
        to: target.email,
        subject: `Re: ${target.subject}`,
        html: `<p>Xin chào <b>${target.full_name}</b>,</p><p>${replyText}</p><p>${target.message}</p>`,
      });
      return toMessage(
        await messages.findOneAndUpdate(
          { id: Number(id) },
          { $set: { admin_reply: replyText, replied_at: new Date(), is_read: 1 } },
          { returnDocument: 'after' }
        )
      );
    },
  };
}
