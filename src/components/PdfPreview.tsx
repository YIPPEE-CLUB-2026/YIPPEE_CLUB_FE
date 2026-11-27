import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

function PdfPage({ document, number }: { document: PDFDocumentProxy; number: number }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(container.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    document.getPage(number).then(async (page) => {
      if (cancelled) return;
      const element = canvas.current!;
      const base = page.getViewport({ scale: 1 });
      const width = Math.max(1, container.current!.clientWidth);
      const viewport = page.getViewport({ scale: width / base.width * Math.min(window.devicePixelRatio || 1, 2) });
      element.width = Math.ceil(viewport.width);
      element.height = Math.ceil(viewport.height);
      task = page.render({ canvas: element, viewport });
      await task.promise;
      page.cleanup();
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; task?.cancel(); };
  }, [document, number, visible]);
  return (
    <div ref={container} className="pdf-preview__page">
      {error ? <p role="alert">{number}페이지를 표시하지 못했어요.</p> : (
        <canvas ref={canvas} role="img" aria-label={`PDF ${number}페이지`} />
      )}
      <span>{number} / {document.numPages}</span>
    </div>
  );
}

export function PdfPreview({ url }: { url: string }) {
  const [document, setDocument] = useState<PDFDocumentProxy>();
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined;
    setError(false);
    setDocument(undefined);
    // 모바일 기본 PDF 플러그인 대신 페이지를 직접 그려 스크롤합니다.
    import('pdfjs-dist/legacy/build/pdf.mjs').then(async (pdfjs) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.mjs?v=${pdfjs.version}`;
      task = pdfjs.getDocument({ url, cMapUrl: '/pdfjs/cmaps/', cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/', wasmUrl: '/pdfjs/wasm/' });
      const loaded = await task.promise;
      if (!cancelled) setDocument(loaded);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; void task?.destroy(); };
  }, [url]);
  if (error) return <p role="alert">PDF를 표시하지 못했어요. <a href={url} target="_blank" rel="noreferrer">PDF 직접 열기</a></p>;
  if (!document) return <p role="status">PDF를 불러오고 있어요.</p>;
  return <div className="pdf-preview">{Array.from({ length: document.numPages }, (_, i) => (
    <PdfPage key={i} document={document} number={i + 1} />
  ))}</div>;
}
