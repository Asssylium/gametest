import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeMongoSchema, mongoCollections } from '../src/db/mongoSchema.js';

test('initializes all MongoDB collections and their indexes without dropping data', async () => {
  const created = [];
  const modified = [];
  const indexes = [];
  const database = {
    listCollections: () => ({ toArray: async () => [{ name: 'accounts' }] }),
    createCollection: async (name, options) => created.push({ name, options }),
    command: async (command) => modified.push(command),
    collection: (name) => ({ createIndex: async (keys, options) => indexes.push({ name, keys, options }) }),
  };

  await initializeMongoSchema(database);

  assert.equal(created.length, Object.keys(mongoCollections).length - 1);
  assert.equal(modified.length, 1);
  assert.equal(modified[0].collMod, 'accounts');
  assert.deepEqual(modified[0].validator.$jsonSchema.required, mongoCollections.accounts.required);
  for (const name of Object.keys(mongoCollections)) {
    assert.ok(indexes.some((index) => index.name === name && index.keys.id === 1 && index.options?.unique));
  }
  assert.ok(indexes.some((index) => index.name === 'games' && index.keys.game_code === 1 && index.options?.unique));
  assert.ok(
    indexes.some((index) => index.name === 'idempotency_keys' && index.keys.endpoint === 1 && index.options?.unique)
  );
});
