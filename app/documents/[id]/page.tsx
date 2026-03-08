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
import PerformanceTab     from "./components/PerformanceTab";
import UtilizationTab     from "./components/UtilizationTab";
import ShareLinkDrawer    from "./components/ShareLinkDrawer";
import SignatureDialog    from "./components/SignatureDialog";
import PresentModeDrawer  from "./components/PresentModeDrawer";
import PreviewDrawer      from "./components/PreviewDrawer";
import SuccessDialog      from "./components/SuccessDialog";
import DocSendStyleCharts from '@/components/DocSendStyleCharts';
import { EmailAutocomplete } from '@/components/ui/EmailAutocomplete';
import ActivityTab from "./components/ActivityTab";
import SignaturesTab from "./components/SignaturesTab";
import NdaSelector from "./components/NdaSelector";
import SpacesList from "./components/SpacesList";




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
const [spacesCount, setSpacesCount] = useState<number>(0);
const [spacesLoading, setSpacesLoading] = useState(true);
const [confirmDialog, setConfirmDialog] = useState<{
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  danger?: boolean;
}>({ open: false, title: '', message: '', onConfirm: () => {} });
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
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

useEffect(() => {
  fetchDocument();
  fetchAnalytics();
  fetchSignatureAnalytics();
   fetchSpacesCount();
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


const fetchSpacesCount = async () => {
  try {
    const res = await fetch('/api/spaces', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        // Count only spaces where this doc is actually added
        const docSpaces = (data.spaces || []).filter((space: any) =>
          space.documentsCount > 0
        );
        setSpacesCount(data.spaces?.length || 0);
      }
    }
  } catch (error) {
    console.error('Failed to fetch spaces count:', error);
  } finally {
    setSpacesLoading(false);
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
  if (showSignatureDialog && signatureRequest.step === 2 && !pdfUrl) {
    fetchPdfForPreview(previewPage);
  }
}, [showSignatureDialog, signatureRequest.step]);

// Add this useEffect after your other useEffects
useEffect(() => {
  // Sync PDF page when switching views or changing edit page
  if (showPdfView && pdfUrl) {
    // The embed src will update automatically due to currentEditPage in the template
  }
}, [showPdfView, currentEditPage, pdfUrl]);



// Save fixed content



 

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
       toast.error('Failed to fetch analytics data');
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
     toast.error('Failed to export analytics');
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
    toast.error('Please select an image');
    return;
  }
  if (!doc) {
    toast.error('Document not loaded');
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
       toast.success('Thumbnail updated successfully!');
      setShowThumbnailDialog(false);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      await fetchDocument(); // Refresh document data
    } else {
      const error = await res.json();
       toast.error(error.message || 'Failed to update thumbnail');
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
  }, []);

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
      {/* ── MOBILE RIGHT SIDEBAR ── */}
