import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { WorkspaceNavigation } from '../../components/WorkspaceNavigation/WorkspaceNavigation.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useGetDashboardQuery } from '../../features/manager/managerApi.js';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './DashboardPage.css';

const STATUS_LABELS = { DRAFT: 'Чернетка', SUBMITTED: 'Відправлено', COMPLETED: 'Завершено' };

function itemLabel(count) {
  const number = Number(count) || 0;
  const lastTwo = number % 100;
  const last = number % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${number} позицій`;
  if (last === 1) return `${number} позиція`;
  if (last >= 2 && last <= 4) return `${number} позиції`;
  return `${number} позицій`;
}

function OrderSummary({ order, featured = false }) {
  return (
    <Link to={`/orders/${order.id}`} className={featured ? 'dashboardContinueOrder' : 'dashboardActivityRow'}>
      <span className="dashboardOrderVisual" aria-hidden="true">
        <Icon name="clipboard" size={featured ? 26 : 21} />
      </span>
      <span className="dashboardOrderCopy">
        <span className="dashboardOrderNumber">#{order.number}</span>
        <strong>{order.title || `Заказ #${order.number}`}</strong>
        <small>{order.project?.name || 'Без об’єкта'} · {itemLabel(order.itemCount)}</small>
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
  const activity = recentOrders.filter(order => order.id !== latestDraft?.id).slice(0, 3);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

  return (
    <div className="pageStack dashboardPage">
      <header className="dashboardWelcome">
        <div>
          {firstName ? <span className="dashboardGreeting">Вітаємо, {firstName}!</span> : null}
          <h1>Головна</h1>
          <p>Об’єкти, закази та поточна робота</p>
        </div>
        <Link to="/profile" className="dashboardAvatar" aria-label="Відкрити профіль">{initials}</Link>
      </header>

      {isLoading ? <section className="screenCard">Завантажуємо дані…</section> : null}
      {isError ? <section className="screenCard dashboardState"><strong>Не вдалося завантажити дані</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section> : null}

      {!isLoading && !isError ? (
        <>
          <section className="dashboardHero" aria-labelledby="dashboardCreateTitle">
            <div className="dashboardHeroContent">
              <h2 id="dashboardCreateTitle">Новий заказ</h2>
              <p>Виберіть об’єкт і додайте матеріали</p>
              <Link className="dashboardHeroAction" to="/objects"><span aria-hidden="true">＋</span> Створити заказ</Link>
            </div>
            <div className="dashboardHeroPhotos" aria-hidden="true">
              <img className="dashboardHeroPipe" src="/materials/category-ht.webp" alt="" />
              <img className="dashboardHeroFitting" src="/materials/category-ppr.webp" alt="" />
              <img className="dashboardHeroValve" src="/materials/category-brass.webp" alt="" />
            </div>
          </section>

          <section className="dashboardStats" aria-label="Статистика компанії">
            <Link to="/objects" className="dashboardStat"><Icon name="building" size={23} /><span>Активні об’єкти</span><strong>{stats.activeProjects ?? 0}</strong><span className="dashboardStatArrow" aria-hidden="true">›</span></Link>
            <Link to="/orders" className="dashboardStat"><Icon name="clipboard" size={23} /><span>Чернетки</span><strong>{ordersLoading || ordersError ? '—' : drafts.length}</strong><span className="dashboardStatArrow" aria-hidden="true">›</span></Link>
            <Link to="/orders" className="dashboardStat"><Icon name="check" size={23} /><span>Відправлено</span><strong>{stats.submittedOrders ?? 0}</strong><span className="dashboardStatArrow" aria-hidden="true">›</span></Link>
          </section>

          {!ordersLoading && !ordersError && latestDraft ? (
            <section className="dashboardPanel dashboardContinue">
              <div className="dashboardSectionHeader"><h2>Продовжити роботу</h2><Link to="/orders">Усі <span aria-hidden="true">›</span></Link></div>
              <OrderSummary order={latestDraft} featured />
              <Link className="dashboardContinueAction" to={`/orders/${latestDraft.id}`}>Продовжити заказ <span aria-hidden="true">→</span></Link>
            </section>
          ) : null}

          <section className="dashboardPanel dashboardOrders">
            <div className="dashboardSectionHeader"><h2>Остання активність</h2><Link to="/orders">Усі <span aria-hidden="true">›</span></Link></div>
            {activity.length ? (
              <div className="dashboardActivityList">{activity.map(order => <OrderSummary key={order.id} order={order} />)}</div>
            ) : <p className="dashboardEmpty">{latestDraft ? 'Інших заказів поки немає.' : 'Поки немає заказів. Створіть перший заказ для об’єкта.'}</p>}
          </section>
          <Link className="dashboardTeamLink" to="/employees"><Icon name="users" size={19} /> Працівники компанії <strong>{stats.activeEmployees ?? 0}</strong><span aria-hidden="true">›</span></Link>
        </>
      ) : null}

      <WorkspaceNavigation />
    </div>
  );
}
