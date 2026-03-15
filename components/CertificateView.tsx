"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Award, Check, Loader2, Download,
  Shield, Clock, Monitor, Globe, Hash, FileText,
  ChevronLeft, Package,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CertificateSigner {
  name:       string;
  email:      string;
  status:     string;   // 'signed' | 'completed' | 'pending'
  signedAt?:  string | null;
  ipAddress?: string | null;
  device?:    string | null;
  browser?:   string | null;
  location?: {
    city?:        string;
    region?:      string;
    country?:     string;
    countryCode?: string;
  } | null;
}

export interface CertificateViewProps {
  /** Primary document name (or comma-joined list for envelopes) */
  documentName:   string;
  /** For envelopes — shown as the main title above documentName */
  envelopeTitle?: string;
  signers:        CertificateSigner[];
  completedAt?:   string | null;
  onBack:         () => void;
  onDownload:     () => void;
  downloading:    boolean;
  documentHash?:  string;
  totalPages?:    number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CertificateView — shared UI, no data fetching
// ─────────────────────────────────────────────────────────────────────────────

export function CertificateView({
  documentName,
  envelopeTitle,
  signers,
  completedAt,
  onBack,
  onDownload,
  downloading,
  documentHash,
  totalPages,
}: CertificateViewProps) {

  const signedSigners = signers.filter(s => s.status === 'signed' || s.status === 'completed');
  const allSigned     = signedSigners.length > 0 && signedSigners.length === signers.length;
  const isEnvelope    = Boolean(envelopeTitle);

  return (
    <div className="min-h-screen" style={{ background: '#0f0f1a' }}>

      {/* ══ HEADER ══════════════════════════════════════════════════════════════ */}
      <header className="flex items-center gap-3 px-4 sm:px-6"
        style={{
          height:       52,
          background:   '#1a1a2e',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position:     'sticky',
          top:          0,
          zIndex:       40,
        }}>

        <button onClick={onBack}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition flex-shrink-0"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.65)' }} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Award className="h-5 w-5 text-indigo-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">Certificate of Completion</p>
            <p className="text-[11px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.32)' }}>
              DocMetrics — Legal Audit Trail
            </p>
          </div>
        </div>

        <button onClick={onDownload} disabled={downloading}
          className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-sm font-semibold text-white disabled:opacity-50 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {downloading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Download PDF</span>
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* ── HERO CARD ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Gradient banner */}
          <div className="px-7 py-6"
            style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.12),rgba(59,130,246,0.1))' }}>
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
                {isEnvelope
                  ? <Package className="h-7 w-7 text-white" />
                  : <Award className="h-7 w-7 text-white" />}
              </div>

