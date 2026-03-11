"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Mail, FileText, Clock, CheckCircle, Download,
  CheckSquare, Square, Info, X, ChevronRight, Users,
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
    } catch (error) {
      console.error("Failed to fetch PDF:", error);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/signature/${params.uniqueId}/download`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
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

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{error}</h2>
          <p className="text-slate-600">Please check your email link or contact the document sender.</p>
        </div>
      </div>
    );
  }

  const signatureFields: SignatureField[] = ccData?.signatureFields || [];
  const signatures = ccData?.signatures || {};
  const recipients = ccData?.recipients || [];
  const completedCount = recipients.filter((r: any) => r.status === "completed").length;

  // ─── Info Sidebar Content (shared between desktop panel + mobile drawer) ────
  const InfoPanel = () => (
    <div className="flex flex-col gap-5 p-5">
      {/* Document Meta */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Document Info</p>
        <div className="space-y-3">
          {[
            { label: "Document", value: ccData?.documentName },
            { label: "From", value: ccData?.senderName },
            { label: "Your Email", value: ccData?.ccEmail },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-sm font-medium text-slate-800 break-all">{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400">Status</span>
            <span className={`inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-semibold ${
              ccData?.status === "Completed"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {ccData?.status === "Completed"
                ? <CheckCircle className="h-3.5 w-3.5" />
                : <Clock className="h-3.5 w-3.5" />}
              {ccData?.status || "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Signing Progress */}
      {recipients.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Signers</p>
            <span className="text-xs text-slate-500">{completedCount}/{recipients.length} signed</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${recipients.length ? (completedCount / recipients.length) * 100 : 0}%` }}
            />
          </div>

          <div className="space-y-2.5">
            {recipients.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600 font-bold text-xs">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 truncate">{r.email}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  r.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {r.status === "completed"
                    ? <CheckCircle className="h-3 w-3" />
                    : <Clock className="h-3 w-3" />}
                  {r.status === "completed" ? "Signed" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">

          {/* Left: Doc name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
                {ccData?.documentName || "Document"}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">CC: View-only copy</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Info button — visible only on small/medium screens */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </button>

            {/* CC badge — hidden on xs */}
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              <Mail className="h-3.5 w-3.5 mr-1" />
              CC Recipient
            </span>

            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isDownloading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {/* lg+: sidebar sticky, main scrolls freely so PDF naturally slides under sticky header */}
      <div className="flex max-w-screen-2xl mx-auto w-full lg:items-start">

        {/* PDF Viewer */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700">Document with Signatures</span>
            </div>

            <div className="bg-slate-50 relative">
              {pdfUrl ? (
                <div
                  id="cc-pdf-container"
                  className="relative mx-auto"
                  style={{ width: "100%", maxWidth: "210mm", minHeight: `${297 * (ccData?.numPages || 1)}mm` }}
                >
                  <embed
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    type="application/pdf"
                    className="w-full"
                    style={{
                      border: "none",
                      pointerEvents: "none",
                      height: `${297 * (ccData?.numPages || 1)}mm`,
                      display: "block",
                    }}
                  />

                  {/* Signature Overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {signatureFields.map((field) => {
                      const signature = signatures[field.id];
                      const pageHeight = 297 * 3.78;
                      const topPosition = (field.page - 1) * pageHeight + (field.y / 100) * pageHeight;
                      if (!signature) return null;

                      return (
                        <div
                          key={field.id}
                          className="absolute rounded bg-transparent"
                          style={{
                            left: `${field.x}%`,
                            top: `${topPosition}px`,
                            width: field.width ? `${field.width}px` :
                              field.type === "signature" ? "200px" :
                              field.type === "checkbox" ? "30px" : "150px",
                            height: field.height ? `${field.height}px` :
                              field.type === "signature" ? "60px" :
                              field.type === "checkbox" ? "30px" : "40px",
                            transform: "translate(-50%, 0%)",
                            zIndex: 10,
                          }}
                        >
                          <div className="h-full flex flex-col items-center justify-center p-2">
                            {field.type === "signature" && signature.type === "signature" && (
                              <img src={signature.data} alt="Signature" className="max-h-full max-w-full object-contain" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }} />
                            )}
                            {field.type === "date" && (
                              <p className="text-sm font-medium text-slate-900 leading-tight text-center">{signature.data}</p>
                            )}
                            {field.type === "text" && (
                              <p className="text-sm font-medium text-slate-900 text-center px-2 leading-tight">{signature.data}</p>
                            )}
                            {field.type === "checkbox" && (
                              <div className="flex items-center gap-2 w-full h-full px-2">
                                {signature.data === "true"
                                  ? <CheckSquare className="h-5 w-5 text-purple-600 flex-shrink-0" />
                                  : <Square className="h-5 w-5 text-slate-400 flex-shrink-0" />}
                                {field.label && <p className="text-xs font-medium text-slate-900 truncate">{field.label}</p>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-32">
                  <div className="text-center">
                    <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">Loading PDF...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── Desktop Sidebar — sticky so it stays in view while PDF scrolls ── */}

        <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 border-l bg-white sticky top-0 self-start" style={{ height: "100vh", overflowY: "auto" }}>
          {/* Sidebar header */}
          <div className="px-5 py-4 border-b flex items-center gap-2 sticky top-0 bg-white z-10">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">Document Details</span>
          </div>
          <InfoPanel />
        </aside>
      </div>

      {/* ── Mobile / Tablet Sidebar Drawer ─────────────────────────────────── */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Drawer panel — slides in from right */}
      <div className={`lg:hidden fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-bold text-slate-800">Document Details</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <InfoPanel />
        </div>

        {/* Drawer footer */}
        <div className="p-4 border-t bg-white">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isDownloading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isDownloading ? "Downloading..." : "Download PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}