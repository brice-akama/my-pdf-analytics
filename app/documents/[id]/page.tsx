//APP/DOCUMENTS/[ID]/PAGE.TSX

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
 import Link from "next/link";
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner'



import { Copy, Check, TrendingUp, Users, FileCheck, Expand, Minimize, Package, Loader2  } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  ArrowLeft,
  Share2,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Link as LinkIcon,
  Mail,
  BarChart3,
  Activity,
  Presentation,
  FileSignature,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit, 
  Shield,
  X,
  ChevronDown, ChevronUp,Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import PageInfoTooltip from "@/components/PageInfoTooltip";

type DocumentType = {
  _id: string;
  filename: string;
  size: number;
  numPages: number;
  createdAt: string;
  notes?: string;
  thumbnail?: string;
  isTemplate?: boolean;
  originalFilename?: string;
  originalFormat?: string;
  mimeType?: string;
};

type Recipient = {
  name: string;
  email: string;
  role?: string;
  color?: string;
};

type SignatureField = {
  id: string | number;
  type: 'signature' | 'date' | 'text';
  x: number;
  y: number;
  page: number;
  recipientIndex: number;
  width?: number;
  height?: number;
};

type SignatureRequestType = {
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  dueDate?: string;
  isTemplate: boolean;
  step?: number;
  recipients?: Recipient[];
  signatureFields?: SignatureField[];
};

type GeneratedLink = {
  recipient?: string;
  email?: string;
  link?: string;
  status?: string;
};

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentType | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'performance' | 'utilization'>('activity');
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notes, setNotes] = useState("");
const [isEditingNotes, setIsEditingNotes] = useState(false);
const [isSavingNotes, setIsSavingNotes] = useState(false);
const [presentMode, setPresentMode] = useState(false);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [showCreateLinkDialog, setShowCreateLinkDialog] = useState(false);
const [showSignatureDialog, setShowSignatureDialog] = useState(false);
const [generatedLink, setGeneratedLink] = useState<string | null>(null);
const [isGeneratingLink, setIsGeneratingLink] = useState(false);
const [analytics, setAnalytics] = useState<any>(null);
const [analyticsLoading, setAnalyticsLoading] = useState(true);
const [showFixIssuesDialog, setShowFixIssuesDialog] = useState(false);
const [contentAnalytics, setContentAnalytics] = useState<any>(null);
const [editableContent, setEditableContent] = useState('');
const [isSavingFix, setIsSavingFix] = useState(false);
const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
const [showAnalyticsOverlay, setShowAnalyticsOverlay] = useState(false);
const [previewPage, setPreviewPage] = useState(1);
const [documentPages, setDocumentPages] = useState<string[]>([]);
const [currentEditPage, setCurrentEditPage] = useState(0);
const [paginatedContent, setPaginatedContent] = useState<string[]>([]);
const [isLoadingPage, setIsLoadingPage] = useState(false);
const [showPdfView, setShowPdfView] = useState(false);
const [showSuccessDialog, setShowSuccessDialog] = useState(false);
const [ndaTemplates, setNdaTemplates] = useState<any[]>([])
const [loadingTemplates, setLoadingTemplates] = useState(false)
const [isSending, setIsSending] = useState(false);
const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
const [basePdfUrl, setBasePdfUrl] = useState<string | null>(null); // new
const [recipientInput, setRecipientInput] = useState('');
const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(null);
const [recipientInputMethod, setRecipientInputMethod] = useState<'single' | 'bulk' | 'csv'>('single');
const [bulkRecipientInput, setBulkRecipientInput] = useState('');
const [csvPreview, setCsvPreview] = useState<Array<{email: string, name?: string, company?: string}>>([]);
const [showAllRecipients, setShowAllRecipients] = useState(false);
const [attachedFiles, setAttachedFiles] = useState<Array<{id: string, name: string, source: 'drive' | 'local'}>>([]);
const [showDriveFilesDialog, setShowDriveFilesDialog] = useState(false);
const [driveFiles, setDriveFiles] = useState<any[]>([]);
const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);
const [driveSearchQuery, setDriveSearchQuery] = useState('');
const [shareSettings, setShareSettings] = useState({
  requireEmail: true,
  allowDownload: false,
  expiresIn: 7,
  password: '',
  recipientEmails: [] as string[],
  sendEmailNotification: true,
  customMessage: '',
  requireNDA: false,
  allowedEmails: [] as string[],
  enableWatermark: false,
  watermarkText: '',
  watermarkPosition: 'bottom' as 'top' | 'bottom' | 'center' | 'diagonal',
  ndaText: '',
  ndaTemplateId: '',
  customNdaText: '',
  useCustomNda: false,
});
const [linkSettings, setLinkSettings] = useState({
  requireEmail: true,
  allowDownload: true,
  expiresIn: '30', // days
  password: '',
  notifyOnView: true,
});
const [signatureRequest, setSignatureRequest] = useState<SignatureRequestType>({
  recipientEmail: '',
  recipientName: '',
  message: '',
  dueDate: '',
  isTemplate: false,
  step: 1,
  recipients: [],
  signatureFields: [],
});
const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
const [isSendingSignature, setIsSendingSignature] = useState(false);
const [isFullscreenEditMode, setIsFullscreenEditMode] = useState(false);

useEffect(() => {
  fetchDocument();
  fetchAnalytics();
}, [params.id]);

const fetchDocument = async () => {
  try {
    const res = await fetch(`/api/documents/${params.id}`, {
      credentials: 'include', // ✅ Send HTTP-only cookies automatically
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        console.log('📄 Document loaded:', data.document); // ⭐ Check this log
        console.log('🏷️ Is template?', data.document.isTemplate); 
        console.log("Full API response:", data);
        setDoc(data.document);
        console.log("Document data:", data.document); // <-- Add this line
      }
    } else if (res.status === 401) {
      router.push('/login'); // Redirect if unauthorized
    }
  } catch (error) {
    console.error("Failed to fetch document:", error);
  } finally {
    setLoading(false);
  }
};


// Handle single email add
const handleAddRecipient = () => {
  const email = recipientInput.trim().toLowerCase();
  
  if (!email) return;
  
  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    toast.error('Invalid email address');
    return;
  }
  
  // Check duplicate
  if (shareSettings.recipientEmails.includes(email)) {
    toast.error('Email already added');
    return;
  }
  
  // Add email
  setShareSettings({
    ...shareSettings,
    recipientEmails: [...shareSettings.recipientEmails, email]
  });
  
  setRecipientInput('');
  toast.success(`Added ${email}`);
};

// Handle bulk paste
const handleBulkAddRecipients = () => {
  const text = bulkRecipientInput.trim();
  if (!text) return;
  
  // Split by newlines OR commas
  const emails = text
    .split(/[\n,]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  
  if (emails.length === 0) {
    toast.error('No valid emails found');
    return;
  }
  
  // Remove duplicates from input
  const uniqueEmails = [...new Set(emails)];
  
  // Remove already added emails
  const newEmails = uniqueEmails.filter(
    e => !shareSettings.recipientEmails.includes(e)
  );
  
  if (newEmails.length === 0) {
    toast.error('All emails already added');
    return;
  }
  
  // Add all
  setShareSettings({
    ...shareSettings,
    recipientEmails: [...shareSettings.recipientEmails, ...newEmails]
  });
  
  setBulkRecipientInput('');
  toast.success(`Added ${newEmails.length} recipient${newEmails.length !== 1 ? 's' : ''}`);
  
  // Show list
  setShowAllRecipients(true);
};

// Handle CSV upload
const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (!file.name.endsWith('.csv')) {
    toast.error('Please upload a CSV file');
    return;
  }
  
  // Read file
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    toast.error('CSV must have header row and at least 1 data row');
    return;
  }
  
  // Parse CSV (simple parser - use PapaParse for production)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const emailIndex = headers.findIndex(h => h.includes('email'));
  
  if (emailIndex === -1) {
    toast.error('CSV must have an "email" column');
    return;
  }
  
  const nameIndex = headers.findIndex(h => h.includes('name'));
  const companyIndex = headers.findIndex(h => h.includes('company'));
  
  // Parse rows
  const contacts = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim());
    return {
      email: cols[emailIndex]?.toLowerCase() || '',
      name: nameIndex >= 0 ? cols[nameIndex] : undefined,
      company: companyIndex >= 0 ? cols[companyIndex] : undefined,
    };
  }).filter(c => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
  
  if (contacts.length === 0) {
    toast.error('No valid emails found in CSV');
    return;
  }
  
  setCsvPreview(contacts);
  toast.success(`Found ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`);
};

// Confirm CSV import
const handleConfirmCSV = () => {
  const newEmails = csvPreview
    .map(c => c.email)
    .filter(e => !shareSettings.recipientEmails.includes(e));
  
  if (newEmails.length === 0) {
    toast.error('All emails already added');
    return;
  }
  
  setShareSettings({
    ...shareSettings,
    recipientEmails: [...shareSettings.recipientEmails, ...newEmails]
  });
  
  setCsvPreview([]);
  toast.success(`Imported ${newEmails.length} recipient${newEmails.length !== 1 ? 's' : ''}`);
  setShowAllRecipients(true);
  setRecipientInputMethod('single');
};

//  Handle Google Drive attachment
const handleAttachFromDrive = async () => {
  setLoadingDriveFiles(true);
  setShowDriveFilesDialog(true);
  
  try {
    const res = await fetch('/api/integrations/google-drive/files', {
      credentials: 'include'
    });
    
    const data = await res.json();
    
    if (res.ok) {
      setDriveFiles(data.files || []);
    } else if (res.status === 401) {
      toast.error('Session expired', {
        description: 'Please reconnect Google Drive',
      });
    } else {
      toast.error('Failed to load files', {
        description: data.error || 'Try reconnecting Google Drive'
      });
    }
  } catch (error) {
    console.error('Browse files error:', error);
    toast.error('Network error');
  } finally {
    setLoadingDriveFiles(false);
  }
};

