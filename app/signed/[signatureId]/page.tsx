"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, Check, Loader2, AlertCircle, Eye } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function SignedDocumentPage() {
  const params = useParams();
  const signatureId = params.signatureId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
const [drawerContent, setDrawerContent] = useState<string | null>(null);

  // Fetch attachments
  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        const res = await fetch(`/api/signature/${signatureId}/attachments`);
        const data = await res.json();
        if (data.success) {
          setAttachments(data.attachments);
        }
      } catch (err) {
        console.error('Failed to fetch attachments:', err);
      }
    };
    
    fetchAttachments();
  }, [signatureId]);

  // Fetch signed document info
  useEffect(() => {
    const fetchDocumentInfo = async () => {
      try {
        const res = await fetch(`/api/signature/${signatureId}/signed-info`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load document');
          setLoading(false);
          return;
        }

        setDocumentData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document');
        setLoading(false);
      }
    };

    fetchDocumentInfo();
  }, [signatureId]);

  // Download the signed PDF
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/signature/${signatureId}/download`);
      
      if (!res.ok) {
        alert('Failed to download document');
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = documentData?.document?.filename 
        ? documentData.document.filename.replace('.pdf', '_signed.pdf')
        : `signed_document_${signatureId}.pdf`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloading(false);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download document');
      setDownloading(false);
    }
  };

  // View PDF in browser
  const handleView = async () => {
  try {
    const res = await fetch(`/api/signature/${signatureId}/download`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDrawerContent(url);
      setDrawerOpen(true);
    }
  } catch (err) {
    console.error('View error:', err);
    alert('Failed to view document');
  }
};

const handleDrawerClose = (open: boolean) => {
  setDrawerOpen(open);
  if (!open && drawerContent) {
    URL.revokeObjectURL(drawerContent);
    setDrawerContent(null);
  }
};
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading signed document...</p>
        </div>
      </div>
    );
  }

  if (error || !documentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Not Found</h2>
          <p className="text-slate-600">{error || 'This document may not be available yet.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Document Fully Signed!
            </h1>
            <p className="text-green-50">
              All parties have completed signing. Your signed document is ready.
            </p>
          </div>

          {/* Document Info */}
          <div className="p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {documentData.document.filename}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div>
                    <span className="font-medium">Completed:</span>{' '}
                    {new Date(documentData.completedAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div>
                    <span className="font-medium">Pages:</span> {documentData.document.numPages || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleView}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Eye className="h-5 w-5" />
                View Signed Document
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
   
            {/* Signers List */}
            <div className="bg-slate-50 rounded-lg p-6 border">
              <h3 className="font-semibold text-slate-900 mb-4">Signatures Collected</h3>
              <div className="space-y-3">
                {documentData.signers?.map((signer: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{signer.name}</p>
                      <p className="text-sm text-slate-600">{signer.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(signer.signedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>🔒 Legal Notice:</strong> This signed document is legally binding. 
                All signatures have been timestamped and verified. Keep this document for your records.
              </p>
            </div>
          </div>
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                📎 Attachments ({attachments.length})
              </h3>
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment._id}
                    className="border rounded-lg p-4 flex items-center justify-between hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {attachment.fileType.includes('pdf') ? '📄' :
                         attachment.fileType.includes('image') ? '🖼️' :
                         attachment.fileType.includes('word') ? '📝' :
                         attachment.fileType.includes('excel') ? '📊' : '📎'}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{attachment.filename}</p>
                        <p className="text-sm text-slate-500">
                          Uploaded by {attachment.recipientName || attachment.recipientEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/signature/${signatureId}/attachments/${attachment._id}?action=view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View
                      </a>
                      <a
                        href={`/api/signature/${signatureId}/attachments/${attachment._id}?action=download`}
                        download={attachment.filename}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

       
      </div>
      {/* PDF Viewer Drawer */}
<Sheet open={drawerOpen} onOpenChange={handleDrawerClose}>
  <SheetContent side="right" className="w-full sm:max-w-4xl p-0 flex flex-col bg-white">
    <SheetHeader className="p-6 border-b">
      <SheetTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Document Preview
      </SheetTitle>
    </SheetHeader>
    <div className="flex-1 overflow-hidden">
  {drawerContent && (
    <iframe
      src={`${drawerContent}#toolbar=0&navpanes=0&scrollbar=1`}
      className="w-full h-full border-0"
      title="Signed Document Preview"
    />
  )}
</div>
  </SheetContent>
</Sheet>
    </div>
  );
}