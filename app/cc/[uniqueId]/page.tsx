"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mail, FileText, Clock, CheckCircle, Download, ChevronLeft, ChevronRight, CheckSquare, Square } from "lucide-react";

interface SignatureField {
  id: string;
  page: number;
  recipientIndex: number;
  type: 'signature' | 'date' | 'text' | 'checkbox';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchCCData();
  }, []);

  useEffect(() => {
    if (ccData?.documentId) {
      fetchPDF();
    }
  }, [ccData]);

  const fetchCCData = async () => {
    try {
      const res = await fetch(`/api/cc/${params.uniqueId}?email=${email}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setCCData(data);
        console.log('✅ CC Data loaded:', data);
        console.log('📋 Signature Fields:', data.signatureFields?.length || 0);
        console.log('✍️ Signatures:', Object.keys(data.signatures || {}).length);
      } else {
        setError(data.message || "Failed to load document");
      }
    } catch (err) {
      setError("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const fetchPDF = async () => {
    try {
      // ⭐ Use CC-specific file endpoint
      const res = await fetch(
        `/api/cc/${params.uniqueId}/file?email=${email}`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const blob = await res.blob();
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        console.error('Failed to fetch PDF:', res.status);
      }
    } catch (error) {
      console.error("Failed to fetch PDF:", error);
    }
  };

 const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // ⭐ Use the signature download endpoint with CC uniqueId
      const res = await fetch(
        `/api/signature/${params.uniqueId}/download`,
        {
          credentials: "include",
        }
      );
      
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
        console.log('✅ Document downloaded with all signatures');
      } else {
        alert("Failed to download document");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download document");
    } finally {
      setIsDownloading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{error}</h2>
          <p className="text-slate-600">
            Please check your email link or contact the document sender.
          </p>
        </div>
      </div>
    );
  }

  const signatureFields = ccData?.signatureFields || [];
  const signatures = ccData?.signatures || {};

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {ccData?.documentName || "Document"}
                </h1>
                <p className="text-sm text-slate-500">CC: View-only copy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                <Mail className="h-4 w-4 mr-1" />
                CC Recipient
              </span>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                You've been CC'd on this document
              </h2>
              <p className="text-slate-600 mb-4">
                You're receiving this as a courtesy copy. You can view and download the document with all signatures.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700 block mb-1">Document:</span>
                  <span className="text-slate-600">{ccData?.documentName}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700 block mb-1">From:</span>
                  <span className="text-slate-600">{ccData?.senderName}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700 block mb-1">Your Email:</span>
                  <span className="text-slate-600">{ccData?.ccEmail}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700 block mb-1">Status:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    ccData?.status === "Completed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {ccData?.status === "Completed" ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {ccData?.status || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signers Status */}
        {ccData?.recipients && ccData.recipients.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Signing Progress</h3>
            <div className="space-y-3">
              {ccData.recipients.map((recipient: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{recipient.name}</p>
                      <p className="text-xs text-slate-500">{recipient.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    recipient.status === "completed" 
                      ? "bg-green-100 text-green-800" 
                      : recipient.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    {recipient.status === "completed" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Signed
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Preview with Signatures */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Document with Signatures</h3>
          </div>

          <div className="relative bg-slate-100 rounded-lg overflow-hidden">
            {pdfUrl ? (
              <div 
                id="cc-pdf-container" 
                className="relative mx-auto" 
                style={{ width: "210mm", minHeight: `${297 * (ccData?.numPages || 1)}mm` }}
              >
                {/* PDF Embed */}
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

                {/* ⭐ Signature Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {signatureFields.map((field: SignatureField) => {
                    const signature = signatures[field.id];
                    const pageHeight = 297 * 3.78;
                    const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);

                    if (!signature) return null; // Only show signed fields

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
                          {/* Signature Image */}
                          {field.type === "signature" && signature.type === "signature" && (
                            <img
                              src={signature.data}
                              alt="Signature"
                              className="max-h-full max-w-full object-contain"
                              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                            />
                          )}

                          {/* Date */}
                          {field.type === "date" && (
                            <div className="text-center w-full">
                              <p className="text-sm font-medium text-slate-900 leading-tight">
                                {signature.data}
                              </p>
                            </div>
                          )}

                          {/* Text */}
                          {field.type === "text" && (
                            <p className="text-sm font-medium text-slate-900 text-center px-2 leading-tight">
                              {signature.data}
                            </p>
                          )}

                          {/* Checkbox */}
                          {field.type === "checkbox" && (
                            <div className="flex items-center gap-2 w-full h-full px-2">
                              {signature.data === "true" ? (
                                <CheckSquare className="h-5 w-5 text-purple-600 flex-shrink-0" />
                              ) : (
                                <Square className="h-5 w-5 text-slate-400 flex-shrink-0" />
                              )}
                              {field.label && (
                                <p className="text-xs font-medium text-slate-900 truncate">
                                  {field.label}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Signer name tooltip */}
                          {signature.recipientName && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-auto">
                              Signed by: {signature.recipientName}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading PDF...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* What Happens Next */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            What happens next?
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>
                {ccData?.notifyWhen === "immediately"
                  ? "You're receiving this copy immediately as signatures are added"
                  : "You'll receive the final document when all signatures are completed"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>You can download this document anytime using the button above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>All signatures are visible on the document above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-0.5">✓</span>
              <span>No action is required from you - this is for your records only</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}