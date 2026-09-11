import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchField, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './OrdersPage.css';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Відправлено',
  COMPLETED: 'Завершено',
};

const FILTERS = [
  ['ALL', 'Усі'],
  ['DRAFT', 'Draft'],
  ['SUBMITTED', 'Відправлені'],
  ['COMPLETED', 'Завершені'],
];

export function OrdersPage() {
  const { data: orders = [], isLoading, isError, refetch } = useGetOrdersQuery();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

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
          {visibleOrders.map(order => (
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
              <OrderDocumentActions order={order} compact />
            </article>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && !visibleOrders.length ? (
        <section className="screenCard ordersState"><strong>Нічого не знайдено</strong><p>Змініть пошук або фільтр.</p></section>
      ) : null}

      <WorkspaceNavigation />
    </div>
  );
}
