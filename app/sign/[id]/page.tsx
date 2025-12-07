"use client"
import React, { useState, useRef, useEffect } from 'react';
import { FileText, Check, AlertCircle, X, FileSignature, Loader2, Clock, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// Type definitions
interface Document {
  id: string;
  filename: string;
  numPages: number;
}

interface Recipient {
  name: string;
  email: string;
  index: number;
}

interface SignatureField {
  id: string;
  page: number;
  recipientIndex: number;
  type: 'signature' | 'date' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  recipientName?: string; // ⭐ ADD THIS
  recipientEmail?: string; // ⭐ ADD THIS
}

interface SignatureData {
  type: string;
  data: string;
  timestamp: string;
}

const DocSendSigningPage = () => {
  const getSignIdFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/\/sign\/(.+)/);
    return match ? match[1] : null;
  };
  const signatureId = getSignIdFromUrl();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [completed, setCompleted] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signatureData, setSignatureData] = useState('');
  const [textFieldInput, setTextFieldInput] = useState('');
  const [activeTextField, setActiveTextField] = useState<SignatureField | null>(null);
  const [isAwaitingTurn, setIsAwaitingTurn] = useState(false);
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(null);
  const [signatureRequest ] = useState<any | null>(null);



  useEffect(() => {
  if (signatureRequest?.expiresAt) {
    const expirationDate = new Date(signatureRequest.expiresAt);
    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    setDaysUntilExpiration(daysRemaining);

  }
}, [signatureRequest]);

  useEffect(() => {
    const fetchSignatureRequest = async () => {
      if (!signatureId) {
        setError('Invalid signing link');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/signature/${signatureId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load signature request');
          setLoading(false);
          return;
        }
        const { signature } = data;

        const requestRes = await fetch(`/api/signature/${signatureId}/request`);
        if (!requestRes.ok) {
          setError('Failed to load signature fields');
          setLoading(false);
          return;
        }
        const requestData = await requestRes.json();
        const signatureRequest = requestData.signatureRequest;
       
        //   CHECK IF CANCELLED
if (signatureRequest.status === 'cancelled') {
  const cancelledDate = signatureRequest.cancelledAt 
    ? new Date(signatureRequest.cancelledAt).toLocaleDateString()
    : 'recently';
  const reason = signatureRequest.cancellationReason || 'No reason provided';
  
  setError(`This signature request was cancelled ${cancelledDate}. Reason: ${reason}`);
  setLoading(false);
  return;
}

        //  CHECK EXPIRATION
if (signatureRequest.expiresAt) {
  const expirationDate = new Date(signatureRequest.expiresAt);
  const now = new Date();
  
  if (now > expirationDate) {
    setError(`This signature request expired on ${expirationDate.toLocaleDateString()}. Please contact the document sender for a new link.`);
    setLoading(false);
    return;
  }
}

  const isAwaitingTurnStatus = signatureRequest.status === 'awaiting_turn';
        setIsAwaitingTurn(isAwaitingTurnStatus);

        //   DON'T block access - just track the status
        const isAwaitingTurn = signatureRequest.status === 'awaiting_turn';

        setDocument({
          id: signatureRequest.documentId,
          filename: signatureRequest.document?.filename || signature.documentName,
          numPages: signatureRequest.document?.numPages || 1,
        });
        setRecipient({
          name: signatureRequest.recipient.name,
          email: signatureRequest.recipient.email,
          index: signatureRequest.recipientIndex,
        });
        setSignatureFields(signatureRequest.signatureFields || []);

        // Store whether they're awaiting their turn
        if (isAwaitingTurn) {
          console.log('⏳ User is viewing document but cannot sign yet');
        }

        // Pre-populate signatures from other signers in shared mode
        if (signatureRequest.viewMode === 'shared' && signatureRequest.sharedSignatures) {
          const preFilledSignatures: Record<string, SignatureData> = {};

          Object.entries(signatureRequest.sharedSignatures).forEach(([recipientIndex, sigData]: [string, any]) => {
            // Find all fields for this recipient
            const recipientFields = signatureRequest.signatureFields.filter(
              (f: SignatureField) => f.recipientIndex === parseInt(recipientIndex)
            );

            // Match signed fields to field IDs
            recipientFields.forEach((field: SignatureField) => {
              const matchingSignedField = sigData.signedFields.find((sf: any) =>
                sf.id === field.id || sf.type === field.type
              );

              if (matchingSignedField) {
                preFilledSignatures[field.id] = {
                  type: matchingSignedField.type,
                  data: matchingSignedField.signatureData || matchingSignedField.dateValue || matchingSignedField.textValue,
                  timestamp: matchingSignedField.timestamp,
                };
              }
            });
          });

          setSignatures(preFilledSignatures);
          console.log('✅ Pre-loaded', Object.keys(preFilledSignatures).length, 'signatures from other signers');
        }
        setDocument({
          id: signatureRequest.documentId,
          filename: signatureRequest.document?.filename || signature.documentName,
          numPages: signatureRequest.document?.numPages || 1,
        });
        setRecipient({
          name: signatureRequest.recipient.name,
          email: signatureRequest.recipient.email,
          index: signatureRequest.recipientIndex,
        });
        setSignatureFields(signatureRequest.signatureFields || []);

        const pdfRes = await fetch(`/api/signature/${signatureId}/file`);
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching signature request:', err);
        setError('Failed to load document. Please try again.');
        setLoading(false);
      }
    };
    fetchSignatureRequest();
  }, [signatureId]);

  useEffect(() => {
    if (!signatureId || !pdfUrl) return;

    const trackView = async () => {
      try {
        await fetch(`/api/signature/${signatureId}/track-view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1, // Track as page 1 since we're showing all pages
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
          }),
        });
      } catch (err) {
        console.error('Failed to track view:', err);
      }
    };

    trackView();
  }, [signatureId, pdfUrl]);

  useEffect(() => {
    const startTime = Date.now();

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      if (signatureId && timeSpent > 2) {
        fetch(`/api/signature/${signatureId}/track-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1, // Track as page 1 since we're showing all pages
            timeSpent,
          }),
        }).catch(() => { });
      }
    };
  }, [signatureId]);

  const myFields = signatureFields.filter(f => f.recipientIndex === recipient?.index);
  const allFields = signatureFields;
  const allFieldsFilled = myFields.every(f => signatures[f.id]);

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
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        setSignatureData(canvas.toDataURL());
      }
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData('');
      }
    }
  };

  const saveSignature = () => {
    if (!signatureData || !activeField || !recipient) {
      alert('Please draw your signature first');
      return;
    }
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const updatedSignatures: Record<string, SignatureData> = {
      ...signatures,
      [activeField.id]: {
        type: 'signature',
        data: signatureData,
        timestamp: new Date().toISOString()
      }
    };
    const dateFields = signatureFields.filter(
      f => f.type === 'date' && f.recipientIndex === recipient.index
    );
    dateFields.forEach(dateField => {
      updatedSignatures[dateField.id] = {
        type: 'date',
        data: currentDate,
        timestamp: new Date().toISOString()
      };
    });
    setSignatures(updatedSignatures);
    setActiveField(null);
    setSignatureData('');
    clearSignature();
  };

  const handleTextInput = (fieldId: string, value: string) => {
    setSignatures(prev => ({
      ...prev,
      [fieldId]: {
        type: 'text',
        data: value,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const completeSignature = async () => {
    if (!allFieldsFilled) {
      alert('Please complete all required fields before submitting');
      return;
    }
    setSubmitting(true);
    try {
      let ipAddress = null;
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch (err) {
        console.warn('Could not fetch IP address');
      }
      const signedFieldsArray = Object.entries(signatures).map(([id, sig]) => ({
        id: parseInt(id),
        type: sig.type,
        signatureData: sig.type === 'signature' ? sig.data : null,
        dateValue: sig.type === 'date' ? sig.data : null,
        textValue: sig.type === 'text' ? sig.data : null,
        timestamp: sig.timestamp,
      }));
      const res = await fetch(`/api/signature/${signatureId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedFields: signedFieldsArray,
          signedAt: new Date().toISOString(),
          ipAddress: ipAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Failed to submit signature');
        setSubmitting(false);
        return;
      }
      setCompleted(true);
    } catch (err) {
      console.error('Error completing signature:', err);
      alert('Failed to submit signature. Please try again.');
      setSubmitting(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document || !recipient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
          <p className="text-slate-600 mb-6">
            {error || 'This signing link is invalid or has expired.'}
          </p>
          <p className="text-sm text-slate-500">
            Please contact the document sender for a new link.
          </p>
        </div>
      </div>
    );
  }

  {/* Show expiration warning if < 3 days remaining */}
{daysUntilExpiration !== null && daysUntilExpiration <= 3 && daysUntilExpiration > 0 && (
  <div className="mb-3 bg-orange-50 border border-orange-300 rounded-lg p-3">
    <div className="flex items-center gap-2">
      <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-orange-900">
          ⚠️ Link Expires Soon
        </p>
        <p className="text-xs text-orange-700">
          This signing link expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}. Please sign before {new Date(signatureRequest.expiresAt).toLocaleDateString()}.
        </p>
      </div>
    </div>
  </div>
)}

{signatureRequest?.status === 'cancelled' && (
  <div className="flex items-center gap-2 text-red-600">
    <X className="h-4 w-4" />
    <span className="text-sm font-medium">Cancelled</span>
    {signatureRequest?.cancelledAt && (
      <span className="text-xs text-slate-500">
        on {new Date(signatureRequest.cancelledAt).toLocaleDateString()}
      </span>
    )}
  </div>
)}

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Successfully Signed!</h2>
          <p className="text-slate-600 mb-6">
            Your signature has been recorded and the document owner has been notified.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">

            <a
              href={`/signed/${signatureId}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <Download className="h-4 w-4" />
              View Signed Document Now
            </a>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border text-left">
            <p className="text-sm text-slate-700"><strong>Document:</strong> {document.filename}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Signed by:</strong> {recipient.name}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Email:</strong> {recipient.email}</p>
            <p className="text-sm text-slate-700 mt-2"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/*   ADD WARNING BANNER if awaiting turn */}
          {isAwaitingTurn && (
            <div className="mb-3 bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Waiting for Previous Signer</p>
                  <p className="text-xs text-amber-700">
                    You can view the document below, but you cannot sign yet. You'll be notified via email when it's your turn.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">{document.filename}</h1>
                <p className="text-sm text-slate-500">Signing as: {recipient.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                {Object.keys(signatures).filter(id => myFields.some(f => f.id === id)).length} / {myFields.length} your fields completed
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div id="pdf-signing-container" className="relative" style={{ minHeight: `${297 * document.numPages}mm` }}>
                {pdfUrl ? (
                  <>
                    {/* Single PDF embed showing all pages */}
                    <embed
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      type="application/pdf"
                      className="w-full"
                      style={{
                        border: 'none',
                        pointerEvents: 'none',
                        height: `${297 * document.numPages}mm`,
                        display: 'block',
                      }}
                    />

                    {/* Signature Field Overlays */}
                    <div className="absolute inset-0 pointer-events-none">
                      {signatureFields.map((field) => { // ⬅️ Show ALL fields in shared mode
                        const isFilled = signatures[field.id];
                        const isMyField = field.recipientIndex === recipient?.index;
                        const pageHeight = 297 * 3.78; // Convert mm to pixels
                        const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);

                        return (
                          <div
                            key={field.id}
                            className={`absolute rounded transition-all ${isFilled
                              ? 'bg-transparent border-0'
                              : isAwaitingTurn && isMyField
                                ? 'bg-gray-200/80 border-2 border-gray-400 cursor-not-allowed'  // ⭐ Grayed out
                                : 'bg-yellow-50/80 border-2 border-yellow-400 animate-pulse hover:bg-yellow-100/80'
                              }`}
                            style={{
                              left: `${field.x}%`,
                              top: `${topPosition}px`,
                              width: field.width ? `${field.width}px` : (field.type === 'signature' ? '200px' : '150px'),
                              height: field.height ? `${field.height}px` : (field.type === 'signature' ? '60px' : '40px'),
                              transform: 'translate(-50%, 0%)',
                              cursor: field.type === 'signature' && !isFilled ? 'pointer' : 'default',
                              pointerEvents: isFilled ? 'none' : 'auto',
                              zIndex: 10,
                            }}
                            onClick={() => {
                              //   ADD isAwaitingTurn check
                              if (!isFilled && isMyField && !isAwaitingTurn) {
                                if (field.type === 'signature') {
                                  setActiveField(field);
                                } else if (field.type === 'text') {
                                  setActiveTextField(field);
                                  setTextFieldInput('');
                                }
                              } else if (isAwaitingTurn && isMyField) {
                                //   Show helpful message
                                alert("It's not your turn yet. You'll receive an email when the previous signer completes.");
                              }
                            }}
                          >
                            <div className="h-full flex flex-col items-center justify-center p-2">
                              {isFilled ? (
                                <>
                                  {field.type === 'signature' && (
                                    <img
                                      src={signatures[field.id].data}
                                      alt="Signature"
                                      className="max-h-full max-w-full object-contain"
                                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                                    />
                                  )}
                                  {field.type === 'date' && (
                                    <div className="text-center w-full">
                                      <p className="text-sm font-medium text-slate-900 leading-tight">
                                        {signatures[field.id].data}
                                      </p>
                                    </div>
                                  )}
                                  {field.type === 'text' && (
                                    <p className="text-sm font-medium text-slate-900 text-center px-2 leading-tight">
                                      {signatures[field.id].data}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <div className="text-center">
                                  <p className="text-xs font-medium text-yellow-700">
                                    {isAwaitingTurn && isMyField ? (
                                      '⏳ Waiting for your turn'  // ⭐ New message
                                    ) : (
                                      field.type === 'signature' ? (isMyField ? '✍️ Click to Sign' : '⏳ Awaiting Signature') :
                                        field.type === 'date' ? (isMyField ? '📅 Auto-filled' : '📅 Date pending') :
                                          (isMyField ? '📝 Click to Fill' : '⏳ Awaiting Input')
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1 font-semibold">
                                    {(field as any).recipientName || `Recipient ${field.recipientIndex + 1}`}
                                    {isMyField && ' (You)'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-[700px] flex items-center justify-center bg-slate-50">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">

              {/*   ADD status indicator at top */}
    {isAwaitingTurn && (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">Awaiting Turn</span>
        </div>
        <p className="text-xs text-amber-700">
          You can review the document, but signing is disabled until the previous signer completes.
        </p>
      </div>
    )}
              <h3 className="font-semibold text-slate-900 mb-4">Signature Progress</h3>

              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Completed</span>
                  <span>{Object.keys(signatures).length} / {myFields.length}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${myFields.length > 0 ? (Object.keys(signatures).length / myFields.length) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {allFields.map(field => {  // ⬅️ Show all fields
                  const isMyField = field.recipientIndex === recipient?.index;
                  return (
                    <div
                      key={field.id}
                      className={`p-3 rounded-lg border ${signatures[field.id]
                        ? 'bg-green-50 border-green-200'
                        : isMyField
                          ? 'bg-yellow-50 border-yellow-200'  // My pending field
                          : 'bg-slate-50 border-slate-200'     // Others' fields
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">
                          {field.type === 'signature' ? '✍️ Signature' :
                            field.type === 'date' ? '📅 Date' : '📝 Text Field'}
                          {!isMyField && ' (Other signer)'}  {/* ⬅️ Show indicator */}
                        </span>
                        {signatures[field.id] && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Page {field.page}</p>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={completeSignature}
                disabled={!allFieldsFilled || submitting || isAwaitingTurn}  // ⭐ Add isAwaitingTurn
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${allFieldsFilled && !submitting && !isAwaitingTurn  // ⭐ Add check
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : isAwaitingTurn ? (  // ⭐ Add this
                  <>
                    <Clock className="h-5 w-5" />
                    Waiting for Your Turn
                  </>
                ) : allFieldsFilled ? (
                  <>
                    <Check className="h-5 w-5" />
                    Complete Signing
                  </>
                ) : (
                  'Complete All Fields'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {activeField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Draw Your Signature</h3>
                <p className="text-sm text-slate-500 mt-1">Sign inside the box below</p>
              </div>
              <button
                onClick={() => {
                  setActiveField(null);
                  clearSignature();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white mb-4 overflow-hidden">
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
                  className="w-full cursor-crosshair touch-none"
                  style={{ touchAction: 'none' }}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> After you sign, the date will automatically appear in the "Date Signed" field below your signature.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearSignature}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Clear
                </button>
                <button
                  onClick={saveSignature}
                  disabled={!signatureData}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTextField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Enter Text</h3>
                <p className="text-sm text-slate-500 mt-1">Type your response below</p>
              </div>
              <button
                onClick={() => {
                  setActiveTextField(null);
                  setTextFieldInput('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <input
                type="text"
                value={textFieldInput}
                onChange={(e) => setTextFieldInput(e.target.value)}
                placeholder="Enter text here..."
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setActiveTextField(null);
                    setTextFieldInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (textFieldInput.trim()) {
                      handleTextInput(activeTextField.id, textFieldInput.trim());
                      setActiveTextField(null);
                      setTextFieldInput('');
                    }
                  }}
                  disabled={!textFieldInput.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
};

export default DocSendSigningPage;
