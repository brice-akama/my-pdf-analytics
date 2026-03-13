"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Download, Check, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Paperclip, Lock,
} from 'lucide-react';

// ── Constants (must match editor + sign page + pdfGenerator) ──────────────
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
  const renderTaskRef = useRef<any>(null);
  const [pdfScale,    setPdfScale]    = useState(1);
  const [manualZoom,  setManualZoom]  = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfReady,    setPdfReady]    = useState(false);
  const [signatureFields, setSignatureFields] = useState<any[]>([]);
  const [signatures,      setSignatures]      = useState<Record<string, any>>({});

  // ── Sidebar thumbnails ─────────────────────────────────────────────────────
  const [thumbs,      setThumbs]      = useState<string[]>([]);

  // ── Mobile sidebar ─────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Fetch document info + attachments ─────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        const [infoRes, attRes] = await Promise.all([
          fetch(`/api/signature/${signatureId}/signed-info`),
          fetch(`/api/signature/${signatureId}/attachments`),
        ]);
        const info = await infoRes.json();
        if (!infoRes.ok || !info.success) {
          setError(info.message || 'Failed to load');
          setLoading(false);
          return;
        }
        setDocumentData(info);
        setSignatureFields(info.signatureFields || []);
        setSignatures(info.signatures || {});

        const att = await attRes.json();
        if (att.success) setAttachments(att.attachments || []);

        setLoading(false);
      } catch {
        setError('Failed to load document');
        setLoading(false);
      }
    };
    run();
  }, [signatureId]);

  // ── Fetch the SIGNED PDF blob (already baked — from Cloudinary) ───────────
  // This is the key difference from the old version:
  // We fetch the SIGNED pdf via /view which returns the already-generated
  // signed PDF from Cloudinary. No overlays needed — signatures are baked in.
  useEffect(() => {
    if (!documentData) return;
    fetch(`/api/signature/${signatureId}/view`)
      .then(r => r.ok ? r.blob() : null)
      .then(blob => blob && setPdfUrl(URL.createObjectURL(blob)))
      .catch(console.error);
  }, [documentData, signatureId]);

  // ── PDF.js: render signed PDF + generate thumbnails ────────────────────────
  useEffect(() => {
    if (!pdfUrl || !pdfCanvasRef.current) return;

    let cancelled = false;

    const render = async () => {
      // Cancel any previous render
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
        renderTaskRef.current = null;
        await new Promise(r => setTimeout(r, 50));
      }

      if (cancelled || !pdfCanvasRef.current) return;
      setPdfReady(false);
      setThumbs([]);

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf   = await pdfjsLib.getDocument(pdfUrl).promise;
      if (cancelled) return;

      const pages = pdf.numPages;
      setTotalPages(pages);

      // ── Main high-res canvas ───────────────────────────────────────────
      const dpr    = window.devicePixelRatio || 1;
      const canvas = pdfCanvasRef.current!;

      // Reset canvas to force clean context
      canvas.width        = 1;
      canvas.height       = 1;
      canvas.width        = PDF_NATURAL_W * dpr;
      canvas.height       = PAGE_H_PX * pages * dpr;
      canvas.style.width  = `${PDF_NATURAL_W}px`;
      canvas.style.height = `${PAGE_H_PX * pages}px`;

      const ctx = canvas.getContext('2d', { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // ── Render all pages into the main canvas ──────────────────────────
      for (let p = 1; p <= pages; p++) {
        if (cancelled) return;

        const page    = await pdf.getPage(p);
        const natural = page.getViewport({ scale: 1 });
        const scale   = (PDF_NATURAL_W / natural.width) * dpr;

        ctx.save();
        ctx.translate(0, (p - 1) * PAGE_H_PX * dpr);

        const task = page.render({
          canvasContext: ctx,
          viewport:      page.getViewport({ scale }),
          intent:        'display',
        });
        renderTaskRef.current = task;

        try {
          await task.promise;
        } catch (err: any) {
          ctx.restore();
          if (err?.name === 'RenderingCancelledException') return;
          throw err;
        }

        ctx.restore();
      }

      if (cancelled) return;

      // ── Scale to fit wrapper ───────────────────────────────────────────
      if (pdfWrapperRef.current) {
        const avail = pdfWrapperRef.current.clientWidth - 16;
        if (avail > 0) setPdfScale(Math.min((avail / PDF_NATURAL_W) * manualZoom, manualZoom));
      }

      renderTaskRef.current = null;
      setPdfReady(true);

      // ── Generate thumbnails from already-rendered main canvas ──────────
      const THUMB_W  = 148;
      const srcPageH = Math.round(PAGE_H_PX * dpr);
      const srcPageW = Math.round(PDF_NATURAL_W * dpr);
      const thumbH   = Math.round(THUMB_W * (srcPageH / srcPageW));

      for (let p = 1; p <= pages; p++) {
        if (cancelled) return;
        const tCanvas    = document.createElement('canvas');
        tCanvas.width    = THUMB_W;
        tCanvas.height   = thumbH;
        const tCtx       = tCanvas.getContext('2d')!;
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        const srcY = (p - 1) * srcPageH;
        tCtx.drawImage(canvas, 0, srcY, srcPageW, srcPageH, 0, 0, THUMB_W, thumbH);
        const dataUrl = tCanvas.toDataURL('image/jpeg', 0.85);
        setThumbs(prev => {
          const next = [...prev];
          next[p - 1] = dataUrl;
          return next;
        });
      }
    };

    render().catch(err => {
      if (err?.name !== 'RenderingCancelledException') console.error(err);
    });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) {}
        renderTaskRef.current = null;
      }
    };
  }, [pdfUrl]);

  // ── Scale on resize or zoom change ────────────────────────────────────────
  useEffect(() => {
    const recalc = () => {
      if (!pdfWrapperRef.current) return;
      const avail = pdfWrapperRef.current.clientWidth - 16;
      if (avail > 0) setPdfScale(Math.min((avail / PDF_NATURAL_W) * manualZoom, manualZoom));
    };
    const ob = new ResizeObserver(recalc);
    if (pdfWrapperRef.current) ob.observe(pdfWrapperRef.current);
    recalc();
    return () => ob.disconnect();
  }, [pdfReady, manualZoom]);

  // ── Scroll tracking ────────────────────────────────────────────────────────
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st   = (e.target as HTMLDivElement).scrollTop;
    const page = Math.floor(st / (PAGE_H_PX * pdfScale)) + 1;
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const scrollToPage = (page: number) => {
    document.getElementById('pdf-view-scroll')
      ?.scrollTo({ top: (page - 1) * PAGE_H_PX * pdfScale, behavior: 'smooth' });
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`/api/signature/${signatureId}/download`);
      if (!res.ok) { alert('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href:     url,
        download: documentData?.document?.filename?.replace('.pdf', '_signed.pdf') || `signed_${signatureId}.pdf`,
      });
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
        <p className="font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Loading signed document...</p>
      </div>
    </div>
  );

  if (error || !documentData) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f1a' }}>
      <div className="rounded-xl p-8 max-w-md text-center"
        style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.15)' }}>
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Document Not Found</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>{error || 'This document may not be available.'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#0f0f1a' }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <header className="flex items-center gap-3 px-3 sm:px-5 flex-shrink-0"
        style={{ height: 52, background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 40 }}>

        {/* Mobile sidebar toggle */}
        <button onClick={() => setSidebarOpen(v => !v)}
          className="lg:hidden flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            <rect x="1" y="2" width="4" height="12" rx="0.5" opacity="0.45"/>
            <rect x="7" y="2" width="8" height="2.5" rx="0.5"/>
            <rect x="7" y="6.75" width="8" height="2.5" rx="0.5"/>
            <rect x="7" y="11.5" width="8" height="2.5" rx="0.5"/>
          </svg>
        </button>

        {/* Doc name */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm leading-tight truncate">
            {documentData.document.filename}
          </p>
          <p className="text-[11px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.32)' }}>
            DocMetrics — Signed Document
          </p>
        </div>

        {/* Page nav */}
        <div className="hidden sm:flex items-center gap-1">
          <button onClick={() => scrollToPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage <= 1}
            className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-25 transition">
            <ChevronLeft className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.65)' }} />
          </button>
          <div className="px-2.5 py-1 rounded text-xs tabular-nums flex items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', minWidth: 62, justifyContent: 'center' }}>
            <span className="font-semibold text-white">{currentPage}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.55)' }}>{totalPages}</span>
          </div>
          <button onClick={() => scrollToPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-25 transition">
            <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.65)' }} />
          </button>
        </div>

        {/* Zoom */}
        <div className="hidden md:flex items-center gap-0.5 px-1.5 rounded"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={() => setManualZoom(z => Math.max(+(z - 0.1).toFixed(1), 0.5))}
            className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/10 transition">
            <ZoomOut className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.55)' }} />
          </button>
          <span className="text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.5)', width: 36, textAlign: 'center' }}>
            {Math.round(manualZoom * 100)}%
          </span>
          <button onClick={() => setManualZoom(z => Math.min(+(z + 0.1).toFixed(1), 3))}
            className="h-7 w-7 rounded flex items-center justify-center hover:bg-white/10 transition">
            <ZoomIn className="h-3.5 w-3.5" style={{ color: 'rgba(255,255,255,0.55)' }} />
          </button>
        </div>

        {/* View-only badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <Lock className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.38)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Signed</span>
        </div>

        {/* Download */}
        <button onClick={handleDownload} disabled={downloading}
          className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Download</span>
        </button>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/60"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
        <aside
          className={[
            'fixed top-[52px] bottom-0 left-0 z-30 flex flex-col flex-shrink-0',
            'lg:relative lg:top-auto lg:bottom-auto lg:z-auto',
            'transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          style={{ width: 172, background: '#1a1a2e', borderRight: '1px solid rgba(255,255,255,0.07)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', height: 40 }}>
            <span className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.32)' }}>Pages</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                {totalPages}p
              </span>
              <button onClick={() => setSidebarOpen(false)}
                className="lg:hidden h-5 w-5 rounded flex items-center justify-center hover:bg-white/10">
                <X className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.45)' }} />
              </button>
            </div>
          </div>

          {/* Page thumbnail list */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              const isActive = currentPage === pageNum;
              const thumb    = thumbs[pageNum - 1];
              return (
                <button
                  key={pageNum}
                  onClick={() => scrollToPage(pageNum)}
                  title={`Page ${pageNum}`}
                  className="w-full rounded-lg overflow-hidden transition-all block text-left"
                  style={{
                    padding:    3,
                    border:     isActive ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.07)',
                    background: isActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="w-full overflow-hidden rounded relative"
                    style={{ background: '#fff', aspectRatio: '8.5 / 11' }}>
                    {thumb ? (
                      <img src={thumb} alt={`Page ${pageNum}`} draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    ) : (
                      <div className="w-full h-full flex flex-col justify-start p-2 gap-1"
                        style={{ background: '#fafafa' }}>
                        {[88, 72, 96, 60, 80, 55, 92, 68, 76, 50].map((w, li) => (
                          <div key={li} className="rounded-sm animate-pulse"
                            style={{ height: 3, width: `${w}%`, background: li % 3 === 0 ? '#d1d5db' : '#e5e7eb' }} />
                        ))}
                      </div>
                    )}
                    {isActive && (
                      <div className="absolute inset-0 pointer-events-none"
                        style={{ boxShadow: 'inset 0 0 0 2px rgba(99,102,241,0.55)' }} />
                    )}
                  </div>
                  <div className="flex items-center justify-between px-0.5 pt-1.5 pb-0.5">
                    <span className="text-[11px] font-semibold tabular-nums"
                      style={{ color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.38)' }}>
                      {pageNum}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Signers at bottom */}
          {documentData.signers?.length > 0 && (
            <div className="flex-shrink-0 px-3 py-2.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2"
                style={{ color: 'rgba(255,255,255,0.28)' }}>Signers</p>
              <div className="space-y-1.5">
                {documentData.signers.map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(34,197,94,0.18)' }}>
                      <Check className="h-2.5 w-2.5 text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate leading-tight">{s.name}</p>
                      <p className="text-[10px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {s.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── PDF VIEWER ──────────────────────────────────────────────────── */}
        <div
          ref={pdfWrapperRef}
          id="pdf-view-scroll"
          className="flex-1 min-w-0 overflow-y-auto"
          onScroll={handleScroll}
          style={{
            height:          '100%',
            background:      '#131320',
            scrollbarWidth:  'thin',
            scrollbarColor:  'rgba(255,255,255,0.08) transparent',
          }}
        >
          <div className="p-3 sm:p-5">

            {/* Loading spinner — shown while PDF.js is rendering */}
            {!pdfReady && pdfUrl && (
              <div className="flex items-center justify-center" style={{ height: '60vh' }}>
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Rendering signed document...</p>
                </div>
              </div>
            )}

            {/* No PDF yet */}
            {!pdfUrl && (
              <div className="flex items-center justify-center" style={{ height: '70vh' }}>
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading document...</p>
                </div>
              </div>
            )}

            {/*
              ── SIGNED PDF CANVAS ────────────────────────────────────────────
              The PDF fetched from /api/signature/${signatureId}/view is the
              ALREADY GENERATED signed PDF stored in Cloudinary.
              Signatures are BAKED INTO the PDF pixels — no overlays needed.
              This is identical to how the CC page works, which is why the
              CC page always shows correct positions.
            */}
            {pdfUrl && (
              <div
                className="relative mx-auto"
                style={{
                  width:        pdfReady ? PDF_NATURAL_W * pdfScale : 0,
                  height:       pdfReady ? PAGE_H_PX * totalPages * pdfScale : 0,
                  background:   '#fff',
                  boxShadow:    pdfReady ? '0 8px 48px rgba(0,0,0,0.6)' : 'none',
                  borderRadius: 3,
                  overflow:     'hidden',
                  display:      pdfReady ? 'block' : 'none',
                }}
              >
                {/* Inner natural-size container — CSS scaled */}
                <div style={{
                  width:           PDF_NATURAL_W,
                  height:          PAGE_H_PX * totalPages,
                  transform:       `scale(${pdfScale})`,
                  transformOrigin: 'top left',
                  position:        'absolute',
                  top: 0, left: 0,
                }}>
                  {/* PDF.js renders the signed PDF directly — signatures already baked in */}
                  <canvas
                    ref={pdfCanvasRef}
                    style={{ display: 'block', width: `${PDF_NATURAL_W}px` }}
                  />

                  {/* Page dividers */}
                  {Array.from({ length: totalPages - 1 }, (_, i) => (
                    <div key={i} style={{
                      position:   'absolute',
                      top:        PAGE_H_PX * (i + 1),
                      left: 0, right: 0,
                      height:     2,
                      background: 'rgba(99,102,241,0.15)',
                      zIndex:     5,
                    }} />
                  ))}

                  {/* Signature overlays — same logic as CC page */}
                  <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                    {signatureFields.map((field: any) => {
                      const sig = signatures[String(field.id)];
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
                          <div className="h-full flex items-center justify-center p-1">
                            {field.type === 'signature' && sig.data && (
                              <img src={sig.data} alt="Signature"
                                className="max-h-full max-w-full object-contain"
                                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }} />
                            )}
                            {(field.type === 'date' || field.type === 'text') && (
                              <p className="text-xs font-medium text-slate-900 text-center leading-tight">{sig.data}</p>
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
            )}

            {/* Attachments */}
            {attachments.length > 0 && pdfReady && (
              <div className="mt-4 mx-auto rounded-xl overflow-hidden"
                style={{ maxWidth: PDF_NATURAL_W * pdfScale, background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-5 py-3 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Paperclip className="h-4 w-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-white">Attachments</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{attachments.length}</span>
                </div>
                <div className="p-4 space-y-2">
                  {attachments.map((att: any) => (
                    <div key={att._id} className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{att.filename}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {att.recipientName || att.recipientEmail}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a href={`/api/signature/${signatureId}/attachments/${att._id}?action=view`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-white"
                          style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
                          View
                        </a>
                        <a href={`/api/signature/${signatureId}/attachments/${att._id}?action=download`}
                          download={att.filename}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-white"
                          style={{ background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.4)' }}>
                          Save
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal notice */}
            {pdfReady && (
              <div className="mt-4 mx-auto px-4 py-3 rounded-lg text-xs text-center"
                style={{
                  maxWidth:   PDF_NATURAL_W * pdfScale,
                  background: 'rgba(99,102,241,0.07)',
                  border:     '1px solid rgba(99,102,241,0.17)',
                  color:      'rgba(165,180,252,0.55)',
                }}>
                This document is legally binding. All signatures are timestamped, verified, and encrypted by DocMetrics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}