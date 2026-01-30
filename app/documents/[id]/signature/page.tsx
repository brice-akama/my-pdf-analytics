//app/documents/[id]/signature/page.tsx
 
 "use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConditionalFieldBuilder from "@/components/ConditionalFieldBuilder";


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
  CheckSquare,
  Settings,
   Paperclip,
   EyeOff,
   Eye,
   Camera,
} from "lucide-react";
import { ACCESS_CODE_TYPES } from "@/lib/accessCodeConfig";
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
  type: "signature" | "date" | "text"  | "checkbox" | "attachment" | "dropdown" | "radio";
  x: number;
  y: number;
  page: number;
  recipientIndex: number;
  width?: number;
  height?: number;
  label?: string; //   Field label
  defaultChecked?: boolean; //   NEW: For checkboxes
  // ⭐ NEW: For attachment fields
  attachmentLabel?: string; // e.g., "Upload ID", "Upload Proof of Address"
  attachmentType?: string; // e.g., "proof_of_identity", "proof_of_address"
  isRequired?: boolean; // Whether attachment is mandatory

  // ⭐ NEW: For dropdown and radio buttons
  options?: string[]; // List of options
  defaultValue?: string; // Pre-selected value

  //   NEW: Conditional Logic
  conditional?: {
    enabled: boolean;
    dependsOn: string | number; // Field ID this depends on
    condition: 'checked' | 'unchecked' | 'equals' | 'not_equals' | 'contains';
    value?: string; // For 'equals' and 'contains' conditions
  };
  
};

type SignatureRequest = {
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  dueDate?: string;
  isTemplate: boolean;
  intentVideoRequired?: boolean;
  step: number;
  recipients: Recipient[];
  signatureFields: SignatureField[];
   viewMode?: 'isolated' | 'shared'; // ADD THIS
    signingOrder?: 'any' | 'sequential'; //   ADD THIS
    expirationDays?: string; //   ADD THIS
ccRecipients?: CCRecipient[]; //   ADD THIS
 accessCodeRequired?: boolean;
  accessCodeType?: string; // e.g., 'custom', 'last_4_ssn'
  accessCodeHint?: string;
  accessCode?: string; // Temporary storage for the code (not saved as plaintext)
  scheduledSendDate?: string;

};

type CCRecipient = {
  name: string;
  email: string;
  notifyWhen: 'completed' | 'immediately';
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
const [generatedLinks, setGeneratedLinks] = useState<Array<{ recipient: string; email: string; link: string; status: string; isCC?: boolean }>>([]);
const [editingFieldLogic, setEditingFieldLogic] = useState<SignatureField | null>(null);
const [editingLabelField, setEditingLabelField] = useState<SignatureField | null>(null);
const [showAccessCode, setShowAccessCode] = useState(false);
const returnTo = searchParams.get('returnTo');
const [showEditDrawer, setShowEditDrawer] = useState(false);
const [showReviewDrawer, setShowReviewDrawer] = useState(false);
const [fieldHistory, setFieldHistory] = useState<SignatureField[][]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);
const [draftSaving, setDraftSaving] = useState(false);
const [draftLastSaved, setDraftLastSaved] = useState<Date | null>(null);
const [draftLoaded, setDraftLoaded] = useState(false);
const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);


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


 // ⭐ FIXED: Save to history on EVERY field change
useEffect(() => {
  // Skip if this is from an undo/redo action
  if (fieldHistory[historyIndex] && 
      JSON.stringify(fieldHistory[historyIndex]) === JSON.stringify(signatureRequest.signatureFields)) {
    return;
  }
  
  const newHistory = fieldHistory.slice(0, historyIndex + 1);
  newHistory.push([...signatureRequest.signatureFields]);
  setFieldHistory(newHistory);
  setHistoryIndex(newHistory.length - 1);
}, [signatureRequest.signatureFields, fieldHistory, historyIndex]); // ⭐ ADD ALL DEPS

// ⭐ FIXED: Keyboard shortcuts with useRef to avoid dependency issues
const signatureRequestRef = useRef(signatureRequest);


// ⭐ NEW: Auto-save draft every 3 seconds when changes occur
useEffect(() => {
  // Clear existing timer
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
  }
  
  // Only auto-save if we have recipients or fields
  if (signatureRequest.recipients.length > 0 || signatureRequest.signatureFields.length > 0) {
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 3000); // 3 seconds delay
  }
  
  return () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
  };
}, [
  signatureRequest.recipients,
  signatureRequest.signatureFields,
  signatureRequest.viewMode,
  signatureRequest.signingOrder,
  signatureRequest.message,
  signatureRequest.dueDate,
  signatureRequest.ccRecipients,
]);

useEffect(() => {
  signatureRequestRef.current = signatureRequest;
}, [signatureRequest]);

useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      // Undo
      setHistoryIndex((currentIndex) => {
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setSignatureRequest({
            ...signatureRequestRef.current,
            signatureFields: fieldHistory[newIndex],
          });
          return newIndex;
        }
        return currentIndex;
      });
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      // Redo
      setHistoryIndex((currentIndex) => {
        if (currentIndex < fieldHistory.length - 1) {
          const newIndex = currentIndex + 1;
          setSignatureRequest({
            ...signatureRequestRef.current,
            signatureFields: fieldHistory[newIndex],
          });
          return newIndex;
        }
        return currentIndex;
      });
    }
  };
  
  window.addEventListener('keydown', handleKeyboard);
  return () => window.removeEventListener('keydown', handleKeyboard);
}, []); // ⭐ EMPTY DEPS - stable now!

  useEffect(() => {
    if (doc && signatureRequest.step === 2 && !pdfUrl) {
      fetchPdfForPreview();
    }
  }, [doc, signatureRequest.step]);


  useEffect(() => {
  if (doc && signatureRequest.step === 2 && !pdfUrl) {
    fetchPdfForPreview();
  }
}, [doc, signatureRequest.step]);

