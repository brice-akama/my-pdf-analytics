"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Mail, FileText, Clock, CheckCircle, Download,
  CheckSquare, Square, Info, X, Loader2, Check,
} from "lucide-react";

interface SignatureField {
  id: string;
  page: number;
  recipientIndex: number;
  type: "signature" | "date" | "text" | "checkbox";
  x: number;
  y: number;
  width?: number;
  height?: number;
  recipientName?: string;
  recipientEmail?: string;
  label?: string;
}

const PDF_NATURAL_W = 794;
const PAGE_H_PX = 297 * 3.78; // 1122px — matches editor & sign page exactly

export default function CCViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");

  const [loading, setLoading] = useState(true);
  const [ccData, setCCData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfWrapperRef = useRef<HTMLDivElement>(null);
  const [pdfScale, setPdfScale] = useState(1);
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<number | null>(null);



  // ── Fetch data ────────────────────────────────────────────────────────────
  useEffect(() => { fetchCCData(); }, []);
  useEffect(() => { if (ccData?.documentId) fetchPDF(); }, [ccData]);

  const fetchCCData = async () => {
    try {
      const res = await fetch(`/api/cc/${params.uniqueId}?email=${email}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCCData(data);
      } else {
        setError(data.message || "Failed to load document");
      }
    } catch {
      setError("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const fetchPDF = async () => {
    try {
      const res = await fetch(`/api/cc/${params.uniqueId}/file?email=${email}`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error("Failed to fetch PDF:", err);
    }
  };

  // ── PDF.js: render at full 794px resolution, crisp on retina ─────────────
  useEffect(() => {
    if (!pdfUrl || !pdfCanvasRef.current) return;

    const renderPDF = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const totalPages = pdf.numPages;
      const dpr = window.devicePixelRatio || 1;

      const canvas = pdfCanvasRef.current!;

      // Pixel buffer = full DPR resolution (crisp)
      canvas.width  = PDF_NATURAL_W * dpr;
      canvas.height = PAGE_H_PX * totalPages * dpr;

      // CSS display = natural 794px (CSS transform handles the scale-down)
      canvas.style.width  = `${PDF_NATURAL_W}px`;
      canvas.style.height = `${PAGE_H_PX * totalPages}px`;

      const ctx = canvas.getContext("2d", { alpha: false })!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page    = await pdf.getPage(pageNum);
        const natural = page.getViewport({ scale: 1 });
        const scale   = (PDF_NATURAL_W / natural.width) * dpr;
        const vp      = page.getViewport({ scale });
        const offsetY = (pageNum - 1) * PAGE_H_PX * dpr;

        ctx.save();
        ctx.translate(0, offsetY);
        await page.render({ canvasContext: ctx, viewport: vp, intent: "display" }).promise;
        ctx.restore();
      }
    };

    renderPDF().catch(console.error);
  }, [pdfUrl]);

  // ── Scale: fit PDF to container width, never upscale ─────────────────────
  useEffect(() => {
    const recalc = () => {
      if (!pdfWrapperRef.current) return;
      const avail = pdfWrapperRef.current.clientWidth - 16;
      setPdfScale(Math.min(avail / PDF_NATURAL_W, 1));
    };
    const observer = new ResizeObserver(recalc);
    if (pdfWrapperRef.current) observer.observe(pdfWrapperRef.current);
    recalc();
    return () => observer.disconnect();
  }, [pdfUrl]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/signature/${params.uniqueId}/download`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `signed_${ccData.documentName || "document.pdf"}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download document");
      }
    } catch {
      alert("Failed to download document");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="text-center max-w-md bg-slate-800 rounded-xl p-8 border border-white/10">
          <div className="h-16 w-16 rounded-full bg-red-900/40 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{error}</h2>
          <p className="text-slate-400">Please check your email link or contact the document sender.</p>
        </div>
      </div>
    );
  }

  const signatureFields: SignatureField[] = ccData?.signatureFields || [];
  const signatures   = ccData?.signatures  || {};
  const recipients   = ccData?.recipients  || [];
  const completedCount = recipients.filter((r: any) => r.status === "completed").length;
  const totalPages   = ccData?.numPages ?? 1;
  const activeSignatures = selectedRecipientIndex !== null
  ? (recipients[selectedRecipientIndex]?.signatures ?? {})
  : (ccData?.signatures ?? {});

const activeFields = selectedRecipientIndex !== null
  ? (recipients[selectedRecipientIndex]?.signatureFields ?? signatureFields)
  : signatureFields;

  // ── Sidebar info panel (reused in desktop + mobile drawer) ───────────────
  const InfoPanel = () => (
    <div className="flex flex-col gap-5 p-5">
      {/* Document Meta */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
          Document Info
        </p>
        <div className="space-y-3">
          {[
            { label: "Document",   value: ccData?.documentName },
            { label: "From",       value: ccData?.senderName   },
            { label: "Your Email", value: ccData?.ccEmail      },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
              <span className="text-sm font-medium text-white break-all">{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Status</span>
            <span className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
              ccData?.status === "Completed"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}>
              {ccData?.status === "Completed"
                ? <CheckCircle className="h-3.5 w-3.5" />
                : <Clock       className="h-3.5 w-3.5" />}
              {ccData?.status || "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/8" />

      {/* Signing Progress */}
      {recipients.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Signers
            </p>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {completedCount}/{recipients.length} signed
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${recipients.length ? (completedCount / recipients.length) * 100 : 0}%`,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              }}
            />
          </div>

         <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
  {selectedRecipientIndex !== null
    ? "Showing selected signer — click again to see all"
    : "Click a signer to view their fields"}
</p>
<div className="space-y-2">
  {recipients.map((r: any, i: number) => (
    <div
      key={i}
      onClick={() => setSelectedRecipientIndex(selectedRecipientIndex === i ? null : i)}
      className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all"
      style={{
        background: selectedRecipientIndex === i
          ? "rgba(99,102,241,0.2)"
          : "rgba(255,255,255,0.05)",
        border: selectedRecipientIndex === i
          ? "1px solid rgba(99,102,241,0.4)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: "rgba(99,102,241,0.25)", color: "#a5b4fc" }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{r.name}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{r.email}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  r.status === "completed"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}>
                  {r.status === "completed"
                    ? <Check  className="h-3 w-3" />
                    : <Clock  className="h-3 w-3" />}
                  {r.status === "completed" ? "Signed" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download button inside sidebar */}
      <div className="mt-2">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {isDownloading
            ? <><Loader2 className="h-4 w-4 animate-spin" />Downloading...</>
            : <><Download className="h-4 w-4" />Download PDF</>}
        </button>
      </div>
    </div>
  );

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: "#0f0f1a" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10" style={{ background: "#1a1a2e" }}>
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 gap-2">

          {/* Left: Branding + doc name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
            >
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-white text-sm">DocMetrics</span>
              <p className="text-xs truncate hidden sm:block" style={{ color: "rgba(255,255,255,0.4)" }}>
                {ccData?.documentName || "Document"}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* CC badge */}
            <span
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc" }}
            >
              <Mail className="h-3.5 w-3.5" />
              CC Recipient
            </span>

            {/* Details button — mobile/tablet */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden h-9 px-3 rounded-lg flex items-center gap-1.5 text-sm transition-all hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-medium">Details</span>
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="h-9 px-4 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {isDownloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Thin progress bar (signing progress) */}
        <div className="h-0.5 w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${recipients.length ? (completedCount / recipients.length) * 100 : 0}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            }}
          />
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
     <div
  className="flex w-full"
  style={{ height: "calc(100vh - 57px)" }}
>

        {/* ── PDF Viewer ──────────────────────────────────────────────────── */}
        <main
  ref={pdfWrapperRef}
  className="flex-1 min-w-0 overflow-y-auto p-2 sm:p-4 lg:p-6"
  style={{ height: "calc(100vh - 57px)" }}
>

          {/* Card wrapper */}
          <div className="rounded-xl overflow-hidden" style={{ background: "#1e2533", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Card header */}
            <div
              className="px-4 py-3 flex items-center gap-2 border-b"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <FileText className="h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} />
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                {ccData?.documentName || "Document"}
              </span>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc" }}
              >
                View only
              </span>
            </div>

            {/* PDF area */}
            <div
              
              className="overflow-y-auto w-full"
              id="cc-pdf-scroll-container"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
            >
              <div className="p-2">
                {pdfUrl ? (
                  /*
                   * Outer container: sized to SCALED dimensions — clips any overflow.
                   * pdfScale < 1 on small screens, = 1 on desktop.
                   */
                  <div
                    className="relative mx-auto rounded-lg overflow-hidden"
                    style={{
                      width:  PDF_NATURAL_W * pdfScale,
                      height: PAGE_H_PX * totalPages * pdfScale,
                      background: "#fff",
                    }}
                  >
                    {/*
                     * Inner container at NATURAL 794px.
                     * CSS transform scales it to fit screen width.
                     * Canvas + overlays share this transform → fields
                     * stay pixel-perfect at every screen size.
                     */}
                    <div
                      style={{
                        width:           PDF_NATURAL_W,
                        height:          PAGE_H_PX * totalPages,
                        transform:       `scale(${pdfScale})`,
                        transformOrigin: "top left",
                        position:        "absolute",
                        top:             0,
                        left:            0,
                      }}
                    >
                      {/* PDF.js canvas — crisp at any DPR */}
                      <canvas
                        ref={pdfCanvasRef}
                        style={{ display: "block", width: `${PDF_NATURAL_W}px` }}
                      />

                      {/* Signature overlays — same coordinate space as canvas */}
                      <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
                         {activeFields.map((field: SignatureField) => {
  const signature = activeSignatures[field.id];
                          if (!signature) return null;

                          // Same coordinate math as sign page & pdfGenerator
                          const topPx = ((field.page - 1) * PAGE_H_PX) + (field.y / 100 * PAGE_H_PX);

                          const W = field.width ?? (
                            field.type === "signature" ? 150 :
                            field.type === "checkbox"  ? 24  : 120
                          );
                          const H = field.height ?? (
                            field.type === "signature" ? 45 :
                            field.type === "checkbox"  ? 24 : 32
                          );

                          return (
                            <div
                              key={field.id}
                              className="absolute rounded bg-transparent"
                              style={{
                                left:      `${field.x}%`,
                                top:       `${topPx}px`,
                                width:     `${W}px`,
                                height:    `${H}px`,
                                transform: "translate(-50%, 0%)",
                                zIndex:    10,
                              }}
                            >
                              <div className="h-full flex flex-col items-center justify-center p-1">
                                {field.type === "signature" && (
                                  <img
                                    src={signature.data}
                                    alt="Signature"
                                    className="max-h-full max-w-full object-contain"
                                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
                                  />
                                )}
                                {field.type === "date" && (
                                  <p className="text-xs font-medium text-slate-900 leading-tight text-center">
                                    {signature.data}
                                  </p>
                                )}
                                {field.type === "text" && (
                                  <p className="text-xs font-medium text-slate-900 text-center px-1 leading-tight">
                                    {signature.data}
                                  </p>
                                )}
                                {field.type === "checkbox" && (
                                  <div className="flex items-center gap-1 w-full h-full px-1">
                                    {signature.data === "true"
                                      ? <CheckSquare className="h-4 w-4 text-purple-600 flex-shrink-0" />
                                      : <Square      className="h-4 w-4 text-slate-400   flex-shrink-0" />}
                                    {field.label && (
                                      <p className="text-xs font-medium text-slate-900 truncate">{field.label}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                      <Loader2 className="h-10 w-10 animate-spin text-purple-400 mx-auto mb-4" />
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>Loading PDF...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── Desktop Sidebar — sticky ──────────────────────────────────── */}
       <aside
  className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0"
  style={{
    height: "calc(100vh - 57px)",
    overflowY: "auto",
    background: "#1a1a2e",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    alignSelf: "flex-start",
  }}
>
          {/* Sidebar header */}
          <div
            className="px-5 py-4 flex items-center gap-2 sticky top-0 z-10"
            style={{ background: "#1a1a2e", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.2)" }}
            >
              <Info className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-white text-sm">Document Details</span>
          </div>
          <InfoPanel />
        </aside>
      </div>

      {/* ── Mobile drawer backdrop ────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ───────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "#1a1a2e", borderLeft: "1px solid rgba(255,255,255,0.1)" }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.2)" }}
            >
              <Info className="h-4 w-4 text-indigo-400" />
            </div>
            <span className="font-bold text-white">Document Details</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <X className="h-4 w-4 text-white/70" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <InfoPanel />
        </div>
      </div>
    </div>
  );
}