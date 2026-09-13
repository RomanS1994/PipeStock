import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  createSignedImageUpload,
  IMAGE_UPLOAD_ALLOWED_FORMATS,
  isImageStorageConfigured,
  validateStoredImageUrl,
} from '../lib/cloudinary.js';

function withCloudinaryEnv(run) {
  const previous = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = 'pipe-stock-test';
  process.env.CLOUDINARY_API_KEY = '12345';
  process.env.CLOUDINARY_API_SECRET = 'super-secret';

  try {
    return run();
  } finally {
    if (previous.cloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = previous.cloudName;
    if (previous.apiKey === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = previous.apiKey;
    if (previous.apiSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = previous.apiSecret;
  }
}

test('creates a signed Cloudinary image upload without exposing the secret', () => withCloudinaryEnv(() => {
  assert.equal(isImageStorageConfigured(), true);
  const upload = createSignedImageUpload({ kind: 'project', companyId: 'company-1', now: 1_700_000_000_000 });
  assert.equal(upload.timestamp, 1_700_000_000);
  assert.equal(upload.apiKey, '12345');
  assert.match(upload.uploadUrl, /pipe-stock-test\/image\/upload$/);
  assert.match(upload.publicId, /^pipestock\/projects\/company-1\//);
  assert.equal(upload.allowedFormats, IMAGE_UPLOAD_ALLOWED_FORMATS.join(','));
  assert.equal('apiSecret' in upload, false);

  const expected = createHash('sha1')
    .update(`allowed_formats=${upload.allowedFormats}&public_id=${upload.publicId}&timestamp=${upload.timestamp}super-secret`)
    .digest('hex');
  assert.equal(upload.signature, expected);
}));

test('accepts only images stored in the current company project folder', () => withCloudinaryEnv(() => {
  const url = 'https://res.cloudinary.com/pipe-stock-test/image/upload/v1700000000/pipestock/projects/company-1/photo.webp';
  assert.equal(validateStoredImageUrl({ url, kind: 'project', companyId: 'company-1' }), url);

  assert.throws(
    () => validateStoredImageUrl({ url, kind: 'project', companyId: 'company-2' }),
    /does not belong to this company/,
  );
  assert.throws(
    () => validateStoredImageUrl({
      url: 'https://example.com/photo.webp',
      kind: 'project',
      companyId: 'company-1',
    }),
    /PipeStock image storage/,
  );
  assert.throws(
    () => validateStoredImageUrl({
      url: 'https://res.cloudinary.com/pipe-stock-test/image/upload/v1700000000/pipestock/projects/company-1/photo.svg',
      kind: 'project',
      companyId: 'company-1',
    }),
    /Unsupported image format/,
  );
}));