// ⭐ NEW: Load draft when document is loaded
useEffect(() => {
  if (doc && !draftLoaded) {
    loadDraft();
  }
}, [doc, draftLoaded]);


 const fetchDocument = async () => {
  try {
    const res = await fetch(`/api/documents/${params.id}`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setDoc(data.document);
        
        console.log('📄 [SIGNATURE PAGE] Document loaded');
        console.log('🏷️ [SIGNATURE PAGE] Is template?', data.document.isTemplate);
        console.log('🎯 [SIGNATURE PAGE] Mode:', mode);
        
        // ⭐ CRITICAL FIX: Determine the correct mode
        const isEditingRealTemplate = mode === 'edit'; // Creating/editing template
        const isDraftMode = mode === 'draft'; // Continuing draft
        const isSendMode = mode === 'send' || !mode; // Sending new request
        
        console.log('✅ [SIGNATURE PAGE] Is editing real template?', isEditingRealTemplate);
        console.log('✅ [SIGNATURE PAGE] Is draft mode?', isDraftMode);
        console.log('✅ [SIGNATURE PAGE] Is send mode?', isSendMode);
        
        if (isEditingRealTemplate) {
          // ✅ MODE=EDIT → Creating/Editing a TEMPLATE
          console.log('🎨 [SIGNATURE PAGE] Template creation/edit mode');
          
          // Check if template already exists
          const templateRes = await fetch(`/api/documents/${params.id}/template`, {
            credentials: "include",
          });
          
          if (templateRes.ok) {
            const templateData = await templateRes.json();
            // Load existing template
            setSignatureRequest({
              recipientEmail: "",
              recipientName: "",
              message: "",
              dueDate: "",
              step: 1,
              recipients: templateData.template.recipients || [
                { name: "Role 1", email: "", role: "Signer", color: "#9333ea" },
              ],
              signatureFields: templateData.template.signatureFields || [],
              isTemplate: true, // ✅ Creating/editing template
              viewMode: templateData.template.viewMode || 'isolated',
            });
            console.log('✅ [SIGNATURE PAGE] Existing template loaded');
          } else {
            // New template creation
            setSignatureRequest({
              recipientEmail: "",
              recipientName: "",
              message: "",
              dueDate: "",
              step: 1,
              recipients: [
                { name: "Role 1", email: "", role: "Signer", color: "#9333ea" },
              ],
              signatureFields: [],
              isTemplate: true, // ✅ Creating new template
              viewMode: 'isolated',
            });
            console.log('✅ [SIGNATURE PAGE] New template setup');
          }
       } else {
          // ✅ MODE=SEND or DRAFT → Sending signature request (NOT a template)
          console.log('📝 [SIGNATURE PAGE] Signature request mode (send/draft)');
          
          // ⭐ CHECK IF DOCUMENT IS A TEMPLATE - Load template fields for sending
          if (data.document.isTemplate) {
            console.log('📋 [SIGNATURE PAGE] Document is a template, loading template fields...');
            
            // Fetch template configuration to pre-fill fields
            const templateRes = await fetch(`/api/documents/${params.id}/template`, {
              credentials: "include",
            });
            
            if (templateRes.ok) {
              const templateData = await templateRes.json();
              console.log('✅ [SIGNATURE PAGE] Template fields loaded:', templateData.template.signatureFields?.length || 0);
              
              // Use template's roles as starting point, but user will add emails
              const templateRoles = templateData.template.recipients || [
                { name: "Recipient 1", email: "", role: "Signer", color: "#9333ea" },
              ];
              
              setSignatureRequest({
                recipientEmail: "",
                recipientName: "",
                message: "",
                dueDate: "",
                step: 1,
                recipients: templateRoles.map((role: any) => ({
                  ...role,
                  email: "", // Clear emails - user must add real emails
                })),
                signatureFields: templateData.template.signatureFields || [], // ⭐ LOAD TEMPLATE FIELDS
                isTemplate: false, // ✅ Sending request, NOT editing template
                viewMode: templateData.template.viewMode || 'isolated',
              });
              console.log('✅ [SIGNATURE PAGE] Using template as base for signature request');
            } else {
              // Template fetch failed, start fresh
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
                isTemplate: false,
                viewMode: 'isolated',
              });
            }
          } else {
            // ✅ Regular document (not a template) - start fresh
            console.log('📄 [SIGNATURE PAGE] Regular document, starting fresh');
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
              isTemplate: false,
              viewMode: 'isolated',
            });
          }
          
          console.log('✅ [SIGNATURE PAGE] Signature request setup complete, isTemplate=false');
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


