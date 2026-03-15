"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Download, Check, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  X, Lock, Package, Award, FileText,
} from 'lucide-react';

const PDF_NATURAL_W = 794;
const PAGE_H_PX     = 297 * 3.78; // 1122px

export default function EnvelopeCompletePage() {
  const params   = useParams();
  const router   = useRouter();
  const uniqueId = params.uniqueId as string;

  // ── Data ────────────────────────────────────────────────────────────────────
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [envelope,      setEnvelope]      = useState<any>(null);
  const [recipient,     setRecipient]     = useState<any>(null);
  const [downloading,   setDownloading]   = useState(false);

  // ── Pre-built signatures map: sigsMap[documentId][String(fieldId)] = { type, data }
  // Built once at load — covers ALL docs so switching docs never loses sig data ──
  const [sigsMap, setSigsMap] = useState<Record<string, Record<string, { type: string; data: string }>>>({});

  // ── Multi-doc state ──────────────────────────────────────────────────────────
  const [documents,     setDocuments]     = useState<any[]>([]);
  const [currentDocIdx, setCurrentDocIdx] = useState(0);
  const [pdfUrls,       setPdfUrls]       = useState<Record<string, string>>({});
  

  // ── PDF render ───────────────────────────────────────────────────────────────
  const pdfCanvasRef  = useRef<HTMLCanvasElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [pdfScale,    setPdfScale]    = useState(1);
  const [manualZoom,  setManualZoom]  = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfReady,    setPdfReady]    = useState(false);
  const [thumbs,      setThumbs]      = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentDoc = documents[currentDocIdx];

  // ── Fetch envelope data ──────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        const res  = await fetch(`/api/envelope/${uniqueId}/complete-info`);
        const data = await res.json();
        if (!res.ok || !data.success) { setError(data.message || 'Not found'); setLoading(false); return; }

        setEnvelope(data.envelope);
        setRecipient(data.recipient);
        setDocuments(data.envelope.documents || []);

        // ── Build sigsMap for ALL docs at once ───────────────────────────────
        // recipient.signedDocuments = [{ documentId, signedFields: [...] }, ...]
        // We index by documentId → fieldId so switching docs is instant
        const map: Record<string, Record<string, { type: string; data: string }>> = {};
        for (const sd of (data.recipient?.signedDocuments || [])) {
          const docMap: Record<string, { type: string; data: string }> = {};
          for (const sf of (sd.signedFields || [])) {
            const val = sf.signatureData || sf.dateValue || sf.textValue || '';
            if (val) docMap[String(sf.id)] = { type: sf.type, data: val };
          }
          map[sd.documentId] = docMap;
        }
        setSigsMap(map);

        // Fetch PDF blobs for all docs
        const urls: Record<string, string> = {};
        for (const doc of (data.envelope.documents || [])) {
          const pdfRes = await fetch(`/api/envelope/${uniqueId}/file?documentId=${doc.documentId}`);
          if (pdfRes.ok) {
            const blob = await pdfRes.blob();
            urls[doc.documentId] = URL.createObjectURL(blob);
          }
        }
        setPdfUrls(urls);
        setLoading(false);
      } catch {
        setError('Failed to load envelope');
        setLoading(false);
      }
    };
    run();
  }, [uniqueId]);

  // ── PDF.js render ────────────────────────────────────────────────────────────
  useEffect(() => {
    const docId = currentDoc?.documentId;
    if (!docId || !pdfUrls[docId] || !pdfCanvasRef.current) return;

    let cancelled = false;

    const render = async () => {
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

      const pdf   = await pdfjsLib.getDocument(pdfUrls[docId]).promise;
      if (cancelled) return;

      const pages = pdf.numPages;
      setTotalPages(pages);
      setCurrentPage(1);

      const dpr    = window.devicePixelRatio || 1;
      const canvas = pdfCanvasRef.current!;
      canvas.width        = 1; canvas.height = 1;
      canvas.width        = PDF_NATURAL_W * dpr;
      canvas.height       = PAGE_H_PX * pages * dpr;
      canvas.style.width  = `${PDF_NATURAL_W}px`;
      canvas.style.height = `${PAGE_H_PX * pages}px`;

      const ctx = canvas.getContext('2d', { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      for (let p = 1; p <= pages; p++) {
        if (cancelled) return;
        const page    = await pdf.getPage(p);
        const natural = page.getViewport({ scale: 1 });
        const scale   = (PDF_NATURAL_W / natural.width) * dpr;
        ctx.save();
        ctx.translate(0, (p - 1) * PAGE_H_PX * dpr);
        const task = page.render({ canvasContext: ctx, viewport: page.getViewport({ scale }), intent: 'display' });
        renderTaskRef.current = task;
        try { await task.promise; } catch (err: any) {
          ctx.restore();
          if (err?.name === 'RenderingCancelledException') return;
          throw err;
        }
        ctx.restore();
      }

      if (cancelled) return;

      if (pdfWrapperRef.current) {
        const avail = pdfWrapperRef.current.clientWidth - 16;
        if (avail > 0) setPdfScale(Math.min((avail / PDF_NATURAL_W) * manualZoom, manualZoom));
      }
      renderTaskRef.current = null;
      setPdfReady(true);

      // Thumbnails
      const THUMB_W  = 148;
      const srcPageH = Math.round(PAGE_H_PX * dpr);
      const srcPageW = Math.round(PDF_NATURAL_W * dpr);
      const thumbH   = Math.round(THUMB_W * (srcPageH / srcPageW));
      for (let p = 1; p <= pages; p++) {
        if (cancelled) return;
        const tc = document.createElement('canvas');
        tc.width = THUMB_W; tc.height = thumbH;
        const tCtx = tc.getContext('2d')!;
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(canvas, 0, (p-1)*srcPageH, srcPageW, srcPageH, 0, 0, THUMB_W, thumbH);
        const url = tc.toDataURL('image/jpeg', 0.85);
        setThumbs(prev => { const n = [...prev]; n[p-1] = url; return n; });
      }
    };

    render().catch(err => { if (err?.name !== 'RenderingCancelledException') console.error(err); });
    return () => {
      cancelled = true;
      if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch (_) {} renderTaskRef.current = null; }
    };
  }, [currentDoc?.documentId, pdfUrls]);

  // ── Scale on resize / zoom ───────────────────────────────────────────────────
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

  // ── Scroll tracking ──────────────────────────────────────────────────────────
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st   = (e.target as HTMLDivElement).scrollTop;
    const page = Math.floor(st / (PAGE_H_PX * pdfScale)) + 1;
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const scrollToPage = (page: number) => {
    document.getElementById('env-pdf-scroll')
      ?.scrollTo({ top: (page - 1) * PAGE_H_PX * pdfScale, behavior: 'smooth' });
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  // ── Download ─────────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`/api/envelope/${uniqueId}/download`);
      if (!res.ok) { alert('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `envelope_signed_${uniqueId}.pdf`,
      });
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    finally { setDownloading(false); }
  };

  // ── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Loading signed envelope...</p>
      </div>
    </div>
  );

  if (error || !envelope) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f1a' }}>
      <div className="rounded-xl p-8 max-w-md text-center"
        style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.15)' }}>
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Envelope Not Found</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>{error || 'This envelope may not be available.'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: '#0f0f1a' }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <header className="flex items-center gap-3 px-3 sm:px-5 flex-shrink-0"
        style={{ height: 52, background: '#1a1a2e', borderBottom: '1px solid rgba(255,255,255,0.08)', zIndex: 40 }}>

        {/* Mobile sidebar toggle */}
        <button onClick={() => setSidebarOpen(v => !v)}
          className="lg:hidden flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <rect x="1" y="2" width="4" height="12" rx="0.5" opacity="0.45"/>
            <rect x="7" y="2" width="8" height="2.5" rx="0.5"/>
            <rect x="7" y="6.75" width="8" height="2.5" rx="0.5"/>
            <rect x="7" y="11.5" width="8" height="2.5" rx="0.5"/>
          </svg>
        </button>

        {/* Branding + doc name */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
            <Package className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">
              {envelope.title || 'Signing Package'}
            </p>
            <p className="text-[11px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.32)' }}>
              DocMetrics — Signed Envelope · {documents.length} document{documents.length !== 1 ? 's' : ''}
            </p>
          </div>
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

        {/* Signed badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <Lock className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.38)' }} />
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Signed</span>
        </div>

        {/* Certificate link */}
        <button onClick={() => router.push(`/envelope/${uniqueId}/certificate`)}
          className="hidden sm:flex h-8 px-3 rounded-lg items-center gap-1.5 text-xs font-semibold transition"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
          <Award className="h-3.5 w-3.5" />
          Certificate
        </button>

        {/* Download */}
        <button onClick={handleDownload} disabled={downloading}
          className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Download</span>
        </button>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0" style={{ height: 'calc(100vh - 52px)', overflow: 'hidden' }}>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
        <aside
          className={[
            'fixed top-[52px] bottom-0 left-0 z-30 flex flex-col flex-shrink-0',
            'lg:relative lg:top-auto lg:bottom-auto lg:z-auto',
            'transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
          style={{ width: 200, background: '#1a1a2e', borderRight: '1px solid rgba(255,255,255,0.07)', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', height: 40 }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.32)' }}>
              Documents
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                {documents.length}
              </span>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden h-5 w-5 rounded flex items-center justify-center hover:bg-white/10">
                <X className="h-3 w-3" style={{ color: 'rgba(255,255,255,0.45)' }} />
              </button>
            </div>
          </div>

          {/* Document list */}
          <div className="py-2 px-2 space-y-1 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {documents.map((doc, idx) => {
              const isActive = idx === currentDocIdx;
              return (
                <button key={doc.documentId} onClick={() => { setCurrentDocIdx(idx); setPdfReady(false); setThumbs([]); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition text-left"
                  style={{
                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                    border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  }}>
                  <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)' }}>
                    {isActive ? <FileText className="h-3 w-3 text-indigo-400" /> : <Check className="h-3 w-3 text-emerald-400" />}
                  </div>
                  <p className="text-xs font-medium truncate" style={{ color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.55)' }}>
                    {doc.filename}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Page thumbnails for current doc */}
          <div className="px-2 py-2 flex-shrink-0 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.32)' }}>Pages</span>
            <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
              {totalPages}p
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              const isActive = currentPage === pageNum;
              const thumb    = thumbs[pageNum - 1];
              return (
                <button key={pageNum} onClick={() => scrollToPage(pageNum)} title={`Page ${pageNum}`}
                  className="w-full rounded-lg overflow-hidden transition-all block text-left"
                  style={{
                    padding: 3,
                    border:     isActive ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.07)',
                    background: isActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <div className="w-full overflow-hidden rounded relative" style={{ background: '#fff', aspectRatio: '8.5 / 11' }}>
                    {thumb ? (
                      <img src={thumb} alt={`Page ${pageNum}`} draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
                    ) : (
                      <div className="w-full h-full flex flex-col justify-start p-2 gap-1" style={{ background: '#fafafa' }}>
                        {[88,72,96,60,80,55,92,68,76,50].map((w, li) => (
                          <div key={li} className="rounded-sm animate-pulse"
                            style={{ height: 3, width: `${w}%`, background: li % 3 === 0 ? '#d1d5db' : '#e5e7eb' }} />
                        ))}
                      </div>
                    )}
                    {isActive && <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 0 2px rgba(99,102,241,0.55)' }} />}
                  </div>
                  <div className="flex items-center px-0.5 pt-1.5 pb-0.5">
                    <span className="text-[11px] font-semibold tabular-nums"
                      style={{ color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.38)' }}>
                      {pageNum}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Signer info at bottom */}
          {recipient && (
            <div className="flex-shrink-0 px-3 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.28)' }}>Signed by</p>
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.18)' }}>
                  <Check className="h-2.5 w-2.5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate leading-tight">{recipient.name}</p>
                  <p className="text-[10px] truncate leading-tight" style={{ color: 'rgba(255,255,255,0.3)' }}>{recipient.email}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── PDF VIEWER ───────────────────────────────────────────────────────── */}
        <div
          ref={pdfWrapperRef}
          id="env-pdf-scroll"
          className="flex-1 min-w-0 overflow-y-auto"
          onScroll={handleScroll}
          style={{
            height:         '100%',
            background:     '#131320',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          }}
        >
          <div className="p-3 sm:p-5">

            {!pdfReady && pdfUrls[currentDoc?.documentId] && (
              <div className="flex items-center justify-center" style={{ height: '60vh' }}>
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Rendering document...</p>
                </div>
              </div>
            )}

            {!pdfUrls[currentDoc?.documentId] && (
              <div className="flex items-center justify-center" style={{ height: '70vh' }}>
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Loading document...</p>
                </div>
              </div>
            )}

            {pdfUrls[currentDoc?.documentId] && (
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
                <div style={{
                  width:           PDF_NATURAL_W,
                  height:          PAGE_H_PX * totalPages,
                  transform:       `scale(${pdfScale})`,
                  transformOrigin: 'top left',
                  position:        'absolute',
                  top: 0, left: 0,
                }}>
                  <canvas ref={pdfCanvasRef} style={{ display: 'block', width: `${PDF_NATURAL_W}px` }} />

                  {/* Page dividers */}
                  {Array.from({ length: totalPages - 1 }, (_, i) => (
                    <div key={i} style={{
                      position: 'absolute', top: PAGE_H_PX * (i + 1),
                      left: 0, right: 0, height: 2,
                      background: 'rgba(99,102,241,0.15)', zIndex: 5,
                    }} />
                  ))}

                  {/* ── Signature overlays ─────────────────────────────────
                      FIX 1: use pre-built sigsMap[docId] — works for ALL docs
                      FIX 2: mixBlendMode:'multiply' removes white sig bg
                      FIX 3: whiteSpace:'nowrap' + overflow:'visible' stops text clip
                  ─────────────────────────────────────────────────────── */}
                  <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                    {(envelope.signatureFields || [])
                      .filter((f: any) => f.documentId === currentDoc?.documentId)
                      .map((field: any) => {
                        // FIX 1: sigsMap is pre-built at load time for every doc
                        const docSigs = sigsMap[currentDoc?.documentId] || {};
                        const sig     = docSigs[String(field.id)];
                        if (!sig) return null;

                        const topPx = ((field.page - 1) * PAGE_H_PX) + (field.y / 100 * PAGE_H_PX);
                        const W = field.width  ?? (field.type === 'signature' ? 140 : field.type === 'checkbox' ? 24 : field.type === 'dropdown' ? 180 : 120);
                        const H = field.height ?? (field.type === 'signature' ? 50  : field.type === 'checkbox' ? 24 : field.type === 'dropdown' ? 36  : 32);

                        return (
                          <div key={String(field.id)} style={{
                            position:       'absolute',
                            left:           `${field.x}%`,
                            top:            `${topPx}px`,
                            width:          `${W}px`,
                            height:         `${H}px`,
                            transform:      'translate(-50%, 0)',
                            zIndex:         10,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                          }}>
                            {/* FIX 2: mix-blend-mode:multiply makes white canvas transparent */}
                            {field.type === 'signature' && sig.data && (
  <img
    src={sig.data}
    alt="Signature"
    style={{
      maxWidth:  '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      display:   'block',
    }}
  />
)}
                            {/* FIX 3: nowrap + overflow visible stops letter clipping */}
                            {(field.type === 'date' || field.type === 'text') && (
                              <span style={{
                                fontSize:   '11px',
                                fontWeight: 500,
                                color:      '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow:   'visible',
                                lineHeight:  1.2,
                              }}>
                                {sig.data}
                              </span>
                            )}
                            {field.type === 'checkbox' && (
                              sig.data === 'true'
                                ? <Check style={{ width: 14, height: 14, color: '#7c3aed' }} />
                                : <div style={{ width: 14, height: 14, border: '2px solid #94a3b8', borderRadius: 3 }} />
                            )}
                            {(field.type === 'dropdown' || field.type === 'radio') && (
                              <span style={{
                                fontSize:   '11px',
                                fontWeight: 500,
                                color:      '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow:   'visible',
                              }}>
                                {sig.data}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
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
                This envelope is legally binding. All signatures are timestamped, verified, and encrypted by DocMetrics.
                <button onClick={() => router.push(`/envelope/${uniqueId}/certificate`)}
                  className="ml-3 underline" style={{ color: '#a5b4fc' }}>
                  View Certificate →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}