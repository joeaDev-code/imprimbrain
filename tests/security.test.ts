import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { apiError } from '../lib/api-error';
import {
  canAssignEmployeeRole,
  canEditEmployeePrivileges,
  canEditEmployeeTarget,
  canResetEmployeePassword,
  employeeAuditMetadata,
  revokeEmployeeSessions,
} from '../lib/employee-access';
import { expenseDto } from '../lib/api-dto';
import { canAcceptPayment, canTransitionOrder, stockDecrementWhere } from '../lib/order-invariants';
import { lockTenantOrder } from '../lib/order-lock';
import {
  accountBackoffSeconds,
  MemoryRateLimitStore,
  rateLimitKey,
  trustedProxyClientIp,
} from '../lib/rate-limit';
import { readJsonBody, RequestBodyError } from '../lib/request-json';
import { isSameOriginRequest } from '../lib/same-origin';
import { createPublicReceiptToken, verifyPublicReceiptToken } from '../lib/public-receipt';

const secret = 'local-test-secret-not-for-production';

 test('employee password reset only targets self or an administrator', () => {
  assert.equal(canResetEmployeePassword('u1', 'OFFICER', 'u2'), false);
  assert.equal(canResetEmployeePassword('u1', 'SECRETARY', 'u2'), false);
  assert.equal(canResetEmployeePassword('u1', 'ADMIN', 'u2'), true);
  assert.equal(canResetEmployeePassword('u1', 'OFFICER', 'u1'), true);
});

test('employee roles and privileges cannot be self-escalated', () => {
  assert.equal(canEditEmployeePrivileges('u1', 'ADMIN', 'u1'), false);
  assert.equal(canEditEmployeePrivileges('u1', 'OFFICER', 'u2'), false);
  assert.equal(canEditEmployeePrivileges('u1', 'ADMIN', 'u2'), true);
  assert.equal(canEditEmployeeTarget('OFFICER', 'ADMIN'), false);
  assert.equal(canEditEmployeeTarget('ADMIN', 'SUPER_ADMIN'), false);
  assert.equal(canAssignEmployeeRole('OFFICER', 'ADMIN'), false);
  assert.equal(canAssignEmployeeRole('ADMIN', 'ADMIN'), true);
});

test('employee audit metadata excludes password hashes', () => {
  const metadata = employeeAuditMetadata({ name: 'A. User', passwordHash: 'must-not-leak' }, true, 2);
  assert.deepEqual(metadata, { name: 'A. User', passwordChanged: true, permissions: 2 });
  assert.equal(JSON.stringify(metadata).includes('must-not-leak'), false);
});

test('session revocation targets exactly the employee inside the caller transaction', async () => {
  let deletedUserId = '';
  await revokeEmployeeSessions({
    session: {
      async deleteMany({ where }) {
        deletedUserId = where.userId;
        return { count: 2 };
      },
    },
  }, 'target-user');
  assert.equal(deletedUserId, 'target-user');
});

test('rate limit store expires counters and bounds its local key set', async () => {
  const store = new MemoryRateLimitStore(2);
  await store.increment('first', 1000, 100);
  await store.increment('second', 1000, 100);
  assert.equal((await store.increment('second', 1000, 200)).count, 2);
  await store.increment('third', 1000, 200);
  assert.equal(await store.get('first', 201), null);
  assert.equal(await store.get('second', 1200), null);
});

test('rate limit store counts concurrent increments in one process', async () => {
  const store = new MemoryRateLimitStore();
  await Promise.all(Array.from({ length: 100 }, () => store.increment('parallel', 1000, 100)));
  assert.equal((await store.get('parallel', 101))?.count, 100);
});

test('rate-limit keys are opaque and account backoff remains short', () => {
  assert.equal(rateLimitKey('account', 'private@example.test').includes('private@example.test'), false);
  assert.equal(accountBackoffSeconds(4), 0);
  assert.equal(accountBackoffSeconds(5), 1);
  assert.equal(accountBackoffSeconds(100), 15);
});

test('client IP is used only when a trusted proxy header is configured', () => {
  const headers = new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.2' });
  assert.equal(trustedProxyClientIp(headers, ''), null);
  assert.equal(trustedProxyClientIp(headers, 'x-forwarded-for'), '203.0.113.10');
  assert.equal(trustedProxyClientIp(new Headers({ 'x-real-ip': 'not-an-ip' }), 'x-real-ip'), null);
});

