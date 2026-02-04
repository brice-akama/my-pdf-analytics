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
const [editingRecipientIndex, setEditingRecipientIndex] = useState<number | null>(null);
const [editForm, setEditForm] = useState({ name: "", email: "", customFields: {} as Record<string, string> });
const [templateConfig, setTemplateConfig] = useState<any>(null);
const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [generatedLinks, setGeneratedLinks] = useState<Array<{
  recipient: string;
  email: string;
  link: string;
  status: string;
}>>([]);


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
      `📋 Found a saved bulk send draft from ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago.\n\n` +
      `Recipients: ${draft.recipients.length}\n\n` +
      `Would you like to continue where you left off?`
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
      if (Object.keys(firstRecipient.customFields).length === 0) {
        validationResult.warnings.push(
          "No custom fields detected. Recipients will get identical documents."
        );
      }

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
    const csv = `name,email,title,salary
John Doe,john@company.com,Software Engineer,75000
Jane Smith,jane@company.com,Product Manager,90000
Bob Wilson,bob@company.com,Designer,70000`;

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
    <div className="min-h-screen bg-slate-50">
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
                <h1 className="text-xl font-bold text-slate-900">
                  Bulk Send: {doc.filename}
                </h1>
                <p className="text-sm text-slate-500">
                  Send to multiple recipients at once
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
  {/* ⭐ Auto-Save Indicator */}
  <div className="flex items-center gap-2 text-sm">
    {autoSaveStatus === 'saving' && (
      <div className="flex items-center gap-2 text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Saving...</span>
      </div>
    )}
    
    {autoSaveStatus === 'saved' && lastSaved && (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Saved {Math.floor((Date.now() - lastSaved.getTime()) / 60000)}m ago</span>
      </div>
    )}
    
    {autoSaveStatus === 'error' && (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span>Save failed</span>
      </div>
    )}
  </div>
  
  <div className="text-sm text-slate-600">
    Step {step} of 3
  </div>
