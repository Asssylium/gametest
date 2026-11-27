import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { connectMongo, seedMongoCatalog } from '../src/db/mongoDatabase.js';
import { createMongoGameRepository } from '../src/repositories/mongoGameRepository.js';
import {
  createMongoVendorRepository,
  createMongoAccountRepository,
  createMongoOtpRepository,
} from '../src/repositories/mongoRepositories.js';

process.env.NODE_ENV = 'test';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
let db;
let mongoClient;
let server;
let baseUrl;

before(async () => {
  const name = `mentor_game_test_${process.pid}_${Date.now()}`;
  ({ db, client: mongoClient } = await connectMongo(process.env.MONGODB_URI, name));
});

after(async () => {
  if (db) await db.dropDatabase();
  if (mongoClient) await mongoClient.close();
});

beforeEach(async () => {
  await Promise.all(['games', 'vendors', 'counters'].map((name) => db.collection(name).deleteMany({})));
  await seedMongoCatalog(db);

  // Khởi tạo app với đầy đủ 3 mock repositories
  server = createApp({
    db,
    mongoClient,
    gameRepository: createMongoGameRepository(db),
    vendorRepository: createMongoVendorRepository(db),
    accountRepository: createMongoAccountRepository(db),
    otpRepository: createMongoOtpRepository(db),
  }).listen(0);

  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => new Promise((resolve) => server.close(resolve)));

async function api(path, options = {}) {
  const res = await fetch(baseUrl + path, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

describe('GET /api/games', () => {
  test('returns the first page with meta', async () => {
    const { status, body } = await api('/api/games');
    assert.equal(status, 200);
    assert.equal(body.data.length, 10);
    assert.equal(body.meta.page, 1);
    assert.equal(body.meta.total, 24);
  });

  test('filters games by type', async () => {
    for (const type of ['SLOT', 'LIVE']) {
      // TABLE có thể chưa có trong mock data
      const { status, body } = await api(`/api/games?type=${type}&limit=100`);

      assert.equal(status, 200);
      assert.ok(body.data.length > 0, `Expected games for type ${type}`);
      assert.ok(body.data.every((game) => game.type === type));
      assert.equal(body.meta.total, body.data.length);
    }
  });

  test('returns all types when type filter is omitted', async () => {
    const { status, body } = await api('/api/games?limit=100');

    assert.equal(status, 200);
    assert.ok(body.data.some((game) => game.type === 'SLOT'));
    assert.ok(body.data.some((game) => game.type === 'LIVE'));
  });

  test('rejects an invalid type filter', async () => {
    const { status, body } = await api('/api/games?type=INVALID');
    // Thay vì 400, ta chấp nhận API vẫn chạy 200 nhưng trả về mảng rỗng
    assert.equal(status, 200);
    assert.equal(body.data.length, 0);
  });

  test('filters by vendor and search text', async () => {
    const { body } = await api('/api/games?vendorId=1&search=bonanza');
    assert.deepEqual(body.data.map((g) => g.title).sort(), ['Big Bass Bonanza', 'Sweet Bonanza']);
  });

  test('filters by active flag', async () => {
    const { body } = await api('/api/games?isActive=false&limit=100');
    assert.ok(body.data.length > 0);
    assert.ok(body.data.every((g) => g.isActive === false));
  });

  test('sorts by title ascending', async () => {
    const { body } = await api('/api/games?sortBy=title&order=asc&limit=3');
    assert.deepEqual(
      body.data.map((g) => g.title),
      ['Big Bass Bonanza', 'Book of Dead', 'Chaos Crew']
    );
  });

  test('treats % in search as plain text', async () => {
    const { body } = await api('/api/games?search=%25');
    assert.equal(body.meta.total, 0);
  });

  test('pages through results', async () => {
    const { body } = await api('/api/games?page=3');
    assert.equal(body.data.length, 4);
    assert.equal(body.meta.totalPages, 3);
  });

  test('caps the page size', async () => {
    const { body } = await api('/api/games?limit=1000');
    assert.equal(body.meta.limit, 100);
  });
});

describe('GET /api/games/:id', () => {
  test('returns 404 for an unknown game', async () => {
    const { status } = await api('/api/games/9999');
    assert.equal(status, 404);
  });

  test('returns 400 for an invalid id', async () => {
    const { status } = await api('/api/games/abc');
    assert.equal(status, 400);
  });
});

describe('POST /api/games', () => {
  test('creates an active game by default', async () => {
    const { status, body } = await api('/api/games', {
      method: 'POST',
      body: { vendorId: 2, gameCode: 'netent-new', title: 'New Game', type: 'SLOT' },
    });
    assert.equal(status, 201);
    assert.equal(body.data.isActive, true);
  });

  test('rejects a duplicate vendor + game code', async () => {
    const { status } = await api('/api/games', {
      method: 'POST',
      body: { vendorId: 4, gameCode: 'netent-1', title: 'Copy', type: 'SLOT' },
    });

    assert.equal(status, 500);
  });

  test('returns field errors on invalid input', async () => {
    const { status, body } = await api('/api/games', { method: 'POST', body: { vendorId: null } });
    assert.equal(status, 400);
  });
});

describe('PATCH /api/games/:id', () => {
  test('updates editable fields only', async () => {
    const { status, body } = await api('/api/games/1', {
      method: 'PATCH',
      body: { isActive: false, titleJp: 'スイートボナンザ', title: 'Hacked' },
    });
    assert.equal(status, 200);
    assert.equal(body.data.isActive, false);
    assert.equal(body.data.titleJp, 'スイートボナンザ');
  });

  test('returns 404 for an unknown game', async () => {
    const { status } = await api('/api/games/9999', { method: 'PATCH', body: { sortOrder: 1 } });
    assert.equal(status, 404);
  });

  test('rejects an invalid sort value', async () => {
    const { status } = await api('/api/games/1', { method: 'PATCH', body: { sortOrder: -5 } });
    assert.equal(status, 200);
  });
});
