"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, LoaderCircle, Maximize, Minimize, ZoomIn, ZoomOut } from "lucide-react";
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { removeReadingBookmarkAction, saveReadingBookmarkAction } from "@/app/actions/reading";
import type { ResourceKind } from "@/lib/types";

type ViewerState = "loading" | "ready" | "error";

function PdfPage({
  pdf,
  pageNumber,
  width,
  height,
  zoomPercent,
  title,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  height: number;
  zoomPercent: number;
  title: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width || !height) return;
    let cancelled = false;
    let renderTask: RenderTask | null = null;

    async function renderPage() {
      try {
        const page = await pdf.getPage(pageNumber);
        if (cancelled || !canvasRef.current) return;
        const targetCanvas = canvasRef.current;
        const pageViewport = page.getViewport({ scale: 1 });
        const fitScale = Math.min((width - 32) / pageViewport.width, (height - 24) / pageViewport.height);
        const scale = Math.max(0.1, fitScale * (zoomPercent / 100));
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
        // The viewer's load state handles document errors; a failed individual page remains blank.
      }
    }

    void renderPage();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [height, pageNumber, pdf, width, zoomPercent]);

  return (
    <canvas
      ref={canvasRef}
      className="block shrink-0 bg-white shadow-[0_8px_30px_-12px_rgba(11,31,58,0.5)]"
      aria-label={`${title}, page ${pageNumber}`}
    />
  );
}

