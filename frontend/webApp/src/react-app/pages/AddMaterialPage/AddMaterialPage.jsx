import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Icon, StepIndicator } from '@shared/app/components/ui/PipeStockUI.jsx';
import {
  useAddFavoriteMaterialMutation,
  useAddOrderItemMutation,
  useGetMaterialBootstrapQuery,
  useGetOrderQuery,
  useRemoveFavoriteMaterialMutation,
} from '../../features/orders/ordersApi.js';
import '../OrderFlow/OrderFlow.css';
import './AddMaterialPage.css';
import { getMaterialCategoryImage, getMaterialImage } from './materialImageResolver.js';
import { MaterialSearch } from './MaterialSearch.jsx';

const MAX_QUANTITY = 99999;
const CATEGORY_ORDER = ['STEEL', 'PPR', 'CU', 'MLCP', 'PEX', 'HT', 'KG', 'BRASS', 'VALVES', 'GEBERIT', 'SANITA', 'OTHER'];
const CATEGORY_LABELS = { CU: 'Měď', STEEL: 'Uhlíková ocel' };
const TYPE_ORDER = [
  'Trubka',
  'Koleno 15°',
  'Koleno 30°',
  'Koleno 45°',
  'Koleno 67°',
  'Koleno 87°',
  'Koleno 90°',
  'Oblouk 90°',
  'T-kus',
  'Odbočka 45°',
  'Odbočka 67°',
  'Odbočka 87°',
  'Dvojitá odbočka',
  'Spojka',
  'Přesuvná spojka',
  'Přesuvné hrdlo',
  'Redukce',
  'Přechodka M',
  'Přechodka F',
  'Nástěnné koleno',
  'Šroubení',
  'Příruba',
  'Křížení',
  'Kompenzační smyčka',
  'Zátka',
  'Revizní kus',
  'Přechod HT/KG',
];

function unique(values) {
  return [...new Set(values)];
}

function getCategoryDisplayLabel(categoryKey, fallbackLabel = '') {
  return CATEGORY_LABELS[String(categoryKey || '').trim().toUpperCase()] || fallbackLabel;
}

