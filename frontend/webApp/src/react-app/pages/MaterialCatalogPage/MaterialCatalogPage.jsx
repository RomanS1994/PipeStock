import { useEffect, useMemo, useState } from 'react';

import { BackLink, Button, SearchField, TextField } from '@shared/app/components/ui/PipeStockUI.jsx';
import { ImageUploadField } from '../../components/ImageUploadField/ImageUploadField.jsx';
import {
  useGetMaterialCatalogQuery,
  useGetMaterialSourcesQuery,
  useUpdateMaterialImageMutation,
  useUpdateMaterialSourceMutation,
} from '../../features/orders/ordersApi.js';
import { uploadImageFile, usePrepareImageUploadMutation } from '../../features/uploads/uploadsApi.js';
import './MaterialCatalogPage.css';

const OFFICIAL_SOURCES = [
  {
    brand: 'Geberit',
    label: 'Geberit Product Catalogue',
    sourceUrl: 'https://cdn-geberit-country-cz.prod.web.geberit.com/sanitarni-a-potrubni-systemy/digitalni-nastroje/katalog-vyrobku/',
    mediaUrl: 'https://media.geberit.com/',
  },
  {
    brand: 'Wavin',
    label: 'Wavin CZ Product Catalogue',
    sourceUrl: 'https://wavin.com/cz/c',
    mediaUrl: 'https://wavin.com/cz/katalogy-vyrobku-technicke-manualy',
  },
];

const EMPTY_SOURCE = {
  brand: '',
  manufacturerSku: '',
  sourceLabel: '',
  sourceUrl: '',
  imageSourceUrl: '',
  imageUrl: '',
};

