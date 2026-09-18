import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectUser } from '../../features/auth/authSlice.js';
import { useAddOrderItemMutation, useGetOrderQuery, useUpdateOrderItemMutation } from '../../features/orders/ordersApi.js';
import { getMaterialImage } from './materialImageResolver.js';
import { searchMaterials } from './materialSearchMatcher.js';
import { DraftCart } from './DraftCart.jsx';
import './MaterialSearch.css';

const RESULT_LIMIT = 40;
const MAX_QUANTITY = 99999;
const CATEGORY_NAMES = { CU: 'Měď', STEEL: 'Uhlíková ocel' };

export function MaterialSearch({ catalog, query, onQueryChange, onSelect }) {
  const { orderId } = useParams();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && !item.deletedAt);
  const { data: order, refetch: refetchOrder } = useGetOrderQuery(orderId);
  const [addItem] = useAddOrderItemMutation();
  const [updateItem] = useUpdateOrderItemMutation();
  const [quickBusyId, setQuickBusyId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const busyRef = useRef(false);
  const canEdit = order?.status === 'DRAFT' && (membership?.role === 'MANAGER' || order.createdByMembershipId === membership?.id);
  const matches = useMemo(() => searchMaterials(catalog, query), [catalog, query]);

  async function addToCart(item) {
    if (!canEdit || busyRef.current) return;
    busyRef.current = true;
    setQuickBusyId(item.id);
    setFeedback('');
    setFailed(false);
    try {
      const existing = order.items.find(row => row.catalogItemId === item.id);
      if (existing) {
        const next = Number(existing.quantity) + 1;
        if (next > MAX_QUANTITY) throw new Error('Досягнуто максимальної кількості 99999.');
        await updateItem({ orderId, itemId: existing.id, quantity: next }).unwrap();
      } else {
        await addItem({ orderId, catalogItemId: item.id, quantity: 1 }).unwrap();
      }
      setFeedback(`Додано в корзину: ${item.type} · ${item.diameter}`);
      await refetchOrder();
    } catch (error) {
      setFailed(true);
      setFeedback(error?.data?.error || error?.message || 'Не вдалося додати матеріал. Спробуйте ще раз.');
    } finally {
      busyRef.current = false;
      setQuickBusyId(null);
    }
  }

  return (
    <div className="materialSearch">
      <label htmlFor="material-search-input">Швидкий пошук матеріалу</label>
      <div className="materialSearchInputWrap">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
        <input id="material-search-input" type="search" value={query} onChange={event => { onQueryChange(event.target.value); setFeedback(''); }} placeholder="Наприклад, tkus 25x25" autoComplete="off" spellCheck="false" />
      </div>
      {order?.status === 'DRAFT' ? <DraftCart order={order} orderId={orderId} canEdit={canEdit} /> : null}
      {feedback ? <p className={failed ? 'materialSearchFeedback is-error' : 'materialSearchFeedback'} role={failed ? 'alert' : 'status'}>{feedback}</p> : null}
      {query.trim() ? (
        <div className="materialSearchResults" aria-live="polite">
          <p>{matches.length ? `Знайдено: ${matches.length}` : 'Матеріалів не знайдено. Спробуйте іншу назву або розмір.'}</p>
          {matches.slice(0, RESULT_LIMIT).map(item => {
            const image = getMaterialImage(item);
            const category = CATEGORY_NAMES[String(item.categoryKey).toUpperCase()] || item.categoryLabel;
            return (
              <div className="materialSearchResult" key={item.id}>
                <button type="button" className="materialSearchResultSelect" disabled={quickBusyId !== null} onClick={() => onSelect(item)} aria-label={`Вибрати ${item.type} ${item.diameter} та вказати кількість`}>
                  <span className="materialSearchResultImage">{image ? <img src={image} alt="" loading="lazy" /> : null}</span>
                  <span className="materialSearchResultText"><strong>{item.type} · {item.diameter}</strong><small>{category} · {item.name}</small></span>
                </button>
                <button type="button" className="materialSearchQuickAdd" disabled={!canEdit || quickBusyId !== null} onClick={() => addToCart(item)} aria-label={`Додати в корзину ${item.type} ${item.diameter}`}>
                  {quickBusyId === item.id ? 'Додаємо…' : '+ В корзину'}
                </button>
              </div>
            );
          })}
          {matches.length > RESULT_LIMIT ? <small className="materialSearchMore">Показано перші {RESULT_LIMIT} варіантів. Уточніть пошук за розміром або типом.</small> : null}
        </div>
      ) : null}
    </div>
  );
}
