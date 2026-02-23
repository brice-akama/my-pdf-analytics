"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Check, AlertCircle, Loader2, ChevronRight,
  Download, CheckCircle, Clock, Eye, X, Mail,
  ChevronLeft, Package,
} from 'lucide-react';
import { SignatureStyleModal } from '@/components/SignatureStyleModal';
import { toast, Toaster } from 'sonner';

interface EnvelopeDocument {
  documentId: string;
  filename: string;
  order: number;
  numPages: number;
  cloudinaryPdfUrl: string;
}

interface SignatureField {
  id: string;
  documentId: string;
  page: number;
  type: 'signature' | 'date' | 'text' | 'checkbox' | 'attachment';
  x: number;
  y: number;
  width?: number;
  height?: number;
  label?: string;
  recipientIndex?: number;
}

interface SignedDocument {
  documentId: string;
  filename: string;
  signedFields: any[];
  signedAt: string;
}

export default function EnvelopeSigningPage() {
  const params = useParams();
  const router = useRouter();
  const uniqueId = params.uniqueId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [envelope, setEnvelope] = useState<any>(null);
  const [documents, setDocuments] = useState<EnvelopeDocument[]>([]);
  const [allSignatureFields, setAllSignatureFields] = useState<SignatureField[]>([]);

  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [signatures, setSignatures] = useState<Record<string, any>>({});
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [activeTextField, setActiveTextField] = useState<SignatureField | null>(null);
  const [textFieldInput, setTextFieldInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Navbar popovers
  const [showMessagePopover, setShowMessagePopover] = useState(false);
  const [showHelpPopover, setShowHelpPopover] = useState(false);
  const [messageToSender, setMessageToSender] = useState('');
  const [messageSentToSender, setMessageSentToSender] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [documentOwnerEmail, setDocumentOwnerEmail] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
const [isDrawing, setIsDrawing] = useState(false);
const [signatureTab, setSignatureTab] = useState<'draw' | 'type'>('draw');
const [typedSignature, setTypedSignature] = useState('');

  // Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    fetchEnvelope();
  }, [uniqueId]);

  const fetchEnvelope = async () => {
    try {
      const res = await fetch(`/api/envelope/${uniqueId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load envelope');
      }

      setEnvelope(data.envelope);
      setDocuments(data.envelope.documents);
      setAllSignatureFields(data.envelope.signatureFields);
       // Fetch real owner email same way normal sign page does
const ownerRes = await fetch(`/api/envelope/${uniqueId}/owner-info`);
if (ownerRes.ok) {
  const ownerData = await ownerRes.json();
  setDocumentOwnerEmail(ownerData.email || null);
}

      const urls: Record<string, string> = {};
      for (const doc of data.envelope.documents) {
        const pdfRes = await fetch(`/api/envelope/${uniqueId}/file?documentId=${doc.documentId}`);
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          urls[doc.documentId] = URL.createObjectURL(blob);
        }
      }
      setPdfUrls(urls);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load envelope');
      setLoading(false);
    }
  };

  const currentDocument = documents[currentDocIndex];
  const currentDocFields = allSignatureFields.filter(
    f => f.documentId === currentDocument?.documentId
  );
  const allCurrentDocFieldsFilled = currentDocFields.every(f => signatures[f.id]);

  // Overall progress across all docs
  const totalFields = allSignatureFields.length;
  const filledFields = allSignatureFields.filter(f => signatures[f.id]).length;

  const handleNextDocument = () => {
  if (currentDocIndex < documents.length - 1) {
    // Save current doc's signed fields as we move forward
    if (allCurrentDocFieldsFilled) {
      const signedFields = currentDocFields.map(field => ({
        id: field.id,
        type: field.type,
        signatureData: field.type === 'signature' ? signatures[field.id]?.data : null,
        dateValue: field.type === 'date' ? signatures[field.id]?.data : null,
        textValue: ['text', 'checkbox'].includes(field.type) ? signatures[field.id]?.data : null,
        timestamp: new Date().toISOString(),
      }));
      setSignedDocuments(prev => {
        const exists = prev.find(d => d.documentId === currentDocument.documentId);
        if (exists) return prev; // don't duplicate
        return [...prev, {
          documentId: currentDocument.documentId,
          filename: currentDocument.filename,
          signedFields,
          signedAt: new Date().toISOString(),
        }];
      });
    }
    setCurrentDocIndex(prev => prev + 1);
    return;
  }

  // Last doc — enforce ALL docs are fully signed before submitting
  const allDocsSigned = documents.every(doc => {
    const docFields = allSignatureFields.filter(f => f.documentId === doc.documentId);
    return docFields.every(f => signatures[f.id]);
  });

  if (!allDocsSigned) {
    const unsignedDocs = documents.filter(doc => {
      const docFields = allSignatureFields.filter(f => f.documentId === doc.documentId);
      return !docFields.every(f => signatures[f.id]);
    });
    toast.error(`Please complete all fields in: ${unsignedDocs.map(d => d.filename).join(', ')}`);
    return;
  }

  // All signed — submit
  const lastDocFields = currentDocFields.map(field => ({
    id: field.id,
    type: field.type,
    signatureData: field.type === 'signature' ? signatures[field.id]?.data : null,
    dateValue: field.type === 'date' ? signatures[field.id]?.data : null,
    textValue: ['text', 'checkbox'].includes(field.type) ? signatures[field.id]?.data : null,
    timestamp: new Date().toISOString(),
  }));
  handleSubmitEnvelope(lastDocFields);
};
    

  const handleSubmitEnvelope = async (lastDocFields: any[]) => {
    setSubmitting(true);
    try {
      const allSignedDocs = [
        ...signedDocuments,
        {
          documentId: currentDocument.documentId,
          filename: currentDocument.filename,
          signedFields: lastDocFields,
          signedAt: new Date().toISOString(),
        }
      ];
      const res = await fetch(`/api/envelope/${uniqueId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedDocuments: allSignedDocs }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to submit');
      setCompleted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit envelope');
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f1117' }}>
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)', opacity: 0.3 }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Loading envelope...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (error || !envelope) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
        <div className="rounded-2xl p-8 max-w-md w-full text-center" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Invalid Envelope</h2>
          <p className="text-slate-400 text-sm">{error || 'Envelope not found'}</p>
        </div>
      </div>
    );
  }

  // ── COMPLETED ──
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0f1117' }}>
        <div className="rounded-2xl p-8 max-w-2xl w-full" style={{ background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-center mb-8">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Envelope Signed!</h2>
            <p className="text-slate-400 text-sm">
              You've completed all {documents.length} document{documents.length !== 1 ? 's' : ''} in this signing package
            </p>
          </div>

          {/* Signed docs list */}
          <div className="rounded-xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="px-5 py-3 border-b border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed Documents</p>
            </div>
            {signedDocuments.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 last:border-0">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Signed at {new Date(doc.signedAt).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Download */}
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = `/api/envelope/${uniqueId}/download`;
              a.download = 'envelope_signed_package.pdf';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mb-3 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <Download className="h-4 w-4" />
            Download Complete Signed Package
          </button>
          <p className="text-xs text-slate-500 text-center mb-6">Contains all {documents.length} signed documents + audit trail</p>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors border border-white/10 hover:border-white/20"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN ──
  return (
    <div className="min-h-screen" style={{ background: '#0f1117' }}>
      <Toaster position="top-center" richColors />

      {/* ── NAVBAR ── */}
      <div className="sticky top-0 z-40" style={{ background: '#1a1f2e', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-3">

          {/* Left: Branding */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#3b82f6)' }}>
              <Package className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-white text-sm">DocMetrics</span>
              <span className="text-white/20 mx-2">·</span>
              <span className="text-xs text-slate-400">Signing Package</span>
            </div>
          </div>

          {/* Center: Doc progress pills */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            {documents.map((doc, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div
                onClick={() => setCurrentDocIndex(idx)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: idx < currentDocIndex
                      ? 'rgba(16,185,129,0.15)'
                      : idx === currentDocIndex
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${idx < currentDocIndex ? 'rgba(16,185,129,0.3)' : idx === currentDocIndex ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: idx < currentDocIndex ? '#34d399' : idx === currentDocIndex ? '#a5b4fc' : '#64748b',
                     cursor: 'pointer',
                  }}
                >
                  {idx < currentDocIndex ? <Check className="h-3 w-3" /> : <span>{idx + 1}</span>}
                  <span className="max-w-[100px] truncate hidden lg:inline">{doc.filename}</span>
                </div>
                {idx < documents.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-white/20 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Right: field counter + tools */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <span className="text-xs font-medium px-3 py-1.5 rounded-full tabular-nums"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
              {Object.keys(signatures).filter(id => currentDocFields.some(f => f.id === id)).length}
              <span className="text-white/25 mx-1">/</span>
              <span>{currentDocFields.length} fields</span>
            </span>

            {/* Message icon */}
            <div className="relative">
              <button
                onClick={() => { setShowMessagePopover(v => !v); setShowHelpPopover(false); }}
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-all group"
                style={{ background: showMessagePopover ? 'rgba(99,102,241,0.2)' : 'transparent' }}
              >
                <Mail className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
              </button>

              {showMessagePopover && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMessagePopover(false)} />
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-xl shadow-2xl overflow-hidden"
                    style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                          {documentOwnerEmail ? documentOwnerEmail[0].toUpperCase() : '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white break-all">{documentOwnerEmail || 'Document Sender'}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Envelope sender</p>
                          {documentOwnerEmail && (
                            <a
                              href={`mailto:${documentOwnerEmail}`}
                              className="text-xs underline mt-0.5 inline-block"
                              style={{ color: '#a5b4fc' }}
                            >
                              {documentOwnerEmail}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold text-white mb-3">Send a message</p>
                      {messageSentToSender ? (
                        <div className="flex flex-col items-center justify-center py-4 gap-2">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.2)' }}>
                            <Check className="h-5 w-5 text-emerald-400" />
                          </div>
                          <p className="text-sm font-semibold text-white">Message sent!</p>
                          <button onClick={() => { setMessageSentToSender(false); setMessageToSender(''); }}
                            className="mt-1 text-xs underline" style={{ color: 'rgba(165,180,252,0.7)' }}>
                            Send another
                          </button>
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={messageToSender}
                            onChange={e => setMessageToSender(e.target.value)}
                            placeholder="Type your message to the envelope sender..."
                            className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none text-white"
                            rows={3}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              From: <span style={{ color: '#a5b4fc' }}>{envelope?.recipient?.email}</span>
                            </p>
                            <button
                              disabled={!messageToSender.trim() || isSendingMessage}
                              onClick={async () => {
                                if (!messageToSender.trim()) return;
                                setIsSendingMessage(true);
                                try {
                                  const res = await fetch(`/api/envelope/${uniqueId}/message`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      message: messageToSender.trim(),
                                      senderEmail: envelope?.recipient?.email,
                                    }),
                                  });
                                  if (res.ok) {
                                    setMessageSentToSender(true);
                                    toast.success('Message sent!');
                                  } else {
                                    toast.error('Failed to send message');
                                  }
                                } catch {
                                  toast.error('Network error — please try again');
                                } finally {
                                  setIsSendingMessage(false);
                                }
                              }}
                              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                            >
                              {isSendingMessage ? 'Sending...' : 'Send'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help icon */}
            <div className="relative">
              <button
                onClick={() => { setShowHelpPopover(v => !v); setShowMessagePopover(false); }}
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-all group"
                style={{ background: showHelpPopover ? 'rgba(99,102,241,0.2)' : 'transparent' }}
              >
                <AlertCircle className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
              </button>

              {showHelpPopover && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowHelpPopover(false)} />
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-xl shadow-2xl p-5"
                    style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        <Package className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">DocMetrics</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Envelope Signing</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Sign all documents in this envelope sequentially. Each document is encrypted and your signature is legally binding.
                    </p>
                    <div className="space-y-2 mb-4">
                      {[
                        { icon: '🔒', text: 'End-to-end encrypted' },
                        { icon: '⚖️', text: 'Legally binding signature' },
                        { icon: '📋', text: 'Full audit trail' },
                        { icon: '📦', text: `${documents.length} documents in this package` },
                      ].map(b => (
                        <div key={b.text} className="flex items-center gap-2">
                          <span className="text-sm">{b.icon}</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{b.text}</span>
                        </div>
                      ))}
                    </div>
                    <span
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer transition-all"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                      onClick={() => { setShowHelpPopover(false); window.open('/about', '_blank'); }}
                    >
                      Learn more about DocMetrics →
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-0.5 w-full bg-white/5">
          <div className="h-full transition-all duration-500"
            style={{
              width: `${totalFields > 0 ? (filledFields / totalFields) * 100 : 0}%`,
              background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
            }} />
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── SIDEBAR ── */}
        <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden border-r border-white/5" style={{ background: '#13181f' }}>

          {/* Signing as */}
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-xs text-slate-500 mb-1.5">Signing as</p>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {envelope?.recipient?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{envelope?.recipient?.name}</p>
                <p className="text-xs text-slate-500 truncate">{envelope?.recipient?.email}</p>
              </div>
            </div>
          </div>

          {/* Document list */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documents</p>
            <div className="space-y-1.5">
              {documents.map((doc, idx) => {
                const docFields = allSignatureFields.filter(f => f.documentId === doc.documentId);
                const docFilled = docFields.filter(f => signatures[f.id]).length;
                const isCurrentDoc = idx === currentDocIndex;
                const isDone = idx < currentDocIndex;

                return (
                  <div
  key={doc.documentId}
  onClick={() => setCurrentDocIndex(idx)}
  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
  style={{
    background: isCurrentDoc ? 'rgba(99,102,241,0.12)' : isDone ? 'rgba(16,185,129,0.08)' : 'transparent',
    border: `1px solid ${isCurrentDoc ? 'rgba(99,102,241,0.3)' : isDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)'}`,
    cursor: isCurrentDoc ? 'default' : 'pointer',
  }}
>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isDone ? 'rgba(16,185,129,0.2)' : isCurrentDoc ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                      }}>
                      {isDone
                        ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                        : isCurrentDoc
                        ? <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        : <Eye className="h-3.5 w-3.5 text-slate-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCurrentDoc ? 'text-indigo-300' : isDone ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {doc.filename}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {isDone ? 'Completed' : isCurrentDoc ? `${docFilled}/${docFields.length} fields` : 'Pending'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fields for current doc */}
          <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Fields — Doc {currentDocIndex + 1}
            </p>
            <div className="space-y-1.5">
              {currentDocFields.map(field => {
                const filled = !!signatures[field.id];
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{
                      background: filled ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.06)',
                      border: `1px solid ${filled ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`,
                    }}
                  >
                    <div className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: filled ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)' }}>
                      {filled
                        ? <Check className="h-3 w-3 text-emerald-400" />
                        : <span className="text-xs">✍️</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${filled ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {field.type === 'signature' ? 'Signature' :
                         field.type === 'date' ? 'Date' :
                         field.type === 'text' ? 'Text Field' :
                         field.type === 'checkbox' ? 'Checkbox' : 'Field'}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Page {field.page}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terms + Action */}
          <div className="p-4 border-t border-white/5 space-y-3">
            {/* Terms agreement */}
            <div className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0"
                />
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {'I agree to use electronic records and signatures and to DocMetrics\' '}
                  <span className="underline font-medium cursor-pointer" style={{ color: '#a5b4fc' }}
                    onClick={e => { e.preventDefault(); e.stopPropagation(); window.open('/terms', '_blank'); }}>
                    Terms
                  </span>
                  {'. My signature is legally binding.'}
                </p>
              </label>
            </div>

            {/* Next / Complete button */}
            <button
  onClick={handleNextDocument}
  disabled={submitting || (currentDocIndex === documents.length - 1 && !agreedToTerms)}
  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
  style={{
    background: !submitting && (currentDocIndex < documents.length - 1 || (allCurrentDocFieldsFilled && agreedToTerms))
      ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
      : 'rgba(255,255,255,0.05)',
    color: !submitting && (currentDocIndex < documents.length - 1 || (allCurrentDocFieldsFilled && agreedToTerms))
      ? 'white' : '#4b5563',
    cursor: !submitting && (currentDocIndex < documents.length - 1 || (allCurrentDocFieldsFilled && agreedToTerms))
      ? 'pointer' : 'not-allowed',
  }}
>
               {submitting ? (
  <><Loader2 className="h-4 w-4 animate-spin" />Submitting...</>
) : currentDocIndex === documents.length - 1 ? (
  <><Check className="h-4 w-4" />Complete Signing</>
) : (
  <>Next Document <ChevronRight className="h-4 w-4" /></>
)}
            </button>

            {/* Missing fields hint */}
             {(() => {
  const totalUnsigned = allSignatureFields.filter(f => !signatures[f.id]).length;
  if (totalUnsigned === 0) return null;
  return (
    <p className="text-xs text-center text-amber-500/70">
      {totalUnsigned} field{totalUnsigned !== 1 ? 's' : ''} remaining across all documents
    </p>
  );
})()}

            {/* Remaining docs */}
            {currentDocIndex < documents.length - 1 && (
              <p className="text-xs text-center text-slate-600">
                {documents.length - currentDocIndex - 1} more document{documents.length - currentDocIndex - 1 !== 1 ? 's' : ''} after this
              </p>
            )}
          </div>
        </div>

        {/* ── PDF CANVAS ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' as any }}>
          <style>{`
            .pdf-scroll::-webkit-scrollbar { display: none; }
          `}</style>

          {/* Doc header strip */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
            style={{ background: 'rgba(15,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => currentDocIndex > 0 && setCurrentDocIndex(i => i - 1)}
                disabled={currentDocIndex === 0}
                className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <ChevronLeft className="h-3.5 w-3.5 text-white" />
              </button>
              <div>
                <p className="text-sm font-semibold text-white">{currentDocument?.filename}</p>
                <p className="text-xs text-slate-500">
                  Document {currentDocIndex + 1} of {documents.length} · {currentDocument?.numPages} page{currentDocument?.numPages !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                {Object.keys(signatures).filter(id => currentDocFields.some(f => f.id === id)).length}/{currentDocFields.length} done
              </span>
            </div>
          </div>

          <div className="p-6 pdf-scroll">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-xl shadow-2xl overflow-hidden relative" style={{ background: '#fff' }}>
                <div
                  className="relative"
                  style={{ minHeight: `${297 * (currentDocument?.numPages || 1) * 3.78}px` }}
                >
                  {pdfUrls[currentDocument?.documentId] ? (
                    <>
                      <embed
                        src={`${pdfUrls[currentDocument.documentId]}#toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        className="w-full border-0"
                        style={{
                          height: `${297 * (currentDocument?.numPages || 1) * 3.78}px`,
                          display: 'block',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Field overlays */}
                      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                        {currentDocFields.map(field => {
                          const isFilled = !!signatures[field.id];
                          const pageHeight = 297 * 3.78;
                          const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);

                          return (
                            <div
                              key={field.id}
                              className={`absolute rounded-lg transition-all ${
                                isFilled
                                  ? 'bg-transparent border-0'
                                  : 'border-2 border-amber-400 hover:border-indigo-500'
                              }`}
                              style={{
                                left: `${field.x}%`,
                                top: `${topPosition}px`,
                                width: field.width ? `${field.width}px` :
                                  field.type === 'signature' ? '200px' :
                                  field.type === 'checkbox' ? '30px' : '150px',
                                height: field.height ? `${field.height}px` :
                                  field.type === 'signature' ? '60px' :
                                  field.type === 'checkbox' ? '30px' : '40px',
                                transform: 'translate(-50%, 0%)',
                                background: isFilled ? 'transparent' : 'rgba(251,191,36,0.08)',
                                zIndex: 10,
                                pointerEvents: 'auto',
                                cursor: !isFilled ? 'pointer' : 'default',
                                animation: !isFilled ? 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' : 'none',
                              }}
                              onClick={() => {
                                if (isFilled) return;
                                if (field.type === 'signature') {
                                  setActiveField(field);
                                } else if (field.type === 'text') {
                                  setActiveTextField(field);
                                  setTextFieldInput('');
                                } else if (field.type === 'checkbox') {
                                  const current = signatures[field.id];
                                  setSignatures(prev => ({
                                    ...prev,
                                    [field.id]: { type: 'checkbox', data: current ? 'false' : 'true', timestamp: new Date().toISOString() }
                                  }));
                                } else if (field.type === 'date') {
                                  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  setSignatures(prev => ({
                                    ...prev,
                                    [field.id]: { type: 'date', data: currentDate, timestamp: new Date().toISOString() }
                                  }));
                                }
                              }}
                            >
                              {isFilled ? (
                                <div className="h-full flex items-center justify-center">
                                  {field.type === 'signature' && (
                                    <img src={signatures[field.id].data} alt="Signature"
                                      className="max-h-full max-w-full object-contain" />
                                  )}
                                  {field.type === 'date' && (
                                    <span className="text-sm font-medium text-slate-800 px-2">{signatures[field.id].data}</span>
                                  )}
                                  {field.type === 'text' && (
                                    <span className="text-sm text-slate-800 px-2">{signatures[field.id].data}</span>
                                  )}
                                  {field.type === 'checkbox' && (
                                    <Check className="h-5 w-5 text-indigo-600" />
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center select-none">
                                  <p className="text-xs font-semibold text-amber-700">
                                    {field.type === 'signature' ? '✍️ Click to Sign'
                                      : field.type === 'date' ? '📅 Click to Fill'
                                      : field.type === 'checkbox' ? '☑️ Check'
                                      : '📝 Click to Fill'}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                    {envelope?.recipient?.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Loading document...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INLINE SIGNATURE MODAL ── */}
      {activeField !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveField(null); }}
        >
          <div style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>Sign Document</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>Signing as {envelope?.recipient?.name}</p>
              </div>
              <button
                onClick={() => setActiveField(null)}
                style={{ height: '32px', width: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
              >×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '12px 24px 0', gap: '4px' }}>
              {(['draw', 'type'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setSignatureTab(tab)}
                  style={{
                    padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: signatureTab === tab ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: signatureTab === tab ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                  }}
                >{tab === 'draw' ? '✍️ Draw' : '⌨️ Type'}</button>
              ))}
            </div>

            {/* Body */}
            <div style={{ padding: '16px 24px' }}>
              {signatureTab === 'draw' ? (
                <>
                  <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                    <canvas
                      ref={canvasRef}
                      width={468}
                      height={160}
                      style={{ display: 'block', width: '100%', cursor: 'crosshair', touchAction: 'none' }}
                      onMouseDown={(e) => {
                        const canvas = canvasRef.current; if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const ctx = canvas.getContext('2d')!;
                        ctx.beginPath();
                        ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                        setIsDrawing(true);
                      }}
                      onMouseMove={(e) => {
                        if (!isDrawing) return;
                        const canvas = canvasRef.current; if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const ctx = canvas.getContext('2d')!;
                        ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
                        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                        ctx.stroke();
                      }}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseLeave={() => setIsDrawing(false)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        const canvas = canvasRef.current; if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const touch = e.touches[0];
                        const ctx = canvas.getContext('2d')!;
                        ctx.beginPath();
                        ctx.moveTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                        setIsDrawing(true);
                      }}
                      onTouchMove={(e) => {
                        e.preventDefault();
                        if (!isDrawing) return;
                        const canvas = canvasRef.current; if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const scaleX = canvas.width / rect.width;
                        const scaleY = canvas.height / rect.height;
                        const touch = e.touches[0];
                        const ctx = canvas.getContext('2d')!;
                        ctx.lineTo((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
                        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                        ctx.stroke();
                      }}
                      onTouchEnd={() => setIsDrawing(false)}
                    />
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', borderTop: '1px solid #cbd5e1', width: '60%', paddingTop: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sign above</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const canvas = canvasRef.current; if (!canvas) return;
                      canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
                    }}
                    style={{ marginTop: '8px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer', padding: '4px 0' }}
                  >Clear</button>
                </>
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={e => setTypedSignature(e.target.value)}
                    placeholder="Type your full name..."
                    autoFocus
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                  {typedSignature && (
                    <div style={{ marginTop: '12px', background: 'white', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '32px', color: '#1e293b', fontStyle: 'italic' }}>{typedSignature}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '0 24px 20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveField(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => {
                  let sigData = '';
                  if (signatureTab === 'draw') {
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    // Check if anything was drawn
                    const ctx = canvas.getContext('2d')!;
                    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    const hasDrawing = pixels.some((p, i) => i % 4 === 3 && p > 0);
                    if (!hasDrawing) { toast.error('Please draw your signature first'); return; }
                    sigData = canvas.toDataURL('image/png');
                  } else {
                    if (!typedSignature.trim()) { toast.error('Please type your signature'); return; }
                    // Render typed sig to canvas
                    const offscreen = document.createElement('canvas');
                    offscreen.width = 468; offscreen.height = 160;
                    const ctx = offscreen.getContext('2d')!;
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, 468, 160);
                    ctx.font = 'italic 48px Georgia, serif';
                    ctx.fillStyle = '#1e293b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(typedSignature, 234, 80);
                    sigData = offscreen.toDataURL('image/png');
                  }

                  if (!activeField) return;
                  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const updated: Record<string, any> = {
                    ...signatures,
                    [activeField.id]: { type: 'signature', data: sigData, timestamp: new Date().toISOString() },
                  };
                  currentDocFields.filter(f => f.type === 'date').forEach(df => {
                    updated[df.id] = { type: 'date', data: currentDate, timestamp: new Date().toISOString() };
                  });
                  setSignatures(updated);
                  // Reset modal state
                  setActiveField(null);
                  setTypedSignature('');
                  if (canvasRef.current) canvasRef.current.getContext('2d')!.clearRect(0, 0, 468, 160);
                  toast.success('Signature applied!');
                }}
                style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >Apply Signature</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEXT INPUT MODAL ── */}
      {activeTextField && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 className="text-base font-semibold text-white">Enter Text</h3>
                <p className="text-xs text-slate-400 mt-0.5">Type your response below</p>
              </div>
              <button onClick={() => { setActiveTextField(null); setTextFieldInput(''); }}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={textFieldInput}
                onChange={e => setTextFieldInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && textFieldInput.trim()) {
                    setSignatures(prev => ({ ...prev, [activeTextField.id]: { type: 'text', data: textFieldInput.trim(), timestamp: new Date().toISOString() } }));
                    setActiveTextField(null);
                    setTextFieldInput('');
                  }
                }}
                placeholder="Enter text here..."
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setActiveTextField(null); setTextFieldInput(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (textFieldInput.trim()) {
                      setSignatures(prev => ({ ...prev, [activeTextField.id]: { type: 'text', data: textFieldInput.trim(), timestamp: new Date().toISOString() } }));
                      setActiveTextField(null);
                      setTextFieldInput('');
                    }
                  }}
                  disabled={!textFieldInput.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}