// components/SignatureStyleModal.tsx
"use client";
import React, { useState, useRef, useEffect } from 'react';
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
  // ⭐ Debug logging
  useEffect(() => {
    console.log('🎨 SignatureStyleModal render:', { isOpen, recipientName });
  }, [isOpen, recipientName]);

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch saved signatures on mount
  useEffect(() => {
    if (isOpen) {
      fetchSavedSignatures();
    }
  }, [isOpen]);

  const fetchSavedSignatures = async () => {
    try {
      const res = await fetch('/api/signature-styles');
      const data = await res.json();
      if (data.success) {
        setSavedSignatures(data.signatures);
      }
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
    }
  };

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = selectedColor.hex;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
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

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSignatureFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const base64 = await convertFileToBase64(file);
      setUploadedImage(base64);
    } catch (err) {
      alert('Failed to upload image. Please try again.');
    }
  };

  // Save signature
  const handleSave = async () => {
    let finalData = '';
    let finalType: 'draw' | 'type' | 'upload' = 'draw';
    let finalFont = undefined;
    let finalColor = selectedColor.hex;

    if (activeTab === 'draw') {
      if (!signatureData) {
        alert('Please draw your signature first');
        return;
      }
      finalData = signatureData;
      finalType = 'draw';
    } else if (activeTab === 'type') {
      if (!typedText.trim()) {
        alert('Please enter your name');
        return;
      }
      // Generate typed signature as image
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
      if (!uploadedImage) {
        alert('Please upload an image');
        return;
      }
      finalData = uploadedImage;
      finalType = 'upload';
    }

    // Save to database if checkbox is checked
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

    onSave({
      type: finalType,
      data: finalData,
      font: finalFont,
      color: finalColor,
    });
  };

  // Use saved signature
  const useSavedSignature = async (signature: SavedSignature) => {
    // Update usage count
    await fetch('/api/signature-styles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatureId: signature._id,
        action: 'updateUsage',
      }),
    });

    onSave({
      type: signature.type,
      data: signature.data,
      font: signature.font,
      color: signature.color,
    });
  };

  // Delete saved signature
  const deleteSavedSignature = async (signatureId: string) => {
    if (!confirm('Are you sure you want to delete this signature?')) return;

    try {
      const res = await fetch(`/api/signature-styles?id=${signatureId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSavedSignatures();
      }
    } catch (err) {
      console.error('Failed to delete signature:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Add Your Signature</h3>
            <p className="text-sm text-slate-500 mt-1">Choose how you'd like to sign</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {savedSignatures.length > 0 && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === 'saved'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Star className="h-4 w-4" />
                Saved ({savedSignatures.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'draw'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Pen className="h-4 w-4" />
              Draw
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'type'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Type className="h-4 w-4" />
              Type
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
          </div>

          {/* Saved Signatures Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">Select a saved signature to use</p>
              {savedSignatures.map((sig) => (
                <div
                  key={sig._id}
                  className="border-2 border-slate-200 rounded-lg p-4 hover:border-purple-400 transition-all cursor-pointer relative group"
                >
                  <div onClick={() => useSavedSignature(sig)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{sig.name}</span>
                      {sig.isDefault && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded p-4 flex items-center justify-center h-24">
                      <img src={sig.data} alt={sig.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Used {sig.usageCount} times
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSavedSignature(sig._id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Draw Tab */}
          {activeTab === 'draw' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Signature Color</label>
                <div className="flex gap-2">
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor.id === color.id ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white mb-4 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="w-full cursor-crosshair"
                />
              </div>
              <button
                onClick={clearCanvas}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium mb-4"
              >
                Clear
              </button>
            </div>
          )}

          {/* Type Tab */}
          {activeTab === 'type' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Font Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setSelectedFont(font)}
                      className={`p-4 border-2 rounded-lg hover:border-purple-400 transition-all ${
                        selectedFont.id === font.id ? 'border-purple-600 bg-purple-50' : 'border-slate-200'
                      }`}
                    >
                      <p className="text-xs text-slate-600 mb-1">{font.name}</p>
                      <p style={{ fontFamily: font.fontFamily, color: selectedColor.hex }} className="text-2xl">
                        {typedText || font.preview}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex gap-2">
                  {SIGNATURE_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 ${
                        selectedColor.id === color.id ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="border-2 border-slate-200 rounded-lg p-6 bg-slate-50 flex items-center justify-center h-32">
                <p
                  style={{ 
                    fontFamily: selectedFont.fontFamily,
                    color: selectedColor.hex,
                    fontSize: '48px'
                  }}
                >
                  {typedText || 'Preview'}
                </p>
              </div>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {!uploadedImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 rounded-lg p-12 hover:border-purple-400 transition-all text-center"
                >
                  <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-700 font-medium mb-2">Click to upload signature</p>
                  <p className="text-sm text-slate-500">PNG or JPG (max 5MB)</p>
                </button>
              ) : (
                <div>
                  <div className="border-2 border-slate-200 rounded-lg p-6 bg-slate-50 flex items-center justify-center mb-4">
                    <img src={uploadedImage} alt="Uploaded signature" className="max-h-32 max-w-full object-contain" />
                  </div>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                  >
                    Remove & Upload Different
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Save for future checkbox */}
          {activeTab !== 'saved' && (
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="saveForFuture"
                checked={saveForFuture}
                onChange={(e) => setSaveForFuture(e.target.checked)}
                className="h-4 w-4 text-purple-600 rounded"
              />
              <label htmlFor="saveForFuture" className="text-sm text-slate-700">
                Save this signature for future use
              </label>
            </div>
          )}

          {/* Action Buttons */}
          {activeTab !== 'saved' && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Apply Signature
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Google Fonts Link */}
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&family=Allura&display=swap" rel="stylesheet" />
    </div>
  );
};