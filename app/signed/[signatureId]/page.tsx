"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText, Download, Check, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Paperclip,
} from 'lucide-react';

// ── Constants (must match editor + sign page) ──────────────────────────────
const PDF_NATURAL_W = 794;
const PAGE_H_PX     = 297 * 3.78; // 1122px

export default function SignedDocumentPage() {
  const params      = useParams();
  const signatureId = params.signatureId as string;

  // ── Data state ─────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [attachments,  setAttachments]  = useState<any[]>([]);
  const [pdfUrl,       setPdfUrl]       = useState<string | null>(null);
  const [downloading,  setDownloading]  = useState(false);

  // ── PDF render state ───────────────────────────────────────────────────────
  const pdfCanvasRef  = useRef<HTMLCanvasElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const [pdfScale,    setPdfScale]    = useState(1);
  const [manualZoom,  setManualZoom]  = useState(1);   // user zoom
  const [totalPages,  setTotalPages]  = useState(1);
  const [currentPage, setCurrentPage] = useState(1);   // for sidebar highlight
  const [pagesWithFields, setPagesWithFields] = useState<Set<number>>(new Set());

  // ── Mobile sidebar ─────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Fetch document info ────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        const [infoRes, attRes] = await Promise.all([
          fetch(`/api/signature/${signatureId}/signed-info`),
          fetch(`/api/signature/${signatureId}/attachments`),
        ]);
        const info = await infoRes.json();
        if (!infoRes.ok || !info.success) { setError(info.message || 'Failed to load'); setLoading(false); return; }
        setDocumentData(info);

        const att = await attRes.json();
        if (att.success) setAttachments(att.attachments || []);

        // Collect which pages have fields
        const fields: any[] = info.signatureFields || [];
        setPagesWithFields(new Set(fields.map((f: any) => f.page)));
        setTotalPages(info.document?.numPages || 1);
        setLoading(false);
      } catch (e) {
        setError('Failed to load document');
        setLoading(false);
      }
    };
    run();
  }, [signatureId]);

  // ── Fetch PDF blob ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!documentData) return;
    const run = async () => {
      try {
        const res = await fetch(`/api/signature/${signatureId}/view`);
        if (res.ok) {
          const blob = await res.blob();
          setPdfUrl(URL.createObjectURL(blob));
        }
      } catch (e) { console.error('PDF fetch error', e); }
    };
    run();
  }, [documentData, signatureId]);

  // ── PDF.js render ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfUrl || !pdfCanvasRef.current) return;
    const render = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf   = await pdfjsLib.getDocument(pdfUrl).promise;
      const pages = pdf.numPages;
      setTotalPages(pages);

      const dpr    = window.devicePixelRatio || 1;
      const canvas = pdfCanvasRef.current!;

      canvas.width  = PDF_NATURAL_W * dpr;
      canvas.height = PAGE_H_PX * pages * dpr;
      canvas.style.width  = `${PDF_NATURAL_W}px`;
      canvas.style.height = `${PAGE_H_PX * pages}px`;

      const ctx = canvas.getContext('2d', { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      for (let p = 1; p <= pages; p++) {
        const page    = await pdf.getPage(p);
        const natural = page.getViewport({ scale: 1 });
        const scale   = (PDF_NATURAL_W / natural.width) * dpr;
        const vp      = page.getViewport({ scale });
        const offsetY = (p - 1) * PAGE_H_PX * dpr;
        ctx.save();
        ctx.translate(0, offsetY);
        await page.render({ canvasContext: ctx, viewport: vp, intent: 'display' }).promise;
        ctx.restore();
      }
    };
    render().catch(console.error);
  }, [pdfUrl]);

  // ── Scale: fit wrapper width, respect manual zoom ──────────────────────────
  useEffect(() => {
    const recalc = () => {
      if (!pdfWrapperRef.current) return;
      const avail = pdfWrapperRef.current.clientWidth - 16;
      const base  = Math.min(avail / PDF_NATURAL_W, 1);
      setPdfScale(base * manualZoom);
    };
    const ob = new ResizeObserver(recalc);
    if (pdfWrapperRef.current) ob.observe(pdfWrapperRef.current);
    recalc();
    return () => ob.disconnect();
  }, [pdfUrl, manualZoom]);

  // ── Track current page while scrolling ────────────────────────────────────
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = (e.target as HTMLDivElement).scrollTop;
    const pageH = PAGE_H_PX * pdfScale;
    const page  = Math.floor(scrollTop / pageH) + 1;
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  // ── Scroll to page ─────────────────────────────────────────────────────────
  const scrollToPage = (page: number) => {
    const el = document.getElementById('pdf-view-scroll');
    if (!el) return;
    const pageH = PAGE_H_PX * pdfScale;
    el.scrollTo({ top: (page - 1) * pageH, behavior: 'smooth' });
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/signature/${signatureId}/download`);
      if (!res.ok) { alert('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = documentData?.document?.filename?.replace('.pdf', '_signed.pdf') || `signed_${signatureId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    finally { setDownloading(false); }
  };

  // ── Loading / Error screens ────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Loading signed document...</p>
      </div>
    </div>
  );

  if (error || !documentData) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f1a' }}>
      <div className="rounded-xl p-8 max-w-md text-center" style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Document Not Found</h2>
        <p className="text-slate-400">{error || 'This document may not be available yet.'}</p>
      </div>
    </div>
  );

  const signatureFields: any[] = documentData.signatureFields || [];
  const signatures: Record<string, any> = documentData.signatures || {};

  // ── Main Layout ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0f0f1a' }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-3 sm:px-5 py-2.5 gap-3"
        style={{ background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.08)', minHeight: 52 }}
      >
        {/* Left — branding + doc name */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">DocMetrics</p>
            <p className="text-xs truncate hidden sm:block" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {documentData.document.filename}
            </p>
          </div>
        </div>

        {/* Center — page indicator */}
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scrollToPage(Math.max(currentPage - 1, 1))}
            className="h-7 w-7 rounded flex items-center justify-center transition hover:bg-white/10 disabled:opacity-30"
            disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4 text-white/70" />
          </button>
          <span className="text-xs tabular-nums px-2 py-1 rounded"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
            {currentPage} / {totalPages}
          </span>
          <button onClick={() => scrollToPage(Math.min(currentPage + 1, totalPages))}
            className="h-7 w-7 rounded flex items-center justify-center transition hover:bg-white/10 disabled:opacity-30"
            disabled={currentPage >= totalPages}>
            <ChevronRight className="h-4 w-4 text-white/70" />
          </button>
        </div>

        {/* Right — zoom + download + pages toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Zoom */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setManualZoom(z => Math.max(z - 0.1, 0.5))}
              className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition">
              <ZoomOut className="h-3.5 w-3.5 text-white/70" />
            </button>
            <span className="text-xs text-white/60 w-10 text-center tabular-nums">
              {Math.round(manualZoom * 100)}%
            </span>
            <button onClick={() => setManualZoom(z => Math.min(z + 0.1, 3))}
              className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 transition">
              <ZoomIn className="h-3.5 w-3.5 text-white/70" />
            </button>
          </div>

          {/* View only badge */}
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
            View only
          </span>

          {/* Mobile pages toggle */}
          <button onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <FileText className="h-4 w-4 text-white/70" />
          </button>

          {/* Download */}
          <button onClick={handleDownload} disabled={downloading}
            className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {downloading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1" style={{ height: 'calc(100vh - 52px)' }}>

        {/* ── LEFT SIDEBAR — page thumbnails ─────────────────────────────── */}
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto
          flex flex-col flex-shrink-0 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `} style={{
          width: 200,
          background: '#1a1a2e',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          height: '100%',
          top: 52,
        }}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.4)' }}>Pages</span>
            <button onClick={() => setSidebarOpen(false)}
              className="lg:hidden h-6 w-6 rounded flex items-center justify-center hover:bg-white/10">
              <X className="h-3.5 w-3.5 text-white/60" />
            </button>
          </div>

          {/* Page list */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              const hasField  = pagesWithFields.has(pageNum);
              const isActive  = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => scrollToPage(pageNum)}
                  className="w-full rounded-lg overflow-hidden transition-all group relative"
                  style={{
                    border: isActive
                      ? '2px solid #6366f1'
                      : '2px solid rgba(255,255,255,0.07)',
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                  }}
                >
                  {/* Thumbnail placeholder */}
                  <div className="w-full flex items-center justify-center"
                    style={{ height: 120, background: isActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)' }}>
                    <FileText className="h-8 w-8" style={{ color: isActive ? '#6366f1' : 'rgba(255,255,255,0.2)' }} />
                  </div>

                  {/* Page number row */}
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-medium" style={{ color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.5)' }}>
                      {pageNum}
                    </span>
                    {/* Blue badge if page has a signature field */}
                    {hasField && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.5)' }}>
                        <Check className="h-2.5 w-2.5" />
                        Signed
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Signers summary at bottom */}
          <div className="flex-shrink-0 p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'rgba(255,255,255,0.35)' }}>Signers</p>
            <div className="space-y-1.5">
              {documentData.signers?.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.2)' }}>
                    <Check className="h-3 w-3 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{s.name}</p>
                    <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── PDF VIEWER ──────────────────────────────────────────────────── */}
        <div
          ref={pdfWrapperRef}
          id="pdf-view-scroll"
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
        >
          <div className="p-2 sm:p-4">
            {pdfUrl ? (
              /*
               * Outer: sized to scaled dimensions — no overflow
               * Inner: natural 794px, CSS transform scales to fit
               * Fields: same transform space → exact positions
               */
              <div
                className="relative mx-auto"
                style={{
                  width:  PDF_NATURAL_W * pdfScale,
                  height: PAGE_H_PX * totalPages * pdfScale,
                  background: '#fff',
                  boxShadow: '0 4px 40px rgba(0,0,0,0.5)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  width:           PDF_NATURAL_W,
                  height:          PAGE_H_PX * totalPages,
                  transform:       `scale(${pdfScale})`,
                  transformOrigin: 'top left',
                  position:        'absolute',
                  top: 0, left: 0,
                }}>
                  {/* PDF canvas */}
                  <canvas
                    ref={pdfCanvasRef}
                    style={{ display: 'block', width: `${PDF_NATURAL_W}px` }}
                  />

                  {/* Page dividers */}
                  {Array.from({ length: totalPages - 1 }, (_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: PAGE_H_PX * (i + 1),
                      left: 0, right: 0,
                      height: 2,
                      background: 'rgba(99,102,241,0.25)',
                      zIndex: 5,
                    }} />
                  ))}

                  {/* Signature field overlays */}
                  <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                    {signatureFields.map((field: any) => {
                      const sig = signatures[field.id];
                      if (!sig) return null;

                      const topPx = ((field.page - 1) * PAGE_H_PX) + (field.y / 100 * PAGE_H_PX);
                      const W = field.width  ?? (field.type === 'signature' ? 150 : field.type === 'checkbox' ? 24 : 120);
                      const H = field.height ?? (field.type === 'signature' ? 45  : field.type === 'checkbox' ? 24 : 32);

                      return (
                        <div key={field.id} className="absolute" style={{
                          left:      `${field.x}%`,
                          top:       `${topPx}px`,
                          width:     `${W}px`,
                          height:    `${H}px`,
                          transform: 'translate(-50%, 0)',
                          zIndex:    10,
                        }}>
                          <div className="h-full w-full flex items-center justify-center p-0.5">
                            {field.type === 'signature' && sig.data && (
                              <img src={sig.data} alt="Signature"
                                className="max-h-full max-w-full object-contain"
                                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }} />
                            )}
                            {field.type === 'date' && (
                              <p className="text-xs font-medium text-slate-900 text-center leading-tight">{sig.data}</p>
                            )}
                            {field.type === 'text' && (
                              <p className="text-xs font-medium text-slate-900 text-center px-1 leading-tight">{sig.data}</p>
                            )}
                            {field.type === 'checkbox' && (
                              <div className="flex items-center justify-center w-full h-full">
                                {sig.data === 'true'
                                  ? <Check className="h-4 w-4 text-purple-600" />
                                  : <div className="h-4 w-4 border-2 border-slate-400 rounded-sm" />}
                              </div>
                            )}
                            {(field.type === 'dropdown' || field.type === 'radio') && (
                              <p className="text-xs font-medium text-slate-900 text-center truncate px-1">{sig.data}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ height: '60vh' }}>
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Rendering document...</p>
                </div>
              </div>
            )}

            {/* ── Attachments below PDF ──────────────────────────────── */}
            {attachments.length > 0 && (
              <div className="mt-4 mx-auto rounded-xl overflow-hidden"
                style={{ maxWidth: PDF_NATURAL_W * pdfScale, background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Paperclip className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">Attachments</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                    {attachments.length}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {attachments.map((att: any) => (
                    <div key={att._id} className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <span className="text-xl flex-shrink-0">
                        {att.fileType?.includes('pdf') ? '📄' : att.fileType?.includes('image') ? '🖼️' : '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{att.filename}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {att.recipientName || att.recipientEmail}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a href={`/api/signature/${signatureId}/attachments/${att._id}?action=view`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition"
                          style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
                          View
                        </a>
                        <a href={`/api/signature/${signatureId}/attachments/${att._id}?action=download`}
                          download={att.filename}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition"
                          style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.4)' }}>
                          Save
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Legal notice ───────────────────────────────────────── */}
            <div className="mt-4 mx-auto px-4 py-3 rounded-lg text-xs text-center"
              style={{
                maxWidth: PDF_NATURAL_W * pdfScale,
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: 'rgba(165,180,252,0.7)',
              }}>
              🔒 This document is legally binding. All signatures are timestamped, verified, and encrypted by DocMetrics.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}