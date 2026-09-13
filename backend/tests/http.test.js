import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';

import { applySecurityHeaders, readJsonBody } from '../lib/http.js';

function createResponseStub() {
  const headers = new Map();
  return {
    headers,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
  };
}

test('applies baseline API security headers', () => {
  const response = createResponseStub();
  applySecurityHeaders(response);

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
});

test('rejects JSON request bodies larger than the configured limit', async () => {
  const request = Readable.from([Buffer.alloc(17), Buffer.alloc(17)]);

  await assert.rejects(
    () => readJsonBody(request, { maxBytes: 32 }),
    error => error?.statusCode === 413,
  );
});