//  Handle local file attachment
const handleAttachLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type (PDF only for now)
  if (file.type !== 'application/pdf') {
    toast.error('Only PDF files are supported');
    return;
  }
  
  // Add to attached files
  const newFile = {
    id: Date.now().toString(),
    name: file.name,
    source: 'local' as const,
    file: file // Store the actual file object
  };
  
  setAttachedFiles([...attachedFiles, newFile]);
  toast.success(`Attached ${file.name}`);
};

//  Remove attachment
const removeAttachment = (fileId: string) => {
  setAttachedFiles(attachedFiles.filter(f => f.id !== fileId));
  toast.success('File removed');
};

// Fetch NDA templates when share drawer opens
const fetchNdaTemplates = async () => {
  try {
    setLoadingTemplates(true);
    const res = await fetch('/api/nda-templates', {
      credentials: 'include',
    });
    
    if (res.ok) {
      const data = await res.json();
      setNdaTemplates(data.templates);
      
      // Auto-select default template
      const defaultTemplate = data.templates.find((t: any) => t.isDefault);
      if (defaultTemplate) {
        setShareSettings(prev => ({
          ...prev,
          ndaTemplateId: defaultTemplate.id,
        }));
      }
    }
  } catch (error) {
    console.error('Failed to fetch NDA templates:', error);
  } finally {
    setLoadingTemplates(false);
  }
};

// Call when share drawer opens
useEffect(() => {
  if (showCreateLinkDialog) {
    fetchNdaTemplates();
  }
}, [showCreateLinkDialog]);

const fetchAnalytics = async () => {
  try {
    const res = await fetch(`/api/documents/${params.id}/analytics`, {
      credentials: 'include', // ✅ Send HTTP-only cookies automatically
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } else if (res.status === 401) {
      router.push('/login');
    }
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
  } finally {
    setAnalyticsLoading(false);
  }
};


 







useEffect(() => {
  if (showSignatureDialog && signatureRequest.step === 2 && !pdfUrl) {
    fetchPdfForPreview(1);
  }
}, [showSignatureDialog, signatureRequest.step]);

// Add this useEffect near your other useEffects
useEffect(() => {
  if (showSignatureDialog && signatureRequest.step === 2 && previewPage) {
    fetchPdfForPreview(previewPage);
  }
}, [previewPage, showSignatureDialog, signatureRequest.step]);

// Add this useEffect after your other useEffects
useEffect(() => {
  // Sync PDF page when switching views or changing edit page
  if (showPdfView && pdfUrl) {
    // The embed src will update automatically due to currentEditPage in the template
  }
}, [showPdfView, currentEditPage, pdfUrl]);



// Save fixed content



// Fetch analytics when document loads
useEffect(() => {
  if (doc) {
    fetchAnalytics();
  }
}, [doc]);

  // Save notes
const handleSaveNotes = async () => {
  setIsSavingNotes(true);
  

  try {
   const res = await fetch(`/api/documents/${params.id}/notes`, {
  method: 'PATCH',
  credentials: 'include', // Send HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ notes }),
});


    if (res.ok) {
      setIsEditingNotes(false);
      const data = await res.json();
      if (data.success && doc) {
        setDoc({ ...doc, notes });
      }
    } else {
      alert('Failed to save notes');
    }
  } catch (error) {
    console.error('Failed to save notes:', error);
    alert('Failed to save notes');
  } finally {
    setIsSavingNotes(false);
  }
};

// Load notes when document loads
useEffect(() => {
  if (doc?.notes) {
    setNotes(doc.notes);
  }
}, [doc]);

// Handle present mode
const handlePresent = () => {
  setPresentMode(true);
  setPreviewPage(1);
  if (!pdfUrl) {
    fetchPdfForPreview(1);
  }
};

// Handle export visits (CSV format)
const handleExportVisits = async () => {
  if (!doc) {
    alert('Document not loaded');
    return;
  }

  try {
    // Fetch real analytics data
    const res = await fetch(`/api/documents/${params.id}/analytics`, {
      credentials: 'include',
    });
    
    if (!res.ok) {
      alert('Failed to fetch analytics data');
      return;
    }
    
    const data = await res.json();
    const analytics = data.analytics;
    
    // Create CSV header
    const csvRows = [
      ['Date', 'Visitor', 'Time Spent', 'Pages Viewed', 'Device', 'Completion']
    ];
    
    // Add data rows from topViewers
    if (analytics.topViewers && analytics.topViewers.length > 0) {
      analytics.topViewers.forEach((viewer: any) => {
        csvRows.push([
          viewer.lastViewed,
          viewer.email,
          viewer.time,
          '-', // Pages viewed not in this dataset
          '-', // Device not in this dataset
          '-'  // Completion not in this dataset
        ]);
      });
    } else {
      // No data yet
      csvRows.push(['No visits yet', '-', '-', '-', '-', '-']);
    }
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.filename}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Analytics exported successfully');
    
  } catch (error) {
    console.error('Export error:', error);
    alert('Failed to export analytics');
  }
};

// Handle delete
const handleDelete = async () => {
  setIsDeleting(true);
 

  try {
    const res = await fetch(`/api/documents/${params.id}`, {
  method: 'DELETE',
  credentials: 'include', // Send HTTP-only cookies
});


    if (res.ok) {
      router.push('/dashboard');
    } else {
      alert('Failed to delete document');
    }
  } catch (error) {
    console.error('Failed to delete:', error);
    alert('Failed to delete document');
  } finally {
    setIsDeleting(false);
    setShowDeleteDialog(false);
  }
};

// Handle convert to signable
const handleConvertToSignable = () => {
  // Initialize signature dialog in template mode
  setSignatureRequest({
    recipientEmail: '',
    recipientName: '',
    message: '',
    dueDate: '',
    step: 1, // Start at recipient setup
    isTemplate: true, // Mark as template creation mode
    recipients: [
      { 
        name: 'Recipient', 
        email: '', 
        role: 'Needs to sign', 
        color: '#9333ea' 
      }
    ],
    signatureFields: [],
  });
  setShowSignatureDialog(true);
  
  // Fetch PDF for preview if not already loaded
  if (!pdfUrl) {
    fetchPdfForPreview(1);
  }
};



const handleUpdateThumbnail = () => {
  setShowThumbnailDialog(true);
};

const handleThumbnailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }
    
    setThumbnailFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};

const handleUploadThumbnail = async () => {
  if (!thumbnailFile) {
    alert('Please select an image');
    return;
  }
  if (!doc) {
    alert('Document not loaded');
    return;
  }
  
  setIsUploadingThumbnail(true);
  
  try {
    const formData = new FormData();
    formData.append('thumbnail', thumbnailFile);
    
    const res = await fetch(`/api/documents/${doc._id}/thumbnail`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (res.ok) {
      const data = await res.json();
      alert('✅ Thumbnail updated successfully!');
      setShowThumbnailDialog(false);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      await fetchDocument(); // Refresh document data
    } else {
      const error = await res.json();
      alert(error.message || 'Failed to update thumbnail');
    }
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    alert('Failed to update thumbnail');
  } finally {
    setIsUploadingThumbnail(false);
  }
};

// Fetch PDF for preview
const fetchPdfForPreview = async (page: number = 1) => {
  setIsLoadingPage(true);
  console.log('🔍 Fetching PDF for page:', page);
  
  try {
    // Fetch with serve=blob parameter
    const res = await fetch(`/api/documents/${params.id}/file?page=${page}&serve=blob`, {
      credentials: 'include',
    });
    
    console.log('📡 Response status:', res.status);
    console.log('📄 Content-Type:', res.headers.get('content-type'));
    
    if (res.ok) {
      const blob = await res.blob();
      console.log('💾 Blob size:', blob.size, 'Type:', blob.type);
      
      // Revoke old URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      console.log('🔗 Blob URL created:', url);
      
      setPdfUrl(url);
      setTotalPages(doc?.numPages || 1);
      setPreviewPage(page);
      console.log('✅ PDF loaded');
    } else {
      console.error('❌ Failed:', res.status);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    setIsLoadingPage(false);
  }
};
// Handle preview
const handlePreview = () => {
  setPreviewOpen(true);
  setPreviewPage(1);
  if (!pdfUrl) {
    fetchPdfForPreview(1);
  }
  // Fetch content analytics for overlay
  if (!contentAnalytics) {
    
  }
};

const handleNextPage = () => {
  if (previewPage < totalPages) {
    fetchPdfForPreview(previewPage + 1);
  }
};

const handlePrevPage = () => {
  if (previewPage > 1) {
    fetchPdfForPreview(previewPage - 1);
  }
};

const handleGoToPage = (page: number) => {
  if (page >= 1 && page <= totalPages) {
    fetchPdfForPreview(page);
  }
};

// Handle download
const handleDownload = async () => {
  if (!doc) return;
  setIsDownloading(true);
  try {
    const res = await fetch(`/api/documents/${params.id}/file`, {
      credentials: 'include', // Use HTTP-only cookies
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Download failed:", error);
    alert("Failed to download document. Please try again.");
  } finally {
    setIsDownloading(false);
  }
};

// Handle create shareable link
const handleCreateLink = () => {
  // Just open the drawer - don't create link yet
  setShowCreateLinkDialog(true);
  setGeneratedLink(null); // Reset any previous link
};

// Handle signature request
const handleSendSignatureRequest = async () => {
  if (!signatureRequest.recipientEmail || !signatureRequest.recipientName) {
    alert('Please fill in recipient email and name');
    return;
  }
  setIsSendingSignature(true);
  try {
    const res = await fetch(`/api/documents/${params.id}/signature`, {
      method: 'POST',
      credentials: 'include', // Use HTTP-only cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signatureRequest),
    });
    if (res.ok) {
      const data = await res.json();
      alert('Signature request sent successfully!');
      setShowSignatureDialog(false);
      setSignatureRequest({
        recipientEmail: '',
        recipientName: '',
        message: '',
        dueDate: '',
        isTemplate: false,
        step: 1,
        recipients: [],
        signatureFields: [],
      });
    } else {
      alert('Failed to send signature request');
    }
  } catch (error) {
    console.error('Failed to send signature request:', error);
    alert('Failed to send signature request');
  } finally {
    setIsSendingSignature(false);
  }
};



  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
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
          <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

       {/* ✅ DIFFERENT MESSAGE FOR DOCUMENTS PAGE */}
            <PageInfoTooltip 
              pageId="documents"
              message="View and manage your uploaded PDF documents. Preview, download, and share documents with others."
              position="top"
            />
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
             <div className="flex items-center gap-3">
  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
    <FileText className="h-5 w-5 text-red-600" />
  </div>
  <div>
    <div className="flex items-center gap-2">
      <h1 className="font-semibold text-slate-900">{doc.filename}</h1>
      {doc.isTemplate && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <FileSignature className="h-3 w-3 mr-1" />
          Signable Template
        </span>
      )}
    </div>
    {!isEditingNotes ? (
      <button
        onClick={() => setIsEditingNotes(true)}
        className="text-xs text-slate-500 hover:text-purple-600 transition-colors text-left"
      >
        {doc.notes ? `📝 ${doc.notes}` : ''}
      </button>
    ) : (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add a note..."
        className="text-xs border rounded px-2 py-1 w-64"
        autoFocus
      />
      <button
        onClick={handleSaveNotes}
        disabled={isSavingNotes}
        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {isSavingNotes ? 'Saving...' : 'Save'}
      </button>
      <button
        onClick={() => {
          setIsEditingNotes(false);
          setNotes(doc.notes || '');
        }}
        className="text-xs text-slate-500 hover:text-slate-700"
      >
        Cancel
      </button>
    </div>
  )}
</div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handlePreview}>
                      <Eye className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Preview</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                      ) : (
                        <Download className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white">
  <DropdownMenuItem onClick={handlePresent}>
    <Presentation className="mr-2 h-4 w-4" />
    <span>Present</span>
  </DropdownMenuItem>
 <DropdownMenuItem 
  onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)}
