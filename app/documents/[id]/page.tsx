//APP/DOCUMENTS/[ID]/PAGE.TSX

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";


import VideoWalkthroughDrawer from "./components/VideoWalkthroughDrawer"
import DocumentHeader   from "./components/DocumentHeader";
import DocumentTabs     from "./components/DocumentTabs";
import MobileSidebar    from "./components/MobileSidebar";
import DeleteDialog     from "./components/DeleteDialog";
import ConfirmDialog    from "./components/ConfirmDialog";
import EditLinkDrawer   from "./components/EditLinkDrawer";
import PerformanceTab   from "./components/PerformanceTab";
import UtilizationTab   from "./components/UtilizationTab";
import ShareLinkDrawer  from "./components/ShareLinkDrawer";
import SignatureDialog  from "./components/SignatureDialog";
import PresentModeDrawer from "./components/PresentModeDrawer";
import PreviewDrawer    from "./components/PreviewDrawer";
import SuccessDialog    from "./components/SuccessDialog";
import ActivityTab      from "./components/ActivityTab";
import SignaturesTab    from "./components/SignaturesTab";
import DriveImportDrawer from "./components/DriveImportDrawer";
import PageInfoTooltip  from "@/components/PageInfoTooltip";

import { FileText, LinkIcon, Loader2, Mail , Video } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ──────────────────────────────────────────────
type DocumentType = {
  _id: string; filename: string; size: number; numPages: number;
  createdAt: string; notes?: string; thumbnail?: string;
  isTemplate?: boolean; originalFilename?: string;
  originalFormat?: string; mimeType?: string; ownerEmail?: string;
};
type Recipient = { name: string; email: string; role?: string; color?: string };
type SignatureField = {
  id: string | number; type: "signature" | "date" | "text";
  x: number; y: number; page: number; recipientIndex: number;
  width?: number; height?: number;
};
type SignatureRequestType = {
  recipientEmail?: string; recipientName?: string; message?: string;
  dueDate?: string; isTemplate: boolean; step?: number;
  recipients?: Recipient[]; signatureFields?: SignatureField[];
};
type GeneratedLink = { recipient?: string; email?: string; link?: string; status?: string };

const DEFAULT_SHARE_SETTINGS = {
  requireEmail: true, allowDownload: false, expiresIn: 7, password: "",
  recipientEmails: [] as string[], sendEmailNotification: true, customMessage: "",
  requireNDA: false, allowedEmails: [] as string[], recipientNames: [] as string[],
  enableWatermark: false, watermarkText: "", watermarkPosition: "bottom" as const,
  ndaText: "", ndaTemplateId: "", customNdaText: "", useCustomNda: false,
  ndaAgreementId: "", ndaUrl: "",
  allowPrint: true, allowForwarding: true, notifyOnDownload: false,
  downloadLimit: undefined as number | undefined, viewLimit: undefined as number | undefined,
  selfDestruct: false, availableFrom: "",
  linkType: "public" as "public" | "email-gated" | "domain-restricted",
  sharedByName: "", logoUrl: "",
};

// ── Page ───────────────────────────────────────────────
export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();

  // Core state
  const [doc, setDoc] = useState<DocumentType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"activity" | "performance" | "signatures" | "utilization">("activity");

  // PDF / preview
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [presentMode, setPresentMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Notes
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [sigAnalytics, setSigAnalytics] = useState<any>(null);
  const [sigAnalyticsLoading, setSigAnalyticsLoading] = useState(false);
  const [liveViewerCount, setLiveViewerCount] = useState(0);
  const [liveViewers, setLiveViewers] = useState<any[]>([]);
  const [heatmapPage, setHeatmapPage] = useState(1);
  const [spacesCount, setSpacesCount] = useState(0);
  const [spacesLoading, setSpacesLoading] = useState(true);

  // Dialogs / drawers
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateLinkDialog, setShowCreateLinkDialog] = useState(false);
  const [showEditLinkDrawer, setShowEditLinkDrawer] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editMode, setEditMode] = useState<"create" | "edit" | "duplicate">("create");
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showDriveFilesDialog, setShowDriveFilesDialog] = useState(false);
  const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; title: string; message: string;
    onConfirm: () => void; danger?: boolean;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const [showVideoDrawer, setShowVideoDrawer] = useState(false)
