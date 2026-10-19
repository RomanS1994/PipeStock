import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackLink, Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useDeleteOrderItemMutation,
  useDeleteOrderSectionMutation,
  useGetOrderQuery,
  useGetOrderSectionQuery,
  useUpdateOrderItemMutation,
  useUpdateOrderSectionMutation,
} from '../../features/orders/ordersApi.js';
import { getMaterialVisual } from '../AddMaterialPage/materialImageResolver.js';
import '../OrderFlow/OrderFlow.css';
import './OrderSectionPage.css';

const MAX_QUANTITY = 99999;
const CATEGORY_LABELS = { CU: 'Měď', STEEL: 'Uhlíková ocel', OTHER: 'Montážní materiál' };

function getCategoryLabel(item) {
  return CATEGORY_LABELS[String(item?.categoryKey || '').toUpperCase()] || item?.categoryLabel || '';
}

export function OrderSectionPage() {
  const { orderId, sectionId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && !item.deletedAt);
  const manager = membership?.role === 'MANAGER';
  const { data: order, isLoading: orderLoading, isError: orderError, refetch: refetchOrder } = useGetOrderQuery(orderId);
  const { data: section, isLoading: sectionLoading, isError: sectionError, refetch: refetchSection } = useGetOrderSectionQuery({ orderId, sectionId });
  const [updateItem, updateItemState] = useUpdateOrderItemMutation();
  const [deleteItem, deleteItemState] = useDeleteOrderItemMutation();
  const [updateSection, updateSectionState] = useUpdateOrderSectionMutation();
  const [deleteSection, deleteSectionState] = useDeleteOrderSectionMutation();
  const [tab, setTab] = useState('materials');
  const [pendingId, setPendingId] = useState(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const canEdit = order?.status === 'DRAFT' && (manager || order?.createdByMembershipId === membership?.id);
  const items = section?.items || [];

  async function changeQuantity(item, delta) {
    if (!canEdit || pendingId) return;
    const current = Number(item.quantity);
    const next = Math.max(0.01, Math.min(MAX_QUANTITY, Math.round((current + delta) * 100) / 100));
    if (next === current) return;
    setPendingId(item.id);
    setMessage('');
    try {
      await updateItem({ orderId, itemId: item.id, quantity: next }).unwrap();
      refetchSection();
    } catch (error) {
      setMessage(error?.data?.error || 'Не вдалося змінити кількість.');
    } finally {
      setPendingId(null);
    }
  }

  async function removeItem(itemId) {
    if (!canEdit || pendingId) return;
    setPendingId(itemId);
    setMessage('');
    try {
      await deleteItem({ orderId, itemId }).unwrap();
      refetchSection();
    } catch (error) {
      setMessage(error?.data?.error || 'Не вдалося видалити матеріал.');
    } finally {
      setPendingId(null);
    }
  }

  async function renameSection() {
    const nextName = name.trim();
    if (!nextName) return;
    setMessage('');
    try {
      await updateSection({ orderId, sectionId, name: nextName }).unwrap();
      setName('');
      refetchSection();
    } catch (error) {
      setMessage(error?.data?.error || 'Не вдалося перейменувати розділ.');
    }
  }

  async function removeSection() {
    if (!canEdit || !window.confirm(`Видалити розділ «${section.name}» разом з усіма його матеріалами?`)) return;
    try {
      await deleteSection({ orderId, sectionId }).unwrap();
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (error) {
      setMessage(error?.data?.error || 'Не вдалося видалити розділ.');
    }
  }

  if (orderLoading || sectionLoading) return <section className="screenCard">Завантажуємо розділ…</section>;
  if (orderError || sectionError || !order || !section) {
    return <section className="screenCard orderSectionState"><strong>Не вдалося відкрити розділ</strong><Button onClick={() => { refetchOrder(); refetchSection(); }}>Спробувати ще раз</Button></section>;
  }

  return (
    <div className="pageStack orderSectionPage">
      <header className="orderSectionTopbar">
        <BackLink to={`/orders/${orderId}`} />
        <strong>Розділ</strong>
        <span />
      </header>

      <section className="orderSectionHeading">
        <h1>{section.name}</h1>
        <p>Заказ #{order.number} · {order.title}</p>
      </section>

      <nav className="orderSectionTabs" aria-label="Розділ">
        <button type="button" className={tab === 'materials' ? 'is-active' : ''} onClick={() => setTab('materials')}>Матеріали</button>
        <button type="button" className={tab === 'info' ? 'is-active' : ''} onClick={() => setTab('info')}>Інформація</button>
      </nav>

      {tab === 'materials' ? (
        <section className="screenCard orderSectionMaterials">
          <div className="orderSectionMaterialsHeader">
            <span>Матеріалів: <strong>{items.length}</strong></span>
            {canEdit ? <Link to={`/orders/${orderId}/sections/${sectionId}/materials/new`}>+ Додати</Link> : null}
          </div>

          <div className="orderSectionItemList">
            {items.map(item => {
              const visual = getMaterialVisual(item);
              const category = getCategoryLabel(item);
              const busy = pendingId !== null || updateItemState.isLoading || deleteItemState.isLoading;
              return (
                <article className="orderSectionItem" key={item.id}>
                  <div className="orderSectionItemImage" style={visual?.kind === 'sprite' ? visual.style : undefined}>
                    {visual?.kind === 'image' ? <img src={visual.src} alt="" /> : null}
                  </div>
                  <div className="orderSectionItemCopy">
                    <strong>{category} {item.diameter}</strong>
                    <span>{item.type}{item.thickness ? ` · ${item.thickness}` : ''}</span>
                  </div>
                  {canEdit ? (
                    <div className="orderSectionStepper">
                      <button type="button" disabled={busy || Number(item.quantity) <= 0.01} onClick={() => changeQuantity(item, -1)}>−</button>
                      <strong>{pendingId === item.id ? '…' : item.quantity}</strong>
                      <button type="button" disabled={busy || Number(item.quantity) >= MAX_QUANTITY} onClick={() => changeQuantity(item, 1)}>+</button>
                      <span>{item.unit}</span>
                    </div>
                  ) : <strong className="orderSectionReadQty">{item.quantity} {item.unit}</strong>}
                  {canEdit ? <button type="button" className="orderSectionRemove" disabled={busy} onClick={() => removeItem(item.id)}>×</button> : null}
                </article>
              );
            })}
            {!items.length ? <div className="orderSectionEmpty"><strong>Матеріалів ще немає</strong><p>Додайте матеріали до цього розділу.</p></div> : null}
          </div>

          {message ? <p className="orderError">{message}</p> : null}
        </section>
      ) : (
        <section className="screenCard orderSectionInfo">
          <dl>
            <div><dt>Об’єкт</dt><dd>{order.project?.name || '—'}</dd></div>
            <div><dt>Заказ</dt><dd>#{order.number} · {order.title}</dd></div>
            <div><dt>Розділ</dt><dd>{section.name}</dd></div>
            <div><dt>Матеріалів</dt><dd>{items.length}</dd></div>
          </dl>
          {canEdit ? (
            <div className="orderSectionEdit">
              <input value={name} maxLength={120} placeholder="Нова назва розділу" onChange={event => setName(event.target.value)} />
              <Button type="button" variant="secondary" disabled={!name.trim() || updateSectionState.isLoading} onClick={renameSection}>Перейменувати</Button>
              <button type="button" className="orderSectionDelete" disabled={deleteSectionState.isLoading} onClick={removeSection}>Видалити розділ</button>
            </div>
          ) : null}
        </section>
      )}

      <footer className="orderSectionFooter">
        {items.length ? <Link className="orderSectionPdf" to={`/orders/${orderId}/sections/${sectionId}/pdf`}>Переглянути PDF</Link> : null}
        {canEdit ? <Link className="orderSectionAdd" to={`/orders/${orderId}/sections/${sectionId}/materials/new`}>+ Додати матеріал</Link> : null}
      </footer>
    </div>
  );
}
