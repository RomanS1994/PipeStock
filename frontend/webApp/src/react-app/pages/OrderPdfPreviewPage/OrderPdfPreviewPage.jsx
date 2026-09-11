import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink, Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { useDownloadOrderPdfMutation, useGetOrderQuery } from '../../features/orders/ordersApi.js';
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
  const { data: order, isLoading: orderLoading, isError: orderError } = useGetOrderQuery(orderId);
  const [downloadOrderPdf] = useDownloadOrderPdfMutation();
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!order?.documentAvailable) return undefined;

    let active = true;
    let objectUrl = '';

    async function loadPreview() {
      setPdfUrl('');
      setPdfError('');
      try {
        const blob = await downloadOrderPdf(order.id).unwrap();
        objectUrl = URL.createObjectURL(blob);
        if (active) setPdfUrl(objectUrl);
      } catch {
        if (active) setPdfError('Не вдалося відкрити PDF.');
      }
    }

    loadPreview();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [downloadOrderPdf, order?.documentAvailable, order?.id, retryKey]);

  if (orderLoading) {
    return <section className="screenCard orderPdfPreviewState"><strong>Завантажуємо документ…</strong></section>;
  }

  if (orderError || !order) {
    return <section className="screenCard orderPdfPreviewState"><strong>Не вдалося відкрити заказ</strong><Button variant="text" onClick={() => navigate('/orders')}>До заказів</Button></section>;
  }

  if (!order.documentAvailable) {
    return <section className="screenCard orderPdfPreviewState"><strong>PDF ще недоступний</strong><p>Документ з’явиться після відправлення заказа.</p><Button variant="text" onClick={() => navigate(`/orders/${order.id}`)}>Назад до заказа</Button></section>;
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

      <section className="orderPdfPreviewMeta">
        <div><span>Об’єкт</span><strong>{order.project?.name || '—'}</strong></div>
        <div><span>Заказ</span><strong>#{order.number}</strong></div>
        <div><span>Працівник</span><strong>{order.worker?.name || '—'}</strong></div>
        <div><span>Дата</span><strong>{formatDocumentDate(order)}</strong></div>
      </section>

      <section className="screenCard orderPdfPreviewCard">
        {pdfError ? <div className="orderPdfPreviewState"><strong>{pdfError}</strong><Button variant="text" onClick={() => setRetryKey(value => value + 1)}>Спробувати ще раз</Button></div> : null}
        {!pdfError && !pdfUrl ? <div className="orderPdfPreviewState"><strong>Готуємо PDF…</strong></div> : null}
        {pdfUrl ? (
          <object className="orderPdfPreviewDocument" data={pdfUrl} type="application/pdf" aria-label={`PDF заказа #${order.number}`}>
            <p>Ваш браузер не показує PDF у вікні. Скористайтеся кнопкою PDF нижче.</p>
          </object>
        ) : null}
      </section>

      <OrderDocumentActions order={order} className="orderPdfPreviewActions" hidePreview />
    </div>
  );
}