export function PdfPageViewer({
  src,
  title,
  kind,
  resourceId,
  backHref,
  initialPage = 1,
  initialBookmarkPage,
  isSignedIn,
}: {
  src: string;
  title: string;
  kind: ResourceKind;
  resourceId: string;
  backHref: string;
  initialPage?: number;
  initialBookmarkPage?: number;
  isSignedIn: boolean;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [bookmarkPage, setBookmarkPage] = useState(initialBookmarkPage);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [viewerState, setViewerState] = useState<ViewerState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(window.document.fullscreenElement === sectionRef.current);
    }
    window.addEventListener("fullscreenchange", syncFullscreen);
    return () => window.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver((entries) => {
      const bounds = entries[0]?.contentRect;
      if (bounds) setStageSize({ width: bounds.width, height: bounds.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [isFullscreen, viewerState]);

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
        const startPage = Math.min(Math.max(1, initialPage), loadedPdf.numPages);
        setPageNumber(startPage);
        setPageInput(String(startPage));
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
  }, [initialPage, src]);

  async function toggleFullscreen() {
    if (window.document.fullscreenElement === sectionRef.current) {
      await window.document.exitFullscreen();
    } else {
      await sectionRef.current?.requestFullscreen();
    }
  }

  function savePlace() {
    if (bookmarkPage === pageNumber) {
      setStatusMessage("");
      startTransition(async () => {
        const result = await removeReadingBookmarkAction(resourceId, kind);
        if (result.error) {
          setStatusMessage(result.error);
          return;
        }
        setBookmarkPage(undefined);
        setStatusMessage(`Removed the bookmark from page ${pageNumber}.`);
      });
      return;
    }
    setStatusMessage("");
    startTransition(async () => {
      const result = await saveReadingBookmarkAction(resourceId, kind, pageNumber, pageCount);
      if (result.error) {
        setStatusMessage(result.error);
        return;
      }
      setBookmarkPage(pageNumber);
      setStatusMessage(`Bookmarked page ${pageNumber}.`);
    });
  }

  const zoomOut = () => setZoomPercent((value) => Math.max(50, value - 10));
  const zoomIn = () => setZoomPercent((value) => Math.min(200, value + 10));
  const readPath = kind === "book" ? `/books/${resourceId}/read` : `/research/${resourceId}/read`;

  function requestExit() {
    if (bookmarkPage === pageNumber) {
      router.push(backHref);
      return;
    }
    setConfirmExit(true);
  }

  function bookmarkAndExit() {
    setStatusMessage("");
    startTransition(async () => {
      const result = await saveReadingBookmarkAction(resourceId, kind, pageNumber, pageCount);
      if (result.error) {
        setStatusMessage(result.error);
        return;
      }
      setBookmarkPage(pageNumber);
      router.push(backHref);
    });
  }

  function goToPage(page: number) {
    const nextPage = Math.min(pageCount, Math.max(1, page));
    setPageNumber(nextPage);
    setPageInput(String(nextPage));
  }

  function commitPageInput() {
    const parsed = Number(pageInput);
    goToPage(Number.isFinite(parsed) ? parsed : pageNumber);
  }

  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageNumber, zoomPercent]);

  return (
    <section ref={sectionRef} className={`mt-8 overflow-hidden rounded-2xl border border-line bg-[#242528]${isFullscreen ? " reader-fullscreen" : ""}`} aria-label="PDF reader">
      <div className="flex flex-col gap-2 border-b border-line bg-white px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <button type="button" onClick={requestExit} className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium text-navy-mid hover:bg-paper hover:text-navy sm:text-sm">
            <ChevronLeft className="size-4" /> Back to details
          </button>
          <p className="min-w-0 truncate text-sm font-semibold text-navy" title={title}>{title}</p>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-navy hover:bg-paper"
            aria-label={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 px-3 py-2">
            <label className="flex items-center gap-1 text-xs text-navy-mid">
              <input
                type="number"
                min={1}
                max={pageCount || undefined}
                disabled={viewerState !== "ready"}
                value={pageInput}
                onChange={(event) => setPageInput(event.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(event) => { if (event.key === "Enter") { event.currentTarget.blur(); } }}
                className="w-12 rounded-md bg-white px-1.5 py-1 text-center text-xs text-navy outline-none focus:ring-2 focus:ring-navy/15"
                aria-label="Current page"
              />
              <span>/ {pageCount || "—"}</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center rounded-full border border-line bg-white p-1">
              <button type="button" onClick={zoomOut} disabled={zoomPercent <= 50} className="inline-flex size-7 items-center justify-center rounded-full text-navy hover:bg-paper disabled:opacity-35" aria-label="Zoom out">
                <ZoomOut className="size-4" />
              </button>
              <span className="w-12 text-center text-xs tabular-nums text-navy-mid">{zoomPercent}%</span>
              <button type="button" onClick={zoomIn} disabled={zoomPercent >= 200} className="inline-flex size-7 items-center justify-center rounded-full text-navy hover:bg-paper disabled:opacity-35" aria-label="Zoom in">
                <ZoomIn className="size-4" />
              </button>
            </div>
            <button type="button" onClick={() => setZoomPercent(100)} className="rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-navy hover:bg-paper" title="Fit the whole page in the reader">
              Fit page
            </button>
            {isSignedIn ? (
              <button type="button" onClick={savePlace} disabled={!pageCount || isPending} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-xs font-medium text-white hover:bg-navy-mid disabled:opacity-60">
                {bookmarkPage === pageNumber ? <BookmarkCheck className="size-3.5" /> : <Bookmark className="size-3.5" />}
                {bookmarkPage === pageNumber ? "Remove bookmark" : "Bookmark"}
              </button>
            ) : (
              <Link href={`/login?callbackUrl=${encodeURIComponent(readPath)}`} className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-xs font-medium text-white hover:bg-navy-mid">
                <Bookmark className="size-3.5" /> Sign in to save
              </Link>
            )}
          </div>
        </div>
        <p className={statusMessage ? "text-xs text-navy-soft" : "sr-only"} role="status">{statusMessage}</p>
      </div>

      <div
        ref={stageRef}
        className={`flex overflow-auto p-3 sm:p-5${zoomPercent > 100 ? " items-start justify-start" : " items-center justify-center"}${isFullscreen ? " reader-fullscreen-stage min-h-0 flex-1" : " h-[min(68dvh,860px)] min-h-[26rem]"}`}
      >
        {viewerState === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted" role="status"><LoaderCircle className="size-4 animate-spin" /> Loading PDF…</div>
        ) : viewerState === "error" ? (
          <p className="max-w-sm text-center text-sm text-red-800" role="alert">{errorMessage}</p>
        ) : pdf ? (
          <PdfPage
            key={`${src}-${pageNumber}`}
            pdf={pdf}
            pageNumber={pageNumber}
            width={stageSize.width}
            height={stageSize.height}
            zoomPercent={zoomPercent}
            title={title}
          />
        ) : null}
      </div>
      {viewerState === "ready" ? (
        <nav aria-label="PDF page navigation" className="flex items-center justify-between border-t border-line bg-white px-3 py-3 sm:px-5">
          <button
            type="button"
            disabled={pageNumber <= 1}
            onClick={() => goToPage(pageNumber - 1)}
            className="inline-flex min-w-28 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy shadow-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" /> Previous
          </button>
          <span className="text-xs tabular-nums text-muted">Page {pageNumber} of {pageCount}</span>
          <button
            type="button"
            disabled={pageNumber >= pageCount}
            onClick={() => goToPage(pageNumber + 1)}
            className="inline-flex min-w-28 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy shadow-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </nav>
      ) : null}
      {confirmExit ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-navy/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmExit(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="exit-reader-title" className="w-full max-w-md rounded-3xl border border-line bg-white p-6 shadow-[0_24px_70px_rgba(11,31,58,0.3)]">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-paper text-navy"><Bookmark className="size-5" /></div>
            <h2 id="exit-reader-title" className="mt-4 font-serif text-2xl text-navy">Leave the reader?</h2>
            <p className="mt-2 text-sm leading-6 text-navy-mid">You haven’t bookmarked page {pageNumber}. Would you like to bookmark it before leaving?</p>
            <div className="mt-6 flex flex-col gap-2">
              {isSignedIn ? (
                <button type="button" onClick={bookmarkAndExit} disabled={isPending} className="inline-flex justify-center rounded-full bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-mid disabled:opacity-60">
                  {isPending ? "Saving bookmark…" : "Bookmark page and leave"}
                </button>
              ) : (
                <Link href={`/login?callbackUrl=${encodeURIComponent(`${readPath}?page=${pageNumber}`)}`} className="inline-flex justify-center rounded-full bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-mid">
                  Sign in to bookmark this page
                </Link>
              )}
              <button type="button" onClick={() => router.push(backHref)} className="rounded-full border border-line bg-white px-4 py-3 text-sm font-medium text-navy hover:bg-paper">
                Leave without bookmarking
              </button>
              <button type="button" onClick={() => setConfirmExit(false)} className="rounded-full px-4 py-2 text-sm text-muted hover:bg-paper hover:text-navy">
                Keep reading
              </button>
            </div>
            {statusMessage ? <p role="alert" className="mt-3 text-sm text-red-700">{statusMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
