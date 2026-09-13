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
  const stringToSign = `allowed_formats=${allowedFormats}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${stringToSign}${apiSecret}`).digest('hex');

  return {
    provider: 'cloudinary',
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    apiKey,
    timestamp,
    publicId,
    signature,
    allowedFormats,
    maxBytes: MAX_IMAGE_BYTES,
  };
}

export function validateStoredImageUrl({ url, kind, companyId }) {
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

  const segments = parsed.pathname.split('/').filter(Boolean).map(segment => decodeURIComponent(segment));
  if (segments[0] !== cloudName || segments[1] !== 'image' || segments[2] !== 'upload') {
    throw new Error('Image must be stored in PipeStock image storage');
  }

  const versionIndex = segments.findIndex((segment, index) => index >= 3 && /^v\d+$/.test(segment));
  if (versionIndex < 0) throw new Error('Invalid stored image URL');

  const publicIdSegments = segments.slice(versionIndex + 1);
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

  return parsed.toString();
}

export const IMAGE_UPLOAD_MAX_BYTES = MAX_IMAGE_BYTES;
export const IMAGE_UPLOAD_ALLOWED_FORMATS = Object.freeze([...ALLOWED_IMAGE_FORMATS]);
