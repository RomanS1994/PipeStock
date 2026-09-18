import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDeleteOrderItemMutation, useUpdateOrderItemMutation } from '../../features/orders/ordersApi.js';
import './DraftCart.css';

const MAX_QUANTITY = 99999;

function parseQuantity(value) {
  const number = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(number) && number > 0 && number <= MAX_QUANTITY && Math.round(number * 100) === number * 100
    ? number
    : null;
}

export function DraftCart({ order, orderId, canEdit }) {
  const [open, setOpen] = useState(false);
  const [draftValues, setDraftValues] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [updateItem] = useUpdateOrderItemMutation();
  const [deleteItem] = useDeleteOrderItemMutation();
  const items = order?.items || [];

  async function saveQuantity(item, value) {
    const parsed = parseQuantity(value);
    if (parsed === null) {
      setMessage('Вкажіть кількість від 0,01 до 99999 (до двох знаків після коми).');
      setDraftValues(previous => ({ ...previous, [item.id]: String(item.quantity) }));
      return;
    }
    if (parsed === Number(item.quantity)) {
      setDraftValues(previous => ({ ...previous, [item.id]: String(item.quantity) }));
      return;
    }
    setBusyId(item.id);
    setMessage('');
    try {
      await updateItem({ orderId, itemId: item.id, quantity: parsed }).unwrap();
      setDraftValues(previous => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
    } catch (error) {
      setMessage(error?.data?.error || 'Не вдалося змінити кількість. Спробуйте ще раз.');
      setDraftValues(previous => ({ ...previous, [item.id]: String(item.quantity) }));
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(item) {
    setBusyId(item.id);
    setMessage('');
    try {
      await deleteItem({ orderId, itemId: item.id }).unwrap();
      setDraftValues(previous => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
    } catch (error) {
      setMessage(error?.data?.error || 'Не вдалося прибрати матеріал. Спробуйте ще раз.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="draftCart">
      <button type="button" className="draftCartTrigger" onClick={() => { setMessage(''); setOpen(true); }}>
        <span aria-hidden="true">🛒</span>
        <span>Корзина · Заказ #{order?.number}</span>
        <strong>{items.length} поз.</strong>
      </button>
      {open ? (
        <div className="draftCartOverlay">
          <button type="button" className="draftCartBackdrop" onClick={() => setOpen(false)} aria-label="Закрити корзину" />
          <section className="draftCartPanel" role="dialog" aria-modal="true" aria-labelledby="draft-cart-title">
            <header className="draftCartHeader">
              <div><h2 id="draft-cart-title">Корзина заказа #{order?.number}</h2><p>{order?.title} · {items.length} поз.</p></div>
              <button type="button" className="draftCartClose" onClick={() => setOpen(false)} aria-label="Закрити корзину">×</button>
            </header>
            <div className="draftCartItems">
              {!items.length ? <p className="draftCartEmpty">Корзина порожня. Знайдіть матеріал і натисніть «В корзину».</p> : null}
              {items.map(item => {
                const pending = busyId === item.id;
                const disabled = !canEdit || busyId !== null;
                const current = String(draftValues[item.id] ?? item.quantity);
                return (
                  <div className="draftCartItem" key={item.id}>
                    <div className="draftCartItemName"><strong>{item.type} · {item.diameter}</strong><span>{item.categoryLabel} · {item.materialName}</span></div>
                    <div className="draftCartItemActions">
                      <button type="button" disabled={disabled} aria-label={`Зменшити кількість: ${item.type}`} onClick={() => saveQuantity(item, Math.max(0.01, Math.round((Number(item.quantity) - 1) * 100) / 100))}>−</button>
                      <input aria-label={`Кількість: ${item.type} ${item.diameter}`} inputMode="decimal" type="text" disabled={disabled} value={current} onChange={event => setDraftValues(previous => ({ ...previous, [item.id]: event.target.value }))} onBlur={event => { if (!disabled) saveQuantity(item, event.target.value); }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />
                      <span>{item.unit}</span>
                      <button type="button" disabled={disabled || Number(item.quantity) >= MAX_QUANTITY} aria-label={`Збільшити кількість: ${item.type}`} onClick={() => saveQuantity(item, Math.min(MAX_QUANTITY, Math.round((Number(item.quantity) + 1) * 100) / 100))}>+</button>
                      <button type="button" className="draftCartRemove" disabled={disabled} onClick={() => removeItem(item)} aria-label={`Видалити ${item.type} ${item.diameter}`}>{pending ? '…' : '×'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {message ? <p className="draftCartError" role="alert">{message}</p> : null}
            <footer className="draftCartFooter">
              <button type="button" onClick={() => setOpen(false)}>Продовжити вибір</button>
              <Link to={`/orders/${encodeURIComponent(orderId)}`}>Переглянути Draft-заказ</Link>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
