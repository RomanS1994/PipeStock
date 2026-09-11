import { requireAuth } from '../auth/current-user.js';
import { createSignedImageUpload, isImageStorageConfigured } from '../lib/cloudinary.js';
import { HttpError } from '../lib/errors.js';
import { readJsonBody, sendJson } from '../lib/http.js';

function getActiveMembership(user) {
  return (user.memberships || []).find(
    membership => membership.status === 'ACTIVE' && !membership.deletedAt,
  );
}

export async function handleUploadRoutes(request, response, { pathName }) {
  if (request.method !== 'POST' || pathName !== '/api/uploads/signature') return false;

  const user = await requireAuth(request);
  const membership = getActiveMembership(user);
  if (!membership) throw new HttpError(403, 'Company access is required');
  if (membership.role !== 'MANAGER') throw new HttpError(403, 'Manager access is required');
  if (!isImageStorageConfigured()) {
    throw new HttpError(503, 'Image storage is not configured');
  }

  const body = await readJsonBody(request);
  const kind = String(body.kind || '').trim().toLowerCase();

  try {
    const upload = createSignedImageUpload({ kind, companyId: membership.companyId });
    sendJson(response, 200, { upload });
  } catch (error) {
    if (error?.message === 'Unsupported image upload kind') {
      throw new HttpError(400, error.message);
    }
    throw error;
  }

  return true;
}
