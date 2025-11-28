'use client';

import { use, useEffect, useState } from 'react';
import { Loader2, AlertCircle, Download, X } from 'lucide-react';

export default function ViewSignedDocument({ params }: { params: Promise<{ uniqueId: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const uniqueId = resolvedParams.uniqueId;
        console.log('📄 Fetching PDF for uniqueId:', uniqueId);
        
        const res = await fetch(`/api/signature/${uniqueId}/download`, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Failed to load document');
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load document');
        setLoading(false);
      }
    };

    fetchPdf();
  }, [resolvedParams.uniqueId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading signed document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Signed Document Viewer</h1>
          <div className="flex gap-2">
            <a
              href={pdfUrl || '#'}
              download="signed-document.pdf"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Download
            </a>

            <button
              onClick={() => window.close()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto p-6">
        <embed
          src={pdfUrl || ''}
          type="application/pdf"
          className="w-full h-[calc(100vh-120px)] rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}
