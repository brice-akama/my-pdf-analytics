// components/SignatureStyleModal.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Pen, Type, Upload, Check, Trash2, Star } from 'lucide-react';
import {
  SIGNATURE_FONTS,
  SIGNATURE_COLORS,
  validateSignatureFile,
  convertFileToBase64
} from '@/lib/signatureConfig';

interface SavedSignature {
  _id: string;
  type: 'draw' | 'type' | 'upload';
  data: string;
  font?: string;
  color?: string;
  name: string;
  isDefault: boolean;
  usageCount: number;
}

interface SignatureStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: {
    type: 'draw' | 'type' | 'upload';
    data: string;
    font?: string;
    color?: string;
  }) => void;
  recipientName?: string;
}

export const SignatureStyleModal: React.FC<SignatureStyleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  recipientName = 'Your Name'
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload' | 'saved'>('saved');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [typedText, setTypedText] = useState(recipientName);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  const [selectedColor, setSelectedColor] = useState(SIGNATURE_COLORS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const [visible, setVisible] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      fetchSavedSignatures();
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const fetchSavedSignatures = async () => {
    try {
      const res = await fetch('/api/signature-styles');
      const data = await res.json();
      if (data.success) {
        setSavedSignatures(data.signatures);
        setActiveTab(data.signatures.length > 0 ? 'saved' : 'draw');
      }
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
    }
  };

  // ─── Canvas helpers ───────────────────────────────────────────
  const getCanvasPoint = (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const applyStrokeStyle = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = selectedColor.hex;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  // ─── Mouse drawing ────────────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(canvas, e.clientX, e.clientY);
    applyStrokeStyle(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
    lastTouchRef.current = null;
  };

  // ─── Touch drawing ────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasPoint(canvas, touch.clientX, touch.clientY);
    ctx.beginPath();
    ctx.moveTo(x, y);
    lastTouchRef.current = { x, y };
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const touch = e.touches[0];
    const { x, y } = getCanvasPoint(canvas, touch.clientX, touch.clientY);
    applyStrokeStyle(ctx);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastTouchRef.current = { x, y };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawing && canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
    lastTouchRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData('');
      }
    }
  };

  // ─── File upload ──────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateSignatureFile(file);
    if (!validation.valid) { alert(validation.error); return; }
    try {
      const base64 = await convertFileToBase64(file);
      setUploadedImage(base64);
    } catch {
      alert('Failed to upload image. Please try again.');
    }
  };

  // ─── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    let finalData = '';
    let finalType: 'draw' | 'type' | 'upload' = 'draw';
    let finalFont: string | undefined;
    const finalColor = selectedColor.hex;

    if (activeTab === 'draw') {
      if (!signatureData) { alert('Please draw your signature first'); return; }
      finalData = signatureData;
      finalType = 'draw';
    } else if (activeTab === 'type') {
      if (!typedText.trim()) { alert('Please enter your name'); return; }
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = selectedColor.hex;
        ctx.font = `60px ${selectedFont.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
        finalData = canvas.toDataURL('image/png');
        finalType = 'type';
        finalFont = selectedFont.id;
      }
    } else if (activeTab === 'upload') {
      if (!uploadedImage) { alert('Please upload an image'); return; }
      finalData = uploadedImage;
      finalType = 'upload';
    }

    if (saveForFuture) {
      setLoading(true);
      try {
        await fetch('/api/signature-styles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: finalType,
            data: finalData,
            font: finalFont,
            color: finalColor,
            setAsDefault: savedSignatures.length === 0,
          }),
        });
      } catch (err) {
        console.error('Failed to save signature:', err);
      } finally {
        setLoading(false);
      }
    }

    onSave({ type: finalType, data: finalData, font: finalFont, color: finalColor });
  };

  const useSavedSignature = async (signature: SavedSignature) => {
    await fetch('/api/signature-styles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signatureId: signature._id, action: 'updateUsage' }),
    });
    onSave({ type: signature.type, data: signature.data, font: signature.font, color: signature.color });
  };

  const deleteSavedSignature = async (signatureId: string) => {
    if (!confirm('Are you sure you want to delete this signature?')) return;
    try {
      const res = await fetch(`/api/signature-styles?id=${signatureId}`, { method: 'DELETE' });
      if (res.ok) fetchSavedSignatures();
    } catch (err) {
      console.error('Failed to delete signature:', err);
    }
  };

  if (!isOpen && !visible) return null;

  const tabs = [
    ...(savedSignatures.length > 0
      ? [{ id: 'saved' as const, label: `Saved (${savedSignatures.length})`, icon: <Star className="h-3.5 w-3.5" /> }]
      : []),
    { id: 'draw' as const, label: 'Draw', icon: <Pen className="h-3.5 w-3.5" /> },
    { id: 'type' as const, label: 'Type', icon: <Type className="h-3.5 w-3.5" /> },
    { id: 'upload' as const, label: 'Upload', icon: <Upload className="h-3.5 w-3.5" /> },
  ];

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Allura&display=swap"
        rel="stylesheet"
      />

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      />

      {/* Bottom Drawer */}
      <div
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          zIndex: 9999,
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 20px 12px', borderBottom: '1px solid #f1f5f9', flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Add Your Signature</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>Choose how you'd like to sign</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: '#f1f5f9', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X style={{ width: 16, height: 16, color: '#64748b' }} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 6, padding: '10px 16px',
          overflowX: 'auto', flexShrink: 0,
          // hide scrollbar
          msOverflowStyle: 'none' as any,
          scrollbarWidth: 'none' as any,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, border: 'none',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.2s',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #7c3aed, #3b82f6)'
                  : '#f1f5f9',
                color: activeTab === tab.id ? '#fff' : '#475569',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 0' }}>

          {/* ── SAVED ── */}
          {activeTab === 'saved' && (
            <div style={{ paddingBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Tap a signature to use it</p>
              {savedSignatures.map((sig) => (
                <div
                  key={sig._id}
                  onClick={() => useSavedSignature(sig)}
                  style={{
                    border: '2px solid #e2e8f0', borderRadius: 12,
                    padding: 12, marginBottom: 10,
                    position: 'relative', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{sig.name}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {sig.isDefault && (
                        <span style={{
                          fontSize: 11, background: '#fef9c3', color: '#854d0e',
                          padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                        }}>Default</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSavedSignature(sig._id); }}
                        style={{
                          width: 30, height: 30, borderRadius: 8, border: 'none',
                          background: '#fee2e2', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 style={{ width: 14, height: 14, color: '#dc2626' }} />
                      </button>
                    </div>
                  </div>
                  <div style={{
                    background: '#f8fafc', borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', height: 72,
                  }}>
                    <img src={sig.data} alt={sig.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: '6px 0 0' }}>Used {sig.usageCount} times</p>
                </div>
              ))}
            </div>
          )}

          {/* ── DRAW ── */}
          {activeTab === 'draw' && (
            <div style={{ paddingBottom: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Ink Color</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      title={color.name}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: color.hex, border: 'none', cursor: 'pointer',
                        boxShadow: selectedColor.id === color.id
                          ? `0 0 0 2px #fff, 0 0 0 4px ${color.hex}`
                          : '0 1px 4px rgba(0,0,0,0.15)',
                        transition: 'box-shadow 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{
                border: '2px dashed #cbd5e1', borderRadius: 12,
                background: '#fff', overflow: 'hidden', marginBottom: 10,
              }}>
                <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '6px 0 2px', margin: 0 }}>
                  Sign in the box below
                </p>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ width: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
                />
              </div>

              <button
                onClick={clearCanvas}
                style={{
                  width: '100%', padding: '10px', border: '1px solid #e2e8f0',
                  borderRadius: 10, background: '#fff', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, color: '#64748b',
                }}
              >
                Clear & Redraw
              </button>
            </div>
          )}

          {/* ── TYPE ── */}
          {activeTab === 'type' && (
            <div style={{ paddingBottom: 8 }}>
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Name</p>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 10,
                    border: '2px solid #e2e8f0', fontSize: 15, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Font Style</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font)}
                      style={{
                        padding: '10px 8px', borderRadius: 10,
                        border: `2px solid ${selectedFont.id === font.id ? '#7c3aed' : '#e2e8f0'}`,
                        background: selectedFont.id === font.id ? '#f5f3ff' : '#fff',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>{font.name}</p>
                      <p style={{ fontFamily: font.fontFamily, color: selectedColor.hex, fontSize: 22, margin: 0 }}>
                        {typedText || font.preview}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Color</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: color.hex, border: 'none', cursor: 'pointer',
                        boxShadow: selectedColor.id === color.id
                          ? `0 0 0 2px #fff, 0 0 0 4px ${color.hex}`
                          : '0 1px 4px rgba(0,0,0,0.15)',
                        transition: 'box-shadow 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{
                border: '1px solid #e2e8f0', borderRadius: 10,
                background: '#f8fafc', display: 'flex',
                alignItems: 'center', justifyContent: 'center', height: 80,
              }}>
                <p style={{ fontFamily: selectedFont.fontFamily, color: selectedColor.hex, fontSize: 42, margin: 0 }}>
                  {typedText || 'Preview'}
                </p>
              </div>
            </div>
          )}

          {/* ── UPLOAD ── */}
          {activeTab === 'upload' && (
            <div style={{ paddingBottom: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              {!uploadedImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%', border: '2px dashed #cbd5e1', borderRadius: 12,
                    padding: '40px 20px', background: '#fff', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Upload style={{ width: 24, height: 24, color: '#7c3aed' }} />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 }}>Tap to upload signature</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>PNG or JPG, max 5MB</p>
                </button>
              ) : (
                <div>
                  <div style={{
                    border: '1px solid #e2e8f0', borderRadius: 12, padding: 16,
                    background: '#f8fafc', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 10, height: 100,
                  }}>
                    <img src={uploadedImage} alt="Uploaded" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                  <button
                    onClick={() => { setUploadedImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    style={{
                      width: '100%', padding: '10px', border: '1px solid #e2e8f0',
                      borderRadius: 10, background: '#fff', cursor: 'pointer',
                      fontSize: 14, fontWeight: 500, color: '#64748b',
                    }}
                  >
                    Remove & Upload Different
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STICKY FOOTER (shown on all non-saved tabs) ── */}
        {activeTab !== 'saved' && (
          <div style={{
            flexShrink: 0,
            borderTop: '1px solid #f1f5f9',
            background: '#fff',
            padding: '12px 16px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveForFuture}
                onChange={(e) => setSaveForFuture(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: '#475569' }}>Save this signature for future use</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  border: '1px solid #e2e8f0', background: '#fff',
                  cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 2, padding: '13px', borderRadius: 12, border: 'none',
                  background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? 'Saving...' : (
                  <>
                    <Check style={{ width: 18, height: 18 }} />
                    Apply Signature
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};