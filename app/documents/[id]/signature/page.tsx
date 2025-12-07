  //app/documents/[id]/signature/page.tsx
 
 "use client";
import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


import {
  FileSignature,
  Clock,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Trash2,
  Mail,
  ArrowLeft,
  FileText,
} from "lucide-react";
type DocumentType = {
  _id: string;
  filename: string;
  numPages: number;
  isTemplate?: boolean;
};
type Recipient = {
  name: string;
  email: string;
  role?: string;
  color?: string;
};
type SignatureField = {
  id: string | number;
  type: "signature" | "date" | "text";
  x: number;
  y: number;
  page: number;
  recipientIndex: number;
  width?: number;
  height?: number;
};
type SignatureRequest = {
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  dueDate?: string;
  isTemplate: boolean;
  step: number;
  recipients: Recipient[];
  signatureFields: SignatureField[];
   viewMode?: 'isolated' | 'shared'; // ADD THIS
    signingOrder?: 'any' | 'sequential'; // ⭐ ADD THIS
    expirationDays?: string; // ⭐ ADD THIS
};
export default function ESignaturePage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const searchParams = useSearchParams();
const mode = searchParams?.get('mode'); // 'edit' or 'send'
const [generatedLinks, setGeneratedLinks] = useState<Array<{ recipient: string; email: string; link: string; status: string }>>([]);

  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest>({
    recipientEmail: "",
    recipientName: "",
    message: "",
    dueDate: "",
    isTemplate: false,
    step: 1,
    recipients: [],
    signatureFields: [],
  });
  useEffect(() => {
    fetchDocument();
  }, [params.id]);


  useEffect(() => {
    if (doc && signatureRequest.step === 2 && !pdfUrl) {
      fetchPdfForPreview();
    }
  }, [doc, signatureRequest.step]);

  const fetchDocument = async () => {
  try {
    const res = await fetch(`/api/documents/${params.id}`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setDoc(data.document);
        
        // ⭐ CHECK: Is this already a template?
       if (data.document.isTemplate) {
  // Load existing template configuration
  const templateRes = await fetch(`/api/documents/${params.id}/template`, {
    credentials: "include",
  });
  if (templateRes.ok) {
    const templateData = await templateRes.json();
    setSignatureRequest({
      recipientEmail: "",
      recipientName: "",
      message: "",
      dueDate: "",
      step: 1,
      recipients: templateData.template.recipients || [],
      signatureFields: templateData.template.signatureFields || [],
      isTemplate: mode !== 'send', // ⭐ Only template mode if NOT sending
      viewMode: 'isolated',
    });
  }
} else {
  // ⭐ NEW DOCUMENT
  setSignatureRequest({
    recipientEmail: "",
    recipientName: "",
    message: "",
    dueDate: "",
    step: 1,
    recipients: [
      { name: "Recipient 1", email: "", role: "Signer", color: "#9333ea" },
    ],
    signatureFields: [],
    isTemplate: mode !== 'send', // ⭐ Template mode ONLY if mode is 'edit'
    viewMode: 'isolated',
  });
}
      }
    }
  } catch (error) {
    console.error("Failed to fetch document:", error);
  } finally {
    setLoading(false);
  }
};


  const fetchPdfForPreview = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}/file?page=${currentPage}&serve=blob`, {
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      }
    } catch (error) {
      console.error("Failed to fetch PDF:", error);
    }
  };


  const handleSendSignature = async () => {
  const validRecipients = signatureRequest.recipients.filter(
    (r) => r.name && r.email
  );
  if (validRecipients.length === 0 && !signatureRequest.isTemplate) {
    alert("Please add at least one recipient with name and email");
    return;
  }
  setIsSending(true);
  try {
    if (signatureRequest.isTemplate) {
      // Save as template
      const response = await fetch(`/api/documents/${doc?._id}/template`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureFields: signatureRequest.signatureFields,
          recipients: signatureRequest.recipients,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("✅ Document converted to signable template!");
         window.location.href = `/documents/${doc?._id}`; // Force full page reload
      } else {
        alert(data.message || "Failed to save template");
      }
    } else {
      // Send signature request
      const response = await fetch("/api/signature/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc?._id,
          recipients: signatureRequest.recipients,
          signatureFields: signatureRequest.signatureFields,
          message: signatureRequest.message,
          dueDate: signatureRequest.dueDate,
          viewMode: signatureRequest.viewMode || 'isolated', // ADD THIS
          signingOrder: signatureRequest.signingOrder || 'any', //   ADD THIS
          expirationDays: signatureRequest.expirationDays || '30', //   ADD THIS
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Use the `uniqueId` from the response to construct the signing link
        interface SignatureRequestResponse {
            recipient: string;
            email: string;
            uniqueId: string;
            status: string;
        }

        interface GeneratedLink {
            recipient: string;
            email: string;
            link: string;
            status: string;
        }

        const links: GeneratedLink[] = (data.signatureRequests as SignatureRequestResponse[]).map((request) => ({
            recipient: request.recipient,
            email: request.email,
            link: `${window.location.origin}/sign/${request.uniqueId}?recipient=${request.email}`,
            status: request.status,
        }));
        setGeneratedLinks(links);
        setShowSuccessDialog(true);
      } else {
        alert(data.message || "Failed to send signature request");
      }
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to process request");
  } finally {
    setIsSending(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Document not found</h2>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/documents/${doc._id}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{doc.filename}</h1>
<p className="text-sm text-slate-500">
  {mode === 'edit' ? "Edit Template" : "Request Signatures"} - Step{" "}
  {signatureRequest.step} of 3
</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {signatureRequest.step > 1 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setSignatureRequest({ ...signatureRequest, step: signatureRequest.step - 1 })
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
             {signatureRequest.step < 3 ? (
  <Button
    onClick={() => {
      if (signatureRequest.step === 1) {
        const validRecipients = signatureRequest.recipients.filter(
          (r) => r.name && (mode === 'send' ? r.email : true) // ⭐ Require email only in 'send' mode
        );
        if (validRecipients.length === 0) {
          alert(mode === 'send' ? 'Please add recipient emails' : 'Please add at least one role');
          return;
        }
      }
      setSignatureRequest({ ...signatureRequest, step: signatureRequest.step + 1 });
    }}
    className="bg-purple-600 hover:bg-purple-700"
  >
    Continue
    <ChevronRight className="h-4 w-4 ml-2" />
  </Button>
) : (
  <Button
    onClick={handleSendSignature}
    disabled={isSending}
    className="bg-purple-600 hover:bg-purple-700"
  >
    {isSending ? (
      <>
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
        {mode === 'send' ? 'Sending...' : 'Saving...'} {/* ⭐ Dynamic text */}
      </>
    ) : (
      <>
        {mode === 'send' ? ( // ⭐ Check mode here
          <>
            <Mail className="h-4 w-4 mr-2" />
            Send Request  {/* ⭐ When sending to recipients */}
          </>
        ) : (
          <>
            <FileSignature className="h-4 w-4 mr-2" />
            Save as Template  {/* ⭐ When creating/editing template */}
          </>
        )}
      </>
    )}
  </Button>
)}
            </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                signatureRequest.step >= 1 ? "bg-purple-600" : "bg-slate-200"
              }`}
            />
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                signatureRequest.step >= 2 ? "bg-purple-600" : "bg-slate-200"
              }`}
            />
            <div
              className={`flex-1 h-2 rounded-full transition-all ${
                signatureRequest.step >= 3 ? "bg-purple-600" : "bg-slate-200"
              }`}
            />
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Step 1: Recipients */}
        {signatureRequest.step === 1 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-8">
             <h2 className="text-2xl font-bold text-slate-900 mb-2">
  {signatureRequest.isTemplate ? 'Define Recipient Roles' : 'Who needs to sign?'}
</h2>
<p className="text-slate-600 mb-6">
  {signatureRequest.isTemplate
    ? 'Add roles (e.g., "Signer 1", "Signer 2") and place fields. You’ll assign real recipients when sending.'
    : 'Add recipients and set signing order'}
</p>

              <div className="space-y-4">
                {signatureRequest.recipients.map((recipient, index) => (
                  <div key={index} className="border rounded-lg p-6 bg-slate-50">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-lg">{index + 1}</span>
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Full Name</Label>
                            <Input
                              value={recipient.name}
                              onChange={(e) => {
                                const updated = [...signatureRequest.recipients];
                                updated[index].name = e.target.value;
                                setSignatureRequest({ ...signatureRequest, recipients: updated });
                              }}
                              placeholder="John Doe"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>
    Email Address {signatureRequest.isTemplate && ' (optional)'}
  </Label>
                            <Input
    type="email"
    value={recipient.email}
    onChange={(e) => {
      const updated = [...signatureRequest.recipients];
      updated[index].email = e.target.value;
      setSignatureRequest({ ...signatureRequest, recipients: updated });
    }}
    placeholder={signatureRequest.isTemplate ? "Optional - leave blank" : "john@company.com"}
    className="mt-1"
  />
                          </div>
                        </div>
                        <div>
                          <Label>Role (optional)</Label>
                          <Input
                            value={recipient.role || ""}
                            onChange={(e) => {
                              const updated = [...signatureRequest.recipients];
                              updated[index].role = e.target.value;
                              setSignatureRequest({ ...signatureRequest, recipients: updated });
                            }}
                            placeholder="e.g., Client, Manager"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = signatureRequest.recipients.filter((_, i) => i !== index);
                          setSignatureRequest({ ...signatureRequest, recipients: updated });
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const updated = [
                      ...signatureRequest.recipients,
                      {
                        name: "",
                        email: "",
                        role: "",
                        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                      },
                    ];
                    setSignatureRequest({ ...signatureRequest, recipients: updated });
                  }}
                  className="w-full border-dashed border-2 h-16"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Add Another Recipient
                </Button>
                 

<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
  <div className="flex items-center justify-between">
    <div>
      <Label className="text-sm font-medium text-slate-900">
        Signature View Mode
      </Label>
      <p className="text-xs text-slate-600 mt-1">
        Choose how recipients view signatures
      </p>
    </div>
    <select
      value={signatureRequest.viewMode || 'isolated'}
      onChange={(e) =>
        setSignatureRequest({
          ...signatureRequest,
          viewMode: e.target.value as 'isolated' | 'shared',
        })
      }
      className="border rounded-lg px-3 py-2 text-sm"
    >
      <option value="isolated">Isolated - Each sees only their fields</option>
      <option value="shared">Shared - All see all signatures</option>
    </select>
  </div>
</div>
{/* ⭐ NEW: Add Signing Order Toggle */}
<div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
  <div className="flex items-center justify-between">
    <div>
      <Label className="text-sm font-medium text-slate-900">
        Signing Order
      </Label>
      <p className="text-xs text-slate-600 mt-1">
        Require recipients to sign in order?
      </p>
    </div>
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="signingOrder"
          value="any"
          checked={signatureRequest.signingOrder !== 'sequential'}
          onChange={() =>
            setSignatureRequest({
              ...signatureRequest,
              signingOrder: 'any',
            })
          }
          className="w-4 h-4 text-purple-600"
        />
        <span className="text-sm">Any Order</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="signingOrder"
          value="sequential"
          checked={signatureRequest.signingOrder === 'sequential'}
          onChange={() =>
            setSignatureRequest({
              ...signatureRequest,
              signingOrder: 'sequential',
            })
          }
          className="w-4 h-4 text-purple-600"
        />
        <span className="text-sm">Sequential Order</span>
      </label>
    </div>
  </div>
  {signatureRequest.signingOrder === 'sequential' && (
    <div className="mt-3 bg-white rounded-lg p-3 border border-amber-300">
      <p className="text-xs text-amber-800">
        📋 Recipients will sign in the order listed above. Each person gets notified only after the previous person signs.
      </p>
    </div>
  )}
</div>
              </div>
              {mode === 'send' && (
  <div className="mt-8 pt-8 border-t space-y-4">
    <div>
      <Label>Message to Recipients (optional)</Label>
      <Textarea
        value={signatureRequest.message}
        onChange={(e) =>
          setSignatureRequest({ ...signatureRequest, message: e.target.value })
        }
        placeholder="Please review and sign this document..."
        rows={4}
        className="mt-1"
      />
    </div>
    <div>
      <Label>Due Date (optional)</Label>
      <Input
        type="date"
        value={signatureRequest.dueDate}
        onChange={(e) =>
          setSignatureRequest({ ...signatureRequest, dueDate: e.target.value })
        }
        min={new Date().toISOString().split("T")[0]}
        className="mt-1"
      />
    </div>
    {/* After Due Date field, add this: */}
<div>
  <Label>Link Expiration</Label>
  <select
    value={signatureRequest.expirationDays || '30'}
    onChange={(e) =>
      setSignatureRequest({ 
        ...signatureRequest, 
        expirationDays: e.target.value 
      })
    }
    className="mt-1 w-full border rounded-lg px-3 py-2"
  >
    <option value="7">7 days</option>
    <option value="14">14 days</option>
    <option value="30">30 days (Recommended)</option>
    <option value="60">60 days</option>
    <option value="90">90 days</option>
    <option value="never">Never expire</option>
  </select>
  <p className="text-xs text-slate-500 mt-1">
    Signing links will expire after this period for security
  </p>
</div>
  </div>
)}
            </div>
          </div>
        )}
        {/* Step 2: Place Signature Fields */}
        {signatureRequest.step === 2 && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
            {/* Left Sidebar - Field Tools */}
            <div className="col-span-3 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">Signature Fields</h3>
              {/* Recipients */}
              <div className="space-y-3 mb-6">
                <Label className="text-sm font-medium text-slate-700">Recipients</Label>
                {signatureRequest.recipients.map((recipient, index) => {
                  const fieldCount = signatureRequest.signatureFields.filter(
                    (f) => f.recipientIndex === index
                  ).length;
                  return (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: recipient.color }}
                        />
                        <span className="text-sm font-medium text-slate-900 truncate flex-1">
                          {recipient.name || `Recipient ${index + 1}`}
                        </span>
                        {fieldCount > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                            {fieldCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{recipient.email}</p>
                    </div>
                  );
                })}
                {signatureRequest.isTemplate && (
  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-xs text-blue-800">
      💡 <strong>Tip:</strong> Place signature fields for each recipient role. When you send this template later, you'll just enter real names and emails!
    </p>
  </div>
)}
              </div>
              {/* Field Types */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Drag to Place</Label>
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
              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <Label className="text-sm font-medium text-slate-700">Quick Actions</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const newFields: SignatureField[] = signatureRequest.recipients.map(
                      (_, index) => ({
                        id: Date.now() + index,
                        type: "signature",
                        x: 25,
                        y: 60 + index * 15,
                        page: 1,
                        recipientIndex: index,
                      })
                    );
                    setSignatureRequest({
                      ...signatureRequest,
                      signatureFields: [...signatureRequest.signatureFields, ...newFields],
                    });
                  }}
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  Auto-place Signatures
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (window.confirm("Remove all fields from this page?")) {
                      const updated = signatureRequest.signatureFields.filter(
                        (f) => f.page !== currentPage
                      );
                      setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                    }
                  }}
                  disabled={
                    signatureRequest.signatureFields.filter((f) => f.page === currentPage)
                      .length === 0
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear This Page
                </Button>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> Drag field types onto the document where you want
                  recipients to sign, date, or enter text.
                </p>
              </div>
            </div>
            {/* Center - PDF Document */}
            <div className="col-span-9 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto">
              <div
                id="pdf-container"
                className="relative bg-slate-100 rounded-lg mx-auto"
                style={{ width: "210mm", minHeight: `${297 * (doc.numPages || 1)}mm` }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const fieldType = e.dataTransfer.getData("fieldType") as
                    | "signature"
                    | "date"
                    | "text";
                  const container = document.getElementById("pdf-container");
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const pageHeight = 297 * 3.78;
                  const pageNumber = Math.floor(y / pageHeight) + 1;
                  const yPercent = ((y % pageHeight) / pageHeight) * 100;
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const newField: SignatureField = {
                    id: Date.now(),
                    type: fieldType,
                    x: x,
                    y: yPercent,
                    page: pageNumber,
                    recipientIndex: 0,
                  };
                  setSignatureRequest({
                    ...signatureRequest,
                    signatureFields: [...signatureRequest.signatureFields, newField],
                  });
                }}
              >
                {pdfUrl ? (
                  <>
                    <embed
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      type="application/pdf"
                      className="w-full"
                      style={{
                        border: "none",
                        pointerEvents: "none",
                        height: `${297 * (doc.numPages || 1)}mm`,
                        display: "block",
                      }}
                    />
                    {/* Signature Field Overlays */}
                    {signatureRequest.signatureFields.map((field) => {
                      const pageHeight = 297 * 3.78;
                      const topPosition =
                        (field.page - 1) * pageHeight + (field.y / 100) * pageHeight;
                      const recipient = signatureRequest.recipients[field.recipientIndex];
                      return (
                        <div
                          key={field.id}
                          className="absolute border-2 rounded cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50"
                          style={{
                            left: `${field.x}%`,
                            top: `${topPosition}px`,
                            borderColor: recipient?.color || "#9333ea",
                            width: field.type === "signature" ? "180px" : "140px",
                            height: field.type === "signature" ? "70px" : "45px",
                            transform: "translate(-50%, 0%)",
                          }}
                          draggable
                          onDragEnd={(e) => {
                            const container = document.getElementById("pdf-container");
                            if (!container) return;
                            const rect = container.getBoundingClientRect();
                            const y = e.clientY - rect.top;
                            const pageHeight = 297 * 3.78;
                            const pageNumber = Math.floor(y / pageHeight) + 1;
                            const yPercent = ((y % pageHeight) / pageHeight) * 100;
                            const newX = ((e.clientX - rect.left) / rect.width) * 100;
                            const updated = signatureRequest.signatureFields.map((f) =>
                              f.id === field.id ? { ...f, x: newX, y: yPercent, page: pageNumber } : f
                            );
                            setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                          }}
                        >
                          <div className="h-full flex flex-col items-center justify-center px-2 relative">
                            <select
                              value={field.recipientIndex}
                              onChange={(e) => {
                                const updated = signatureRequest.signatureFields.map((f) =>
                                  f.id === field.id
                                    ? { ...f, recipientIndex: parseInt(e.target.value) }
                                    : f
                                );
                                setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-1 left-1 right-1 text-xs border rounded px-1 py-0.5 bg-white/90 backdrop-blur-sm transition-opacity cursor-pointer z-10"
                              style={{ fontSize: "10px" }}
                            >
                              {signatureRequest.recipients.map((r, idx) => (
                                <option key={idx} value={idx}>
                                  {r.name || `Recipient ${idx + 1}`}
                                </option>
                              ))}
                            </select>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                {field.type === "signature" && (
                                  <FileSignature className="h-4 w-4" />
                                )}
                                {field.type === "date" && <Clock className="h-4 w-4" />}
                                {field.type === "text" && <Edit className="h-4 w-4" />}
                                <span className="text-xs font-semibold">
                                  {field.type === "signature"
                                    ? "Sign Here"
                                    : field.type === "date"
                                    ? "Date"
                                    : "Text"}
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
                                const updated = signatureRequest.signatureFields.filter(
                                  (f) => f.id !== field.id
                                );
                                setSignatureRequest({ ...signatureRequest, signatureFields: updated });
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
                    <div className="text-center">
                      <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-slate-600 font-medium">Loading document...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Step 3: Review & Send */}
        {signatureRequest.step === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
  {mode === 'edit' ? 'Review Template' : 'Review & Send'}
</h2>
<p className="text-slate-600 mb-8">
  {mode === 'edit'
    ? 'Review your template configuration. You can reuse this template to send documents quickly.'
    : 'Double-check everything before sending your signature request'
  }
</p>
              <div className="space-y-6">
                {/* Recipients Review */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Recipients</h3>
                  {signatureRequest.recipients.length > 0 ? (
                    <div className="space-y-3">
                      {signatureRequest.recipients.map((recipient, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg bg-slate-50 flex items-center gap-4"
                        >
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: recipient.color }}
                          >
                            <span className="text-white font-bold text-sm">
                              {recipient.name?.charAt(0) || index + 1}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">
                              {recipient.name || `Recipient ${index + 1}`}
                            </p>
                            <p className="text-sm text-slate-600">{recipient.email}</p>
                            {recipient.role && (
                              <p className="text-xs text-slate-500 mt-0.5">{recipient.role}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No recipients added.</p>
                  )}
                </div>

                {/* Message & Due Date Review */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Message</h3>
                  {signatureRequest.message ? (
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {signatureRequest.message}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No message added.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Due Date</h3>
                  {signatureRequest.dueDate ? (
                    <div className="p-4 border rounded-lg bg-slate-50">
                      <p className="text-sm text-slate-700">
                        {new Date(signatureRequest.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No due date set.</p>
                  )}
                </div>

                {/* Signature Fields Review */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Signature Fields</h3>
                  {signatureRequest.signatureFields.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {signatureRequest.signatureFields.map((field) => {
                        const recipient = signatureRequest.recipients[field.recipientIndex];
                        return (
                          <div
                            key={field.id}
                            className="p-4 border rounded-lg bg-slate-50 flex items-center gap-3"
                          >
                            <div
                              className="h-8 w-8 rounded-full flex-shrink-0"
                              style={{ backgroundColor: recipient?.color || "#9333ea" }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {field.type === "signature"
                                  ? "Signature"
                                  : field.type === "date"
                                  ? "Date"
                                  : "Text"}{" "}
                                - Page {field.page}
                              </p>
                              <p className="text-xs text-slate-600">
                                {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No signature fields added.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Success Dialog with Generated Links */}
<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white flex flex-col scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">

    <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <DialogTitle className="text-xl font-semibold text-slate-900">Signature Request Sent!</DialogTitle>
          <p className="text-sm text-slate-600 mt-1">
            Emails have been sent to all recipients with their signing links
          </p>
        </div>
      </div>
    </DialogHeader>
    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Document Summary */}
      <div className="bg-slate-50 rounded-lg p-4 border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{doc.filename}</p>
            <p className="text-sm text-slate-500">
              Sent to {(generatedLinks || []).length} recipient(s)
            </p>
          </div>
        </div>
      </div>
      {/* Recipients and Their Links */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Signing Links Generated</h3>
        <div className="space-y-3">
          {(generatedLinks || []).map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white hover:border-purple-300 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-semibold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{item.recipient}</p>
                    <p className="text-sm text-slate-600">{item.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Unique Signing Link */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <Label className="text-xs font-medium text-slate-700 mb-2 block">
                  Unique Signing Link
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={item.link}
                    readOnly
                    className="flex-1 text-sm font-mono bg-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(item.link ?? "");
                      alert('Link copied to clipboard!');
                    }}
                    className="flex-shrink-0"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(item.link, '_blank');
                    }}
                    className="flex-shrink-0"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  💡 This unique link has been emailed to {item.recipient}. You can also share it manually.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* What Happens Next */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What happens next?
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">✓</span>
            <span>Each recipient will receive an email with their unique signing link</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">✓</span>
            <span>They can click the link to view and sign the document</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">✓</span>
            <span>You'll receive notifications when each person signs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">✓</span>
            <span>Track signing status in your dashboard</span>
          </li>
        </ul>
      </div>
    </div>
    {/* Footer Actions */}
    <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
      <Button
        variant="outline"
        onClick={() => {
          // Copy all links
          const allLinks = (generatedLinks || [])
            .map((item) => `${item.recipient} (${item.email}): ${item.link}`)
            .join('\n\n');
          navigator.clipboard.writeText(allLinks);
          alert('All links copied to clipboard!');
        }}
      >
        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy All Links
      </Button>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setShowSuccessDialog(false);
            // Reset signature request
            setSignatureRequest({
              recipientEmail: '',
              recipientName: '',
              message: '',
              dueDate: '',
              step: 1,
              recipients: [],
              signatureFields: [],
              isTemplate: false,
            });
          }}
        >
          Close
        </Button>
        <Button
  onClick={() => {
    setShowSuccessDialog(false);
    router.push("/SignatureDashboard");
  }}
  className="bg-purple-600 hover:bg-purple-700"
>
  Track Status
</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}