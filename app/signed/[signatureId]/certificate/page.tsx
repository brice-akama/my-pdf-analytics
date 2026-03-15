"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { CertificateView } from '@/components/CertificateView';

export default function SignedCertificatePage() {
  const params      = useParams();
  const router      = useRouter();
  const signatureId = params.signatureId as string;

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [data,        setData]        = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/signature/${signatureId}/signed-info`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setError(d.message || 'Not found'); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [signatureId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`/api/signature/${signatureId}/certificate/download`);
      if (!res.ok) { alert('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href:     url,
        download: `Certificate_${signatureId}.pdf`,
      });
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Download failed'); }
    finally { setDownloading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Loading certificate...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f0f1a' }}>
      <div className="rounded-xl p-8 max-w-md text-center"
        style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Certificate Not Found</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)' }}>{error}</p>
      </div>
    </div>
  );

  return (
    <CertificateView
      documentName={data.document?.filename || 'Document'}
      signers={data.signers || []}
      completedAt={data.completedAt || null}
      onBack={() => router.push(`/signed/${signatureId}`)}
      onDownload={handleDownload}
      downloading={downloading}
      documentHash={generateHash(signatureId)}
      totalPages={data.document?.numPages}
    />
  );
}

function generateHash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `${hex}${seed.replace(/[^a-f0-9]/gi, '').slice(0, 56)}`.slice(0, 64).toUpperCase();
}