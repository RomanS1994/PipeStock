import { useRef, useState } from 'react';

import { Button, Icon } from '@shared/app/components/ui/PipeStockUI.jsx';
import './ImageUploadField.css';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const ACCEPTED_FILES = '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';

function isAllowedImageFile(file) {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  return ALLOWED_EXTENSIONS.has(extension);
}

export function ImageUploadField({ value = '', label = 'Фото', disabled = false, onUpload, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_BYTES) {
      setError('Файл завеликий. Максимальний розмір — 10 MB.');
      return;
    }

    if (!isAllowedImageFile(file)) {
      setError('Підтримуються JPG, PNG, WebP та HEIC/HEIF.');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const result = await onUpload?.(file);
      if (!result?.url) throw new Error('Upload returned no image URL');
      onChange?.(result.url);
    } catch (uploadError) {
      setError(uploadError?.data?.error || uploadError?.message || 'Не вдалося завантажити фото');
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="imageUploadField">
      <div className="imageUploadField-heading">
        <div><strong>{label}</strong><span>JPG, PNG, WebP або HEIC/HEIF · до 10 MB</span></div>
        {value ? <Button variant="text" disabled={disabled || uploading} onClick={() => onChange?.('')}>Видалити</Button> : null}
      </div>

      <div className={`imageUploadField-preview${value ? ' has-image' : ''}`}>
        {value ? <img src={value} alt="" /> : <Icon name="building" size={34} />}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPTED_FILES} hidden onChange={handleFile} />
      <Button
        type="button"
        variant="secondary"
        fullWidth
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Завантажуємо фото…' : value ? 'Замінити фото' : 'Додати фото'}
      </Button>

      {error ? <p className="imageUploadField-error" role="alert">{error}</p> : null}
    </section>
  );
}
