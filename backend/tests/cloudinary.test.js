import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  createSignedImageUpload,
  destroyStoredImage,
  IMAGE_UPLOAD_ALLOWED_FORMATS,
  IMAGE_UPLOAD_MAX_BYTES,
  isImageStorageConfigured,
  validateStoredImageUrl,
  verifyStoredImageAsset,
} from '../lib/cloudinary.js';

async function withCloudinaryEnv(run) {
  const previous = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };

  process.env.CLOUDINARY_CLOUD_NAME = 'pipe-stock-test';
  process.env.CLOUDINARY_API_KEY = '12345';
  process.env.CLOUDINARY_API_SECRET = 'super-secret';

  try {
    return await run();
  } finally {
    if (previous.cloudName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = previous.cloudName;
    if (previous.apiKey === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = previous.apiKey;
    if (previous.apiSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = previous.apiSecret;
  }
}

test('creates a signed Cloudinary image upload without exposing the secret', async () => withCloudinaryEnv(async () => {
  assert.equal(isImageStorageConfigured(), true);
  const upload = createSignedImageUpload({ kind: 'project', companyId: 'company-1', now: 1_700_000_000_000 });
  assert.equal(upload.timestamp, 1_700_000_000);
  assert.equal(upload.apiKey, '12345');
  assert.match(upload.uploadUrl, /pipe-stock-test\/image\/upload$/);
  assert.match(upload.publicId, /^pipestock\/projects\/company-1\//);
  assert.equal(upload.allowedFormats, IMAGE_UPLOAD_ALLOWED_FORMATS.join(','));
  assert.equal(upload.overwrite, 'false');
  assert.equal('apiSecret' in upload, false);

  const expected = createHash('sha1')
    .update(`allowed_formats=${upload.allowedFormats}&overwrite=false&public_id=${upload.publicId}&timestamp=${upload.timestamp}super-secret`)
    .digest('hex');
  assert.equal(upload.signature, expected);
}));

test('accepts only original canonical images stored in the current company project folder', async () => withCloudinaryEnv(async () => {
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
  assert.throws(
    () => validateStoredImageUrl({
      url: 'https://res.cloudinary.com/pipe-stock-test/image/upload/c_fill,w_400/v1700000000/pipestock/projects/company-1/photo.webp',
      kind: 'project',
      companyId: 'company-1',
    }),
    /PipeStock image storage/,
  );
  assert.throws(
    () => validateStoredImageUrl({
      url: `${url}?download=1`,
      kind: 'project',
      companyId: 'company-1',
    }),
    /PipeStock image storage/,
  );
}));

test('verifies stored image metadata with Cloudinary before persistence', async () => withCloudinaryEnv(async () => {
  const url = 'https://res.cloudinary.com/pipe-stock-test/image/upload/v1700000000/pipestock/projects/company-1/photo.webp';
  let request = null;
  const result = await verifyStoredImageAsset({
    url,
    kind: 'project',
    companyId: 'company-1',
    fetchImpl: async (requestUrl, options) => {
      request = { requestUrl, options };
      return {
        ok: true,
        async json() {
          return {
            public_id: 'pipestock/projects/company-1/photo',
            resource_type: 'image',
            type: 'upload',
            version: 1700000000,
            format: 'webp',
            bytes: 123456,
            width: 1200,
            height: 800,
          };
        },
      };
    },
  });

  assert.equal(result.url, url);
  assert.equal(result.publicId, 'pipestock/projects/company-1/photo');
  assert.equal(result.version, 1700000000);
  assert.equal(result.bytes, 123456);
  assert.equal(result.format, 'webp');
  assert.match(request.requestUrl, /\/resources\/image\/upload\/pipestock\/projects\/company-1\/photo$/);
  assert.match(request.options.headers.Authorization, /^Basic /);
}));

test('rejects oversized, mismatched, or wrong-version Cloudinary assets', async () => withCloudinaryEnv(async () => {
  const url = 'https://res.cloudinary.com/pipe-stock-test/image/upload/v1700000000/pipestock/projects/company-1/photo.webp';
  const responseFor = asset => async () => ({
    ok: true,
    async json() { return asset; },
  });
  const validBase = {
    public_id: 'pipestock/projects/company-1/photo',
    resource_type: 'image',
    type: 'upload',
    version: 1700000000,
    format: 'webp',
  };

  await assert.rejects(
    verifyStoredImageAsset({
      url,
      kind: 'project',
      companyId: 'company-1',
      fetchImpl: responseFor({ ...validBase, bytes: IMAGE_UPLOAD_MAX_BYTES + 1 }),
    }),
    /too large/,
  );

  await assert.rejects(
    verifyStoredImageAsset({
      url,
      kind: 'project',
      companyId: 'company-1',
      fetchImpl: responseFor({ ...validBase, public_id: 'pipestock/projects/company-1/other-photo', bytes: 1000 }),
    }),
    /does not match PipeStock storage/,
  );

  await assert.rejects(
    verifyStoredImageAsset({
      url,
      kind: 'project',
      companyId: 'company-1',
      fetchImpl: responseFor({ ...validBase, version: 1700000001, bytes: 1000 }),
    }),
    /does not match PipeStock storage/,
  );
}));

test('signs cleanup requests for the current company asset', async () => withCloudinaryEnv(async () => {
  const url = 'https://res.cloudinary.com/pipe-stock-test/image/upload/v1700000000/pipestock/projects/company-1/photo.webp';
  let request = null;
  const result = await destroyStoredImage({
    url,
    kind: 'project',
    companyId: 'company-1',
    now: 1_700_000_000_000,
    fetchImpl: async (requestUrl, options) => {
      request = { requestUrl, options };
      return {
        ok: true,
        async json() { return { result: 'ok' }; },
      };
    },
  });

  assert.equal(result.deleted, true);
  assert.match(request.requestUrl, /pipe-stock-test\/image\/destroy$/);
  assert.equal(request.options.body.get('public_id'), 'pipestock/projects/company-1/photo');
  assert.equal(request.options.body.get('invalidate'), 'true');
  assert.equal(request.options.body.get('timestamp'), '1700000000');
  assert.equal(request.options.body.get('api_key'), '12345');

  const expected = createHash('sha1')
    .update('invalidate=true&public_id=pipestock/projects/company-1/photo&timestamp=1700000000super-secret')
    .digest('hex');
  assert.equal(request.options.body.get('signature'), expected);
}));

test('never deletes a stored image that belongs to another company', async () => withCloudinaryEnv(async () => {
  const url = 'https://res.cloudinary.com/pipe-stock-test/image/upload/v1700000000/pipestock/projects/company-1/photo.webp';
  let called = false;
  const result = await destroyStoredImage({
    url,
    kind: 'project',
    companyId: 'company-2',
    fetchImpl: async () => {
      called = true;
      throw new Error('should not run');
    },
  });

  assert.equal(result.skipped, true);
  assert.equal(result.deleted, false);
  assert.equal(called, false);
}));
