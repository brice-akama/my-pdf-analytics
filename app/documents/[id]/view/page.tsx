'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OwnerDocumentView({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const documentId = params.id;
        const res = await fetch(`/api/document/${documentId}/view`, {
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
  }, [params.id]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-900">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto p-6">
        <embed
          src={pdfUrl || ''}
          type="application/pdf"
          className="w-full h-screen rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
}