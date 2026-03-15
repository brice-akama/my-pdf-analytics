"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { CertificateView } from '@/components/CertificateView';
 

export default function EnvelopeCertificatePage() {
  const params   = useParams();
  const router   = useRouter();
  const uniqueId = params.uniqueId as string;

  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [data,        setData]        = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/envelope/${uniqueId}/complete-info`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) { setError(d.message || 'Not found'); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Failed to load'); setLoading(false); });
  }, [uniqueId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`/api/envelope/${uniqueId}/certificate/download`);
      if (!res.ok) { alert('Download failed'); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href: url, download: `Certificate_Envelope_${uniqueId}.pdf`,
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

  const { envelope, recipient } = data;

  // Build signers array from all recipients (not just current one)
  const signers = (envelope.recipients || []).map((r: any) => ({
    name:      r.name,
    email:     r.email,
    status:    r.status,
    signedAt:  r.completedAt || null,
    ipAddress: r.ipAddress   || null,
    device:    r.device      || null,
    browser:   r.browser     || null,
    location:  r.location    || null,
  }));

  return (
    <CertificateView
      documentName={envelope.documents?.map((d: any) => d.filename).join(', ') || 'Envelope Documents'}
      envelopeTitle={envelope.title}
      signers={signers}
      completedAt={envelope.completedAt}
      onBack={() => router.push(`/envelope/${uniqueId}/complete`)}
      onDownload={handleDownload}
      downloading={downloading}
      documentHash={generateEnvelopeHash(envelope.envelopeId || uniqueId)}
      totalPages={undefined}
    />
  );
}

function generateEnvelopeHash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `${hex}${seed.replace(/[^a-f0-9]/gi, '').slice(0, 56)}`.slice(0, 64).toUpperCase();
}