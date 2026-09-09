import test from 'node:test';
import assert from 'node:assert/strict';

import { assertRuntimeEnv } from '../config/runtime-env.js';

function withEnv(values, callback) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { callback(); } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('assertRuntimeEnv rejects missing DATABASE_URL', () => {
  withEnv({ DATABASE_URL: undefined, AUTH_TOKEN_SECRET: 'x'.repeat(32) }, () => {
    assert.throws(() => assertRuntimeEnv(), /DATABASE_URL/);
  });
});

test('assertRuntimeEnv rejects short auth secret', () => {
  withEnv({ DATABASE_URL: 'postgresql://example.invalid/pipestock', AUTH_TOKEN_SECRET: 'short' }, () => {
    assert.throws(() => assertRuntimeEnv(), /32 characters/);
  });
});

test('assertRuntimeEnv accepts complete auth configuration', () => {
  withEnv({ DATABASE_URL: 'postgresql://example.invalid/pipestock', AUTH_TOKEN_SECRET: 'x'.repeat(32) }, () => {
    assert.doesNotThrow(() => assertRuntimeEnv());
  });
});
