import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLazyHandler } from '../src/serverless.js';
import { runScheduledEmails } from '../src/jobs/emailCron.js';

test('serverless initialization is shared across concurrent requests', async () => {
  let initializations = 0;
  const handler = createLazyHandler(async () => {
    initializations += 1;
    return (_request, response) => response.end('ok');
  });
  const results = [];
  await Promise.all([0, 1].map(() => handler({}, { end: (result) => results.push(result) })));
  assert.equal(initializations, 1);
  assert.deepEqual(results, ['ok', 'ok']);
});

test('serverless initialization can retry after a connection failure', async () => {
  let attempts = 0;
  const handler = createLazyHandler(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('test failure');
    return (_request, response) => response.end('ok');
  });
  const response = { end(result) { this.body = result; } };
  await handler({}, response);
  assert.equal(response.statusCode, 503);
  await handler({}, response);
  assert.equal(response.body, 'ok');
  assert.equal(attempts, 2);
});

test('scheduled emails are claimed before sending', async () => {
  const statuses = [];
  let claims = 0;
  const repository = {
    getPendingEmails: async () => [{ id: 1, target_role: '[{"type":"ALL"}]', subject: 'Demo', content: 'Hello' }],
    claimPending: async () => { const claimed = claims === 0; claims += 1; return claimed; },
    updateStatus: async (_id, status) => statuses.push(status),
  };
  const db = { collection: () => ({ find: () => ({ toArray: async () => [{ email: 'demo@example.com' }] }) }) };
  let sent = 0;
  const emailService = { sendMail: async () => { sent += 1; } };
  await Promise.all([runScheduledEmails(repository, db, emailService), runScheduledEmails(repository, db, emailService)]);
  assert.equal(sent, 1);
  assert.deepEqual(statuses, ['SENT']);
});