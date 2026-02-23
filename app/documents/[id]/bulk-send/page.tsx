//app/documents/[id]/bulk-send/page.tsx

"use client";

import { useState, useEffect,  useCallback  } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Users,
  Edit,
  Eye,
  FileText,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  ArrowLeft,
  Info,
  Clock,
} from "lucide-react";

import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
// Types
type BulkRecipient = {
  name: string;
  email: string;
  customFields: Record<string, string>;
  validationErrors?: string[];
};

type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

type BulkSendStatus = {
  batchId: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  status: "processing" | "completed" | "failed";
  failedRecipients?: Array<{
    email: string;
    name: string;
    error: string;
  }>;
};

type DocumentType = {
  numPages: number;
  _id: string;
  filename: string;
  isTemplate: boolean;
  templateConfig?: {
    signatureFields: any[];
    recipients: any[];
  };
};

function RecipientSearch({
  recipients,
  selectedIndex,
  onSelect,
}: {
  recipients: BulkRecipient[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = recipients
    .map((r, i) => ({ ...r, originalIndex: i }))
    .filter(r =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase())
    )

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoFocus
      />
      {query && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-400">No recipients found</p>
          ) : (
            filtered.map(r => (
              <button
                key={r.originalIndex}
                onClick={() => onSelect(r.originalIndex)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors ${
                  selectedIndex === r.originalIndex ? 'bg-purple-50' : ''
                }`}
              >
                <span className="text-xs font-bold text-purple-600 w-5">{r.originalIndex + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400 truncate">{r.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function BulkSendPage() {
  const params = useParams();
  const router = useRouter();

  // State
  const [doc, setDoc] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [recipients, setRecipients] = useState<BulkRecipient[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<BulkSendStatus | null>(null);
  const [message, setMessage] = useState("");
  const [expirationDays, setExpirationDays] = useState("30");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
const [showEditDrawer, setShowEditDrawer] = useState(false);
const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
const [showRecipientPickerDrawer, setShowRecipientPickerDrawer] = useState(false)
const [editingRecipientIndex, setEditingRecipientIndex] = useState<number | null>(null);
const [editForm, setEditForm] = useState({ name: "", email: "", customFields: {} as Record<string, string> });
const [templateConfig, setTemplateConfig] = useState<any>(null);
const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [previewRecipientIndex, setPreviewRecipientIndex] = useState(0)
const [generatedLinks, setGeneratedLinks] = useState<Array<{
  recipient: string;
  email: string;
  link: string;
  status: string;
}>>([])
const [ccRecipientsList, setCcRecipientsList] = useState<Array<{name: string; email: string}>>([])
const [ccInput, setCcInput] = useState('')

const addCcRecipient = () => {
  const parts = ccInput.split(',').map(s => s.trim())
  const name = parts[0] || ''
  const email = parts[1] || parts[0] || ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) return
  if (ccRecipientsList.some(cc => cc.email === email)) return

  setCcRecipientsList(prev => [...prev, {
    name: name !== email ? name : email.split('@')[0],
    email,
  }])
  setCcInput('')
}

// ⭐ STEP 1: Save draft to localStorage
const saveDraft = useCallback(() => {
  const draftKey = `bulk_send_draft_${params.id}`;
  
  // Don't save if nothing to save
  if (!csvText && recipients.length === 0) return false;
  
  // Don't save if already sent
  if (showSuccessDialog) return false;

  try {
    const draft = {
      csvText,
      recipients,
      message,
      expirationDays,
      step,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
    console.log('💾 [BULK SEND] Draft saved');
    return true;
  } catch (error) {
    console.error('❌ [BULK SEND] Failed to save draft:', error);
    return false;
  }
}, [params.id, csvText, recipients, message, expirationDays, step, showSuccessDialog]);

// ⭐ STEP 2: Load draft from localStorage
const loadDraft = useCallback(() => {
  const draftKey = `bulk_send_draft_${params.id}`;
  
  try {
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) {
      console.log('ℹ️ [BULK SEND] No saved draft found');
      return;
    }

    const draft = JSON.parse(savedDraft);
    
    // Calculate how long ago
    const savedAt = new Date(draft.savedAt);
    const minutesAgo = Math.floor((Date.now() - savedAt.getTime()) / 60000);

    // Ask user if they want to restore
    const shouldRestore = window.confirm(
      `📋 Found a saved draft from ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago on this device.\n\n` +
      `Recipients: ${draft.recipients.length}\n` +
      `Step: ${draft.step} of 2\n\n` +
      `Note: Drafts are saved on this device only.\n\n` +
      `Continue where you left off?`
    );

    if (!shouldRestore) {
      localStorage.removeItem(draftKey);
      return;
    }

    // ✅ Restore state
    console.log('✅ [BULK SEND] Restoring draft...');
    setCsvText(draft.csvText || "");
    setRecipients(draft.recipients || []);
    setMessage(draft.message || "");
    setExpirationDays(draft.expirationDays || "30");
    setStep(draft.step || 1);
    setLastSaved(savedAt);
    
    // Re-validate if recipients exist
    if (draft.recipients.length > 0) {
      const allErrors = draft.recipients.flatMap((r: BulkRecipient) => r.validationErrors || []);
      const duplicateEmails = findDuplicateEmails(draft.recipients);
      
      setValidation({
        valid: allErrors.length === 0 && duplicateEmails.length === 0,
        errors: [...allErrors, ...duplicateEmails],
        warnings: [],
      });
    }
    
    console.log('✅ [BULK SEND] Draft restored');
  } catch (error) {
    console.error('❌ [BULK SEND] Failed to load draft:', error);
  }
}, [params.id]);

// ⭐ STEP 3: Clear draft
const clearDraft = useCallback(() => {
  const draftKey = `bulk_send_draft_${params.id}`;
  localStorage.removeItem(draftKey);
  console.log('🗑️ [BULK SEND] Draft cleared');
}, [params.id]);

  // Fetch document
  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDoc(data.document);

          // Check if document is a template
          if (!data.document.isTemplate) {
            alert(
              "This document is not a template. Please convert it to a signable template first."
            );
            router.push(`/documents/${params.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
    } finally {
      setLoading(false);
    }
  };


  // ⭐ Load draft on mount
useEffect(() => {
  if (!loading && doc) {
    loadDraft();
  }
}, [loading, doc, loadDraft]);

// ⭐ Auto-save every 10 seconds
useEffect(() => {
  if (!doc) return;
  if (showSuccessDialog) return;

  const autoSave = () => {
    setAutoSaveStatus('saving');
    const success = saveDraft();
    if (success) {
      setAutoSaveStatus('saved');
      setLastSaved(new Date());
    } else {
      setAutoSaveStatus('error');
    }
    
    setTimeout(() => setAutoSaveStatus('idle'), 2000);
  };

  const interval = setInterval(autoSave, 10000);
  return () => clearInterval(interval);
}, [doc, csvText, recipients, message, expirationDays, step, showSuccessDialog, saveDraft]);

// ⭐ Save before page unload
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if ((csvText || recipients.length > 0) && !showSuccessDialog) {
      saveDraft();
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [csvText, recipients, showSuccessDialog, saveDraft]);

  // ⭐ Open edit drawer with pre-filled data
const openEditDrawer = (index: number) => {
  const recipient = recipients[index];
  setEditForm({
    name: recipient.name,
    email: recipient.email,
    customFields: { ...recipient.customFields },
  });
  setEditingRecipientIndex(index);
  setShowEditDrawer(true);
};

// ⭐ Save edited recipient
const saveEditedRecipient = () => {
  if (editingRecipientIndex === null) return;

  // Validate
  if (!editForm.name.trim()) {
    alert("Name is required");
    return;
  }
  if (!editForm.email.trim() || !isValidEmail(editForm.email)) {
    alert("Valid email is required");
    return;
  }

  // Update recipient
  const updatedRecipients = [...recipients];
  updatedRecipients[editingRecipientIndex] = {
    name: editForm.name,
    email: editForm.email,
    customFields: editForm.customFields,
  };
  setRecipients(updatedRecipients);
  setShowEditDrawer(false);
  setEditingRecipientIndex(null);
};

// ⭐ Fetch template configuration for preview
const fetchTemplateConfig = async () => {
  try {
    const res = await fetch(`/api/documents/${params.id}/template`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setTemplateConfig(data.template);
    }
  } catch (error) {
    console.error("Failed to fetch template config:", error);
  }
};

// ⭐ Load template on component mount
useEffect(() => {
  if (doc?.isTemplate) {
    fetchTemplateConfig();
  }
}, [doc]);


  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file");
      return;
    }

    setCsvFile(file);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  // Parse and validate CSV
  const handleParseCsv = () => {
    if (!csvText.trim()) {
      alert("Please upload or paste CSV data");
      return;
    }

    try {
      // Parse CSV using PapaParse
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      if (result.errors.length > 0) {
        console.error("CSV Parse errors:", result.errors);
        alert(
          `CSV parsing errors found:\n${result.errors
            .map((e) => e.message)
            .join("\n")}`
        );
        return;
      }

      const data = result.data as Record<string, string>[];

      if (data.length === 0) {
        alert("No data found in CSV");
        return;
      }

      // Validate required columns
      const headers = Object.keys(data[0]);
      if (!headers.includes("name") && !headers.includes("Name")) {
        alert('CSV must contain a "name" or "Name" column');
        return;
      }
      if (!headers.includes("email") && !headers.includes("Email")) {
        alert('CSV must contain an "email" or "Email" column');
        return;
      }

      // Parse recipients
      const parsed: BulkRecipient[] = data.map((row, index) => {
        const name = row.name || row.Name || "";
        const email = row.email || row.Email || "";

        // Get custom fields (all columns except name and email)
        const customFields: Record<string, string> = {};
        Object.keys(row).forEach((key) => {
          if (
            key.toLowerCase() !== "name" &&
            key.toLowerCase() !== "email"
          ) {
            customFields[key] = row[key];
          }
        });

        // Validation errors
        const validationErrors: string[] = [];
        if (!name) validationErrors.push(`Row ${index + 1}: Missing name`);
        if (!email) validationErrors.push(`Row ${index + 1}: Missing email`);
        if (email && !isValidEmail(email)) {
          validationErrors.push(`Row ${index + 1}: Invalid email format`);
        }

        return {
          name,
          email,
          customFields,
          validationErrors,
        };
      });

      // Overall validation
      const allErrors = parsed.flatMap((r) => r.validationErrors || []);
      const duplicateEmails = findDuplicateEmails(parsed);

      const validationResult: ValidationResult = {
        valid: allErrors.length === 0 && duplicateEmails.length === 0,
        errors: [...allErrors, ...duplicateEmails],
        warnings: [],
      };

      // Add warnings for missing custom fields
      const firstRecipient = parsed[0];
      // Custom fields are optional — no warning needed

      setRecipients(parsed);
      setValidation(validationResult);

      if (validationResult.valid) {
        setStep(2);
      }
    } catch (error) {
      console.error("CSV parsing error:", error);
      alert("Failed to parse CSV. Please check the format.");
    }
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Find duplicate emails
  const findDuplicateEmails = (
    recipients: BulkRecipient[]
  ): string[] => {
    const emails = recipients.map((r) => r.email.toLowerCase());
    const duplicates = emails.filter(
      (email, index) => emails.indexOf(email) !== index
    );
    return duplicates.length > 0
      ? [`Duplicate emails found: ${duplicates.join(", ")}`]
      : [];
  };

  // Handle bulk send
  const handleBulkSend = async () => {
  if (recipients.length === 0) {
    alert("No recipients to send to");
    return;
  }
  if (!doc) {
    alert("Document not loaded");
    return;
  }
  setIsSending(true);
  setStep(3);
  try {
    const res = await fetch(`/api/documents/${params.id}/bulk-send`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipients,
        message,
        expirationDays: parseInt(expirationDays),
        ccRecipients: ccRecipientsList,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      console.log("✅ Bulk send initiated:", data.batchId);

      

      setSendStatus({
        batchId: data.batchId,
        total: recipients.length,
        sent: 0,
        failed: 0,
        pending: recipients.length,
        status: "processing",
      });
      // Start polling for status
      pollSendStatus(data.batchId);
    } else {
      alert(data.message || "Failed to initiate bulk send");
      setIsSending(false);
      setStep(2);
    }
  } catch (error) {
    console.error("Bulk send error:", error);
    alert("Failed to initiate bulk send");
    setIsSending(false);
    setStep(2);
  }
};

  // Poll send status
 const pollSendStatus = async (batchId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`/api/bulk-send/${batchId}/status`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSendStatus(data.status);

        // ✅ Fetch the actual signature requests to get real links
        if (data.status.status === "completed" || data.status.status === "failed") {
          clearInterval(pollInterval);
          setIsSending(false);

          // ✅ NEW: Fetch actual signature requests with real links
          try {
            const linksRes = await fetch(`/api/bulk-send/${batchId}/links`, {
              credentials: "include",
            });
            if (linksRes.ok) {
              const linksData = await linksRes.json();
              if (linksData.success && linksData.links) {
                setGeneratedLinks(linksData.links);
              }
            }
          } catch (error) {
            console.error("Failed to fetch signing links:", error);
          }

          setShowSuccessDialog(true);
           clearDraft();
        }
      }
    } catch (error) {
      console.error("Status polling error:", error);
    }
  }, 2000);
  
  setTimeout(() => clearInterval(pollInterval), 300000);
};


  // Download sample CSV
  const downloadSampleCsv = () => {
const csv = `name,email,role
John Doe,john@company.com,Software Engineer
Jane Smith,jane@company.com,Product Manager
Bob Wilson,bob@company.com,Designer`

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_send_sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Document not found
          </h2>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div className="flex h-16 items-center justify-between px-4 md:px-6 gap-4">

    {/* Left — back + title */}
    <div className="flex items-center gap-3 min-w-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/documents/${doc._id}`)}
        className="flex-shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="min-w-0">
        <h1 className="text-base font-semibold text-slate-900 truncate max-w-xs">
          Bulk Send
        </h1>
        <p className="text-xs text-slate-400 truncate hidden sm:block">
          {doc.filename}
        </p>
      </div>
    </div>

    {/* Right — autosave + step */}
    <div className="flex items-center gap-3 flex-shrink-0">
      {autoSaveStatus === 'saving' && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="hidden sm:inline">Saving...</span>
        </div>
      )}
      {autoSaveStatus === 'saved' && lastSaved && (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="hidden sm:inline">Draft saved</span>
        </div>
      )}
      {autoSaveStatus === 'error' && (
        <div className="flex items-center gap-1.5 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          <span className="hidden sm:inline">Save failed</span>
        </div>
      )}
     <span className="text-xs text-slate-400 border border-slate-200 rounded-lg px-2.5 py-1">
  Step {step} of 2
</span>
    </div>
  </div>

  {/* Progress bar */}
  <div className="px-4 md:px-6 pb-3">
    <div className="flex items-center gap-1.5">
      {[1, 2].map((s) => (
        <div
          key={s}
          className={`flex-1 h-1 rounded-full transition-all duration-300 ${
            step >= s ? 'bg-purple-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  </div>
</header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Upload CSV */}
        {step === 1 && (
  <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-12">

    {/* Heading */}
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-900">Upload Recipients</h2>
      <p className="text-sm text-slate-500 mt-1">
        Upload a CSV file with recipient information to send in bulk
      </p>
    </div>

    {/* CSV Format info */}
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">CSV Format Requirements</h3>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-xs text-slate-500">
          Required columns: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">name</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">email</code>. Add any extra columns as custom fields (title, salary, etc.).
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadSampleCsv}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-xs h-8 gap-2"
        >
          <Download className="h-3.5 w-3.5" />
          Download Sample CSV
        </Button>
      </div>
    </div>

    {/* Upload source — File or Google Drive */}
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Upload CSV</h3>
        <p className="text-xs text-slate-400 mt-0.5">Choose where to get your CSV file from</p>
      </div>
      <div className="p-5 space-y-3">

        {/* Two source options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* From File */}
          <label
            htmlFor="csv-upload"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-purple-100 flex items-center justify-center flex-shrink-0 transition-colors">
              <Upload className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {csvFile ? csvFile.name : 'From Device'}
              </p>
              <p className="text-xs text-slate-500">Upload a .csv file</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
          </label>

          {/* From Google Drive */}
          <button
            onClick={() => {
              // TODO: Google Drive picker integration
              const picker = window.open(
                'https://drive.google.com/drive/my-drive',
                'Google Drive',
                'width=800,height=600'
              )
            }}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group text-left"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035z" fill="#4285F4"/>
                <path d="M9.982 17l-4.018 6.515h8.071L18.053 17H9.982z" fill="#34A853"/>
                <path d="M18.053 17l4.018-6.77-4.018-6.745L14.035 10l4.018 7z" fill="#FBBC04"/>
                <path d="M3.982 15L7.964 8.23 3.946 1.485 0 8.23 3.982 15z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Google Drive</p>
              <p className="text-xs text-slate-500">Import from Drive</p>
            </div>
          </button>

        </div>
      </div>
    </div>

    {/* Paste CSV */}
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Or Paste CSV Data</h3>
      </div>
      <div className="p-5">
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"name,email,title\nJohn Doe,john@company.com,Engineer\nJane Smith,jane@company.com,Manager"}
          rows={6}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>
    </div>

    {/* Validation errors */}
    {validation && !validation.valid && (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-red-700">Validation Errors</h3>
        </div>
        <div className="px-5 pb-4 space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-xs text-red-600">• {error}</p>
          ))}
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={() => router.push(`/documents/${doc._id}`)}
        className="rounded-xl border-slate-200 text-slate-600"
      >
        Cancel
      </Button>
      <Button
        onClick={handleParseCsv}
        disabled={!csvText.trim()}
        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5"
      >
        Parse & Validate
        <ChevronRight className="h-4 w-4 ml-1.5" />
      </Button>
    </div>

  </div>
)}

        {/* Step 2: Review Recipients */}
       {step === 2 && (
  <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-auto lg:h-[calc(100vh-130px)]">

    {/* LEFT — Recipients sidebar */}
    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col    max-h-[calc(100vh-130px)] scrollball  overflow-auto">

      {/* Sidebar header */}
     <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-sm font-semibold text-slate-900">Recipients</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
              {recipients.length} total
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">Each will receive a unique signing link</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setShowRecipientPickerDrawer(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 text-xs font-medium transition-colors"
                title="Browse recipients"
              >
                <Users className="h-3 w-3" />
                <span>Browse</span>
              </button>
              <button
                onClick={() => setShowEditDrawer(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 text-xs font-medium transition-colors"
                title="Edit recipients"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>

      {/* Validation success */}
      {validation?.valid && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
          <p className="text-xs font-medium text-green-800">All recipients valid</p>
        </div>
      )}

      {/* Warnings */}
      {validation?.warnings && validation.warnings.length > 0 && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">{validation.warnings[0]}</p>
        </div>
      )}

    {/* Recipients list — compact summary + open drawer */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Selected recipient preview card */}
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Previewing document for:</p>
          <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{previewRecipientIndex + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-purple-900 truncate">
                {recipients[previewRecipientIndex]?.name}
              </p>
              <p className="text-xs text-purple-500 truncate">
                {recipients[previewRecipientIndex]?.email}
              </p>
            </div>
          </div>
        </div>

        {/* All recipients — scrollable compact list */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-600">All Recipients</p>
            <button
              onClick={() => setShowRecipientPickerDrawer(true)}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Browse all →
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {recipients.map((recipient, index) => (
              <button
                key={`sidebar-${index}-${recipient.email}`}
                onClick={() => setPreviewRecipientIndex(index)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                  previewRecipientIndex === index
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className={`text-xs font-bold w-5 flex-shrink-0 ${
                  previewRecipientIndex === index ? 'text-white' : 'text-purple-600'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${
                    previewRecipientIndex === index ? 'text-white' : 'text-slate-800'
                  }`}>
                    {recipient.name}
                  </p>
                  <p className={`text-xs truncate ${
                    previewRecipientIndex === index ? 'text-purple-200' : 'text-slate-400'
                  }`}>
                    {recipient.email}
                  </p>
                </div>
                {previewRecipientIndex === index && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      

     {/* Message, expiry & CC */}
      <div className="border-t border-slate-100 p-4 space-y-3 overflow-y-auto flex-shrink-0" style={{ maxHeight: '340px' }}>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Message <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please review and sign..."
            rows={2}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Link Expiration
          </label>
          <select
            value={expirationDays}
            onChange={(e) => setExpirationDays(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days (Recommended)</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>

        {/* CC Recipients */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            CC Recipients <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Notified when each recipient signs
          </p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCcRecipient()
                }
              }}
              placeholder="name, email"
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={addCcRecipient}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors"
            >
              Add
            </button>
          </div>
          {ccRecipientsList.length > 0 && (
            <div className="space-y-1.5">
              {ccRecipientsList.map((cc, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{cc.name}</p>
                    <p className="text-xs text-slate-400 truncate">{cc.email}</p>
                  </div>
                  <button
                    onClick={() => setCcRecipientsList(prev => prev.filter((_, i) => i !== idx))}
                    className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Send button */}
      <div className="px-4 pb-4 pt-2 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setStep(1)}
          className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleBulkSend}
          disabled={isSending || recipients.length === 0}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-1.5" />
              Send to {recipients.length}
            </>
          )}
        </Button>
      </div>

    </div>

    {/* RIGHT — PDF preview with field overlays */}
    <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

      {/* PDF header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Document Preview</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {templateConfig?.signatureFields?.length || 0} signature field{(templateConfig?.signatureFields?.length || 0) !== 1 ? 's' : ''} placed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            Template
          </span>
        </div>
      </div>

      {/* PDF with overlays */}
      <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
        <div className="max-w-3xl mx-auto">

          {/* Info tip */}
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-white border border-slate-200 rounded-xl">
            <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500">
              The colored boxes show where signatures will be placed. Click <strong className="text-slate-600">Browse</strong> in the sidebar to switch between recipients and see how each person's document will look.
            </p>
          </div>

          {/* PDF container */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden relative">
            <div
              className="relative"
              style={{ minHeight: `${297 * ((doc?.numPages || 1) * 3.78)}px` }}
            >
              <embed
                src={`/api/documents/${params.id}/file?serve=blob#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                type="application/pdf"
                className="w-full border-0"
                style={{
                  height: `${297 * ((doc?.numPages || 1) * 3.78)}px`,
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />

              {/* Field overlays */}
              <div className="absolute inset-0 pointer-events-none">
                {templateConfig?.signatureFields?.map((field: any, idx: number) => {
                  const pageHeight = 297 * 3.78
                  const topPosition = (field.page - 1) * pageHeight + (field.y / 100) * pageHeight
                 // Use real CSV recipient name if available, fall back to template config
                  const templateRecipient = templateConfig.recipients?.[field.recipientIndex]
                 const csvRecipient = recipients[previewRecipientIndex]
                  const displayName = csvRecipient?.name || templateRecipient?.name || `Recipient ${field.recipientIndex + 1}`
                  const displayColor = templateRecipient?.color || '#9333ea'

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="absolute rounded-lg border-2 bg-white/90 shadow-sm"
                      style={{
                        left: `${field.x}%`,
                        top: `${topPosition}px`,
                        width: field.type === 'signature' ? '140px' : '120px',
                        height: field.type === 'signature' ? '50px' : '36px',
                        transform: 'translate(-50%, 0%)',
                        borderColor: displayColor,
                      }}
                    >
                      {/* Recipient label */}
                      <div
                        className="absolute -top-5 left-0 text-xs font-semibold px-1.5 py-0.5 rounded-t whitespace-nowrap"
                        style={{
                          backgroundColor: displayColor,
                          color: 'white',
                        }}
                      >
                        {displayName}
                      </div>
                      <div className="h-full flex items-center justify-center px-2">
                        <span className="text-xs font-semibold text-slate-600 truncate">
                          {field.type === 'signature' ? '✍️ Signature'
                            : field.type === 'date' ? '📅 Date'
                            : field.type === 'text' ? '📝 Text'
                            : field.type === 'checkbox' ? '☑️ Checkbox'
                            : field.type === 'attachment' ? '📎 Attachment'
                            : field.type}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

  </div>
)}
        {/* Step 3: Sending Progress */}
       {step === 3 && sendStatus && (
  <div className="w-full max-w-2xl mx-auto px-4 sm:px-0 pb-12">

    {/* Status heading */}
    <div className="mb-6">
      {sendStatus.status === 'processing' && (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sending Requests…</h2>
            <p className="text-xs text-slate-400 mt-0.5">Please keep this page open</p>
          </div>
        </div>
      )}
      {sendStatus.status === 'completed' && (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">All Requests Sent!</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recipients have been emailed their signing links</p>
          </div>
        </div>
      )}
      {sendStatus.status === 'failed' && (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Send Failed</h2>
            <p className="text-xs text-slate-400 mt-0.5">Some requests could not be delivered</p>
          </div>
        </div>
      )}
    </div>

    {/* Progress bar (only while processing) */}
    {sendStatus.status === 'processing' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Processing</span>
            <span className="text-xs text-slate-400">
              {sendStatus.sent + sendStatus.failed} of {sendStatus.total}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{
                width: `${((sendStatus.sent + sendStatus.failed) / sendStatus.total) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            This may take a moment depending on the number of recipients
          </p>
        </div>
      </div>
    )}

    {/* Stats cards */}
    <div className="grid grid-cols-4 gap-3 mb-4">
      {[
        {
          label: 'Total',
          value: sendStatus.total,
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-900',
        },
        {
          label: 'Sent',
          value: sendStatus.sent,
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
        },
        {
          label: 'Pending',
          value: sendStatus.pending,
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
        },
        {
          label: 'Failed',
          value: sendStatus.failed,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
        },
      ].map(({ label, value, bg, border, text }) => (
        <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
          <p className={`text-2xl font-bold ${text}`}>{value}</p>
          <p className={`text-xs mt-0.5 ${text} opacity-80`}>{label}</p>
        </div>
      ))}
    </div>

    {/* Failed recipients */}
    {sendStatus.failedRecipients && sendStatus.failedRecipients.length > 0 && (
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">
            Failed Recipients ({sendStatus.failedRecipients.length})
          </h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
          {sendStatus.failedRecipients.map((failed, index) => (
            <div key={index} className="px-5 py-3 flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{failed.name}</p>
                <p className="text-xs text-slate-400 truncate">{failed.email}</p>
                <p className="text-xs text-red-500 mt-0.5">{failed.error}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* What happens next (completed only) */}
    {sendStatus.status === 'completed' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">What happens next?</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            'Each recipient received an email with their unique signing link',
            'You\'ll get notified when each person signs',
            'Track all signing status from your dashboard',
            'Download completed documents once everyone has signed',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3">
              <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <p className="text-sm text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Actions */}
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={() => router.push(`/documents/${doc._id}`)}
        className="rounded-xl border-slate-200 text-slate-600"
      >
        Back to Document
      </Button>

      {sendStatus.failed > 0 && sendStatus.failedRecipients && (
        <Button
          variant="outline"
          onClick={async () => {
            const failedList = sendStatus.failedRecipients!.map(f => ({
              name: f.name,
              email: f.email,
              customFields: {},
            }))
            setRecipients(failedList)
            setStep(2)
            setSendStatus(null)
            setIsSending(false)
          }}
          className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
        >
          Retry {sendStatus.failed} Failed
        </Button>
      )}

      {sendStatus.status === 'completed' && (
        <Button
          onClick={() => router.push('/SignatureDashboard')}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5"
        >
          View Dashboard
          <ChevronRight className="h-4 w-4 ml-1.5" />
        </Button>
      )}
    </div>

  </div>
)}
      </main>
 {/* Add the Dialog component at the end of your return statement */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white flex flex-col scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                  <p className="font-medium text-slate-900">{doc?.filename}</p>
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.status === "Sent" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.status === "Sent" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
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
                            navigator.clipboard.writeText(item.link);
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
                <Info className="h-5 w-5 text-blue-600" />
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

     {/* ==================== EDIT RECIPIENTS DRAWER ==================== */}
<AnimatePresence>
  {showEditDrawer && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          setShowEditDrawer(false)
          setEditingRecipientIndex(null)
        }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Edit Recipients</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingRecipientIndex !== null
                ? `Editing recipient ${editingRecipientIndex + 1} of ${recipients.length}`
                : `${recipients.length} recipients`}
            </p>
          </div>
          <button
            onClick={() => {
              setShowEditDrawer(false)
              setEditingRecipientIndex(null)
            }}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {editingRecipientIndex === null ? (
          /* ── LIST VIEW — all recipients ── */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <p className="text-xs text-slate-400 mb-3">
                Click any recipient to edit their details
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {recipients.map((recipient, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setEditForm({
                      name: recipient.name,
                      email: recipient.email,
                      customFields: { ...recipient.customFields },
                    })
                    setEditingRecipientIndex(index)
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{recipient.name}</p>
                    <p className="text-xs text-slate-400 truncate">{recipient.email}</p>
                    {Object.keys(recipient.customFields).length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {Object.entries(recipient.customFields).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-300 flex-shrink-0">
                    <Edit className="h-3.5 w-3.5" />
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── EDIT VIEW — single recipient ── */
          <>
            {/* Back button */}
            <button
              onClick={() => setEditingRecipientIndex(null)}
              className="flex items-center gap-2 px-5 py-3 text-xs font-medium text-slate-500 hover:text-purple-600 border-b border-slate-100 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back to all recipients
            </button>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="john@company.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Custom fields */}
              {Object.keys(editForm.customFields).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-700">Custom Fields</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    {Object.entries(editForm.customFields).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-500 mb-1 capitalize">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              customFields: {
                                ...editForm.customFields,
                                [key]: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation between recipients */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    if (editingRecipientIndex > 0) {
                      // Save current before navigating
                      const updated = [...recipients]
                      updated[editingRecipientIndex] = {
                        ...updated[editingRecipientIndex],
                        name: editForm.name,
                        email: editForm.email,
                        customFields: editForm.customFields,
                      }
                      setRecipients(updated)
                      const prev = editingRecipientIndex - 1
                      setEditForm({
                        name: updated[prev].name,
                        email: updated[prev].email,
                        customFields: { ...updated[prev].customFields },
                      })
                      setEditingRecipientIndex(prev)
                    }
                  }}
                  disabled={editingRecipientIndex === 0}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="text-xs text-slate-400">
                  {editingRecipientIndex + 1} / {recipients.length}
                </span>
                <button
                  onClick={() => {
                    if (editingRecipientIndex < recipients.length - 1) {
                      const updated = [...recipients]
                      updated[editingRecipientIndex] = {
                        ...updated[editingRecipientIndex],
                        name: editForm.name,
                        email: editForm.email,
                        customFields: editForm.customFields,
                      }
                      setRecipients(updated)
                      const next = editingRecipientIndex + 1
                      setEditForm({
                        name: updated[next].name,
                        email: updated[next].email,
                        customFields: { ...updated[next].customFields },
                      })
                      setEditingRecipientIndex(next)
                    }
                  }}
                  disabled={editingRecipientIndex === recipients.length - 1}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setEditingRecipientIndex(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedRecipient}
                className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-sm font-medium text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </>
        )}
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* ==================== PREVIEW DOCUMENT DRAWER ==================== */}
<AnimatePresence>
  {showPreviewDrawer && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowPreviewDrawer(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Document Preview</h3>
              <p className="text-sm text-slate-600">
                {doc?.filename} • {templateConfig?.signatureFields?.length || 0} signature fields
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPreviewDrawer(false)}
            className="hover:bg-white/50"
          >
            <XCircle className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="max-w-3xl mx-auto">
            {/* Info Banner */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Signature Fields Preview</p>
                  <p>
                    Below is how your document will appear to recipients. Signature
                    boxes show where recipients will sign.
                  </p>
                </div>
              </div>
            </div>

            {/* PDF with Overlays */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
              <div
                id="bulk-preview-container"
                className="relative"
                style={{
                  minHeight: `${
                    297 * ((doc?.numPages || 1) * 3.78)
                  }px`,
                }}
              >
                {/* PDF Embed */}
                <embed
                  src={`/api/documents/${params.id}/file?serve=blob#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  type="application/pdf"
                  className="w-full border-0"
                  style={{
                    height: `${297 * ((doc?.numPages || 1) * 3.78)}px`,
                    display: "block",
                    pointerEvents: "none",
                  }}
                />

                {/* Signature Field Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {templateConfig?.signatureFields?.map((field: any, idx: number) => {
                    const pageHeight = 297 * 3.78;
                    const topPosition =
                      (field.page - 1) * pageHeight + (field.y / 100) * pageHeight;
                    const templateRecipient = templateConfig.recipients?.[field.recipientIndex];
                        const csvRecipient = recipients[field.recipientIndex];
                        const displayName = csvRecipient?.name || templateRecipient?.name || `Recipient ${field.recipientIndex + 1}`;
                        const displayColor = templateRecipient?.color || '#9333ea';

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="absolute border-2 rounded bg-white/90 shadow-lg"
                        style={{
                          left: `${field.x}%`,
                          top: `${topPosition}px`,
                          width: field.type === "signature" ? "140px" : "120px",
                          height: field.type === "signature" ? "50px" : "36px",
                          transform: "translate(-50%, 0%)",
                           borderColor: displayColor,
                        }}
                      >
                        <div className="h-full flex items-center justify-center px-2">
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {field.type === "signature"
                              ? "✍️ Signature"
                              : field.type === "date"
                              ? "📅 Date"
                              : field.type === "text"
                              ? "📝 Text"
                              : field.type === "checkbox"
                              ? "☑️ Checkbox"
                              : field.type === "attachment"
                              ? "📎 Attachment"
                              : field.type}
                          </span>
                        </div>
                        {/* Recipient Label */}
                        <div
                          className="absolute -top-6 left-0 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap"
                          style={{
                            backgroundColor: displayColor,
                            color: "white",
                          }}
                        >
                          {displayName}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
          <Button
            onClick={() => setShowPreviewDrawer(false)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Close Preview
          </Button>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* ==================== RECIPIENT PICKER DRAWER ==================== */}
<AnimatePresence>
  {showRecipientPickerDrawer && (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowRecipientPickerDrawer(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Select Recipient to Preview</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {recipients.length} recipients — click any to preview their document
            </p>
          </div>
          <button
            onClick={() => setShowRecipientPickerDrawer(false)}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <RecipientSearch
            recipients={recipients}
            selectedIndex={previewRecipientIndex}
            onSelect={(index) => {
              setPreviewRecipientIndex(index)
              setShowRecipientPickerDrawer(false)
            }}
          />
        </div>

        {/* Recipients list */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-100">
            {recipients.map((recipient, index) => (
              <button
                key={`picker-${index}-${recipient.email}`}
                onClick={() => {
                  setPreviewRecipientIndex(index)
                  setShowRecipientPickerDrawer(false)
                }}
                className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-all ${
                  previewRecipientIndex === index
                    ? 'bg-purple-50'
                    : 'hover:bg-slate-50'
                }`}
                style={{
                  borderLeft: previewRecipientIndex === index
                    ? '3px solid #7c3aed'
                    : '3px solid transparent'
                }}
              >
                {/* Number */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  previewRecipientIndex === index ? 'bg-purple-600' : 'bg-purple-100'
                }`}>
                  <span className={`text-xs font-bold ${
                    previewRecipientIndex === index ? 'text-white' : 'text-purple-700'
                  }`}>{index + 1}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    previewRecipientIndex === index ? 'text-purple-900' : 'text-slate-900'
                  }`}>
                    {recipient.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{recipient.email}</p>
                  {Object.keys(recipient.customFields).length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5">
                      {Object.entries(recipient.customFields).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected check */}
                {previewRecipientIndex === index && (
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            Currently previewing: <span className="font-semibold text-purple-600">
              {recipients[previewRecipientIndex]?.name}
            </span>
          </p>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </div>
  );
}