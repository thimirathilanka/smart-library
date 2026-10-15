"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Maximize, Minimize } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";

type ViewerState = "loading" | "ready" | "error";

function PdfPage({
  pdf,
  pageNumber,
  containerWidth,
  scrollRoot,
  title,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  containerWidth: number;
  scrollRoot: HTMLDivElement | null;
  title: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !scrollRoot) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { root: scrollRoot, rootMargin: "900px 0px" },
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isNearViewport || !containerWidth || !canvas) return;
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    async function renderPage() {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        const targetCanvas = canvasRef.current;
        const pageViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.6, (containerWidth - 32) / pageViewport.width);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * pixelRatio });
        targetCanvas.width = Math.floor(viewport.width);
        targetCanvas.height = Math.floor(viewport.height);
        targetCanvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
        targetCanvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;
        renderTask = page.render({ canvas: targetCanvas, viewport });
        await renderTask.promise;
      } catch (error) {
        if (cancelled || (error instanceof Error && error.name === "RenderingCancelledException")) return;
        setRenderError(true);
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [containerWidth, isNearViewport, pageNumber, pdf]);

  return (
    <div
      ref={wrapperRef}
      className="mx-auto flex h-fit min-h-80 w-full max-w-5xl justify-center bg-white shadow-[0_8px_30px_-12px_rgba(11,31,58,0.5)]"
      aria-label={`${title}, page ${pageNumber}`}
    >
      {renderError ? (
        <p className="p-8 text-sm text-red-800" role="alert">Page {pageNumber} could not be rendered.</p>
      ) : (
        <canvas ref={canvasRef} className="max-w-full" aria-label={`${title}, page ${pageNumber}`} />
      )}
    </div>
  );
}

export function PdfPageViewer({ src, title }: { src: string; title: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(window.document.fullscreenElement === sectionRef.current);
    }
    window.addEventListener("fullscreenchange", syncFullscreen);
    return () => window.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  async function toggleFullscreen() {
    if (window.document.fullscreenElement === sectionRef.current) {
      await window.document.exitFullscreen();
    } else {
      await sectionRef.current?.requestFullscreen();
    }
  }

  useEffect(() => {
    const container = scrollRoot;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    async function loadDocument() {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (cancelled) return;
        setViewerState("loading");
        setErrorMessage("");
        setPdf(null);
        setPageCount(0);
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = pdfjs.getDocument({ url: src, useWasm: false });
        const loadedPdf = await loadingTask.promise;
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }
        setPdf(loadedPdf);
        setPageCount(loadedPdf.numPages);
        setViewerState("ready");
      } catch {
        if (cancelled) return;
        setViewerState("error");
        setErrorMessage("This PDF could not be opened. Refresh the page and try again.");
      }
    }

    void loadDocument();
    return () => {
      cancelled = true;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [src]);

  return (
    <section ref={sectionRef} className={`mt-10${isFullscreen ? " reader-fullscreen" : ""}`} aria-label="PDF reader">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2">
        <p className="min-w-0 truncate text-sm font-medium text-navy" title={title}>{title}</p>
        <div className="flex shrink-0 items-center gap-3">
          {pageCount > 0 && <span className="text-xs text-muted">{pageCount} pages · scroll to read</span>}
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line text-navy hover:bg-paper"
            aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
      </div>
      <div
        ref={setScrollRoot}
        className={`flex min-h-96 flex-col items-center gap-6 overflow-auto rounded-xl bg-slate-200 p-4 sm:p-6${isFullscreen ? " reader-fullscreen-stage" : ""}`}
      >
        {viewerState === "loading" ? (
          <div className="flex min-h-80 items-center gap-2 text-sm text-muted" role="status">
            <LoaderCircle className="size-4 animate-spin" />
            Loading PDF…
          </div>
        ) : viewerState === "error" ? (
          <p className="m-auto max-w-sm text-center text-sm text-red-800" role="alert">{errorMessage}</p>
        ) : pdf ? (
          Array.from({ length: pageCount }, (_, index) => (
            <PdfPage
              key={`${src}-${index + 1}`}
              pdf={pdf}
              pageNumber={index + 1}
              containerWidth={containerWidth}
              scrollRoot={scrollRoot}
              title={title}
            />
          ))
        ) : null}
      </div>
    </section>
  );
}
