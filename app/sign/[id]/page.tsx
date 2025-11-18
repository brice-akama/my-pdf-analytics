"use client"
 

import React, { useState, useRef, useEffect } from 'react';
import { FileText, Check, AlertCircle, X, FileSignature, Loader2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const DocSendSigningPage = () => {
  // Extract signature ID from URL
  const getSignIdFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/\/sign\/(.+)/);
    return match ? match[1] : null;
  };

  const signatureId = getSignIdFromUrl();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [signatureFields, setSignatureFields] = useState([]);
  const [signatures, setSignatures] = useState({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeField, setActiveField] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef(null);
  const [signatureData, setSignatureData] = useState('');

  // Fetch signature request from backend
  useEffect(() => {
    const fetchSignatureRequest = async () => {
      if (!signatureId) {
        setError('Invalid signing link');
        setLoading(false);
        return;
      }

      try {
        // Fetch signature request data
        const res = await fetch(`/api/signature/${signatureId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.message || 'Failed to load signature request');
          setLoading(false);
          return;
        }

        const { signatureRequest } = data;

        // Set document and recipient info
        setDocument({
          id: signatureRequest.document._id,
          filename: signatureRequest.document.filename,
          numPages: signatureRequest.document.numPages,
        });

        setRecipient({
          name: signatureRequest.recipient.name,
          email: signatureRequest.recipient.email,
          index: signatureRequest.recipientIndex,
        });

        setSignatureFields(signatureRequest.signatureFields || []);

        // Fetch PDF file
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

  // Get fields for current recipient and current page
  const currentPageFields = signatureFields.filter(
    f => f.page === currentPage && f.recipientIndex === recipient?.index
  );

  // Get all fields for current recipient
  const myFields = signatureFields.filter(f => f.recipientIndex === recipient?.index);

  // Check if all required fields are filled
  const allFieldsFilled = myFields.every(f => signatures[f.id]);

  // Canvas drawing functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData('');
    }
  };

  const saveSignature = () => {
    if (!signatureData) {
      alert('Please draw your signature first');
      return;
    }

    // Get current date for auto-fill
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Save signature
    const updatedSignatures = {
      ...signatures,
      [activeField.id]: {
        type: 'signature',
        data: signatureData,
        timestamp: new Date().toISOString()
      }
    };

    // AUTO-FILL ALL DATE FIELDS FOR THIS RECIPIENT (DocSend behavior)
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

  const handleTextInput = (fieldId, value) => {
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
      // Submit signature to backend
      const res = await fetch(`/api/signature/${signatureId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedFields: signatures,
          signedAt: new Date().toISOString(),
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

  // Loading state
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

  // Error state
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

  // Completed state
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

  // Main signing interface
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
                {Object.keys(signatures).length} / {myFields.length} completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                {/* PDF Display */}
                {pdfUrl ? (
                  <div className="relative">
                    <embed
                      src={`${pdfUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=1`}
                      type="application/pdf"
                      className="w-full h-[700px]"
                      style={{ border: 'none' }}
                    />

                    {/* Signature Field Overlays */}
                    {currentPageFields.map((field) => {
                      const isFilled = signatures[field.id];
                      
                      return (
                        <div
                          key={field.id}
                          className={`absolute border-2 rounded transition-all ${
                            isFilled 
                              ? 'bg-green-50/90 border-green-500' 
                              : 'bg-yellow-50/90 border-yellow-500 animate-pulse hover:bg-yellow-100/90'
                          }`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: field.type === 'signature' ? '200px' : '150px',
                            height: field.type === 'signature' ? '60px' : '40px',
                            cursor: field.type === 'signature' && !isFilled ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (field.type === 'signature' && !isFilled) {
                              setActiveField(field);
                            }
                          }}
                        >
                          <div className="h-full flex flex-col items-center justify-center p-2">
                            {isFilled ? (
                              <>
                                {field.type === 'signature' && (
                                  <img src={signatures[field.id].data} alt="Signature" className="max-h-full max-w-full" />
                                )}
                                {field.type === 'date' && (
                                  <div className="text-center">
                                    <Clock className="h-4 w-4 mx-auto mb-1 text-green-600" />
                                    <p className="text-xs font-medium text-slate-900">{signatures[field.id].data}</p>
                                  </div>
                                )}
                                {field.type === 'text' && (
                                  <p className="text-sm font-medium text-slate-900">{signatures[field.id].data}</p>
                                )}
                              </>
                            ) : (
                              <div className="text-center">
                                {field.type === 'signature' && (
                                  <>
                                    <FileSignature className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                                    <p className="text-xs font-semibold text-slate-700">Click to Sign</p>
                                  </>
                                )}
                                {field.type === 'date' && (
                                  <>
                                    <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                                    <p className="text-xs font-medium text-slate-700">Auto-filled</p>
                                  </>
                                )}
                                {field.type === 'text' && (
                                  <>
                                    <p className="text-xs font-medium text-slate-700">Text Field</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-[700px] flex items-center justify-center bg-slate-50">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                )}
              </div>

              {/* Page Navigation */}
              {document.numPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t bg-slate-50">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-slate-600 font-medium">
                    Page {currentPage} of {document.numPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(document.numPages, p + 1))}
                    disabled={currentPage >= document.numPages}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">Signature Progress</h3>
              
              {/* Progress */}
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

              {/* Fields List */}
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {myFields.map(field => (
                  <div 
                    key={field.id}
                    className={`p-3 rounded-lg border ${
                      signatures[field.id] ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {field.type === 'signature' ? '✍️ Signature' : 
                         field.type === 'date' ? '📅 Date' : '📝 Text Field'}
                      </span>
                      {signatures[field.id] && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Page {field.page}</p>
                  </div>
                ))}
              </div>

              {/* Complete Button */}
              <button
                onClick={completeSignature}
                disabled={!allFieldsFilled || submitting}
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  allFieldsFilled && !submitting
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
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

      {/* Signature Drawing Modal */}
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
                  className="w-full cursor-crosshair"
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
    </div>
  );
};

export default DocSendSigningPage;