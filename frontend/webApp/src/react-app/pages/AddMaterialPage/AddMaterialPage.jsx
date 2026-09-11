import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Icon, SearchField, StepIndicator } from '@shared/app/components/ui/PipeStockUI.jsx';
import {
  useAddFavoriteMaterialMutation,
  useAddOrderItemMutation,
  useGetFavoriteMaterialsQuery,
  useGetMaterialCatalogQuery,
  useGetOrderQuery,
  useGetRecentMaterialsQuery,
  useRemoveFavoriteMaterialMutation,
} from '../../features/orders/ordersApi.js';
import '../OrderFlow/OrderFlow.css';
import './AddMaterialPage.css';
import { getMaterialCategoryImage, getMaterialImage } from './materialImageResolver.js';

function unique(values) {
  return [...new Set(values)];
}

function MaterialThumb({ item, className = 'materialTypeMark' }) {
  const image = getMaterialImage(item);
  return image
    ? <span className={`${className} has-image`}><img src={image} alt="" /></span>
    : <span className={className}>{item?.categoryLabel?.slice(0, 2).toUpperCase()}</span>;
}

function MaterialShortcut({ item, onClick }) {
  return (
    <button type="button" className="materialShortcutCard" onClick={() => onClick(item)}>
      <MaterialThumb item={item} className="materialShortcutMark" />
      <span className="materialShortcutCopy">
        <strong>{item.categoryLabel} {item.diameter}</strong>
        <span>{item.type}</span>
      </span>
    </button>
  );
}

