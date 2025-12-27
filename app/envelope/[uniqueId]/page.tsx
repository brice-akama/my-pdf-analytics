// my-pdf-analytics/app/envelope/[uniqueId]/page.tsx
// This is just Phase 1 - the signing page.

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  Check, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Download,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignatureStyleModal } from '@/components/SignatureStyleModal';

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
  
  // Envelope data
  const [envelope, setEnvelope] = useState<any>(null);
  const [documents, setDocuments] = useState<EnvelopeDocument[]>([]);
  const [allSignatureFields, setAllSignatureFields] = useState<SignatureField[]>([]);
  
  // Signing state
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [signatures, setSignatures] = useState<Record<string, any>>({});
  const [signedDocuments, setSignedDocuments] = useState<SignedDocument[]>([]);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  
  // UI state
  const [activeField, setActiveField] = useState<SignatureField | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

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
    //  ADD: Log recipient info for debugging
console.log('📋 Envelope recipient:', data.envelope.recipient);
console.log('📋 Signature fields:', data.envelope.signatureFields);

    // ✅ Load PDFs through your API route (not directly from Cloudinary)
    const urls: Record<string, string> = {};
    for (const doc of data.envelope.documents) {
      // Use your API route instead of direct Cloudinary URL
      const pdfRes = await fetch(`/api/envelope/${uniqueId}/file?documentId=${doc.documentId}`);
      if (pdfRes.ok) {
        const blob = await pdfRes.blob();
        urls[doc.documentId] = URL.createObjectURL(blob);
      } else {
        console.error(`Failed to load PDF for ${doc.documentId}:`, pdfRes.status);
      }
    }
    setPdfUrls(urls);

    setLoading(false);
  } catch (err: any) {
    console.error('Error fetching envelope:', err);
    setError(err.message || 'Failed to load envelope');
    setLoading(false);
  }
};
  const currentDocument = documents[currentDocIndex];
  const currentDocFields = allSignatureFields.filter(
    f => f.documentId === currentDocument?.documentId
  );

  const currentDocSignatures = Object.keys(signatures).filter(fieldId =>
    currentDocFields.some(f => f.id === fieldId)
  );

  const allCurrentDocFieldsFilled = currentDocFields.every(f => signatures[f.id]);

  const handleNextDocument = () => {
    if (!allCurrentDocFieldsFilled) {
      alert('Please complete all fields before proceeding');
      return;
    }

    // Save current document as signed
    const signedFields = currentDocFields.map(field => ({
      id: field.id,
      type: field.type,
      signatureData: field.type === 'signature' ? signatures[field.id]?.data : null,
      dateValue: field.type === 'date' ? signatures[field.id]?.data : null,
      textValue: field.type === 'text' || field.type === 'checkbox' ? signatures[field.id]?.data : null,
      timestamp: new Date().toISOString(),
    }));

    setSignedDocuments(prev => [...prev, {
      documentId: currentDocument.documentId,
      filename: currentDocument.filename,
      signedFields: signedFields,
      signedAt: new Date().toISOString(),
    }]);

    // Move to next document
    if (currentDocIndex < documents.length - 1) {
      setCurrentDocIndex(prev => prev + 1);
    } else {
      // All documents signed - submit envelope
      handleSubmitEnvelope(signedFields);
    }
  };

  const handleSubmitEnvelope = async (lastDocFields: any[]) => {
    setSubmitting(true);

    try {
      // Prepare all signed documents
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
        body: JSON.stringify({
          signedDocuments: allSignedDocs,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit envelope');
      }

      setCompleted(true);
    } catch (err: any) {
      console.error('Error submitting envelope:', err);
      alert(err.message || 'Failed to submit envelope');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading envelope...</p>
        </div>
      </div>
    );
  }

  if (error || !envelope) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Envelope</h2>
          <p className="text-slate-600">{error || 'Envelope not found'}</p>
        </div>
      </div>
    );
  }

  if (completed) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Envelope Signed Successfully!
          </h2>
          <p className="text-slate-600">
            You've completed all {documents.length} documents in this signing package
          </p>
        </div>

        {/* Document List */}
        <div className="bg-slate-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Signed Documents:</h3>
          <div className="space-y-3">
            {signedDocuments.map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{doc.filename}</p>
                  <p className="text-xs text-slate-500">
                    Signed at {new Date(doc.signedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <Button
            onClick={async () => {
              try {
                const link = document.createElement('a');
                link.href = `/api/envelope/${uniqueId}/download`;
                link.download = `envelope_signed_package.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (err) {
                console.error('Download error:', err);
                alert('Failed to download envelope');
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Complete Signed Package
          </Button>
          <p className="text-xs text-slate-600 mt-2 text-center">
            This PDF contains all {documents.length} signed documents plus an audit trail
          </p>
        </div>

        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="w-full"
        >
          Done
        </Button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
    <FileText className="h-5 w-5 text-purple-600" />
  </div>
  <div>
    <h1 className="text-xl font-bold text-slate-900">
      Signing Package ({currentDocIndex + 1} of {documents.length})
    </h1>
    <p className="text-sm text-slate-600 mt-1">
      {currentDocument?.filename}
    </p>
    <p className="text-sm text-slate-500">
      Signing as: {envelope?.recipient?.name || 'Loading...'}
    </p>
  </div>
</div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                {currentDocSignatures.length} / {currentDocFields.length} fields completed
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex-1 flex items-center gap-2">
                  <div
                    className={`flex-1 h-2 rounded-full transition-all ${
                      index < currentDocIndex
                        ? 'bg-green-600'
                        : index === currentDocIndex
                        ? 'bg-purple-600'
                        : 'bg-slate-200'
                    }`}
                  />
                  {index < documents.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              {documents.map((doc, index) => (
                <span key={index} className={index === currentDocIndex ? 'font-bold text-purple-600' : ''}>
                  {doc.filename}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        {/* PDF Viewer */}
        <div className="col-span-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative" style={{ minHeight: '800px' }}>
              {pdfUrls[currentDocument.documentId] ? (
                <>
                  <embed
  src={`${pdfUrls[currentDocument.documentId]}#toolbar=0&navpanes=0&scrollbar=1`}
  type="application/pdf"
  className="w-full"
  style={{
    height: `${297 * currentDocument.numPages}mm`, // ⭐ Dynamic height
    border: 'none',
    pointerEvents: 'auto',
    display: 'block',
  }}
/>


                  {/* Signature Field Overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                   {currentDocFields.map(field => {
  const isFilled = signatures[field.id];
  const pageHeight = 297 * 3.78; // A4 height in pixels
  //   FIX: Position relative to current document only (no cumulative offset)
  const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);

                      return (
                        <div
                          key={field.id}
                          className={`absolute rounded transition-all pointer-events-auto ${
                            isFilled
                              ? 'bg-transparent border-0'
                              : 'bg-yellow-50/80 border-2 border-yellow-400 animate-pulse hover:bg-yellow-100/80 cursor-pointer'
                          }`}
                         style={{
  left: `${field.x}%`,
  top: `${topPosition}px`,
  width: field.width ? `${field.width}px` : 
         field.type === 'signature' ? '200px' : 
         field.type === 'checkbox' ? '30px' : 
         field.type === 'attachment' ? '200px' : '150px',
  height: field.height ? `${field.height}px` : 
          field.type === 'signature' ? '60px' : 
          field.type === 'checkbox' ? '30px' : 
          field.type === 'attachment' ? '50px' : '40px',
  transform: 'translate(-50%, 0%)',
  cursor: !isFilled && field.type === 'signature' ? 'pointer' : 'default',
  pointerEvents: 'auto', // ⭐ ENABLE INTERACTION
  zIndex: 10,
}}
                          onClick={() => {
                            if (!isFilled && field.type === 'signature') {
                              setActiveField(field);
                            }
                          }}
                        >
                          {isFilled ? (
  <div className="h-full flex items-center justify-center">
    {field.type === 'signature' && (
      <img
        src={signatures[field.id].data}
        alt="Signature"
        className="max-h-full max-w-full object-contain"
      />
    )}
    {field.type === 'date' && (
      <span className="text-sm font-medium">{signatures[field.id].data}</span>
    )}
    {field.type === 'text' && (
      <span className="text-sm">{signatures[field.id].data}</span>
    )}
  </div>
) : (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <span className="text-xs font-semibold text-yellow-700">
      {field.type === 'signature' ? '✍️ Click to Sign' : '📝 Click to Fill'}
    </span>
    {/* ⭐ ADD RECIPIENT NAME */}
    <p className="text-xs text-slate-600 mt-1 font-semibold">
      {envelope?.recipient?.name || 'Your Signature'}
    </p>
  </div>
)}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-4">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <h3 className="font-semibold text-slate-900 mb-4">Progress</h3>

            {/* Document Progress */}
            <div className="space-y-3 mb-6">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    index < currentDocIndex
                      ? 'bg-green-50 border-green-200'
                      : index === currentDocIndex
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {index < currentDocIndex ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : index === currentDocIndex ? (
                      <Clock className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                      <p className="text-xs text-slate-500">
                        {index < currentDocIndex ? 'Completed' : index === currentDocIndex ? 'In Progress' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleNextDocument}
              disabled={!allCurrentDocFieldsFilled || submitting}
              className={`w-full py-3 ${
                allCurrentDocFieldsFilled && !submitting
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : currentDocIndex === documents.length - 1 ? (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Complete Signing
                </>
              ) : (
                <>
                  Next Document
                  <ChevronRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center mt-3">
              {currentDocIndex === documents.length - 1
                ? 'This is the last document'
                : `${documents.length - currentDocIndex - 1} more document(s) to sign`}
            </p>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      <SignatureStyleModal
        isOpen={activeField !== null}
        onClose={() => setActiveField(null)}
        onSave={(signatureData) => {
          if (!activeField) return;

          const currentDate = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          const updatedSignatures: Record<string, any> = {
            ...signatures,
            [activeField.id]: {
              type: 'signature',
              data: signatureData.data,
              timestamp: new Date().toISOString()
            }
          };

          // Auto-fill date fields for this document
          const dateFields = currentDocFields.filter(f => f.type === 'date');
          dateFields.forEach(dateField => {
            updatedSignatures[dateField.id] = {
              type: 'date',
              data: currentDate,
              timestamp: new Date().toISOString()
            };
          });

          setSignatures(updatedSignatures);
          setActiveField(null);
        }}
        recipientName={envelope.recipient.name}
      />
    </div>
  );
}