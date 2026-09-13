import { baseApi } from '@shared/app/api/baseApi.js';

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
  if (!file || !upload) throw new Error('Upload configuration is missing');
  if (upload.maxBytes && file.size > upload.maxBytes) {
    throw new Error('Файл завеликий. Максимальний розмір — 10 MB.');
  }

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