export function AddMaterialPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order } = useGetOrderQuery(orderId);
  const { data: catalog = [], isLoading } = useGetMaterialCatalogQuery();
  const { data: favorites = [] } = useGetFavoriteMaterialsQuery();
  const { data: recent = [] } = useGetRecentMaterialsQuery();
  const [addFavorite] = useAddFavoriteMaterialMutation();
  const [removeFavorite] = useRemoveFavoriteMaterialMutation();
  const [addItem, { isLoading: adding, error }] = useAddOrderItemMutation();
  const [step, setStep] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [categoryKey, setCategoryKey] = useState('');
  const [diameter, setDiameter] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [search, setSearch] = useState('');

  const favoriteIds = useMemo(() => new Set(favorites.map(item => item.id)), [favorites]);
  const categories = useMemo(() => {
    const map = new Map();
    catalog.forEach(item => map.set(item.categoryKey, item.categoryLabel));
    return [...map.entries()].map(([key, label]) => ({ key, label }));
  }, [catalog]);

  const categoryItems = useMemo(() => catalog.filter(item => item.categoryKey === categoryKey), [catalog, categoryKey]);
  const diameters = useMemo(() => unique(categoryItems.map(item => item.diameter)), [categoryItems]);
  const typeItems = useMemo(() => categoryItems.filter(item => item.diameter === diameter && (!search.trim() || `${item.type} ${item.name}`.toLowerCase().includes(search.toLowerCase()))), [categoryItems, diameter, search]);
  const selectedItem = catalog.find(item => item.id === catalogItemId);
  const selectedIsFavorite = selectedItem ? favoriteIds.has(selectedItem.id) : false;

  function selectCategory(key) {
    setCategoryKey(key);
    setDiameter('');
    setCatalogItemId('');
    setStep(2);
  }

  function selectDiameter(value) {
    setDiameter(value);
    setCatalogItemId('');
    setStep(3);
  }

  function selectType(id) {
    setCatalogItemId(id);
    setStep(4);
  }

  function selectShortcut(item) {
    setCategoryKey(item.categoryKey);
    setDiameter(item.diameter);
    setCatalogItemId(item.id);
    setQuantity(1);
    setStep(4);
  }

  function resetForNextMaterial() {
    setCategoryKey('');
    setDiameter('');
    setCatalogItemId('');
    setQuantity(1);
    setSearch('');
    setShowShortcuts(true);
    setStep(1);
  }

  function goBackStep() {
    if (step === 1) return navigate(`/orders/${orderId}`);
    setStep(value => Math.max(1, value - 1));
  }

  async function toggleFavorite() {
    if (!selectedItem) return;
    if (selectedIsFavorite) await removeFavorite(selectedItem.id);
    else await addFavorite(selectedItem.id);
  }

  async function handleAdd() {
    if (!catalogItemId || quantity <= 0) return;
    try {
      await addItem({ orderId, catalogItemId, quantity }).unwrap();
      resetForNextMaterial();
    } catch {
      // API error below.
    }
  }

  return (
    <div className="pageStack materialWizard">
      <header className="materialWizardTopbar">
        <button type="button" className="materialWizardBack" onClick={goBackStep} aria-label="Назад"><span>‹</span></button>
        <strong>Додати матеріал</strong>
        <span />
      </header>
      <StepIndicator current={step} total={4} />
      <p className="materialWizardOrder">Заказ #{order?.number || '…'} · {order?.title || ''}</p>

      {isLoading ? <section className="screenCard">Завантажуємо каталог…</section> : null}

      {!isLoading && step === 1 ? (
        <section className="materialWizardStage">
          {showShortcuts && favorites.length ? (
            <div className="materialShortcutSection">
              <div className="materialShortcutHeading"><span><Icon name="star" size={16} /> Обране</span><small>{favorites.length}</small></div>
              <div className="materialShortcutList">
                {favorites.slice(0, 6).map(item => <MaterialShortcut key={item.id} item={item} onClick={selectShortcut} />)}
              </div>
            </div>
          ) : null}

          {showShortcuts && recent.length ? (
            <div className="materialShortcutSection">
              <div className="materialShortcutHeading"><span><Icon name="clock" size={16} /> Нещодавні</span><small>{recent.length}</small></div>
              <div className="materialShortcutList">
                {recent.slice(0, 6).map(item => <MaterialShortcut key={item.id} item={item} onClick={selectShortcut} />)}
              </div>
            </div>
          ) : null}

          <div className="compactHeader"><h1>1. Виберіть категорію</h1><p>Оберіть тип матеріалу</p></div>
          <div className="materialCategoryGrid">
            {categories.map(category => {
              const image = getMaterialCategoryImage(category.key);
              return (
                <button key={category.key} type="button" className="materialCategoryCard" onClick={() => selectCategory(category.key)}>
                  <span className={image ? 'has-image' : ''}>{image ? <img src={image} alt="" /> : category.label.slice(0, 2).toUpperCase()}</span>
                  <strong>{category.label}</strong>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="materialWizardStage">
          <div className="compactHeader"><h1>2. Виберіть діаметр</h1><p>{categories.find(item => item.key === categoryKey)?.label}</p></div>
          <div className="materialDiameterGrid">
            {diameters.map(value => <button key={value} type="button" className={diameter === value ? 'is-selected' : ''} onClick={() => selectDiameter(value)}>{value}</button>)}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="materialWizardStage">
          <div className="compactHeader"><h1>3. Виберіть тип</h1><p>{categories.find(item => item.key === categoryKey)?.label} · {diameter}</p></div>
          <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук матеріалу…" />
          <div className="materialTypeList">
            {typeItems.map(item => (
              <button key={item.id} type="button" className="materialTypeRow" onClick={() => selectType(item.id)}>
                <MaterialThumb item={item} />
                <span><strong>{item.type}</strong><small>{item.name}</small></span>
                <b>›</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 4 && selectedItem ? (
        <section className="materialWizardStage materialQuantityStage">
          <div className="compactHeader"><h1>4. Вкажіть кількість</h1><p>Перевірте матеріал і додайте в заказ</p></div>
          <div className="selectedMaterialCard">
            <MaterialThumb item={selectedItem} className="selectedMaterialMark" />
            <div><strong>{selectedItem.categoryLabel} {selectedItem.diameter}</strong><span>{selectedItem.type}</span></div>
            <button type="button" className={`materialFavoriteButton${selectedIsFavorite ? ' is-active' : ''}`} onClick={toggleFavorite} aria-label={selectedIsFavorite ? 'Прибрати з обраного' : 'Додати в обране'}><Icon name="star" size={19} /></button>
          </div>
          <div className="quantityStepper">
            <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))}>−</button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => setQuantity(value => value + 1)}>+</button>
          </div>
          <span className="quantityUnit">{selectedItem.unit}</span>
          <div className="quantityQuickButtons">
            {[1, 5, 10].map(amount => <button key={amount} type="button" onClick={() => setQuantity(value => value + amount)}>+{amount}</button>)}
          </div>
          {error ? <p className="orderError">{error?.data?.error || 'Не вдалося додати матеріал'}</p> : null}
          <Button fullWidth disabled={adding} onClick={handleAdd}>{adding ? 'Додаємо…' : 'Додати'}</Button>
        </section>
      ) : null}
    </div>
  );
}