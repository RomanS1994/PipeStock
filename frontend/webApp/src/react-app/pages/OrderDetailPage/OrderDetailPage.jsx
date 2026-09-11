import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { BackLink, Button, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useCompleteOrderMutation,
  useDeleteOrderItemMutation,
  useGetOrderQuery,
  useSubmitOrderMutation,
} from '../../features/orders/ordersApi.js';
import '../OrderFlow/OrderFlow.css';

const STATUS_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Submitted', COMPLETED: 'Completed' };

export function OrderDetailPage() {
  const { orderId } = useParams();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE');
  const manager = membership?.role === 'MANAGER';
  const { data: order, isLoading, isError, refetch } = useGetOrderQuery(orderId);
  const [submitOrder, submitState] = useSubmitOrderMutation();
  const [completeOrder, completeState] = useCompleteOrderMutation();
  const [deleteItem] = useDeleteOrderItemMutation();

  if (isLoading) return <section className="screenCard">Завантажуємо заказ…</section>;
  if (isError || !order) return <section className="screenCard"><strong>Не вдалося відкрити заказ</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section>;

  const canEdit = order.status === 'DRAFT' && (manager || order.createdByMembershipId === membership?.id);

  return (
    <div className="pageStack orderFlowPage">
      <header className="orderTopbar">
        <BackLink to={`/objects/${order.project.id}`} />
        <strong>Заказ #{order.number}</strong>
        <StatusChip status={order.status}>{STATUS_LABELS[order.status]}</StatusChip>
      </header>

      <section className="screenCard orderSummaryCard">
        <div className="orderSummaryHeading">
          <div><h1>{order.title}</h1><p>{order.project.name}</p></div>
          <StatusChip status={order.status}>{STATUS_LABELS[order.status]}</StatusChip>
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
          <div><strong>Матеріали ({order.itemCount})</strong><span>Дані позицій зафіксовані на момент додавання.</span></div>
          {canEdit ? <Link className="orderTextLink" to={`/orders/${order.id}/materials/new`}>+ Додати</Link> : null}
        </div>

        {order.items.length ? (
          <div className="orderItemList">
            {order.items.map(item => (
              <div className="orderItemRow" key={item.id}>
                <div className="orderMaterialMark">{item.categoryLabel.slice(0, 2).toUpperCase()}</div>
                <div className="orderItemCopy"><strong>{item.categoryLabel} {item.diameter}</strong><span>{item.type}</span></div>
                <strong className="orderItemQty">{item.quantity} {item.unit}</strong>
                {canEdit ? <button className="orderRemoveItem" type="button" aria-label="Видалити матеріал" onClick={() => deleteItem({ orderId: order.id, itemId: item.id })}>×</button> : null}
              </div>
            ))}
          </div>
        ) : <div className="orderEmptyMaterials"><strong>Матеріалів ще немає</strong><p>Додайте першу позицію через швидкий 4-кроковий flow.</p></div>}

        {canEdit ? <Link className="psButton psButton--primary psButton--full orderButtonLink" to={`/orders/${order.id}/materials/new`}>+ Додати матеріал</Link> : null}
      </section>

      {submitState.error ? <p className="orderError">{submitState.error?.data?.error}</p> : null}
      {completeState.error ? <p className="orderError">{completeState.error?.data?.error}</p> : null}

      {canEdit ? (
        <Button variant="secondary" fullWidth disabled={submitState.isLoading || !order.items.length} onClick={() => submitOrder(order.id)}>
          {submitState.isLoading ? 'Відправляємо…' : 'Відправити менеджеру'}
        </Button>
      ) : null}
      {manager && order.status === 'SUBMITTED' ? (
        <Button fullWidth disabled={completeState.isLoading} onClick={() => completeOrder(order.id)}>
          {completeState.isLoading ? 'Завершуємо…' : 'Позначити завершеним'}
        </Button>
      ) : null}
      <OrderDocumentActions order={order} />
    </div>
  );
}
