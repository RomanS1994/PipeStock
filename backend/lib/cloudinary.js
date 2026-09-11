import { createHash, randomUUID } from 'node:crypto';

const IMAGE_KINDS = new Set(['project', 'material']);

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
  const stringToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${stringToSign}${apiSecret}`).digest('hex');

  return {
    provider: 'cloudinary',
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
    apiKey,
    timestamp,
    publicId,
    signature,
    maxBytes: 10 * 1024 * 1024,
  };
}
