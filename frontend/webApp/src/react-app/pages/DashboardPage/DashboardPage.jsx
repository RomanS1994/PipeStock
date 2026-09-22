import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useGetDashboardQuery } from '../../features/manager/managerApi.js';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './DashboardPage.css';
import './DashboardCompact.css';
import './DashboardHeroPhotos.css';
import './DashboardWorkTrackReturn.css';

const STATUS_LABELS = { DRAFT: 'Чернетка', SUBMITTED: 'Надіслано', COMPLETED: 'Завершено' };
const RETURN_CONTEXT_KEY = 'pipestock:return-to-worktrack';

function assetPath(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

function OrderSummary({ order, featured = false }) {
  return (
    <Link to={`/orders/${order.id}`} className={featured ? 'dashboardContinueOrder' : 'dashboardActivityRow'}>
      <span className="dashboardOrderVisual" aria-hidden="true"><Icon name="clipboard" size={featured ? 26 : 21} /></span>
      <span className="dashboardOrderCopy">
        <span className="dashboardOrderNumber">#{order.number}</span>
        <strong>{order.title || `Заказ #${order.number}`}</strong>
        <small>{order.project?.name || 'Без об’єкта'} · {Number(order.itemCount) || 0} поз.</small>
      </span>
      <StatusChip status={order.status}>{STATUS_LABELS[order.status] || order.status}</StatusChip>
      {!featured ? <span className="dashboardActivityArrow" aria-hidden="true">›</span> : null}
    </Link>
  );
}

export function DashboardPage() {
  const user = useSelector(selectUser);
  const { data, isLoading, isError, refetch } = useGetDashboardQuery();
  const { data: orders = [], isLoading: ordersLoading, isError: ordersError } = useGetOrdersQuery();
  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const drafts = orders
    .filter(order => order.status === 'DRAFT')
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const latestDraft = drafts[0];
  const activity = recentOrders.filter(order => order.id !== latestDraft?.id).slice(0, 2);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';
  const showWorkTrackReturn = window.sessionStorage.getItem(RETURN_CONTEXT_KEY) === '1';

  return (
    <div className="pageStack dashboardPage dashboardPage--compact">
      <header className="dashboardWelcome">
        <div>
          <div className="dashboardBrandRow">
            <span className="dashboardBrand">Pipe<span>Stock</span></span>
            {showWorkTrackReturn ? (
              <a className="dashboardWorkTrackReturn" href="/partners" onClick={() => window.sessionStorage.removeItem(RETURN_CONTEXT_KEY)} aria-label="Повернутися до WorkTrack">
                <span aria-hidden="true">←</span> WorkTrack
              </a>
            ) : null}
          </div>
          <h1>Головна</h1>
          {firstName ? <p>{firstName}</p> : null}
        </div>
        <Link to="/profile" className="dashboardAvatar" aria-label="Відкрити профіль">{initials}</Link>
      </header>

      {isLoading ? <section className="screenCard">Завантажуємо дані…</section> : null}
      {isError ? <section className="screenCard dashboardState"><strong>Не вдалося завантажити дані</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError ? (
        <>
          <Link className="dashboardHero" to="/objects" aria-label="Новий заказ — вибрати об’єкт">
            <span className="dashboardHeroContent"><span className="dashboardHeroPlus" aria-hidden="true">＋</span><strong>Новий заказ</strong><span className="dashboardHeroChevron" aria-hidden="true">›</span></span>
            <span className="dashboardHeroPhotos" aria-hidden="true">
              <img className="dashboardHeroPipe" src={assetPath('/materials/category-ht.webp')} alt="" />
              <img className="dashboardHeroValve" src={assetPath('/materials/category-brass.webp')} alt="" />
            </span>
          </Link>

          <section className="dashboardStats" aria-label="Статистика компанії">
            <Link to="/objects" className="dashboardStat"><Icon name="building" size={23} /><span>Об’єкти</span><strong>{stats.activeProjects ?? 0}</strong></Link>
            <Link to="/orders" className="dashboardStat"><Icon name="clipboard" size={23} /><span>Чернетки</span><strong>{ordersLoading || ordersError ? '—' : drafts.length}</strong></Link>
            <Link to="/orders" className="dashboardStat"><Icon name="check" size={23} /><span>Надіслано</span><strong>{stats.submittedOrders ?? 0}</strong></Link>
          </section>

          {!ordersLoading && !ordersError && latestDraft ? (
            <section className="dashboardPanel dashboardContinue">
              <div className="dashboardSectionHeader"><h2>Продовжити</h2></div>
              <OrderSummary order={latestDraft} featured />
              <Link className="dashboardContinueAction" to={`/orders/${latestDraft.id}`}>Продовжити <span aria-hidden="true">→</span></Link>
            </section>
          ) : null}

          <section className="dashboardPanel dashboardOrders">
            <div className="dashboardSectionHeader"><h2>Останні закази</h2><Link to="/orders" aria-label="Усі закази"><span aria-hidden="true">›</span></Link></div>
            {activity.length ? (
              <div className="dashboardActivityList">{activity.map(order => <OrderSummary key={order.id} order={order} />)}</div>
            ) : <p className="dashboardEmpty">{latestDraft ? 'Інших заказів поки немає.' : 'Поки немає заказів.'}</p>}
          </section>
        </>
      ) : null}

      <WorkspaceNavigation />
    </div>
  );
}