test('tenant stock decrement predicate includes tenant and sufficient quantity', () => {
  assert.deepEqual(stockDecrementWhere('org-a', 'stock-a', 3), {
    id: 'stock-a',
    organizationId: 'org-a',
    active: true,
    quantity: { gte: 3 },
  });
});

test('tenant order lock binds both order and organization parameters', async () => {
  let sql = '';
  let parameters: unknown[] = [];
  const transaction = {
    async $queryRaw<T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
      sql = strings.join('?');
      parameters = values;
      return [{ id: 'order-a' }] as T;
    },
  };
  assert.equal(await lockTenantOrder(transaction, 'order-a', 'org-a'), true);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /organizationId/);
  assert.deepEqual(parameters, ['order-a', 'org-a']);
});

test('payment balance and order cancellation invariants are enforced', () => {
  assert.equal(canAcceptPayment(40, 100, 60), true);
  assert.equal(canAcceptPayment(40.01, 100, 60), false);
  assert.equal(canAcceptPayment(Number.NaN, 100, 0), false);
  assert.equal(canTransitionOrder('IN_PROGRESS', 'CANCELLED'), true);
  assert.equal(canTransitionOrder('CANCELLED', 'IN_PROGRESS'), false);
  assert.equal(canTransitionOrder('CANCELLED', 'CANCELLED'), true);
});

test('same-origin guard rejects cross-origin and missing browser origins', () => {
  assert.equal(isSameOriginRequest('https://app.example.test', null, 'https://app.example.test'), true);
  assert.equal(isSameOriginRequest(null, 'https://app.example.test/path', 'https://app.example.test'), true);
  assert.equal(isSameOriginRequest('https://evil.example.test', null, 'https://app.example.test'), false);
  assert.equal(isSameOriginRequest(null, null, 'https://app.example.test'), false);
});

test('bounded JSON reader accepts objects and rejects malformed, wrong-type, and oversized bodies', async () => {
  const valid = new Request('https://app.example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await readJsonBody(valid, 1024), { ok: true });

  const oversized = new Request('https://app.example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text: 'x'.repeat(128) }),
  });
  await assert.rejects(readJsonBody(oversized, 32), (error: unknown) => error instanceof RequestBodyError && error.status === 413);

  const malformed = new Request('https://app.example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid',
  });
  await assert.rejects(readJsonBody(malformed, 1024), (error: unknown) => error instanceof RequestBodyError && error.status === 400);

  const wrongType = new Request('https://app.example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  });
  await assert.rejects(readJsonBody(wrongType, 1024), (error: unknown) => error instanceof RequestBodyError && error.status === 415);
});

test('expense DTO does not serialize encrypted or tenant-internal fields', () => {
  const dto = expenseDto({
    id: 'expense-a',
    organizationId: 'org-a',
    label: 'Papier',
    category: 'Stock',
    amount: '120',
    spentAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    notesEncrypted: 'encrypted-secret',
  });
  assert.equal('organizationId' in dto, false);
  assert.equal('notesEncrypted' in dto, false);
  assert.equal(dto.amount, 120);
});

test('API input failures stay generic and preserve their intended status', async () => {
  const tooLarge = apiError(new RequestBodyError('Corps de requête trop volumineux', 413));
  assert.equal(tooLarge.status, 413);
  assert.deepEqual(await tooLarge.json(), { error: 'Corps de requête trop volumineux' });

  const originalError = console.error;
  console.error = () => undefined;
  try {
    const internal = apiError(new Error('private database detail'));
    assert.equal(internal.status, 500);
    assert.deepEqual(await internal.json(), { error: 'Erreur serveur' });
  } finally {
    console.error = originalError;
  }
});

test('public receipt tokens verify, reject tampering, and expire', () => {
  process.env.PUBLIC_RECEIPT_SECRET = secret;
  const token = createPublicReceiptToken('order-a');
  assert.equal(verifyPublicReceiptToken(token), 'order-a');
  assert.equal(verifyPublicReceiptToken(`${token}tampered`), null);

  const payload = Buffer.from(JSON.stringify({ orderId: 'order-a', expiresAt: 1 })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  assert.equal(verifyPublicReceiptToken(`${payload}.${signature}`), null);
});
