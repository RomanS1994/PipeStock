import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AUTH_LIMITS,
  assertAuthEmail,
  assertAuthPassword,
  assertCompanyName,
  assertJoinCode,
  assertPersonName,
  assertPhone,
} from '../auth/input-validation.js';

test('accepts valid auth field lengths', () => {
  assert.doesNotThrow(() => assertAuthEmail('user@example.com'));
  assert.doesNotThrow(() => assertAuthPassword('12345678'));
  assert.doesNotThrow(() => assertPersonName('Roman Stryzhka'));
  assert.doesNotThrow(() => assertCompanyName('PipeStock s.r.o.'));
  assert.doesNotThrow(() => assertPhone('+420 123 456 789'));
  assert.doesNotThrow(() => assertJoinCode('pst-82km4'));
});

test('rejects oversized auth fields before expensive auth work', () => {
  assert.throws(() => assertAuthEmail(`${'a'.repeat(AUTH_LIMITS.email)}@x.cz`), /valid email/);
  assert.throws(() => assertAuthPassword('x'.repeat(AUTH_LIMITS.passwordMax + 1)), /at most/);
  assert.throws(() => assertPersonName('x'.repeat(AUTH_LIMITS.name + 1)), /too long/);
  assert.throws(() => assertCompanyName('x'.repeat(AUTH_LIMITS.companyName + 1)), /too long/);
  assert.throws(() => assertPhone('1'.repeat(AUTH_LIMITS.phone + 1)), /too long/);
});

test('rejects malformed company invite codes', () => {
  assert.throws(() => assertJoinCode('PST-123'), /valid company code/);
  assert.throws(() => assertJoinCode('PST-O0IL1'), /valid company code/);
  assert.throws(() => assertJoinCode('OTHER-82KM4'), /valid company code/);
});
