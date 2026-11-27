import { MongoClient } from 'mongodb';
import { initializeMongoSchema } from './mongoSchema.js';

try {
  process.loadEnvFile(new URL('../../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE || 'mentor_game';

if (!uri) {
  console.error('Set MONGODB_URI in server/.env before initializing the schema.');
  process.exitCode = 1;
} else {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await initializeMongoSchema(client.db(databaseName));
    console.log(`MongoDB schema initialized in database "${databaseName}".`);
  } catch (error) {
    console.error('MongoDB schema initialization failed. Check Atlas access and connection settings.');
    console.error(`Error type: ${error.name}`);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
