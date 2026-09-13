import { createHash, randomUUID } from 'node:crypto';

const IMAGE_KINDS = new Set(['project', 'material']);
const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function requiredEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function isImageStorageConfigured() {
  return Boolean(
    String(process.env.CLOUDINARY_CLOUD_NAME || '').trim() &&
    String(process.env.CLOUDINARY_API_KEY || '').trim() &&
    String(process.env.CLOUDINARY_API_SECRET || '').trim(),
  );
}

export function createSignedImageUpload({ kind, companyId, now = Date.now() }) {
  const normalizedKind = String(kind || '').trim().toLowerCase();
  if (!IMAGE_KINDS.has(normalizedKind)) throw new Error('Unsupported image upload kind');

  const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = requiredEnv('CLOUDINARY_API_KEY');
  const apiSecret = requiredEnv('CLOUDINARY_API_SECRET');
  const timestamp = Math.floor(now / 1000);
  const publicId = `pipestock/${normalizedKind}s/${companyId}/${randomUUID()}`;
  const allowedFormats = ALLOWED_IMAGE_FORMATS.join(',');
  const overwrite = 'false';
  const stringToSign = `allowed_formats=${allowedFormats}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${stringToSign}${apiSecret}`).digest('hex');

  return {
    provider: 'cloudinary',
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    apiKey,
    timestamp,
    publicId,
    signature,
    allowedFormats,
    overwrite,
    maxBytes: MAX_IMAGE_BYTES,
  };
}

function parseStoredImageUrl({ url, kind, companyId }) {
  const value = String(url || '').trim();
  if (!value) return null;

  const normalizedKind = String(kind || '').trim().toLowerCase();
  if (!IMAGE_KINDS.has(normalizedKind)) throw new Error('Unsupported image upload kind');

  const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME');
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('Invalid image URL');
  }

  if (parsed.protocol !== 'https:' || parsed.hostname !== 'res.cloudinary.com') {
    throw new Error('Image must be stored in PipeStock image storage');
  }

  let segments;
  try {
    segments = parsed.pathname.split('/').filter(Boolean).map(segment => decodeURIComponent(segment));
  } catch {
    throw new Error('Invalid stored image URL');
  }

  if (
    segments[0] !== cloudName ||
    segments[1] !== 'image' ||
    segments[2] !== 'upload' ||
    !/^v\d+$/.test(segments[3] || '')
  ) {
    throw new Error('Image must be stored in PipeStock image storage');
  }

  // Only accept the original delivery URL returned by the signed upload. Allowing
  // arbitrary transformation segments here would let callers persist unbounded CDN
  // transformations instead of the asset that PipeStock actually uploaded.
  const publicIdSegments = segments.slice(4);
  if (publicIdSegments.length !== 4) throw new Error('Invalid stored image URL');
  if (
    publicIdSegments[0] !== 'pipestock' ||
    publicIdSegments[1] !== `${normalizedKind}s` ||
    publicIdSegments[2] !== String(companyId)
  ) {
    throw new Error('Image does not belong to this company');
  }

  const filename = publicIdSegments[3];
  const extension = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
  if (!ALLOWED_IMAGE_FORMATS.includes(extension)) throw new Error('Unsupported image format');

  const publicId = [...publicIdSegments.slice(0, -1), filename.slice(0, -(extension.length + 1))].join('/');
  if (!publicId.endsWith('/') && publicId.split('/').pop()) {
    return { url: parsed.toString(), publicId, extension };
  }
  throw new Error('Invalid stored image URL');
}

export function validateStoredImageUrl({ url, kind, companyId }) {
  return parseStoredImageUrl({ url, kind, companyId })?.url || null;
}

export async function verifyStoredImageAsset({ url, kind, companyId, fetchImpl = fetch }) {
  const stored = parseStoredImageUrl({ url, kind, companyId });
  if (!stored) return null;

  const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = requiredEnv('CLOUDINARY_API_KEY');
  const apiSecret = requiredEnv('CLOUDINARY_API_SECRET');
  const encodedPublicId = stored.publicId.split('/').map(encodeURIComponent).join('/');
  const resourceUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/image/upload/${encodedPublicId}`;
  const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  let response;
  try {
    response = await fetchImpl(resourceUrl, {
      method: 'GET',
      headers: { Authorization: `Basic ${authorization}` },
    });
  } catch {
    throw new Error('Could not verify uploaded image');
  }

  const asset = await response.json().catch(() => null);
  if (!response.ok || !asset) throw new Error('Uploaded image was not found');
  if (asset.public_id !== stored.publicId || asset.resource_type !== 'image' || asset.type !== 'upload') {
    throw new Error('Uploaded image does not match PipeStock storage');
  }

  const format = String(asset.format || '').toLowerCase();
  if (!ALLOWED_IMAGE_FORMATS.includes(format)) throw new Error('Unsupported image format');
  if (!Number.isFinite(Number(asset.bytes)) || Number(asset.bytes) <= 0) {
    throw new Error('Uploaded image metadata is invalid');
  }
  if (Number(asset.bytes) > MAX_IMAGE_BYTES) {
    throw new Error('Image is too large. Maximum size is 10 MB.');
  }

  return {
    url: stored.url,
    publicId: stored.publicId,
    bytes: Number(asset.bytes),
    format,
    width: Number(asset.width) || null,
    height: Number(asset.height) || null,
  };
}

export async function destroyStoredImage({ url, kind, companyId, now = Date.now(), fetchImpl = fetch }) {
  let stored;
  try {
    stored = parseStoredImageUrl({ url, kind, companyId });
  } catch {
    return { skipped: true, deleted: false };
  }
  if (!stored) return { skipped: true, deleted: false };

  const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = requiredEnv('CLOUDINARY_API_KEY');
  const apiSecret = requiredEnv('CLOUDINARY_API_SECRET');
  const timestamp = Math.floor(now / 1000);
  const invalidate = 'true';
  const stringToSign = `invalidate=${invalidate}&public_id=${stored.publicId}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${stringToSign}${apiSecret}`).digest('hex');
  const body = new URLSearchParams({
    public_id: stored.publicId,
    timestamp: String(timestamp),
    invalidate,
    api_key: apiKey,
    signature,
  });

  let response;
  try {
    response = await fetchImpl(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
  } catch {
    throw new Error('Could not delete stored image');
  }

  const data = await response.json().catch(() => ({}));
  const result = String(data?.result || '');
  if (!response.ok || !['ok', 'not found'].includes(result)) {
    throw new Error(data?.error?.message || 'Could not delete stored image');
  }

  return { skipped: false, deleted: result === 'ok', result };
}

export const IMAGE_UPLOAD_MAX_BYTES = MAX_IMAGE_BYTES;
export const IMAGE_UPLOAD_ALLOWED_FORMATS = Object.freeze([...ALLOWED_IMAGE_FORMATS]);
