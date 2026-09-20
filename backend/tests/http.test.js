import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';

import { applySecurityHeaders, handleCors, readJsonBody } from '../lib/http.js';

function createResponseStub() {
  const headers = new Map();
  return {
    headers,
    statusCode: null,
    ended: false,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    writeHead(statusCode) {
      this.statusCode = statusCode;
    },
    end() {
      this.ended = true;
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

test('allows WorkTrack as a default CORS origin for proxied PipeStock requests', () => {
  const originalClientOrigin = process.env.CLIENT_ORIGIN;
  delete process.env.CLIENT_ORIGIN;

  try {
    const response = createResponseStub();
    const handled = handleCors({
      method: 'OPTIONS',
      headers: {
        origin: 'https://worktrackings.netlify.app',
      },
    }, response);

    assert.equal(handled, true);
    assert.equal(response.statusCode, 204);
    assert.equal(response.ended, true);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://worktrackings.netlify.app');
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  } finally {
    if (originalClientOrigin === undefined) delete process.env.CLIENT_ORIGIN;
    else process.env.CLIENT_ORIGIN = originalClientOrigin;
  }
});
