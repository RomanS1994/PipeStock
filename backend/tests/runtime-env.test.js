import test from 'node:test';
import assert from 'node:assert/strict';

import { assertRuntimeEnv } from '../config/runtime-env.js';

test('assertRuntimeEnv rejects missing DATABASE_URL', () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  assert.throws(() => assertRuntimeEnv(), /DATABASE_URL/);

  if (previous === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previous;
});

test('assertRuntimeEnv accepts DATABASE_URL', () => {
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://example.invalid/pipestock';

  assert.doesNotThrow(() => assertRuntimeEnv());

  if (previous === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previous;
});
