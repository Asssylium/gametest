import { nextId } from '../db/mongoDatabase.js';

function withoutMongoId(document) {
  if (!document) return null;
  const { _id, ...result } = document;
  return result;
}

export function createMongoVendorRepository(db) {
  const vendors = db.collection('vendors');
  const games = db.collection('games');
  return {
    async findById(id) {
      return withoutMongoId(await vendors.findOne({ id: Number(id) }));
    },
    async findByCode(code) {
      return withoutMongoId(await vendors.findOne({ code }));
    },
    async update(id, data) {
      await vendors.updateOne({ id: Number(id) }, { $set: { name: data.name, code: data.code } });
      return this.findById(id);
    },
    async delete(id) {
      return (await vendors.updateOne({ id: Number(id) }, { $set: { is_active: 0 } })).matchedCount > 0;
    },
    async countGames(vendorId) {
      return games.countDocuments({ vendor_id: Number(vendorId) });
    },
    async getGames(vendorId) {
      return (await games.find({ vendor_id: Number(vendorId) }).toArray()).map(withoutMongoId);
    },
    async findAll() {
      return (await vendors.find({}).sort({ sort_order: 1, code: 1 }).toArray()).map(withoutMongoId);
    },
    async create(data) {
      const vendor = {
        id: await nextId(db, 'vendors'),
        code: data.code,
        name: data.name,
        sort_order: 0,
        is_active: 1,
        created_at: new Date(),
      };
      await vendors.insertOne(vendor);
      return withoutMongoId(vendor);
    },
  };
}

export function createMongoAccountRepository(db) {
  const accounts = db.collection('accounts');
  return {
    async findByEmail(email) {
      return withoutMongoId(await accounts.findOne({ email, deleted_at: null }));
    },
    async findById(id) {
      return withoutMongoId(await accounts.findOne({ id: Number(id) }));
    },
    async findPage({ search, roleId, isActive, limit = 10, offset = 0 }) {
      const filter = { deleted_at: null };
      if (search) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ email: pattern }, { full_name: pattern }];
      }
      if (roleId) filter.role_id = Number(roleId);
      if (isActive !== undefined) filter.is_active = Number(isActive);
      const [documents, total] = await Promise.all([
        accounts.find(filter).sort({ created_at: -1 }).skip(offset).limit(limit).toArray(),
        accounts.countDocuments(filter),
      ]);
      const rows = documents.map((account) => ({
        id: account.id,
        email: account.email,
        fullName: account.full_name,
        phoneNumber: account.phone_number,
        address: account.address,
        roleId: account.role_id,
        avatarUrl: account.avatar_url,
        balance: account.balance,
        isActive: account.is_active,
        createdAt: account.created_at,
      }));
      return { rows, total };
    },
    async updateRole(id, roleId) {
      await accounts.updateOne({ id: Number(id), deleted_at: null }, { $set: { role_id: Number(roleId) } });
    },
    async updateStatus(id, isActive) {
      await accounts.updateOne({ id: Number(id), deleted_at: null }, { $set: { is_active: Number(isActive) } });
    },
    async create(data) {
      const account = {
        id: await nextId(db, 'accounts'),
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        phone_number: data.phoneNumber || null,
        address: data.address || null,
        avatar_url: null,
        role_id: Number(data.roleId || 3),
        balance: 0,
        is_active: 1,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      };
      await accounts.insertOne(account);
      return account.id;
    },
    async updatePassword(id, password) {
      await accounts.updateOne({ id: Number(id) }, { $set: { password, updated_at: new Date() } });
    },
    async updateProfile(id, data) {
      const mapping = {
        fullName: 'full_name',
        phoneNumber: 'phone_number',
        address: 'address',
        avatarUrl: 'avatar_url',
      };
      const fields = Object.fromEntries(
        Object.entries(data)
          .filter(([key, value]) => mapping[key] && value != null)
          .map(([key, value]) => [mapping[key], value])
      );
      await accounts.updateOne({ id: Number(id) }, { $set: { ...fields, updated_at: new Date() } });
    },
  };
}

export function createMongoOtpRepository(db) {
  const collection = db.collection('email_verifications');
  return {
    async saveOtp(email, otp, expiresAt) {
      const id = await nextId(db, 'email_verifications');
      await collection.insertOne({ id, email, otp, expires_at: expiresAt, is_used: 0, created_at: new Date() });
      return id;
    },
    async getValidOtp(email, otp) {
      return withoutMongoId(
        await collection.findOne(
          { email, otp, is_used: 0, expires_at: { $gt: new Date() } },
          { sort: { created_at: -1 } }
        )
      );
    },
    async markAsUsed(id) {
      await collection.updateOne({ id: Number(id) }, { $set: { is_used: 1 } });
    },
  };
}

