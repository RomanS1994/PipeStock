import { useEffect, useMemo, useState } from 'react';

import { BackLink, Button, SearchField, TextField } from '@shared/app/components/ui/PipeStockUI.jsx';
import { ImageUploadField } from '../../components/ImageUploadField/ImageUploadField.jsx';
import { useGetMaterialCatalogQuery, useUpdateMaterialImageMutation } from '../../features/orders/ordersApi.js';
import { uploadImageFile, usePrepareImageUploadMutation } from '../../features/uploads/uploadsApi.js';
import './MaterialCatalogPage.css';

const PHOTO_SOURCES = [
  {
    name: 'Geberit Media Portal',
    url: 'https://media.geberit.com/',
  },
  {
    name: 'Wavin CZ',
    url: 'https://wavin.com/cz/c',
  },
];

export function MaterialCatalogPage() {
  const { data: catalog = [], isLoading, isError, refetch } = useGetMaterialCatalogQuery();
  const [updateMaterialImage, updateState] = useUpdateMaterialImageMutation();
  const [prepareImageUpload] = usePrepareImageUploadMutation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter(item => [item.categoryLabel, item.diameter, item.type, item.name]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query)));
  }, [catalog, search]);

  const selected = catalog.find(item => item.id === selectedId) || null;

  useEffect(() => {
    setImageUrl(selected?.imageUrl || '');
  }, [selectedId, selected?.imageUrl]);

  async function handleUpload(file) {
    const upload = await prepareImageUpload('material').unwrap();
    return uploadImageFile(file, upload);
  }

  async function saveImage(nextImageUrl) {
    if (!selected) return;
    await updateMaterialImage({ catalogItemId: selected.id, imageUrl: nextImageUrl }).unwrap();
    setImageUrl(nextImageUrl);
  }

  async function handleUrlSave(event) {
    event.preventDefault();
    await saveImage(imageUrl.trim());
  }

  return (
    <div className="pageStack materialCatalogPage">
      <header className="materialCatalogHeader">
        <BackLink to="/profile" />
        <div><h1>Фото матеріалів</h1><p>До кожного generic матеріалу прив’язується тільки фотографія.</p></div>
        <span />
      </header>

      <section className="screenCard officialSourcesCard">
        <div><strong>Джерела фото</strong><span>Шукайте якісне фото в офіційному каталозі виробника та вставляйте пряме HTTPS-посилання.</span></div>
        <div className="officialSourcesLinks">
          {PHOTO_SOURCES.map(source => (
            <a key={source.name} href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>
          ))}
        </div>
      </section>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук матеріалу…" />

      {isLoading ? <section className="screenCard">Завантажуємо матеріали…</section> : null}
      {isError ? <section className="screenCard materialCatalogState"><strong>Не вдалося завантажити матеріали</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError ? (
        <div className="materialCatalogLayout">
          <section className="materialCatalogList">
            {visible.map(item => (
              <button key={item.id} type="button" className={`materialCatalogRow${selectedId === item.id ? ' is-selected' : ''}`} onClick={() => setSelectedId(item.id)}>
                <span className={`materialCatalogThumb${item.imageUrl ? ' has-image' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.categoryLabel.slice(0, 2).toUpperCase()}</span>
                <span><strong>{item.categoryLabel} {item.diameter}</strong><small>{item.type}</small></span>
                <b>{item.imageUrl ? 'Фото' : 'Без фото'}</b>
              </button>
            ))}
          </section>

          {selected ? (
            <section className="screenCard materialCatalogEditor">
              <div className="materialCatalogEditorTitle"><strong>{selected.categoryLabel} {selected.diameter}</strong><span>{selected.type}</span></div>

              <form className="materialSourceForm" onSubmit={handleUrlSave}>
                <TextField
                  label="URL фотографії"
                  value={imageUrl}
                  onChange={event => setImageUrl(event.target.value)}
                  placeholder="https://…"
                />
                <Button type="submit" fullWidth disabled={updateState.isLoading}>
                  {updateState.isLoading ? 'Зберігаємо…' : 'Зберегти фото з каталогу'}
                </Button>
              </form>

              <div className="materialPhotoDivider"><span>або</span></div>

              <ImageUploadField
                value={selected.imageUrl || ''}
                label="Власне фото"
                disabled={updateState.isLoading}
                onUpload={handleUpload}
                onChange={saveImage}
              />

              {updateState.error ? <p className="materialCatalogError">{updateState.error?.data?.error || 'Не вдалося зберегти фото'}</p> : null}
            </section>
          ) : <section className="screenCard materialCatalogState"><strong>Виберіть матеріал</strong><p>Тут можна вставити фото з офіційного каталогу або завантажити власне.</p></section>}
        </div>
      ) : null}
    </div>
  );
}
