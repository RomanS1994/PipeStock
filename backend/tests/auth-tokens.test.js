import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || 'test-secret-that-is-at-least-32-characters';

const { createAccessToken, hashPassword, verifyAccessToken, verifyPassword } = await import('../auth/tokens.js');

test('password hashing verifies only the original password', () => {
  const hash = hashPassword('strong-password');
  assert.equal(verifyPassword('strong-password', hash), true);
  assert.equal(verifyPassword('wrong-password', hash), false);
  assert.notEqual(hash, 'strong-password');
});

test('access tokens are signed and verifiable', () => {
  const { token } = createAccessToken({ userId: 'user-1', sessionId: 'session-1' });
  assert.deepEqual(verifyAccessToken(token)?.userId, 'user-1');
  assert.equal(verifyAccessToken(`${token}tampered`), null);
});
