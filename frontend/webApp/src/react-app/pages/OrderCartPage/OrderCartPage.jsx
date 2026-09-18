import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { BackLink, Button, Icon } from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useDeleteOrderItemMutation,
  useGetOrderQuery,
  useUpdateOrderItemMutation,
} from '../../features/orders/ordersApi.js';
import { getMaterialImage } from '../AddMaterialPage/materialImageResolver.js';
import '../OrderFlow/OrderFlow.css';
import './OrderCartPage.css';

const MAX_QUANTITY = 99999;

export function OrderCartPage() {
  const { orderId } = useParams();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const { data: order, isLoading, isError, refetch } = useGetOrderQuery(orderId);
  const [updateItem, updateState] = useUpdateOrderItemMutation();
  const [deleteItem, deleteState] = useDeleteOrderItemMutation();
  const [pendingId, setPendingId] = useState(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [actionError, setActionError] = useState('');
  const canEdit = order?.status === 'DRAFT' && (membership?.role === 'MANAGER' || order?.createdByMembershipId === membership?.id);
  const items = order?.items || [];
  const addPath = `/orders/${orderId}/materials/new`;

  async function changeQuantity(item, delta) {
    if (!canEdit || pendingId || !Number.isSafeInteger(item.quantity)) return;
    const quantity = item.quantity + delta;
    if (quantity < 1 || quantity > MAX_QUANTITY) return;
    setActionError('');
    setPendingId(item.id);
    try {
      await updateItem({ orderId, itemId: item.id, quantity }).unwrap();
    } catch (error) {
      setActionError(error?.data?.error || 'Не вдалося змінити кількість. Спробуйте ще раз.');
    } finally {
      setPendingId(null);
    }
  }

  async function removeItem(itemId) {
    if (!canEdit || pendingId || confirmRemoveId !== itemId) return;
    setActionError('');
    setPendingId(itemId);
    try {
      await deleteItem({ orderId, itemId }).unwrap();
      setConfirmRemoveId(null);
    } catch (error) {
      setActionError(error?.data?.error || 'Не вдалося видалити матеріал. Спробуйте ще раз.');
    } finally {
      setPendingId(null);
    }
  }

  if (isLoading) return <section className="screenCard">Завантажуємо кошик…</section>;
  if (isError || !order) return (
    <section className="screenCard orderCartState">
      <strong>Не вдалося відкрити кошик</strong>
      <Button onClick={refetch}>Спробувати ще раз</Button>
      <Link to={`/orders/${orderId}`}>Повернутися до заказа</Link>
    </section>
  );

  return (
    <div className="pageStack orderCartPage">
      <header className="orderCartTopbar">
        <BackLink to={canEdit ? addPath : `/orders/${orderId}`} />
        <strong>Кошик</strong>
        <span aria-hidden="true" />
      </header>
      <p className="orderCartContext">Заказ #{order.number} · {order.title}</p>

      <section className="orderCartContents" aria-label="Матеріали заказа">
        <div className="orderCartHeading">
          <h1>Матеріали</h1>
          <span>{items.length} поз.</span>
        </div>
        {items.length ? (
          <div className="orderCartList">
            {items.map(item => {
              const image = getMaterialImage(item);
              const busy = pendingId !== null || updateState.isLoading || deleteState.isLoading;
              return (
                <article className="orderCartItem" key={item.id}>
                  <div className="orderCartItemImage">
                    {image ? <img src={image} alt="" loading="lazy" /> : <Icon name="clipboard" size={26} />}
                  </div>
                  <div className="orderCartItemInfo">
                    <strong>{item.type || item.name}</strong>
                    <span>{item.categoryLabel} · {item.diameter}</span>
                    <span className="orderCartItemUnit">{item.quantity} {item.unit}</span>
                    {canEdit ? (
                      <div className="orderCartItemControls">
                        <div className="orderCartStepper" aria-label={`Кількість: ${item.quantity} ${item.unit}`}>
                          <button type="button" aria-label={`Зменшити кількість: ${item.type}`} disabled={busy || item.quantity <= 1} onClick={() => changeQuantity(item, -1)}>−</button>
                          <output>{item.quantity}</output>
                          <button type="button" aria-label={`Збільшити кількість: ${item.type}`} disabled={busy || item.quantity >= MAX_QUANTITY} onClick={() => changeQuantity(item, 1)}>+</button>
                        </div>
                        {confirmRemoveId === item.id ? (
                          <span className="orderCartRemoveConfirm">
                            <button type="button" disabled={busy} onClick={() => removeItem(item.id)}>Видалити?</button>
                            <button type="button" disabled={busy} onClick={() => setConfirmRemoveId(null)}>Скасувати</button>
                          </span>
                        ) : (
                          <button type="button" className="orderCartRemove" disabled={busy} aria-label={`Видалити ${item.type}`} onClick={() => setConfirmRemoveId(item.id)}>×</button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="orderCartEmpty">
            <Icon name="clipboard" size={36} />
            <strong>Кошик поки порожній</strong>
            <p>Додайте перший матеріал до заказа.</p>
          </div>
        )}
      </section>

      {actionError ? <p className="orderError" role="alert">{actionError}</p> : null}
      <footer className="orderCartFooter">
        <div className="orderCartSummary"><span>Усього позицій</span><strong>{items.length}</strong></div>
        {canEdit ? <Link className="psButton psButton--primary psButton--full orderCartPrimary" to={addPath}>+ Додати ще матеріал</Link> : null}
        <Link className="orderCartBackToOrder" to={`/orders/${orderId}`}>Перейти до заказа</Link>
      </footer>
    </div>
  );
}