</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-7xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? "bg-purple-600" : "bg-slate-200"
                }`}
            />
            <div
              className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? "bg-purple-600" : "bg-slate-200"
                }`}
            />
            <div
              className={`flex-1 h-2 rounded-full transition-all ${step >= 3 ? "bg-purple-600" : "bg-slate-200"
                }`}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Upload CSV */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Upload Recipients
              </h2>
              <p className="text-slate-600 mb-6">
                Upload a CSV file or paste CSV data with recipient
                information
              </p>

              {/* Sample CSV Download */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      CSV Format Requirements:
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1 mb-3">
                      <li>• Required columns: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">email</code></li>
                      <li>• Optional: Add any custom fields (title, salary, etc.)</li>
                      <li>• First row must be headers</li>
                      <li>• Each subsequent row is a recipient</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadSampleCsv}
                      className="bg-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample CSV
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">
                  Upload CSV File
                </Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium mb-1">
                      {csvFile
                        ? csvFile.name
                        : "Click to upload CSV file"}
                    </p>
                    <p className="text-sm text-slate-500">
                      or drag and drop
                    </p>
                  </label>
                </div>
              </div>

              {/* Or Paste CSV */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">
                  Or Paste CSV Data
                </Label>
                <Textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,email,title,salary&#10;John Doe,john@company.com,Engineer,50000&#10;Jane Smith,jane@company.com,Manager,75000"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Validation Errors */}
              {validation && !validation.valid && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-2">
                        Validation Errors:
                      </p>
                      <ul className="text-sm text-red-800 space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/documents/${doc._id}`)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleParseCsv}
                  disabled={!csvText.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Parse & Validate
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review Recipients */}
        {step === 2 && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Review Recipients
              </h2>
              <p className="text-slate-600 mb-6">
                {recipients.length} recipient(s) will receive signature
                requests
              </p>

              {/* Success Message */}
              {validation?.valid && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      All recipients validated successfully!
                    </p>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {validation?.warnings && validation.warnings.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900 mb-2">
                        Warnings:
                      </p>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {validation.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

             {/* Action Buttons - Preview & Edit All */}
<div className="flex items-center justify-between mb-4">
  <h3 className="font-semibold text-slate-900">Recipients List</h3>
  <div className="flex gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowPreviewDrawer(true)}
      className="gap-2"
    >
      <Eye className="h-4 w-4" />
      Preview Document
    </Button>
  </div>
</div>

{/* Recipients List */}
<div className="max-h-96 overflow-y-auto mb-6 border rounded-lg">
  {recipients.map((recipient, index) => (
    <div
      key={index}
      className="border-b last:border-b-0 p-4 hover:bg-slate-50"
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-purple-600">
            {index + 1}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">
                {recipient.name}
              </p>
              <p className="text-sm text-slate-600 truncate">
                {recipient.email}
              </p>
            </div>
            {/* ⭐ Edit Button for Each Recipient */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingRecipientIndex(index);
                setShowEditDrawer(true);
              }}
              className="flex-shrink-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          {Object.keys(recipient.customFields).length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {Object.entries(recipient.customFields).map(
                ([key, value]) => (
                  <span
                    key={key}
                    className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded"
                  >
                    <strong>{key}:</strong> {value}
                  </span>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  ))}
</div>

              {/* Message & Settings */}
              <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg border">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Message to Recipients (Optional)
                  </Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please review and sign this document..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Link Expiration
                  </Label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleBulkSend}
                  disabled={isSending || recipients.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Send to {recipients.length} Recipients
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Sending Progress */}
        {step === 3 && sendStatus && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <div className="text-center">
                {sendStatus.status === "processing" && (
                  <>
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Sending Signature Requests...
                    </h2>
                    <p className="text-slate-600 mb-8">
                      Please wait while we process your bulk send
                    </p>
                  </>
                )}

                {sendStatus.status === "completed" && (
                  <>
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Bulk Send Complete!
                    </h2>
                    <p className="text-slate-600 mb-8">
                      Successfully sent signature requests to all recipients
                    </p>
                  </>
                )}

                {sendStatus.status === "failed" && (
                  <>
                    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                      <XCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Bulk Send Failed
                    </h2>
                    <p className="text-slate-600 mb-8">
                      Some signature requests could not be sent
                    </p>
                  </>
                )}

                {/* Progress Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {sendStatus.total}
                    </div>
                    <div className="text-sm text-slate-600">Total</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {sendStatus.sent}
                    </div>
                    <div className="text-sm text-green-700">Sent</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600 mb-1">
                      {sendStatus.pending}
                    </div>
                    <div className="text-sm text-yellow-700">Pending</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      {sendStatus.failed}
                    </div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                      style={{
                        width: `${((sendStatus.sent + sendStatus.failed) /
                            sendStatus.total) *
                          100
                          }%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    {sendStatus.sent + sendStatus.failed} of{" "}
                    {sendStatus.total} processed
                  </p>
                </div>

                {/*  Failed Recipients */}
                {sendStatus.failedRecipients &&
                  sendStatus.failedRecipients.length > 0 && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                      <p className="text-sm font-medium text-red-900 mb-3">
                        Failed to send to the following recipients:
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {sendStatus.failedRecipients.map((failed, index) => (
                          <div
                            key={index}
                            className="text-sm text-red-800 bg-white rounded p-2"
                          >
                            <strong>{failed.name}</strong> ({failed.email})
                            <br />
                            <span className="text-xs">{failed.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                  {sendStatus.status === "completed" && (
                    <Button
                      onClick={() => router.push("/SignatureDashboard")}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      View in Dashboard
                    </Button>
                  )}

                  {sendStatus.failed > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        /* Implement retry logic */
                      }}
                    >
                      Retry Failed
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/documents/${doc._id}`)}
                  >
                    Back to Document
                  </Button>
                </div>
              </div>
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

      {/* ==================== EDIT RECIPIENT DRAWER ==================== */}
<AnimatePresence>
  {showEditDrawer && editingRecipientIndex !== null && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowEditDrawer(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Edit className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Edit Recipient</h3>
              <p className="text-sm text-slate-600">
                Recipient #{editingRecipientIndex + 1}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditDrawer(false)}
            className="hover:bg-white/50"
          >
            <XCircle className="h-5 w-5 text-slate-600" />
          </Button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="John Doe"
              className="w-full"
            />
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              placeholder="john@company.com"
              className="w-full"
            />
          </div>

          {/* Custom Fields */}
          {Object.keys(editForm.customFields).length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Custom Fields
              </Label>
              <div className="space-y-3">
                {Object.entries(editForm.customFields).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs text-slate-600 mb-1 block capitalize">
                      {key}
                    </Label>
                    <Input
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
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Custom Field Mapping</p>
                <p>
                  Custom fields will be used to personalize the document for
                  this recipient.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowEditDrawer(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={saveEditedRecipient}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
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
                    const recipient = templateConfig.recipients[field.recipientIndex];

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
                          borderColor: recipient?.color || "#9333ea",
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
                            backgroundColor: recipient?.color || "#9333ea",
                            color: "white",
                          }}
                        >
                          {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
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

    </div>
  );
}