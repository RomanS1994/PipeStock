import { useMemo, useState } from 'react';

import { BackLink, SearchField } from '@shared/app/components/ui/PipeStockUI.jsx';
import { ImageUploadField } from '../../components/ImageUploadField/ImageUploadField.jsx';
import { useGetMaterialCatalogQuery, useUpdateMaterialImageMutation } from '../../features/orders/ordersApi.js';
import { uploadImageFile, usePrepareImageUploadMutation } from '../../features/uploads/uploadsApi.js';
import './MaterialCatalogPage.css';

export function MaterialCatalogPage() {
  const { data: catalog = [], isLoading, isError, refetch } = useGetMaterialCatalogQuery();
  const [updateMaterialImage, updateState] = useUpdateMaterialImageMutation();
  const [prepareImageUpload] = usePrepareImageUploadMutation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;
    return catalog.filter(item => [item.categoryLabel, item.diameter, item.type, item.name, item.sku].filter(Boolean).some(value => String(value).toLowerCase().includes(query)));
  }, [catalog, search]);

  const selected = catalog.find(item => item.id === selectedId) || null;

  async function handleUpload(file) {
    const upload = await prepareImageUpload('material').unwrap();
    return uploadImageFile(file, upload);
  }

  async function handleImageChange(imageUrl) {
    if (!selected) return;
    await updateMaterialImage({ catalogItemId: selected.id, imageUrl }).unwrap();
  }

  return (
    <div className="pageStack materialCatalogPage">
      <header className="materialCatalogHeader">
        <BackLink to="/profile" />
        <div><h1>Каталог матеріалів</h1><p>Додавайте фото до позицій каталогу.</p></div>
        <span />
      </header>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук матеріалу…" />

      {isLoading ? <section className="screenCard">Завантажуємо каталог…</section> : null}
      {isError ? <section className="screenCard materialCatalogState"><strong>Не вдалося завантажити каталог</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError ? (
        <div className="materialCatalogLayout">
          <section className="materialCatalogList">
            {visible.map(item => (
              <button key={item.id} type="button" className={`materialCatalogRow${selectedId === item.id ? ' is-selected' : ''}`} onClick={() => setSelectedId(item.id)}>
                <span className={`materialCatalogThumb${item.imageUrl ? ' has-image' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.categoryLabel.slice(0,2).toUpperCase()}</span>
                <span><strong>{item.categoryLabel} {item.diameter}</strong><small>{item.type}</small></span>
                <b>{item.imageUrl ? 'Фото' : 'Без фото'}</b>
              </button>
            ))}
          </section>

          {selected ? (
            <section className="screenCard materialCatalogEditor">
              <div><strong>{selected.categoryLabel} {selected.diameter}</strong><span>{selected.type}</span></div>
              <ImageUploadField value={selected.imageUrl || ''} label="Фото матеріалу" disabled={updateState.isLoading} onUpload={handleUpload} onChange={handleImageChange} />
              {updateState.error ? <p className="materialCatalogError">{updateState.error?.data?.error || 'Не вдалося зберегти фото'}</p> : null}
            </section>
          ) : <section className="screenCard materialCatalogState"><strong>Виберіть матеріал</strong><p>Після вибору тут можна додати або замінити фото.</p></section>}
        </div>
      ) : null}
    </div>
  );
}
