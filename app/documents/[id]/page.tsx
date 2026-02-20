//APP/DOCUMENTS/[ID]/PAGE.TSX

"use client";

import { useState, useEffect } from "react";
import React from 'react'; // Add this if not already present
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
 import Link from "next/link";
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion";
import { toast } from 'sonner'
import DocSendStyleCharts from '@/components/DocSendStyleCharts';



import { Copy, Check, TrendingUp, Users, FileCheck, Expand, Minimize, Package, Loader2, Flame, Target, AlertTriangle, Wifi, WifiOff, MousePointer, BookOpen, BarChart2, Globe, RefreshCw  } from "lucide-react"
import dynamic from 'next/dynamic'
const DocumentHeatmap = dynamic(() => import('@/components/DocumentHeatmap'), { ssr: false })
const ViewerMap = dynamic(() => import('@/components/ViewerMap'), { ssr: false })
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
  ownerEmail?: string;
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
  const [activeTab, setActiveTab] = useState<'activity' | 'performance' | 'signatures' | 'utilization'>('activity');
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
const [recipientNameInput, setRecipientNameInput] = useState('');
const [driveSearchQuery, setDriveSearchQuery] = useState('');
const [logoFile, setLogoFile] = useState<File | null>(null);
const [logoPreview, setLogoPreview] = useState<string | null>(null);
const [isUploadingLogo, setIsUploadingLogo] = useState(false);
const [liveViewerCount, setLiveViewerCount] = useState(0);
const [liveViewers, setLiveViewers] = useState<any[]>([]);
const [heatmapPage, setHeatmapPage] = useState(1);
const [showEditLinkDrawer, setShowEditLinkDrawer] = useState(false);
const [editingLink, setEditingLink] = useState<any>(null);
const [sigAnalytics, setSigAnalytics] = useState<any>(null);
const [sigAnalyticsLoading, setSigAnalyticsLoading] = useState(false);
const [editMode, setEditMode] = useState<'create' | 'edit' | 'duplicate'>('create'); // ✅ NEW
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
  recipientNames: [] as string[], 
  enableWatermark: false,
  watermarkText: '',
  watermarkPosition: 'bottom' as 'top' | 'bottom' | 'center' | 'diagonal',
  ndaText: '',
  ndaTemplateId: '',
  customNdaText: '',
  useCustomNda: false,
  allowPrint: true, //   NEW
  allowForwarding: true, //   NEW
  notifyOnDownload: false, //   NEW
  downloadLimit: undefined as number | undefined, //   NEW
  viewLimit: undefined as number | undefined, //   NEW
  selfDestruct: false, //   NEW
  availableFrom: '', //   NEW (datetime-local string)
  linkType: 'public' as 'public' | 'email-gated' | 'domain-restricted', //   NEW
  sharedByName: '', //   NEW
   logoUrl: '',
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
  fetchSignatureAnalytics();
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
  const name = recipientNameInput.trim();
  
  if (!email) return;
  if (!name) {
    toast.error('Please enter recipient name');
    return;
  }
  
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
  
  // Add both email and name
  setShareSettings({
    ...shareSettings,
    recipientEmails: [...shareSettings.recipientEmails, email],
    recipientNames: [...(shareSettings.recipientNames || []), name],
  });
  
  setRecipientInput('');
  setRecipientNameInput('');
  toast.success(`Added ${name} (${email})`);
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


// 🆕 Handle logo file selection
const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file');
    return;
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error('Logo must be less than 2MB');
    return;
  }
  
  setLogoFile(file);
  
  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setLogoPreview(reader.result as string);
  };
  reader.readAsDataURL(file);
  
  // 🔥 UPLOAD TO CLOUDINARY IMMEDIATELY
  await handleUploadLogo(file);
};

// 🆕 Upload logo to Cloudinary
const handleUploadLogo = async (file: File) => {
  setIsUploadingLogo(true);
  
  try {
    const formData = new FormData();
    formData.append('logo', file);
    
    const res = await fetch('/api/upload/logo', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Logo uploaded, URL:', data.logoUrl); // ✅ Debug log
      
      // ✅ FIX: Use functional update to avoid stale closure
      setShareSettings(prev => ({
        ...prev,
        logoUrl: data.logoUrl
      }));
      
      toast.success('Logo uploaded!');
    } else {
      const error = await res.json();
      toast.error(error.message || 'Failed to upload logo');
    }
  } catch (error) {
    console.error('Logo upload error:', error);
    toast.error('Failed to upload logo');
  } finally {
    setIsUploadingLogo(false);
  }
};

