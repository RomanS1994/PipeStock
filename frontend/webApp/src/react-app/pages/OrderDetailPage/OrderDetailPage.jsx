import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import { BackLink, Button, StatusChip } from '@shared/app/components/ui/PipeStockUI.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useCompleteOrderMutation,
  useDeleteOrderItemMutation,
  useDownloadOrderPdfMutation,
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
  const [downloadOrderPdf, pdfState] = useDownloadOrderPdfMutation();
  const [deleteItem] = useDeleteOrderItemMutation();

  if (isLoading) return <section className="screenCard">Завантажуємо заказ…</section>;
  if (isError || !order) return <section className="screenCard"><strong>Не вдалося відкрити заказ</strong><button type="button" onClick={refetch}>Спробувати ще раз</button></section>;

  const canEdit = order.status === 'DRAFT' && (manager || order.createdByMembershipId === membership?.id);

  async function handleDownloadPdf() {
    try {
      const blob = await downloadOrderPdf(order.id).unwrap();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `PipeStock-order-${order.number}.pdf`;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // RTK Query exposes the error state below.
    }
  }

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
      {pdfState.error ? <p className="orderError">Не вдалося створити PDF. Спробуйте ще раз.</p> : null}

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
      {order.documentAvailable ? (
        <Button variant="secondary" fullWidth disabled={pdfState.isLoading} onClick={handleDownloadPdf}>
          {pdfState.isLoading ? 'Створюємо PDF…' : 'Завантажити PDF'}
        </Button>
      ) : null}
    </div>
  );
}
