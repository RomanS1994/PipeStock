import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation, useParams } from 'react-router-dom';
import { BackLink, Button, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useCompleteOrderMutation,
  useCreateOrderSectionMutation,
  useGetOrderQuery,
  useSubmitOrderMutation,
} from '../../features/orders/ordersApi.js';
import { getMaterialVisual } from '../AddMaterialPage/materialImageResolver.js';
import '../OrderFlow/OrderFlow.css';

const STATUS_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Submitted', COMPLETED: 'Completed' };
const CATEGORY_LABELS = { CU: 'Měď', STEEL: 'Uhlíková ocel', OTHER: 'Montážní materiál' };

function getCategoryLabel(item) {
  return CATEGORY_LABELS[String(item?.categoryKey || '').toUpperCase()] || item?.categoryLabel || '';
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && !item.deletedAt);
  const manager = membership?.role === 'MANAGER';
  const { data: order, isLoading, isError, refetch } = useGetOrderQuery(orderId);
  const [submitOrder, submitState] = useSubmitOrderMutation();
  const [completeOrder, completeState] = useCompleteOrderMutation();
  const [createSection, createSectionState] = useCreateOrderSectionMutation();
  const [tab, setTab] = useState('sections');
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [search, setSearch] = useState('');

  const canEdit = order?.status === 'DRAFT' && (manager || order?.createdByMembershipId === membership?.id);
  const aggregatedItems = order?.aggregatedItems || [];
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('cs-CZ');
    if (!query) return aggregatedItems;
    return aggregatedItems.filter(item => [getCategoryLabel(item), item.diameter, item.thickness, item.type, item.materialName].filter(Boolean).join(' ').toLocaleLowerCase('cs-CZ').includes(query));
  }, [aggregatedItems, search]);

  const groupedItems = useMemo(() => {
    const groups = new Map();
    filteredItems.forEach(item => {
      const label = getCategoryLabel(item) || 'Інше';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(item);
    });
    return [...groups.entries()];
  }, [filteredItems]);

  async function handleCreateSection() {
    const name = sectionName.trim();
    if (!name) return;
    setSectionError('');
    try {
      await createSection({ orderId, name }).unwrap();
      setSectionName('');
      setShowCreateSection(false);
    } catch (error) {
      setSectionError(error?.data?.error || 'Не вдалося створити розділ.');
    }
  }

  if (isLoading) return <section className="screenCard">Завантажуємо заказ…</section>;
  if (isError || !order) return <section className="screenCard"><strong>Не вдалося відкрити заказ</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section>;

  return (
    <div className="pageStack orderFlowPage orderPlanningPage">
      <header className="orderTopbar">
        <BackLink to={location.state?.returnTo || `/objects/${order.project.id}`} />
        <strong>Заказ #{order.number}</strong>
        <StatusChip status={order.status}>{STATUS_LABELS[order.status]}</StatusChip>
      </header>

      <section className="screenCard orderPlanningSummary">
        <div className="orderPlanningTitle"><div><h1>{order.title}</h1><p>{order.project.name}</p></div></div>
        <dl className="orderPlanningMeta">
          <div><dt>Об’єкт</dt><dd>{order.project.name}</dd></div>
          <div><dt>Дата</dt><dd>{formatDate(order.createdAt)}</dd></div>
          <div><dt>Розділів</dt><dd>{order.sectionCount || 0}</dd></div>
          <div><dt>Матеріалів</dt><dd>{aggregatedItems.length}</dd></div>
        </dl>
      </section>

      <nav className="orderPlanningTabs" aria-label="Заказ">
        <button type="button" className={tab === 'sections' ? 'is-active' : ''} onClick={() => setTab('sections')}>Розділи</button>
        <button type="button" className={tab === 'materials' ? 'is-active' : ''} onClick={() => setTab('materials')}>Всі матеріали</button>
      </nav>

      {tab === 'sections' ? (
        <section className="orderPlanningSections">
          <div className="orderPlanningSectionHeader">
            <h2>Розділи</h2>
            {canEdit ? <button type="button" onClick={() => setShowCreateSection(value => !value)}>+ Додати розділ</button> : null}
          </div>

          {showCreateSection ? (
            <div className="screenCard orderPlanningCreateSection">
              <input autoFocus value={sectionName} maxLength={120} placeholder="Наприклад: Byt 101" onChange={event => setSectionName(event.target.value)} />
              <Button type="button" disabled={!sectionName.trim() || createSectionState.isLoading} onClick={handleCreateSection}>{createSectionState.isLoading ? 'Створюємо…' : 'Створити'}</Button>
              {sectionError ? <p className="orderError">{sectionError}</p> : null}
            </div>
          ) : null}

          <div className="orderPlanningSectionList">
            {(order.sections || []).map(section => (
              <Link key={section.id} className="orderPlanningSectionCard" to={`/orders/${order.id}/sections/${section.id}`}>
                <span className="orderPlanningSectionIcon">⌂</span>
                <span><strong>{section.name}</strong><small>{section.itemCount} матеріалів</small></span>
                <b>›</b>
              </Link>
            ))}
          </div>
          {!order.sections?.length ? <div className="screenCard orderPlanningEmpty"><strong>Розділів ще немає</strong><p>Створіть перший розділ — наприклад квартиру, кімнату або спільну зону.</p></div> : null}
        </section>
      ) : (
        <section className="orderPlanningAllMaterials">
          <label className="orderPlanningSearch"><span>⌕</span><input value={search} placeholder="Пошук матеріалу" onChange={event => setSearch(event.target.value)} /></label>
          {groupedItems.map(([group, items]) => (
            <div className="orderPlanningMaterialGroup" key={group}>
              <h3>{group} ({items.length})</h3>
              <div className="screenCard orderPlanningMaterialList">
                {items.map(item => {
                  const visual = getMaterialVisual(item);
                  return (
                    <div className="orderPlanningMaterialRow" key={item.catalogItemId || item.materialKey}>
                      <div className="orderPlanningMaterialImage" style={visual?.kind === 'sprite' ? visual.style : undefined}>{visual?.kind === 'image' ? <img src={visual.src} alt="" /> : null}</div>
                      <div><strong>{getCategoryLabel(item)} {item.diameter}</strong><span>{item.type}{item.thickness ? ` · ${item.thickness}` : ''}</span></div>
                      <b>{item.quantity} {item.unit}</b>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {!filteredItems.length ? <div className="screenCard orderPlanningEmpty"><strong>Матеріалів немає</strong><p>{search ? 'За пошуком нічого не знайдено.' : 'Додайте матеріали у розділи заказа.'}</p></div> : null}
        </section>
      )}

      {submitState.error ? <p className="orderError">{submitState.error?.data?.error}</p> : null}
      {completeState.error ? <p className="orderError">{completeState.error?.data?.error}</p> : null}

      {canEdit ? (
        <nav className="orderDraftStickyActions" aria-label="Дії з Draft-заказом">
          <Link className={`orderDraftStickyAction orderDraftStickyAction--pdf${aggregatedItems.length ? '' : ' is-disabled'}`} to={aggregatedItems.length ? `/orders/${order.id}/pdf` : '#'} onClick={event => { if (!aggregatedItems.length) event.preventDefault(); }}>Переглянути PDF</Link>
          <button type="button" className="orderDraftStickyAction orderDraftStickyAction--submit" disabled={submitState.isLoading || !aggregatedItems.length} onClick={() => submitOrder(order.id)}>{submitState.isLoading ? 'Відправляємо…' : manager ? 'Відправити' : 'Відправити менеджеру'}</button>
        </nav>
      ) : null}

      {order.documentAvailable ? <section className="screenCard orderDocumentCard"><div className="orderDocumentCardHeading"><span className="orderDocumentCardMark">PDF</span><div><strong>Матеріали заказа #{order.number}</strong><span>Зведений PDF по всіх розділах</span></div></div><OrderDocumentActions order={order} /></section> : null}

      {manager && order.status === 'SUBMITTED' ? <Button fullWidth disabled={completeState.isLoading} onClick={() => completeOrder(order.id)}>{completeState.isLoading ? 'Завершуємо…' : 'Позначити завершеним'}</Button> : null}
    </div>
  );
}
