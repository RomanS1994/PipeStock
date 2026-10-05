import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { BackLink, Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { OrderDocumentActions } from '../../components/OrderDocumentActions/OrderDocumentActions.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import {
  useDownloadOrderPdfMutation,
  useGetOrderQuery,
  useSubmitOrderMutation,
} from '../../features/orders/ordersApi.js';
import { PdfCanvasPreview } from './PdfCanvasPreview.jsx';
import './OrderPdfPreviewPage.css';

const MIN_ZOOM = 75;
const MAX_ZOOM = 175;
const ZOOM_STEP = 25;

function formatDocumentDate(order) {
  const value = order?.completedAt || order?.submittedAt || order?.createdAt;
  if (!value) return '—';
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function savePdfBlob(blob, orderNumber) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `PipeStock-order-${orderNumber}.pdf`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function OrderPdfPreviewPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const membership = (user?.memberships || []).find(item => item.status === 'ACTIVE' && !item.deletedAt);
  const manager = membership?.role === 'MANAGER';
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    refetch: refetchOrder,
  } = useGetOrderQuery(orderId);
  const [downloadOrderPdf, downloadState] = useDownloadOrderPdfMutation();
  const [submitOrder, submitState] = useSubmitOrderMutation();
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const [actionError, setActionError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [fullscreen, setFullscreen] = useState(false);
  const canPreviewPdf = Boolean(
    order?.documentAvailable ||
    (order?.status === 'DRAFT' && order?.items?.length),
  );
  const isDraft = order?.status === 'DRAFT';
  const canSubmitDraft = Boolean(isDraft && (manager || order?.createdByMembershipId === membership?.id));

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

  useEffect(() => {
    if (!fullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  const handleRenderError = useCallback(() => {
    setPdfError('Не вдалося відобразити PDF.');
  }, []);

  async function handleDownloadDraft() {
    if (!order) return;
    setActionError('');
    try {
      const blob = pdfBlob || await downloadOrderPdf(order.id).unwrap();
      if (!pdfBlob) setPdfBlob(blob);
      savePdfBlob(blob, order.number);
    } catch {
      setActionError('Не вдалося завантажити PDF.');
    }
  }

  async function handleSubmitDraft() {
    if (!order || !order.items?.length || !canSubmitDraft) return;
    setActionError('');
    try {
      await submitOrder(order.id).unwrap();
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error) {
      setActionError(error?.data?.error || 'Не вдалося відправити заказ.');
    }
  }

  function changeZoom(delta) {
    setZoom(value => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value + delta)));
  }

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
          <strong>Перегляд PDF</strong>
          <span>Заказ #{order.number}{isDraft ? ' · Draft' : ''}</span>
        </div>
        <span />
      </header>

      {isDraft ? (
        <section className="orderPdfDraftNotice" role="note">
          <span className="orderPdfDraftNoticeIcon" aria-hidden="true">i</span>
          <div>
            <strong>Це попередня версія PDF.</strong>
            <p>Після відправлення документ буде зафіксовано.</p>
          </div>
        </section>
      ) : null}

      <section className="orderPdfPreviewMeta orderPdfPreviewMeta--compact">
        <div><span>Об’єкт</span><strong>{order.project?.name || '—'}</strong></div>
        <div><span>Працівник</span><strong>{order.worker?.name || '—'}</strong></div>
        <div><span>Дата</span><strong>{formatDocumentDate(order)}</strong></div>
      </section>

      <div className={`orderPdfPreviewDocumentShell${fullscreen ? ' is-fullscreen' : ''}`}>
        {fullscreen ? (
          <header className="orderPdfFullscreenHeader">
            <strong>Заказ #{order.number}</strong>
            <button type="button" onClick={() => setFullscreen(false)} aria-label="Закрити повноекранний перегляд">×</button>
          </header>
        ) : null}

        <section className="screenCard orderPdfPreviewCard">
          {pdfError ? <div className="orderPdfPreviewState"><strong>{pdfError}</strong><Button variant="text" onClick={() => setRetryKey(value => value + 1)}>Спробувати ще раз</Button></div> : null}
          {!pdfError && !pdfBlob ? <div className="orderPdfPreviewState"><strong>Готуємо PDF…</strong></div> : null}
          {!pdfError && pdfBlob ? <PdfCanvasPreview blob={pdfBlob} onError={handleRenderError} zoom={zoom} /> : null}
        </section>

        <div className="orderPdfZoomBar" aria-label="Масштаб PDF">
          <button type="button" disabled={zoom <= MIN_ZOOM} onClick={() => changeZoom(-ZOOM_STEP)} aria-label="Зменшити масштаб">−</button>
          <strong>{zoom}%</strong>
          <button type="button" disabled={zoom >= MAX_ZOOM} onClick={() => changeZoom(ZOOM_STEP)} aria-label="Збільшити масштаб">+</button>
          <button type="button" className="orderPdfFullscreenButton" onClick={() => setFullscreen(value => !value)} aria-label={fullscreen ? 'Закрити повноекранний перегляд' : 'Відкрити на весь екран'}>⛶</button>
        </div>
      </div>

      {actionError ? <p className="orderError orderPdfActionError" role="alert">{actionError}</p> : null}

      {isDraft ? (
        <nav className="orderPdfDraftActions" aria-label="Дії з Draft PDF">
          <button type="button" className="orderPdfDraftAction orderPdfDraftAction--back" onClick={() => navigate(`/orders/${order.id}`)}>
            Назад
          </button>
          <button type="button" className="orderPdfDraftAction orderPdfDraftAction--download" disabled={downloadState.isLoading} onClick={handleDownloadDraft}>
            {downloadState.isLoading ? 'PDF…' : 'Завантажити PDF'}
          </button>
          <button
            type="button"
            className="orderPdfDraftAction orderPdfDraftAction--submit"
            disabled={submitState.isLoading || !order.items.length || !canSubmitDraft}
            onClick={handleSubmitDraft}
          >
            {submitState.isLoading ? 'Відправляємо…' : manager ? 'Відправити' : 'Відправити менеджеру'}
          </button>
        </nav>
      ) : (
        <OrderDocumentActions order={order} className="orderPdfPreviewActions" hidePreview />
      )}
    </div>
  );
}
