import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink, Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { useDownloadOrderPdfMutation, useGetOrderQuery } from '../../features/orders/ordersApi.js';
import { PdfCanvasPreview } from './PdfCanvasPreview.jsx';
import './OrderPdfPreviewPage.css';

function formatDocumentDate(order) {
  const value = order?.completedAt || order?.submittedAt || order?.createdAt;
  if (!value) return '—';
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

export function OrderPdfPreviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch: refetchOrder,
  } = useGetOrderQuery(orderId);
  const [downloadOrderPdf] = useDownloadOrderPdfMutation();
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const canPreviewPdf = Boolean(
    order?.documentAvailable ||
    (order?.status === 'DRAFT' && order?.items?.length),
  );

  useEffect(() => {
    if (!canPreviewPdf) return undefined;

    let active = true;

    async function loadPreview() {
      setPdfBlob(null);
      setPdfError('');
      try {
        const blob = await downloadOrderPdf(order.id).unwrap();
        if (active) setPdfBlob(blob);
      } catch {
        if (active) setPdfError('Не вдалося завантажити PDF.');
      }
    }

    loadPreview();

    return () => {
      active = false;
    };
  }, [canPreviewPdf, downloadOrderPdf, order?.id, order?.itemCount, retryKey]);

  const handleRenderError = useCallback(() => {
    setPdfError('Не вдалося відобразити PDF.');
  }, []);

  if (orderLoading) {
    return <section className="screenCard orderPdfPreviewState"><strong>Завантажуємо документ…</strong></section>;
  }

  if (orderError || !order) {
    return (
      <section className="screenCard orderPdfPreviewState">
        <strong>Не вдалося відкрити заказ</strong>
        <Button variant="text" onClick={refetchOrder}>Спробувати ще раз</Button>
        <Button variant="text" onClick={() => navigate('/orders')}>До заказів</Button>
      </section>
    );
  }

  if (!canPreviewPdf) {
    return <section className="screenCard orderPdfPreviewState"><strong>PDF ще недоступний</strong><p>Додайте хоча б один матеріал, щоб переглянути PDF перед відправленням.</p><Button variant="text" onClick={() => navigate(`/orders/${order.id}`)}>Назад до заказа</Button></section>;
  }

  return (
    <div className="pageStack orderPdfPreviewPage">
      <header className="orderPdfPreviewTopbar">
        <BackLink to={`/orders/${order.id}`} />
        <div>
          <strong>PDF Preview</strong>
          <span>Заказ #{order.number}</span>
        </div>
        <span />
      </header>

      {order.status === 'DRAFT' ? <section className="screenCard orderPdfPreviewState"><strong>Попередній перегляд Draft</strong><p>Це тимчасовий PDF із поточними матеріалами. Після відправлення буде зафіксовано фінальну версію.</p></section> : null}

      <section className="orderPdfPreviewMeta">
        <div><span>Об’єкт</span><strong>{order.project?.name || '—'}</strong></div>
        <div><span>Заказ</span><strong>#{order.number}</strong></div>
        <div><span>Працівник</span><strong>{order.worker?.name || '—'}</strong></div>
        <div><span>Дата</span><strong>{formatDocumentDate(order)}</strong></div>
      </section>

      <section className="screenCard orderPdfPreviewCard">
        {pdfError ? <div className="orderPdfPreviewState"><strong>{pdfError}</strong><Button variant="text" onClick={() => setRetryKey(value => value + 1)}>Спробувати ще раз</Button></div> : null}
        {!pdfError && !pdfBlob ? <div className="orderPdfPreviewState"><strong>Готуємо PDF…</strong></div> : null}
        {!pdfError && pdfBlob ? <PdfCanvasPreview blob={pdfBlob} onError={handleRenderError} /> : null}
      </section>

      <OrderDocumentActions order={order} className="orderPdfPreviewActions" hidePreview />
    </div>
  );
}