<AnimatePresence>
  {mobileMenuOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/40 z-[60] md:hidden"
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-[300px] bg-white z-[70] md:hidden flex flex-col shadow-2xl"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-7 rounded bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {doc.thumbnail ? (
                <img src={doc.thumbnail} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                {doc.filename}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(doc.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ── DOC INFO SECTION ── */}
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Document Info
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {doc.isTemplate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                  <FileSignature className="h-3 w-3 mr-1" />
                  Template
                </span>
              )}
              {liveViewerCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  {liveViewerCount} viewing live
                </span>
              )}
            </div>

            {/* Owner */}
            {doc?.ownerEmail && (
              <p className="text-xs text-slate-500 mb-3">
                <span className="text-slate-400">Owner: </span>{doc.ownerEmail}
              </p>
            )}

            {/* Notes */}
            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="w-full flex items-start gap-2 p-3 rounded-xl border border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
              >
                <Edit className="h-3.5 w-3.5 text-slate-300 mt-0.5 flex-shrink-0" />
                <span className={`text-xs ${doc.notes ? 'text-slate-600' : 'text-slate-300 italic'}`}>
                  {doc.notes || 'Add a note to this document'}
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full text-xs text-slate-700 border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all bg-white"
                  rows={3}
                  autoFocus
                  maxLength={200}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditingNotes(false); setNotes(doc.notes || ''); }}
                    className="flex-1 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => { await handleSaveNotes(); setMobileMenuOpen(false); }}
                    disabled={isSavingNotes}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SHARE SECTION ── */}
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Share
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { handleOpenLinkDrawer('public'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
              >
                <LinkIcon className="h-4 w-4 flex-shrink-0" />
                Create document link
              </button>
              <button
                onClick={() => { handleOpenLinkDrawer('email-gated'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                Email-gated link
              </button>
              <button
                onClick={() => { router.push(`/documents/${doc._id}/signature?mode=send`); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <FileSignature className="h-4 w-4 text-slate-400 flex-shrink-0" />
                Request signatures
              </button>
            </div>
          </div>

          {/* ── ACTIONS SECTION ── */}
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Actions
            </p>
            <div className="space-y-1">
              {[
                { icon: Eye, label: 'Preview', onClick: () => { handlePreview(); setMobileMenuOpen(false); } },
                { icon: Presentation, label: 'Present', onClick: () => { handlePresent(); setMobileMenuOpen(false); } },
                { icon: Upload, label: 'Upload new version', onClick: () => { document.getElementById('upload-new-version-input')?.click(); setMobileMenuOpen(false); } },
                { icon: Download, label: isDownloading ? 'Downloading...' : 'Download', onClick: () => { handleDownload(); setMobileMenuOpen(false); }, disabled: isDownloading },
                { icon: Clock, label: 'Version History', onClick: () => { router.push(`/documents/${doc._id}/versions`); setMobileMenuOpen(false); } },
                { icon: FileSignature, label: doc?.isTemplate ? 'Edit Template' : 'Convert to signable', onClick: () => { router.push(`/documents/${doc._id}/signature?mode=edit`); setMobileMenuOpen(false); } },
                { icon: Shield, label: 'Compliance Report', onClick: () => { router.push('/compliance'); setMobileMenuOpen(false); } },
                { icon: Eye, label: 'Export visits', onClick: () => { handleExportVisits(); setMobileMenuOpen(false); } },
                { icon: ImageIcon, label: 'Update thumbnail', onClick: () => { handleUpdateThumbnail(); setMobileMenuOpen(false); } },
                ...(doc?.isTemplate ? [{ icon: Users, label: 'Bulk Send', onClick: () => { router.push(`/documents/${doc._id}/bulk-send`); setMobileMenuOpen(false); } }] : []),
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-left"
                >
                  <item.icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── DANGER ZONE ── */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-3">
              Danger Zone
            </p>
            <button
              onClick={() => { setShowDeleteDialog(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-4 w-4 flex-shrink-0" />
              Delete document
            </button>
          </div>

        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>

{/* ── HEADER ── */}
<header className="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">
    <div className="flex items-center justify-between py-3 gap-3">

      {/* ── LEFT (Desktop): back + thumbnail + full title ── */}
      <div className="hidden md:flex items-center gap-4 min-w-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-10 w-8 rounded bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {doc.thumbnail ? (
            <img src={doc.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <FileText className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[320px] leading-tight">
              {doc.filename}
            </h1>
            {doc.isTemplate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                <FileSignature className="h-3 w-3 mr-1" />Template
              </span>
            )}
            {liveViewerCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                {liveViewerCount} live
              </span>
            )}
          </div>
          {!isEditingNotes ? (
            <button onClick={() => setIsEditingNotes(true)} className="flex items-center gap-1.5 mt-1 group">
              <Edit className="h-3 w-3 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
              <span className={`text-xs transition-colors ${doc.notes ? 'text-slate-500 group-hover:text-slate-700' : 'text-slate-300 group-hover:text-slate-500 italic'}`}>
                {doc.notes || 'Add a note to this document'}
              </span>
            </button>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1.5 w-full max-w-sm">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note..."
                className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 bg-white shadow-sm"
                rows={2}
                autoFocus
                maxLength={200}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveNotes(); }
                  if (e.key === 'Escape') { setIsEditingNotes(false); setNotes(doc.notes || ''); }
                }}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-300">{notes.length}/200</span>
                <div className="flex gap-1.5">
                  <button onClick={() => { setIsEditingNotes(false); setNotes(doc.notes || ''); }} className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">Cancel</button>
                  <button onClick={handleSaveNotes} disabled={isSavingNotes} className="px-2.5 py-1 text-xs font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-md disabled:opacity-50">
                    {isSavingNotes ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isEditingNotes && (
            <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {formatTimeAgo(doc.createdAt)}
              {doc?.ownerEmail && (<><span className="text-slate-200">·</span><span>{doc.ownerEmail}</span></>)}
            </p>
          )}
        </div>
      </div>

      {/* ── LEFT (Mobile): back + title only ── */}
      <div className="flex md:hidden items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => router.push('/dashboard')}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-slate-900 truncate max-w-[200px] leading-tight">
            {doc.filename}
          </h1>
          {liveViewerCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              {liveViewerCount} live
            </span>
          )}
        </div>
      </div>

      {/* ── RIGHT (Desktop): full action buttons ── */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handlePreview} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium">
                <Eye className="h-4 w-4" /><span>Preview</span>
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Preview document</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => document.getElementById('upload-new-version-input')?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium">
                <Upload className="h-4 w-4" /><span className="hidden lg:inline">Upload new version</span>
              </button>
            </TooltipTrigger>
            <TooltipContent><p>Upload a new version</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input type="file" id="upload-new-version-input" accept=".pdf" className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const renamedFile = new File([file], doc.filename, { type: file.type });
            const formData = new FormData();
            formData.append('file', renamedFile);
            try {
              const res = await fetch(`/api/upload`, { method: 'POST', credentials: 'include', body: formData });
              if (res.ok) { toast.success('New version uploaded!'); fetchDocument(); }
              else toast.error('Failed to upload version');
            } catch { toast.error('Upload failed'); }
            e.target.value = '';
          }}
        />
        <div className="flex items-center rounded-lg overflow-hidden border border-sky-500 shadow-sm">
          <button onClick={() => handleOpenLinkDrawer('public')} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors">
            <LinkIcon className="h-3.5 w-3.5" />Create link
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="px-2 py-1.5 bg-sky-500 hover:bg-sky-600 text-white border-l border-sky-400 transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-white shadow-lg border border-slate-200 p-1">
              <DropdownMenuItem onClick={() => handleOpenLinkDrawer('public')} className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50">
                <LinkIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-sm font-medium text-slate-800">Document link</p><p className="text-[11px] text-slate-400 mt-0.5">Anyone with the link can view</p></div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenLinkDrawer('email-gated')} className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-sm font-medium text-slate-800">Email-gated link</p><p className="text-[11px] text-slate-400 mt-0.5">Viewer must enter email to access</p></div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/signature?mode=send`)} className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50">
                <FileSignature className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-sm font-medium text-slate-800">Request signatures</p><p className="text-[11px] text-slate-400 mt-0.5">Send for e-signature</p></div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-slate-200">
            <DropdownMenuItem onClick={handlePresent}><Presentation className="mr-2 h-4 w-4" /><span>Present</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)}><FileSignature className="mr-2 h-4 w-4" /><span>{doc?.isTemplate ? 'Edit Template' : 'Convert to signable'}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/versions`)}><Clock className="mr-2 h-4 w-4" /><span>Version History</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/compliance')}><Shield className="mr-2 h-4 w-4" /><span>Compliance Report</span></DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? <div className="mr-2 h-4 w-4 animate-spin border-2 border-sky-500 border-t-transparent rounded-full" /> : <Download className="mr-2 h-4 w-4" />}
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportVisits}><Eye className="mr-2 h-4 w-4" /><span>Export visits</span></DropdownMenuItem>
           
            <DropdownMenuSeparator />
            {doc?.isTemplate && (
              <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/bulk-send`)}><Users className="mr-2 h-4 w-4" /><span>Bulk Send</span></DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
              <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── RIGHT (Mobile): hamburger only ── */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

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
<PresentModeDrawer
  open={presentMode}
  onOpenChange={setPresentMode}
  doc={doc}
  pdfUrl={pdfUrl}
  isLoadingPage={isLoadingPage}
  previewPage={previewPage}
  totalPages={totalPages}
  onPrevPage={handlePrevPage}
  onNextPage={handleNextPage}
  onGoToPage={handleGoToPage}
/>


      {/* Tabs */}
<div className="bg-white border-b border-slate-200 sticky top-[65px] z-40 mt-5">
  <div className="max-w-7xl mx-auto px-4 sm:px-6">

    {/* ── MOBILE: Dropdown selector ── */}
    <div className="flex md:hidden py-3">
      <div className="relative w-full">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 pr-10 cursor-pointer"
        >
          <option value="activity">📋 Activity</option>
          <option value="performance">📊 Performance</option>
          <option value="signatures">✍️ Signatures</option>
          <option value="utilization">📈 Utilization</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>

    {/* ── DESKTOP: Tab bar ── */}
    <div className="hidden md:flex gap-0">
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
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full" />
          )}
        </button>
      ))}
    </div>

  </div>
</div>

      {/* Main Content */}
       <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
{activeTab === 'activity' && (
  <div className="space-y-6">

    {/* ── LOADING ── */}
    {analyticsLoading && (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading activity...</p>
        </div>
      </div>
    )}

    {/* ── TEMPLATE SECTION ── */}
    {!analyticsLoading && doc.isTemplate && (
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
            <Button  onClick={() => setConfirmDialog({
  open: true,
  title: 'Remove Template',
  message: 'Are you sure you want to remove the template configuration? This cannot be undone.',
  danger: true,
  onConfirm: async () => {
    const res = await fetch(`/api/documents/${doc._id}/template`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { fetchDocument(); }
  },
})} variant="outline" className="gap-2 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />Remove Template
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* ── NO SHARES YET ── */}
    {!analyticsLoading && !doc.isTemplate && (!analytics?.shares || analytics.shares === 0) && (
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

    {/* ── HAS SHARES: Activity View ── */}
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
         onConfirm={(opts) => setConfirmDialog({ open: true, ...opts })}
      />
    )}

  </div>
)}

{activeTab === 'performance' && (
  <PerformanceTab
    analytics={analytics}
    analyticsLoading={analyticsLoading}
    liveViewerCount={liveViewerCount}
    liveViewers={liveViewers}
    heatmapPage={heatmapPage}
    setHeatmapPage={setHeatmapPage}
    doc={doc}
    onCreateLink={handleCreateLink}
  />
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
  <UtilizationTab
    analytics={analytics}
    analyticsLoading={analyticsLoading}
    spacesCount={spacesCount}
    spacesLoading={spacesLoading}
    doc={doc}
    onCreateLink={handleCreateLink}
    params={{ id: params.id as string | string[] }}
  />
)}
      </div>

   {/* PDF Preview Drawer */}
<PreviewDrawer
  open={previewOpen}
  onOpenChange={setPreviewOpen}
  doc={doc}
  pdfUrl={pdfUrl}
  isLoadingPage={isLoadingPage}
  previewPage={previewPage}
  totalPages={totalPages}
  onPrevPage={handlePrevPage}
  onNextPage={handleNextPage}
  onGoToPage={handleGoToPage}
  onDownload={handleDownload}
  isDownloading={isDownloading}
/>
     {/* Create Share Link Dialog - DocSend Style */}
<ShareLinkDrawer
  open={showCreateLinkDialog}
  onOpenChange={setShowCreateLinkDialog}
  doc={doc}
   docId={String(params.id)}
  editMode={editMode}
  editingLink={editingLink}
  shareSettings={shareSettings}
  setShareSettings={setShareSettings}
  recipientInput={recipientInput}
  setRecipientInput={setRecipientInput}
  recipientNameInput={recipientNameInput}
  setRecipientNameInput={setRecipientNameInput}
  recipientInputMethod={recipientInputMethod}
  setRecipientInputMethod={setRecipientInputMethod}
  bulkRecipientInput={bulkRecipientInput}
  setBulkRecipientInput={setBulkRecipientInput}
  csvPreview={csvPreview}
  setCsvPreview={setCsvPreview}
  showAllRecipients={showAllRecipients}
  setShowAllRecipients={setShowAllRecipients}
  logoFile={logoFile}
  logoPreview={logoPreview}
  isUploadingLogo={isUploadingLogo}
  handleLogoFileSelect={handleLogoFileSelect}
  handleRemoveLogo={handleRemoveLogo}
  handleAddRecipient={handleAddRecipient}
  handleBulkAddRecipients={handleBulkAddRecipients}
  handleCSVUpload={handleCSVUpload}
  handleConfirmCSV={handleConfirmCSV}
  handleAttachFromDrive={handleAttachFromDrive}
  onConfirm={(opts) => setConfirmDialog({ open: true, ...opts })}
  onClose={() => {
    setShowCreateLinkDialog(false);
    setEditMode('create');
    setEditingLink(null);
  }}
  onSuccess={() => window.location.reload()}
/>


{/* signature Dialog */}

 {/* signature Dialog */}
      <SignatureDialog
  open={showSignatureDialog}
  onOpenChange={setShowSignatureDialog}
  doc={doc}
  pdfUrl={pdfUrl}
  isSending={isSending}
  setIsSending={setIsSending}
  signatureRequest={signatureRequest}
  setSignatureRequest={setSignatureRequest}
  onSuccess={(links) => {
    setGeneratedLinks(links);
    setShowSuccessDialog(true);
  }}
  fetchDocument={fetchDocument}
/>
{/* Success Dialog with Generated Links */}
<SuccessDialog
  open={showSuccessDialog}
  onOpenChange={setShowSuccessDialog}
  doc={doc}
  generatedLinks={generatedLinks}
  onClose={() => {
    setShowSuccessDialog(false);
    setSignatureRequest({
      recipientEmail: '', recipientName: '', message: '', dueDate: '',
      step: 1, recipients: [], signatureFields: [], isTemplate: false,
    });
  }}
/>

 

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
                setConfirmDialog({
  open: true,
  title: 'Delete Link',
  message: `Are you sure you want to permanently delete the link for ${editingLink?.recipientEmail || 'this recipient'}?`,
  danger: true,
  onConfirm: async () => {
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
    } catch {
      toast.error('Network error');
    }
  },
});
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
{/* ── CONFIRM DIALOG ── */}
<Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(c => ({ ...c, open: o }))}>
  <DialogContent className="max-w-sm bg-white">
    <DialogHeader>
      <DialogTitle>{confirmDialog.title}</DialogTitle>
    </DialogHeader>
    <p className="text-sm text-slate-600 py-2">{confirmDialog.message}</p>
    <div className="flex gap-3 justify-end pt-2">
      <Button
        variant="outline"
        onClick={() => setConfirmDialog(c => ({ ...c, open: false }))}
      >
        Cancel
      </Button>
      <Button
        onClick={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(c => ({ ...c, open: false }));
        }}
        className={confirmDialog.danger ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
      >
        Confirm
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}



