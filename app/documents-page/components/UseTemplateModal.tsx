//app/docments-page/components/useTemplateModal.tsx


'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, X, Loader2, FileText, CheckCircle2, ExternalLink } from 'lucide-react';

type Props = {
  templateId: string;
  templateName: string;
  open: boolean;
  onClose: () => void;
  onCreated: (doc: {
    _id: string;
    originalFilename: string;
    clientName: string;
    shareLink: { shareId: string; token: string; label: string; url: string };
  }) => void;
};

export default function UseTemplateDrawer({
  templateId,
  templateName,
  open,
  onClose,
  onCreated,
}: Props) {
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    _id: string;
    originalFilename: string;
    clientName: string;
    shareLink: { shareId: string; token: string; label: string; url: string };
  } | null>(null);

  const handleCreate = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter a client or company name');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${templateId}/use-template`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: clientName.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.document);
        onCreated(data.document);
      } else {
        toast.error(data.error || 'Failed to create from template');
      }
    } catch {
      toast.error('Failed to create from template');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!result?.shareLink.url) return;
    navigator.clipboard.writeText(result.shareLink.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    toast.success('Link copied to clipboard');
  };

  const handleClose = () => {
    setClientName('');
    setResult(null);
    setCopied(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.2s',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          boxShadow: '-4px 0 40px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          animation: 'slideIn 0.25s ease',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <FileText size={18} color="#fff" />
            </div>
            <div>
              <p style={{
                margin: 0, fontSize: 16, fontWeight: 700,
                color: '#111827', lineHeight: 1.3,
              }}>
                Use this template
              </p>
              <p style={{
                margin: '3px 0 0', fontSize: 12,
                color: '#9ca3af', lineHeight: 1.4,
              }}>
                {templateName.replace(' (Template)', '')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              border: 'none', background: '#f9fafb',
              borderRadius: 8, cursor: 'pointer',
              padding: 8, color: '#6b7280',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '28px 28px',
        }}>
          {!result ? (
            <>
              {/* Info card */}
              <div style={{
                padding: '16px 18px', borderRadius: 12,
                background: '#faf5ff',
                border: '1px solid #ede9fe',
                marginBottom: 28,
              }}>
                <p style={{
                  margin: '0 0 8px', fontSize: 13,
                  fontWeight: 600, color: '#6d28d9',
                }}>
                  How this works
                </p>
                {[
                  'A separate document is created for this client',
                  'Each client gets their own tracked share link',
                  'Analytics stay completely isolated per company',
                  'Edit the link settings anytime from the document page',
                ].map((point, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8,
                    marginTop: i > 0 ? 6 : 0,
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: '#7c3aed', flexShrink: 0,
                      marginTop: 6,
                    }} />
                    <p style={{
                      margin: 0, fontSize: 12,
                      color: '#6b7280', lineHeight: 1.6,
                    }}>
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: 13,
                  fontWeight: 600, color: '#374151',
                  marginBottom: 8,
                }}>
                  Client or company name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleCreate()}
                  placeholder="e.g. Acme Corp, TechCorp, Series A Deck"
                  autoFocus
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10, fontSize: 14,
                    color: '#111827', outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <p style={{
                  margin: '6px 0 0', fontSize: 11,
                  color: '#9ca3af', lineHeight: 1.5,
                }}>
                  This becomes the document name and share link label so you can identify it in your dashboard.
                </p>
              </div>

              {/* Create button */}
              <button
                onClick={handleCreate}
                disabled={loading || !clientName.trim()}
                style={{
                  width: '100%', padding: '13px',
                  background: clientName.trim() && !loading
                    ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                    : '#e9d5ff',
                  color: '#fff', border: 'none',
                  borderRadius: 10, fontSize: 14,
                  fontWeight: 600, cursor: clientName.trim() && !loading
                    ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating document…
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    Create document & get share link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success state */}
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
                padding: '8px 0 24px',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: '#f0fdf4',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 14,
                }}>
                  <CheckCircle2 size={28} color="#16a34a" />
                </div>
                <p style={{
                  margin: '0 0 6px', fontSize: 17,
                  fontWeight: 700, color: '#111827',
                }}>
                  Document created
                </p>
                <p style={{
                  margin: 0, fontSize: 13,
                  color: '#6b7280', lineHeight: 1.6,
                  maxWidth: 340,
                }}>
                  <strong>{result.clientName}</strong> now has their own
                  document with isolated analytics. Share the link below
                  or go to the document to customise it further.
                </p>
              </div>

              {/* Share link box */}
              <div style={{
                padding: '18px 20px', borderRadius: 12,
                background: '#f9fafb', border: '1px solid #e5e7eb',
                marginBottom: 16,
              }}>
                <p style={{
                  margin: '0 0 10px', fontSize: 12,
                  fontWeight: 700, color: '#374151',
                  textTransform: 'uppercase', letterSpacing: '.04em',
                }}>
                  Share link — ready to send
                </p>
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                }}>
                  <input
                    type="text"
                    value={result.shareLink.url}
                    readOnly
                    style={{
                      flex: 1, padding: '9px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8, fontSize: 12,
                      color: '#6b7280', background: '#fff',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleCopyLink}
                    style={{
                      padding: '9px 16px', borderRadius: 8,
                      border: 'none',
                      background: copied
                        ? 'linear-gradient(135deg, #16a34a, #15803d)'
                        : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                      color: '#fff', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      gap: 6, whiteSpace: 'nowrap',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Copy size={12} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Info note */}
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: '#fffbeb', border: '1px solid #fde68a',
                marginBottom: 24,
              }}>
                <p style={{
                  margin: 0, fontSize: 12,
                  color: '#92400e', lineHeight: 1.6,
                }}>
                  This link is active immediately with default settings — no email gate, no watermark, downloads allowed.
                  Open the document page to customise these settings before sending if needed.
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a  
                  href={`/documents/${result._id}`}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  Open document page
                </a>
                <button
                  onClick={() => {
                    setResult(null);
                    setClientName('');
                  }}
                  style={{
                    padding: '12px', borderRadius: 10,
                    border: '1.5px solid #e5e7eb',
                    background: '#fff', color: '#374151',
                    fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Create another client copy
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '12px', borderRadius: 10,
                    border: 'none', background: '#f9fafb',
                    color: '#6b7280', fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}