>
  <FileSignature className="mr-2 h-4 w-4" />
  <span>{doc?.isTemplate ? 'Edit Template' : 'Convert to signable'}</span>
</DropdownMenuItem>

<DropdownMenuItem 
    onClick={() => router.push(`/documents/${doc._id}/versions`)}
  >
    <Clock className="mr-2 h-4 w-4" />
    <span>Version History</span>
  </DropdownMenuItem>


<DropdownMenuItem 
    onClick={() => router.push(`/compliance`)}
  >
    <Shield className="mr-2 h-4 w-4" />
    <span>Compliance Report</span>
  </DropdownMenuItem>

  <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
    {isDownloading ? (
      <div className="mr-2 h-4 w-4 animate-spin border-2 border-purple-600 border-t-transparent rounded-full" />
    ) : (
      <Download className="mr-2 h-4 w-4" />
    )}
    <span>Download</span>
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem onClick={handleExportVisits}>
    <Eye className="mr-2 h-4 w-4" />
    <span>Export visits</span>
  </DropdownMenuItem>
  <DropdownMenuItem onClick={handleUpdateThumbnail}>
    <ImageIcon className="mr-2 h-4 w-4" />
    <span>Update thumbnail</span>
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  {doc?.isTemplate && (
  <DropdownMenuItem 
    onClick={() => router.push(`/documents/${doc._id}/bulk-send`)}
  >
    <Users className="mr-2 h-4 w-4" />
    <span>Bulk Send</span>
  </DropdownMenuItem>
)}
  <DropdownMenuItem 
    onClick={() => setShowDeleteDialog(true)}
    className="text-red-600 focus:text-red-600"
  >
    <Trash2 className="mr-2 h-4 w-4" />
    <span>Delete</span>
  </DropdownMenuItem>
</DropdownMenuContent>
              </DropdownMenu>
              <Button 
  onClick={handleCreateLink}
  className="bg-gradient-to-r from-purple-600 to-blue-600"
>
  Create link