//   Remove logo
const handleRemoveLogo = () => {
  setLogoFile(null);
  setLogoPreview(null);
  // ✅ FIX: Use functional update
  setShareSettings(prev => ({
    ...prev,
    logoUrl: ''
  }));
  toast.success('Logo removed');
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


 

const fetchSignatureAnalytics = async () => {
  setSigAnalyticsLoading(true);
  try {
    const res = await fetch(`/api/documents/${params.id}/signature-analytics`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) setSigAnalytics(data.analytics);
    }
  } catch (err) {
    console.error('Failed to fetch signature analytics:', err);
  } finally {
    setSigAnalyticsLoading(false);
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

// Poll for live viewers every 15 seconds
useEffect(() => {
  if (!params.id) return;
  const pollLiveViewers = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}/analytics`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLiveViewerCount(data.analytics.liveViewerCount || 0);
          setLiveViewers(data.analytics.realTimeViewers || []);
        }
      }
    } catch {}
  };
  pollLiveViewers();
  const interval = setInterval(pollLiveViewers, 15000);
  return () => clearInterval(interval);
}, [params.id]);

  // Save notes
const handleSaveNotes = async () => {
  setIsSavingNotes(true);
  

  try {
   const res = await fetch(`/api/documents/${params.id}`, {
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

const formatTime = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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

const handleOpenLinkDrawer = (linkType: 'public' | 'email-gated') => {
  setEditMode('create');
  setEditingLink(null);
  setGeneratedLink(null);
  setShowCreateLinkDialog(true);
  setShareSettings({
    requireEmail: linkType === 'email-gated' ? true : false,
    allowDownload: false,
    expiresIn: 7,
    password: '',
    recipientEmails: [],
    recipientNames: [],
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
    allowPrint: true,
    allowForwarding: true,
    notifyOnDownload: false,
    downloadLimit: undefined,
    viewLimit: undefined,
    selfDestruct: false,
    availableFrom: '',
    linkType: linkType,           // ← pre-set the correct type
    sharedByName: '',
    logoUrl: '',
  });
};

  
// Handle create shareable link
const handleCreateLink = () => {
  handleOpenLinkDrawer('public');
  setEditMode('create');
  setEditingLink(null);
  setShowCreateLinkDialog(true);
  setGeneratedLink(null);
  // Reset all share settings to defaults
  setShareSettings({
    requireEmail: true, allowDownload: false, expiresIn: 7, password: '',
    recipientEmails: [], recipientNames: [], sendEmailNotification: true,
    customMessage: '', requireNDA: false, allowedEmails: [], enableWatermark: false,
    watermarkText: '', watermarkPosition: 'bottom', ndaText: '', ndaTemplateId: '',
    customNdaText: '', useCustomNda: false, allowPrint: true, allowForwarding: true,
    notifyOnDownload: false, downloadLimit: undefined, viewLimit: undefined,
    selfDestruct: false, availableFrom: '', linkType: 'public', sharedByName: '', logoUrl: ''
  });
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
   <div className="min-h-screen bg-white ui-layout">

       {/* ✅ DIFFERENT MESSAGE FOR DOCUMENTS PAGE */}
            <PageInfoTooltip 
              pageId="documents"
              message="View and manage your uploaded PDF documents. Preview, download, and share documents with others."
              position="top"
            />
      {/* Header */}
       <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-3 gap-4">

            {/* ── LEFT: back + thumbnail + title area ── */}
            <div className="flex items-center gap-4 min-w-0">

              {/* Back arrow */}
              <button
                onClick={() => router.push('/dashboard')}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {/* Doc thumbnail — small PDF icon box like DocSend */}
              <div className="h-10 w-8 rounded bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {doc.thumbnail ? (
                  <img src={doc.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Title + note + last updated stacked */}
             <div className="min-w-0">

                {/* Document title row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[320px] leading-tight">
                    {doc.filename}
                  </h1>
                  {doc.isTemplate && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                      <FileSignature className="h-3 w-3 mr-1" />
                      Template
                    </span>
                  )}
                  {liveViewerCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {liveViewerCount} live
                    </span>
                  )}
                </div>

                {/* Notes row — pencil + text, expands on click */}
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="flex items-center gap-1.5 mt-1 group"
                  >
                    <Edit className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                    <span className={`text-xs transition-colors ${
                      doc.notes
                        ? 'text-slate-500 group-hover:text-slate-700'
                        : 'text-slate-300 group-hover:text-slate-500 italic'
                    }`}>
                      {doc.notes || 'Add a note to this document'}
                    </span>
                  </button>
                ) : (
                  // ── Expanded note editor ──
                  <div className="mt-1.5 flex flex-col gap-1.5 w-full max-w-sm">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add a note to this document..."
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 
                                 resize-none focus:outline-none focus:border-sky-400 focus:ring-2 
                                 focus:ring-sky-100 transition-all placeholder:text-slate-300
                                 bg-white shadow-sm leading-relaxed"
                      rows={2}
                      autoFocus
                      maxLength={200}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveNotes();
                        }
                        if (e.key === 'Escape') {
                          setIsEditingNotes(false);
                          setNotes(doc.notes || '');
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-300">
                        {notes.length}/200 · Enter to save, Esc to cancel
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setIsEditingNotes(false);
                            setNotes(doc.notes || '');
                          }}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600 
                                     rounded-md hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-sky-500 
                                     hover:bg-sky-600 rounded-md transition-colors disabled:opacity-50
                                     flex items-center gap-1"
                        >
                          {isSavingNotes ? (
                            <>
                              <div className="h-2.5 w-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                              Saving
                            </>
                          ) : (
                            'Save'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last updated — only show when NOT editing note */}
                {!isEditingNotes && (
                  <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last updated {formatTimeAgo(doc.createdAt)}
                  </p>
                )}

              </div>
              </div>

            {/* ── RIGHT: action buttons ── */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Preview button — outlined like DocSend */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handlePreview}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="hidden sm:inline">Preview</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>Preview document</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Upload new version button — outlined */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        // trigger hidden file input for version upload
                        document.getElementById('upload-new-version-input')?.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Upload new version</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p>Upload a new version</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Hidden file input for version upload */}
              <input
                type="file"
                id="upload-new-version-input"
                accept=".pdf"
                className="hidden"
                onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const renamedFile = new File([file], doc.filename, { type: file.type });
  const formData = new FormData();
  formData.append('file', renamedFile);
  
  try {
    const res = await fetch(`/api/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
                    if (res.ok) {
                      toast.success('New version uploaded!');
                      fetchDocument();
                    } else {
                      toast.error('Failed to upload version');
                    }
                  } catch {
                    toast.error('Upload failed');
                  }
                  e.target.value = '';
                }}
              />

              {/* Create link — solid brand button with split dropdown arrow */}
              
              <div className="flex items-center rounded-lg overflow-hidden border border-sky-500 shadow-sm">
                {/* Main button — always opens "Document link" (public) */}
                <button
                  onClick={() => handleOpenLinkDrawer('public')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Create link
                </button>

                {/* Split arrow — opens link type menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-2 py-1.5 bg-sky-500 hover:bg-sky-600 text-white border-l border-sky-400 transition-colors">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-white shadow-lg border border-slate-200 p-1">
                    
                    {/* Document link — public, no email required */}
                    <DropdownMenuItem
                      onClick={() => handleOpenLinkDrawer('public')}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                      <LinkIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Document link</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Anyone with the link can view</p>
                      </div>
                    </DropdownMenuItem>

                    {/* Email-gated link — requires email before viewing */}
                    <DropdownMenuItem
                      onClick={() => handleOpenLinkDrawer('email-gated')}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                      <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Email-gated link</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Viewer must enter email to access</p>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Request signatures — goes to signature flow */}
                    <DropdownMenuItem
                      onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                      <FileSignature className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Request signatures</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Send for e-signature</p>
                      </div>
                    </DropdownMenuItem>

                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* ··· more menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-slate-200">
                  <DropdownMenuItem onClick={handlePresent}>
                    <Presentation className="mr-2 h-4 w-4" />
                    <span>Present</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)}>
                    <FileSignature className="mr-2 h-4 w-4" />
                    <span>{doc?.isTemplate ? 'Edit Template' : 'Convert to signable'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/versions`)}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Version History</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/compliance')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Compliance Report</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading
                      ? <div className="mr-2 h-4 w-4 animate-spin border-2 border-sky-500 border-t-transparent rounded-full" />
                      : <Download className="mr-2 h-4 w-4" />}
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
                    <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/bulk-send`)}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Bulk Send</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

       

      
      

      
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
      <div className="bg-white border-b border-slate-200 sticky top-[65px] z-40 mt-5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-0">
            {(
              [
                { id: 'activity', label: 'Activity' },
                { id: 'performance', label: 'Performance' },
                { id: 'signatures', label: 'Signatures' },
                { id: 'utilization', label: 'Utilization' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-4 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'}
                `}
              >
                {tab.label}
                {/* Active underline — matches DocSend's thin border-b */}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {activeTab === 'activity' && (
  <div className="space-y-6">

    {/* ── LOADING SKELETON — shows while analyticsLoading is true ── */}
    {analyticsLoading && (
      <div className="space-y-0">
        {/* Visits skeleton */}
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <div className="h-5 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100">
            <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
        {/* Links skeleton */}
        <div className="pt-8" />
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-7 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100">
            <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-56 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-10 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-4 w-14 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )}

    {/* ── Template section (unchanged) ── */}
    {doc.isTemplate && (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <FileSignature className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Signable Template Ready</h2>
          <p className="text-slate-600 mb-6">This document has pre-placed signature fields. Send it to recipients to collect signatures.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Mail className="h-4 w-4" />Send to Recipients
            </Button>
            <Button onClick={() => router.push(`/documents/${doc._id}/template-preview`)} variant="outline" className="gap-2">
              <FileSignature className="h-4 w-4" />View Template
            </Button>
            <Button onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />Edit Template
            </Button>
            <Button onClick={async () => { if (confirm('Remove template configuration?')) { const res = await fetch(`/api/documents/${doc._id}/template`, { method: 'DELETE', credentials: 'include' }); if (res.ok) { fetchDocument(); } } }} variant="outline" className="gap-2 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />Remove Template
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ── NO SHARES YET: Put document to work ── */}
    {!analyticsLoading && (!analytics?.shares || analytics.shares === 0) && (
      <div className="bg-white rounded-2xl border shadow-sm p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center mx-auto mb-6">
            <Share2 className="h-10 w-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Put your document to work</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Create a share link to track who views it, how long they spend, and which pages matter most.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleCreateLink} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <LinkIcon className="h-4 w-4" />Create link
            </Button>
            <Button onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)} variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />Request signatures
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ── HAS SHARES: DocSend-style Activity View ── */}
    {!analyticsLoading && analytics?.shares > 0 && (
      <ActivityTab
        analytics={analytics}
        doc={doc}
        token={String(params.id)}
        onCreateLink={handleCreateLink}
        onEditLink={(link) => {
    setEditingLink(link);
    setShowEditLinkDrawer(true);
  }}

  onOpenShareDrawer={(link, mode, settings) => {
    setEditingLink(link);
    setEditMode(mode);
    setShareSettings(settings);
    setShowCreateLinkDialog(true);
  }}
      />
    )}

  </div>
)}

{activeTab === 'performance' && (
  <div className="space-y-0">
    {analyticsLoading ? (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading analytics...</p>
        </div>
      </div>

    ) : !analytics ||
      (analytics.totalViews === 0 &&
       analytics.uniqueViewers === 0 &&
       (!analytics.pageEngagement || analytics.pageEngagement.every((p: any) => p.totalViews === 0))) ? (

      /* ── EMPTY STATE — flat, no card ── */
      <div className="py-32 text-center border-b border-slate-100">
        <BarChart3 className="h-10 w-10 text-slate-200 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">No views yet</h3>
        <p className="text-sm text-slate-400 mb-6">Share your document to start tracking performance</p>
        <button
          onClick={handleCreateLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Create Share Link
        </button>
      </div>

    ) : (
      <>

        {/* ═══════════════════════════════════════════════════
            SECTION 1 — DEAD DEAL ALERT (only if score ≥ 60)
        ═══════════════════════════════════════════════════ */}
        {analytics.deadDeal?.score >= 60 && (
          <div className={`py-5 border-b ${
            analytics.deadDeal.score >= 80
              ? 'border-red-200 bg-red-50/40'
              : 'border-orange-200 bg-orange-50/40'
          }`}>
            <div className="flex items-start gap-4">
              <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                analytics.deadDeal.score >= 80 ? 'text-red-500' : 'text-orange-500'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-bold ${
                    analytics.deadDeal.score >= 80 ? 'text-red-900' : 'text-orange-900'
                  }`}>
                    {analytics.deadDeal.score >= 80 ? '☠️ Dead Deal Detected' : '⚠️ Deal At Risk'}
                  </p>
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <div className={`text-xl font-black tabular-nums ${
                        analytics.deadDeal.score >= 80 ? 'text-red-600' : 'text-orange-600'
                      }`}>{analytics.deadDeal.score}%</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">dead score</div>
                    </div>
                    <div>
                      <div className="text-xl font-black tabular-nums text-green-600">{analytics.deadDeal.recoveryProbability}%</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide">recovery</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {analytics.deadDeal.signals?.map((signal: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        signal.type === 'CRITICAL' ? 'bg-red-500' :
                        signal.type === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      {signal.signal}
                    </div>
                  ))}
                </div>
                {analytics.deadDeal.recommendations?.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {analytics.deadDeal.recommendations.map((rec: any, i: number) => (
                      <div key={i} className="flex items-center gap-1 text-xs text-slate-500">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {rec.action}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 2 — LIVE VIEWERS (only if active)
        ═══════════════════════════════════════════════════ */}
        {liveViewerCount > 0 && (
          <div className="py-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-green-700">
                {liveViewerCount} viewing right now
              </span>
              <Wifi className="h-3.5 w-3.5 text-green-500 ml-auto" />
            </div>
            <div className="space-y-2">
              {liveViewers.map((viewer: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {viewer.email ? viewer.email.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {viewer.email || 'Anonymous viewer'}
                    </p>
                    <p className="text-[11px] text-slate-400">Page {viewer.page} · {viewer.device}</p>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — KPI ROW (inline stat strips, no cards)
        ═══════════════════════════════════════════════════ */}
        <div className="py-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Overview</p>
          {/* 3-column grid — just numbers on bare background */}
          <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100 mb-5">
            {[
              { label: 'Total Views', value: analytics.totalViews, icon: Eye, color: 'text-sky-500' },
              { label: 'Unique Viewers', value: analytics.uniqueViewers, icon: Users, color: 'text-violet-500' },
              { label: 'Completion', value: `${analytics.completionRate}%`, icon: TrendingUp, color: 'text-green-500' },
            ].map((stat) => (
              <div key={stat.label} className="px-6 first:pl-0 last:pr-0">
                <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
                <div className="text-3xl font-black text-slate-900 tabular-nums leading-none">{stat.value}</div>
                <div className="text-[11px] text-slate-400 mt-1.5 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Second row: time stats */}
          <div className="grid grid-cols-2 gap-0 divide-x divide-slate-100">
            <div className="pr-6">
              <Clock className="h-4 w-4 text-orange-400 mb-2" />
              <div className="text-2xl font-black text-slate-900 tabular-nums leading-none">{analytics.avgTimePerSession}</div>
              <div className="text-[11px] text-slate-400 mt-1.5 font-medium">Avg. Time / Visit</div>
              <div className="text-[11px] text-slate-300">across {analytics.totalViews} sessions</div>
            </div>
            <div className="pl-6">
              <Clock className="h-4 w-4 text-purple-400 mb-2" />
              <div className="text-2xl font-black text-slate-900 tabular-nums leading-none">{analytics.avgTotalTimePerViewer}</div>
              <div className="text-[11px] text-slate-400 mt-1.5 font-medium">Total Time / Viewer</div>
              <div className="text-[11px] text-slate-300">cumulative across all visits</div>
            </div>
          </div>
        </div>

         {/* ═══════════════════════════════════════════════════
            SECTION 12 — DOCSEND STYLE CHARTS (keep existing)
        ═══════════════════════════════════════════════════ */}
        <div className="py-5">
          <DocSendStyleCharts
            documentId={doc._id}
            pageEngagement={analytics.pageEngagement}
            totalPages={doc.numPages}
            locations={analytics.locations || []}
          />
        </div>

        {analytics.locations && analytics.locations.length > 0 && (
  <div className="py-5 border-b border-slate-100">
    <div className="flex items-center gap-1.5 mb-5">
      <Globe className="h-3.5 w-3.5 text-sky-400" />
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
        Viewer Map
      </p>
    </div>
    <ViewerMap locations={analytics.locations} />
  </div>
)}

        {/* ═══════════════════════════════════════════════════
            SECTION 4 — VIEWS CHART (inline bars, no wrapper)
        ═══════════════════════════════════════════════════ */}
        <div className="py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Views — Last 7 Days</p>
            <BarChart2 className="h-3.5 w-3.5 text-slate-300" />
          </div>
          <div className="flex items-end justify-between gap-1.5" style={{ height: '120px' }}>
            {analytics.viewsByDate.map((day: any, index: number) => {
              const maxViews = Math.max(...analytics.viewsByDate.map((d: any) => d.views), 1);
              const height = (day.views / maxViews) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    {day.views > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1">
                        {day.views}
                      </div>
                    )}
                    <div
                      className="w-full rounded-sm transition-all group-hover:opacity-80"
                      style={{
                        height: `${height}%`,
                        minHeight: day.views > 0 ? '3px' : '0',
                        background: day.views > 0
                          ? 'linear-gradient(180deg, #a855f7 0%, #0ea5e9 100%)'
                          : '#f1f5f9',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">{day.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            SECTION 5 — PAGE ENGAGEMENT (inline bars)
        ═══════════════════════════════════════════════════ */}
        {analytics.pageEngagement?.length > 0 && (
          <div className="py-5 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">Page Engagement</p>
            <div className="space-y-3">
              {analytics.pageEngagement.slice(0, 10).map((page: any, i: number) => {
                const maxViews = Math.max(...analytics.pageEngagement.map((p: any) => p.totalViews), 1);
                const pct = (page.totalViews / maxViews) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 w-8 flex-shrink-0 text-right tabular-nums">
                      P{page.page}
                    </span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct > 70
                            ? '#0ea5e9'
                            : pct > 40
                            ? '#a855f7'
                            : '#cbd5e1',
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 tabular-nums w-8 flex-shrink-0">
                      {page.totalViews}
                    </span>
                    {page.avgTimeSpent && (
                      <span className="text-[11px] text-slate-400 flex-shrink-0 tabular-nums w-14 text-right">
                        {Math.floor(page.avgTimeSpent / 60)}:{String(Math.round(page.avgTimeSpent % 60)).padStart(2,'0')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 6 — REVISIT + INTENT (two-col flat layout)
        ═══════════════════════════════════════════════════ */}
        {analytics.revisitData && (
          <div className="py-5 border-b border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-slate-100">

              {/* Return Visits */}
              <div className="md:pr-8 pb-5 md:pb-0">
                <div className="flex items-center gap-1.5 mb-4">
                  <RefreshCw className="h-3.5 w-3.5 text-violet-400" />
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Return Visits</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: 'Total sessions', value: analytics.revisitData.totalSessions, color: 'text-slate-900' },
                    { label: 'Revisits', value: analytics.revisitData.revisits, color: 'text-violet-600' },
                    { label: 'Avg / viewer', value: `${analytics.revisitData.avgVisitsPerViewer}×`, color: 'text-sky-600' },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight">{s.label}</div>
                    </div>
                  ))}
                </div>
                {analytics.revisitData.highFrequencyViewers?.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">🔥 High-frequency</p>
                    {analytics.revisitData.highFrequencyViewers.slice(0, 3).map((v: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 truncate flex-1">{v.email || 'Anonymous'}</span>
                        <span className="text-xs font-bold text-violet-600 ml-3 flex-shrink-0">{v.visitCount} visits</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buyer Intent */}
              {analytics.intentScores && (
                <div className="md:pl-8 pt-5 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center gap-1.5 mb-4">
                    <Target className="h-3.5 w-3.5 text-orange-400" />
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Buyer Intent</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: 'High', value: analytics.intentData?.highIntent || 0, color: 'text-green-600', emoji: '🔥' },
                      { label: 'Medium', value: analytics.intentData?.mediumIntent || 0, color: 'text-amber-500', emoji: '👀' },
                      { label: 'Low', value: analytics.intentData?.lowIntent || 0, color: 'text-slate-400', emoji: '😴' },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="text-base mb-0.5">{s.emoji}</div>
                        <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {analytics.intentScores.slice(0, 3).map((v: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 truncate flex-1">{v.email || 'Anonymous'}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((v.intentScore / 50) * 100, 100)}%`,
                              background: v.intentLevel === 'high' ? '#22c55e' : v.intentLevel === 'medium' ? '#f59e0b' : '#94a3b8',
                            }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums w-6 text-right flex-shrink-0 ${
                          v.intentLevel === 'high' ? 'text-green-600' : v.intentLevel === 'medium' ? 'text-amber-500' : 'text-slate-400'
                        }`}>{v.intentScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 7 — PER-VIEWER PAGE BREAKDOWN
        ═══════════════════════════════════════════════════ */}
        {analytics.recipientPageTracking?.length > 0 && (
          <div className="py-5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 mb-5">
              <MousePointer className="h-3.5 w-3.5 text-sky-400" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Per-Viewer Page Breakdown</p>
            </div>
            <div className="space-y-5">
              {analytics.recipientPageTracking.map((recipient: any, idx: number) => (
                <div key={idx} className="pb-5 border-b border-slate-100 last:border-b-0 last:pb-0">
                  {/* Viewer header row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {recipient.recipientEmail ? recipient.recipientEmail.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {recipient.recipientEmail || 'Anonymous'}
                      </p>
                      <p className="text-[11px] text-slate-400">{recipient.totalTimeOnDoc} total</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      recipient.neverOpened
                        ? 'text-slate-400 bg-slate-100'
                        : recipient.bounced
                        ? 'text-red-500 bg-red-50'
                        : 'text-green-600 bg-green-50'
                    }`}>
                      {recipient.neverOpened ? 'Never opened' : recipient.bounced ? 'Bounced' : 'Engaged'}
                    </span>
                  </div>
                  {/* Page pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {recipient.pageData?.map((p: any) => (
                      <div
                        key={p.page}
                        title={p.skipped ? `Page ${p.page}: Skipped` : `Page ${p.page}: ${p.timeSpent}s · ${p.scrollDepth}% scroll`}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border ${
                          p.skipped
                            ? 'bg-slate-50 text-slate-300 border-slate-200'
                            : p.timeSpent > 120
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-violet-50 text-violet-600 border-violet-200'
                        }`}
                      >
                        <span className="tabular-nums">P{p.page}</span>
                        {!p.skipped && <span className="opacity-60">· {p.timeSpent}s</span>}
                        {p.skipped && <span>⊘</span>}
                        {!p.skipped && p.visits > 1 && <span>↩</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 8 — BOUNCE ANALYTICS (flat 4-stat row)
        ═══════════════════════════════════════════════════ */}
        {analytics.bounceAnalytics && (
          <div className="py-5 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Bounce Analytics</p>
            <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100">
              {[
                { label: 'Total', value: analytics.bounceAnalytics.totalRecipients, color: 'text-slate-900' },
                { label: 'Bounced', value: analytics.bounceAnalytics.bounced, color: 'text-red-500' },
                { label: 'Engaged', value: analytics.bounceAnalytics.engaged, color: 'text-green-600' },
                { label: 'Bounce Rate', value: `${analytics.bounceAnalytics.bounceRate}%`, color: 'text-orange-500' },
              ].map((s) => (
                <div key={s.label} className="px-4 first:pl-0 last:pr-0">
                  <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 9 — TOP VIEWERS (flat list, dividers only)
        ═══════════════════════════════════════════════════ */}
        {analytics.topViewers?.length > 0 && (
          <div className="py-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-sky-400" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Top Viewers</p>
              </div>
            </div>
            {/* Column header */}
            <div className="grid grid-cols-3 py-2 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <span>Viewer</span>
              <span className="text-center">Views</span>
              <span className="text-right">Last seen</span>
            </div>
            {analytics.topViewers.map((viewer: any, index: number) => (
              <div key={index} className="grid grid-cols-3 items-center py-3.5 border-b border-slate-50 last:border-b-0 group hover:bg-slate-50/50 transition-colors -mx-1 px-1 rounded">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {viewer.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{viewer.email}</p>
                    <p className="text-[11px] text-slate-400">{viewer.time} total</p>
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{viewer.views}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400">{viewer.lastViewed}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 10 — NDA ACCEPTANCES (flat list)
        ═══════════════════════════════════════════════════ */}
        {analytics?.ndaAcceptances?.length > 0 && (
          <div className="py-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-violet-400" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  NDA Acceptances ({analytics.ndaAcceptances.length})
                </p>
              </div>
              <Link href="/nda-records">
                <button className="text-[11px] text-sky-500 hover:text-sky-700 font-semibold flex items-center gap-0.5">
                  View All <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
            <div className="space-y-0">
              {analytics.ndaAcceptances.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-b-0">
                  <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900">{a.viewerName}</p>
                    <p className="text-[11px] text-slate-400">{a.viewerEmail}{a.viewerCompany ? ` · ${a.viewerCompany}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-[11px] text-slate-400">{new Date(a.timestamp).toLocaleDateString()}</p>
                    <button
                      className="text-[11px] font-semibold text-sky-500 hover:text-sky-700"
                      onClick={async () => {
                        const res = await fetch(`/api/nda-certificates/${a.certificateId}`);
                        if (res.ok) {
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const anchor = document.createElement('a');
                          anchor.href = url;
                          anchor.download = `NDA-Certificate-${a.certificateId}.pdf`;
                          document.body.appendChild(anchor);
                          anchor.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(anchor);
                        }
                      }}>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 11 — HEATMAP (borderless wrapper)
        ═══════════════════════════════════════════════════ */}
        {analytics.heatmapByPage && Object.keys(analytics.heatmapByPage).length > 0 && (
          <div className="py-5 border-b border-slate-100">
            <div className="flex items-center gap-1.5 mb-5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Heatmap</p>
            </div>
            <DocumentHeatmap
              pageNumber={heatmapPage}
              totalPages={doc.numPages}
              heatmapByPage={analytics.heatmapByPage}
              onPageChange={setHeatmapPage}
            />
          </div>
        )}

       

      </>
    )}
  </div>
)}


{activeTab === 'signatures' && (
  <div className="space-y-0">
    {sigAnalyticsLoading ? (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    ) : (
      <SignaturesTab analytics={sigAnalytics} docId={String(params.id)} />
    )}
  </div>
)}

{activeTab === 'utilization' && (
  <div className="space-y-6">
    
    {analyticsLoading ? (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-violet-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading usage data...</p>
        </div>
      </div>
    ) : (
      <>
        {/* Recent Usage Table */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg">Recent Usage (last 30 days)</h3>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Team Member
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
              Links Created ▲
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
              Spaces Added To
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">
              Visits
            </div>
          </div>

          {/* Table Row - Real Data */}
          {analytics && (analytics.shares > 0 || analytics.totalViews > 0) ? (
            <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {analytics.documentInfo?.filename?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>

<p className="text-xs text-slate-500">
  {analytics?.documentInfo?.ownerEmail || 
   analytics?.ownerEmail || 
   doc?.ownerEmail || 
   'Document owner'}
</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics.shares}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">0</span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {analytics.totalViews}
                </span>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="px-6 py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-900 mb-2">No usage data yet</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Create share links to start tracking document usage
              </p>
              <Button 
                onClick={handleCreateLink}
                className="bg-gradient-to-r from-violet-600 to-blue-600"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Create First Link
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats Cards - Real Data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-600">Active Links</h4>
              <LinkIcon className="h-4 w-4 text-violet-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {analytics?.shares || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Links created this month
            </p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-600">Total Visits</h4>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {analytics?.totalViews || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Across all links
            </p>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-slate-600">Avg. Time</h4>
              <Clock className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {analytics?.avgTimePerSession || '0m 0s'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Per viewing session
            </p>
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
{/* Create Share Link Drawer — Redesigned */}
<Drawer open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}>
  <div className="h-full flex flex-col bg-[#fafafa]">

    {/* ── Header ── */}
    <div className="bg-white border-b px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
<h2 className="text-lg font-bold text-slate-900 leading-tight">
  {editMode === 'edit' ? 'Edit Link' : editMode === 'duplicate' ? 'Duplicate Link' : 'Share Document'}
</h2>
<p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">
  {doc?.filename}
</p>
          </div>
        </div>
       <div className="flex items-center gap-2">
          <button
           onClick={async () => {
  if (!params.id) return;
  if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
    if (!shareSettings.recipientEmails.includes(recipientInput)) {
      shareSettings.recipientEmails.push(recipientInput);
      setRecipientInput('');
    }
  }
  try {
    // ── EDIT MODE: PATCH existing link ──
    if (editMode === 'edit' && editingLink?.shareId) {
      const res = await fetch(`/api/documents/${params.id}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shareId: editingLink.shareId,
          requireEmail: shareSettings.requireEmail,
          allowDownload: shareSettings.allowDownload,
          allowPrint: shareSettings.allowPrint,
          notifyOnView: true,
          password: shareSettings.password || null,
          expiresIn: shareSettings.expiresIn === 0 ? 'never' : shareSettings.expiresIn.toString(),
          enableWatermark: shareSettings.enableWatermark,
          watermarkText: shareSettings.watermarkText || null,
          watermarkPosition: shareSettings.watermarkPosition,
          requireNDA: shareSettings.requireNDA,
          ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId,
          customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null,
          allowForwarding: shareSettings.allowForwarding,
          notifyOnDownload: shareSettings.notifyOnDownload,
          downloadLimit: shareSettings.downloadLimit || null,
          viewLimit: shareSettings.viewLimit || null,
          selfDestruct: shareSettings.selfDestruct,
          customMessage: shareSettings.customMessage || null,
          sharedByName: shareSettings.sharedByName || null,
          logoUrl: shareSettings.logoUrl || null,
          linkType: shareSettings.linkType,
        }),
      });

      if (res.ok) {
        toast.success('Link updated successfully!');
        setShowCreateLinkDialog(false);
        setEditMode('create');
        setEditingLink(null);
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update link');
      }
      return;
    }

    // ── CREATE / DUPLICATE MODE: POST new link ──
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
        recipientEmails: shareSettings.recipientEmails,
        recipientNames: shareSettings.recipientNames || [],
        customMessage: shareSettings.customMessage || null,
        sendEmailNotification: shareSettings.sendEmailNotification,
        notifyOnView: true,
        allowPrint: shareSettings.allowPrint,
        trackDetailedAnalytics: true,
        enableWatermark: shareSettings.enableWatermark,
        watermarkText: shareSettings.watermarkText || null,
        watermarkPosition: shareSettings.watermarkPosition,
        requireNDA: shareSettings.requireNDA,
        ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId,
        customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null,
        allowForwarding: shareSettings.allowForwarding,
        notifyOnDownload: shareSettings.notifyOnDownload,
        downloadLimit: shareSettings.downloadLimit || null,
        viewLimit: shareSettings.viewLimit || null,
        selfDestruct: shareSettings.selfDestruct,
        availableFrom: shareSettings.availableFrom || null,
        linkType: shareSettings.linkType,
        sharedByName: shareSettings.sharedByName || null,
        logoUrl: shareSettings.logoUrl || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        let shareLink = '';
        let recipientCount = 0;
        let emailsWereSent = false;

        if (data.shareLink) {
          shareLink = data.shareLink;
        } else if (data.shareLinks && data.shareLinks.length > 0) {
          shareLink = data.shareLinks[0].shareLink;
          recipientCount = data.shareLinks.length;
          emailsWereSent = recipientCount > 0 && shareSettings.sendEmailNotification;
        }

        setShowCreateLinkDialog(false);
        setEditMode('create');
        setEditingLink(null);
        navigator.clipboard.writeText(shareLink).catch(() => {});

        toast.success(
          emailsWereSent
            ? `Link created & sent to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}!`
            : editMode === 'duplicate' ? 'Link duplicated!' : 'Share link created!',
          {
            description: (
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <code className="text-xs text-slate-600 truncate flex-1 max-w-[200px]">{shareLink}</code>
                  <button onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Copied!', { duration: 1500 }); }} className="text-xs font-semibold text-purple-600 hover:text-purple-700">Copy</button>
                </div>
                <button onClick={() => window.open(shareLink, '_blank')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Open Link</button>
              </div>
            ),
            duration: 8000,
            icon: '🔗',
          }
        );

        setShareSettings({
          requireEmail: true, allowDownload: false, expiresIn: 7, password: '',
          recipientEmails: [], recipientNames: [], sendEmailNotification: true,
          customMessage: '', requireNDA: false, allowedEmails: [], enableWatermark: false,
          watermarkText: '', watermarkPosition: 'bottom', ndaText: '', ndaTemplateId: '',
          customNdaText: '', useCustomNda: false, allowPrint: true, allowForwarding: true,
          notifyOnDownload: false, downloadLimit: undefined, viewLimit: undefined,
          selfDestruct: false, availableFrom: '', linkType: 'public', sharedByName: '', logoUrl: ''
        });
        setLogoFile(null); setLogoPreview(null); setRecipientInput('');
        setBulkRecipientInput(''); setCsvPreview([]); setShowAllRecipients(false);
      }
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to create share link');
    }
  } catch {
    toast.error('Failed. Please try again.');
  }
}}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }}
          >
{editMode === 'edit'
  ? 'Save Changes →'
  : shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification
  ? `Send to ${shareSettings.recipientEmails.length} →`
  : editMode === 'duplicate'
  ? 'Duplicate Link →'
  : 'Generate Link →'}
          </button>
          <button
            onClick={() => {
  setShowCreateLinkDialog(false);
  setEditMode('create');
  setEditingLink(null);
}}
            className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      
    </div>

    {/* ── Scrollable Content ── */}
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

        {/* ── SECTION 1: Recipients (most important) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Recipients</h3>
            </div>
            {shareSettings.recipientEmails.length > 0 && (
              <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                {shareSettings.recipientEmails.length} added
              </span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-500">Leave empty for "anyone with the link"</p>

            {/* Input method tabs */}
            <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
              {(['single', 'bulk', 'csv'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setRecipientInputMethod(method)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    recipientInputMethod === method
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {method === 'single' ? 'Add One' : method === 'bulk' ? 'Paste List' : 'CSV'}
                </button>
              ))}
            </div>

            {/* Single email + name */}
{recipientInputMethod === 'single' && (
  <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="text"
        value={recipientNameInput}
        onChange={(e) => setRecipientNameInput(e.target.value)}
        placeholder="John Doe"
        className="text-sm"
      />
      <Input
        type="email"
        value={recipientInput}
        onChange={(e) => setRecipientInput(e.target.value)}
        placeholder="investor@vc.com"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddRecipient(); } }}
        className="text-sm"
      />
    </div>
    <Button type="button" onClick={handleAddRecipient} variant="outline" size="sm" className="w-full">
      Add Recipient
    </Button>
  </div>
)}

            {/* Bulk paste */}
            {recipientInputMethod === 'bulk' && (
              <div className="space-y-2">
                <Textarea
                  value={bulkRecipientInput}
                  onChange={(e) => setBulkRecipientInput(e.target.value)}
                  placeholder={"john@sequoia.com\nsarah@a16z.com\nmike@kleiner.com"}
                  rows={5}
                  className="font-mono text-xs"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {bulkRecipientInput ? `${bulkRecipientInput.split(/[\n,]+/).filter(e => e.trim()).length} detected` : 'Paste emails above'}
                  </span>
                  <Button onClick={handleBulkAddRecipients} disabled={!bulkRecipientInput.trim()} size="sm" className="gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Add All
                  </Button>
                </div>
              </div>
            )}

            {/* CSV */}
            {recipientInputMethod === 'csv' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleAttachFromDrive} className="h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-sm font-medium text-slate-600">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z"/></svg>
                    <span className="text-xs">Google Drive</span>
                  </button>
                  <button onClick={() => document.getElementById('csv-local-upload')?.click()} className="h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium text-slate-600">
                    <Upload className="h-5 w-5 text-slate-400" />
                    <span className="text-xs">Local CSV</span>
                  </button>
                  <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" id="csv-local-upload" />
                </div>
                {csvPreview.length > 0 && (
                  <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{csvPreview.length} contacts found</span>
                      <Button size="sm" onClick={handleConfirmCSV} className="h-7 text-xs gap-1"><Check className="h-3 w-3" /> Import</Button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {csvPreview.slice(0, 8).map((c, i) => (
                        <div key={i} className="text-xs bg-white rounded px-2 py-1 border truncate">
                          <span className="font-medium">{c.email}</span>
                          {c.name && <span className="text-slate-400 ml-1.5">· {c.name}</span>}
                        </div>
                      ))}
                      {csvPreview.length > 8 && <p className="text-xs text-slate-400 text-center">+{csvPreview.length - 8} more</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Added recipients list */}
            {shareSettings.recipientEmails.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-violet-50 border border-violet-200 rounded-xl">
                  <span className="text-xs font-semibold text-violet-800">{shareSettings.recipientEmails.length} recipient{shareSettings.recipientEmails.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setShowAllRecipients(!showAllRecipients)} className="text-xs text-violet-600 hover:underline">{showAllRecipients ? 'Collapse' : 'View all'}</button>
                    <span className="text-violet-300">·</span>
                    <button onClick={() => { if (confirm('Remove all?')) setShareSettings({ ...shareSettings, recipientEmails: [] }); }} className="text-xs text-red-500 hover:underline">Clear</button>
                  </div>
                </div>
                {showAllRecipients && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border rounded-xl p-2 bg-slate-50">
                    {shareSettings.recipientEmails.map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border group hover:border-violet-300 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-[10px] font-bold">{email.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-slate-700 truncate">{email}</span>
                        </div>
                        <button onClick={() => setShareSettings({ ...shareSettings, recipientEmails: shareSettings.recipientEmails.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-1">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Send email toggle */}
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-violet-300 transition-colors">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="text-xs font-medium text-slate-800">Send email notification</div>
                      <div className="text-xs text-slate-400">Email recipients with the access link</div>
                    </div>
                  </div>
                  <Switch checked={shareSettings.sendEmailNotification} onCheckedChange={(c) => setShareSettings({ ...shareSettings, sendEmailNotification: c })} />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Essential Controls (expiry + email gate) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Access Control</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Require email */}
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Require email to view</div>
                <div className="text-xs text-slate-400 mt-0.5">Viewer must enter email before accessing</div>
              </div>
              <Switch checked={shareSettings.requireEmail} onCheckedChange={(c) => setShareSettings({ ...shareSettings, requireEmail: c })} />
            </label>
            {/* Expiry */}
            <div className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="text-sm font-medium text-slate-800">Link expires</div>
                <div className="text-xs text-slate-400 mt-0.5">Auto-disable after selected time</div>
              </div>
              <select
                value={shareSettings.expiresIn}
                onChange={(e) => setShareSettings({ ...shareSettings, expiresIn: parseInt(e.target.value) })}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={0}>Never</option>
              </select>
            </div>
            {/* Allow download */}
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Allow download</div>
                <div className="text-xs text-slate-400 mt-0.5">Viewer can save a copy of the PDF</div>
              </div>
              <Switch checked={shareSettings.allowDownload} onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowDownload: c })} />
            </label>
            {/* Allow print */}
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Allow printing</div>
                <div className="text-xs text-slate-400 mt-0.5">Viewer can print the document</div>
              </div>
              <Switch checked={shareSettings.allowPrint} onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowPrint: c })} />
            </label>
          </div>
        </div>

        {/* ── SECTION 3: Personal message ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Personal Message <span className="text-slate-400 font-normal">(optional)</span></h3>
          </div>
          <div className="p-5">
            <Textarea
              value={shareSettings.customMessage}
              onChange={(e) => setShareSettings({ ...shareSettings, customMessage: e.target.value })}
              placeholder="Hi, please review the attached document and let me know your thoughts..."
              rows={3}
              className="text-sm resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-400 mt-1.5 text-right">{shareSettings.customMessage.length}/500</p>
          </div>
        </div>

        {/* ── SECTION 4: Branding ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Branding <span className="text-slate-400 font-normal">(optional)</span></h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Your name or company</label>
              <Input
                value={shareSettings.sharedByName || ''}
                onChange={(e) => setShareSettings({ ...shareSettings, sharedByName: e.target.value })}
                placeholder="Acme Corp"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Company logo</label>
              {logoPreview || shareSettings.logoUrl ? (
                <div className="space-y-2">
                  <div className="h-24 rounded-xl border-2 border-violet-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    <img src={logoPreview || shareSettings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload-input')?.click()} className="flex-1 text-xs" disabled={isUploadingLogo}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Change
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo} className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" disabled={isUploadingLogo}>
                      <X className="h-3.5 w-3.5 mr-1.5" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => document.getElementById('logo-upload-input')?.click()}
                  disabled={isUploadingLogo}
                  className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-400 hover:bg-violet-50 transition-colors disabled:opacity-50"
                >
                  {isUploadingLogo ? (
                    <div className="flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 text-violet-500 animate-spin" /><span className="text-xs text-slate-500">Uploading...</span></div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5"><ImageIcon className="h-6 w-6 text-slate-300" /><span className="text-xs font-medium text-slate-500">Click to upload logo</span><span className="text-xs text-slate-400">PNG, JPG, SVG · Max 2MB</span></div>
                  )}
                </button>
              )}
              <input type="file" id="logo-upload-input" accept="image/*" onChange={handleLogoFileSelect} className="hidden" />
            </div>
          </div>
        </div>

        {/* ── SECTION 5: Advanced (collapsed by default feel via grouping) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            <h3 className="font-semibold text-slate-700 text-sm">Advanced Settings</h3>
            <span className="ml-auto text-xs text-slate-400">optional</span>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Password */}
            <div className="px-5 py-3.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Password protect</label>
              <Input
                type="password"
                value={shareSettings.password}
                onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                placeholder="Leave empty for no password"
                className="text-sm"
              />
            </div>
            {/* View limit */}
            <div className="px-5 py-3.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">View limit</label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={shareSettings.viewLimit || ''}
                  onChange={(e) => setShareSettings({ ...shareSettings, viewLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-32 text-sm"
                />
                <span className="text-xs text-slate-400">Set 1 for one-time access</span>
              </div>
            </div>
            {/* Self-destruct */}
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Self-destruct after first view</div>
                <div className="text-xs text-slate-400 mt-0.5">Link deactivates after opening once</div>
              </div>
              <Switch checked={shareSettings.selfDestruct} onCheckedChange={(c) => setShareSettings({ ...shareSettings, selfDestruct: c })} />
            </label>
            {/* Allow forwarding */}
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Allow forwarding</div>
                <div className="text-xs text-slate-400 mt-0.5">Recipients can share link with others</div>
              </div>
              <Switch checked={shareSettings.allowForwarding} onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowForwarding: c })} />
            </label>
            {/* Schedule */}
            <div className="px-5 py-3.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Available from (schedule)</label>
              <Input
                type="datetime-local"
                value={shareSettings.availableFrom || ''}
                onChange={(e) => setShareSettings({ ...shareSettings, availableFrom: e.target.value })}
                className="text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Link inactive until this date/time</p>
            </div>
          </div>
        </div>

        {/* ── SECTION 6: Premium (NDA + Watermark) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-slate-700 text-sm">Premium Features</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Premium</span>
          </div>
          <div className="divide-y divide-slate-100">
            {/* NDA */}
            <div className="px-5 py-4 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-800">Require NDA acceptance</div>
                  <div className="text-xs text-slate-400 mt-0.5">Viewer must sign terms before viewing</div>
                </div>
                <Switch checked={shareSettings.requireNDA} onCheckedChange={(c) => setShareSettings({ ...shareSettings, requireNDA: c })} />
              </label>
              {shareSettings.requireNDA && (
                <div className="space-y-3 pt-1">
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
                    <button onClick={() => setShareSettings({ ...shareSettings, useCustomNda: false })} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!shareSettings.useCustomNda ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Use Template</button>
                    <button onClick={() => setShareSettings({ ...shareSettings, useCustomNda: true })} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${shareSettings.useCustomNda ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Custom Text</button>
                  </div>
                  {!shareSettings.useCustomNda ? (
                    loadingTemplates ? <div className="flex justify-center p-3"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div> : (
                      <select value={shareSettings.ndaTemplateId} onChange={(e) => setShareSettings({ ...shareSettings, ndaTemplateId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                        <option value="">Select a template...</option>
                        {ndaTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (Default)' : ''}</option>)}
                      </select>
                    )
                  ) : (
                    <Textarea value={shareSettings.customNdaText} onChange={(e) => setShareSettings({ ...shareSettings, customNdaText: e.target.value })} placeholder="Enter NDA text..." rows={6} className="text-xs font-mono" maxLength={2000} />
                  )}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-800">✅ Acceptance is timestamped and logged for legal records.</p>
                  </div>
                </div>
              )}
            </div>
            {/* Watermark */}
            <div className="px-5 py-4 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-800">Watermark pages</div>
                  <div className="text-xs text-slate-400 mt-0.5">Stamp viewer's email on each page</div>
                </div>
                <Switch checked={shareSettings.enableWatermark} onCheckedChange={(c) => setShareSettings({ ...shareSettings, enableWatermark: c })} />
              </label>
              {shareSettings.enableWatermark && (
                <div className="space-y-2 pt-1">
                  <Input value={shareSettings.watermarkText} onChange={(e) => setShareSettings({ ...shareSettings, watermarkText: e.target.value })} placeholder="Leave empty to use viewer's email" className="text-sm" />
                  <select value={shareSettings.watermarkPosition} onChange={(e) => setShareSettings({ ...shareSettings, watermarkPosition: e.target.value as any })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="diagonal">Diagonal</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
        

        {/* Tracking notice */}
        <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">Views, time spent, and page engagement are automatically tracked and available in your analytics dashboard.</p>
        </div>

        {/* Bottom padding */}
        <div className="h-4" />

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

const data = await res.json();

if (res.ok) {
  if (data.version === 1) {
    // New document
    toast.success('Imported from Google Drive!', {
      description: `${data.filename} has been added to your documents`
    });
  } else {
    // New version
    toast.success('New version created!', {
      description: `${data.filename} updated to Version ${data.version}`
    });
  }
  
  setShowDriveFilesDialog(false);
  
  // Refresh documents list
  router.refresh();
} else {
  toast.error('Import failed', {
    description: data.error
  });
}
                    
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
 
{/* Edit Link Drawer - DocSend Style */}
<Drawer open={showEditLinkDrawer} onOpenChange={setShowEditLinkDrawer}>
  <div className="h-full flex flex-col bg-[#fafafa]">
    {/* Header */}
    <div className="bg-white border-b px-6 py-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md">
            <LinkIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Edit Link</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingLink?.recipientEmail || 'Public link'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowEditLinkDrawer(false)}
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        
        {/* Link Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Link Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50">
              <LinkIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
              <span className="text-xs font-mono text-slate-600 truncate flex-1">
                {editingLink?.link?.replace('https://', '').replace('http://', '')}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(editingLink?.link || '');
                  toast.success('Link copied!');
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                Copy
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="font-medium text-slate-900">{editingLink?.createdAgo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total visits</p>
                <p className="font-medium text-slate-900">{editingLink?.visits}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Time spent</p>
                <p className="font-medium text-slate-900">{editingLink?.totalTime}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Completion</p>
                <p className="font-medium text-slate-900">{editingLink?.completion}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Access Control</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Link active</div>
                <div className="text-xs text-slate-400 mt-0.5">Recipients can open this link</div>
              </div>
              <Switch 
                checked={editingLink?.enabled} 
                onCheckedChange={async (checked) => {
                  try {
                    const res = await fetch(`/api/documents/${params.id}/share`, {
                      method: 'PATCH',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        shareId: editingLink?.shareId,
                        active: checked,
                      }),
                    });
                    
                    if (res.ok) {
                      toast.success(checked ? 'Link enabled' : 'Link disabled');
                      setEditingLink({ ...editingLink, enabled: checked });
                      window.location.reload(); // Refresh to update the list
                    } else {
                      toast.error('Failed to update link');
                    }
                  } catch (error) {
                    toast.error('Network error');
                  }
                }}
              />
            </label>
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Allow download</div>
                <div className="text-xs text-slate-400 mt-0.5">Viewer can save a copy</div>
              </div>
              <Switch defaultChecked />
            </label>
            <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div>
                <div className="text-sm font-medium text-slate-800">Allow printing</div>
                <div className="text-xs text-slate-400 mt-0.5">Viewer can print the document</div>
              </div>
              <Switch defaultChecked />
            </label>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border-2 border-red-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50">
            <h3 className="font-semibold text-red-900 text-sm">Danger Zone</h3>
          </div>
          <div className="p-5 space-y-3">
            <Button
  variant="outline"
  onClick={async () => {
    if (!confirm('Create a duplicate of this link with the same settings?')) return;
    
    try {
      const res = await fetch(`/api/documents/${params.id}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  // Basic settings
  requireEmail: editingLink?.settings?.requireEmail ?? true,
  allowDownload: editingLink?.settings?.allowDownload ?? true,
  allowPrint: editingLink?.settings?.allowPrint ?? true,
  notifyOnView: editingLink?.settings?.notifyOnView ?? true,
  
  // Recipients
  recipientEmails: editingLink?.recipientEmail ? [editingLink.recipientEmail] : [],
  recipientNames: editingLink?.recipientName ? [editingLink.recipientName + ' (Copy)'] : [],
  allowedEmails: editingLink?.recipientEmail ? [editingLink.recipientEmail] : [],
  
  // Security
  password: null, // Don't copy password for security
  expiresIn: '7', // Default 7 days for duplicate
  
  // Limits
  maxViews: editingLink?.settings?.maxViews ?? null,
  viewLimit: editingLink?.settings?.viewLimit ?? null,
  downloadLimit: editingLink?.settings?.downloadLimit ?? null,
  
  // Behavior
  allowForwarding: editingLink?.settings?.allowForwarding ?? true,
  notifyOnDownload: editingLink?.settings?.notifyOnDownload ?? false,
  selfDestruct: editingLink?.settings?.selfDestruct ?? false,
  availableFrom: null, // Don't copy scheduled start time
  linkType: editingLink?.settings?.linkType ?? 'email-gated',
  
  // Branding & messaging
  customMessage: editingLink?.settings?.customMessage ?? null,
  sharedByName: editingLink?.settings?.sharedByName ?? null,
  logoUrl: editingLink?.settings?.logoUrl ?? null,
  
  // Watermark
  enableWatermark: editingLink?.settings?.enableWatermark ?? false,
  watermarkText: editingLink?.settings?.watermarkText ?? null,
  watermarkPosition: editingLink?.settings?.watermarkPosition ?? 'bottom',
  
  // NDA
  requireNDA: editingLink?.settings?.requireNDA ?? false,
  ndaText: editingLink?.settings?.ndaText ?? null,
  ndaTemplateId: editingLink?.settings?.ndaTemplateId ?? null,
  customNdaText: null, // Don't copy custom NDA text
  
  // Analytics
  trackDetailedAnalytics: editingLink?.settings?.trackDetailedAnalytics ?? true,
  
  // Email notification
  sendEmailNotification: false, // Never auto-send duplicates
}),
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success('Link duplicated successfully!', {
          description: 'A new link has been created with the same settings'
        });
        setShowEditLinkDrawer(false);
        window.location.reload();
      } else {
        toast.error('Failed to duplicate link', {
          description: data.error || 'Please try again'
        });
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Could not connect to server'
      });
    }
  }}
  className="w-full justify-start gap-2"
>
  <Copy className="h-4 w-4" />
  Duplicate this link
</Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm(`Delete link for ${editingLink?.recipientEmail || 'this recipient'}?`)) return;
                try {
                  const res = await fetch(
                    `/api/documents/${params.id}/share?shareId=${editingLink?.shareId}`,
                    { method: 'DELETE', credentials: 'include' }
                  );
                  
                  if (res.ok) {
                    toast.success('Link deleted');
                    setShowEditLinkDrawer(false);
                    window.location.reload();
                  } else {
                    toast.error('Failed to delete link');
                  }
                } catch (error) {
                  toast.error('Network error');
                }
              }}
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="h-4 w-4" />
              Delete this link permanently
            </Button>
          </div>
        </div>

      </div>
    </div>
  </div>
</Drawer>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ActivityTab — DocSend-style flat layout, no cards, dividers only
// ══════════════════════════════════════════════════════════════
function ActivityTab({
  analytics,
  doc,
  token,
  onCreateLink,
  onEditLink,
  onOpenShareDrawer,
}: {
  analytics: any;
  doc: any;
  token: string;
  onCreateLink: () => void;
  onEditLink: (link: any) => void;
  onOpenShareDrawer: (link: any, mode: 'edit' | 'duplicate', settings: any) => void;
}) {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [hoveredPage, setHoveredPage] = useState<{ visitKey: string; page: number } | null>(null);
  const [shareLinks, setShareLinks] = React.useState<any[]>([]);

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds < 0) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  React.useEffect(() => {
    fetch(`/api/documents/${doc._id}/share`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.shares) {
          setShareLinks(data.shares.map((s: any) => ({
            shareId: s.id,
            name: doc.filename,
            recipientEmail: s.recipientEmail,
            recipientName: s.recipientName,
            createdAgo: formatAgo(new Date(s.createdAt)),
            link: s.shareLink,
            visits: s.tracking?.views || 0,
            totalTime: formatTime(s.tracking?.totalTimeSpent || 0),
            lastViewed: s.tracking?.lastViewedAt ? formatAgo(new Date(s.tracking.lastViewedAt)) : null,
            completion: `${Math.round((s.tracking?.views || 0) / Math.max(1, doc.numPages) * 100)}%`,
            enabled: s.active && !s.expired,
            shareToken: s.shareToken,
            settings: {
              requireEmail: s.settings?.requireEmail ?? true,
              allowDownload: s.settings?.allowDownload ?? false,
              allowPrint: s.settings?.allowPrint ?? true,
              allowForwarding: s.settings?.allowForwarding ?? true,
              notifyOnDownload: s.settings?.notifyOnDownload ?? false,
              selfDestruct: s.settings?.selfDestruct ?? false,
              enableWatermark: s.settings?.enableWatermark ?? false,
              watermarkText: s.settings?.watermarkText ?? '',
              watermarkPosition: s.settings?.watermarkPosition ?? 'bottom',
              requireNDA: s.settings?.requireNDA ?? false,
              ndaTemplateId: s.settings?.ndaTemplateId ?? '',
              customMessage: s.settings?.customMessage ?? '',
              sharedByName: s.settings?.sharedByName ?? '',
              logoUrl: s.settings?.logoUrl ?? '',
              viewLimit: s.settings?.viewLimit,
              downloadLimit: s.settings?.downloadLimit,
              linkType: s.settings?.linkType ?? 'public',
              password: '',
              expiresIn: s.settings?.expiresIn ?? 7,
            },
          })));
        }
      })
      .catch(err => console.error('Failed to fetch shares:', err));
  }, [doc._id, doc.filename, doc.numPages]);

  const allLinks = shareLinks;

  const allVisits: any[] = (analytics.recipientPageTracking || []).map((r: any, i: number) => ({
    key: r.recipientEmail || `anon-${i}`,
    email: r.recipientEmail || 'Anonymous',
    senderName: doc.filename,
    timeAgo: r.firstOpened ? formatAgo(new Date(r.firstOpened)) : 'Unknown',
    totalTime: r.totalTimeOnDoc || '0m 0s',
    totalTimeSeconds: r.totalTimeSeconds || 0,
    location: analytics.locations?.[0]?.country || 'Unknown',
    city: analytics.locations?.[0]?.topCities?.[0] || '',
    country: analytics.locations?.[0]?.country || 'Unknown',
    pageData: r.pageData || [],
    bounced: r.bounced || false,
    firstOpened: r.firstOpened || null,
  }));

  const getMaxTime = (pageData: any[]) =>
    Math.max(...pageData.map((p: any) => p.timeSpent || 0), 1);

  return (
    <div className="space-y-0">

      {/* ══ ALL VISITS SECTION ══ */}
      <div>
        {/* Section header — just a label + count, no card */}
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">All Visits</h3>
          <span className="text-sm text-slate-400">{allVisits.length} {allVisits.length === 1 ? 'visit' : 'visits'}</span>
        </div>

        {allVisits.length === 0 ? (
          <div className="py-12 text-center border-b border-slate-100">
            <p className="text-sm text-slate-400">No visits yet. Once someone opens your link, they'll appear here.</p>
          </div>
        ) : (
          <div>
            {allVisits.map((visit) => {
              const isExpanded = expandedVisit === visit.key;
              const maxTime = getMaxTime(visit.pageData);

              return (
                <div key={visit.key} className="border-b border-slate-100 last:border-b-0">
                  {/* Visit row — flat, no bg */}
                  <div className="py-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {visit.email !== 'Anonymous' ? visit.email.charAt(0).toUpperCase() : '?'}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{visit.email}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{visit.senderName}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">{visit.timeAgo}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        {/* Desktop icon */}
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{visit.city && visit.city !== 'Unknown' ? `${visit.city}, ` : ''}{visit.country}</span>
                      </div>
                    </div>

                    {/* Right side: sender badge area (DocSend shows S badge + name) */}
                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500">S</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">{visit.senderName}</span>
                    </div>

                    {/* Time + status */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {visit.bounced ? (
                        <span className="text-xs font-medium text-red-500">Bounced</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {/* Checkmark circle like DocSend */}
                          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4"/>
                          </svg>
                          <span className="text-sm font-bold text-slate-800 tabular-nums">{visit.totalTime}</span>
                        </div>
                      )}

                      {/* Expand chevron */}
                      <button
                        onClick={() => setExpandedVisit(isExpanded ? null : visit.key)}
                        className="h-7 w-7 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                      >
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4" />
                          : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded per-page bars */}
                  {isExpanded && (
                    <div className="pb-6 pt-2">
                      <div className="relative" style={{ paddingLeft: '52px', paddingBottom: '28px' }}>
                        {/* Y-axis labels */}
                        {(() => {
                          const formatYLabel = (secs: number) => {
                            const m = Math.floor(secs / 60);
                            const s = secs % 60;
                            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                          };
                          return [maxTime, Math.round(maxTime * 0.5), 0].map((val, i) => (
                            <div key={i} className="absolute text-right text-[10px] text-slate-400 font-mono"
                              style={{ left: 0, top: `${(i / 2) * 100}%`, width: '44px', transform: 'translateY(-50%)' }}>
                              {formatYLabel(val)}
                            </div>
                          ));
                        })()}

                        {/* Gridlines */}
                        <div className="absolute inset-0" style={{ paddingLeft: '52px', paddingBottom: '28px' }}>
                          {[0, 0.5, 1].map((frac, i) => (
                            <div key={i} className="absolute left-0 right-0 border-t border-slate-100"
                              style={{ top: `${frac * 100}%` }} />
                          ))}
                        </div>

                        {/* Bars */}
                        <div className="relative flex items-end gap-2" style={{ height: '160px' }}>
                          {visit.pageData.map((page: any) => {
                            const heightPct = maxTime > 0 ? (page.timeSpent / maxTime) * 100 : 0;
                            const isHovered = hoveredPage?.visitKey === visit.key && hoveredPage?.page === page.page;

                            return (
                              <div key={page.page} className="flex-1 flex flex-col items-center justify-end h-full relative"
                                onMouseEnter={() => setHoveredPage({ visitKey: visit.key, page: page.page })}
                                onMouseLeave={() => setHoveredPage(null)}>

                                {/* Tooltip */}
                                {isHovered && (
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                    <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden" style={{ width: '200px' }}>
                                      <div className="relative bg-white" style={{ height: '130px' }}>
                                        <iframe
                                          src={`/api/documents/${doc._id}/page?page=${page.page}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                          className="w-full h-full border-0 pointer-events-none"
                                          title={`Page ${page.page} preview`}
                                        />
                                      </div>
                                      <div className="flex items-center justify-between px-3 py-2">
                                        <div>
                                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">PAGE</p>
                                          <p className="text-sm font-bold text-white">{page.page} / {visit.pageData.length}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">TIME SPENT</p>
                                          <p className="text-sm font-bold text-white">
                                            {String(Math.floor(page.timeSpent / 60)).padStart(2,'0')}:{String(page.timeSpent % 60).padStart(2,'0')}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="h-1 bg-slate-700">
                                        <div className="h-full bg-blue-400 transition-all"
                                          style={{ width: `${Math.min((page.timeSpent / maxTime) * 100, 100)}%` }} />
                                      </div>
                                    </div>
                                    <div className="flex justify-center">
                                      <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5" />
                                    </div>
                                  </div>
                                )}

                                {/* Bar */}
                                <div
                                  className="w-full rounded-t transition-all cursor-pointer"
                                  style={{
                                    height: `${Math.max(heightPct, page.timeSpent > 0 ? 2 : 0)}%`,
                                    background: isHovered
                                      ? '#7c3aed'
                                      : page.skipped ? '#e2e8f0'
                                      : '#a855f7',
                                    minHeight: page.timeSpent > 0 ? '4px' : '0',
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* X-axis page numbers */}
                        <div className="flex gap-2 pt-2">
                          {visit.pageData.map((page: any) => (
                            <div key={page.page} className="flex-1 text-center text-xs text-slate-400">
                              {page.page}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ SPACER ══ */}
      <div className="pt-8" />

      {/* ══ ALL LINKS SECTION ══ */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">All Links</h3>
          <button
            onClick={onCreateLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
          >
            <LinkIcon className="h-3 w-3" /> New Link
          </button>
        </div>

        {/* Column headers — flat label row */}
        <div className="grid items-center py-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide"
          style={{ gridTemplateColumns: '1fr 2fr auto auto auto' }}>
          <span>NAME</span>
          <span>LINK</span>
          <span className="text-center">ACTIVE</span>
          <span className="text-right mr-10">ACTIVITY</span>
          <span />
        </div>

        {/* Link rows */}
        {allLinks.length === 0 ? (
          <div className="py-12 text-center border-b border-slate-100">
            <p className="text-sm text-slate-400">No links yet.</p>
          </div>
        ) : (
          allLinks.map((lnk, i) => (
            <div
              key={i}
              className="grid items-center py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors group"
              style={{ gridTemplateColumns: '1fr 2fr auto auto auto' }}
            >
             {/* NAME */}
<div className="flex items-center gap-2 pr-4">
  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
    <span className="text-white text-xs font-bold">
      {(lnk.recipientName || lnk.recipientEmail || 'P').charAt(0).toUpperCase()}
    </span>
  </div>
  <div className="min-w-0">
    <p className="text-sm font-semibold text-slate-900 truncate">
      {lnk.recipientName}
    </p>
    {lnk.recipientEmail && (
      <p className="text-xs text-slate-400 truncate">{lnk.recipientEmail}</p>
    )}
    {!lnk.recipientEmail && (
      <p className="text-xs text-slate-400">{lnk.createdAgo}</p>
    )}
  </div>
</div>
              {/* LINK */}
              <div className="flex items-center gap-2 pr-4 min-w-0">
                {/* Yellow/orange circle like DocSend */}
                <div className="h-5 w-5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-xs text-slate-600 font-mono truncate flex-1">
                  {lnk.link.replace('https://', '').replace('http://', '')}
                </span>
                <button
                  onClick={() => { navigator.clipboard.writeText(lnk.link); toast.success('Copied!', { duration: 2000 }); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-slate-400 hover:text-violet-600"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* TOGGLE */}
              <div className="flex justify-center">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/documents/${doc._id}/share`, {
                        method: 'PATCH',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shareId: lnk.shareId, active: !lnk.enabled }),
                      });
                      if (res.ok) {
                        toast.success(lnk.enabled ? 'Link disabled' : 'Link enabled');
                        window.location.reload();
                      } else {
                        toast.error('Failed to update link');
                      }
                    } catch { toast.error('Network error'); }
                  }}
                  className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors"
                  style={{ background: lnk.enabled ? '#7c3aed' : '#e2e8f0' }}
                >
                  <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${lnk.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* ACTIVITY */}
              <div className="flex items-center justify-end mr-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 hover:text-violet-600 transition-colors">
                      <span className="text-sm font-bold text-slate-900">{lnk.visits}</span>
                      <span className="text-xs text-slate-400">{lnk.visits === 1 ? 'visit' : 'visits'}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white p-3 space-y-2">
                    {[
                      ['Total visits', lnk.visits],
                      ['Time spent', lnk.totalTime || '0m 0s'],
                      ['Last viewed', lnk.lastViewed || 'Never'],
                      ['Completion', lnk.completion || '0%'],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-sm font-bold text-slate-900">{val}</span>
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 3-DOT MENU */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-700">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white">
                    <DropdownMenuItem onClick={() => {
                      onOpenShareDrawer(lnk, 'edit', {
                        requireEmail: lnk.settings.requireEmail,
                        allowDownload: lnk.settings.allowDownload,
                        allowPrint: lnk.settings.allowPrint,
                        allowForwarding: lnk.settings.allowForwarding,
                        notifyOnDownload: lnk.settings.notifyOnDownload,
                        selfDestruct: lnk.settings.selfDestruct,
                        enableWatermark: lnk.settings.enableWatermark,
                        watermarkText: lnk.settings.watermarkText,
                        watermarkPosition: lnk.settings.watermarkPosition,
                        requireNDA: lnk.settings.requireNDA,
                        ndaTemplateId: lnk.settings.ndaTemplateId,
                        customMessage: lnk.settings.customMessage,
                        sharedByName: lnk.settings.sharedByName,
                        logoUrl: lnk.settings.logoUrl,
                        viewLimit: lnk.settings.viewLimit,
                        downloadLimit: lnk.settings.downloadLimit,
                        linkType: lnk.settings.linkType,
                        expiresIn: lnk.settings.expiresIn,
                        password: '',
                        recipientEmails: lnk.recipientEmail ? [lnk.recipientEmail] : [],
                        recipientNames: lnk.recipientName ? [lnk.recipientName] : [],
                        sendEmailNotification: false,
                        allowedEmails: lnk.recipientEmail ? [lnk.recipientEmail] : [],
                        ndaText: '', customNdaText: '', useCustomNda: false, availableFrom: '',
                      });
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit link settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => {
                      onOpenShareDrawer(lnk, 'duplicate', {
                        requireEmail: lnk.settings.requireEmail,
                        allowDownload: lnk.settings.allowDownload,
                        allowPrint: lnk.settings.allowPrint,
                        allowForwarding: lnk.settings.allowForwarding,
                        notifyOnDownload: lnk.settings.notifyOnDownload,
                        selfDestruct: lnk.settings.selfDestruct,
                        enableWatermark: lnk.settings.enableWatermark,
                        watermarkText: lnk.settings.watermarkText,
                        watermarkPosition: lnk.settings.watermarkPosition,
                        requireNDA: lnk.settings.requireNDA,
                        ndaTemplateId: lnk.settings.ndaTemplateId,
                        customMessage: lnk.settings.customMessage,
                        sharedByName: lnk.settings.sharedByName,
                        logoUrl: lnk.settings.logoUrl,
                        viewLimit: lnk.settings.viewLimit,
                        downloadLimit: lnk.settings.downloadLimit,
                        linkType: lnk.settings.linkType,
                        expiresIn: lnk.settings.expiresIn,
                        password: '',
                        recipientEmails: lnk.recipientEmail ? [lnk.recipientEmail] : [],
                        recipientNames: lnk.recipientName ? [lnk.recipientName + ' (Copy)'] : [],
                        sendEmailNotification: false,
                        allowedEmails: lnk.recipientEmail ? [lnk.recipientEmail] : [],
                        ndaText: '', customNdaText: '', useCustomNda: false, availableFrom: '',
                      });
                    }}>
                      <Copy className="mr-2 h-4 w-4" />
                      <span>Duplicate link</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        if (!confirm(`Delete link for ${lnk.recipientName || lnk.recipientEmail || 'this recipient'}?`)) return;
                        try {
                          const res = await fetch(`/api/documents/${doc._id}/share?shareId=${lnk.shareId}`, {
                            method: 'DELETE', credentials: 'include',
                          });
                          if (res.ok) { toast.success('Link deleted'); window.location.reload(); }
                          else toast.error('Failed to delete link');
                        } catch { toast.error('Network error'); }
                      }}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete this link</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}


function SignaturesTab({
  analytics,
  docId,
}: {
  analytics: any;
  docId: string;
}) {
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(null);

  const formatTime = (seconds: number | null): string => {
    if (!seconds || seconds <= 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatAgo = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    signed: { label: 'Signed', color: 'text-green-700', bg: 'bg-green-100' },
    pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100' },
    declined: { label: 'Declined', color: 'text-red-700', bg: 'bg-red-100' },
    awaiting_turn: { label: 'Awaiting Turn', color: 'text-blue-700', bg: 'bg-blue-100' },
    delegated: { label: 'Delegated', color: 'text-purple-700', bg: 'bg-purple-100' },
    cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-100' },
  };

  if (!analytics) {
    return (
      <div className="py-32 text-center border-b border-slate-100">
        <FileSignature className="h-10 w-10 text-slate-200 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">No signature requests yet</h3>
        <p className="text-sm text-slate-400 mb-6">
          Send this document for signature to start tracking
        </p>
      </div>
    );
  }

  const { recipients, summary, funnel, allSigned } = analytics;

  return (
    <div className="space-y-0">

      {/* ── COMPLETION BANNER ── */}
      {allSigned && (
        <div className="py-4 px-4 mb-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
         <p className="text-sm font-semibold text-green-900">
            All recipients have signed! Document is complete.
          </p>
          <a
            href={`/signed/${recipients[0]?.id}`}
            className="ml-auto text-xs font-semibold text-green-700 underline"
          >
            Download signed PDF
          </a>
        </div>
      )}

      {/* ── SUMMARY KPIs ── */}
      <div className="py-5 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Overview
        </p>
        <div className="grid grid-cols-4 gap-0 divide-x divide-slate-100 mb-5">
          {[
            { label: 'Sent', value: summary.total, color: 'text-slate-900' },
            { label: 'Opened', value: summary.viewed, color: 'text-sky-600' },
            { label: 'Signed', value: summary.signed, color: 'text-green-600' },
            { label: 'Declined', value: summary.declined, color: 'text-red-500' },
          ].map((s) => (
            <div key={s.label} className="px-4 first:pl-0">
              <div className={`text-3xl font-black tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Completion bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">Completion</span>
            <span className="text-xs font-bold text-slate-900">{summary.completionRate}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── FUNNEL ── */}
      <div className="py-5 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Signing Funnel
        </p>
        <div className="flex items-end gap-3">
          {funnel.map((step: any, i: number) => (
            <div key={i} className="flex-1">
              <div className="flex items-end gap-1 mb-2" style={{ height: '80px' }}>
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(step.pct, 4)}%`,
                    background:
                      i === 0 ? '#0ea5e9' : i === 1 ? '#a855f7' : '#22c55e',
                    opacity: 0.85,
                  }}
                />
              </div>
              <p className="text-xs font-semibold text-slate-700">{step.label}</p>
              <p className="text-xl font-black text-slate-900">{step.count}</p>
              <p className="text-[11px] text-slate-400">{step.pct}%</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
         
        </div>
        {/* Total combined time across ALL recipients */}
  <div className="mt-4">
    <div className="text-2xl font-black text-violet-600 tabular-nums">
      {formatTime(recipients.reduce((sum: number, r: any) => sum + (r.totalTimeSpentSeconds || 0), 0))}
    </div>
    <div className="text-[11px] text-slate-400 mt-1">Total Time Spent</div>
  </div>
      </div>

      {/* ── PAGE ENGAGEMENT CHARTS (same as DocSend) ── */}
{analytics.pageEngagement && analytics.pageEngagement.length > 0 && (
  <div className="py-5 border-b border-slate-100">
    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">
      Page Engagement — Signers
    </p>
    <DocSendStyleCharts
      documentId={docId}
      pageEngagement={analytics.pageEngagement}
      totalPages={analytics.totalDocPages || analytics.pageEngagement.length}
      locations={[]}
    />
  </div>
)}

      {/* ── PER-RECIPIENT ROWS ── */}
      <div>
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">Recipients</h3>
          <span className="text-sm text-slate-400">{recipients.length} total</span>
        </div>

        {recipients.map((r: any) => {
          const isExpanded = expandedRecipient === r.id;
          const cfg = statusConfig[r.status] || statusConfig['pending'];
          const maxPage = Math.max(...(r.pagesViewed.length ? r.pagesViewed : [1]));

          return (
            <div key={r.id} className="border-b border-slate-100 last:border-b-0">
              {/* Row */}
              <div className="py-4 flex items-center gap-4">
                {/* Avatar with role color */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: r.color || '#9333ea' }}
                >
                  {r.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">{r.name}</span>
                    {r.role && (
                      <span className="text-xs text-slate-400">· {r.role}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{r.email}</p>
                </div>

                {/* Status */}
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>

                {/* Time spent */}
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatTime(r.totalTimeSpentSeconds)}
                  </p>
                  <p className="text-[11px] text-slate-400">reading</p>
                </div>

                {/* Expand */}
                <button
                  onClick={() => setExpandedRecipient(isExpanded ? null : r.id)}
                  className="h-7 w-7 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="pb-6 space-y-5">

                  {/* Timeline dots */}
                  <div className="flex items-center gap-0">
                    {[
                      { label: 'Sent', time: r.sentAt, done: true },
                      { label: 'Opened', time: r.viewedAt, done: !!r.viewedAt },
                      { label: 'Signed', time: r.signedAt, done: !!r.signedAt },
                    ].map((step, i, arr) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              step.done ? 'bg-violet-500' : 'bg-slate-200'
                            }`}
                          >
                            {step.done ? '✓' : i + 1}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold">{step.label}</p>
                          <p className="text-[10px] text-slate-400">{formatAgo(step.time)}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className={`flex-1 h-0.5 mb-5 ${step.done ? 'bg-violet-300' : 'bg-slate-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>

                 
                  {/* Decline reason */}
                  {r.status === 'declined' && r.declineReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 mb-1">Decline Reason:</p>
                      <p className="text-sm text-red-700 italic">"{r.declineReason}"</p>
                      <p className="text-[11px] text-red-500 mt-1">{formatAgo(r.declinedAt)}</p>
                    </div>
                  )}

                  {/* Delegation info */}
                  {r.delegatedTo && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 mb-1">Delegated To:</p>
                      <p className="text-sm text-purple-700">
                        {r.delegatedTo.name} ({r.delegatedTo.email})
                      </p>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Views', value: r.viewCount || 0 },
                      { label: 'Time to Open', value: formatTime(r.timeToOpenSeconds) },
                      { label: 'Time to Sign', value: formatTime(r.timeToSignSeconds) },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-black text-slate-900">{s.value}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// Helper
function formatAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}


