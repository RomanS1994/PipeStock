import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { SearchField, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useDeleteOrderMutation, useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './OrdersPage.css';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
};

const FILTERS = [
  ['ALL', 'Усі'],
  ['DRAFT', 'Draft'],
  ['SUBMITTED', 'Submitted'],
  ['COMPLETED', 'Completed'],
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
          <p>Всі доступні вам замовлення по об’єктах.</p>
        </div>
      </header>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук заказа, об’єкта або працівника…" />

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
            return (
              <article key={order.id} className="orderListCard">
                <Link to={`/orders/${order.id}`} className="orderListCard-link">
                  <div className="orderListCard-top">
                    <div><span>#{order.number}</span><strong>{order.title}</strong></div>
                    <StatusChip status={order.status}>{STATUS_LABELS[order.status] || order.status}</StatusChip>
                  </div>
                  <div className="orderListCard-meta">
                    <span>{order.project?.name || 'Без об’єкта'}</span>
                    <span>{order.itemCount} поз.</span>
                    <span>{order.worker?.name || '—'}</span>
                  </div>
                </Link>

                {order.documentAvailable || deletable ? (
                  <div className="orderListCard-actions">
                    <OrderDocumentActions order={order} compact />
                    {deletable ? (
                      <button
                        type="button"
                        className="orderListCard-delete"
                        disabled={deletingOrderId === order.id}
                        onClick={() => handleDelete(order)}
                      >
                        {deletingOrderId === order.id ? 'Видаляємо…' : 'Видалити'}
                      </button>
                    ) : null}
                    {deleteError?.orderId === order.id ? (
                      <small className="orderListCard-deleteError" role="alert">{deleteError.message}</small>
                    ) : null}
                  </div>
                ) : null}
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
