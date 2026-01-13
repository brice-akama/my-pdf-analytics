
//app/documents/envelope/create/page.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Trash2,
  Users,
  Mail,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowLeft,
  CheckCircle,
  Loader2,
  FileSignature,
  Clock,
  Edit,
  X,
  Settings,
    CheckSquare,
  Paperclip,
} from "lucide-react";

interface Document {
  _id: string;
  filename: string;
  originalFilename: string;
  numPages: number;
  cloudinaryPdfUrl: string;
  createdAt: string;
}

interface Recipient {
  name: string;
  email: string;
  role?: string;
  color?: string;
}

interface SignatureField {
  attachmentLabel?: string;
  id: number;
  documentId: string;
  type: "signature" | "date" | "text" | "checkbox" | "attachment" | "dropdown" | "radio";
  x: number;
  y: number;
  page: number;
  recipientIndex: number;
  width?: number;
  height?: number;
  label?: string;
  defaultChecked?: boolean; 
  
  attachmentType?: string; 
  isRequired?: boolean;  
  options?: string[]; 
  defaultValue?: string; 
  conditional?: { 
    enabled: boolean;
    dependsOn: string | number;
    condition: 'checked' | 'unchecked' | 'equals' | 'not_equals' | 'contains';
    value?: string;
  };
}

export default function CreateEnvelopePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDocIds = searchParams?.get("docs")?.split(",") || [];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);

  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "", email: "", role: "" },
  ]);

  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<SignatureField | null>(null);

  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expirationDays, setExpirationDays] = useState("30");

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);
const [documentsPerPage, setDocumentsPerPage] = useState(12);
const [currentPage, setCurrentPage] = useState(1);
const [sortBy, setSortBy] = useState("createdAt");
const [sortOrder, setSortOrder] = useState(-1); // -1 for desc, 1 for asc
const [totalPages, setTotalPages] = useState(1);
const [totalDocuments, setTotalDocuments] = useState(0);
const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
const [uploadMessage, setUploadMessage] = useState('');
const fileInputRef = useRef<HTMLInputElement>(null);
const spaceId = searchParams?.get("spaceId"); //  Get space ID from URL



 

 useEffect(() => {
  fetchDocuments();
}, [currentPage, documentsPerPage, sortBy, sortOrder]);


