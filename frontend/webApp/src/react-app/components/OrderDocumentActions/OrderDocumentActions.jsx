import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@shared/app/components/ui/PipeStockUI.jsx';
import { useDownloadOrderPdfMutation } from '../../features/orders/ordersApi.js';
import './OrderDocumentActions.css';

function createFileName(order) {
  return `PipeStock-order-${order.number}.pdf`;
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function OrderDocumentActions({ order, compact = false, className = '', hidePreview = false }) {
  const [downloadOrderPdf, pdfState] = useDownloadOrderPdfMutation();
  const [message, setMessage] = useState('');
  const actionInFlight = useRef(false);

  if (!order?.documentAvailable) return null;

  async function runPdfAction(action) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setMessage('');
    try {
      const blob = await downloadOrderPdf(order.id).unwrap();
      await action(blob);
    } finally {
      actionInFlight.current = false;
    }
  }

  async function handleDownload() {
    try {
      await runPdfAction(async blob => {
        saveBlob(blob, createFileName(order));
      });
    } catch {
      setMessage('Не вдалося створити PDF.');
    }
  }

  async function handleShare() {
    try {
      await runPdfAction(async blob => {
        const fileName = createFileName(order);
        const canBuildFile = typeof File === 'function';
        const file = canBuildFile ? new File([blob], fileName, { type: 'application/pdf' }) : null;
        const canShareFile = Boolean(
          file &&
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] }),
        );

        if (canShareFile) {
          await navigator.share({
            title: `PipeStock · Заказ #${order.number}`,
            text: `${order.title} · ${order.project?.name || 'PipeStock'}`,
            files: [file],
          });
          return;
        }

        saveBlob(blob, fileName);
        setMessage('На цьому пристрої PDF збережено замість поширення.');
      });
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('Не вдалося поділитися PDF.');
    }
  }

  return (
    <div className={`orderDocumentActions${compact ? ' orderDocumentActions--compact' : ''} ${className}`.trim()}>
      {!hidePreview ? <Link className="psButton psButton--secondary orderDocumentActions-preview" to={`/orders/${order.id}/pdf`}>Переглянути</Link> : null}
      <Button variant="secondary" disabled={pdfState.isLoading} onClick={handleDownload}>
        {pdfState.isLoading ? 'PDF…' : 'PDF'}
      </Button>
      <Button variant="secondary" disabled={pdfState.isLoading} onClick={handleShare}>
        Поділитися
      </Button>
      {message ? <small className="orderDocumentActions-message">{message}</small> : null}
    </div>
  );
}