</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Last updated info */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>Last updated {formatTimeAgo(doc.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
  <DialogContent className="max-w-md bg-white">
    <DialogHeader>
      <DialogTitle>Delete Document</DialogTitle>
    </DialogHeader>
    <div className="py-4">
      <p className="text-slate-600 mb-4">
        Are you sure you want to delete <span className="font-semibold">{doc.filename}</span>? 
        This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>




{/* Present Mode Drawer */}
<Drawer open={presentMode} onOpenChange={setPresentMode}>
  <motion.div className="h-[100vh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    {/* Header */}
    <div className="sticky top-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-6 py-4 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg"
          >
            <Presentation className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Presentation Mode
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {doc.filename} • Page {previewPage} of {totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20"
          >
            <p className="text-white text-sm font-medium">
              <span className="opacity-60">Press</span> ← → <span className="opacity-60">to navigate</span>
            </p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPresentMode(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>

    {/* PDF Viewer - FULL SIZE */}
    <div className="flex-1 overflow-hidden p-8 flex items-center justify-center bg-slate-900">
      <AnimatePresence mode="wait">
        {isLoadingPage ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-slate-300 font-medium">Loading slide {previewPage}...</p>
          </motion.div>
        ) : pdfUrl ? (
          <motion.div
            key={`page-${previewPage}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full max-w-7xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <iframe
              src={`${pdfUrl}#page=${previewPage}&toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
              className="w-full h-full"
              style={{ border: 'none' }}
              title="PDF Presentation"
            />
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Failed to load presentation</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Page Navigation with Progress Bar */}
    {pdfUrl && !isLoadingPage && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        {/* Progress Bar Above Controls */}
        <div className="mb-4 px-8">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden w-80">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(previewPage / totalPages) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl border border-slate-700/50">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPage}
              disabled={previewPage <= 1}
              className="text-white hover:bg-slate-700/50 disabled:opacity-30 rounded-xl h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>

          <div className="flex items-center gap-3 px-4">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={previewPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page) handleGoToPage(page);
              }}
              className="w-16 bg-slate-800 text-white text-center rounded-xl px-3 py-2 text-sm font-medium border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
            />
            <span className="text-white font-medium">/ {totalPages}</span>
          </div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPage}
              disabled={previewPage >= totalPages}
              className="text-white hover:bg-slate-700/50 disabled:opacity-30 rounded-xl h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )}
  </motion.div>
</Drawer>


      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'activity'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'performance'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('utilization')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'utilization'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Utilization
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'activity' && (
  <div className="space-y-6">
    {/* NEW: Template Section - Show if document is a template */}
    {doc.isTemplate && (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <FileSignature className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Signable Template Ready
          </h2>
          <p className="text-slate-600 mb-6">
            This document has pre-placed signature fields. Send it to recipients to collect signatures.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
  onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
>
  <Mail className="h-4 w-4" />
  Send to Recipients
</Button>
<Button
          onClick={() => router.push(`/documents/${doc._id}/template-preview`)}
          variant="outline"
          className="gap-2"
        >
          <FileSignature className="h-4 w-4" />
          View Template
        </Button>
<Button
  onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)}
  variant="outline"
  className="gap-2"
>
  <Edit className="h-4 w-4" />
  Edit Template
</Button>
            <Button
              onClick={async () => {
                if (confirm('Remove template configuration? This will not delete the document.')) {
                  const res = await fetch(`/api/documents/${doc._id}/template`, {
                    method: 'DELETE',
                    credentials: 'include',
                  });
                  if (res.ok) {
                    alert('✅ Template configuration removed');
                    fetchDocument(); // Refresh document data
                  }
                }
              }}
              variant="outline"
              className="gap-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Remove Template
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* EXISTING: Your original "Put document to work" section */}
    <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <img
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect x='50' y='50' width='300' height='200' rx='10' fill='%233b82f6'/%3E%3Cpath d='M 100 180 Q 150 150 200 180 T 300 180' stroke='%23000' stroke-width='3' fill='none'/%3E%3Cpath d='M 80 120 L 100 100 L 120 110' fill='%23000'/%3E%3C/svg%3E"
            alt="Put document to work"
            className="w-64 h-48 mx-auto mb-6"
          />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Put your document to work
        </h2>
        <p className="text-slate-600 mb-6">
          Create a link to share this document, or customize the document to collect eSignatures
        </p>
        <div className="flex gap-3 justify-center">
          <Button
  onClick={handleCreateLink}
  className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600"
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




        </div>
      </div>
    </div>
  </div>
)}

        {activeTab === 'performance' && (
  <div className="space-y-6">
    {analyticsLoading ? (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    ) : !analytics || analytics.totalViews === 0 ? (
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No views yet</h3>
        <p className="text-slate-600 mb-6">Share your document to start tracking performance</p>
        <Button 
          onClick={handleCreateLink}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Create Share Link
        </Button>
      </div>
    ) : (
      <>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Total Views</h3>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.totalViews}</p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Unique Viewers</h3>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.uniqueViewers}</p>
            <p className="text-xs text-slate-500 mt-1">Different people</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Avg. Time</h3>
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.averageTime}</p>
            <p className="text-xs text-slate-500 mt-1">Per view</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Completion</h3>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.completionRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Viewed all pages</p>
          </div>
        </div>

        {/* Views Chart */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Views Over Time (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.viewsByDate.map((day: any, index: number) => {
              const maxViews = Math.max(...analytics.viewsByDate.map((d: any) => d.views));
              const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-purple-600 to-blue-500 rounded-t-lg relative group cursor-pointer hover:from-purple-700 hover:to-blue-600 transition-all"
                    style={{ height: `${height}%`, minHeight: day.views > 0 ? '8px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.views} views
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 mt-2">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Page-by-Page Analytics - NEW */}
<div className="bg-white rounded-xl border shadow-sm p-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Page-by-Page Analytics</h3>
  <div className="space-y-4">
    {analytics.pageEngagement.map((page: any) => {
      const maxViews = Math.max(...analytics.pageEngagement.map((p: any) => p.totalViews));
      const barWidth = maxViews > 0 ? (page.totalViews / maxViews) * 100 : 0;
      
      return (
        <div key={page.page} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Page {page.page}</span>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>{page.totalViews} views</span>
              <span>•</span>
              <span>Avg {page.avgTime}s</span>
            </div>
          </div>
          <div className="relative">
            <div className="h-8 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all flex items-center px-3"
                style={{ width: `${barWidth}%` }}
              >
                {barWidth > 20 && (
                  <span className="text-xs font-medium text-white">
                    {page.views}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>

{/* Download Analytics - NEW */}
<div className="bg-white rounded-xl border shadow-sm p-6">
  <h3 className="text-lg font-semibold text-slate-900 mb-4">Download Analytics</h3>
  <div className="grid grid-cols-3 gap-4">
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <Download className="h-8 w-8 text-green-600 mb-2" />
      <div className="text-2xl font-bold text-green-900">{analytics.downloads}</div>
      <p className="text-xs text-green-700 mt-1">Total Downloads</p>
    </div>
    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
      <Users className="h-8 w-8 text-blue-600 mb-2" />
      <div className="text-2xl font-bold text-blue-900">
        {analytics.totalViews > 0 ? Math.round((analytics.downloads / analytics.totalViews) * 100) : 0}%
      </div>
      <p className="text-xs text-blue-700 mt-1">Download Rate</p>
    </div>
    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
      <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
      <div className="text-2xl font-bold text-purple-900">
        {analytics.downloads > 0 ? Math.round(analytics.totalViews / analytics.downloads) : 0}
      </div>
      <p className="text-xs text-purple-700 mt-1">Views per Download</p>
    </div>
  </div>
</div>

        {/* Page Engagement */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Page-by-Page Engagement</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.pageEngagement.map((page: any) => (
              <div key={page.page} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-slate-600">
                  Page {page.page}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${page.views}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-12">{page.views}%</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Avg time: {page.avgTime}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        

        {/* Top Viewers */}
        {/* Top Viewers - Should show emails now */}
{analytics.topViewers.length > 0 && (
  <div className="bg-white rounded-xl border shadow-sm p-6">
    <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Viewers</h3>
    <div className="space-y-3">
      {analytics.topViewers.map((viewer: any, index: number) => (
        <div key={index} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
            {viewer.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{viewer.email}</p>
            <p className="text-sm text-slate-500">
              {viewer.views} views • {viewer.time} total time
            </p>
          </div>
          <div className="text-xs text-slate-500">
            {viewer.lastViewed}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </>
    )}
    {/* NDA Acceptances Section - NEW */}
    {analytics?.ndaAcceptances && analytics.ndaAcceptances.length > 0 && (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            NDA Acceptances ({analytics.ndaAcceptances.length})
          </h3>
          <Link href="/nda-records">
            <Button variant="outline" size="sm" className="gap-2">
              View All Records
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {analytics.ndaAcceptances.map((acceptance: any, index: number) => (
            <div 
              key={index} 
              className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              {/* Checkmark Icon */}
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-green-600" />
              </div>

              {/* Viewer Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900">{acceptance.viewerName}</p>
                <p className="text-sm text-slate-600">{acceptance.viewerEmail}</p>
                {acceptance.viewerCompany && (
                  <p className="text-xs text-slate-500">{acceptance.viewerCompany}</p>
                )}
              </div>

              {/* Acceptance Details */}
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {new Date(acceptance.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(acceptance.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {/* Download Certificate Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/nda-certificates/${acceptance.certificateId}`);
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `NDA-Certificate-${acceptance.certificateId}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }
                  } catch (error) {
                    console.error('Download error:', error);
                  }
                }}
                className="gap-2 flex-shrink-0"
              >
                <Download className="h-4 w-4" />
                Certificate
              </Button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)}
   

        {activeTab === 'utilization' && (
  <div className="space-y-6">
    {analyticsLoading ? (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics...</p>
        </div>
      </div>
    ) : !analytics || analytics.totalViews === 0 ? (
      <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
        <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No utilization data yet</h3>
        <p className="text-slate-600 mb-6">Share your document to see how it's being used</p>
        <Button 
          onClick={handleCreateLink}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Create Share Link
        </Button>
      </div>
    ) : (
      <>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Downloads</h3>
              <Download className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.downloads}</p>
            <p className="text-xs text-slate-500 mt-1">
              {analytics.totalViews > 0 ? ((analytics.downloads / analytics.totalViews) * 100).toFixed(1) : 0}% of views
            </p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Shares</h3>
              <Share2 className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.shares}</p>
            <p className="text-xs text-slate-500 mt-1">Active share links</p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">Completion Rate</h3>
              <FileCheck className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{analytics.completionRate}%</p>
            <p className="text-xs text-slate-500 mt-1">Viewed all pages</p>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Desktop</span>
                <span className="text-sm text-slate-600">{analytics.devices.desktop}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all"
                  style={{ width: `${analytics.devices.desktop}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Mobile</span>
                <span className="text-sm text-slate-600">{analytics.devices.mobile}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${analytics.devices.mobile}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Tablet</span>
                <span className="text-sm text-slate-600">{analytics.devices.tablet}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all"
                  style={{ width: `${analytics.devices.tablet}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        {analytics.locations.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Geographic Distribution</h3>
            <div className="space-y-3">
              {analytics.locations.map((location: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-slate-700">
                    {location.country}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${location.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 w-12">{location.percentage}%</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 w-16 text-right">
                    {location.views}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Engagement Score</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(analytics.completionRate / 100) * 352} 352`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900">{analytics.completionRate}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-slate-600 mt-4">
              {analytics.completionRate >= 75 ? 'High' : analytics.completionRate >= 50 ? 'Medium' : 'Low'} engagement rate
            </p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Key Insights</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Eye className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">
                  {analytics.totalViews} total views from {analytics.uniqueViewers} unique viewers
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-3 w-3 text-green-600" />
                </div>
                <p className="text-sm text-slate-600">
                  Average viewing time: {analytics.averageTime}
                </p>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                </div>
                <p className="text-sm text-slate-600">
                  {analytics.completionRate}% of viewers read the entire document
                </p>
              </li>
              </ul>
          </div>
        </div>
      </>
    )}
  </div>
)}
      </div>

   {/* PDF Preview Drawer */}
<Drawer open={previewOpen} onOpenChange={setPreviewOpen}>
  <motion.div className="h-[100vh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    {/* Header */}
    <div className="sticky top-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-6 py-4 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg"
          >
            <FileText className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {doc.filename}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {doc.numPages} pages • {(doc.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
            >
              {isDownloading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewOpen(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>

    {/* PDF Viewer */}
    <div className="flex-1 overflow-hidden p-8 flex items-center justify-center bg-slate-900">
      <AnimatePresence mode="wait">
        {isLoadingPage ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-slate-300 font-medium">Loading page {previewPage}...</p>
          </motion.div>
        ) : pdfUrl ? (
          <motion.div
            key="pdf"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full h-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full"
              style={{ border: 'none' }}
              title="PDF Preview"
            />
          </motion.div>
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Failed to load preview</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Page Navigation */}
    {pdfUrl && !isLoadingPage && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl border border-slate-700/50">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPage}
              disabled={previewPage <= 1}
              className="text-white hover:bg-slate-700/50 disabled:opacity-30 rounded-xl h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </motion.div>

          <div className="flex items-center gap-3 px-4">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={previewPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page) handleGoToPage(page);
              }}
              className="w-16 bg-slate-800 text-white text-center rounded-xl px-3 py-2 text-sm font-medium border border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all"
            />
            <span className="text-white font-medium">/ {totalPages}</span>
          </div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPage}
              disabled={previewPage >= totalPages}
              className="text-white hover:bg-slate-700/50 disabled:opacity-30 rounded-xl h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    )}
  </motion.div>
</Drawer>
     {/* Create Share Link Dialog - DocSend Style */}
{/* Create Share Link Drawer */}
<Drawer open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}>
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="p-6 border-b">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Share Document</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreateLinkDialog(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-sm text-slate-600">
        {doc?.filename}
      </p>
    </div>

    {/* Content */}
    {/* Content */}
<div className="flex-1 overflow-y-auto p-6">
  <div className="max-w-2xl mx-auto space-y-6">
    
    {/* Recipients Section */}
<div className="bg-white rounded-xl border shadow-sm p-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="font-semibold text-slate-900">Recipients</h3>
      <p className="text-sm text-slate-600 mt-1">
        Who can access this document? Leave empty for "anyone with link"
      </p>
    </div>
    
    {/* Recipient Count Badge */}
    {shareSettings.recipientEmails.length > 0 && (
      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
        {shareSettings.recipientEmails.length} recipient{shareSettings.recipientEmails.length !== 1 ? 's' : ''}
      </span>
    )}
  </div>

  {/* Tabs for Input Methods */}
  <div className="flex gap-2 mb-4 border-b">
    <button
      onClick={() => setRecipientInputMethod('single')}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        recipientInputMethod === 'single'
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      Add One
    </button>
    <button
      onClick={() => setRecipientInputMethod('bulk')}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        recipientInputMethod === 'bulk'
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      Paste List
    </button>
    <button
      onClick={() => setRecipientInputMethod('csv')}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        recipientInputMethod === 'csv'
          ? 'border-purple-600 text-purple-600'
          : 'border-transparent text-slate-600 hover:text-slate-900'
      }`}
    >
      Upload CSV
    </button>
  </div>

  {/* Single Email Input */}
  {recipientInputMethod === 'single' && (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="email"
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          placeholder="investor@vc.com"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddRecipient();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddRecipient}
          variant="outline"
        >
          Add
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        💡 Press Enter or click Add to add each email
      </p>
    </div>
  )}

  {/* Bulk Paste Input */}
  {recipientInputMethod === 'bulk' && (
    <div className="space-y-3">
      <Textarea
        value={bulkRecipientInput}
        onChange={(e) => setBulkRecipientInput(e.target.value)}
        placeholder="Paste emails here (one per line or comma-separated):
john@sequoia.com
sarah@a16z.com
mike@kleiner.com

Or comma-separated:
john@sequoia.com, sarah@a16z.com, mike@kleiner.com"
        rows={8}
        className="font-mono text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {bulkRecipientInput ? `${bulkRecipientInput.split(/[\n,]+/).filter(e => e.trim()).length} emails detected` : 'Paste your email list above'}
        </p>
        <Button
          onClick={handleBulkAddRecipients}
          disabled={!bulkRecipientInput.trim()}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Add All
        </Button>
      </div>
    </div>
  )}

   
  {/* CSV Upload with DUAL OPTIONS */}
{recipientInputMethod === 'csv' && (
  <div className="space-y-4">
    {/* 🆕 TWO UPLOAD OPTIONS */}
    <div className="grid grid-cols-2 gap-3">
      {/* Option 1: Cloud Storage */}
      <Button
        variant="outline"
        onClick={handleAttachFromDrive}
        className="h-24 flex-col gap-2 border-2 border-dashed hover:border-purple-400 hover:bg-purple-50"
      >
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z"/>
          </svg>
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">Google Drive</p>
          <p className="text-xs text-slate-500">Import from cloud</p>
        </div>
      </Button>

      {/* Option 2: Local Machine */}
      <Button
        variant="outline"
        onClick={() => document.getElementById('csv-local-upload')?.click()}
        className="h-24 flex-col gap-2 border-2 border-dashed hover:border-blue-400 hover:bg-blue-50"
      >
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Upload className="h-5 w-5 text-blue-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-sm">Local File</p>
          <p className="text-xs text-slate-500">Upload from computer</p>
        </div>
      </Button>
      
      {/* Hidden file input for local upload */}
      <input
        type="file"
        accept=".csv"
        onChange={handleCSVUpload}
        className="hidden"
        id="csv-local-upload"
      />
    </div>

    {/* CSV Preview (existing code - keep as is) */}
    {csvPreview.length > 0 && (
      <div className="border rounded-lg p-4 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-slate-900">
            Preview ({csvPreview.length} contacts)
          </h4>
          <Button
            size="sm"
            onClick={handleConfirmCSV}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Confirm Import
          </Button>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {csvPreview.slice(0, 10).map((contact, idx) => (
            <div key={idx} className="text-xs bg-white rounded p-2 border">
              <span className="font-medium text-slate-900">{contact.email}</span>
              {contact.name && (
                <span className="text-slate-600 ml-2">• {contact.name}</span>
              )}
              {contact.company && (
                <span className="text-slate-500 ml-2">@ {contact.company}</span>
              )}
            </div>
          ))}
          {csvPreview.length > 10 && (
            <p className="text-xs text-slate-500 text-center py-2">
              + {csvPreview.length - 10} more contacts
            </p>
          )}
        </div>
      </div>
    )}
  </div>
)}
  {/* Email List Display */}
  {shareSettings.recipientEmails.length > 0 && (
    <div className="mt-4 space-y-3">
      {/* Summary Bar */}
      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <span className="font-semibold text-purple-900">
            {shareSettings.recipientEmails.length} Recipients
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllRecipients(!showAllRecipients)}
            className="text-purple-700 hover:text-purple-800 hover:bg-purple-100"
          >
            {showAllRecipients ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Remove all ${shareSettings.recipientEmails.length} recipients?`)) {
                setShareSettings({ ...shareSettings, recipientEmails: [] });
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Email List (Collapsible) */}
      {showAllRecipients && (
        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3 bg-slate-50">
          {shareSettings.recipientEmails.map((email, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white rounded border hover:border-purple-300 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-slate-900 truncate">{email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShareSettings({
                    ...shareSettings,
                    recipientEmails: shareSettings.recipientEmails.filter((_, i) => i !== idx)
                  });
                }}
                className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {!showAllRecipients && shareSettings.recipientEmails.length > 3 && (
        <div className="flex gap-2 flex-wrap">
          {shareSettings.recipientEmails.slice(0, 3).map((email, idx) => (
            <span key={idx} className="px-2 py-1 bg-white border rounded-full text-xs text-slate-600">
              {email}
            </span>
          ))}
          <span className="px-2 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
            +{shareSettings.recipientEmails.length - 3} more
          </span>
        </div>
      )}
    </div>
  )}

  {/* Send Email Toggle */}
  {shareSettings.recipientEmails.length > 0 && (
    <div className="mt-4 pt-4 border-t">
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <div className="font-medium text-slate-900 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Send Email Notification
          </div>
          <div className="text-sm text-slate-600 mt-1">
            Email all {shareSettings.recipientEmails.length} recipient{shareSettings.recipientEmails.length !== 1 ? 's' : ''} with the link
          </div>
        </div>
        <Switch
          checked={shareSettings.sendEmailNotification}
          onCheckedChange={(checked) => setShareSettings({...shareSettings, sendEmailNotification: checked})}
        />
      </label>
    </div>
  )}

      {/* Send Email Toggle */}
      {shareSettings.recipientEmails.length > 0 && (
        <label className="flex items-center justify-between cursor-pointer mt-4 pt-4 border-t">
          <div>
            <div className="font-medium text-slate-900">Send Email Notification</div>
            <div className="text-sm text-slate-600">Email recipients with the link</div>
          </div>
          <Switch
            checked={shareSettings.sendEmailNotification}
            onCheckedChange={(checked) => setShareSettings({...shareSettings, sendEmailNotification: checked})}
          />
        </label>
      )}
    </div>

    {/* Custom Message */}
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="font-semibold text-slate-900 mb-4">Message to Recipients (Optional)</h3>
      <Textarea
        value={shareSettings.customMessage}
        onChange={(e) => setShareSettings({...shareSettings, customMessage: e.target.value})}
        placeholder="Add a personal note that recipients will see when they open the document..."
        rows={4}
        className="w-full border rounded-lg px-3 py-2 text-sm"
        maxLength={500}
      />
      <p className="text-xs text-slate-500 mt-1">
        {shareSettings.customMessage.length}/500 characters
      </p>
    </div>

    {/* Security Settings */}
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
      <h3 className="font-semibold text-slate-900 mb-4">Security Settings</h3>
      
      {/* Require Email */}
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <div className="font-medium text-slate-900">Require Email Verification</div>
          <div className="text-sm text-slate-600">Viewers must enter email to access</div>
        </div>
        <Switch
          checked={shareSettings.requireEmail}
          onCheckedChange={(checked) => setShareSettings({...shareSettings, requireEmail: checked})}
        />
      </label>

      {/* Allow Download */}
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <div className="font-medium text-slate-900">Allow Download</div>
          <div className="text-sm text-slate-600">Let viewers download the PDF</div>
        </div>
        <Switch
          checked={shareSettings.allowDownload}
          onCheckedChange={(checked) => setShareSettings({...shareSettings, allowDownload: checked})}
        />
      </label>

      {/* Expiration */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          Link Expires In
        </Label>
        <select
          value={shareSettings.expiresIn}
          onChange={(e) => setShareSettings({...shareSettings, expiresIn: parseInt(e.target.value)})}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value={1}>1 day</option>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={0}>Never</option>
        </select>
      </div>

      {/* Password */}
      <div>
        <Label className="text-sm font-medium text-slate-700 mb-2 block">
          Password (Optional)
        </Label>
        <Input
          type="password"
          value={shareSettings.password}
          onChange={(e) => setShareSettings({...shareSettings, password: e.target.value})}
          placeholder="Leave empty for no password"
        />
      </div>
    </div>

    {/* Watermark Settings */}
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">💧 Watermark (Premium)</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
          Premium
        </span>
      </div>
      
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <div className="font-medium text-slate-900">Enable Watermark</div>
          <div className="text-sm text-slate-600">Add viewer's email to each page</div>
        </div>
        <Switch
          checked={shareSettings.enableWatermark}
          onCheckedChange={(checked) => setShareSettings({...shareSettings, enableWatermark: checked})}
        />
      </label>

      {shareSettings.enableWatermark && (
        <>
          <div>
            <Label>Watermark Text (Optional)</Label>
            <Input
              value={shareSettings.watermarkText}
              onChange={(e) => setShareSettings({...shareSettings, watermarkText: e.target.value})}
              placeholder="Leave empty to use viewer's email"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Position</Label>
            <select
              value={shareSettings.watermarkPosition}
              onChange={(e) => setShareSettings({...shareSettings, watermarkPosition: e.target.value as any})}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option value="bottom">Bottom</option>
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="diagonal">Diagonal</option>
            </select>
          </div>
        </>
      )}
    </div>

    {/* NDA Requirement */}
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">📜 NDA Requirement</h3>
        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
          Premium
        </span>
      </div>
      
      <label className="flex items-center justify-between cursor-pointer">
        <div>
          <div className="font-medium text-slate-900">Require NDA Acceptance</div>
          <div className="text-sm text-slate-600">Viewers must accept terms before viewing</div>
        </div>
        <Switch
          checked={shareSettings.requireNDA}
          onCheckedChange={(checked) => setShareSettings({...shareSettings, requireNDA: checked})}
        />
      </label>

      {shareSettings.requireNDA && (
        <>
          {/* Template Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-2 block">
              NDA Template
            </Label>
            
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setShareSettings({...shareSettings, useCustomNda: false})}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  !shareSettings.useCustomNda
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Use Template
              </button>
              <button
                onClick={() => setShareSettings({...shareSettings, useCustomNda: true})}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  shareSettings.useCustomNda
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Custom Text
              </button>
            </div>

            {!shareSettings.useCustomNda ? (
              <div>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <select
                    value={shareSettings.ndaTemplateId}
                    onChange={(e) => setShareSettings({...shareSettings, ndaTemplateId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select a template...</option>
                    {ndaTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault && ' (Default)'}
                      </option>
                    ))}
                  </select>
                )}
                
                {shareSettings.ndaTemplateId && (
                  <div className="mt-2 p-3 bg-slate-50 rounded border">
                    <p className="text-xs font-medium text-slate-700 mb-2">Preview:</p>
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans line-clamp-4">
                      {ndaTemplates.find(t => t.id === shareSettings.ndaTemplateId)?.template || ''}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Textarea
                  value={shareSettings.customNdaText}
                  onChange={(e) => setShareSettings({...shareSettings, customNdaText: e.target.value})}
                  placeholder="Enter custom NDA text here..."
                  rows={10}
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                  maxLength={2000}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {shareSettings.customNdaText.length}/2000 characters
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 You can use variables: {`{{viewer_name}}, {{viewer_email}}, {{document_title}}`}
                </p>
              </div>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-900">
              ✅ <strong>Legal Protection:</strong> NDA acceptance is logged with timestamp, 
              IP address, and email for legal evidence.
            </p>
          </div>
        </>
      )}
    </div>

    {/* Info */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-sm text-blue-800">
        📊 <strong>Track views:</strong> You'll see who viewed your document, 
        time spent, and location in the analytics page.
      </p>
    </div>

  </div>
</div>

    {/* Footer */}
    <div className="p-6 border-t">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCreateLinkDialog(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (!sharingDocumentId && !params.id) return;
              
              // Auto-add email if typed but not clicked "Add"
              if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
                if (!shareSettings.recipientEmails.includes(recipientInput)) {
                  shareSettings.recipientEmails.push(recipientInput);
                  setRecipientInput('');
                }
              }
              
              try {
                const res = await fetch(`/api/documents/${params.id}/share`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                 body: JSON.stringify({
  requireEmail: shareSettings.requireEmail,
  allowDownload: shareSettings.allowDownload,
  password: shareSettings.password || null,
  expiresIn: shareSettings.expiresIn === 0 ? 'never' : shareSettings.expiresIn.toString(),
  allowedEmails: shareSettings.recipientEmails,
  customMessage: shareSettings.customMessage || null,
  sendEmailNotification: shareSettings.sendEmailNotification,
  notifyOnView: true,
  allowPrint: true,
  trackDetailedAnalytics: true,
  enableWatermark: shareSettings.enableWatermark,
  watermarkText: shareSettings.watermarkText || null,
  watermarkPosition: shareSettings.watermarkPosition,
  requireNDA: shareSettings.requireNDA,
  ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId,
  customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null,
}),
                });
                
                if (res.ok) {
                  const data = await res.json();
                  if (data.success) {
                    const shareLink = data.shareLink;
                    
                    // Show success modal
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
                    modal.innerHTML = `
                      <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div class="flex items-center gap-3 mb-4">
                          <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 class="text-xl font-bold text-slate-900">Link Created!</h3>
                            <p class="text-sm text-slate-600">${shareSettings.recipientEmails.length > 0 ? `Sent to ${shareSettings.recipientEmails.length} recipient(s)` : 'Anyone with link can view'}</p>
                          </div>
                        </div>
                        
                        ${shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification ? `
                          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <p class="text-sm text-blue-900">
                              ✉️ <strong>Emails sent to:</strong><br/>
                              ${shareSettings.recipientEmails.map(e => `• ${e}`).join('<br/>')}
                            </p>
                          </div>
                        ` : ''}
                        
                        <div class="mb-4">
                          <label class="text-sm font-medium text-slate-700 block mb-2">Share Link:</label>
                          <div class="flex gap-2">
                            <input 
                              type="text" 
                              value="${shareLink}" 
                              readonly 
                              class="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50"
                              id="shareLinkInput"
                            />
                            <button 
                              onclick="
                                navigator.clipboard.writeText('${shareLink}');
                                this.innerHTML = '✓ Copied';
                                setTimeout(() => this.innerHTML = 'Copy', 2000);
                              "
                              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        
                        <div class="space-y-2 text-sm text-slate-600 mb-4">
                          <p>⏰ Expires: ${shareSettings.expiresIn === 0 ? 'Never' : `${shareSettings.expiresIn} days`}</p>
                          <p>📥 Download: ${shareSettings.allowDownload ? 'Allowed' : 'Disabled'}</p>
                          ${shareSettings.password ? '<p>🔒 Password protected</p>' : ''}
                          ${shareSettings.recipientEmails.length > 0 ? `<p>✉️ Email-gated (${shareSettings.recipientEmails.length} recipients)</p>` : '<p>🌐 Open to anyone with link</p>'}
                        </div>
                        
                        <div class="flex gap-3">
                          <button 
                            onclick="window.open('${shareLink}', '_blank'); this.parentElement.parentElement.parentElement.remove();"
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Test Link
                          </button>
                          <button 
                            onclick="this.parentElement.parentElement.parentElement.remove()"
                            class="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    `;
                    
                    document.body.appendChild(modal);
                    modal.onclick = (e) => {
                      if (e.target === modal) modal.remove();
                    };
                    
                    setShowCreateLinkDialog(false);
                    
                    // Reset settings
                    setShareSettings({
                      requireEmail: true,
                      allowDownload: false,
                      expiresIn: 7,
                      password: '',
                      recipientEmails: [],
                      sendEmailNotification: true,
                      customMessage: '',
                      requireNDA: false,
                      allowedEmails: [],
                      enableWatermark: false,
                      watermarkText: '',
                      watermarkPosition: 'bottom',
                      ndaText: '',
                      ndaTemplateId: '',
                      customNdaText: '',
                      useCustomNda: false,
                    });
                  }
                } else {
                  const data = await res.json();
                  alert(`❌ ${data.error || 'Failed to create share link'}`);
                }
              } catch (error) {
                console.error('Share error:', error);
                alert('❌ Failed to create share link. Please try again.');
              }
            }}
            className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Share2 className="h-4 w-4" />
            {shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification ? 
              `Send to ${shareSettings.recipientEmails.length} Recipient${shareSettings.recipientEmails.length > 1 ? 's' : ''}` : 
              'Create Link'}
          </Button>
        </div>
      </div>
    </div>
  </div>
</Drawer>

{/* signature Dialog */}

 {/* signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 bg-white flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {signatureRequest.isTemplate ? 'Convert to Signable Template' : 'Request Signature'}
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {signatureRequest.isTemplate
                    ? `Step ${signatureRequest.step || 1} of 3: Setup Template`
                    : `Step ${signatureRequest.step || 1} of 3: ${(signatureRequest.step || 1) === 1 ? 'Add Recipients' :
                      (signatureRequest.step || 1) === 2 ? 'Place Signature Fields' :
                        'Review & Send'
                    }`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowSignatureDialog(false);
                  setSignatureRequest({
                    recipientEmail: '',
                    recipientName: '',
                    message: '',
                    dueDate: '',
                    isTemplate: false,
                    step: 1,
                    recipients: [],
                    signatureFields: [],
                  });
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          {/* Progress Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b">
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-2 rounded-full ${(signatureRequest.step || 1) >= 1 ? 'bg-purple-600' : 'bg-slate-200'}`} />
              <div className={`flex-1 h-2 rounded-full ${(signatureRequest.step || 1) >= 2 ? 'bg-purple-600' : 'bg-slate-200'}`} />
              <div className={`flex-1 h-2 rounded-full ${(signatureRequest.step || 1) >= 3 ? 'bg-purple-600' : 'bg-slate-200'}`} />
            </div>
          </div>
          {/* Step Content */}
          <div className="flex-1 overflow-hidden">
            {/* Step 1: Recipients */}
            {(signatureRequest.step || 1) === 1 && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Who needs to sign?</h3>
                    <p className="text-sm text-slate-600">Add recipients and set signing order</p>
                  </div>
                  {/* Recipients List */}
                  <div className="space-y-3">
                    {(signatureRequest.recipients || []).map((recipient, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-white hover:border-purple-300 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-semibold">{index + 1}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-medium text-slate-700">Full Name</Label>
                                <Input
                                  value={recipient.name}
                                  onChange={(e) => {
                                    const updated = [...(signatureRequest.recipients || [])];
                                    updated[index].name = e.target.value;
                                    setSignatureRequest({ ...signatureRequest, recipients: updated });
                                  }}
                                  placeholder="John Doe"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium text-slate-700">Email Address</Label>
                                <Input
                                  type="email"
                                  value={recipient.email}
                                  onChange={(e) => {
                                    const updated = [...(signatureRequest.recipients || [])];
                                    updated[index].email = e.target.value;
                                    setSignatureRequest({ ...signatureRequest, recipients: updated });
                                  }}
                                  placeholder="john@company.com"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-slate-700">Role (optional)</Label>
                              <Input
                                value={recipient.role || ''}
                                onChange={(e) => {
                                  const updated = [...(signatureRequest.recipients || [])];
                                  updated[index].role = e.target.value;
                                  setSignatureRequest({ ...signatureRequest, recipients: updated });
                                }}
                                placeholder="e.g., Client, Manager, Legal"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const updated = (signatureRequest.recipients || []).filter((_, i) => i !== index);
                              setSignatureRequest({ ...signatureRequest, recipients: updated });
                            }}
                            className="text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Add Recipient Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        const updated = [
                          ...(signatureRequest.recipients || []),
                          { name: '', email: '', role: '', color: `hsl(${Math.random() * 360}, 70%, 50%)` }
                        ];
                        setSignatureRequest({ ...signatureRequest, recipients: updated });
                      }}
                      className="w-full border-dashed"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Another Recipient
                    </Button>
                  </div>
                  {/* Message & Due Date */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium">Message to Recipients (optional)</Label>
                      <Textarea
                        value={signatureRequest.message}
                        onChange={(e) => setSignatureRequest({ ...signatureRequest, message: e.target.value })}
                        placeholder="Please review and sign this document..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Due Date (optional)</Label>
                      <Input
                        type="date"
                        value={signatureRequest.dueDate}
                        onChange={(e) => setSignatureRequest({ ...signatureRequest, dueDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Step 2: Place Signature Fields */}
            {(signatureRequest.step || 1) === 2 && (
              <div className="h-full flex">
                {/* Left Sidebar */}
                <div className="w-56 border-r bg-slate-50 p-4 overflow-y-auto flex-shrink-0">
                  <h3 className="font-semibold text-slate-900 mb-4 text-sm">Signature Fields</h3>
                  {/* Recipients with Field Counts */}
                  <div className="space-y-2 mb-4">
                    {(signatureRequest.recipients || []).map((recipient, index) => {
                      const fieldCount = (signatureRequest.signatureFields || []).filter(
                        (f) => f.recipientIndex === index
                      ).length;
                      return (
                        <div key={index} className="p-2 bg-white rounded-lg border shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: recipient.color }}
                            />
                            <span className="text-xs font-medium text-slate-900 truncate flex-1">
                              {recipient.name || `Recipient ${index + 1}`}
                            </span>
                            {fieldCount > 0 && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                                {fieldCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{recipient.email}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Field Types */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-700 mb-2">Drag to place:</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs py-2"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('fieldType', 'signature');
                      }}
                    >
                      <FileSignature className="h-3 w-3 mr-2" />
                      Signature
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs py-2"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('fieldType', 'date');
                      }}
                    >
                      <Clock className="h-3 w-3 mr-2" />
                      Date Signed
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs py-2"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('fieldType', 'text');
                      }}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Text Field
                    </Button>
                  </div>
                  {/* Quick Actions */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-slate-700 mb-2">Quick Actions:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs py-1.5"
                      onClick={() => {
                        const newFields: SignatureField[] = (signatureRequest.recipients || []).map((_, index) => ({
                          id: Date.now() + index,
                          type: "signature",
                          x: 25,
                          y: 60 + (index * 15),
                          page: 1,
                          recipientIndex: index,
                        }));
                        setSignatureRequest({
                          ...signatureRequest,
                          signatureFields: [...(signatureRequest.signatureFields || []), ...newFields]
                        });
                      }}
                    >
                      <FileSignature className="h-3 w-3 mr-1" />
                      Auto-place
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 py-1.5"
                      onClick={() => {
                        if (window.confirm('Remove all fields from this page?')) {
                          const updated = (signatureRequest.signatureFields || []).filter(
                            (f) => f.page !== 1
                          );
                          setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                        }
                      }}
                      disabled={(signatureRequest.signatureFields || []).filter((f) => f.page === 1).length === 0}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear Page
                    </Button>
                  </div>
                  <div className="mt-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      💡 Drag fields onto the document
                    </p>
                  </div>
                </div>
                {/* Main Area - PDF */}
                <div className="flex-1 p-4 overflow-auto bg-slate-100 flex flex-col">
                  <div
                    id="pdf-container"
                    className="flex-1 bg-white shadow-2xl rounded-lg overflow-hidden relative mx-auto"
                    style={{
                      width: '210mm',
                      minHeight: `${297 * doc.numPages}mm`,
                      maxWidth: '100%',
                      position: 'relative'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const fieldType = e.dataTransfer.getData('fieldType') as "signature" | "date" | "text";
                      const container = document.getElementById('pdf-container'); {/* <-- USE THE ID HERE */ }
                      if (!container) return;
                      const rect = container.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const pageHeight = 297 * 3.78;  // Convert mm to pixels (3.78px per mm at 96dpi)
                      const pageNumber = Math.floor(y / pageHeight) + 1;
                      const yPercent = ((y % pageHeight) / pageHeight) * 100;
                      const x = ((e.clientX - rect.left) / rect.width) * 100;
                      const newField = {
                        id: Date.now(),
                        type: fieldType,
                        x: x,
                        y: yPercent,
                        page: pageNumber,
                        recipientIndex: 0,
                      };
                      setSignatureRequest({
                        ...signatureRequest,
                        signatureFields: [...(signatureRequest.signatureFields || []), newField]
                      });
                    }}
                  >
                    {pdfUrl ? (
                      <>
                        {/* Render all pages as a single document */}
                        <embed
                          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                          type="application/pdf"
                          className="w-full"
                          style={{
                            border: 'none',
                            pointerEvents: 'none',
                            height: `${297 * doc.numPages}mm`,
                            display: 'block',
                          }}
                        />
                        {/* Signature Field Overlays */}
                        {(signatureRequest.signatureFields || []).map((field) => {
                          const pageHeight = 297 * 3.78; // Convert mm to pixels
                          const topPosition = ((field.page - 1) * pageHeight) + (field.y / 100 * pageHeight);
                          const recipient = (signatureRequest.recipients || [])[field.recipientIndex];
                          return (
                            <div
                              key={field.id}
                              className="absolute border-2 rounded cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50"
                              style={{
                                left: `${field.x}%`,
                                top: `${topPosition}px`,
                                borderColor: recipient?.color || '#9333ea',
                                width: field.type === 'signature' ? '180px' : '140px',
                                height: field.type === 'signature' ? '70px' : '45px',
                                transform: 'translate(-50%, 0%)',
                              }}
                              draggable
                              onDragEnd={(e) => {
                                const container = document.getElementById('pdf-container');
                                if (!container) return;
                                const rect = container.getBoundingClientRect();
                                const y = e.clientY - rect.top;
                                const pageHeight = 297 * 3.78;
                                const pageNumber = Math.floor(y / pageHeight) + 1;
                                const yPercent = ((y % pageHeight) / pageHeight) * 100;
                                const newX = ((e.clientX - rect.left) / rect.width) * 100;
                                const updated = (signatureRequest.signatureFields || []).map((f) =>
                                  f.id === field.id ? { ...f, x: newX, y: yPercent, page: pageNumber } : f
                                );
                                setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                              }}
                            >
                              <div className="h-full flex flex-col items-center justify-center px-2 relative">
                                {/* Recipient Selector */}
                                <select
                                  value={field.recipientIndex}
                                  onChange={(e) => {
                                    const updated = (signatureRequest.signatureFields || []).map((f) =>
                                      f.id === field.id ? { ...f, recipientIndex: parseInt(e.target.value) } : f
                                    );
                                    setSignatureRequest({ ...signatureRequest, signatureFields: updated });
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute top-1 left-1 right-1 text-xs border rounded px-1 py-0.5 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                  style={{ fontSize: '10px' }}
                                >
                                  {(signatureRequest.recipients || []).map((r, idx) => (
                                    <option key={idx} value={idx}>
                                      {r.name || `Recipient ${idx + 1}`}
                                    </option>
                                  ))}
                                </select>
                                {/* Field Content */}
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    {field.type === 'signature' && <FileSignature className="h-4 w-4" />}
                                    {field.type === 'date' && <Clock className="h-4 w-4" />}
                                    {field.type === 'text' && <Edit className="h-4 w-4" />}
                                    <span className="text-xs font-semibold">
                                      {field.type === 'signature' ? 'Sign Here' : field.type === 'date' ? 'Date' : 'Text'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 truncate px-2">
                                    {recipient?.name || `Recipient ${field.recipientIndex + 1}`}
                                  </p>
                                </div>
                                {/* Delete Button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updated = (signatureRequest.signatureFields || []).filter((f) => f.id !== field.id);
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
                      <div className="h-full flex items-center justify-center" style={{ minHeight: '297mm' }}>
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
            {(signatureRequest.step || 1) === 3 && (
              <div className="h-full overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Review & Send</h3>
                    <p className="text-sm text-slate-600">Double-check everything before sending</p>
                  </div>
                  {/* Document Info */}
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-900 mb-3">Document</h4>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.filename}</p>
                        <p className="text-sm text-slate-500">{doc.numPages} pages</p>
                      </div>
                    </div>
                  </div>
                  {/* Recipients Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-900 mb-3">
                      Recipients ({(signatureRequest.recipients || []).length})
                    </h4>
                    <div className="space-y-2">
                      {(signatureRequest.recipients || []).map((recipient, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{recipient.name}</p>
                            <p className="text-sm text-slate-600">{recipient.email}</p>
                            {recipient.role && (
                              <p className="text-xs text-slate-500 mt-0.5">{recipient.role}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {(signatureRequest.signatureFields || []).filter((f) => f.recipientIndex === index).length} fields
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Signature Fields Summary */}
                  <div className="bg-slate-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-slate-900 mb-3">
                      Signature Fields ({(signatureRequest.signatureFields || []).length})
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {(signatureRequest.signatureFields || []).filter((f) => f.type === 'signature').length}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Signatures</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {(signatureRequest.signatureFields || []).filter((f) => f.type === 'date').length}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Date Fields</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(signatureRequest.signatureFields || []).filter((f) => f.type === 'text').length}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">Text Fields</p>
                      </div>
                    </div>
                  </div>
                  {/* Message Preview */}
                  {signatureRequest.message && (
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <h4 className="font-medium text-slate-900 mb-2">Message</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{signatureRequest.message}</p>
                    </div>
                  )}
                  {/* Due Date */}
                  {signatureRequest.dueDate && (
                    <div className="bg-slate-50 rounded-lg p-4 border">
                      <h4 className="font-medium text-slate-900 mb-2">Due Date</h4>
                      <p className="text-sm text-slate-700">
                        {new Date(signatureRequest.dueDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {/* Email Preview */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2">Email Preview</h4>
                        <div className="bg-white rounded-lg p-4 border text-sm">
                          <p className="text-slate-600 mb-3">Hi {(signatureRequest.recipients || [])[0]?.name},</p>
                          <p className="text-slate-600 mb-3">
                            You've been requested to review and sign <strong>{doc.filename}</strong>.
                          </p>
                          {signatureRequest.message && (
                            <p className="text-slate-600 mb-3 border-l-4 border-purple-300 pl-3 italic">
                              "{signatureRequest.message}"
                            </p>
                          )}
                          <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                            Review & Sign Document
                          </Button>
                          {signatureRequest.dueDate && (
                            <p className="text-xs text-slate-500 mt-3">
                              Please complete by {new Date(signatureRequest.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Footer Navigation */}
          <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {(signatureRequest.step || 1) === 1 && (
                <span>{(signatureRequest.recipients || []).length} recipient(s) added</span>
              )}
              {(signatureRequest.step || 1) === 2 && (
                <span>{(signatureRequest.signatureFields || []).length} field(s) placed</span>
              )}
              {(signatureRequest.step || 1) === 3 && (
                <span>Ready to send</span>
              )}
            </div>
            <div className="flex gap-3">
              {(signatureRequest.step || 1) > 1 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSignatureRequest({
                      ...signatureRequest,
                      step: (signatureRequest.step || 1) - 1
                    });
                  }}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {(signatureRequest.step || 1) < 3 ? (
                <Button
                  onClick={() => {
                    if ((signatureRequest.step || 1) === 1) {
                      const validRecipients = (signatureRequest.recipients || []).filter(
                        (r) => r.name && r.email
                      );
                      if (validRecipients.length === 0 && !signatureRequest.isTemplate) {
                        alert('Please add at least one recipient with name and email');
                        return;
                      }
                    }
                    setSignatureRequest({
                      ...signatureRequest,
                      step: (signatureRequest.step || 1) + 1
                    });
                  }}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      if (signatureRequest.isTemplate) {
                        if ((signatureRequest.signatureFields || []).length === 0) {
                          alert('Please add at least one signature field');
                          return;
                        }
                        setIsSending(true);
                        const response = await fetch(`/api/documents/${doc._id}/template`, {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            signatureFields: signatureRequest.signatureFields,
                            recipients: signatureRequest.recipients,
                          }),
                        });
                        const data = await response.json();
                        if (!response.ok || !data.success) {
                          alert(data.message || 'Failed to save template');
                          setIsSending(false);
                          return;
                        }
                        alert('✅ Document converted to signable template!');
                        setShowSignatureDialog(false);
                        await fetchDocument();
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
                        setIsSending(false);
                      } else {
                        const validRecipients = (signatureRequest.recipients || []).filter(
                          (r) => r.name && r.email
                        );
                        if (validRecipients.length === 0) {
                          alert('Please add at least one recipient with name and email');
                          return;
                        }
                        setIsSending(true);
                        const response = await fetch('/api/signature/create', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            documentId: doc._id,
                            recipients: signatureRequest.recipients,
                            signatureFields: signatureRequest.signatureFields,
                            message: signatureRequest.message,
                            dueDate: signatureRequest.dueDate,
                          }),
                        });
                        const data = await response.json();
                        if (!response.ok || !data.success) {
                          alert(data.message || 'Failed to send signature request');
                          setIsSending(false);
                          return;
                        }
                        setGeneratedLinks(data.signatureRequests);
                        setShowSuccessDialog(true);
                        setShowSignatureDialog(false);
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
                        setIsSending(false);
                      }
                    } catch (error) {
                      console.error('❌ Error:', error);
                      alert('Failed to process request. Please try again.');
                      setIsSending(false);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isSending}
                >
                  {signatureRequest.isTemplate ? (
                    <>
                      <FileSignature className="h-4 w-4 mr-2" />
                      {isSending ? 'Saving Template...' : 'Save as Template'}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      {isSending ? 'Sending...' : 'Send Request'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
{/* Success Dialog with Generated Links */}
<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
  <DialogContent className="max-w-3xl p-0 bg-white flex flex-col">
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
            // In a real app, this would navigate to the tracking dashboard
            alert('Opening document tracking dashboard...');
          }}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Track Status
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

{/* Update Thumbnail Dialog */}
<Dialog open={showThumbnailDialog} onOpenChange={setShowThumbnailDialog}>
  <DialogContent className="max-w-md bg-white max-h-[80vh] overflow-y-auto">

    <DialogHeader>
      <DialogTitle>Update Document Thumbnail</DialogTitle>
      <p className="text-sm text-slate-500 mt-1">
        Choose a custom preview image for your document
      </p>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Current Thumbnail */}
      {doc?.thumbnail && !thumbnailPreview && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Current Thumbnail</Label>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-slate-200">
            <img 
              src={doc.thumbnail} 
              alt="Current thumbnail"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      {/* Preview New Thumbnail */}
      {thumbnailPreview && (
        <div>
          <Label className="text-sm font-medium mb-2 block">New Thumbnail Preview</Label>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-purple-500">
            <img 
              src={thumbnailPreview} 
              alt="New thumbnail preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      {/* File Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          {thumbnailPreview ? 'Choose Different Image' : 'Choose Image'}
        </Label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailFileSelect}
            className="hidden"
            id="thumbnail-upload"
          />
          <label
            htmlFor="thumbnail-upload"
            className="flex-1 cursor-pointer"
          >
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-600 font-medium">
                Click to upload image
              </p>
              <p className="text-xs text-slate-500 mt-1">
                JPG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </label>
        </div>
        {thumbnailFile && (
          <p className="text-xs text-slate-600 mt-2">
            Selected: {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>
      
      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Use a clear, high-quality image that represents your document. 
          This thumbnail will appear in your dashboard and when sharing.
        </p>
      </div>
    </div>
    
    {/* Footer */}
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button
        variant="outline"
        onClick={() => {
          setShowThumbnailDialog(false);
          setThumbnailFile(null);
          setThumbnailPreview(null);
        }}
        disabled={isUploadingThumbnail}
      >
        Cancel
      </Button>
      <Button
        onClick={handleUploadThumbnail}
        disabled={!thumbnailFile || isUploadingThumbnail}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {isUploadingThumbnail ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Update Thumbnail
          </>
        )}
      </Button>
    </div>
  </DialogContent>
</Dialog>

{/* 🆕 Google Drive Files Drawer */}
<Drawer open={showDriveFilesDialog} onOpenChange={setShowDriveFilesDialog}>
  <div className="h-full flex flex-col bg-white">
    {/* Header */}
    <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Import from Google Drive</h2>
            <p className="text-sm text-slate-600">Select CSV file to import contacts</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowDriveFilesDialog(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>

    {/* Search Bar */}
    <div className="px-6 py-4 border-b bg-slate-50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search your Drive files..."
          className="pl-10 bg-white"
          value={driveSearchQuery}
          onChange={(e) => setDriveSearchQuery(e.target.value)}
        />
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Found {driveFiles.filter(f => f.name.toLowerCase().includes(driveSearchQuery.toLowerCase())).length} CSV file(s)
      </p>
    </div>
    
    {/* File List */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {loadingDriveFiles ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-slate-600 font-medium">Loading your Drive files...</p>
        </div>
      ) : driveFiles.filter(f => 
          f.name.toLowerCase().includes(driveSearchQuery.toLowerCase()) &&
          f.name.endsWith('.csv')
        ).length > 0 ? (
        <div className="space-y-3">
          {driveFiles
            .filter(f => 
              f.name.toLowerCase().includes(driveSearchQuery.toLowerCase()) &&
              f.name.endsWith('.csv')
            )
            .map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer"
                onClick={async () => {
                  // Download CSV from Drive and parse it
                  toast.loading('Importing CSV from Drive...');
                  
                  try {
                    const res = await fetch('/api/integrations/google-drive/import', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ fileId: file.id, fileName: file.name })
                    });
                    
                    if (res.ok) {
                      const blob = await res.blob();
                      const text = await blob.text();
                      
                      // Parse CSV
                      const lines = text.split('\n').filter(line => line.trim());
                      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                      const emailIndex = headers.findIndex(h => h.includes('email'));
                      
                      if (emailIndex === -1) {
                        toast.error('CSV must have an "email" column');
                        return;
                      }
                      
                      const nameIndex = headers.findIndex(h => h.includes('name'));
                      const companyIndex = headers.findIndex(h => h.includes('company'));
                      
                      const contacts = lines.slice(1).map(line => {
                        const cols = line.split(',').map(c => c.trim());
                        return {
                          email: cols[emailIndex]?.toLowerCase() || '',
                          name: nameIndex >= 0 ? cols[nameIndex] : undefined,
                          company: companyIndex >= 0 ? cols[companyIndex] : undefined,
                        };
                      }).filter(c => c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
                      
                      if (contacts.length === 0) {
                        toast.error('No valid emails found in CSV');
                        return;
                      }
                      
                      setCsvPreview(contacts);
                      setShowDriveFilesDialog(false);
                      toast.success(`Found ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`);
                    } else {
                      toast.error('Failed to import CSV');
                    }
                  } catch (error) {
                    toast.error('Import failed');
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-md">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate mb-1 group-hover:text-blue-700 transition-colors">
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Modified {new Date(file.modifiedTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </motion.div>
            ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No CSV files found
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Upload CSV files to your Google Drive to import them here
          </p>
        </div>
      )}
    </div>
    
    {/* Footer */}
    <div className="px-6 py-4 border-t bg-slate-50">
      <Button
        variant="outline"
        onClick={() => setShowDriveFilesDialog(false)}
        className="w-full"
      >
        Close
      </Button>
    </div>
  </div>
</Drawer>
 


    </div>
  );
}