const fetchPdfForPreview = async (docId: string) => {
  try {
    const res = await fetch(`/api/documents/${docId}/file?serve=blob`, {
      credentials: "include",
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrls((prev) => ({ ...prev, [docId]: url }));
    }
  } catch (error) {
    console.error("Failed to fetch PDF:", error);
  }
};

// ⭐ ADD THIS - Calculate document page offsets (for multi-doc positioning)
const documentPageOffsets = useMemo(() => {
  const offsets: Record<string, number> = {};
  let cumulativePages = 0;
  
  if (!selectedDocs || selectedDocs.length === 0) {
    return offsets;
  }
  
  selectedDocs.forEach((doc) => {
    if (doc && doc._id && doc.numPages) {
      offsets[doc._id] = cumulativePages;
      cumulativePages += doc.numPages;
    }
  });
  
  return offsets;
}, [selectedDocs]);


  const fetchDocuments = async () => {
  try {
    setLoading(true);
    
    // ✅ If we have preselected IDs, fetch those specific documents first
    if (preselectedDocIds.length > 0) {
      console.log('🔍 Fetching preselected docs:', preselectedDocIds);
      
      const preselectedPromises = preselectedDocIds.map(id =>
        fetch(`/api/documents/${id}`, { credentials: "include" })
          .then(res => res.ok ? res.json() : null)
          .then(data => data?.success ? data.document : null)
      );
      
      const preselectedDocs = (await Promise.all(preselectedPromises)).filter(Boolean);
      
      console.log('✅ Loaded preselected docs:', preselectedDocs.length);
      
      if (preselectedDocs.length >= 2) {
        setSelectedDocs(preselectedDocs);
        setAllDocuments(preselectedDocs);
        setStep(2); // ✅ Skip to step 2 immediately
        setLoading(false);
        return; // Don't fetch all documents
      }
    }
    
    // ✅ Otherwise fetch paginated list
    const res = await fetch(
      `/api/documents?page=${currentPage}&limit=${documentsPerPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      { credentials: "include" }
    );
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setAllDocuments(data.documents);
        setTotalDocuments(data.totalDocuments);
        setTotalPages(data.totalPages);
      }
    }
  } catch (err) {
    console.error("Failed to fetch documents:", err);
  } finally {
    setLoading(false);
  }
};


  const toggleDocSelection = (doc: Document) => {
    if (selectedDocs.find((d) => d._id === doc._id)) {
      setSelectedDocs(selectedDocs.filter((d) => d._id !== doc._id));
    } else {
      setSelectedDocs([...selectedDocs, doc]);
    }
  };

  const handleFileUpload = async (file: File) => {
  if (!file) return;

  if (file.type !== 'application/pdf') {
    setUploadStatus('error');
    setUploadMessage('Please upload a PDF file');
    setTimeout(() => {
      setUploadStatus('idle');
      setUploadMessage('');
    }, 3000);
    return;
  }

  setUploadStatus('uploading');
  setUploadMessage('Uploading your document...');

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch("/api/upload", {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();

    if (res.ok && data.success) {
  setUploadStatus('success');
  setUploadMessage(`Successfully uploaded ${file.name}`);
  
  // ⭐ Refresh document list to show new upload
  await fetchDocuments();
  
  // ⭐ Auto-select the newly uploaded document (with safety check)
  if (data.document && data.document._id) {
    setSelectedDocs(prev => [...(prev || []), data.document]);
  }
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    } else {
      setUploadStatus('error');
      setUploadMessage(data.message || 'Upload failed');
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadMessage('');
      }, 3000);
    }
  } catch (error) {
    setUploadStatus('error');
    setUploadMessage('Upload failed. Please try again.');
    setTimeout(() => {
      setUploadStatus('idle');
      setUploadMessage('');
    }, 3000);
  }
};

  const handleContinue = async () => {
    if (step === 1) {
      if (selectedDocs.length < 2) {
        alert("Please select at least 2 documents for an envelope");
        return;
      }
      setStep(2);

   } else if (step === 2) {
  const validRecipients = recipients.filter((r) => r.name && r.email);
  if (validRecipients.length === 0) {
    alert("Please add at least one recipient");
    return;
  }
  
  // ⭐ Go to Step 3 immediately
  setStep(3);
  
  // ⭐ Fetch PDFs in background (non-blocking)
  Promise.all(
    selectedDocs.map(doc => fetchPdfForPreview(doc._id))
  ).catch(err => {
    console.error("Failed to load PDFs:", err);
  });


    } else if (step === 3) {
      const fieldsPerDoc: Record<string, number> = {};
      signatureFields.forEach((field) => {
        fieldsPerDoc[field.documentId] = (fieldsPerDoc[field.documentId] || 0) + 1;
      });

      const missingFields = selectedDocs.filter(
        (doc) => !fieldsPerDoc[doc._id] || fieldsPerDoc[doc._id] === 0
      );

      if (missingFields.length > 0) {
        alert(
          `Please add signature fields to all documents. Missing: ${missingFields
            .map((d) => d.filename)
            .join(", ")}`
        );
        return;
      }

      setStep(4);
    } else if (step === 4) {
      await handleSendEnvelope();
    }
  };

  const handleSendEnvelope = async () => {
    setSending(true);

    try {
      const validRecipients = recipients.filter((r) => r.name && r.email);

      const res = await fetch("/api/envelope/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentIds: selectedDocs.map((d) => d._id),
          recipients: validRecipients,
          signatureFields: signatureFields,
          message: message,
          dueDate: dueDate,
          expirationDays: expirationDays,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send envelope");
      }

      const links = data.recipients.map((recipient: any) => ({
        recipient: recipient.name,
        email: recipient.email,
        link: `${window.location.origin}/envelope/${recipient.uniqueId}`,
        status: "pending",
      }));

      setGeneratedLinks(links);
      setShowSuccessDialog(true);
    } catch (err: any) {
      console.error("Error sending envelope:", err);
      alert(err.message || "Failed to send envelope");
    } finally {
      setSending(false);
    }
  };

  const handleDropField = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  const fieldType = e.dataTransfer.getData("fieldType") as
    | "signature"
    | "date"
    | "text"
    | "checkbox"
    | "attachment"
    | "dropdown"
    | "radio";

  const container = document.getElementById("pdf-container");
  if (!container || !currentDocument) return;

  const rect = container.getBoundingClientRect();
  
  //  Calculate position in millimeters
  const containerHeightMm = (currentDocument?.numPages || 1) * 297;
  const clickYMm = ((e.clientY - rect.top) / rect.height) * containerHeightMm;
  
  const pageHeightMm = 297;
  const pageNumber = Math.floor(clickYMm / pageHeightMm) + 1;
  const yPercent = ((clickYMm % pageHeightMm) / pageHeightMm) * 100;
  const x = ((e.clientX - rect.left) / rect.width) * 100;

  const newField: SignatureField = {
    id: Date.now(),
    documentId: currentDocument._id,
    type: fieldType,
    x: x,
    y: yPercent,
    page: pageNumber,
    recipientIndex: 0,
    width: fieldType === "signature" ? 200 : 150,
    height: fieldType === "signature" ? 60 : 40,
    label: fieldType === "checkbox" ? "Check this box" :
           fieldType === "dropdown" ? "Select an option" :
           fieldType === "radio" ? "Choose one option" :
           "",
    defaultChecked: false,
    attachmentLabel: fieldType === "attachment" ? "Upload Required Document" : undefined,
    attachmentType: fieldType === "attachment" ? "supporting_document" : undefined,
    isRequired: fieldType === "attachment" ? true : false,
    options: (fieldType === "dropdown" || fieldType === "radio") ? ["Option 1", "Option 2", "Option 3"] : undefined,
    defaultValue: undefined,
  };

  setSignatureFields([...signatureFields, newField]);
};


const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, field: SignatureField) => {
  const container = document.getElementById("pdf-container");
  if (!container || !currentDocument) return;

  const rect = container.getBoundingClientRect();
  
  // ✅ FIX: Use millimeters
  const containerHeightMm = (currentDocument?.numPages || 1) * 297;
  const clickYMm = ((e.clientY - rect.top) / rect.height) * containerHeightMm;
  
  const pageHeightMm = 297;
  const pageNumber = Math.floor(clickYMm / pageHeightMm) + 1;
  const yPercent = ((clickYMm % pageHeightMm) / pageHeightMm) * 100;
  const newX = ((e.clientX - rect.left) / rect.width) * 100;

  const updated = signatureFields.map((f) =>
    f.id === field.id ? { ...f, x: newX, y: yPercent, page: pageNumber } : f
  );
  setSignatureFields(updated);
};


  const currentDocument = selectedDocs[currentDocIndex] || null;
  const currentDocFields = signatureFields.filter(
    (f) => f.documentId === currentDocument?._id
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        
{spaceId && (
  <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/spaces/${spaceId}`)}
      className="gap-1"
    >
      <ArrowLeft className="h-3 w-3" />
      Back to Space
    </Button>
     
  </div>
)}
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  step === 1 ? router.push("/dashboard") : setStep(step - 1)
                }
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-purple-600" />
                  Create Envelope
                </h1>
                <p className="text-sm text-slate-500">
                  Bundle multiple documents - Step {step} of 4
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                onClick={handleContinue}
                disabled={sending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : step === 4 ? (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Envelope
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    s <= step ? "bg-purple-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Select Documents</span>
              <span>Add Recipients</span>
              <span>Place Fields</span>
              <span>Review & Send</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Select Documents for Envelope
              </h2>
              <p className="text-slate-600 mb-6">
                Choose at least 2 documents to bundle together. Recipients will sign all documents in one session.
              </p>

              {selectedDocs.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        {selectedDocs.length} document{selectedDocs.length > 1 ? "s" : ""} selected
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDocs([])}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDocuments.map((doc) => {
                  const isSelected = selectedDocs.find((d) => d._id === doc._id);
                  return (
                    <div
                      key={doc._id}
                      onClick={() => toggleDocSelection(doc)}
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-6 w-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {doc.originalFilename || doc.filename}
                          </p>
                          <p className="text-sm text-slate-500">
                            {doc.numPages} page{doc.numPages > 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              .{/*   UPLOAD SECTION - ADD THIS */}
              <div className="mt-8 mb-6">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                    uploadStatus === 'uploading'
                      ? 'border-purple-400 bg-purple-50'
                      : uploadStatus === 'success'
                      ? 'border-green-400 bg-green-50'
                      : uploadStatus === 'error'
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    {/* Upload Icon */}
                    {uploadStatus === 'uploading' ? (
                      <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
                    ) : uploadStatus === 'success' ? (
                      <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
                    ) : uploadStatus === 'error' ? (
                      <svg className="h-12 w-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <div className="relative mb-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Upload Text */}
                    <div className="space-y-2">
                      {uploadStatus === 'idle' ? (
                        <>
                          <h3 className="text-lg font-semibold text-slate-900">
                            Upload Additional Document
                          </h3>
                          <p className="text-sm text-slate-600">
                            Click to browse or drag and drop PDF files here
                          </p>
                          <p className="text-xs text-slate-500">
                            Maximum file size: 10MB
                          </p>
                        </>
                      ) : (
                        <p className={`text-sm font-medium ${
                          uploadStatus === 'uploading' ? 'text-purple-700' :
                          uploadStatus === 'success' ? 'text-green-700' :
                          'text-red-700'
                        }`}>
                          {uploadMessage}
                        </p>
                      )}
                    </div>

                    {/* Upload Button (Alternative to clicking area) */}
                    {uploadStatus === 'idle' && (
                      <Button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-4 bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {/* Sorting and Pagination Controls */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
  {/* Sorting Controls */}
  <div className="flex items-center gap-3">
    <Label className="text-sm font-medium">Sort by:</Label>
    <select
      value={sortBy}
      onChange={(e) => {
        setSortBy(e.target.value);
        setCurrentPage(1);
        fetchDocuments();
      }}
      className="h-9 rounded-md border border-slate-300 px-3 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
    >
      <option value="createdAt">Upload Date (Newest)</option>
      <option value="filename">Filename (A-Z)</option>
    </select>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        setSortOrder(sortOrder === 1 ? -1 : 1);
        setCurrentPage(1);
        fetchDocuments();
      }}
      className="gap-1 text-sm"
    >
      {sortOrder === 1 ? (
        <>
          <ChevronLeft className="h-4 w-4" />
          Ascending
        </>
      ) : (
        <>
          <ChevronRight className="h-4 w-4" />
          Descending
        </>
      )}
    </Button>
  </div>

  {/* Pagination Controls */}
  {allDocuments.length > 0 && (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Rows per page:</Label>
        <select
          value={documentsPerPage}
          onChange={(e) => {
            setDocumentsPerPage(Number(e.target.value));
            setCurrentPage(1);
            fetchDocuments();
          }}
          className="h-9 w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentPage((prev) => Math.max(prev - 1, 1));
            fetchDocuments();
          }}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentPage((prev) => prev + 1);
            fetchDocuments();
          }}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )}
</div>


              {allDocuments.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No documents found</p>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="mt-4"
                  >
                    Upload Documents
                  </Button>
                </div>
              )}
            </div>
            

          </div>
        )}

        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Add Recipients
              </h2>
              <p className="text-slate-600 mb-6">
                Who needs to sign this envelope? All recipients will sign all {selectedDocs.length} documents.
              </p>

              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Documents in this envelope:
                </p>
                <div className="space-y-2">
                  {selectedDocs.map((doc, index) => (
                    <div key={doc._id} className="flex items-center gap-2 text-sm">
                      <span className="h-6 w-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-slate-900">{doc.originalFilename || doc.filename}</span>
                      <span className="text-slate-500">({doc.numPages} pages)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div key={index} className="border rounded-lg p-6 bg-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-lg">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Full Name</Label>
                            <Input
                              value={recipient.name}
                              onChange={(e) => {
                                const updated = [...recipients];
                                updated[index].name = e.target.value;
                                setRecipients(updated);
                              }}
                              placeholder="John Doe"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={recipient.email}
                              onChange={(e) => {
                                const updated = [...recipients];
                                updated[index].email = e.target.value;
                                setRecipients(updated);
                              }}
                              placeholder="john@company.com"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Role (optional)</Label>
                          <Input
                            value={recipient.role || ""}
                            onChange={(e) => {
                              const updated = [...recipients];
                              updated[index].role = e.target.value;
                              setRecipients(updated);
                            }}
                            placeholder="e.g., Employee, Manager"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      {recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRecipients(recipients.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => {
                    setRecipients([...recipients, { name: "", email: "", role: "" }]);
                  }}
                  className="w-full border-dashed border-2 h-16"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Add Another Recipient
                </Button>
              </div>
            </div>
          </div>
        )}

{step === 3 && (
  <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
    {!currentDocument ? (
      <div className="col-span-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    ) : (
      <>
        {/* Left Sidebar - NOW STICKY */}
       <div className="col-span-3 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto sticky top-24 self-start" style={{ maxHeight: "calc(100vh - 8rem)" }}>
          <h3 className="font-bold text-slate-900 mb-6 text-lg">
            Signature Fields
          </h3>

              <div className="mb-6">
                <Label className="text-sm font-medium text-slate-700 mb-3 block">
                  Current Document
                </Label>
                <div className="space-y-2">
                  {selectedDocs.map((doc, index) => (
                    <button
                      key={doc._id}
                      onClick={async () => {
  setCurrentDocIndex(index);
  await fetchPdfForPreview(doc._id);
}}

                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        currentDocIndex === index
                          ? "bg-purple-100 border-purple-300"
                          : "bg-slate-50 border-slate-200 hover:border-purple-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-slate-500">
  {signatureFields.filter((f: SignatureField) => f.documentId === doc._id).length} fields
</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="text-sm font-medium text-slate-700 mb-3 block">
                  Recipients
                </Label>
                {recipients
                  .filter((r) => r.name && r.email)
                  .map((recipient, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg border mb-2">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {recipient.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {recipient.email}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Drag to Place
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", "signature")}
                >
                  <FileSignature className="h-5 w-5 mr-3" />
                  Signature Field
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", "date")}
                >
                  <Clock className="h-5 w-5 mr-3" />
                  Date Field
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("fieldType", "text")}
                >
                  <Edit className="h-5 w-5 mr-3" />
                  Text Field
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> Place signature fields on each document where recipients need to sign.
                </p>
              </div>
            </div>

           <div className="col-span-9 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto">
<div
  id="pdf-container"
  className="relative bg-slate-100 rounded-lg mx-auto"
  style={{ 
    width: "210mm", 
    minHeight: `${(currentDocument?.numPages || 1) * 297}mm` 
  }}
  onDragOver={(e) => e.preventDefault()}
  onDrop={handleDropField}
>

                {pdfUrls[currentDocument?._id] ? (
                  <>
                    <embed
                      src={`${pdfUrls[currentDocument._id]}#toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      className="w-full"
                      style={{
                        border: "none",
                        pointerEvents: "none",
                        height: `${297 * (currentDocument?.numPages || 1)}mm`,
                        display: "block",
                      }}
                    />

                    

                  
{/* Signature Field Overlays */}
  {signatureFields
    .filter((field) => field.documentId === currentDocument._id)
    .map((field) => {
      
      const pageHeightMm = 297; // A4 page height in mm
      const topPositionMm = (field.page - 1) * pageHeightMm + (field.y / 100) * pageHeightMm;
      const recipient = recipients[field.recipientIndex];

      return (
        <div
          key={field.id}
          className="absolute border-2 rounded cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50 pointer-events-auto"
          style={{
            left: `${field.x}%`,
            top: `${topPositionMm}mm`, 
            borderColor: recipient?.color || "#9333ea",
            width: `${field.width || 180}px`,
            height: `${field.height || 45}px`,
            transform: "translate(-50%, 0%)",
          }}
          draggable
          onDragEnd={(e) => handleDragEnd(e, field)}
        >
          <div className="h-full flex flex-col items-center justify-center px-2 relative">
            <select
              value={field.recipientIndex}
              onChange={(e) => {
                const updated = signatureFields.map((f) =>
                  f.id === field.id ? { ...f, recipientIndex: parseInt(e.target.value) } : f
                );
                setSignatureFields(updated);
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1 left-1 right-1 text-xs border rounded px-1 py-0.5 bg-white/90 backdrop-blur-sm transition-opacity cursor-pointer z-10"
              style={{ fontSize: "10px" }}
            >
              {recipients.map((r, idx) => (
                <option key={idx} value={idx}>
                  {r.name || `Recipient ${idx + 1}`}
                </option>
              ))}
            </select>

            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-1 mb-1">
                {field.type === "signature" && <FileSignature className="h-4 w-4" />}
                {field.type === "date" && <Clock className="h-4 w-4" />}
                {field.type === "text" && <Edit className="h-4 w-4" />}
                {field.type === "checkbox" && <CheckSquare className="h-4 w-4" />}
                {field.type === "attachment" && <Paperclip className="h-4 w-4" />}
                {field.type === "dropdown" && (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {field.type === "radio" && (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  </svg>
                )}
                <span className="text-xs font-semibold">
                  {field.type === "signature" ? "Sign Here" :
                   field.type === "date" ? "Date" :
                   field.type === "text" ? "Text" :
                   field.type === "checkbox" ? "Checkbox" :
                   field.type === "dropdown" ? (field.label || "Dropdown") :
                   field.type === "radio" ? (field.label || "Radio") :
                   field.type === "attachment" ? (field.attachmentLabel || "Upload File") :
                   "Text"}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate px-2">
                {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setSignatureFields(signatureFields.filter((f) => f.id !== field.id));
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    })}


                  </>
                ) : (
                  <div className="h-full flex items-center justify-center" style={{ minHeight: "297mm" }}>
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
                  </div>
               )}
              </div>
            </div>
          </>
        )}
      </div>
        )}

        {step === 4 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Review & Send Envelope
              </h2>
            <p className="text-slate-600 mb-8">
                Review everything before sending your signing package
              </p>

              {/* Documents */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Documents ({selectedDocs.length})
                </h3>
                <div className="space-y-2">
                  {selectedDocs.map((doc, index) => {
                    const docFields = signatureFields.filter((f: SignatureField) => f.documentId === doc._id);
                    return (
                      <div
                        key={doc._id}
                        className="p-4 border rounded-lg bg-slate-50 flex items-center gap-4"
                      >
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-sm">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {doc.originalFilename || doc.filename}
                          </p>
                          <p className="text-sm text-slate-600">
                            {doc.numPages} pages · {docFields.length} signature fields
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipients */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-slate-800">
                  Recipients ({recipients.filter((r: Recipient) => r.name && r.email).length})
                </h3>
                <div className="space-y-2">
                  {recipients
                    .filter((r: Recipient) => r.name && r.email)
                    .map((recipient: Recipient, index: number) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg bg-slate-50 flex items-center gap-4"
                      >
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{recipient.name}</p>
                          <p className="text-sm text-slate-600">{recipient.email}</p>
                          {recipient.role && (
                            <p className="text-xs text-slate-500 mt-0.5">{recipient.role}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Message & Settings */}
              <div className="space-y-4">
                <div>
                  <Label>Message to Recipients (optional)</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please review and sign these onboarding documents..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Due Date (optional)</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Link Expiration</Label>
                    <select
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 mt-1"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days (Recommended)</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Success Dialog */}
  <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-lg p-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl">
          <CheckCircle className="h-6 w-6 text-green-600" />
          Envelope Sent Successfully!
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 mt-4">
        <p className="text-slate-600">
          Your envelope with {selectedDocs.length} documents has been sent to{" "}
          {generatedLinks.length} recipient(s).
        </p>

        {/* Document List */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-semibold text-slate-900 mb-2">Documents:</h4>
          <ul className="space-y-1">
            {selectedDocs.map((doc, index) => (
              <li key={doc._id} className="text-sm text-slate-700">
                {index + 1}. {doc.originalFilename || doc.filename}
              </li>
            ))}
          </ul>
        </div>

        {/* Recipient Links */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Signing Links:</h4>
          <div className="space-y-3">
            {generatedLinks.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.recipient}</p>
                    <p className="text-sm text-slate-600">{item.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
  <Input
    value={item.link}
    readOnly
    className="text-sm font-mono bg-white flex-1"
  />
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      navigator.clipboard.writeText(item.link);
      alert('Link copied to clipboard!');
    }}
    className="flex-shrink-0"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  </Button>
</div>

              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowSuccessDialog(false);
              router.push("/SignatureDashboard");
            }}
            className="flex-1"
          >
            View Dashboard
          </Button>
          <Button
            onClick={() => {
              setShowSuccessDialog(false);
              // Reset form
              setStep(1);
              setSelectedDocs([]);
              setRecipients([{ name: "", email: "", role: "" }]);
              setSignatureFields([]);
              setMessage("");
              setDueDate("");
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            Create Another Envelope
          </Button>
           
<Button
  variant="outline"
  onClick={() => {
    setShowSuccessDialog(false);
    if (spaceId) {
      router.push(`/spaces/${spaceId}`); //   Return to space
    } else {
      router.push("/SignatureDashboard");
    }
  }}
  className="flex-1"
>
  {spaceId ? 'Back to Space' : 'View Dashboard'}
</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</div>
    );
}