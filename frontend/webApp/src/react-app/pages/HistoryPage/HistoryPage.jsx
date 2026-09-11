import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchField, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './HistoryPage.css';

const STATUS_LABELS = { SUBMITTED: 'Submitted', COMPLETED: 'Completed' };

export function HistoryPage() {
  const { data: orders = [], isLoading, isError, refetch } = useGetOrdersQuery();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  const history = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter(order => {
      if (order.status === 'DRAFT') return false;
      if (status !== 'ALL' && order.status !== status) return false;
      if (!query) return true;
      return [order.number, order.title, order.project?.name, order.worker?.name]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query));
    });
  }, [orders, search, status]);

  return (
    <div className="pageStack historyPage">
      <header className="compactHeader">
        <span className="sectionEyebrow">Історія</span>
        <h1>Історія заказів</h1>
        <p>Відправлені та завершені закази з усіх доступних об’єктів.</p>
      </header>

      <SearchField value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук в історії…" />

      <div className="historyFilters">
        {[['ALL','Усі'],['SUBMITTED','Submitted'],['COMPLETED','Completed']].map(([value,label]) => (
          <button key={value} type="button" className={status===value?'is-active':''} onClick={() => setStatus(value)}>{label}</button>
        ))}
      </div>

      {isLoading ? <section className="screenCard">Завантажуємо історію…</section> : null}
      {isError ? <section className="screenCard historyState"><strong>Не вдалося завантажити історію</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError && history.length ? (
        <section className="historyList">
          {history.map(order => (
            <article key={order.id} className="historyCard">
              <Link to={`/orders/${order.id}`} className="historyCardLink">
                <div className="historyCardTop"><div><span>#{order.number}</span><strong>{order.title}</strong></div><StatusChip status={order.status}>{STATUS_LABELS[order.status] || order.status}</StatusChip></div>
                <div className="historyCardMeta"><span>{order.project?.name || 'Без об’єкта'}</span><span>{order.itemCount} поз.</span><span>{order.worker?.name || '—'}</span></div>
                <small>{new Date(order.updatedAt || order.createdAt).toLocaleDateString('uk-UA')}</small>
              </Link>
              <OrderDocumentActions order={order} compact />
            </article>
          ))}
        </section>
      ) : null}

      {!isLoading && !isError && !history.length ? <section className="screenCard historyState"><strong>Історія порожня</strong><p>Після відправлення заказа він з’явиться тут.</p></section> : null}

      <WorkspaceNavigation />
    </div>
  );
}