export function MaterialCatalogPage() {
  const { data: catalog = [], isLoading, isError, refetch } = useGetMaterialCatalogQuery();
  const { data: sources = [] } = useGetMaterialSourcesQuery();
  const [updateMaterialImage, updateImageState] = useUpdateMaterialImageMutation();
  const [updateMaterialSource, updateSourceState] = useUpdateMaterialSourceMutation();
  const [prepareImageUpload] = usePrepareImageUploadMutation();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [sourceForm, setSourceForm] = useState(EMPTY_SOURCE);

  const sourceMap = useMemo(() => new Map(sources.map(item => [item.id, item])), [sources]);
  const enrichedCatalog = useMemo(() => catalog.map(item => ({ ...item, ...(sourceMap.get(item.id) || {}) })), [catalog, sourceMap]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrichedCatalog;
    return enrichedCatalog.filter(item => [item.categoryLabel, item.diameter, item.type, item.name, item.sku, item.brand, item.manufacturerSku]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query)));
  }, [enrichedCatalog, search]);

  const selected = enrichedCatalog.find(item => item.id === selectedId) || null;

  useEffect(() => {
    if (!selected) {
      setSourceForm(EMPTY_SOURCE);
      return;
    }
    setSourceForm({
      brand: selected.brand || '',
      manufacturerSku: selected.manufacturerSku || '',
      sourceLabel: selected.sourceLabel || '',
      sourceUrl: selected.sourceUrl || '',
      imageSourceUrl: selected.imageSourceUrl || '',
      imageUrl: selected.imageUrl || '',
    });
  }, [selectedId, selected?.brand, selected?.manufacturerSku, selected?.sourceLabel, selected?.sourceUrl, selected?.imageSourceUrl, selected?.imageUrl]);

  async function handleUpload(file) {
    const upload = await prepareImageUpload('material').unwrap();
    return uploadImageFile(file, upload);
  }

  async function handleImageChange(imageUrl) {
    if (!selected) return;
    await updateMaterialImage({ catalogItemId: selected.id, imageUrl }).unwrap();
  }

  function applyPreset(preset) {
    setSourceForm(current => ({
      ...current,
      brand: preset.brand,
      sourceLabel: preset.label,
      sourceUrl: preset.sourceUrl,
      imageSourceUrl: preset.mediaUrl,
    }));
  }

  async function handleSourceSave(event) {
    event.preventDefault();
    if (!selected) return;
    await updateMaterialSource({ catalogItemId: selected.id, ...sourceForm }).unwrap();
  }

  return (
    <div className="pageStack materialCatalogPage">
      <header className="materialCatalogHeader">
        <BackLink to="/profile" />
        <div><h1>Каталог матеріалів</h1><p>Прив’язуйте позиції до офіційних каталогів виробників.</p></div>
        <span />
      </header>

      <section className="screenCard officialSourcesCard">
        <div><strong>Офіційні джерела</strong><span>Для точного товару зберігайте бренд, артикул і сторінку виробника.</span></div>
        <div className="officialSourcesLinks">
          {OFFICIAL_SOURCES.map(source => (
            <a key={source.brand} href={source.sourceUrl} target="_blank" rel="noreferrer">{source.brand} ↗</a>
          ))}
        </div>
      </section>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук матеріалу, бренду або артикула…" />

      {isLoading ? <section className="screenCard">Завантажуємо каталог…</section> : null}
      {isError ? <section className="screenCard materialCatalogState"><strong>Не вдалося завантажити каталог</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError ? (
        <div className="materialCatalogLayout">
          <section className="materialCatalogList">
            {visible.map(item => (
              <button key={item.id} type="button" className={`materialCatalogRow${selectedId === item.id ? ' is-selected' : ''}`} onClick={() => setSelectedId(item.id)}>
                <span className={`materialCatalogThumb${item.imageUrl ? ' has-image' : ''}`}>{item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.categoryLabel.slice(0,2).toUpperCase()}</span>
                <span><strong>{item.categoryLabel} {item.diameter}</strong><small>{item.brand ? `${item.brand}${item.manufacturerSku ? ` · ${item.manufacturerSku}` : ''}` : item.type}</small></span>
                <b>{item.sourceUrl ? 'Official' : item.imageUrl ? 'Фото' : 'Без джерела'}</b>
              </button>
            ))}
          </section>

          {selected ? (
            <section className="screenCard materialCatalogEditor">
              <div className="materialCatalogEditorTitle"><strong>{selected.categoryLabel} {selected.diameter}</strong><span>{selected.type}</span></div>

              <div className="sourcePresetRow">
                {OFFICIAL_SOURCES.map(source => (
                  <button key={source.brand} type="button" onClick={() => applyPreset(source)}>{source.brand}</button>
                ))}
              </div>

              <form className="materialSourceForm" onSubmit={handleSourceSave}>
                <TextField label="Виробник" value={sourceForm.brand} onChange={event => setSourceForm(current => ({ ...current, brand: event.target.value }))} placeholder="Geberit / Wavin / Viega…" />
                <TextField label="Артикул виробника" value={sourceForm.manufacturerSku} onChange={event => setSourceForm(current => ({ ...current, manufacturerSku: event.target.value }))} placeholder="Наприклад 111.300.00.5" />
                <TextField label="Назва джерела" value={sourceForm.sourceLabel} onChange={event => setSourceForm(current => ({ ...current, sourceLabel: event.target.value }))} placeholder="Official product catalogue" />
                <TextField label="Сторінка товару / каталогу" value={sourceForm.sourceUrl} onChange={event => setSourceForm(current => ({ ...current, sourceUrl: event.target.value }))} placeholder="https://…" />
                <TextField label="Джерело фото" value={sourceForm.imageSourceUrl} onChange={event => setSourceForm(current => ({ ...current, imageSourceUrl: event.target.value }))} placeholder="https://…" />
                <TextField label="Прямий URL фото" value={sourceForm.imageUrl} onChange={event => setSourceForm(current => ({ ...current, imageUrl: event.target.value }))} placeholder="https://…" />
                <Button type="submit" fullWidth disabled={updateSourceState.isLoading}>{updateSourceState.isLoading ? 'Зберігаємо…' : 'Зберегти офіційне джерело'}</Button>
              </form>

              {selected.sourceUrl ? <a className="materialOfficialLink" href={selected.sourceUrl} target="_blank" rel="noreferrer">Відкрити офіційну сторінку ↗</a> : null}

              <ImageUploadField value={selected.imageUrl || ''} label="Власне/резервне фото" disabled={updateImageState.isLoading} onUpload={handleUpload} onChange={handleImageChange} />
              {(updateImageState.error || updateSourceState.error) ? <p className="materialCatalogError">{updateImageState.error?.data?.error || updateSourceState.error?.data?.error || 'Не вдалося зберегти зміни'}</p> : null}
            </section>
          ) : <section className="screenCard materialCatalogState"><strong>Виберіть матеріал</strong><p>Після вибору тут можна прив’язати офіційний каталог, артикул і фото.</p></section>}
        </div>
      ) : null}
    </div>
  );
}
