 
 
"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConditionalFieldBuilder from "@/components/ConditionalFieldBuilder";
import { toast } from "sonner";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  FileSignature,
  Clock,
  FileText,
  Mail,
  ArrowLeft,
  Camera,
} from "lucide-react";
import { ACCESS_CODE_TYPES } from "@/lib/accessCodeConfig";
import PageInfoTooltip from "@/components/PageInfoTooltip";

// ── Split components (same folder) ──────────────────────────────────────────
import SignatureNavbar from "./components/SignatureNavbar";
import StepOne        from "./components/StepOne";
import StepTwo        from "./components/StepTwo";
import ReviewDrawer   from "./components/ReviewDrawer";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  type: "signature" | "date" | "text" | "checkbox" | "attachment" | "dropdown" | "radio";
  x: number;
  y: number;
  page: number;
  recipientIndex: number;
  width?: number;
  height?: number;
  label?: string;
  defaultChecked?: boolean;
  attachmentLabel?: string;
  attachmentType?: string;
  isRequired?: boolean;
  options?: string[];
  defaultValue?: string;
  conditional?: {
    enabled: boolean;
    dependsOn: string | number;
    condition: "checked" | "unchecked" | "equals" | "not_equals" | "contains";
    value?: string;
  };
};

type CCRecipient = {
  name: string;
  email: string;
  notifyWhen: "completed" | "immediately";
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
  viewMode?: "isolated" | "shared";
  signingOrder?: "any" | "sequential";
  expirationDays?: string;
  ccRecipients?: CCRecipient[];
  accessCodeRequired?: boolean;
  accessCodeType?: string;
  accessCodeHint?: string;
  accessCode?: string;
  scheduledSendDate?: string;
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ESignaturePage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const mode     = searchParams?.get("mode");
  const returnTo = searchParams.get("returnTo");

  // ── Core state ──────────────────────────────────────────────────────────
  const [doc,     setDoc]     = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl,  setPdfUrl]  = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Dialog / drawer state ───────────────────────────────────────────────
  const [showSuccessDialog,    setShowSuccessDialog]    = useState(false);
  const [showReviewDrawer,     setShowReviewDrawer]     = useState(false);
  const [showEditDrawer,       setShowEditDrawer]       = useState(false);
  const [showTemplateSavedModal, setShowTemplateSavedModal] = useState(false);
  const [editingFieldLogic,    setEditingFieldLogic]    = useState<SignatureField | null>(null);
  const [editingLabelField,    setEditingLabelField]    = useState<SignatureField | null>(null);
  const [showAccessCode,       setShowAccessCode]       = useState(false);

  // ── Generated links after send ─────────────────────────────────────────
  const [generatedLinks, setGeneratedLinks] = useState<
    Array<{ recipient: string; email: string; link: string; status: string; isCC?: boolean }>
  >([]);

  // ── History (undo/redo) ─────────────────────────────────────────────────
  const [fieldHistory,  setFieldHistory]  = useState<SignatureField[][]>([]);
  const [historyIndex,  setHistoryIndex]  = useState(-1);

  // ── Draft state ─────────────────────────────────────────────────────────
  const [draftSaving,   setDraftSaving]   = useState(false);
  const [draftLastSaved, setDraftLastSaved] = useState<Date | null>(null);
  const [draftLoaded,   setDraftLoaded]   = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Signature request ───────────────────────────────────────────────────
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest>({
    recipientEmail: "",
    recipientName:  "",
    message:        "",
    dueDate:        "",
    isTemplate:     false,
    step:           1,
    recipients:     [],
    signatureFields: [],
  });

  // ── Ref for keyboard handler ────────────────────────────────────────────
  const signatureRequestRef = useRef(signatureRequest);

  // ─── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => { fetchDocument(); }, [params.id]);

  // Keep ref in sync
  useEffect(() => {
    signatureRequestRef.current = signatureRequest;
  }, [signatureRequest]);

  // Save field state to history on every change
  useEffect(() => {
    if (
      fieldHistory[historyIndex] &&
      JSON.stringify(fieldHistory[historyIndex]) ===
        JSON.stringify(signatureRequest.signatureFields)
    ) return;

    const newHistory = fieldHistory.slice(0, historyIndex + 1);
    newHistory.push([...signatureRequest.signatureFields]);
    setFieldHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [signatureRequest.signatureFields]);

  // Keyboard undo / redo
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setHistoryIndex((cur) => {
          if (cur > 0) {
            const next = cur - 1;
            setSignatureRequest({
              ...signatureRequestRef.current,
              signatureFields: fieldHistory[next],
            });
            return next;
          }
          return cur;
        });
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        setHistoryIndex((cur) => {
          if (cur < fieldHistory.length - 1) {
            const next = cur + 1;
            setSignatureRequest({
              ...signatureRequestRef.current,
              signatureFields: fieldHistory[next],
            });
            return next;
          }
          return cur;
        });
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  // Fetch PDF when entering step 2
  useEffect(() => {
    if (doc && signatureRequest.step === 2 && !pdfUrl) {
      fetchPdfForPreview();
    }
  }, [doc, signatureRequest.step]);

  // Auto-save draft
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (
      signatureRequest.recipients.length > 0 ||
      signatureRequest.signatureFields.length > 0
    ) {
      autoSaveTimerRef.current = setTimeout(() => { saveDraft(); }, 3000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
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

  // Load draft once doc is ready
  useEffect(() => {
    if (doc && !draftLoaded) loadDraft();
  }, [doc, draftLoaded]);

  // ─── Data fetchers ────────────────────────────────────────────────────────

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDoc(data.document);

          const isEditingRealTemplate = mode === "edit";

          if (isEditingRealTemplate) {
            const templateRes = await fetch(`/api/documents/${params.id}/template`, {
              credentials: "include",
            });
            if (templateRes.ok) {
              const templateData = await templateRes.json();
              setSignatureRequest({
                recipientEmail: "",
                recipientName:  "",
                message:        "",
                dueDate:        "",
                step:           1,
                recipients:     templateData.template.recipients || [
                  { name: "Role 1", email: "", role: "Signer", color: "#9333ea" },
                ],
                signatureFields: templateData.template.signatureFields || [],
                isTemplate:     true,
                viewMode:       templateData.template.viewMode || "isolated",
              });
            } else {
              setSignatureRequest({
                recipientEmail: "",
                recipientName:  "",
                message:        "",
                dueDate:        "",
                step:           1,
                recipients:     [{ name: "Role 1", email: "", role: "Signer", color: "#9333ea" }],
                signatureFields: [],
                isTemplate:     true,
                viewMode:       "isolated",
              });
            }
          } else {
            if (data.document.isTemplate) {
              const templateRes = await fetch(`/api/documents/${params.id}/template`, {
                credentials: "include",
              });
              if (templateRes.ok) {
                const templateData = await templateRes.json();
                const templateRoles = templateData.template.recipients || [
                  { name: "Recipient 1", email: "", role: "Signer", color: "#9333ea" },
                ];
                setSignatureRequest({
                  recipientEmail:  "",
                  recipientName:   "",
                  message:         "",
                  dueDate:         "",
                  step:            1,
                  recipients:      templateRoles.map((role: Recipient) => ({ ...role, email: "" })),
                  signatureFields: templateData.template.signatureFields || [],
                  isTemplate:      false,
                  viewMode:        templateData.template.viewMode || "isolated",
                });
              } else {
                setSignatureRequest({
                  recipientEmail: "",
                  recipientName:  "",
                  message:        "",
                  dueDate:        "",
                  step:           1,
                  recipients:     [{ name: "Recipient 1", email: "", role: "Signer", color: "#9333ea" }],
                  signatureFields: [],
                  isTemplate:     false,
                  viewMode:       "isolated",
                });
              }
            } else {
              setSignatureRequest({
                recipientEmail: "",
                recipientName:  "",
                message:        "",
                dueDate:        "",
                step:           1,
                recipients:     [{ name: "Recipient 1", email: "", role: "Signer", color: "#9333ea" }],
                signatureFields: [],
                isTemplate:     false,
                viewMode:       "isolated",
              });
            }
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
      const res = await fetch(
        `/api/documents/${params.id}/file?page=${currentPage}&serve=blob`,
        { credentials: "include" }
      );
      if (res.ok) {
        const blob = await res.blob();
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error("Failed to fetch PDF:", error);
    }
  };

  // ─── Draft helpers ────────────────────────────────────────────────────────

  const saveDraft = async () => {
    if (!doc?._id || mode === "edit") return;
    try {
      setDraftSaving(true);
      const response = await fetch(`/api/signature-drafts/${doc._id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipients:          signatureRequest.recipients,
          signatureFields:     signatureRequest.signatureFields,
          viewMode:            signatureRequest.viewMode,
          signingOrder:        signatureRequest.signingOrder,
          expirationDays:      signatureRequest.expirationDays,
          accessCodeRequired:  signatureRequest.accessCodeRequired,
          accessCodeType:      signatureRequest.accessCodeType,
          accessCodeHint:      signatureRequest.accessCodeHint,
          accessCode:          signatureRequest.accessCode,
          intentVideoRequired: signatureRequest.intentVideoRequired,
          message:             signatureRequest.message,
          dueDate:             signatureRequest.dueDate,
          scheduledSendDate:   signatureRequest.scheduledSendDate,
          ccRecipients:        signatureRequest.ccRecipients,
          step:                signatureRequest.step,
        }),
      });
      if (response.ok) setDraftLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setDraftSaving(false);
    }
  };

  const loadDraft = async () => {
    if (!doc?._id || mode !== "draft") return;
    try {
      const response = await fetch(`/api/signature-drafts/${doc._id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.draft) {
          setSignatureRequest({
            ...signatureRequest,
            recipients:          data.draft.recipients      || [],
            signatureFields:     data.draft.signatureFields || [],
            viewMode:            data.draft.viewMode        || "isolated",
            signingOrder:        data.draft.signingOrder    || "any",
            expirationDays:      data.draft.expirationDays  || "30",
            accessCodeRequired:  data.draft.accessCodeRequired  || false,
            accessCodeType:      data.draft.accessCodeType,
            accessCodeHint:      data.draft.accessCodeHint,
            accessCode:          data.draft.accessCode,
            intentVideoRequired: data.draft.intentVideoRequired || false,
            message:             data.draft.message    || "",
            dueDate:             data.draft.dueDate    || "",
            scheduledSendDate:   data.draft.scheduledSendDate || "",
            ccRecipients:        data.draft.ccRecipients || [],
            isTemplate:          false,
            step:                data.draft.step || 1,
          });
          setDraftLastSaved(new Date(data.draft.lastSaved));
          setDraftLoaded(true);
          toast.success("Draft restored", {
            description: `Restored from ${new Date(data.draft.lastSaved).toLocaleString()}`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  const deleteDraft = async () => {
    if (!doc?._id) return;
    try {
      await fetch(`/api/signature-drafts/${doc._id}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  };

  // ─── Send / Save ──────────────────────────────────────────────────────────

  const handleSendSignature = async () => {
    if (mode === "edit") {
      if (!signatureRequest.recipients.some((r) => r.name)) {
        toast.error("No roles defined", {
          description: "Add at least one role like 'Signer 1' or 'Approver' before saving.",
        });
        return;
      }
    } else {
      if (!signatureRequest.recipients.some((r) => r.name && r.email)) {
        toast.error("No recipients added", {
          description: "Please add at least one recipient with a name and email address.",
        });
        return;
      }
    }

    setIsSending(true);
    try {
      if (mode === "edit") {
        // ── Save template ──
        const response = await fetch(`/api/documents/${doc?._id}/template`, {
          method:  "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signatureFields: signatureRequest.signatureFields,
            recipients:      signatureRequest.recipients,
          }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          await deleteDraft();
          setShowTemplateSavedModal(true);
        } else {
          toast.error("Failed to save template", {
            description: data.message || "Something went wrong. Please try again.",
          });
        }
      } else {
        // ── Send signature request ──
        const response = await fetch("/api/signature/create", {
          method:  "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId:          doc?._id,
            recipients:          signatureRequest.recipients,
            signatureFields:     signatureRequest.signatureFields,
            message:             signatureRequest.message,
            dueDate:             signatureRequest.dueDate,
            viewMode:            signatureRequest.viewMode            || "isolated",
            signingOrder:        signatureRequest.signingOrder        || "any",
            expirationDays:      signatureRequest.expirationDays      || "30",
            ccRecipients:        signatureRequest.ccRecipients        || [],
            accessCodeRequired:  signatureRequest.accessCodeRequired  || false,
            accessCodeType:      signatureRequest.accessCodeType,
            accessCodeHint:      signatureRequest.accessCodeHint,
            accessCode:          signatureRequest.accessCode,
            scheduledSendDate:   signatureRequest.scheduledSendDate,
            intentVideoRequired: signatureRequest.intentVideoRequired || false,
          }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          await deleteDraft();

          interface SigReqResponse {
            recipient: string;
            email: string;
            uniqueId: string;
            status: string;
          }
          const links = (data.signatureRequests as SigReqResponse[]).map((r) => ({
            recipient: r.recipient,
            email:     r.email,
            link:      `${window.location.origin}/sign/${r.uniqueId}?recipient=${r.email}`,
            status:    r.status,
          }));

          if (data.ccRecipients?.length > 0) {
            const ccLinks = data.ccRecipients.map((cc: { name: string; email: string; uniqueId: string }) => ({
              recipient: cc.name,
              email:     cc.email,
              link:      `${window.location.origin}/cc/${cc.uniqueId}?email=${cc.email}`,
              status:    "CC",
              isCC:      true,
            }));
            setGeneratedLinks([...links, ...ccLinks]);
          } else {
            setGeneratedLinks(links);
          }

          setShowSuccessDialog(true);
        } else {
          toast.error("Failed to send request", {
            description: data.message || "Something went wrong. Please try again.",
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // ─── Loading / not found ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <PageInfoTooltip
        pageId="signature"
        message="Create and manage signature requests for your documents. Add recipients, set due dates, and track signatures."
        position="top"
      />

      {/* ── Navbar ── */}
      <SignatureNavbar
        doc={doc}
        mode={mode}
        signatureRequest={signatureRequest}
        setSignatureRequest={setSignatureRequest}
        isSending={isSending}
        handleSendSignature={handleSendSignature}
        showReviewDrawer={showReviewDrawer}
        setShowReviewDrawer={setShowReviewDrawer}
      />

      {/* ── Draft saved indicator ── */}
      {draftLastSaved && mode !== "edit" && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-md border transition-all ${
              draftSaving
                ? "bg-white border-slate-200 text-slate-500"
                : "bg-white border-slate-200 text-slate-400"
            }`}
          >
            {draftSaving ? (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full" />
                Saving draft…
              </>
            ) : (
              <>
                <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Draft saved
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">

        {/* Step 1 */}
        {signatureRequest.step === 1 && (
          <StepOne
            mode={mode}
            signatureRequest={signatureRequest}
            setSignatureRequest={setSignatureRequest}
          />
        )}

        {/* Step 2 */}
        {signatureRequest.step === 2 && (
          <StepTwo
            doc={doc}
            mode={mode}
            pdfUrl={pdfUrl}
            signatureRequest={signatureRequest}
            setSignatureRequest={setSignatureRequest}
            historyIndex={historyIndex}
            fieldHistory={fieldHistory}
            setHistoryIndex={setHistoryIndex}
            editingFieldLogic={editingFieldLogic}
            setEditingFieldLogic={setEditingFieldLogic}
            editingLabelField={editingLabelField}
            setEditingLabelField={setEditingLabelField}
            showEditDrawer={showEditDrawer}
            setShowEditDrawer={setShowEditDrawer}
          />
        )}

        {/* Step 3 — Review & Send (full page summary) */}
        {signatureRequest.step === 3 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {mode === "edit" ? "Review Template" : "Review & Send"}
              </h2>
              <p className="text-slate-600 mb-8">
                {mode === "edit"
                  ? "Review your reusable template. When you use this template later, you'll just add real recipient emails!"
                  : "Double-check everything before sending your signature request"}
              </p>

              <div className="space-y-6">
                {/* Recipients */}
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

                      {/* Access Code review */}
                      {signatureRequest.accessCodeRequired && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-800">
                            Access Code Protection
                          </h3>
                          <div className="p-4 border rounded-lg bg-slate-50">
                            <p className="text-sm font-medium text-slate-900">
                              {signatureRequest.accessCodeType === "custom"
                                ? "Custom Access Code"
                                : ACCESS_CODE_TYPES.find(
                                    (t) => t.id === signatureRequest.accessCodeType
                                  )?.name}
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

                      {/* Intent Video review */}
                      {signatureRequest.intentVideoRequired && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-slate-800">
                            Intent &amp; Acknowledgement Video
                          </h3>
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

                      {/* CC Recipients review */}
                      {signatureRequest.ccRecipients &&
                        signatureRequest.ccRecipients.length > 0 && (
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
                                      Will receive copy:{" "}
                                      {cc.notifyWhen === "completed"
                                        ? "When completed"
                                        : "Immediately"}
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

                {/* Message */}
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

                {/* Signature fields */}
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
                                {field.type === "signature"  ? "Signature"
                                  : field.type === "date"   ? "Date"
                                  : field.type === "text"   ? "Text"
                                  : field.type === "checkbox"   ? "Checkbox"
                                  : field.type === "attachment" ? `📎 ${field.attachmentLabel || "Attachment"}`
                                  : field.type === "dropdown"   ? `📋 ${field.label || "Dropdown"}`
                                  : field.type === "radio"      ? `⭕ ${field.label || "Radio"}`
                                  : field.type}{" "}
                                - Page {field.page}
                              </p>
                              <p className="text-xs text-slate-600">
                                {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
                              </p>
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
                  ) : (
                    <p className="text-sm text-slate-500">No signature fields added.</p>
                  )}
                </div>

                {/* Due date */}
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
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Review Drawer ── */}
      <ReviewDrawer
        open={showReviewDrawer}
        onClose={() => setShowReviewDrawer(false)}
        doc={doc}
        mode={mode}
        signatureRequest={signatureRequest}
        isSending={isSending}
        handleSendSignature={handleSendSignature}
      />

      {/* ── Success Dialog ── */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-white flex flex-col">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  Signature Request Sent!
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Emails have been sent to the  recipients with their signing links
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Document summary */}
            <div className="bg-slate-50 rounded-lg p-4 border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{doc.filename}</p>
                  <p className="text-sm text-slate-500">
                    Sent to {generatedLinks.length} recipient(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Signing Links Generated</h3>
              <div className="space-y-3">
                {generatedLinks.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-white hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-semibold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.recipient}</p>
                          <p className="text-sm text-slate-600">{item.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                item.isCC
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {item.isCC ? (
                                <><Mail className="h-3 w-3 mr-1" />CC Recipient</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" />{item.status}</>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <Label className="text-xs font-medium text-slate-700 mb-2 block">
                        {item.isCC ? "View-Only Link (CC)" : "Unique Signing Link"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input value={item.link} readOnly className="flex-1 text-sm font-mono bg-white" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(item.link ?? "");
                            toast.success("Link copied to clipboard");
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
                          onClick={() => window.open(item.link, "_blank")}
                          className="flex-shrink-0"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {item.isCC
                          ? ` This view-only link has been emailed to ${item.recipient}.`
                          : ` This unique link has been emailed to ${item.recipient}. You can also share it manually.`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
             
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccessDialog(false);
                  setSignatureRequest({
                    recipientEmail:  "",
                    recipientName:   "",
                    message:         "",
                    dueDate:         "",
                    step:            1,
                    recipients:      [],
                    signatureFields: [],
                    isTemplate:      false,
                  });
                }}
              >
                Close
              </Button>
              
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Label Dialog ── */}
      <Dialog open={!!editingLabelField} onOpenChange={(open) => !open && setEditingLabelField(null)}>
        <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b bg-white">
            <DialogTitle className="text-lg font-semibold text-gray-900">Edit Label</DialogTitle>
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
            <Button variant="outline" onClick={() => setEditingLabelField(null)} className="text-sm">Cancel</Button>
            <Button onClick={() => setEditingLabelField(null)} className="bg-purple-600 hover:bg-purple-700 text-sm">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Conditional Field Builder ── */}
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

      {/* ── Attachment Field Settings ── */}
      {editingFieldLogic && editingFieldLogic.type === "attachment" && (
        <Dialog open={!!editingFieldLogic} onOpenChange={(open) => !open && setEditingFieldLogic(null)}>
          <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b bg-white">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Attachment Field Settings
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Instruction Text (What should they upload?)
                </Label>
                <Input
                  value={editingFieldLogic?.attachmentLabel || ""}
                  onChange={(e) => {
                    if (!editingFieldLogic) return;
                    const updated = signatureRequest.signatureFields.map((f) =>
                      f.id === editingFieldLogic.id ? { ...f, attachmentLabel: e.target.value } : f
                    );
                    setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                    setEditingFieldLogic({ ...editingFieldLogic, attachmentLabel: e.target.value });
                  }}
                  placeholder="e.g., Upload Proof of ID"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Document Type Category</Label>
                <select
                  value={editingFieldLogic?.attachmentType || "supporting_document"}
                  onChange={(e) => {
                    if (!editingFieldLogic) return;
                    const updated = signatureRequest.signatureFields.map((f) =>
                      f.id === editingFieldLogic.id ? { ...f, attachmentType: e.target.value } : f
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
                      f.id === editingFieldLogic.id ? { ...f, isRequired: e.target.checked } : f
                    );
                    setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                    setEditingFieldLogic({ ...editingFieldLogic, isRequired: e.target.checked });
                  }}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                <label htmlFor="attachment-required" className="text-sm text-slate-700">
                  Mark as required
                </label>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setEditingFieldLogic(null)} className="text-sm">Cancel</Button>
              <Button onClick={() => setEditingFieldLogic(null)} className="bg-purple-600 hover:bg-purple-700 text-sm">Save Settings</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Dropdown / Radio Field Settings ── */}
      {editingFieldLogic &&
        (editingFieldLogic.type === "dropdown" || editingFieldLogic.type === "radio") && (
          <Dialog open={!!editingFieldLogic} onOpenChange={(open) => !open && setEditingFieldLogic(null)}>
            <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
              <DialogHeader className="p-6 border-b bg-white">
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {editingFieldLogic.type === "dropdown" ? "Dropdown" : "Radio Button"} Field Settings
                </DialogTitle>
              </DialogHeader>
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Field Label / Question</Label>
                  <Input
                    value={editingFieldLogic?.label || ""}
                    onChange={(e) => {
                      if (!editingFieldLogic) return;
                      const updated = signatureRequest.signatureFields.map((f) =>
                        f.id === editingFieldLogic.id ? { ...f, label: e.target.value } : f
                      );
                      setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                      setEditingFieldLogic({ ...editingFieldLogic, label: e.target.value });
                    }}
                    placeholder="e.g., Select your country"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Options (one per line)</Label>
                  <Textarea
                    value={(editingFieldLogic?.options || []).join("\n")}
                    onChange={(e) => {
                      if (!editingFieldLogic) return;
                      const optionsArray = e.target.value.split("\n");
                      const updated = signatureRequest.signatureFields.map((f) =>
                        f.id === editingFieldLogic.id ? { ...f, options: optionsArray } : f
                      );
                      setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                      setEditingFieldLogic({ ...editingFieldLogic, options: optionsArray });
                    }}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    rows={6}
                    className="text-sm font-mono"
                  />
                  <p className="text-xs text-slate-500">Minimum 2 options required.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="field-required"
                    checked={editingFieldLogic?.isRequired || false}
                    onChange={(e) => {
                      if (!editingFieldLogic) return;
                      const updated = signatureRequest.signatureFields.map((f) =>
                        f.id === editingFieldLogic.id ? { ...f, isRequired: e.target.checked } : f
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
                  {editingFieldLogic.type === "dropdown" ? (
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
                <Button variant="outline" onClick={() => setEditingFieldLogic(null)} className="text-sm">Cancel</Button>
                <Button
                  onClick={() => {
                    const validOptions = (editingFieldLogic?.options || []).filter((o) => o.trim());
                    if (validOptions.length < 2) {
                      toast.error("Not enough options", {
                        description: "Add at least 2 options for this field.",
                      });
                      return;
                    }
                    const updated = signatureRequest.signatureFields.map((f) =>
                      f.id === editingFieldLogic.id ? { ...f, options: validOptions } : f
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

      {/* ── Template Saved Modal ── */}
      <Dialog open={showTemplateSavedModal} onOpenChange={setShowTemplateSavedModal}>
        <DialogContent className="bg-white sm:max-w-md p-0 overflow-hidden rounded-2xl">
          <VisuallyHidden.Root>
    <DialogTitle>Template Saved</DialogTitle>
  </VisuallyHidden.Root>
          <div className="p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
              <FileSignature className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Template Saved!</h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              <span className="font-medium text-slate-700">{doc?.filename}</span> has been saved
              as a reusable template. You can now send it to recipients anytime without re-placing fields.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200"
                onClick={() => {
                  setShowTemplateSavedModal(false);
                  router.push("/dashboard");
                }}
              >
                Go to Dashboard
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                onClick={() => {
                  setShowTemplateSavedModal(false);
                  window.location.href = `/documents/${doc?._id}`;
                }}
              >
                View Document
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}