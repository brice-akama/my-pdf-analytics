"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Loader2, FileText } from "lucide-react";

type PdfViewerDrawerProps = {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  docName: string;
  spaceId: string;
  docId: string;
};

export function PdfViewerDrawer({ open, onClose, pdfUrl, docName, spaceId, docId }: PdfViewerDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState("1");

  // Load PDF.js dynamically
  const getPdfjsLib = useCallback(async () => {
    if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
    const lib = (window as any).pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return lib;
  }, []);

  // Fetch the actual PDF blob via our download API (bypasses Cloudinary CORS)
  const fetchPdfBlob = useCallback(async (): Promise<string> => {
    const res = await fetch(`/api/spaces/${spaceId}/files/${docId}/download`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch document");
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, [spaceId, docId]);

  const renderPage = useCallback(async (pageNum: number, pdf: any, zoom: number) => {
    if (!canvasRef.current) return;

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
      renderTaskRef.current = null;
    }

    setLoading(true);
    try {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      // Handle device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      const renderContext = { canvasContext: ctx, viewport };
      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") {
        setError("Failed to render page");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load PDF when drawer opens
  useEffect(() => {
    if (!open) return;
    let blobUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      setPageInput("1");

      try {
        const [pdfjsLib, blob] = await Promise.all([getPdfjsLib(), fetchPdfBlob()]);
        blobUrl = blob;
        const pdf = await pdfjsLib.getDocument(blob).promise;
        pdfRef.current = pdf;
        setTotalPages(pdf.numPages);
        await renderPage(1, pdf, scale);
      } catch (e) {
        setError("Could not load document. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      pdfRef.current = null;
    };
  }, [open, docId]); // eslint-disable-line

  // Re-render on page/scale change
  useEffect(() => {
    if (pdfRef.current && open) {
      renderPage(currentPage, pdfRef.current, scale);
    }
  }, [currentPage, scale, open, renderPage]);

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/files/${docId}/download`, {
        credentials: "include",
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = docName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative flex flex-col w-full max-w-4xl h-full bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate max-w-xs">{docName}</p>
              {totalPages > 0 && (
                <p className="text-xs text-slate-400">
                  {totalPages} page{totalPages !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Zoom controls */}
            <button
              onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
              className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4 text-slate-300" />
            </button>
            <span className="text-xs text-slate-400 w-10 text-center font-mono">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(3, s + 0.2))}
              className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4 text-slate-300" />
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1" />

            {/* Download */}
            <button
              onClick={handleDownload}
              className="h-8 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center gap-1.5 transition-colors text-xs text-slate-300"
              title="Download"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-red-600/80 flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* PDF canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-slate-800 flex items-start justify-center p-6"
        >
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="h-16 w-16 text-slate-600 mb-4" />
              <p className="text-slate-300 font-medium mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfUrl || "", "_blank")}
                className="border-slate-600 text-slate-300"
              >
                Open in new tab instead
              </Button>
            </div>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-10 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-2xl block"
                style={{ maxWidth: "100%" }}
              />
            </div>
          )}
        </div>

        {/* Page navigation footer */}
        {totalPages > 0 && (
          <div className="flex items-center justify-center gap-4 px-5 py-3 border-t border-slate-700 bg-slate-900 flex-shrink-0">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-slate-300" />
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span>Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => goToPage(parseInt(pageInput) || currentPage)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToPage(parseInt(pageInput) || currentPage);
                }}
                className="w-14 px-2 py-1 rounded-md bg-slate-700 border border-slate-600 text-center text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <span>of {totalPages}</span>
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}