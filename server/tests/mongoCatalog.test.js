import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectMongo, seedMongoCatalog } from '../src/db/mongoDatabase.js';
import { createMongoGameRepository } from '../src/repositories/mongoGameRepository.js';
import {
  createMongoAccountRepository,
  createMongoOtpRepository,
  createMongoMessageRepository,
  createMongoIdempotencyRepository,
  createMongoVendorRepository,
} from '../src/repositories/mongoRepositories.js';
import { createMongoTransactionService, createMongoPaymentService } from '../src/services/mongoWalletService.js';
import { createMongoDashboardService } from '../src/services/mongoDashboardService.js';
import { createMongoContactService } from '../src/services/mongoContactService.js';
import { createApp } from '../src/app.js';
import { resolveEmailsFromTargets } from '../src/jobs/emailCron.js';

try {
  process.loadEnvFile(new URL('../.env', import.meta.url));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

test(
  'MongoDB catalog supports seeded search and updates',
  { skip: !process.env.MONGODB_URI, timeout: 120000 },
  async () => {
    const name = `mentor_game_test_${process.pid}_${Date.now()}`;
    const { client, db } = await connectMongo(process.env.MONGODB_URI, name);
    try {
      await seedMongoCatalog(db);
      const repository = createMongoGameRepository(db);
      const page = await repository.findPage({ search: 'bonanza', vendorId: '1', limit: 10, offset: 0 });
      assert.equal(page.total, 2);
      assert.equal((await repository.findPage({ search: '%', limit: 10, offset: 0 })).total, 0);
      const created = await repository.create({ vendorId: 1, gameCode: 'test', title: 'Test', type: 'SLOT' });
      assert.equal(created.id, 25);
      assert.equal((await repository.update(created.id, { isActive: false })).isActive, false);
      assert.equal((await repository.getStats()).totalGames, 25);

      const accounts = createMongoAccountRepository(db);
      const accountId = await accounts.create({
        email: 'test@example.com',
        password: await bcrypt.hash('test-password', 10),
        fullName: 'Test',
      });
      assert.equal((await accounts.findByEmail('test@example.com')).id, accountId);
      const otp = createMongoOtpRepository(db);
      await otp.saveOtp('test@example.com', '123456', new Date(Date.now() + 60000));
      assert.ok(await otp.getValidOtp('test@example.com', '123456'));
      const messages = createMongoMessageRepository(db);
      await messages.create({ senderId: accountId, receiverId: 2, content: 'hello' });
      assert.equal((await messages.getConversation(accountId, 2)).length, 1);
      await db.collection('direct_messages').insertMany(Array.from({ length: 51 }, (_, index) => ({
        id: index + 10, sender_id: accountId, receiver_id: 2, content: `message ${index}`, is_read: 0,
        created_at: new Date(Date.now() + index * 1000),
      })));
      const recentMessages = await messages.getConversation(accountId, 2);
      assert.equal(recentMessages.length, 50);
      assert.equal(recentMessages.at(-1).content, 'message 50');
      const idempotency = createMongoIdempotencyRepository(db);
      const scope = { key: 'key', userId: accountId, method: 'POST', endpoint: '/test' };
      assert.equal((await idempotency.insertProcessing(scope)).inserted, true);
      assert.equal((await idempotency.insertProcessing(scope)).inserted, false);

      const wallet = createMongoTransactionService(db, client);
      await wallet.processManualTransaction(accountId, 'DEPOSIT', 100, 'test');
      const withdrawals = await Promise.allSettled([
        wallet.processManualTransaction(accountId, 'WITHDRAW', 80, 'test'),
        wallet.processManualTransaction(accountId, 'WITHDRAW', 80, 'test'),
      ]);
      assert.equal(withdrawals.filter((result) => result.status === 'fulfilled').length, 1);
      assert.equal((await accounts.findById(accountId)).balance, 20);
      assert.equal((await wallet.getTransactionHistory(accountId)).length, 2);
      const payment = createMongoPaymentService(db, client, {
        createPaymentLink: async () => ({ qrCode: 'test' }),
        verifyPaymentWebhookData: (body) => body,
      });
      const order = await payment.createDepositQR(accountId, 2000);
      await Promise.all([
        payment.handleWebhook({ orderCode: order.orderCode, amount: 2000 }),
        payment.handleWebhook({ orderCode: order.orderCode, amount: 2000 }),
      ]);
      assert.equal((await accounts.findById(accountId)).balance, 2020);
      const dashboard = await createMongoDashboardService(db).getDashboardStats();
      assert.equal(dashboard.overview.totalGames, 25);
      assert.equal(dashboard.overview.totalSystemBalance, 2020);
      const contact = createMongoContactService(db, { sendMail: async () => {} });
      await contact.updateCompanyInfo({
        companyName: 'Demo',
        address: 'Office',
        email: 'office@example.com',
        phone: '',
        workingHours: '',
        lat: 1,
        lng: 2,
      });
      const message = await contact.submitContact({
        fullName: 'Test',
        email: 'test@example.com',
        subject: 'Hi',
        message: 'Hello',
      });
      assert.equal((await contact.getMessages()).unreadCount, 1);
      assert.equal((await contact.markAsRead(message.id)).isRead, 1);
      assert.deepEqual(await resolveEmailsFromTargets(db, [{ type: 'ROLE', value: '3' }]), ['test@example.com']);

      const app = createApp({
        db,
        mongoClient: client,
        gameRepository: repository,
        vendorRepository: createMongoVendorRepository(db),
        accountRepository: accounts,
        otpRepository: otp,
        runEmailJob: async () => {},
      });
      const server = app.listen(0);
      try {
        await new Promise((resolve) => server.once('listening', resolve));
        const base = `http://127.0.0.1:${server.address().port}`;
        process.env.CRON_SECRET = 'test-cron-secret';
        assert.equal((await fetch(`${base}/api/cron/email`)).status, 401);
        assert.equal((await fetch(`${base}/api/cron/email`, { headers: { Authorization: 'Bearer test-cron-secret' } })).status, 200);
        const response = await fetch(`${base}/api/games?search=bonanza&vendorId=1`);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).meta.total, 2);
        process.env.JWT_SECRET ||= 'mongo-test-secret';
        const token = jwt.sign({ id: accountId, roleId: 1 }, process.env.JWT_SECRET);
        const vendorResponse = await fetch(`${base}/api/vendors`, { headers: { Authorization: `Bearer ${token}` } });
        assert.equal(vendorResponse.status, 200);
        assert.equal((await vendorResponse.json()).data.length, 5);
        const login = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'test-password' }),
        });
        assert.equal(login.status, 200);
        const loginBody = await login.json();
        assert.equal(loginBody.data.user.id, accountId);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    } finally {
      await db.dropDatabase();
      await client.close();
    }
  }
);
