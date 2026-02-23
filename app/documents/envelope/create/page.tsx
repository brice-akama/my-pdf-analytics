"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText, Plus, Trash2, Users, Mail, ChevronLeft, ChevronRight,
  Package, ArrowLeft, CheckCircle, Loader2, FileSignature, Clock,
  Edit, X, Settings, CheckSquare, Paperclip, Send, Eye, ChevronDown,
  Info, AlertCircle,
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
  const spaceId = searchParams?.get("spaceId");

  // Step: 1 = Add Recipients, 2 = Place Fields
  const [step, setStep] = useState(1);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [showEditRecipientDrawer, setShowEditRecipientDrawer] = useState(false);
  const [editingRecipientIndex, setEditingRecipientIndex] = useState<number | null>(null);
  const [editRecipientForm, setEditRecipientForm] = useState({ name: "", email: "", role: "" });
  const [fieldHistory, setFieldHistory] = useState<SignatureField[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<Document[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([{ name: "", email: "", role: "" }]);
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [expirationDays, setExpirationDays] = useState("30");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchPdfForPreview = async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/file?serve=blob`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrls(prev => ({ ...prev, [docId]: url }));
      }
    } catch (error) {
      console.error('Failed to fetch PDF:', error);
    }
  };

  const documentPageOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let cumulativePages = 0;
    selectedDocs.forEach(doc => {
      if (doc?._id && doc?.numPages) {
        offsets[doc._id] = cumulativePages;
        cumulativePages += doc.numPages;
      }
    });
    return offsets;
  }, [selectedDocs]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      if (preselectedDocIds.length > 0) {
        const docs = (await Promise.all(
          preselectedDocIds.map(id =>
            fetch(`/api/documents/${id}`, { credentials: "include" })
              .then(r => r.ok ? r.json() : null)
              .then(d => d?.success ? d.document : null)
          )
        )).filter(Boolean);
        if (docs.length > 0) {
          setSelectedDocs(docs);
          setAllDocuments(docs);
          setStep(1);
          setLoading(false);
          return;
        }
      }
      const res = await fetch(`/api/documents?page=1&limit=50&sortBy=createdAt&sortOrder=-1`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setAllDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  };

  // Undo/redo
  const saveToHistory = (fields: SignatureField[]) => {
    const newHistory = fieldHistory.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(fields)));
    setFieldHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSignatureFields(JSON.parse(JSON.stringify(fieldHistory[historyIndex - 1])));
    }
  };
  const handleRedo = () => {
    if (historyIndex < fieldHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSignatureFields(JSON.parse(JSON.stringify(fieldHistory[historyIndex + 1])));
    }
  };
  useEffect(() => {
    if (signatureFields.length > 0 && historyIndex === -1) saveToHistory(signatureFields);
  }, [signatureFields]);

  // Edit recipient
  const openEditRecipientDrawer = (index: number) => {
    const r = recipients[index];
    setEditRecipientForm({ name: r.name, email: r.email, role: r.role || "" });
    setEditingRecipientIndex(index);
    setShowEditRecipientDrawer(true);
  };
  const saveEditedRecipient = () => {
    if (editingRecipientIndex === null) return;
    if (!editRecipientForm.name.trim()) { alert("Name is required"); return; }
    if (!editRecipientForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editRecipientForm.email)) {
      alert("Valid email is required"); return;
    }
    const updated = [...recipients];
    updated[editingRecipientIndex] = editRecipientForm;
    setRecipients(updated);
    setShowEditRecipientDrawer(false);
    setEditingRecipientIndex(null);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Please upload a PDF file'); return; }
    setUploadStatus('uploading');
    setUploadMessage('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch("/api/upload", { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadStatus('success');
        setUploadMessage(`Uploaded ${file.name}`);
        await fetchDocuments();
        if (data.document?._id) setSelectedDocs(prev => [...prev, data.document]);
        setTimeout(() => { setUploadStatus('idle'); setUploadMessage(''); }, 3000);
      } else {
        setUploadStatus('error');
        setUploadMessage(data.message || 'Upload failed');
        setTimeout(() => { setUploadStatus('idle'); setUploadMessage(''); }, 3000);
      }
    } catch {
      setUploadStatus('error');
      setUploadMessage('Upload failed');
      setTimeout(() => { setUploadStatus('idle'); setUploadMessage(''); }, 3000);
    }
  };

  // Step 1 → Step 2
  const handleContinueToFields = async () => {
    const validRecipients = recipients.filter(r => r.name && r.email);
    if (validRecipients.length === 0) { alert("Please add at least one recipient"); return; }
    setStep(2);
    Promise.all(selectedDocs.map(doc => fetchPdfForPreview(doc._id))).catch(console.error);
  };

  // Send envelope
  const handleSendEnvelope = async () => {
    setSending(true);
    try {
      const validRecipients = recipients.filter(r => r.name && r.email);
      const res = await fetch("/api/envelope/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentIds: selectedDocs.map(d => d._id),
          recipients: validRecipients,
          signatureFields,
          message,
          dueDate,
          expirationDays,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to send envelope");
      setGeneratedLinks(data.recipients.map((r: any) => ({
        recipient: r.name,
        email: r.email,
        link: `${window.location.origin}/envelope/${r.uniqueId}`,
        status: "pending",
      })));
      setShowReviewDrawer(false);
      setShowSuccessDialog(true);
    } catch (err: any) {
      alert(err.message || "Failed to send envelope");
    } finally {
      setSending(false);
    }
  };

  const handleDropField = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData("fieldType") as SignatureField["type"];
    const container = document.getElementById("pdf-container");
    if (!container || !currentDocument) return;
    const rect = container.getBoundingClientRect();
    const containerHeightMm = (currentDocument?.numPages || 1) * 297;
    const clickYMm = ((e.clientY - rect.top) / rect.height) * containerHeightMm;
    const pageHeightMm = 297;
    const pageNumber = Math.floor(clickYMm / pageHeightMm) + 1;
    const yPercent = ((clickYMm % pageHeightMm) / pageHeightMm) * 100;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const newField: SignatureField = {
      id: Date.now(), documentId: currentDocument._id, type: fieldType,
      x, y: yPercent, page: pageNumber, recipientIndex: 0,
      width: fieldType === "signature" ? 200 : 150,
      height: fieldType === "signature" ? 60 : 40,
      label: fieldType === "checkbox" ? "Check this box" : fieldType === "dropdown" ? "Select an option" : fieldType === "radio" ? "Choose one option" : "",
      defaultChecked: false,
      attachmentLabel: fieldType === "attachment" ? "Upload Required Document" : undefined,
      attachmentType: fieldType === "attachment" ? "supporting_document" : undefined,
      isRequired: fieldType === "attachment",
      options: (fieldType === "dropdown" || fieldType === "radio") ? ["Option 1", "Option 2", "Option 3"] : undefined,
    };
    const updated = [...signatureFields, newField];
    setSignatureFields(updated);
    saveToHistory(updated);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, field: SignatureField) => {
    const container = document.getElementById("pdf-container");
    if (!container || !currentDocument) return;
    const rect = container.getBoundingClientRect();
    const containerHeightMm = (currentDocument?.numPages || 1) * 297;
    const clickYMm = ((e.clientY - rect.top) / rect.height) * containerHeightMm;
    const pageHeightMm = 297;
    const pageNumber = Math.floor(clickYMm / pageHeightMm) + 1;
    const yPercent = ((clickYMm % pageHeightMm) / pageHeightMm) * 100;
    const newX = ((e.clientX - rect.left) / rect.width) * 100;
    const updated = signatureFields.map(f => f.id === field.id ? { ...f, x: newX, y: yPercent, page: pageNumber } : f);
    setSignatureFields(updated);
    saveToHistory(updated);
  };

  const currentDocument = selectedDocs[currentDocIndex] || null;
  const validRecipients = recipients.filter(r => r.name && r.email);
  const totalFields = signatureFields.length;
  const missingFieldDocs = selectedDocs.filter(doc => !signatureFields.some(f => f.documentId === doc._id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">

          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => step === 1 ? router.push(spaceId ? `/spaces/${spaceId}` : "/documents-page") : setStep(1)}
              className="flex-shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-slate-900 truncate">Create Envelope</h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} · Step {step} of 2
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1">
              Step {step} of 2
            </span>
            {step === 2 && (
              <Button
                onClick={() => setShowReviewDrawer(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4 gap-2"
              >
                <Eye className="h-4 w-4" />
                Review & Send
              </Button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 md:px-6 pb-3">
          <div className="flex items-center gap-1.5">
            {[1, 2].map(s => (
              <div key={s} className={`flex-1 h-1 rounded-full transition-all duration-300 ${step >= s ? 'bg-purple-600' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* ── STEP 1: Add Recipients ── */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto pb-12">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Add Recipients</h2>
              <p className="text-sm text-slate-500 mt-1">
                Who needs to sign? They'll sign all {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} in this envelope.
              </p>
            </div>

            {/* Documents summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Envelope Documents</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                  {selectedDocs.length} docs
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {selectedDocs.map((doc, index) => (
                  <div key={doc._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.originalFilename || doc.filename}</p>
                      <p className="text-xs text-slate-400">{doc.numPages} page{doc.numPages !== 1 ? 's' : ''}</p>
                    </div>
                    <FileText className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Recipients</h3>
                <p className="text-xs text-slate-400 mt-0.5">Add everyone who needs to sign this envelope</p>
              </div>
              <div className="divide-y divide-slate-100">
                {recipients.map((recipient, index) => (
                  <div key={index} className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {recipient.name || `Recipient ${index + 1}`}
                      </p>
                      {recipients.length > 1 && (
                        <button
                          onClick={() => setRecipients(recipients.filter((_, i) => i !== index))}
                          className="ml-auto text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={recipient.name}
                          onChange={e => { const u = [...recipients]; u[index].name = e.target.value; setRecipients(u); }}
                          placeholder="John Doe"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={recipient.email}
                          onChange={e => { const u = [...recipients]; u[index].email = e.target.value; setRecipients(u); }}
                          placeholder="john@company.com"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                          Role <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={recipient.role || ""}
                          onChange={e => { const u = [...recipients]; u[index].role = e.target.value; setRecipients(u); }}
                          placeholder="e.g. Employee, Manager, Client"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={() => setRecipients([...recipients, { name: "", email: "", role: "" }])}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Recipient
                </button>
              </div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(spaceId ? `/spaces/${spaceId}` : "/documents-page")}
                className="rounded-xl border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinueToFields}
                disabled={validRecipients.length === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Place Signature Fields
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>

          </div>
        )}

        {/* ── STEP 2: Place Fields ── */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[calc(100vh-130px)]">

            {/* LEFT SIDEBAR */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[calc(100vh-130px)] overflow-hidden">

              {/* Sidebar header */}
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">Signature Fields</h3>
                  {/* Undo/redo */}
                  <div className="flex items-center gap-1">
                    <button onClick={handleUndo} disabled={historyIndex <= 0}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button onClick={handleRedo} disabled={historyIndex >= fieldHistory.length - 1}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{totalFields} field{totalFields !== 1 ? 's' : ''} placed across {selectedDocs.length} doc{selectedDocs.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">

                {/* Documents list */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Documents</p>
                  <div className="space-y-1.5">
                    {selectedDocs.map((doc, index) => {
                      const docFieldCount = signatureFields.filter(f => f.documentId === doc._id).length;
                      const isActive = currentDocIndex === index;
                      return (
                        <button
                          key={doc._id}
                          onClick={async () => { setCurrentDocIndex(index); await fetchPdfForPreview(doc._id); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                            isActive ? 'bg-purple-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-purple-100'}`}>
                            <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-purple-700'}`}>{index + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                              {doc.filename}
                            </p>
                            <p className={`text-xs ${isActive ? 'text-purple-200' : 'text-slate-400'}`}>
                              {docFieldCount} field{docFieldCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {docFieldCount === 0 && !isActive && (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recipients */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recipients</p>
                    <button onClick={() => openEditRecipientDrawer(0)}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {validRecipients.map((r, i) => (
                      <button key={i} onClick={() => openEditRecipientDrawer(i)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left transition-colors group">
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-purple-700">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{r.name}</p>
                          <p className="text-xs text-slate-400 truncate">{r.email}</p>
                        </div>
                        <Edit className="h-3 w-3 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field types to drag */}
                <div className="px-4 pt-3 pb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Drag to Place</p>
                  <div className="space-y-1.5">
                    {[
                      { type: "signature", icon: <FileSignature className="h-3.5 w-3.5" />, label: "Signature" },
                      { type: "date", icon: <Clock className="h-3.5 w-3.5" />, label: "Date" },
                      { type: "text", icon: <Edit className="h-3.5 w-3.5" />, label: "Text" },
                      { type: "checkbox", icon: <CheckSquare className="h-3.5 w-3.5" />, label: "Checkbox" },
                      { type: "attachment", icon: <Paperclip className="h-3.5 w-3.5" />, label: "Attachment" },
                    ].map(({ type, icon, label }) => (
                      <div
                        key={type}
                        draggable
                        onDragStart={e => e.dataTransfer.setData("fieldType", type)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50 cursor-grab active:cursor-grabbing transition-all text-slate-600 hover:text-purple-600"
                      >
                        {icon}
                        <span className="text-xs font-medium">{label} Field</span>
                        <span className="ml-auto text-xs text-slate-300">drag</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Review & Send button pinned at bottom */}
              <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                {missingFieldDocs.length > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-3">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      {missingFieldDocs.length} doc{missingFieldDocs.length !== 1 ? 's' : ''} missing fields
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => setShowReviewDrawer(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Review & Send
                </Button>
              </div>
            </div>

            {/* RIGHT — PDF Canvas */}
            <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {currentDocument?.filename || 'Document Preview'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {signatureFields.filter(f => f.documentId === currentDocument?._id).length} fields on this document
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  <span>Drag fields from the left panel onto the document</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
                {!currentDocument ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    <div
                      id="pdf-container"
                      className="relative bg-white rounded-xl shadow-sm overflow-hidden"
                      style={{ minHeight: `${(currentDocument?.numPages || 1) * 297}mm` }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={handleDropField}
                    >
                      {pdfUrls[currentDocument._id] ? (
                        <>
                          <embed
                            src={`${pdfUrls[currentDocument._id]}#toolbar=0&navpanes=0&scrollbar=0`}
                            type="application/pdf"
                            className="w-full border-0"
                            style={{
                              height: `${297 * (currentDocument?.numPages || 1)}mm`,
                              display: "block",
                              pointerEvents: "none",
                            }}
                          />
                          {/* Field overlays */}
                          {signatureFields.filter(f => f.documentId === currentDocument._id).map(field => {
                            const pageHeightMm = 297;
                            const topPositionMm = (field.page - 1) * pageHeightMm + (field.y / 100) * pageHeightMm;
                            const recipient = recipients[field.recipientIndex];
                            return (
                              <div
                                key={field.id}
                                className="absolute border-2 rounded-lg cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50 pointer-events-auto"
                                style={{
                                  left: `${field.x}%`,
                                  top: `${topPositionMm}mm`,
                                  borderColor: recipient?.color || "#7c3aed",
                                  width: `${field.width || 180}px`,
                                  height: `${field.height || 45}px`,
                                  transform: "translate(-50%, 0%)",
                                }}
                                draggable
                                onDragEnd={e => handleDragEnd(e, field)}
                              >
                                {/* Recipient label */}
                                <div className="absolute -top-5 left-0 text-xs font-semibold px-1.5 py-0.5 rounded-t whitespace-nowrap"
                                  style={{ backgroundColor: recipient?.color || "#7c3aed", color: "white" }}>
                                  {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
                                </div>
                                <div className="h-full flex flex-col items-center justify-center px-2 relative">
                                  <select
                                    value={field.recipientIndex}
                                    onChange={e => {
                                      const updated = signatureFields.map(f =>
                                        f.id === field.id ? { ...f, recipientIndex: parseInt(e.target.value) } : f
                                      );
                                      setSignatureFields(updated);
                                    }}
                                    onClick={e => e.stopPropagation()}
                                    className="absolute top-0.5 left-1 right-1 text-xs border rounded px-1 py-0.5 bg-white/90 z-10 cursor-pointer"
                                    style={{ fontSize: "9px" }}
                                  >
                                    {recipients.map((r, idx) => (
                                      <option key={idx} value={idx}>{r.name || `Recipient ${idx + 1}`}</option>
                                    ))}
                                  </select>
                                  <div className="flex items-center gap-1 mt-3">
                                    {field.type === "signature" && <FileSignature className="h-3.5 w-3.5 text-slate-500" />}
                                    {field.type === "date" && <Clock className="h-3.5 w-3.5 text-slate-500" />}
                                    {field.type === "text" && <Edit className="h-3.5 w-3.5 text-slate-500" />}
                                    {field.type === "checkbox" && <CheckSquare className="h-3.5 w-3.5 text-slate-500" />}
                                    {field.type === "attachment" && <Paperclip className="h-3.5 w-3.5 text-slate-500" />}
                                    <span className="text-xs font-semibold text-slate-600">
                                      {field.type === "signature" ? "Sign Here" : field.type === "date" ? "Date" : field.type === "text" ? "Text" : field.type === "checkbox" ? "Checkbox" : field.type === "attachment" ? "Upload" : field.type}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10 flex items-center justify-center"
                                  onClick={e => { e.stopPropagation(); setSignatureFields(signatureFields.filter(f => f.id !== field.id)); }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="flex items-center justify-center" style={{ minHeight: "297mm" }}>
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Loading document...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════
          REVIEW & SEND BOTTOM DRAWER
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showReviewDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewDrawer(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col"
              style={{ maxHeight: '85vh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-slate-200" />
              </div>

              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Review & Send Envelope</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} · {validRecipients.length} recipient{validRecipients.length !== 1 ? 's' : ''} · {totalFields} field{totalFields !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewDrawer(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer body — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Warning if missing fields */}
                {missingFieldDocs.length > 0 && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Missing signature fields</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        {missingFieldDocs.map(d => d.filename).join(', ')} {missingFieldDocs.length === 1 ? 'has' : 'have'} no fields placed. You can still send but recipients may have nothing to sign.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Left column */}
                  <div className="space-y-4">

                    {/* Documents */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Documents</h4>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {selectedDocs.map((doc, index) => {
                          const count = signatureFields.filter(f => f.documentId === doc._id).length;
                          return (
                            <div key={doc._id} className="flex items-center gap-3 px-4 py-3">
                              <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{doc.originalFilename || doc.filename}</p>
                                <p className="text-xs text-slate-400">{doc.numPages} pages · {count} field{count !== 1 ? 's' : ''}</p>
                              </div>
                              {count === 0 && <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                              {count > 0 && <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recipients */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Recipients</h4>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {validRecipients.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-purple-700">{i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
                              <p className="text-xs text-slate-400 truncate">{r.email}</p>
                            </div>
                            {r.role && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">{r.role}</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right column — settings */}
                  <div className="space-y-4">

                    {/* Message */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Message to Recipients <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Please review and sign these documents..."
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    {/* Due date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Due Date <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Expiration */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Link Expiration
                      </label>
                      <select
                        value={expirationDays}
                        onChange={e => setExpirationDays(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days (Recommended)</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                      </select>
                    </div>

                    {/* Info box */}
                    <div className="flex items-start gap-2.5 px-3 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">
                        Each recipient will receive one email with a unique link to sign all {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} in sequence.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              {/* Drawer footer — Send button */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReviewDrawer(false)}
                  className="rounded-xl border-slate-200 text-slate-600"
                >
                  Back to Editing
                </Button>
                <Button
                  onClick={handleSendEnvelope}
                  disabled={sending || validRecipients.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-2 h-11 text-sm font-semibold"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Envelope...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send for Signature
                    </>
                  )}
                </Button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          SUCCESS DIALOG
      ══════════════════════════════════════════ */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white rounded-2xl">
          <DialogHeader className="px-6 py-5 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">Envelope Sent!</DialogTitle>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} sent to {generatedLinks.length} recipient{generatedLinks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Signing Links</h4>
              <div className="space-y-3">
                {generatedLinks.map((item, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.recipient}</p>
                        <p className="text-xs text-slate-400">{item.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={item.link}
                        readOnly
                        className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
                      />
                      <button
                        onClick={() => { navigator.clipboard.writeText(item.link); }}
                        className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-purple-100 hover:text-purple-600 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => { setShowSuccessDialog(false); router.push(spaceId ? `/spaces/${spaceId}` : "/SignatureDashboard"); }}
              className="flex-1 rounded-xl border-slate-200"
            >
              {spaceId ? 'Back to Space' : 'View Dashboard'}
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                setStep(1);
                setSelectedDocs([]);
                setRecipients([{ name: "", email: "", role: "" }]);
                setSignatureFields([]);
                setMessage("");
                setDueDate("");
                setGeneratedLinks([]);
              }}
              className="flex-1 bg-purple-600 hover:bg-purple-700 rounded-xl"
            >
              Create Another
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════
          EDIT RECIPIENT DRAWER
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showEditRecipientDrawer && editingRecipientIndex !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowEditRecipientDrawer(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Edit Recipient</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Recipient #{editingRecipientIndex + 1}</p>
                </div>
                <button onClick={() => setShowEditRecipientDrawer(false)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input type="text" value={editRecipientForm.name}
                    onChange={e => setEditRecipientForm({ ...editRecipientForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                  <input type="email" value={editRecipientForm.email}
                    onChange={e => setEditRecipientForm({ ...editRecipientForm, email: e.target.value })}
                    placeholder="john@company.com"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Role <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="text" value={editRecipientForm.role}
                    onChange={e => setEditRecipientForm({ ...editRecipientForm, role: e.target.value })}
                    placeholder="e.g. Employee, Manager"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="flex items-start gap-2.5 px-3 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    This person will receive a unique link to sign all {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} in the envelope.
                  </p>
                </div>
              </div>
              <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
                <button onClick={() => setShowEditRecipientDrawer(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveEditedRecipient}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-medium text-white transition-colors">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}