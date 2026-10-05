import { useEffect, useState } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/build/pdf.mjs';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

export function PdfCanvasPreview({ blob, onError }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (!blob) {
      setPages([]);
      return undefined;
    }

    let cancelled = false;
    let pdf = null;

    async function renderPdf() {
      try {
        const data = new Uint8Array(await blob.arrayBuffer());
        pdf = await getDocument({ data }).promise;
        const rendered = [];
        const scale = Math.min(2, Math.max(1.5, window.devicePixelRatio || 1));

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNumber);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('Canvas context is unavailable');
          await page.render({ canvasContext: context, viewport }).promise;
          rendered.push({ pageNumber, dataUrl: canvas.toDataURL('image/png') });
        }

        if (!cancelled) setPages(rendered);
      } catch (error) {
        if (!cancelled) {
          setPages([]);
          onError?.(error);
        }
      }
    }

    renderPdf();

    return () => {
      cancelled = true;
      pdf?.destroy?.();
    };
  }, [blob, onError]);

  if (!blob) return null;

  if (!pages.length) {
    return <div className="orderPdfPreviewState"><strong>Готуємо сторінки PDF…</strong></div>;
  }

  return (
    <div className="orderPdfCanvasPages">
      {pages.map(page => (
        <img
          key={page.pageNumber}
          className="orderPdfCanvasPage"
          src={page.dataUrl}
          alt={`Сторінка PDF ${page.pageNumber}`}
        />
      ))}
    </div>
  );
}
