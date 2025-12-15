// app/view-signed/[uniqueId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FileText,
  Download,
  Loader2,
  AlertCircle,
  Paperclip,
} from "lucide-react";

export default function ViewSignedDocument() {
  const params = useParams();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signatureData, setSignatureData] = useState<any>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get signature info
        const res = await fetch(`/api/signature/${uniqueId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || "Failed to load document");
          setLoading(false);
          return;
        }

        setSignatureData(data.signature);

        // Get attachments
        const attachRes = await fetch(`/api/signature/${uniqueId}/attachments`);
        const attachData = await attachRes.json();

        if (attachRes.ok && attachData.success) {
          setAttachments(attachData.attachments);
        }

        // Load PDF automatically
        const pdfRes = await fetch(`/api/signature/${uniqueId}/download`);
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          setPdfUrl(URL.createObjectURL(blob));
        }

        setLoading(false);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load document");
        setLoading(false);
      }
    };

    fetchData();
  }, [uniqueId]);

  const handleDownloadComplete = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/signature/${uniqueId}/download`);

      if (!res.ok) {
        alert("Failed to download document");
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `signed_${signatureData.originalFilename || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloading(false);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download document");
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !signatureData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Document Not Found
          </h2>
          <p className="text-slate-600">
            {error || "This document may not be available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {signatureData.originalFilename || signatureData.filename}
              </h1>
              <p className="text-sm text-slate-600">
                Status:{" "}
                <span className="font-medium text-green-600">
                  {signatureData.status === "signed"
                    ? "Completed"
                    : signatureData.status}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                Signed by: {signatureData.recipient?.name} (
                {signatureData.recipient?.email})
              </p>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex gap-4">
            <button
              onClick={handleDownloadComplete}
              disabled={downloading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold shadow-lg disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download Complete Document
                </>
              )}
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                📎 This document includes{" "}
                <strong>{attachments.length} attachment(s)</strong> that will be
                merged into the final PDF.
              </p>
            </div>
          )}
        </div>

        {/* PDF Viewer */}
        {pdfUrl && (
          <div className="bg-white rounded-xl shadow-xl p-4 mb-6">
            <embed
              src={pdfUrl}
              type="application/pdf"
              className="w-full h-[80vh] rounded-lg"
            />
          </div>
        )}

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-purple-600" />
              Attachments ({attachments.length})
            </h3>
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment._id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {attachment.fileType.includes("pdf")
                        ? "📄"
                        : attachment.fileType.includes("image")
                        ? "🖼️"
                        : attachment.fileType.includes("word")
                        ? "📝"
                        : attachment.fileType.includes("excel")
                        ? "📊"
                        : "📎"}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">
                        {attachment.originalFilename || attachment.filename}
                      </p>
                      <p className="text-sm text-slate-500">
                        Uploaded by{" "}
                        {attachment.recipientName || attachment.recipientEmail}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(attachment.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/signature/${uniqueId}/attachments/${attachment._id}?action=view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View
                    </a>

                    <a
                      href={`/api/signature/${uniqueId}/attachments/${attachment._id}?action=download`}
                      download={attachment.originalFilename || attachment.filename}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-sm text-slate-700">
            <strong>💡 Note:</strong> The "Download Complete Document" button will
            download a single PDF containing the signed document and all
            attachments merged together.
          </p>
        </div>
      </div>
    </div>
  );
}
