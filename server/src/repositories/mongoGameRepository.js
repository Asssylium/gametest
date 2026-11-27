import { nextId } from '../db/mongoDatabase.js';

const updatable = {
  isActive: 'is_active',
  sortOrder: 'sort_order',
  titleJp: 'title_jp',
  title: 'title',
  type: 'type',
  imageUrl: 'image_url',
};
const sortable = { sortOrder: 'sort_order', title: 'title', createdAt: 'created_at' };

function toGame(row) {
  if (!row) return null;
  return {
    id: row.id,
    vendorId: row.vendor_id,
    gameCode: row.game_code,
    title: row.title,
    titleJp: row.title_jp ?? null,
    imageUrl: row.image_url ?? null,
    type: row.type,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at.toISOString(),
  };
}

export function createMongoGameRepository(db) {
  const games = db.collection('games');
  const vendors = db.collection('vendors');
  return {
    async findPage({ search, vendorId, type, isActive, sortBy, order, limit, offset }) {
      const filter = {};
      if (search) {
        const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ title: pattern }, { game_code: pattern }, { title_jp: pattern }];
      }
      if (vendorId) filter.vendor_id = Number(vendorId);
      if (type) filter.type = type;
      if (typeof isActive === 'boolean') filter.is_active = Number(isActive);
      const direction = String(order).toUpperCase() === 'ASC' ? 1 : -1;
      const [rows, total] = await Promise.all([
        games
          .find(filter)
          .sort({ [sortable[sortBy] ?? 'sort_order']: direction, id: direction })
          .skip(offset)
          .limit(limit)
          .toArray(),
        games.countDocuments(filter),
      ]);
      return { rows: rows.map(toGame), total };
    },
    async findById(id) {
      return toGame(await games.findOne({ id: Number(id) }));
    },
    async findByVendorAndCode(vendorId, gameCode) {
      return toGame(await games.findOne({ vendor_id: Number(vendorId), game_code: gameCode }));
    },
    async create(data) {
      const row = {
        id: await nextId(db, 'games'),
        vendor_id: Number(data.vendorId),
        game_code: data.gameCode,
        title: data.title,
        title_jp: data.titleJp ?? null,
        image_url: data.imageUrl || null,
        type: data.type || 'SLOT',
        is_active: Number(data.isActive ?? 1),
        sort_order: data.sortOrder ?? 0,
        created_at: new Date(),
      };
      await games.insertOne(row);
      return toGame(row);
    },
    async update(id, changes) {
      const fields = Object.fromEntries(
        Object.entries(changes)
          .filter(([key]) => key in updatable)
          .map(([key, value]) => [updatable[key], key === 'isActive' ? Number(value) : value])
      );
      if (Object.keys(fields).length) await games.updateOne({ id: Number(id) }, { $set: fields });
      return this.findById(id);
    },
    async bulkUpdateActive(ids, isActive) {
      if (!ids?.length) return 0;
      const result = await games.updateMany(
        { id: { $in: ids.map(Number) } },
        { $set: { is_active: Number(isActive) } }
      );
      return result.matchedCount;
    },
    async delete(id) {
      return (await games.updateOne({ id: Number(id) }, { $set: { is_active: 0 } })).matchedCount > 0;
    },
    async findVendors() {
      return vendors
        .find({}, { projection: { _id: 0, id: 1, code: 1, name: 1 } })
        .sort({ code: 1 })
        .toArray();
    },
    async checkDuplicateTitle(vendorId, title, excludeGameId = null) {
      const filter = {
        vendor_id: Number(vendorId),
        $expr: { $eq: [{ $toLower: { $trim: { input: '$title' } } }, title.trim().toLowerCase()] },
      };
      if (excludeGameId) filter.id = { $ne: Number(excludeGameId) };
      return Boolean(await games.findOne(filter));
    },
    async getStats() {
      const [totalGames, activeGames, allVendors, counts] = await Promise.all([
        games.countDocuments(),
        games.countDocuments({ is_active: 1 }),
        vendors.find({}).sort({ code: 1 }).toArray(),
        games.aggregate([{ $group: { _id: '$vendor_id', count: { $sum: 1 } } }]).toArray(),
      ]);
      const byId = new Map(counts.map((row) => [row._id, row.count]));
      return {
        totalGames,
        activeGames,
        gamesByVendor: allVendors.map((vendor) => ({
          vendorId: vendor.id,
          vendorCode: vendor.code,
          vendorName: vendor.name,
          gameCount: byId.get(vendor.id) ?? 0,
        })),
      };
    },
    async vendorExists(id) {
      return Boolean(await vendors.findOne({ id: Number(id) }));
    },
  };
}