export function createMongoEmailRepository(db) {
  const collection = db.collection('scheduled_emails');
  return {
    async createScheduledEmail(data) {
      const id = await nextId(db, 'scheduled_emails');
      await collection.insertOne({
        id,
        sender_id: Number(data.senderId),
        target_role: JSON.stringify(data.targets),
        subject: data.subject,
        content: data.content,
        scheduled_at: new Date(data.scheduledAt),
        status: 'PENDING',
        created_at: new Date(),
      });
      return id;
    },
    async getPendingEmails(now) {
      return (await collection.find({ status: 'PENDING', scheduled_at: { $lte: new Date(now) } }).toArray()).map(
        withoutMongoId
      );
    },
    async claimPending(id) {
      const result = await collection.updateOne({ id: Number(id), status: 'PENDING' }, { $set: { status: 'PROCESSING' } });
      return result.modifiedCount === 1;
    },
    async updateStatus(id, status) {
      await collection.updateOne({ id: Number(id) }, { $set: { status } });
    },
  };
}

export function createMongoIdempotencyRepository(db) {
  const collection = db.collection('idempotency_keys');
  const scope = ({ key, userId, method, endpoint }) => ({
    idempotency_key: key,
    user_id: Number(userId),
    http_method: method,
    endpoint,
  });
  return {
    async findByScope(data) {
      return withoutMongoId(await collection.findOne(scope(data)));
    },
    async insertProcessing(data) {
      const id = await nextId(db, 'idempotency_keys');
      try {
        await collection.insertOne({ id, ...scope(data), status: 'PROCESSING' });
        return { inserted: true, id };
      } catch (error) {
        if (error.code === 11000) return { inserted: false };
        throw error;
      }
    },
    async markCompleted(id, data) {
      await collection.updateOne(
        { id },
        {
          $set: {
            status: 'COMPLETED',
            response_status: data.responseStatus,
            response_body: JSON.stringify(data.responseBody),
          },
        }
      );
    },
    async markFailed(id) {
      await collection.updateOne({ id }, { $set: { status: 'FAILED' } });
    },
    async retryFromFailed(id) {
      await collection.updateOne(
        { id, status: 'FAILED' },
        { $set: { status: 'PROCESSING', response_status: null, response_body: null } }
      );
    },
  };
}

function toMessage(message) {
  return {
    id: message.id,
    senderId: message.sender_id,
    receiverId: message.receiver_id,
    content: message.content,
    isRead: message.is_read,
    createdAt: message.created_at,
  };
}

export function createMongoMessageRepository(db) {
  const messages = db.collection('direct_messages');
  return {
    async create({ senderId, receiverId, content }) {
      const message = {
        id: await nextId(db, 'direct_messages'),
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: 0,
        created_at: new Date(),
      };
      await messages.insertOne(message);
      return toMessage(message);
    },
    async getConversation(userId, otherUserId, { limit = 50 } = {}) {
      return (
        await messages
          .find({
            $or: [
              { sender_id: userId, receiver_id: otherUserId },
              { sender_id: otherUserId, receiver_id: userId },
            ],
          })
            .sort({ created_at: -1, id: -1 })
          .limit(Number(limit))
          .toArray()
          ).reverse().map(toMessage);
    },
    async markConversationRead(userId, senderId) {
      await messages.updateMany({ receiver_id: userId, sender_id: senderId, is_read: 0 }, { $set: { is_read: 1 } });
    },
    async getRecentPartners(userId) {
      return messages
        .aggregate([
          { $match: { $or: [{ sender_id: userId }, { receiver_id: userId }] } },
          {
            $group: {
              _id: { $cond: [{ $eq: ['$sender_id', userId] }, '$receiver_id', '$sender_id'] },
              lastMessageAt: { $max: '$created_at' },
              unreadCount: {
                $sum: { $cond: [{ $and: [{ $eq: ['$receiver_id', userId] }, { $eq: ['$is_read', 0] }] }, 1, 0] },
              },
            },
          },
          { $lookup: { from: 'accounts', localField: '_id', foreignField: 'id', as: 'account' } },
          { $unwind: '$account' },
          {
            $project: {
              _id: 0,
              id: '$account.id',
              fullName: '$account.full_name',
              email: '$account.email',
              roleId: '$account.role_id',
              lastMessageAt: 1,
              unreadCount: 1,
            },
          },
          { $sort: { lastMessageAt: -1 } },
        ])
        .toArray();
    },
  };
}