function getDiameterNumber(value) {
  const match = String(value || '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function sortByApprovedTypeOrder(a, b) {
  const aIndex = TYPE_ORDER.indexOf(a.type);
  const bIndex = TYPE_ORDER.indexOf(b.type);
  if (aIndex === -1 && bIndex === -1) return a.type.localeCompare(b.type, 'cs');
  if (aIndex === -1) return 1;
  if (bIndex === -1) return -1;
  return aIndex - bIndex;
}

function getBaseDiameters(item) {
  const value = String(item?.diameter || '').trim();
  if (!value || value === '—') return ['—'];

  if (value.startsWith('DN ')) return [value];

  if (!value.includes('×')) return [value];

  const sizes = value
    .split('×')
    .map(part => part.trim())
    .filter(part => !part.includes('/') && !part.includes('″') && !part.includes('"'))
    .map(part => {
      const match = part.replace(',', '.').match(/\d+(?:\.\d+)?/);
      return match ? `${match[0]} mm` : null;
    })
    .filter(Boolean);

  return unique(sizes.length ? sizes : [value]);
}

function matchesBaseDiameter(item, baseDiameter) {
  return getBaseDiameters(item).includes(baseDiameter);
}

function MaterialThumb({ item, className = 'materialTypeMark' }) {
  const image = getMaterialImage(item);
  return image
    ? <span className={`${className} has-image`}><img src={image} alt="" /></span>
    : <span className={className}>{getCategoryDisplayLabel(item?.categoryKey, item?.categoryLabel).slice(0, 2).toUpperCase()}</span>;
}

function MaterialShortcut({ item, onClick }) {
  return (
    <button type="button" className="materialShortcutCard" onClick={() => onClick(item)}>
      <MaterialThumb item={item} className="materialShortcutMark" />
      <span className="materialShortcutCopy">
        <strong>{getCategoryDisplayLabel(item.categoryKey, item.categoryLabel)} {item.diameter}</strong>
        <span>{item.type}</span>
      </span>
    </button>
  );
}

function WizardTopbar({ orderId, onBack }) {
  return (
    <header className="materialWizardTopbar">
      <button type="button" className="materialWizardBack" onClick={onBack} aria-label="Назад"><span>‹</span></button>
      <strong>Додати матеріал</strong>
      <span />
    </header>
  );
}

export function AddMaterialPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch: refetchOrder,
  } = useGetOrderQuery(orderId);
  const {
    data: materialBootstrap = {},
    isLoading,
    isError: catalogError,
    refetch: refetchCatalog,
  } = useGetMaterialBootstrapQuery();
  const catalog = materialBootstrap.catalog || [];
  const favorites = materialBootstrap.favorites || [];
  const recent = materialBootstrap.recent || [];
  const [addFavorite] = useAddFavoriteMaterialMutation();
  const [removeFavorite] = useRemoveFavoriteMaterialMutation();
  const [addItem, { isLoading: adding, error }] = useAddOrderItemMutation();
  const [step, setStep] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [search, setSearch] = useState('');
  const [fromShortcut, setFromShortcut] = useState(false);
  const [categoryKey, setCategoryKey] = useState('');
  const [diameter, setDiameter] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [catalogItemId, setCatalogItemId] = useState('');
  const [variantRequired, setVariantRequired] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const favoriteIds = useMemo(() => new Set(favorites.map(item => item.id)), [favorites]);
  const categories = useMemo(() => {
    const map = new Map();
    catalog.forEach(item => map.set(item.categoryKey, item.categoryLabel));
    return [...map.entries()]
      .map(([key, label]) => ({ key, label: getCategoryDisplayLabel(key, label) }))
      .sort((a, b) => {
        const aIndex = CATEGORY_ORDER.indexOf(a.key.toUpperCase());
        const bIndex = CATEGORY_ORDER.indexOf(b.key.toUpperCase());
        if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label, 'cs');
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }, [catalog]);

  const categoryItems = useMemo(() => catalog.filter(item => item.categoryKey === categoryKey), [catalog, categoryKey]);
  const diameters = useMemo(
    () => unique(categoryItems.flatMap(getBaseDiameters))
      .sort((a, b) => getDiameterNumber(a) - getDiameterNumber(b) || String(a).localeCompare(String(b), 'cs')),
    [categoryItems],
  );
  const matchingDiameterItems = useMemo(
    () => categoryItems.filter(item => matchesBaseDiameter(item, diameter)),
    [categoryItems, diameter],
  );
  const typeItems = useMemo(() => {
    const map = new Map();
    [...matchingDiameterItems].sort(sortByApprovedTypeOrder).forEach(item => {
      if (!map.has(item.type)) map.set(item.type, item);
    });
    return [...map.values()];
  }, [matchingDiameterItems]);
  const variantItems = useMemo(
    () => matchingDiameterItems
      .filter(item => item.type === materialType)
      .sort((a, b) => getDiameterNumber(a.diameter) - getDiameterNumber(b.diameter) || a.diameter.localeCompare(b.diameter, 'cs')),
    [matchingDiameterItems, materialType],
  );
  const variantDiameters = useMemo(() => new Set(variantItems.map(item => item.diameter)), [variantItems]);
  const selectedItem = catalog.find(item => item.id === catalogItemId);
  const selectedIsFavorite = selectedItem ? favoriteIds.has(selectedItem.id) : false;
  const quantityStep = variantRequired ? 5 : 4;

  function getCandidatesForType(type) {
    return matchingDiameterItems.filter(item => item.type === type);
  }

  function selectCategory(key) {
    setFromShortcut(false);
    setCategoryKey(key);
    setDiameter('');
    setMaterialType('');
    setCatalogItemId('');
    setVariantRequired(false);
    setStep(2);
  }

  function selectDiameter(value) {
    setDiameter(value);
    setMaterialType('');
    setCatalogItemId('');
    setVariantRequired(false);
    setStep(3);
  }

  function selectType(type) {
    const candidates = getCandidatesForType(type);
    setMaterialType(type);
    setCatalogItemId('');

    if (candidates.length === 1) {
      setCatalogItemId(candidates[0].id);
      setVariantRequired(false);
      setStep(4);
      return;
    }

    setVariantRequired(true);
    setStep(4);
  }

  function selectVariant(id) {
    setCatalogItemId(id);
    setStep(5);
  }

  function selectShortcut(item) {
    setCategoryKey(item.categoryKey);
    setDiameter(getBaseDiameters(item)[0] || item.diameter);
    setMaterialType(item.type);
    setCatalogItemId(item.id);
    setVariantRequired(false);
    setFromShortcut(true);
    setQuantity(1);
    setStep(4);
  }

  function resetForNextMaterial() {
    setCategoryKey('');
    setDiameter('');
    setMaterialType('');
    setCatalogItemId('');
    setVariantRequired(false);
    setFromShortcut(false);
    setQuantity(1);
    setSearch('');
    setShowShortcuts(true);
    setStep(1);
  }

  function goBackStep() {
    if (step === 1) return navigate(`/orders/${orderId}`);

    if (fromShortcut && step === 4) {
      setCatalogItemId('');
      setFromShortcut(false);
      setStep(1);
      return;
    }

    if (step === 5) {
      setCatalogItemId('');
      setStep(4);
      return;
    }

    if (step === 4 && !variantRequired && catalogItemId) {
      setCatalogItemId('');
      setMaterialType('');
      setStep(3);
      return;
    }

    if (step === 4) setMaterialType('');
    if (step === 3) setDiameter('');
    setStep(value => Math.max(1, value - 1));
  }

  async function toggleFavorite() {
    if (!selectedItem) return;
    if (selectedIsFavorite) await removeFavorite(selectedItem.id);
    else await addFavorite(selectedItem.id);
  }

  async function handleAdd() {
    if (!catalogItemId || quantity <= 0 || quantity > MAX_QUANTITY || order?.status !== 'DRAFT') return;
    try {
      await addItem({ orderId, catalogItemId, quantity }).unwrap();
      resetForNextMaterial();
    } catch {
      // API error below.
    }
  }

  if (orderLoading) {
    return (
      <div className="pageStack materialWizard">
        <WizardTopbar orderId={orderId} onBack={() => navigate(`/orders/${orderId}`)} />
        <section className="screenCard">Завантажуємо заказ…</section>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="pageStack materialWizard">
        <WizardTopbar orderId={orderId} onBack={() => navigate('/orders')} />
        <section className="screenCard">
          <p className="orderError">Не вдалося відкрити заказ.</p>
          <Button type="button" fullWidth onClick={refetchOrder}>Спробувати ще раз</Button>
        </section>
      </div>
    );
  }

  if (order.status !== 'DRAFT') {
    return (
      <div className="pageStack materialWizard">
        <WizardTopbar orderId={orderId} onBack={() => navigate(`/orders/${orderId}`)} />
        <section className="screenCard">
          <div className="compactHeader">
            <h1>Заказ уже відправлений</h1>
            <p>Матеріали можна змінювати тільки поки заказ має статус Draft.</p>
          </div>
          <Button type="button" fullWidth onClick={() => navigate(`/orders/${orderId}`, { replace: true })}>Повернутися до заказа</Button>
        </section>
      </div>
    );
  }

  return (
    <div className="pageStack materialWizard">
      <WizardTopbar orderId={orderId} onBack={goBackStep} />
      <StepIndicator current={step} total={variantRequired ? 5 : 4} />
      <p className="materialWizardOrder">Заказ #{order.number} · {order.title || ''}</p>

      {isLoading ? <section className="screenCard">Завантажуємо каталог…</section> : null}
      {catalogError ? <section className="screenCard"><p className="orderError">Не вдалося завантажити матеріали.</p><Button fullWidth onClick={refetchCatalog}>Спробувати ще раз</Button></section> : null}

      {!isLoading && !catalogError && step === 1 ? (
        <section className="materialWizardStage">
          <MaterialSearch catalog={catalog} query={search} onQueryChange={setSearch} onSelect={selectShortcut} />
          {!search.trim() ? (
            <>
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

              <div className="compactHeader"><h1>1. Виберіть категорію</h1><p>Оберіть систему матеріалу</p></div>
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
            </>
          ) : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="materialWizardStage">
          <div className="compactHeader"><h1>2. Виберіть діаметр</h1><p>{categories.find(item => item.key === categoryKey)?.label}</p></div>
          <div className="materialDiameterGrid">
            {diameters.map(value => (
              <button key={value} type="button" className={diameter === value ? 'is-selected' : ''} onClick={() => selectDiameter(value)}>
                {value === '—' ? 'Без розміру' : value}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="materialWizardStage">
          <div className="compactHeader"><h1>3. Виберіть елемент</h1><p>{categories.find(item => item.key === categoryKey)?.label} · {diameter === '—' ? 'без розміру' : diameter}</p></div>
          <div className="materialTypeList">
            {typeItems.map(item => {
              const candidates = getCandidatesForType(item.type);
              const hasVariants = candidates.length > 1;
              return (
                <button key={item.type} type="button" className="materialTypeRow" onClick={() => selectType(item.type)}>
                  <MaterialThumb item={item} />
                  <span>
                    <strong>{item.type}</strong>
                    <small>{hasVariants ? 'Вибрати варіант розміру' : `${diameter === '—' ? 'Без розміру' : diameter} · далі кількість`}</small>
                  </span>
                  <b>›</b>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 4 && variantRequired ? (
        <section className="materialWizardStage">
          <div className="compactHeader"><h1>4. Виберіть розмір</h1><p>{materialType} · базовий {diameter === '—' ? 'без розміру' : diameter}</p></div>
          <div className="materialDiameterGrid">
            {variantItems.map(item => (
              <button key={item.id} type="button" onClick={() => selectVariant(item.id)}>
                {item.diameter === '—'
                  ? item.name
                  : variantDiameters.size === variantItems.length
                    ? item.diameter
                    : item.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === quantityStep && selectedItem ? (
        <section className="materialWizardStage materialQuantityStage">
          <div className="compactHeader"><h1>{quantityStep}. Вкажіть кількість</h1><p>Перевірте матеріал і додайте в заказ</p></div>
          <div className="selectedMaterialCard">
            <MaterialThumb item={selectedItem} className="selectedMaterialMark" />
            <div><strong>{getCategoryDisplayLabel(selectedItem.categoryKey, selectedItem.categoryLabel)} {selectedItem.diameter}</strong><span>{selectedItem.type}</span></div>
            <button type="button" className={`materialFavoriteButton${selectedIsFavorite ? ' is-active' : ''}`} onClick={toggleFavorite} aria-label={selectedIsFavorite ? 'Прибрати з обраного' : 'Додати в обране'}><Icon name="star" size={19} /></button>
          </div>
          <div className="quantityStepper">
            <button type="button" onClick={() => setQuantity(value => Math.max(1, value - 1))}>−</button>
            <strong>{quantity}</strong>
            <button type="button" disabled={quantity >= MAX_QUANTITY} onClick={() => setQuantity(value => Math.min(MAX_QUANTITY, value + 1))}>+</button>
          </div>
          <span className="quantityUnit">{selectedItem.unit}</span>
          <div className="quantityQuickButtons">
            {[1, 5, 10].map(amount => (
              <button
                key={amount}
                type="button"
                disabled={quantity >= MAX_QUANTITY}
                onClick={() => setQuantity(value => Math.min(MAX_QUANTITY, value + amount))}
              >
                +{amount}
              </button>
            ))}
          </div>
          {error ? <p className="orderError">{error?.data?.error || 'Не вдалося додати матеріал'}</p> : null}
          <Button fullWidth disabled={adding} onClick={handleAdd}>{adding ? 'Додаємо…' : 'Додати'}</Button>
        </section>
      ) : null}
    </div>
  );
}
