import { useState } from 'react';
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

export function OrderDocumentActions({ order, compact = false, className = '' }) {
  const [downloadOrderPdf, pdfState] = useDownloadOrderPdfMutation();
  const [message, setMessage] = useState('');

  if (!order?.documentAvailable) return null;

  async function getPdfBlob() {
    setMessage('');
    return downloadOrderPdf(order.id).unwrap();
  }

  async function handleDownload() {
    try {
      const blob = await getPdfBlob();
      saveBlob(blob, createFileName(order));
    } catch {
      setMessage('Не вдалося створити PDF.');
    }
  }

  async function handleShare() {
    try {
      const blob = await getPdfBlob();
      const file = new File([blob], createFileName(order), { type: 'application/pdf' });
      const canShareFile = typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files: [file] }));

      if (canShareFile) {
        await navigator.share({
          title: `PipeStock · Заказ #${order.number}`,
          text: `${order.title} · ${order.project?.name || 'PipeStock'}`,
          files: [file],
        });
        return;
      }

      saveBlob(blob, file.name);
      setMessage('На цьому пристрої PDF збережено замість поширення.');
    } catch (error) {
      if (error?.name !== 'AbortError') setMessage('Не вдалося поділитися PDF.');
    }
  }

  return (
    <div className={`orderDocumentActions${compact ? ' orderDocumentActions--compact' : ''} ${className}`.trim()}>
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
