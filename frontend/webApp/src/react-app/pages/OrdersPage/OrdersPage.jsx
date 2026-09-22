import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon, SearchField, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useDeleteOrderMutation, useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './OrdersPage.css';

const STATUS_LABELS = {
  DRAFT: 'Чернетка',
  SUBMITTED: 'Надіслано',
  COMPLETED: 'Завершено',
};

const FILTERS = [
  ['ALL', 'Усі'],
  ['DRAFT', 'Чернетки'],
  ['SUBMITTED', 'Надіслано'],
  ['COMPLETED', 'Завершено'],
];

export function OrdersPage() {
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';
  const { data: orders = [], isLoading, isError, refetch } = useGetOrdersQuery();
  const [deleteOrder] = useDeleteOrderMutation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [deletingOrderId, setDeletingOrderId] = useState('');
  const [deleteError, setDeleteError] = useState(null);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter(order => {
      if (status !== 'ALL' && order.status !== status) return false;
      if (!query) return true;
      return [order.number, order.title, order.project?.name, order.worker?.name]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query));
    });
  }, [orders, search, status]);

  function canDelete(order) {
    if (manager) return true;
    return order.status === 'DRAFT' && order.worker?.id === user?.id;
  }

  function getMetaLine(order) {
    const parts = [order.project?.name || 'Без об’єкта', `${Number(order.itemCount) || 0} поз.`];
    if (manager && order.worker?.name && order.worker.id !== user?.id) parts.push(order.worker.name);
    return parts.join(' · ');
  }

  async function handleDelete(order) {
    const confirmed = window.confirm(
      `Видалити заказ #${order.number} «${order.title}»?\n\nМатеріали, історія та PDF цього заказа також будуть видалені. Цю дію не можна скасувати.`,
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingOrderId(order.id);
    try {
      await deleteOrder({ orderId: order.id, projectId: order.project?.id }).unwrap();
    } catch (error) {
      setDeleteError({
        orderId: order.id,
        message: error?.data?.error || 'Не вдалося видалити заказ.',
      });
    } finally {
      setDeletingOrderId('');
    }
  }

  return (
    <div className="pageStack ordersPage">
      <header className="ordersPage-header">
        <div className="compactHeader">
          <h1>Закази</h1>
        </div>
        <Link className="ordersPage-newOrder" to="/objects">
          <Icon name="plus" size={18} />
          <span>Новий</span>
        </Link>
      </header>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук заказу або об’єкта…" />

      <div className="ordersFilters" role="tablist" aria-label="Фільтр заказів">
        {FILTERS.map(([value, label]) => (
          <button key={value} type="button" className={status === value ? 'is-active' : ''} onClick={() => setStatus(value)}>{label}</button>
        ))}
      </div>

      {isLoading ? <section className="screenCard">Завантажуємо закази…</section> : null}
      {isError ? (
        <section className="screenCard ordersState"><strong>Не вдалося завантажити закази</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section>
      ) : null}

      {!isLoading && !isError && visibleOrders.length ? (
        <div className="ordersList">
          {visibleOrders.map(order => {
            const deletable = canDelete(order);
            const primaryLabel = order.status === 'DRAFT' ? 'Продовжити' : 'Відкрити';
            return (
              <article key={order.id} className="orderListCard">
                <div className="orderListCard-top">
                  <span className="orderListCard-number">#{order.number}</span>
                  <StatusChip status={order.status}>{STATUS_LABELS[order.status] || order.status}</StatusChip>
                </div>

                <Link to={`/orders/${order.id}`} className="orderListCard-main">
                  <strong>{order.title || `Заказ #${order.number}`}</strong>
                  <span>{getMetaLine(order)}</span>
                </Link>

                <div className="orderListCard-actions">
                  <Link className="orderListCard-primary" to={`/orders/${order.id}`}>{primaryLabel}</Link>
                  <OrderDocumentActions order={order} compact hidePreview iconOnly className="orderListCard-documentActions" />
                  {deletable ? (
                    <button
                      type="button"
                      className="orderListCard-delete"
                      disabled={deletingOrderId === order.id}
                      aria-label={`Видалити заказ #${order.number}`}
                      onClick={() => handleDelete(order)}
                    >
                      {deletingOrderId === order.id ? <span className="orderListCard-deleteSpinner" aria-hidden="true" /> : <Icon name="trash" size={18} />}
                    </button>
                  ) : null}
                  {deleteError?.orderId === order.id ? (
                    <small className="orderListCard-deleteError" role="alert">{deleteError.message}</small>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !isError && !visibleOrders.length ? (
        <section className="screenCard ordersState"><strong>Нічого не знайдено</strong><p>Змініть пошук або фільтр.</p></section>
      ) : null}

      <WorkspaceNavigation />
    </div>
  );
}