// ⭐ NEW: Auto-save draft function
const saveDraft = async () => {
  console.log('💾 [SIGNATURE PAGE] saveDraft called');
  console.log('📊 [SIGNATURE PAGE] Doc ID:', doc?._id);
  console.log('📊 [SIGNATURE PAGE] Mode:', mode);
  
  if (!doc?._id) {
    console.log('⚠️ [SIGNATURE PAGE] No document ID, skipping save');
    return;
  }

  // ⭐ DON'T save drafts in EDIT mode (template editing)
  if (mode === 'edit') {
    console.log('ℹ️ [SIGNATURE PAGE] Edit mode - not saving as draft');
    return;
  }
  
  console.log('✅ [SIGNATURE PAGE] Proceeding with draft save...');
  
  try {
    setDraftSaving(true);
    console.log('🔄 [SIGNATURE PAGE] Draft saving state: true');
    
    const draftData = {
      recipients: signatureRequest.recipients,
      signatureFields: signatureRequest.signatureFields,
      viewMode: signatureRequest.viewMode,
      signingOrder: signatureRequest.signingOrder,
      expirationDays: signatureRequest.expirationDays,
      accessCodeRequired: signatureRequest.accessCodeRequired,
      accessCodeType: signatureRequest.accessCodeType,
      accessCodeHint: signatureRequest.accessCodeHint,
      accessCode: signatureRequest.accessCode,
      intentVideoRequired: signatureRequest.intentVideoRequired,
      message: signatureRequest.message,
      dueDate: signatureRequest.dueDate,
      scheduledSendDate: signatureRequest.scheduledSendDate,
      ccRecipients: signatureRequest.ccRecipients,
      step: signatureRequest.step,
    };
    
    console.log('📦 [SIGNATURE PAGE] Draft data to save:', {
      recipients: draftData.recipients.length,
      fields: draftData.signatureFields.length,
      viewMode: draftData.viewMode
    });
    
    const response = await fetch(`/api/signature-drafts/${doc._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(draftData),
    });
    
    console.log('📡 [SIGNATURE PAGE] Save response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [SIGNATURE PAGE] Draft saved successfully:', data);
      setDraftLastSaved(new Date());
      console.log('🕒 [SIGNATURE PAGE] Draft last saved updated');
    } else {
      const errorText = await response.text();
      console.error('❌ [SIGNATURE PAGE] Save failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ [SIGNATURE PAGE] Failed to save draft:', error);
  } finally {
    setDraftSaving(false);
    console.log('🔄 [SIGNATURE PAGE] Draft saving state: false');
  }
};

// ⭐ NEW: Load draft on page load
const loadDraft = async () => {
  console.log('📖 [SIGNATURE PAGE] loadDraft called');
  console.log('📊 [SIGNATURE PAGE] Doc ID:', doc?._id);
  console.log('📊 [SIGNATURE PAGE] Mode:', mode);
  console.log('📊 [SIGNATURE PAGE] Draft loaded:', draftLoaded);
  
  if (!doc?._id) {
    console.log('⚠️ [SIGNATURE PAGE] No document ID, skipping load');
    return;
  }
  
  // ⭐ ONLY load draft in DRAFT mode
  if (mode !== 'draft') {
    console.log('ℹ️ [SIGNATURE PAGE] Not in draft mode, skipping draft load');
    return;
  }
  
  try {
    const response = await fetch(`/api/signature-drafts/${doc._id}`, {
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.draft) {
        console.log('📋 Draft found, restoring...');
        
        setSignatureRequest({
          ...signatureRequest,
          recipients: data.draft.recipients || [],
          signatureFields: data.draft.signatureFields || [],
          viewMode: data.draft.viewMode || 'isolated',
          signingOrder: data.draft.signingOrder || 'any',
          expirationDays: data.draft.expirationDays || '30',
          accessCodeRequired: data.draft.accessCodeRequired || false,
          accessCodeType: data.draft.accessCodeType,
          accessCodeHint: data.draft.accessCodeHint,
          accessCode: data.draft.accessCode,
          intentVideoRequired: data.draft.intentVideoRequired || false,
          message: data.draft.message || '',
          dueDate: data.draft.dueDate || '',
          scheduledSendDate: data.draft.scheduledSendDate || '',
          ccRecipients: data.draft.ccRecipients || [],
          isTemplate: false, // ⭐ ALWAYS false for drafts
          step: data.draft.step || 1, // ⭐ Restore the step they were on
        });
        
        setDraftLastSaved(new Date(data.draft.lastSaved));
        setDraftLoaded(true);
        
        alert(`✅ Draft restored from ${new Date(data.draft.lastSaved).toLocaleString()}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to load draft:', error);
  }
};

// ⭐ NEW: Delete draft after sending
const deleteDraft = async () => {
  if (!doc?._id) return;
  
  try {
    await fetch(`/api/signature-drafts/${doc._id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    console.log('🗑️ Draft deleted after sending');
  } catch (error) {
    console.error('⚠️ Failed to delete draft:', error);
  }
};

const handleSendSignature = async () => {
  // ⭐ VALIDATION LOGIC BASED ON MODE
  if (mode === 'edit') {
    // Template mode: Just need role names (emails optional)
    const validRoles = signatureRequest.recipients.filter((r) => r.name);
    if (validRoles.length === 0) {
      alert("Please add at least one role (e.g., 'Signer 1', 'Approver')");
      return;
    }
  } else {
    // Send/Draft mode: Need actual recipient emails
    const validRecipients = signatureRequest.recipients.filter(
      (r) => r.name && r.email
    );
    if (validRecipients.length === 0) {
      alert("Please add at least one recipient with name and email");
      return;
    }
  }
  
  setIsSending(true);
  try {
    if (mode === 'edit') {
      // ✅ SAVE AS TEMPLATE (mode=edit)
      console.log('💾 [SIGNATURE PAGE] Saving as template...');
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
        alert("✅ Document saved as signable template!");
        // Delete draft if exists (since we're saving as template)
        await deleteDraft();
        // Redirect back to document page
        window.location.href = `/documents/${doc?._id}`;
      } else {
        alert(data.message || "Failed to save template");
      }
    } else {
      // ✅ SEND SIGNATURE REQUEST (mode=send or draft)
      console.log('📧 [SIGNATURE PAGE] Sending signature request...');
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
          ccRecipients: signatureRequest.ccRecipients || [], //   ADD THIS
          //   Add access code settings
    accessCodeRequired: signatureRequest.accessCodeRequired || false,
    accessCodeType: signatureRequest.accessCodeType,
    accessCodeHint: signatureRequest.accessCodeHint,
    accessCode: signatureRequest.accessCode, // This will be hashed by the backend
    scheduledSendDate: signatureRequest.scheduledSendDate,
    intentVideoRequired: signatureRequest.intentVideoRequired || false,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        console.log('✅ [SIGNATURE PAGE] Signature request sent successfully');
        // Delete draft after successful send
        await deleteDraft();
        // Use the `uniqueId` from the response to construct the signing link
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
             isCC?: boolean; // Add this to identify CC recipients
        }

        const links: GeneratedLink[] = (data.signatureRequests as SignatureRequestResponse[]).map((request) => ({
            recipient: request.recipient,
            email: request.email,
            link: `${window.location.origin}/sign/${request.uniqueId}?recipient=${request.email}`,
            status: request.status,
        }));
        setGeneratedLinks(links);
        // Generate CC recipient links if they exist
if (data.ccRecipients && data.ccRecipients.length > 0) {
    const ccLinks = data.ccRecipients.map((cc: any) => ({
        recipient: cc.name,
        email: cc.email,
        link: `${window.location.origin}/cc/${cc.uniqueId}?email=${cc.email}`,
        status: 'CC',
        isCC: true, // Flag to identify CC recipients
    }));
    setGeneratedLinks([...links, ...ccLinks]);
} else {
    setGeneratedLinks(links);
}
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
  <div className="flex items-center gap-3">
    <h1 className="text-xl font-bold text-slate-900">{doc.filename}</h1>
    {/* ⭐ NEW: Draft indicator */}
    {mode === 'edit' && (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
        <FileSignature className="h-3 w-3 mr-1" />
        Template Mode
      </span>
    )}
    {draftLastSaved && (
      <div className="flex items-center gap-2 text-xs">
        {draftSaving ? (
          <span className="text-blue-600 flex items-center gap-1">
            <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
            Saving...
          </span>
        ) : (
          <span className="text-green-600 flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Saved {new Date(draftLastSaved).toLocaleTimeString()}
          </span>
        )}
      </div>
    )}
  </div>
  <p className="text-sm text-slate-500">
    {mode === 'edit' 
      ? "Create Reusable Template" 
      : mode === 'draft'
      ? "Continue Signature Request"
      : "Send Signature Request"
    } - Step {signatureRequest.step} of 3
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
  
  {signatureRequest.step === 1 && (
    <Button
      onClick={() => {
        if (mode === 'edit') {
          // Template mode: Just need role names
          const validRoles = signatureRequest.recipients.filter((r) => r.name);
          if (validRoles.length === 0) {
            alert('Please add at least one role (e.g., "Client", "Manager")');
            return;
          }
        } else {
          // Send/Draft mode: Need names AND emails
          const validRecipients = signatureRequest.recipients.filter(
            (r) => r.name && r.email
          );
          if (validRecipients.length === 0) {
            alert('Please add recipient names and email addresses');
            return;
          }
        }
        setSignatureRequest({ ...signatureRequest, step: 2 });
      }}
      className="bg-purple-600 hover:bg-purple-700"
    >
      Continue
      <ChevronRight className="h-4 w-4 ml-2" />
    </Button>
  )}
  
  {signatureRequest.step === 2 && (
    <>
      <Button
        variant="outline"
        onClick={() => setShowReviewDrawer(true)}
        className="border-purple-600 text-purple-600 hover:bg-purple-50"
      >
        <FileSignature className="h-4 w-4 mr-2" />
        Review & Send
      </Button>
       
    </>
  )}
  
 {signatureRequest.step === 3 && (
  <Button
    onClick={handleSendSignature}
    disabled={isSending}
    className="bg-purple-600 hover:bg-purple-700"
  >
    {isSending ? (
      <>
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
        {mode === 'edit' ? 'Saving Template...' : 'Sending Request...'}
      </>
    ) : (
      <>
        {mode === 'edit' ? (
          <>
            <FileSignature className="h-4 w-4 mr-2" />
            Save as Template
          </>
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Send Signature Request
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
  {mode === 'edit' ? 'Define Recipient Roles' : 'Who needs to sign?'}
</h2>
<p className="text-slate-600 mb-6">
  {mode === 'edit'
    ? 'Add roles (e.g., "Signer 1", "Approver") and place fields. You\'ll assign real people when using this template.'
    : 'Add recipients with their email addresses to send signature requests'}
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
    Email Address {mode === 'edit' && ' (optional)'}
  </Label>
                            <Input
    type="email"
    value={recipient.email}
    onChange={(e) => {
      const updated = [...signatureRequest.recipients];
      updated[index].email = e.target.value;
      setSignatureRequest({ ...signatureRequest, recipients: updated });
    }}
    placeholder={mode === 'edit' ? "Optional for template" : "john@company.com"}
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
                 {/* ⭐ NEW: CC Recipients Section */}
<div className="mt-8 pt-8 border-t">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900">
        CC Recipients (Optional)
      </h3>
      <p className="text-sm text-slate-600">
        People who will receive a copy but don't need to sign
      </p>
    </div>
  </div>

  {/* CC Recipients List */}
  <div className="space-y-3">
    {(signatureRequest.ccRecipients || []).map((cc, index) => (
      <div key={index} className="border rounded-lg p-4 bg-slate-50">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={cc.name}
                  onChange={(e) => {
                    const updated = [...(signatureRequest.ccRecipients || [])];
                    updated[index].name = e.target.value;
                    setSignatureRequest({ ...signatureRequest, ccRecipients: updated });
                  }}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={cc.email}
                  onChange={(e) => {
                    const updated = [...(signatureRequest.ccRecipients || [])];
                    updated[index].email = e.target.value;
                    setSignatureRequest({ ...signatureRequest, ccRecipients: updated });
                  }}
                  placeholder="john@company.com"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Send Copy</Label>
              <select
                value={cc.notifyWhen}
                onChange={(e) => {
                  const updated = [...(signatureRequest.ccRecipients || [])];
                  updated[index].notifyWhen = e.target.value as 'completed' | 'immediately';
                  setSignatureRequest({ ...signatureRequest, ccRecipients: updated });
                }}
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm"
              >
                <option value="completed">When all signatures are completed</option>
                <option value="immediately">Immediately after sending</option>
              </select>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const updated = (signatureRequest.ccRecipients || []).filter((_, i) => i !== index);
              setSignatureRequest({ ...signatureRequest, ccRecipients: updated });
            }}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    ))}

    {/* Add CC Button */}
    <Button
      variant="outline"
      onClick={() => {
        const updated = [
          ...(signatureRequest.ccRecipients || []),
          {
            name: "",
            email: "",
            notifyWhen: "completed" as const,
          },
        ];
        setSignatureRequest({ ...signatureRequest, ccRecipients: updated });
      }}
      className="w-full border-dashed h-12"
    >
      <Mail className="h-4 w-4 mr-2" />
      Add CC Recipient
    </Button>
  </div>
</div>



{/* ⭐ NEW: Access Code Protection Toggle */}
<div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
  <div className="flex items-center justify-between">
    <div>
      <Label className="text-sm font-medium text-slate-900">
        Require Access Code
      </Label>
      <p className="text-xs text-slate-600 mt-1">
        Protect this document with an access code that recipients must enter before viewing
      </p>
    </div>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={signatureRequest.accessCodeRequired || false}
        onChange={(e) => {
          setSignatureRequest({
            ...signatureRequest,
            accessCodeRequired: e.target.checked,
            // Reset access code fields if unchecked
            ...(!e.target.checked && {
              accessCodeType: undefined,
              accessCodeHint: undefined,
            }),
          });
        }}
        className="h-4 w-4 text-purple-600 rounded"
      />
      <span className="text-sm font-medium">
        {signatureRequest.accessCodeRequired ? 'Enabled' : 'Disabled'}
      </span>
    </label>
  </div>

  {/* Show access code settings if enabled */}
  {signatureRequest.accessCodeRequired && (
    <div className="mt-4 space-y-3">
      <div>
        <Label className="block text-sm font-medium text-slate-700 mb-2">
          Access Code Type
        </Label>
        <select
          value={signatureRequest.accessCodeType || 'custom'}
          onChange={(e) => {
            setSignatureRequest({
              ...signatureRequest,
              accessCodeType: e.target.value,
            });
          }}
          className="w-full border rounded-lg px-3 py-2 text-sm"
        >
          <option value="custom">Custom Code</option>
          <option value="last_4_ssn">Last 4 of SSN</option>
          <option value="employee_id">Employee ID</option>
          <option value="birth_date">Date of Birth</option>
          <option value="account_number">Account Number</option>
          <option value="phone_last_4">Last 4 of Phone</option>
        </select>
      </div>

      <div>
        <Label className="block text-sm font-medium text-slate-700 mb-2">
          Access Code Hint (Optional)
        </Label>
        <Input
          type="text"
          value={signatureRequest.accessCodeHint || ''}
          onChange={(e) => {
            setSignatureRequest({
              ...signatureRequest,
              accessCodeHint: e.target.value,
            });
          }}
          placeholder="e.g., 'Your employee ID' or 'Last 4 of your SSN'"
          className="w-full"
        />
      </div>

      <div>
        <Label className="block text-sm font-medium text-slate-700 mb-2">
          Set Access Code
        </Label>
        <div className="relative">
          <Input
            type={showAccessCode ? 'text' : 'password'} // Toggle between text and password
            value={signatureRequest.accessCode || ''}
            onChange={(e) => {
              setSignatureRequest({
                ...signatureRequest,
                accessCode: e.target.value,
              });
            }}
            placeholder="Enter access code"
            className="w-full pr-10"
          />
          {/* Eye icon to toggle visibility */}
          <button
            type="button"
            onClick={() => setShowAccessCode(!showAccessCode)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showAccessCode ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Minimum 4 characters. Recipients will need this to access the document.
        </p>
      </div>
    </div>
  )}
</div>

{/* ⭐ NEW: Intent & Acknowledgement Video Toggle */}
<div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
  <div className="flex items-center justify-between">
    <div>
      <Label className="text-sm font-medium text-slate-900">
        Require Intent & Acknowledgement Video
      </Label>
      <p className="text-xs text-slate-600 mt-1">
        Signers must record a short video confirming their intent to sign before completing
      </p>
    </div>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={signatureRequest.intentVideoRequired || false}
        onChange={(e) => {
          setSignatureRequest({
            ...signatureRequest,
            intentVideoRequired: e.target.checked,
          });
        }}
        className="h-4 w-4 text-purple-600 rounded"
      />
      <span className="text-sm font-medium">
        {signatureRequest.intentVideoRequired ? 'Enabled' : 'Disabled'}
      </span>
    </label>
  </div>

  {signatureRequest.intentVideoRequired && (
    <div className="mt-3 bg-white rounded-lg p-3 border border-purple-300">
      <p className="text-xs text-purple-900 mb-2">
        <strong>📹 What signers will record:</strong>
      </p>
      <ul className="text-xs text-purple-800 space-y-1 ml-4">
        <li>• State their full name</li>
        <li>• Confirm the document name</li>
        <li>• State the current date</li>
        <li>• Say "I acknowledge and agree to sign this document"</li>
      </ul>
      <p className="text-xs text-purple-700 mt-2">
        💡 This provides additional legal proof of intent and reduces disputes.
      </p>
    </div>
  )}
</div>

                {/* ⭐ NEW: Signature View Mode Selector */}

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

    {/*  NEW: Scheduled Send Date */}
<div>
  <Label>Schedule Sending (optional)</Label>
  <Input
    type="datetime-local"
    value={signatureRequest.scheduledSendDate || ''}
    onChange={(e) =>
      setSignatureRequest({ 
        ...signatureRequest, 
        scheduledSendDate: e.target.value 
      })
    }
    min={new Date().toISOString().slice(0, 16)}
    className="mt-1"
  />
  <p className="text-xs text-slate-500 mt-1">
    Leave blank to send immediately, or choose a date/time to schedule
  </p>
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

{/*   UNDO/REDO BUTTONS HERE */}
<div className="mb-4 flex gap-2">
  <Button
    variant="outline"
    size="sm"
    className="flex-1"
    disabled={historyIndex <= 0}
    onClick={() => {
      if (historyIndex > 0) {
        setHistoryIndex(historyIndex - 1);
        setSignatureRequest({
          ...signatureRequest,
          signatureFields: fieldHistory[historyIndex - 1],
        });
      }
    }}
  >
    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
    Undo
  </Button>
  <Button
    variant="outline"
    size="sm"
    className="flex-1"
    disabled={historyIndex >= fieldHistory.length - 1}
    onClick={() => {
      if (historyIndex < fieldHistory.length - 1) {
        setHistoryIndex(historyIndex + 1);
        setSignatureRequest({
          ...signatureRequest,
          signatureFields: fieldHistory[historyIndex + 1],
        });
      }
    }}
  >
    Redo
    <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
    </svg>
  </Button>
</div>
              
{/* Recipients */}
<div className="space-y-3 mb-6">
              
              {/* Recipients */}
              <div className="space-y-3 mb-6">
  <div className="flex items-center justify-between mb-3">
    
    <Label className="text-sm font-medium text-slate-700">Recipients</Label>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setShowEditDrawer(true)}
      className="text-xs"
    >
      <Edit className="h-3 w-3 mr-1" />
      Edit Details
    </Button>
  </div>
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
              {mode === 'edit' && (
  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <p className="text-xs text-blue-800">
      💡 <strong>Tip:</strong> Create roles like "Client", "Manager", "Legal". When using this template later, you'll assign real people to these roles!
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
                {/*   NEW: CHECKBOX FIELD */}
<Button
  variant="outline"
  className="w-full justify-start h-12"
  draggable
  onDragStart={(e) => e.dataTransfer.setData("fieldType", "checkbox")}
>
  <CheckSquare className="h-5 w-5 mr-3" />
  Checkbox Field
</Button>
{/* Existing buttons: Signature, Date, Text, Checkbox */}

{/*   NEW: ATTACHMENT FIELD */}
<Button
  variant="outline"
  className="w-full justify-start h-12"
  draggable
  onDragStart={(e) => e.dataTransfer.setData("fieldType", "attachment")}
>
  <Paperclip className="h-5 w-5 mr-3" />
  Attachment Field
</Button>

{/* ⭐ NEW: Dropdown Field */}
<Button
  variant="outline"
  className="w-full justify-start h-12"
  draggable
  onDragStart={(e) => e.dataTransfer.setData("fieldType", "dropdown")}
>
  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
  Dropdown Field
</Button>

{/* ⭐ NEW: Radio Button Field */}
<Button
  variant="outline"
  className="w-full justify-start h-12"
  draggable
  onDragStart={(e) => e.dataTransfer.setData("fieldType", "radio")}
>
  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
  Radio Button Field
</Button>
              </div>
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
                    | "text"
                    | "checkbox" //   Add checkbox
                    | "attachment"
                    | "dropdown" //   Add dropdown
                    | "radio"; //   Add radio
         
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
                      label: fieldType === 'checkbox' ? 'Check this box' :
         fieldType === 'dropdown' ? 'Select an option' :  // ⭐ ADD
         fieldType === 'radio' ? 'Choose one option' :     // ⭐ ADD
         '',
    defaultChecked: false, //   For checkboxes
                  // ⭐ NEW: Default values for attachment fields
    attachmentLabel: fieldType === 'attachment' ? 'Upload Required Document' : undefined,
    attachmentType: fieldType === 'attachment' ? 'supporting_document' : undefined,
    isRequired: fieldType === 'attachment' ? true : false,
    // ⭐ NEW: Default options for dropdown/radio
  options: (fieldType === 'dropdown' || fieldType === 'radio') ? 
    ['Option 1', 'Option 2', 'Option 3'] : undefined,
  defaultValue: undefined,
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
  width: field.type === "dropdown" ? "180px" :  // ← 220 → 180
         field.type === "radio" ? "160px" :     // ← 200 → 160
         field.type === "signature" ? "140px" :  // ← NEW
         field.type === "attachment" ? "150px" : // ← NEW
         "120px",  // ← 180 → 120 (for text, date, checkbox)
  height: field.type === "signature" ? "50px" :  // ← 70 → 50
          field.type === "dropdown" ? "36px" :   // ← 45 → 36
          field.type === "radio" ? "auto" :
          field.type === "text" ? "36px" :       // ← 45 → 36
          field.type === "attachment" ? "36px" : // ← NEW
          "32px",  // ← 45 → 32 (checkbox, date)
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

                             {/* ⭐ ADD: Attachment Label Editor */}
        {field.type === "attachment" && (
          <input
            type="text"
            value={field.attachmentLabel || ""}
            onChange={(e) => {
              e.stopPropagation();
              const updated = signatureRequest.signatureFields.map((f) =>
                f.id === field.id ? { ...f, attachmentLabel: e.target.value } : f
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="e.g., Upload ID..."
            className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-xs border rounded px-2 py-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity w-40 text-center"
          />
        )}

                            {/*   MOVE THE LABEL EDITOR HERE (right after select) */}
  {(field.type === "checkbox" || field.type === "text") && (
    <input
      type="text"
      value={field.label || ""}
      onChange={(e) => {
        e.stopPropagation();
        const updated = signatureRequest.signatureFields.map((f) =>
          f.id === field.id ? { ...f, label: e.target.value } : f
        );
        setSignatureRequest({ ...signatureRequest, signatureFields: updated });
      }}
      onClick={(e) => e.stopPropagation()}
      placeholder={field.type === "checkbox" ? "Checkbox label..." : "Field label..."}
      className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-xs border rounded px-2 py-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity w-40 text-center"
    />
  )}
                              
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                {field.type === "signature" && (
                                  <FileSignature className="h-4 w-4" />
                                )}
                                {field.type === "date" && <Clock className="h-4 w-4" />}
                                {field.type === "text" && <Edit className="h-4 w-4" />}
                                {field.type === "checkbox" && <CheckSquare className="h-4 w-4" />}
                                 {/* ⭐ NEW: Attachment Icon */}
            {field.type === "attachment" && <Paperclip className="h-4 w-4" />}
            {/* ⭐ NEW: Dropdown Icon */}
{field.type === "dropdown" && (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)}

{/* ⭐ NEW: Radio Icon */}
{field.type === "radio" && (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
  </svg>
)}
{field.type !== "checkbox" && field.type !== "attachment" && (
  <span className="text-xs font-semibold">
    {field.type === "signature" ? "Sign Here" :
     field.type === "date" ? "Date" :
     field.type === "text" ? "Text" :
     field.type === "dropdown" ? (field.label || "Dropdown") :  // ⭐ ADD
     field.type === "radio" ? (field.label || "Radio") :        // ⭐ ADD
     "Text"}
  </span>
)}
                    {/* ⭐ NEW: Show attachment label */}
            {field.type === "attachment" && (
              <span className="text-xs font-semibold truncate">
                {field.attachmentLabel || "Upload File"}
              </span>
            )}
            
                              </div>

                              
                              {/*   Show label for checkbox */}
          
         {field.type !== "checkbox" && field.type !== "attachment" && (
            <p className="text-xs text-slate-600 truncate px-2">
              {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
            </p>
          )}
                            </div>
                            {/* ⭐ NEW: Settings button for attachment fields */}
        {field.type === "attachment" && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-10"
            onClick={(e) => {
              e.stopPropagation();
              setEditingFieldLogic(field);
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}

        {/* ⭐ NEW: Settings for Dropdown/Radio */}
{(field.type === "dropdown" || field.type === "radio") && (
  <Button
    variant="ghost"
    size="icon"
    className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-10"
    onClick={(e) => {
      e.stopPropagation();
      setEditingFieldLogic(field);
    }}
  >
    <Settings className="h-4 w-4" />
  </Button>
)}
                            {/* Settings Button (Top-Left) */}
    {(field.type === "checkbox" || field.type === "text") && (
  <Button
    variant="ghost"
    size="icon"
    className="absolute -top-3 -left-3 h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-10"
    onClick={(e) => {
      e.stopPropagation();
      setEditingFieldLogic(field);
    }}
  >
    <Settings className="h-4 w-4" />
  </Button>
)}

    {/* Edit Label Button (Top-Right) */}
    {(field.type === "text" || field.type === "checkbox") && (
      <Button
        variant="ghost"
        size="icon"
        className="absolute -top-3 -right-10 h-7 w-7 rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow-lg z-10"
        onClick={(e) => {
          e.stopPropagation();
          setEditingLabelField(field);
        }}
      >
        <Edit className="h-4 w-4" />
      </Button>
    )}

                           
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
                           {/* ⭐ NEW: Conditional Logic Indicator */}
  {field.conditional?.enabled && (
    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow">
      Conditional
    </div>
  )}
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
    ? 'Review your reusable template. When you use this template later, you\'ll just add real recipient emails!'
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
                {/* ⭐ NEW: Access Code Review */}
{signatureRequest.accessCodeRequired && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-800">Access Code Protection</h3>
    <div className="p-4 border rounded-lg bg-slate-50">
      <p className="text-sm font-medium text-slate-900">
        {signatureRequest.accessCodeType === 'custom'
          ? 'Custom Access Code'
          : ACCESS_CODE_TYPES.find(t => t.id === signatureRequest.accessCodeType)?.name}
      </p>
      {signatureRequest.accessCodeHint && (
        <p className="text-sm text-slate-600 mt-1">
          Hint: "{signatureRequest.accessCodeHint}"
        </p>
      )}
      <p className="text-xs text-slate-500 mt-2">
        Recipients will need to enter this code before viewing the document.
      </p>
    </div>
  </div>
)}


{/* ⭐ NEW: Intent Video Review */}
{signatureRequest.intentVideoRequired && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-800">Intent & Acknowledgement Video</h3>
    <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
      <p className="text-sm font-medium text-purple-900 flex items-center gap-2">
        <Camera className="h-4 w-4" />
        Video Recording Required
      </p>
      <p className="text-xs text-purple-700 mt-2">
        All signers must record a short video before completing their signature.
      </p>
    </div>
  </div>
)}
                      {/* ⭐ NEW: CC Recipients Review */}
{signatureRequest.ccRecipients && signatureRequest.ccRecipients.length > 0 && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-800">
      CC Recipients ({signatureRequest.ccRecipients.length})
    </h3>
    <div className="space-y-2">
      {signatureRequest.ccRecipients.map((cc, index) => (
        <div
          key={index}
          className="p-3 border rounded-lg bg-blue-50 border-blue-200 flex items-center gap-3"
        >
          <Mail className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-slate-900">{cc.name}</p>
            <p className="text-sm text-slate-600">{cc.email}</p>
            <p className="text-xs text-slate-500 mt-1">
              Will receive copy: {cc.notifyWhen === 'completed' ? 'When completed' : 'Immediately'}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
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
            {field.type === "signature" ? "Signature" :
             field.type === "date" ? "Date" :
             field.type === "text" ? "Text" :
             field.type === "checkbox" ? "Checkbox" :
             field.type === "attachment" ? `📎 ${field.attachmentLabel || "Attachment"}` :
             field.type === "dropdown" ? `📋 ${field.label || "Dropdown"}` :  // ⭐ ADD
   field.type === "radio" ? `⭕ ${field.label || "Radio"}` :        // ⭐ ADD  
             field.type
            } - Page {field.page}
          </p>
          <p className="text-xs text-slate-600">
            {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
          </p>
          {/* ⭐ NEW: Show if required */}
          {field.type === "attachment" && field.isRequired && (
            <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
              Required
            </span>
          )}
        </div>
      </div>
    );
  })}
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
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
    item.isCC 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-yellow-100 text-yellow-800'
  }`}>
    {item.isCC ? (
      <>
        <Mail className="h-3 w-3 mr-1" />
        CC Recipient
      </>
    ) : (
      <>
        <Clock className="h-3 w-3 mr-1" />
        {item.status}
      </>
    )}
  </span>
</div>
                  </div>
                </div>
              </div>
              
              {/* Unique Signing Link */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <Label className="text-xs font-medium text-slate-700 mb-2 block">
  {item.isCC ? 'View-Only Link (CC)' : 'Unique Signing Link'}
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
  {item.isCC 
    ? `💡 This view-only link has been emailed to ${item.recipient}. They can view the document but cannot sign.`
    : `💡 This unique link has been emailed to ${item.recipient}. You can also share it manually.`
  }
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
    router.push(returnTo || "/SignatureDashboard"); // ← Use returnTo if present
  }}
>
  Track Status
</Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
<Dialog
  open={!!editingLabelField}
  onOpenChange={(open) => !open && setEditingLabelField(null)}
>
  <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden">
    <DialogHeader className="p-6 border-b bg-white">
      <DialogTitle className="text-lg font-semibold text-gray-900">
        Edit Label
      </DialogTitle>
    </DialogHeader>
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="field-label" className="text-sm font-medium text-gray-700">
          Field Label
        </Label>
        <Input
          id="field-label"
          value={editingLabelField?.label || ""}
          onChange={(e) => {
            if (!editingLabelField) return;
            const updated = signatureRequest.signatureFields.map((f) =>
              f.id === editingLabelField.id ? { ...f, label: e.target.value } : f
            );
            setSignatureRequest({ ...signatureRequest, signatureFields: updated });
            setEditingLabelField({ ...editingLabelField, label: e.target.value });
          }}
          placeholder="Enter field label"
          className="text-sm"
        />
      </div>
    </div>
    <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
      <Button
        variant="outline"
        onClick={() => setEditingLabelField(null)}
        className="text-sm"
      >
        Cancel
      </Button>
      <Button
        onClick={() => setEditingLabelField(null)}
        className="bg-purple-600 hover:bg-purple-700 text-sm"
      >
        Save
      </Button>
    </div>
  </DialogContent>
</Dialog>

{editingFieldLogic && (
  <ConditionalFieldBuilder
    field={editingFieldLogic as any}
    allFields={signatureRequest.signatureFields as any}
    onUpdate={(updatedField: any) => {
      const updated = signatureRequest.signatureFields.map((f) =>
        f.id === updatedField.id ? { ...f, ...updatedField } : f
      );
      setSignatureRequest({ ...signatureRequest, signatureFields: updated });
    }}
    onClose={() => setEditingFieldLogic(null)}
  />
)}

{/* ⭐ NEW: Attachment Field Settings Modal */}
{editingFieldLogic && editingFieldLogic.type === 'attachment' && (
  <Dialog
    open={!!editingFieldLogic}
    onOpenChange={(open) => !open && setEditingFieldLogic(null)}
  >
    <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden">
      <DialogHeader className="p-6 border-b bg-white">
        <DialogTitle className="text-lg font-semibold text-gray-900">
          Attachment Field Settings
        </DialogTitle>
      </DialogHeader>
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="attachment-label" className="text-sm font-medium text-gray-700">
            Instruction Text (What should they upload?)
          </Label>
          <Input
            id="attachment-label"
            value={editingFieldLogic?.attachmentLabel || ""}
            onChange={(e) => {
              if (!editingFieldLogic) return;
              const updated = signatureRequest.signatureFields.map((f) =>
                f.id === editingFieldLogic.id 
                  ? { ...f, attachmentLabel: e.target.value } 
                  : f
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
              setEditingFieldLogic({ ...editingFieldLogic, attachmentLabel: e.target.value });
            }}
            placeholder="e.g., Upload Proof of ID, Upload Bank Statement"
            className="text-sm"
          />
          <p className="text-xs text-slate-500">
            This text will guide the signer on what to upload
          </p>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Document Type Category
          </Label>
          <select
            value={editingFieldLogic?.attachmentType || 'supporting_document'}
            onChange={(e) => {
              if (!editingFieldLogic) return;
              const updated = signatureRequest.signatureFields.map((f) =>
                f.id === editingFieldLogic.id 
                  ? { ...f, attachmentType: e.target.value } 
                  : f
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
              setEditingFieldLogic({ ...editingFieldLogic, attachmentType: e.target.value });
            }}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="proof_of_identity">🪪 Proof of Identity</option>
            <option value="proof_of_address">🏠 Proof of Address</option>
            <option value="tax_form">📋 Tax Form</option>
            <option value="bank_info">🏦 Banking Information</option>
            <option value="insurance_card">🩺 Insurance Card</option>
            <option value="certification">🎓 Certification/License</option>
            <option value="financial_statement">💰 Financial Statement</option>
            <option value="supporting_document">📄 Supporting Document</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="attachment-required"
            checked={editingFieldLogic?.isRequired || false}
            onChange={(e) => {
              if (!editingFieldLogic) return;
              const updated = signatureRequest.signatureFields.map((f) =>
                f.id === editingFieldLogic.id 
                  ? { ...f, isRequired: e.target.checked } 
                  : f
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
              setEditingFieldLogic({ ...editingFieldLogic, isRequired: e.target.checked });
            }}
            className="h-4 w-4 text-purple-600 rounded"
          />
          <label htmlFor="attachment-required" className="text-sm text-slate-700">
            Mark as required (signer must upload before completing)
          </label>
        </div>
      </div>
      <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => setEditingFieldLogic(null)}
          className="text-sm"
        >
          Cancel
        </Button>
        <Button
          onClick={() => setEditingFieldLogic(null)}
          className="bg-purple-600 hover:bg-purple-700 text-sm"
        >
          Save Settings
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)}
{/* ⭐ NEW: Dropdown/Radio Field Settings Modal */}
{editingFieldLogic && (editingFieldLogic.type === 'dropdown' || editingFieldLogic.type === 'radio') && (
  <Dialog
    open={!!editingFieldLogic}
    onOpenChange={(open) => !open && setEditingFieldLogic(null)}
  >
    <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
      <DialogHeader className="p-6 border-b bg-white">
        <DialogTitle className="text-lg font-semibold text-gray-900">
          {editingFieldLogic.type === 'dropdown' ? 'Dropdown' : 'Radio Button'} Field Settings
        </DialogTitle>
      </DialogHeader>
      
      <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">

        {/* Field Label */}
        <div className="space-y-2">
          <Label htmlFor="field-label" className="text-sm font-medium text-gray-700">
            Field Label / Question
          </Label>
          <Input
            id="field-label"
            value={editingFieldLogic?.label || ""}
            onChange={(e) => {
              if (!editingFieldLogic) return;
              const updated = signatureRequest.signatureFields.map((f) =>
                f.id === editingFieldLogic.id 
                  ? { ...f, label: e.target.value } 
                  : f
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
              setEditingFieldLogic({ ...editingFieldLogic, label: e.target.value });
            }}
            placeholder="e.g., Select your country, Choose payment method"
            className="text-sm"
          />
        </div>
        
        {/* Options List */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Options (one per line)
          </Label>
          <Textarea
  value={(editingFieldLogic?.options || []).join('\n')}
  onChange={(e) => {
    if (!editingFieldLogic) return;
    // Don't filter out empty strings during typing - only split by newline
    const optionsArray = e.target.value.split('\n');
    const updated = signatureRequest.signatureFields.map((f) =>
      f.id === editingFieldLogic.id 
        ? { ...f, options: optionsArray } 
        : f
    );
    setSignatureRequest({ ...signatureRequest, signatureFields: updated });
    setEditingFieldLogic({ ...editingFieldLogic, options: optionsArray });
  }}
  placeholder="Option 1&#10;Option 2&#10;Option 3"
  rows={6}
  className="text-sm font-mono"
/>
          <p className="text-xs text-slate-500">
            Enter each option on a new line. Minimum 2 options required.
          </p>
        </div>
        
        {/* Required Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="field-required"
            checked={editingFieldLogic?.isRequired || false}
            onChange={(e) => {
              if (!editingFieldLogic) return;
              const updated = signatureRequest.signatureFields.map((f) =>
                f.id === editingFieldLogic.id 
                  ? { ...f, isRequired: e.target.checked } 
                  : f
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
              setEditingFieldLogic({ ...editingFieldLogic, isRequired: e.target.checked });
            }}
            className="h-4 w-4 text-purple-600 rounded"
          />
          <label htmlFor="field-required" className="text-sm text-slate-700">
            Mark as required field
          </label>
        </div>
        
        {/* Preview */}
        <div className="p-3 bg-slate-50 rounded-lg border">
          <p className="text-xs font-medium text-slate-600 mb-2">Preview:</p>
          {editingFieldLogic.type === 'dropdown' ? (
            <select className="w-full border rounded px-3 py-2 text-sm">
              <option>{editingFieldLogic.label || "Select an option..."}</option>
              {(editingFieldLogic.options || []).map((opt, idx) => (
                <option key={idx}>{opt}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">{editingFieldLogic.label || "Choose one:"}</p>
              {(editingFieldLogic.options || []).map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="preview" className="h-4 w-4" />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => setEditingFieldLogic(null)}
          className="text-sm"
        >
          Cancel
        </Button>
       <Button
  onClick={() => {
    // Filter out empty options before validating
    const validOptions = (editingFieldLogic?.options || []).filter(o => o.trim());
    
    if (validOptions.length < 2) {
      alert('Please add at least 2 options');
      return;
    }
    
    // Save with filtered options
    const updated = signatureRequest.signatureFields.map((f) =>
      f.id === editingFieldLogic.id 
        ? { ...f, options: validOptions } 
        : f
    );
    setSignatureRequest({ ...signatureRequest, signatureFields: updated });
    
    setEditingFieldLogic(null);
  }}
  className="bg-purple-600 hover:bg-purple-700 text-sm"
>
  Save Settings
</Button>
      </div>
    </DialogContent>
  </Dialog>
)}


{/* Edit Details Drawer */}
{showEditDrawer && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/50 z-50 transition-opacity"
      onClick={() => setShowEditDrawer(false)}
    />
    
    {/* Drawer */}
    <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Edit Details</h2>
          <p className="text-sm text-slate-600">Make changes without losing your placed fields</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEditDrawer(false)}
          className="hover:bg-slate-200"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable Content - Copy entire Step 1 content here */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Recipients Section */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recipients</h3>
            <div className="space-y-4">
              {signatureRequest.recipients.map((recipient, index) => (
                <div key={index} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Full Name</Label>
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
                          <Label className="text-xs">
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
                            placeholder={signatureRequest.isTemplate ? "Optional" : "john@company.com"}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Role (optional)</Label>
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
                      <Trash2 className="h-4 w-4" />
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
                className="w-full border-dashed h-12"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Another Recipient
              </Button>
            </div>
          </div>

          {/* Settings Sections - Copy all the toggles from Step 1 */}
          <div className="space-y-4">
            {/* View Mode */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                  <option value="isolated">Isolated</option>
                  <option value="shared">Shared</option>
                </select>
              </div>
            </div>

            {/* Signing Order */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-slate-900">
                    Signing Order
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="signingOrderDrawer"
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
                      name="signingOrderDrawer"
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
                    <span className="text-sm">Sequential</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Access Code */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-sm font-medium text-slate-900">
                    Require Access Code
                  </Label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signatureRequest.accessCodeRequired || false}
                    onChange={(e) => {
                      setSignatureRequest({
                        ...signatureRequest,
                        accessCodeRequired: e.target.checked,
                      });
                    }}
                    className="h-4 w-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium">
                    {signatureRequest.accessCodeRequired ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
              {signatureRequest.accessCodeRequired && (
                <div className="space-y-3 pt-3 border-t">
                  <Input
                    type="text"
                    value={signatureRequest.accessCode || ''}
                    onChange={(e) => {
                      setSignatureRequest({
                        ...signatureRequest,
                        accessCode: e.target.value,
                      });
                    }}
                    placeholder="Enter access code"
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Intent Video */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-slate-900">
                    Require Intent Video
                  </Label>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signatureRequest.intentVideoRequired || false}
                    onChange={(e) => {
                      setSignatureRequest({
                        ...signatureRequest,
                        intentVideoRequired: e.target.checked,
                      });
                    }}
                    className="h-4 w-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium">
                    {signatureRequest.intentVideoRequired ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Message & Due Date - Only show in 'send' mode */}
          {(mode === 'send' || mode === 'draft') && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Message to Recipients</Label>
                <Textarea
                  value={signatureRequest.message}
                  onChange={(e) =>
                    setSignatureRequest({ ...signatureRequest, message: e.target.value })
                  }
                  placeholder="Please review and sign..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Due Date</Label>
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
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setShowEditDrawer(false)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => setShowEditDrawer(false)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  </>
)}

{/* Review & Send Drawer */}
{showReviewDrawer && (
  <>
    {/* Backdrop */}
    <div 
      className="fixed inset-0 bg-black/50 z-50 transition-opacity"
      onClick={() => setShowReviewDrawer(false)}
    />
    
    {/* Drawer */}
    <div className="fixed right-0 top-0 bottom-0 w-[700px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSignature className="h-6 w-6 text-purple-600" />
            Review & Send
          </h2>
          <p className="text-sm text-slate-600">Final check before sending</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowReviewDrawer(false)}
          className="hover:bg-slate-200"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Document Summary */}
        <div className="bg-slate-50 rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{doc.filename}</p>
              <p className="text-sm text-slate-500">
                {signatureRequest.signatureFields.length} field(s) placed on {doc.numPages} page(s)
              </p>
            </div>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Recipients ({signatureRequest.recipients.length})
          </h3>
          <div className="space-y-2">
            {signatureRequest.recipients.map((recipient, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg bg-slate-50 flex items-center gap-3"
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
                <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                  {signatureRequest.signatureFields.filter(f => f.recipientIndex === index).length} fields
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Fields Summary */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-purple-600" />
            Signature Fields ({signatureRequest.signatureFields.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {signatureRequest.signatureFields.map((field) => {
              const recipient = signatureRequest.recipients[field.recipientIndex];
              return (
                <div
                  key={field.id}
                  className="p-3 border rounded-lg bg-slate-50 flex items-center gap-2"
                >
                  <div
                    className="h-6 w-6 rounded-full flex-shrink-0"
                    style={{ backgroundColor: recipient?.color || "#9333ea" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {field.type === "signature" ? "Signature" :
                       field.type === "date" ? "Date" :
                       field.type === "text" ? "Text" :
                       field.type === "checkbox" ? "Checkbox" :
                       field.type === "attachment" ? "Attachment" :
                       field.type === "dropdown" ? "Dropdown" :
                       field.type === "radio" ? "Radio" :
                       field.type}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      Page {field.page} • {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings Summary */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Settings
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <span className="text-sm text-slate-700">View Mode</span>
              <span className="text-sm font-medium text-slate-900">
                {signatureRequest.viewMode === 'shared' ? 'Shared View' : 'Isolated View'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <span className="text-sm text-slate-700">Signing Order</span>
              <span className="text-sm font-medium text-slate-900">
                {signatureRequest.signingOrder === 'sequential' ? 'Sequential' : 'Any Order'}
              </span>
            </div>
            {signatureRequest.accessCodeRequired && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <span className="text-sm text-amber-900">Access Code Protection</span>
                <span className="text-sm font-medium text-amber-900">✓ Enabled</span>
              </div>
            )}
            {signatureRequest.intentVideoRequired && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-sm text-purple-900">Intent Video Required</span>
                <span className="text-sm font-medium text-purple-900">✓ Enabled</span>
              </div>
            )}
            {signatureRequest.expirationDays && (
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                <span className="text-sm text-slate-700">Link Expiration</span>
                <span className="text-sm font-medium text-slate-900">
                  {signatureRequest.expirationDays === 'never' ? 'Never' : `${signatureRequest.expirationDays} days`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CC Recipients */}
        {signatureRequest.ccRecipients && signatureRequest.ccRecipients.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              CC Recipients ({signatureRequest.ccRecipients.length})
            </h3>
            <div className="space-y-2">
              {signatureRequest.ccRecipients.map((cc, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg bg-blue-50 border-blue-200 flex items-center gap-3"
                >
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{cc.name}</p>
                    <p className="text-sm text-slate-600">{cc.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {cc.notifyWhen === 'completed' ? 'Notified when completed' : 'Notified immediately'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message & Due Date (only in send mode) */}
        {mode === 'send' && (
          <>
            {signatureRequest.message && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Message</h3>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {signatureRequest.message}
                  </p>
                </div>
              </div>
            )}

            {signatureRequest.dueDate && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Due Date</h3>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-700">
                    {new Date(signatureRequest.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {signatureRequest.scheduledSendDate && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Scheduled Send</h3>
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-900">
                    📅 {new Date(signatureRequest.scheduledSendDate).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Validation Warnings */}
        {signatureRequest.signatureFields.length === 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-900">No signature fields placed</p>
              <p className="text-xs text-yellow-700 mt-1">Add at least one signature field before sending</p>
            </div>
          </div>
        )}

      </div>

      {/* Footer - Action Buttons */}
      <div className="p-6 border-t bg-slate-50 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowReviewDrawer(false)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Editing
        </Button>
        
        <Button
          onClick={() => {
            // Validate before sending
            if (signatureRequest.signatureFields.length === 0) {
              alert('Please add at least one signature field');
              return;
            }
            const validRecipients = signatureRequest.recipients.filter(
              (r) => r.name && (mode === 'send' ? r.email : true)
            );
            if (validRecipients.length === 0) {
              alert(mode === 'send' ? 'Please add recipient emails' : 'Please add at least one role');
              return;
            }
            
            // Close drawer and send
            setShowReviewDrawer(false);
            handleSendSignature();
          }}
          disabled={isSending || signatureRequest.signatureFields.length === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSending ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              {mode === 'send' ? 'Sending...' : 'Saving...'}
            </>
          ) : (
            <>
              {mode === 'send' ? (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Signature Request
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4 mr-2" />
                  Save as Template
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  </>
)}
    </div>
  );
}