import { baseApi } from '@shared/app/api/baseApi.js';

const IMAGE_MIME_FORMATS = new Map([
  ['image/jpeg', new Set(['jpg', 'jpeg'])],
  ['image/png', new Set(['png'])],
  ['image/webp', new Set(['webp'])],
  ['image/heic', new Set(['heic'])],
  ['image/heif', new Set(['heif'])],
]);

function getFileExtension(file) {
  const name = String(file?.name || '');
  if (!name.includes('.')) return '';
  return name.split('.').pop().toLowerCase();
}

function validateImageFile(file, upload) {
  if (!file || !upload) throw new Error('Upload configuration is missing');
  if (upload.maxBytes && file.size > upload.maxBytes) {
    throw new Error('Файл завеликий. Максимальний розмір — 10 MB.');
  }

  const extension = getFileExtension(file);
  const allowedFormats = new Set(
    String(upload.allowedFormats || '')
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean),
  );
  if (!extension || (allowedFormats.size && !allowedFormats.has(extension))) {
    throw new Error('Підтримуються JPG, PNG, WebP та HEIC/HEIF.');
  }

  const mimeType = String(file.type || '').trim().toLowerCase();
  if (!mimeType) return;
  const mimeFormats = IMAGE_MIME_FORMATS.get(mimeType);
  if (!mimeFormats || !mimeFormats.has(extension)) {
    throw new Error('Тип файлу не відповідає формату зображення.');
  }
}

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    prepareImageUpload: builder.mutation({
      query: kind => ({
        url: '/uploads/signature',
        method: 'POST',
        body: { kind },
      }),
      transformResponse: response => response?.upload || null,
    }),
  }),
});

export const { usePrepareImageUploadMutation } = uploadsApi;

export async function uploadImageFile(file, upload) {
  validateImageFile(file, upload);

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', upload.apiKey);
  body.append('timestamp', String(upload.timestamp));
  body.append('public_id', upload.publicId);
  if (upload.allowedFormats) body.append('allowed_formats', upload.allowedFormats);
  if (upload.overwrite) body.append('overwrite', upload.overwrite);
  body.append('signature', upload.signature);

  const response = await fetch(upload.uploadUrl, { method: 'POST', body });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Не вдалося завантажити фото');
  }

  return {
    url: data.secure_url,
    publicId: data.public_id || upload.publicId,
    width: data.width || null,
    height: data.height || null,
    format: data.format || null,
    bytes: data.bytes || file.size,
  };
}
