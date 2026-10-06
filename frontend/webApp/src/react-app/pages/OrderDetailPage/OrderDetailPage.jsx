import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BackLink, Button, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useCompleteOrderMutation,
  useDeleteOrderItemMutation,
  useGetOrderQuery,
  useSubmitOrderMutation,
  useUpdateOrderItemMutation,
} from '../../features/orders/ordersApi.js';
import { getMaterialVisual } from '../AddMaterialPage/materialImageResolver.js';
import '../OrderFlow/OrderFlow.css';

const STATUS_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Submitted', COMPLETED: 'Completed' };
const CATEGORY_LABELS = { CU: 'Měď', STEEL: 'Uhlíková ocel', OTHER: 'Montážní materiál' };
const EVENT_LABELS = {
  CREATED: 'Заказ створено',
  SUBMITTED: 'Відправлено менеджеру',
  COMPLETED: 'Заказ завершено',
};

function formatEventDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getCategoryLabel(item) {
  return CATEGORY_LABELS[String(item?.categoryKey || '').toUpperCase()] || item?.categoryLabel || '';
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';
  const { data: order, isLoading, isError, refetch } = useGetOrderQuery(orderId);
  const [submitOrder, submitState] = useSubmitOrderMutation();
  const [completeOrder, completeState] = useCompleteOrderMutation();
  const [deleteItem, deleteState] = useDeleteOrderItemMutation();
  const [updateItem, updateState] = useUpdateOrderItemMutation();
  const [quantityBusyId, setQuantityBusyId] = useState(null);
  const [quantityError, setQuantityError] = useState('');

  if (isLoading) return <section className="screenCard">Завантажуємо заказ…</section>;
  if (isError || !order) return <section className="screenCard"><strong>Не вдалося відкрити заказ</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section>;

  const canEdit = order.status === 'DRAFT' && (manager || order.createdByMembershipId === membership?.id);
  const history = order.history || [];

  async function changeQuantity(item, delta) {
    if (!canEdit || quantityBusyId) return;
    const current = Number(item.quantity);
    const next = Math.max(0.01, Math.min(99999, Math.round((current + delta) * 100) / 100));
    if (next === current) return;

    setQuantityBusyId(item.id);
    setQuantityError('');
    try {
      await updateItem({ orderId: order.id, itemId: item.id, quantity: next }).unwrap();
    } catch (error) {
      setQuantityError(error?.data?.error || 'Не вдалося змінити кількість.');
    } finally {
      setQuantityBusyId(null);
    }
  }

  return (
    <div className="pageStack orderFlowPage">
      <header className="orderTopbar">
        <BackLink to={location.state?.returnTo || `/objects/${order.project.id}`} />
        <strong>Заказ #{order.number}</strong>
        <StatusChip status={order.status}>{STATUS_LABELS[order.status]}</StatusChip>
      </header>

      <section className="screenCard orderSummaryCard">
        <div className="orderSummaryHeading">
          <div><h1>{order.title}</h1><p>{order.project.name}</p></div>
        </div>
        <dl className="orderMetaGrid">
          <div><dt>Категорія</dt><dd>{order.category || '—'}</dd></div>
          <div><dt>Працівник</dt><dd>{order.worker?.name || '—'}</dd></div>
          <div><dt>Матеріалів</dt><dd>{order.itemCount}</dd></div>
          <div><dt>Примітка</dt><dd>{order.note || '—'}</dd></div>
        </dl>
      </section>

      <section className="screenCard orderMaterialsCard">
        <div className="orderSectionHeader">
          <div><strong>Матеріали ({order.itemCount})</strong></div>
        </div>

        {order.items.length ? (
          <div className="orderItemList">
            {order.items.map(item => {
              const visual = getMaterialVisual(item);
              const category = getCategoryLabel(item);
              return (
                <div className="orderItemRow" key={item.id}>
                  <div className={`orderMaterialMark${visual ? ' has-image' : ''}`} style={visual?.kind === 'sprite' ? visual.style : undefined}>
                    {visual?.kind === 'image' ? <img src={visual.src} alt="" /> : visual ? null : category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="orderItemCopy">
                    <strong>{category} {item.diameter}</strong>
                    <span>{item.type}{item.thickness ? ` · ${item.thickness}` : ''}</span>
                    <small className="orderItemBadge">{String(item.categoryKey || '').toUpperCase() === 'STEEL' ? 'Ocel' : category}</small>
                  </div>
                  {canEdit ? (
                    <div className="orderItemQuantityControl" aria-label={`Кількість ${item.type} ${item.diameter}`}>
                      <button
                        type="button"
                        aria-label="Зменшити кількість"
                        disabled={quantityBusyId !== null || Number(item.quantity) <= 0.01}
                        onClick={() => changeQuantity(item, -1)}
                      >
                        −
                      </button>
                      <strong>{quantityBusyId === item.id ? '…' : item.quantity}</strong>
                      <button
                        type="button"
                        aria-label="Збільшити кількість"
                        disabled={quantityBusyId !== null || Number(item.quantity) >= 99999}
                        onClick={() => changeQuantity(item, 1)}
                      >
                        +
                      </button>
                      <span>{item.unit}</span>
                    </div>
                  ) : <strong className="orderItemQty">{item.quantity} {item.unit}</strong>}
                  {canEdit ? (
                    <button
                      className="orderRemoveItem"
                      type="button"
                      aria-label="Видалити матеріал"
                      disabled={deleteState.isLoading || quantityBusyId !== null}
                      onClick={() => deleteItem({ orderId: order.id, itemId: item.id })}
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : <div className="orderEmptyMaterials"><strong>Матеріалів ще немає</strong><p>Додайте перший матеріал до заказа.</p></div>}

        {deleteState.error ? <p className="orderError">{deleteState.error?.data?.error || 'Не вдалося видалити матеріал'}</p> : null}
        {quantityError || updateState.error ? <p className="orderError">{quantityError || updateState.error?.data?.error || 'Не вдалося змінити кількість'}</p> : null}
        {canEdit ? <Link className="psButton psButton--primary psButton--full orderButtonLink" to={`/orders/${order.id}/materials/new`}>+ Додати матеріал</Link> : null}
      </section>

      {order.status !== 'DRAFT' && history.length ? (
        <section className="screenCard orderHistoryCard">
          <div className="orderSectionHeader">
            <div><strong>Історія</strong><span>Основні етапи заказу</span></div>
          </div>
          <div className="orderTimeline">
            {history.map(event => (
              <div className="orderTimelineItem" key={event.id}>
                <span className={`orderTimelineDot is-${event.type.toLowerCase()}`} />
                <div>
                  <strong>{EVENT_LABELS[event.type] || event.type}</strong>
                  <span>{event.actor?.name || 'Система'}</span>
                </div>
                <time dateTime={event.createdAt}>{formatEventDate(event.createdAt)}</time>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {order.documentAvailable ? (
        <section className="screenCard orderDocumentCard">
          <div className="orderDocumentCardHeading">
            <span className="orderDocumentCardMark">PDF</span>
            <div><strong>Матеріали заказа #{order.number}</strong><span>PDF документ</span></div>
          </div>
          <OrderDocumentActions order={order} />
        </section>
      ) : null}

      {submitState.error ? <p className="orderError">{submitState.error?.data?.error}</p> : null}
      {completeState.error ? <p className="orderError">{completeState.error?.data?.error}</p> : null}

      {canEdit ? (
        <nav className="orderDraftStickyActions" aria-label="Дії з Draft-заказом">
          <Link
            className={`orderDraftStickyAction orderDraftStickyAction--pdf${order.items.length ? '' : ' is-disabled'}`}
            to={order.items.length ? `/orders/${order.id}/pdf` : '#'}
            aria-disabled={!order.items.length}
            onClick={event => { if (!order.items.length) event.preventDefault(); }}
          >
            Переглянути PDF
          </Link>
          <button
            type="button"
            className="orderDraftStickyAction orderDraftStickyAction--submit"
            disabled={submitState.isLoading || deleteState.isLoading || updateState.isLoading || !order.items.length}
            onClick={() => submitOrder(order.id)}
          >
            {submitState.isLoading ? 'Відправляємо…' : manager ? 'Відправити' : 'Відправити менеджеру'}
          </button>
        </nav>
      ) : null}
      {manager && order.status === 'SUBMITTED' ? (
        <Button fullWidth disabled={completeState.isLoading} onClick={() => completeOrder(order.id)}>
          {completeState.isLoading ? 'Завершуємо…' : 'Позначити завершеним'}
        </Button>
      ) : null}
    </div>
  );
}