              {/* Title block */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: 'rgba(165,180,252,0.65)' }}>
                  {isEnvelope ? 'Envelope · Certificate of Completion' : 'Certificate of Completion'}
                </p>

                <h1 className="text-xl font-bold text-white leading-tight">
                  {envelopeTitle || documentName}
                </h1>

                {envelopeTitle && (
                  <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {documentName}
                  </p>
                )}

                {/* Status badge */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: allSigned ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)' }}>
                    <Check className="h-3 w-3" style={{ color: allSigned ? '#34d399' : '#fbbf24' }} />
                  </div>
                  <span className="text-sm font-semibold"
                    style={{ color: allSigned ? '#34d399' : '#fbbf24' }}>
                    {allSigned
                      ? `Fully executed · ${signedSigners.length} signer${signedSigners.length !== 1 ? 's' : ''}`
                      : `${signedSigners.length} of ${signers.length} signed`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div className="px-7 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
              <MetaItem icon={FileText} label="Document" value={documentName} />
              <MetaItem icon={Clock}    label="Completed" value={completedAt ? fmt(completedAt) : 'In progress'} />
              {totalPages && <MetaItem icon={FileText} label="Pages" value={`${totalPages} page${totalPages !== 1 ? 's' : ''}`} />}
            </div>
          </div>

          {/* Document hash */}
          {documentHash && (
            <div className="px-7 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Hash className="h-3.5 w-3.5" style={{ color: 'rgba(165,180,252,0.5)' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  Document Fingerprint (SHA-256)
                </p>
              </div>
              <p className="text-xs font-mono break-all leading-relaxed" style={{ color: 'rgba(165,180,252,0.5)' }}>
                {documentHash}
              </p>
            </div>
          )}
        </div>

        {/* ── SIGNER RECORDS ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)' }}>

          <div className="px-6 py-4 flex items-center gap-2"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Shield className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Signing Records</h2>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full"
                style={{
                  background: allSigned ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
                  color:      allSigned ? '#34d399' : '#fbbf24',
                  border:     `1px solid ${allSigned ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                {signedSigners.length}/{signers.length} signed
              </span>
            </div>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {signers.map((signer, i) => {
              const signed = signer.status === 'signed' || signer.status === 'completed';
              return (
                <div key={i} className="px-6 py-5">

                  {/* Signer identity row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{
                        background: signed
                          ? 'linear-gradient(135deg,#10b981,#059669)'
                          : 'rgba(255,255,255,0.08)',
                      }}>
                      {signed
                        ? <Check className="h-5 w-5" />
                        : <span style={{ color: 'rgba(255,255,255,0.55)' }}>{signer.name?.[0]?.toUpperCase() || '?'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{signer.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{signer.email}</p>
                    </div>
                    <StatusBadge status={signer.status} signed={signed} />
                  </div>

                  {/* Audit details — only for signed signers */}
                  {signed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <AuditCard icon={Clock} label="Timestamp">
                        <p className="text-xs font-medium text-white leading-relaxed">{fmt(signer.signedAt)}</p>
                      </AuditCard>

                      <AuditCard icon={Monitor} label="Device">
                        <p className="text-xs font-medium text-white">{signer.browser || '—'}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{signer.device || '—'}</p>
                      </AuditCard>

                      {signer.ipAddress && (
                        <AuditCard icon={Globe} label="IP Address">
                          <p className="text-xs font-mono font-medium text-white">{signer.ipAddress}</p>
                          {signer.location && (
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {[signer.location.city, signer.location.region, signer.location.countryCode]
                                .filter(Boolean).join(', ')}
                            </p>
                          )}
                        </AuditCard>
                      )}
                    </div>
                  )}

                  {/* Pending state */}
                  {!signed && (
                    <div className="rounded-xl px-4 py-3 text-xs"
                      style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: 'rgba(251,191,36,0.6)' }}>
                      Awaiting signature from this recipient.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── LEGAL FOOTER ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl px-6 py-5 text-xs leading-relaxed text-center"
          style={{
            background: 'rgba(99,102,241,0.06)',
            border:     '1px solid rgba(99,102,241,0.15)',
            color:      'rgba(165,180,252,0.45)',
          }}>
          This Certificate of Completion serves as legal proof that all parties have reviewed and signed the referenced
          document(s). All signatures are legally binding under the U.S. ESIGN Act (15 U.S.C. § 7001), UETA, and
          eIDAS Regulation (EU) No 910/2014. Timestamps, IP addresses, and device fingerprints are recorded and
          tamper-evident. Issued by <span style={{ color: 'rgba(165,180,252,0.7)' }}>DocMetrics</span>.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function MetaItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
        {label}
      </p>
      <div className="flex items-start gap-1.5">
        <Icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: 'rgba(165,180,252,0.55)' }} />
        <p className="text-xs font-medium text-white leading-relaxed">{value}</p>
      </div>
    </div>
  );
}

function AuditCard({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3 w-3" style={{ color: 'rgba(165,180,252,0.55)' }} />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {label}
        </p>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status, signed }: { status: string; signed: boolean }) {
  return (
    <div className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
      style={{
        background: signed ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)',
        color:      signed ? '#34d399'               : '#fbbf24',
        border:     `1px solid ${signed ? 'rgba(16,185,129,0.22)' : 'rgba(245,158,11,0.18)'}`,
      }}>
      {signed ? 'Signed' : status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
}