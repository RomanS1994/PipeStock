import test from 'node:test';
import assert from 'node:assert/strict';

import { clearRateLimitsForTests, consumeRateLimit, resetRateLimit } from '../auth/rate-limit.js';

test('blocks after the configured number of attempts within a window', () => {
  clearRateLimitsForTests();
  const config = { scope: 'login', key: 'user@example.com', limit: 2, windowMs: 1_000 };

  assert.equal(consumeRateLimit({ ...config, now: 100 }).allowed, true);
  assert.equal(consumeRateLimit({ ...config, now: 200 }).allowed, true);
  const blocked = consumeRateLimit({ ...config, now: 300 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 800);
});

test('starts a fresh bucket after the window expires', () => {
  clearRateLimitsForTests();
  const config = { scope: 'join', key: 'user-1', limit: 1, windowMs: 500 };

  assert.equal(consumeRateLimit({ ...config, now: 1_000 }).allowed, true);
  assert.equal(consumeRateLimit({ ...config, now: 1_100 }).allowed, false);
  assert.equal(consumeRateLimit({ ...config, now: 1_500 }).allowed, true);
});

test('reset removes a bucket immediately', () => {
  clearRateLimitsForTests();
  const config = { scope: 'login', key: 'client-1', limit: 1, windowMs: 5_000 };

  assert.equal(consumeRateLimit(config).allowed, true);
  assert.equal(consumeRateLimit(config).allowed, false);
  resetRateLimit({ scope: config.scope, key: config.key });
  assert.equal(consumeRateLimit(config).allowed, true);
});
