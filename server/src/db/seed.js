import { connectMongo, seedMongoCatalog } from './mongoDatabase.js';

try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const databaseName = process.env.MONGODB_DATABASE || 'mentor_game';
const { client, db } = await connectMongo(process.env.MONGODB_URI, databaseName);

try {
  await seedMongoCatalog(db);

  console.log('Sample data seeded successfully.');
  console.log(`Database: ${databaseName}`);
} catch (err) {
  console.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
