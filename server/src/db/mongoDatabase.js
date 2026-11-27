import { MongoClient } from 'mongodb';
import { initializeMongoSchema } from './mongoSchema.js';
import { buildSeedGames, vendors as seedVendors } from '../data/seed.js';

export async function connectMongo(uri, databaseName) {
  if (!uri || !databaseName) throw new Error('MONGODB_URI and MONGODB_DATABASE must be configured');
  const client = new MongoClient(uri);
  await client.connect();
  return { client, db: client.db(databaseName) };
}

export async function nextId(db, name, session) {
  const counter = await db
    .collection('counters')
    .findOneAndUpdate({ _id: name }, { $inc: { sequence: 1 } }, { upsert: true, returnDocument: 'after', session });
  return counter.sequence;
}

export async function seedMongoCatalog(db) {
  await initializeMongoSchema(db);
  const vendors = db.collection('vendors');
  const games = db.collection('games');
  for (const name of ['vendors', 'games']) {
    const last = await db.collection(name).find({}).sort({ id: -1 }).limit(1).next();
    if (last)
      await db.collection('counters').updateOne({ _id: name }, { $max: { sequence: last.id } }, { upsert: true });
  }
  for (const vendor of seedVendors) {
    if (await vendors.findOne({ code: vendor.code })) continue;
    await vendors.updateOne(
      { code: vendor.code },
      {
        $setOnInsert: {
          id: await nextId(db, 'vendors'),
          ...vendor,
          is_active: 1,
          sort_order: 0,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  }
  const vendorMap = Object.fromEntries((await vendors.find({}).toArray()).map((vendor) => [vendor.code, vendor.id]));
  for (const game of buildSeedGames()) {
    const vendorId = vendorMap[game.vendorCode];
    if (await games.findOne({ vendor_id: vendorId, game_code: game.gameCode })) continue;
    await games.updateOne(
      { vendor_id: vendorId, game_code: game.gameCode },
      {
        $setOnInsert: {
          id: await nextId(db, 'games'),
          vendor_id: vendorId,
          game_code: game.gameCode,
          title: game.title,
          title_jp: game.titleJp,
          image_url: null,
          type: game.type,
          is_active: Number(game.active),
          sort_order: game.sort,
          created_at: new Date(game.createdAt),
        },
      },
      { upsert: true }
    );
  }
}
