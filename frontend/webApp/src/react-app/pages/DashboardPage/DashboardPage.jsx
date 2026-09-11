import { Link } from 'react-router-dom';
import { Icon, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { useGetDashboardQuery } from '../../features/manager/managerApi.js';
import './DashboardPage.css';

const STATUS_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Відправлено', COMPLETED: 'Завершено' };

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useGetDashboardQuery();
  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="pageStack dashboardPage">
      <header className="compactHeader">
        <span className="sectionEyebrow">Manager workspace</span>
        <h1>Головна</h1>
        <p>Короткий стан компанії та остання активність.</p>
      </header>

      {isLoading ? <section className="screenCard">Завантажуємо dashboard…</section> : null}
      {isError ? <section className="screenCard dashboardState"><strong>Не вдалося завантажити дані</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError ? (
        <>
          <section className="dashboardStats">
            <Link to="/objects" className="dashboardStat"><Icon name="building" size={20} /><span>Активні об’єкти</span><strong>{stats.activeProjects || 0}</strong></Link>
            <Link to="/orders" className="dashboardStat"><Icon name="clipboard" size={20} /><span>Нові закази</span><strong>{stats.submittedOrders || 0}</strong></Link>
            <Link to="/employees" className="dashboardStat"><Icon name="users" size={20} /><span>Працівники</span><strong>{stats.activeEmployees || 0}</strong></Link>
          </section>

          <section className="screenCard dashboardOrders">
            <div className="dashboardSectionHeader"><div><strong>Остання активність</strong><span>Останні змінені закази</span></div><Link to="/orders">Всі</Link></div>
            {recentOrders.length ? recentOrders.map(order => (
              <Link key={order.id} to={`/orders/${order.id}`} className="dashboardOrderRow">
                <span className="dashboardOrderNumber">#{order.number}</span>
                <span className="dashboardOrderCopy"><strong>{order.title}</strong><small>{order.project?.name} · {order.worker?.name || '—'} · {order.itemCount} поз.</small></span>
                <StatusChip status={order.status}>{STATUS_LABELS[order.status] || order.status}</StatusChip>
              </Link>
            )) : <p className="dashboardEmpty">Поки немає заказів.</p>}
          </section>
        </>
      ) : null}

      <WorkspaceNavigation />
    </div>
  );
}