const [documentVideos, setDocumentVideos] = useState<any[]>([])
  const [shareSettings, setShareSettings] = useState(DEFAULT_SHARE_SETTINGS);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientNameInput, setRecipientNameInput] = useState("");
  const [recipientInputMethod, setRecipientInputMethod] = useState<"single" | "bulk" | "csv">("single");
  const [bulkRecipientInput, setBulkRecipientInput] = useState("");
  const [csvPreview, setCsvPreview] = useState<Array<{ email: string; name?: string; company?: string }>>([]);
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [analyticsLevel, setAnalyticsLevel] = useState<string>('full');

  // Signature
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequestType>({
    recipientEmail: "", recipientName: "", message: "", dueDate: "",
    isTemplate: false, step: 1, recipients: [], signatureFields: [],
  });
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [isSending, setIsSending] = useState(false);

  // ── Fetch helpers ──────────────────────────────────
  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setDoc(data.document);
      } else if (res.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to fetch document:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}/analytics`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
  setAnalytics(data.analytics)
  setAnalyticsLevel(data.analyticsLevel || 'full')
}
      } else if (res.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSignatureAnalytics = async () => {
    setSigAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/signature-analytics`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSigAnalytics(data.analytics);
      }
    } catch (err) {
      console.error("Failed to fetch signature analytics:", err);
    } finally {
      setSigAnalyticsLoading(false);
    }
  };

  const fetchSpacesCount = async () => {
    try {
      const res = await fetch("/api/spaces", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setSpacesCount(data.spaces?.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch spaces:", err);
    } finally {
      setSpacesLoading(false);
    }
  };

  // ── Effects ────────────────────────────────────────
  useEffect(() => {
    fetchDocument();
    fetchAnalytics();
    fetchSignatureAnalytics();
    fetchSpacesCount();
  }, [params.id]);

  useEffect(() => {
    if (doc?.notes) setNotes(doc.notes);
  }, [doc]);

  useEffect(() => {
    if (showSignatureDialog && signatureRequest.step === 2 && !pdfUrl) {
      fetchPdfForPreview(previewPage);
    }
  }, [showSignatureDialog, signatureRequest.step]);

  // Live viewer polling
  useEffect(() => {
    if (!params.id) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/documents/${params.id}/analytics`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setLiveViewerCount(data.analytics.liveViewerCount || 0);
            setLiveViewers(data.analytics.realTimeViewers || []);
          }
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [params.id]);

  // PDF blob cleanup on unmount
  useEffect(() => {
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, []);

  // ── PDF helpers ────────────────────────────────────
  const fetchPdfForPreview = async (page = 1) => {
    setIsLoadingPage(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/file?page=${page}&serve=blob`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setTotalPages(doc?.numPages || 1);
        setPreviewPage(page);
      }
    } catch (err) {
      console.error("PDF fetch error:", err);
    } finally {
      setIsLoadingPage(false);
    }
  };

  const handleNextPage = () => { if (previewPage < totalPages) fetchPdfForPreview(previewPage + 1); };
  const handlePrevPage = () => { if (previewPage > 1) fetchPdfForPreview(previewPage - 1); };
  const handleGoToPage = (page: number) => { if (page >= 1 && page <= totalPages) fetchPdfForPreview(page); };

  const handlePreview = () => {
    setPreviewOpen(true);
    setPreviewPage(1);
    if (!pdfUrl) fetchPdfForPreview(1);
  };

  const handlePresent = () => {
    setPresentMode(true);
    setPreviewPage(1);
    if (!pdfUrl) fetchPdfForPreview(1);
  };

  // ── Download ───────────────────────────────────────
  const handleDownload = async () => {
    if (!doc) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/file`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = doc.filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch { alert("Failed to download document."); }
    finally { setIsDownloading(false); }
  };

  // ── Notes ──────────────────────────────────────────
  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setIsEditingNotes(false);
        if (doc) setDoc({ ...doc, notes });
      } else { alert("Failed to save notes"); }
    } catch { alert("Failed to save notes"); }
    finally { setIsSavingNotes(false); }
  };

  // ── Delete ─────────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/documents/${params.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) router.push("/dashboard");
      else alert("Failed to delete document");
    } catch { alert("Failed to delete document"); }
    finally { setIsDeleting(false); setShowDeleteDialog(false); }
  };

  // ── Export visits ──────────────────────────────────
  const handleExportVisits = async () => {
    if (!doc) return;
    try {
      const res = await fetch(`/api/documents/${params.id}/analytics`, { credentials: "include" });
      if (!res.ok) { toast.error("Failed to fetch analytics"); return; }
      const data = await res.json();
      const rows = [["Date", "Visitor", "Time Spent", "Pages Viewed", "Device", "Completion"]];
      (data.analytics.topViewers || []).forEach((v: any) => {
        rows.push([v.lastViewed, v.email, v.time, "-", "-", "-"]);
      });
      if (rows.length === 1) rows.push(["No visits yet", "-", "-", "-", "-", "-"]);
      const csv = rows.map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${doc.filename}-analytics-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(url);
    } catch { toast.error("Failed to export analytics"); }
  };

  // ── Share link helpers ─────────────────────────────
  const handleOpenLinkDrawer = (linkType: "public" | "email-gated") => {
    setEditMode("create");
    setEditingLink(null);
    setGeneratedLink(null);
    setShowCreateLinkDialog(true);
    setShareSettings({ ...DEFAULT_SHARE_SETTINGS, linkType,
      requireEmail: linkType === "email-gated" });
  };

  const handleCreateLink = () => handleOpenLinkDrawer("public");

  // ── Logo helpers ───────────────────────────────────
  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be less than 2MB"); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    await handleUploadLogo(file);
  };

  const handleUploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/upload/logo", { method: "POST", credentials: "include", body: formData });
      if (res.ok) {
        const data = await res.json();
        setShareSettings((prev) => ({ ...prev, logoUrl: data.logoUrl }));
        toast.success("Logo uploaded!");
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to upload logo");
      }
    } catch { toast.error("Failed to upload logo"); }
    finally { setIsUploadingLogo(false); }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null); setLogoPreview(null);
    setShareSettings((prev) => ({ ...prev, logoUrl: "" }));
    toast.success("Logo removed");
  };

  // ── Recipient helpers ──────────────────────────────
  const handleAddRecipient = () => {
    const email = recipientInput.trim().toLowerCase();
    const name = recipientNameInput.trim();
    if (!email) return;
    if (!name) { toast.error("Please enter recipient name"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Invalid email"); return; }
    if (shareSettings.recipientEmails.includes(email)) { toast.error("Email already added"); return; }
    setShareSettings((prev) => ({
      ...prev,
      recipientEmails: [...prev.recipientEmails, email],
      recipientNames: [...(prev.recipientNames || []), name],
    }));
    setRecipientInput(""); setRecipientNameInput("");
    toast.success(`Added ${name} (${email})`);
  };

  const handleBulkAddRecipients = () => {
    const emails = bulkRecipientInput.trim()
      .split(/[\n,]+/).map((e) => e.trim().toLowerCase())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (!emails.length) { toast.error("No valid emails found"); return; }
    const newEmails = [...new Set(emails)].filter((e) => !shareSettings.recipientEmails.includes(e));
    if (!newEmails.length) { toast.error("All emails already added"); return; }
    setShareSettings((prev) => ({ ...prev, recipientEmails: [...prev.recipientEmails, ...newEmails] }));
    setBulkRecipientInput(""); setShowAllRecipients(true);
    toast.success(`Added ${newEmails.length} recipient${newEmails.length !== 1 ? "s" : ""}`);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { toast.error("Please upload a CSV file"); return; }
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) { toast.error("CSV must have header and at least 1 row"); return; }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIndex = headers.findIndex((h) => h.includes("email"));
    if (emailIndex === -1) { toast.error('CSV must have an "email" column'); return; }
    const nameIndex = headers.findIndex((h) => h.includes("name"));
    const companyIndex = headers.findIndex((h) => h.includes("company"));
    const contacts = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim());
      return {
        email: cols[emailIndex]?.toLowerCase() || "",
        name: nameIndex >= 0 ? cols[nameIndex] : undefined,
        company: companyIndex >= 0 ? cols[companyIndex] : undefined,
      };
    }).filter((c) => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
    if (!contacts.length) { toast.error("No valid emails in CSV"); return; }
    setCsvPreview(contacts);
    toast.success(`Found ${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`);
  };

  const handleConfirmCSV = () => {
    const newEmails = csvPreview.map((c) => c.email)
      .filter((e) => !shareSettings.recipientEmails.includes(e));
    if (!newEmails.length) { toast.error("All emails already added"); return; }
    setShareSettings((prev) => ({ ...prev, recipientEmails: [...prev.recipientEmails, ...newEmails] }));
    setCsvPreview([]); setShowAllRecipients(true); setRecipientInputMethod("single");
    toast.success(`Imported ${newEmails.length} recipient${newEmails.length !== 1 ? "s" : ""}`);
  };

  const handleAttachFromDrive = async () => {
    setShowDriveFilesDialog(true);
  };

  // ── Thumbnail ──────────────────────────────────────
  const handleUpdateThumbnail = () => setShowThumbnailDialog(true);

  // ── Utilities ──────────────────────────────────────
  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return Math.floor(seconds / 60) + " min ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago";
    return Math.floor(seconds / 86400) + " days ago";
  };

  // ── Loading / not found ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Document not found</h2>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <PageInfoTooltip
        pageId="documents"
        message="View and manage your uploaded PDF documents. Preview, download, and share documents with others."
        position="top"
      />

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        doc={doc}
        liveViewerCount={liveViewerCount}
        notes={notes}
        setNotes={setNotes}
        isEditingNotes={isEditingNotes}
        setIsEditingNotes={setIsEditingNotes}
        isSavingNotes={isSavingNotes}
        onSaveNotes={handleSaveNotes}
        isDownloading={isDownloading}
        onPreview={handlePreview}
        onPresent={handlePresent}
        onDownload={handleDownload}
        onExportVisits={handleExportVisits}
        onUpdateThumbnail={handleUpdateThumbnail}
        onOpenLinkDrawer={handleOpenLinkDrawer}
        onDelete={() => setShowDeleteDialog(true)}
        router={router}
        formatTimeAgo={formatTimeAgo}
      />

      {/* Header */}
      <DocumentHeader
        doc={doc}
        liveViewerCount={liveViewerCount}
        notes={notes}
        setNotes={setNotes}
        isEditingNotes={isEditingNotes}
        setIsEditingNotes={setIsEditingNotes}
        isSavingNotes={isSavingNotes}
        onSaveNotes={handleSaveNotes}
        isDownloading={isDownloading}
        onPreview={handlePreview}
        onPresent={handlePresent}
        onDownload={handleDownload}
        onExportVisits={handleExportVisits}
        onOpenLinkDrawer={handleOpenLinkDrawer}
        onDeleteClick={() => setShowDeleteDialog(true)}
        onMobileMenuOpen={() => setMobileMenuOpen(true)}
        onRefreshDocument={fetchDocument}
        router={router}
        formatTimeAgo={formatTimeAgo}
      />

      {/* Tabs */}
      <DocumentTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {activeTab === "activity" && (
          <div className="space-y-6">
            {analyticsLoading && (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Loading activity...</p>
                </div>
              </div>
            )}

            {!analyticsLoading && doc.isTemplate && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Signable Template Ready</h2>
                  <p className="text-slate-600 mb-6">Send it to recipients to collect signatures.</p>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
                      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      Send to Recipients
                    </Button>
                    <Button onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)} variant="outline" className="gap-2">
                      Edit Template
                    </Button>
                    <Button
    onClick={() => router.push(`/documents/${doc._id}/signature?mode=bulk-send`)}
    variant="outline"
    className="gap-2"
  >
    Bulk Send
  </Button>
                    <Button
                      onClick={() => setConfirmDialog({
                        open: true, title: "Remove Template",
                        message: "Remove template configuration? This cannot be undone.",
                        danger: true,
                        onConfirm: async () => {
                          const res = await fetch(`/api/documents/${doc._id}/template`, { method: "DELETE", credentials: "include" });
                          if (res.ok) fetchDocument();
                        },
                      })}
                      variant="outline" className="gap-2 text-red-600 hover:bg-red-50"
                    >
                      Remove Template
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!analyticsLoading && !doc.isTemplate && !analytics?.shares && !analytics?.eSignature?.totalRecipients && (
              <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Put your document to work</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">
                    Create a share link to track who views it, how long they spend, and which pages matter most.
                  </p>
                  <div className="block md:flex space-y-3 md:space-y-0 md:gap-3 justify-center">
  <Button
    onClick={handleCreateLink}
    className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
  >
    <LinkIcon className="h-4 w-4" />
    Create link
  </Button>

  <Button
    onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
    variant="outline"
    className="gap-2"
  >
    <Mail className="h-4 w-4" />
    Request signatures
  </Button>

  <Button
  onClick={() => {
    if (analyticsLevel === 'basic') {
      toast.error('Video walkthroughs require Starter plan or above', {
        description: 'Upgrade to add video walkthroughs to your documents.',
        duration: 5000,
        action: { label: 'Upgrade', onClick: () => router.push('/plan') },
      })
      return
    }
    setShowVideoDrawer(true)
  }}
  variant="outline"
  className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
>
  <Video className="h-4 w-4" />
  Add video walkthrough
</Button>
</div>
                </div>
              </div>
            )}

            
            
{!analyticsLoading && !doc.isTemplate && (analytics?.shares > 0 || analytics?.eSignature?.totalRecipients > 0) && (

  <>
    {/* Video walkthrough button — always visible when doc has activity */}
    <div className="flex justify-end mb-2">
      <Button
  onClick={() => {
    if (analyticsLevel === 'basic') {
      toast.error('Video walkthroughs require Starter plan or above', {
        description: 'Upgrade to add video walkthroughs to your documents.',
        duration: 5000,
        action: { label: 'Upgrade', onClick: () => router.push('/plan') },
      })
      return
    }
    setShowVideoDrawer(true)
  }}
  variant="outline"
  size="sm"
  className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
>
  <Video className="h-4 w-4" />
  {analyticsLevel === 'basic' ? (
    <span className="flex items-center gap-1">
      Manage video walkthroughs
      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-semibold ml-1">
        Starter+
      </span>
    </span>
  ) : 'Manage video walkthroughs'}
</Button>
    </div>
              <ActivityTab
                analytics={analytics}
                doc={doc}
                token={String(params.id)}
                onCreateLink={handleCreateLink}
                onEditLink={(link) => { setEditingLink(link); setShowEditLinkDrawer(true); }}
                onOpenShareDrawer={(link, mode, settings) => {
                  setEditingLink(link); setEditMode(mode);
                  setShareSettings(settings); setShowCreateLinkDialog(true);

                }}
                onConfirm={(opts) => setConfirmDialog({ open: true, ...opts })}
                analyticsLevel={analyticsLevel}
              />
                </>
            )}
          </div>
        )}

        {activeTab === "performance" && (
          <PerformanceTab
            analytics={analytics} analyticsLoading={analyticsLoading}
            liveViewerCount={liveViewerCount} liveViewers={liveViewers}
            heatmapPage={heatmapPage} setHeatmapPage={setHeatmapPage}
            doc={doc} onCreateLink={handleCreateLink}
            analyticsLevel={analyticsLevel}
            
          />
        )}

        {activeTab === "signatures" && (
          <div className="space-y-0">
            {sigAnalyticsLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
              </div>
            ) : (
               <SignaturesTab
        analytics={sigAnalytics}
        docId={String(params.id)}
        analyticsLevel={analyticsLevel}   
      />
            )}
          </div>
        )}

        {activeTab === "utilization" && (
          <UtilizationTab
            analytics={analytics} analyticsLoading={analyticsLoading}
            spacesCount={spacesCount} spacesLoading={spacesLoading}
            doc={doc} onCreateLink={handleCreateLink}
            params={{ id: params.id as string | string[] }}
          />
        )}
      </div>

      {/* ── Dialogs & Drawers ── */}

      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        filename={doc.filename}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        state={confirmDialog}
        onOpenChange={(o) => setConfirmDialog((c) => ({ ...c, open: o }))}
      />

      <PreviewDrawer
        open={previewOpen} onOpenChange={setPreviewOpen}
        doc={doc} pdfUrl={pdfUrl} isLoadingPage={isLoadingPage}
        previewPage={previewPage} totalPages={totalPages}
        onPrevPage={handlePrevPage} onNextPage={handleNextPage}
        onGoToPage={handleGoToPage} onDownload={handleDownload}
        isDownloading={isDownloading}
      />

      <PresentModeDrawer
        open={presentMode} onOpenChange={setPresentMode}
        doc={doc} pdfUrl={pdfUrl} isLoadingPage={isLoadingPage}
        previewPage={previewPage} totalPages={totalPages}
        onPrevPage={handlePrevPage} onNextPage={handleNextPage}
        onGoToPage={handleGoToPage}
      />

      <ShareLinkDrawer
        open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}
        doc={doc} docId={String(params.id)}
        editMode={editMode} editingLink={editingLink}
        shareSettings={shareSettings} setShareSettings={setShareSettings}
        recipientInput={recipientInput} setRecipientInput={setRecipientInput}
        recipientNameInput={recipientNameInput} setRecipientNameInput={setRecipientNameInput}
        recipientInputMethod={recipientInputMethod} setRecipientInputMethod={setRecipientInputMethod}
        bulkRecipientInput={bulkRecipientInput} setBulkRecipientInput={setBulkRecipientInput}
        csvPreview={csvPreview} setCsvPreview={setCsvPreview}
        showAllRecipients={showAllRecipients} setShowAllRecipients={setShowAllRecipients}
        logoFile={logoFile} logoPreview={logoPreview} isUploadingLogo={isUploadingLogo}
        handleLogoFileSelect={handleLogoFileSelect} handleRemoveLogo={handleRemoveLogo}
        handleAddRecipient={handleAddRecipient} handleBulkAddRecipients={handleBulkAddRecipients}
        handleCSVUpload={handleCSVUpload} handleConfirmCSV={handleConfirmCSV}
        handleAttachFromDrive={handleAttachFromDrive}
        onConfirm={(opts) => setConfirmDialog({ open: true, ...opts })}
        onClose={() => { setShowCreateLinkDialog(false); setEditMode("create"); setEditingLink(null); }}
        onSuccess={() => window.location.reload()}
      />

      <SignatureDialog
        open={showSignatureDialog} onOpenChange={setShowSignatureDialog}
        doc={doc} pdfUrl={pdfUrl} isSending={isSending} setIsSending={setIsSending}
        signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest}
        onSuccess={(links) => { setGeneratedLinks(links); setShowSuccessDialog(true); }}
        fetchDocument={fetchDocument}
      />

      <SuccessDialog
        open={showSuccessDialog} onOpenChange={setShowSuccessDialog}
        doc={doc} generatedLinks={generatedLinks}
        onClose={() => {
          setShowSuccessDialog(false);
          setSignatureRequest({ recipientEmail: "", recipientName: "", message: "", dueDate: "", step: 1, recipients: [], signatureFields: [], isTemplate: false });
        }}
      />

      <EditLinkDrawer
        open={showEditLinkDrawer} onOpenChange={setShowEditLinkDrawer}
        editingLink={editingLink} setEditingLink={setEditingLink}
        params={{ id: params.id }}
        onConfirm={(opts) => setConfirmDialog({ open: true, ...opts })}
      />

      <DriveImportDrawer
        open={showDriveFilesDialog}
        onOpenChange={setShowDriveFilesDialog}
        onImport={(contacts) => { setCsvPreview(contacts); setShowDriveFilesDialog(false); }}
        router={router}
      />

      <VideoWalkthroughDrawer
  open={showVideoDrawer}
  onOpenChange={setShowVideoDrawer}
  doc={doc}
  docId={String(params.id)}
  videos={documentVideos}
  onVideosChange={setDocumentVideos}
/>
    </div>
  );
}