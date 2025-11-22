"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Copy, Check, TrendingUp, Users, FileCheck, Expand, Minimize  } from "lucide-react"
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
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

type DocumentType = {
  _id: string;
  filename: string;
  size: number;
  numPages: number;
  createdAt: string;
  notes?: string;
  thumbnail?: string;
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
const [generatedLinks, setGeneratedLinks] = useState([]);
const [isSending, setIsSending] = useState(false);
const [showThumbnailDialog, setShowThumbnailDialog] = useState(false);
const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
const [basePdfUrl, setBasePdfUrl] = useState<string | null>(null); // new
const [linkSettings, setLinkSettings] = useState({
  requireEmail: true,
  allowDownload: true,
  expiresIn: '30', // days
  password: '',
  notifyOnView: true,
});
const [signatureRequest, setSignatureRequest] = useState({
  recipientEmail: '',
  recipientName: '',
  message: '',
  dueDate: '',
  isTemplate: false,
});
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
        setDoc(data.document);
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


 // Navigate to next page
const handleNextEditPage = () => {
  if (currentEditPage < paginatedContent.length - 1) {
    // Save current page content first
    const updatedPages = [...paginatedContent];
    updatedPages[currentEditPage] = editableContent;
    setPaginatedContent(updatedPages);
    
    // Move to next page
    const nextPage = currentEditPage + 1;
    setCurrentEditPage(nextPage);
    setEditableContent(updatedPages[nextPage]);
  }
};

// Navigate to previous page
const handlePrevEditPage = () => {
  if (currentEditPage > 0) {
    // Save current page content first
    const updatedPages = [...paginatedContent];
    updatedPages[currentEditPage] = editableContent;
    setPaginatedContent(updatedPages);
    
    // Move to previous page
    const prevPage = currentEditPage - 1;
    setCurrentEditPage(prevPage);
    setEditableContent(updatedPages[prevPage]);
  }
};

// Go to specific page
const handleGoToEditPage = (pageIndex: number) => {
  if (pageIndex >= 0 && pageIndex < paginatedContent.length) {
    // Save current page content first
    const updatedPages = [...paginatedContent];
    updatedPages[currentEditPage] = editableContent;
    setPaginatedContent(updatedPages);
    
    // Move to selected page
    setCurrentEditPage(pageIndex);
    setEditableContent(updatedPages[pageIndex]);
  }
};

// Fetch content analytics
// Fetch content analytics
const fetchContentAnalytics = async () => {
  setAnalyticsLoading(true);
  try {
    const res = await fetch(`/api/documents/${params.id}/content-analytics`, {
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      console.log('📊 Content Analytics Response:', data);
      if (data.success) {
        console.log('✅ Analytics loaded:', {
          grammar: data.analytics.grammarIssues?.length || 0,
          spelling: data.analytics.spellingErrors?.length || 0,
          clarity: data.analytics.clarityIssues?.length || 0,
          health: data.analytics.healthScore
        });
        
        setContentAnalytics(data.analytics);
        
        // Paginate the content
        const fullText = data.extractedText || '';
        const pages = paginateContent(fullText);
        setPaginatedContent(pages);
        setCurrentEditPage(0);
        setEditableContent(pages[0] || '');
        
        console.log('📄 Document paginated into', pages.length, 'pages');
      }
    } else {
      console.error('❌ Failed to fetch analytics:', res.status);
    }
  } catch (error) {
    console.error('Failed to fetch content analytics:', error);
  } finally {
    setAnalyticsLoading(false);
  }

 

};
// Handle opening fix issues dialog
// Handle opening fix issues dialog
const handleOpenFixIssues = async () => {
  setShowFixIssuesDialog(true);
  // Fetch analytics
  await fetchContentAnalytics();
  // Fetch PDF for viewing
  if (!pdfUrl) {
    await fetchPdfForPreview(1);
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

// Auto-fetch analytics when Fix Issues dialog opens
useEffect(() => {
  if (showFixIssuesDialog && !contentAnalytics) {
    fetchContentAnalytics();
  }
}, [showFixIssuesDialog]);

// Paginate document content by estimated pages
const paginateContent = (text: string, wordsPerPage: number = 250) => {
  const words = text.split(/\s+/).filter(Boolean);
  const pages: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerPage) {
    const pageWords = words.slice(i, i + wordsPerPage);
    pages.push(pageWords.join(' '));
  }
  
  return pages.length > 0 ? pages : [text];
};

// Save fixed content

const handleSaveFixedContent = async () => {
  setIsSavingFix(true);
  try {
    // Save current page edits first
    const updatedPages = [...paginatedContent];
    updatedPages[currentEditPage] = editableContent;
    
    // Combine all pages back into one text
    const fullFixedText = updatedPages.join('\n\n');
    
    const res = await fetch(`/api/documents/${params.id}/fix-content`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fixedText: fullFixedText }),
    });

    if (res.ok) {
      const data = await res.json();
      alert('✅ Document updated successfully!');
      setShowFixIssuesDialog(false);
      // Refresh analytics
      await fetchContentAnalytics();
    } else {
      alert('Failed to save changes');
    }
  } catch (error) {
    console.error('Failed to save fixed content:', error);
    alert('Failed to save changes');
  } finally {
    setIsSavingFix(false);
  }
};

// Apply suggestion to text
const applySuggestion = (issue: any) => {
  if (issue.suggestion) {
    const updatedText = editableContent.replace(issue.issue, issue.suggestion);
    setEditableContent(updatedText);
  }
};

// Get total issues count
// Get total issues count
const getTotalIssues = () => {
  if (!contentAnalytics) return 0;
  
  const grammarCount = Array.isArray(contentAnalytics.grammarIssues) 
    ? contentAnalytics.grammarIssues.length 
    : 0;
  const spellingCount = Array.isArray(contentAnalytics.spellingErrors) 
    ? contentAnalytics.spellingErrors.length 
    : 0;
  
  // Check both clarityScore (DB field) and clarityIssues (frontend field)
  const clarityArray = contentAnalytics.clarityScore || contentAnalytics.clarityIssues || [];
  const clarityCount = Array.isArray(clarityArray) ? clarityArray.length : 0;
    
  return grammarCount + spellingCount + clarityCount;
};

// Get all issues combined
// Get all issues combined
interface GrammarIssue {
  message?: string;
  issue?: string;
  suggestion?: string;
}

interface SpellingError {
  word?: string;
  issue?: string;
  position?: number;
}

interface ClarityIssue {
  issue?: string;
  message?: string;
  suggestion?: string;
}

interface CombinedIssue extends Record<string, any> {
  category: 'Grammar' | 'Spelling' | 'Clarity';
  issue: string;
  suggestion?: string;
  position?: number;
}

const getAllIssues = (): CombinedIssue[] => {
  if (!contentAnalytics) return [];
  const issues: CombinedIssue[] = [];
  
  // Grammar issues
  if (Array.isArray(contentAnalytics.grammarIssues)) {
    contentAnalytics.grammarIssues.forEach((issue: GrammarIssue) => {
      issues.push({ 
        ...issue, 
        category: 'Grammar',
        issue: issue.message || issue.issue || 'Grammar issue detected',
        suggestion: issue.suggestion || 'Review grammar'
      });
    });
  }
  
  // Spelling errors
  if (Array.isArray(contentAnalytics.spellingErrors)) {
    contentAnalytics.spellingErrors.forEach((error: SpellingError) => {
      issues.push({ 
        issue: error.word || error.issue || 'Spelling error', 
        suggestion: `Check spelling of "${error.word || 'this word'}"`,
        category: 'Spelling',
        position: error.position 
      });
    });
  }
  
  // Clarity issues - use clarityScore from DB
  const clarityIssues: ClarityIssue[] = contentAnalytics.clarityScore || contentAnalytics.clarityIssues || [];
  if (Array.isArray(clarityIssues)) {
    clarityIssues.forEach((issue: ClarityIssue) => {
      issues.push({ 
        ...issue, 
        category: 'Clarity',
        issue: issue.issue || issue.message || 'Clarity issue detected'
      });
    });
  }
  
  return issues;
};
  

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
    fetchContentAnalytics();
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
const handleCreateLink = async () => {
  setIsGeneratingLink(true);
  try {
    const res = await fetch(`/api/documents/${params.id}/share`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requireEmail: true, // ✅ FORCE email capture
        allowDownload: linkSettings.allowDownload,
        allowPrint: true,
        notifyOnView: linkSettings.notifyOnView,
        expiresIn: linkSettings.expiresIn,
        password: linkSettings.password || null,
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setGeneratedLink(data.shareLink);
        navigator.clipboard.writeText(data.shareLink);
        alert('✅ Link created and copied to clipboard!');
      }
    } else {
      alert('Failed to create share link');
    }
  } catch (error) {
    console.error('Failed to create link:', error);
    alert('Failed to create share link');
  } finally {
    setIsGeneratingLink(false);
  }
};
// Copy link to clipboard
const [linkCopied, setLinkCopied] = useState(false);
const handleCopyLink = () => {
  if (generatedLink) {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }
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

// Open create link dialog
const openCreateLinkDialog = () => {
  setGeneratedLink(null);
  setShowCreateLinkDialog(true);
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
                <DropdownMenuContent align="end" className="w-56">
  <DropdownMenuItem onClick={handlePresent}>
    <Presentation className="mr-2 h-4 w-4" />
    <span>Present</span>
  </DropdownMenuItem>
  <DropdownMenuItem 
  onClick={doc?.isTemplate ? async () => {
    // If already a template, load and edit it
    const res = await fetch(`/api/documents/${doc._id}/template`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setSignatureRequest({
        recipientEmail: '',
        recipientName: '',
        message: '',
        dueDate: '',
        step: 2,
        recipients: data.template.recipients || [],
        signatureFields: data.template.signatureFields || [],
        isTemplate: true,
      });
      setShowSignatureDialog(true);
      if (!pdfUrl) {
        fetchPdfForPreview(1);
      }
    }
  } : handleConvertToSignable}
>
  <FileSignature className="mr-2 h-4 w-4" />
  <span>{doc?.isTemplate ? 'Edit Template' : 'Convert to signable'}</span>
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
  onClick={openCreateLinkDialog}
  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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

{/* Present Mode Dialog */}
{/* Present Mode Dialog with Pagination */}
<Dialog open={presentMode} onOpenChange={setPresentMode}>
  <DialogContent className="max-w-screen-2xl w-screen h-screen p-0 bg-black">
     <DialogTitle className="sr-only">Presentation Mode</DialogTitle>
    <div className="relative h-full">
      {/* Close button */}
      <button
        onClick={() => setPresentMode(false)}
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* PDF Viewer */}
      <div className="h-full flex items-center justify-center p-8">
        {isLoadingPage ? (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading page {previewPage}...</p>
          </div>
        ) : pdfUrl ? (
         <iframe
  src={basePdfUrl ? `${basePdfUrl}#page=${previewPage}` : pdfUrl ?? undefined}
  className="w-full h-full bg-white rounded-lg shadow-2xl"
  title="PDF Presentation"
  style={{ border: 'none' }}
/>
        ) : (
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading presentation...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-lg rounded-full px-6 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={handlePrevPage}
          disabled={previewPage <= 1 || isLoadingPage}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-white font-medium min-w-[80px] text-center">
          {previewPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={handleNextPage}
          disabled={previewPage >= totalPages || isLoadingPage}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
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
              onClick={async () => {
                // Load template configuration
                const res = await fetch(`/api/documents/${doc._id}/template`, {
                  credentials: 'include',
                });
                if (res.ok) {
                  const data = await res.json();
                  // Pre-populate signature dialog with template fields
                  setSignatureRequest({
                    recipientEmail: '',
                    recipientName: '',
                    message: '',
                    dueDate: '',
                    step: 1,
                    recipients: [],
                    signatureFields: data.template.signatureFields || [],
                    isTemplate: false, // Now in "send mode"
                  });
                  setShowSignatureDialog(true);
                  if (!pdfUrl) {
                    fetchPdfForPreview(1);
                  }
                }
              }}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Mail className="h-4 w-4" />
              Send to Recipients
            </Button>
            <Button
              onClick={async () => {
                // Edit template fields
                const res = await fetch(`/api/documents/${doc._id}/template`, {
                  credentials: 'include',
                });
                if (res.ok) {
                  const data = await res.json();
                  setSignatureRequest({
                    recipientEmail: '',
                    recipientName: '',
                    message: '',
                    dueDate: '',
                    step: 2, // Go to field placement
                    recipients: data.template.recipients || [],
                    signatureFields: data.template.signatureFields || [],
                    isTemplate: true, // Edit template mode
                  });
                  setShowSignatureDialog(true);
                  if (!pdfUrl) {
                    fetchPdfForPreview(1);
                  }
                }
              }}
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
            onClick={openCreateLinkDialog}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <LinkIcon className="h-4 w-4" />
            Create link
          </Button>
          <Button
            onClick={handleOpenFixIssues}
            variant="outline"
            className="gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <FileCheck className="h-4 w-4" />
            Fix Issues
            {doc && getTotalIssues() > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {getTotalIssues()}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setShowSignatureDialog(true)}
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
          onClick={openCreateLinkDialog}
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
          onClick={openCreateLinkDialog}
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

      {/* PDF Preview Dialog */}
    {/* PDF Preview Dialog with Analytics Overlay */}
<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
  <DialogContent className="max-w-7xl h-[95vh] p-0 bg-slate-900">
    {/* Header */}
    <DialogHeader className="px-6 py-4 border-b border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <DialogTitle className="text-lg font-semibold text-white">
            {doc.filename}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnalyticsOverlay(!showAnalyticsOverlay)}
              className={`text-xs ${
                showAnalyticsOverlay 
                  ? 'bg-purple-500/20 text-purple-300' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              {showAnalyticsOverlay ? 'Hide' : 'Show'} Issues
              {contentAnalytics && getTotalIssues() > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {getTotalIssues()}
                </span>
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  {isDownloading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </DialogHeader>

    {/* Main Content Area */}
    <div className="flex-1 flex overflow-hidden">
      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-slate-800 p-6 relative">
        {isLoadingPage ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading page {previewPage}...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
      <embed
  src={`${pdfUrl}#page=${previewPage}&toolbar=1&navpanes=1&scrollbar=1`}
  type="application/pdf"
  className="w-full h-full"
  style={{ border: 'none' }}
/>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading preview...</p>
            </div>
          </div>
        )}

        {/* Page Navigation Overlay */}
        {pdfUrl && !isLoadingPage && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-slate-900/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-slate-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevPage}
              disabled={previewPage <= 1}
              className="text-white hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={previewPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page) handleGoToPage(page);
                }}
                className="w-12 bg-slate-800 text-white text-center rounded px-2 py-1 text-sm border border-slate-600 focus:border-purple-500 focus:outline-none"
              />
              <span className="text-white font-medium text-sm">/ {totalPages}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextPage}
              disabled={previewPage >= totalPages}
              className="text-white hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Analytics Overlay Panel */}
      {showAnalyticsOverlay && (
        <div className="w-80 border-l border-slate-700 bg-slate-800 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Content Analysis
            </h3>

            {analyticsLoading ? (
  <div className="text-center py-8">
    <div className="animate-spin h-6 w-6 border-3 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
    <p className="text-sm text-slate-400">Analyzing...</p>
  </div>
) : contentAnalytics?.scannedPdf ? (
  <div className="text-center py-8">
    <ImageIcon className="h-12 w-12 text-slate-500 mx-auto mb-3" />
    <p className="text-sm text-slate-400">
      Scanned document - limited text analysis
    </p>
  </div>
) : !contentAnalytics || getTotalIssues() === 0 ? (
  <div className="text-center py-8">
    <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
      <Check className="h-8 w-8 text-green-400" />
    </div>
    <h4 className="font-semibold text-white mb-2">
      {contentAnalytics && getTotalIssues() === 0 ? 'No Issues Found!' : 'Loading...'}
    </h4>
    <p className="text-sm text-slate-400 mb-4">
      {contentAnalytics && getTotalIssues() === 0 
        ? 'Your document is ready to share' 
        : 'Analyzing document...'
      }
    </p>
    {contentAnalytics && getTotalIssues() === 0 && (
      <div className="bg-slate-900/50 rounded-lg p-3 text-left">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Health Score</span>
            <span className="font-semibold text-green-400">
              {contentAnalytics.healthScore || 0}/100
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Readability</span>
            <span className="font-semibold">
              {contentAnalytics.readabilityScore || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Grammar</span>
            <span className="font-semibold text-green-400">✓ Perfect</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span>Spelling</span>
            <span className="font-semibold text-green-400">✓ Perfect</span>
          </div>
        </div>
      </div>
    )}
  </div>
) : (
  // Show issues (rest of your existing code)
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {contentAnalytics?.errorCounts?.grammar || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Grammar</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                      {contentAnalytics?.errorCounts?.spelling || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Spelling</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {contentAnalytics?.errorCounts?.clarity || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Clarity</div>
                  </div>
                </div>

                {/* Health Score */}
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Health Score</span>
                    <span className={`text-lg font-bold ${
                      (contentAnalytics?.healthScore || 0) >= 80 
                        ? 'text-green-400' 
                        : (contentAnalytics?.healthScore || 0) >= 60 
                        ? 'text-yellow-400' 
                        : 'text-red-400'
                    }`}>
                      {contentAnalytics?.healthScore || 0}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        (contentAnalytics?.healthScore || 0) >= 80 
                          ? 'bg-green-500' 
                          : (contentAnalytics?.healthScore || 0) >= 60 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${contentAnalytics?.healthScore || 0}%` }}
                    />
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Issues Found:</h4>
                  
                  {/* Grammar Issues */}
                  {contentAnalytics?.grammarIssues?.slice(0, 3).map((issue: any, idx: number) => (
                    <div key={`grammar-${idx}`} className="bg-slate-900/50 rounded-lg p-3 border-l-2 border-red-500">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          Grammar
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{issue.message}</p>
                    </div>
                  ))}

                  {/* Spelling Issues */}
                  {contentAnalytics?.spellingErrors?.slice(0, 3).map((error: any, idx: number) => (
                    <div key={`spelling-${idx}`} className="bg-slate-900/50 rounded-lg p-3 border-l-2 border-yellow-500">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Spelling
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                        Possible misspelling: "<span className="font-semibold">{error.word}</span>"
                      </p>
                    </div>
                  ))}

                  {/* Clarity Issues */}
                  {contentAnalytics?.clarityIssues?.slice(0, 2).map((issue: any, idx: number) => (
                    <div key={`clarity-${idx}`} className="bg-slate-900/50 rounded-lg p-3 border-l-2 border-blue-500">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          Clarity
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">{issue.issue}</p>
                      {issue.suggestion && (
                        <p className="text-xs text-blue-400 mt-1">💡 {issue.suggestion}</p>
                      )}
                    </div>
                  ))}

                  {getTotalIssues() > 8 && (
                    <p className="text-xs text-slate-500 text-center py-2">
                      +{getTotalIssues() - 8} more issues
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => {
                    setPreviewOpen(false);
                    handleOpenFixIssues();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="sm"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Fix All Issues
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="px-6 py-3 border-t border-slate-700 bg-slate-800 flex items-center justify-between">
      <div className="text-sm text-slate-400">
        {doc.numPages && `${doc.numPages} pages • `}
        {(doc.size / 1024 / 1024).toFixed(2)} MB
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPreviewOpen(false)}
        className="border-slate-600 text-slate-300 hover:bg-slate-700"
      >
        Close
      </Button>
    </div>
  </DialogContent>
</Dialog>
     {/* Create Share Link Dialog - DocSend Style */}
<Dialog open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}>
  <DialogContent className="max-w-lg bg-white">
    <DialogHeader>
      <DialogTitle className="text-xl font-semibold">Share "{doc?.filename}"</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
      {/* Generated Link Display */}
      {generatedLink ? (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Link created!</p>
              <p className="text-sm text-green-700">Anyone with this link can view your document.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Shareable Link</Label>
            <div className="flex gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="font-mono text-sm bg-slate-50"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="gap-2 flex-shrink-0"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share via</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:?subject=${encodeURIComponent(doc?.filename || 'Document')}&body=${encodeURIComponent('View this document: ' + generatedLink)}`)}
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out: ' + generatedLink)}`)}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generatedLink)}`)}
              >
                <Share2 className="h-4 w-4 mr-1" />
                LinkedIn
              </Button>
            </div>
          </div>
          {/* In your Create Link Dialog, add this setting */}
<div className="flex items-center justify-between py-2">
  <div>
    <p className="text-sm font-medium">Require email to view</p>
    <p className="text-xs text-slate-500">Track who views your document</p>
  </div>
  <Switch
    checked={linkSettings.requireEmail}
    onCheckedChange={(checked) => 
      setLinkSettings({ ...linkSettings, requireEmail: checked })
    }
  />
</div>
          {/* Link Settings - Expandable */}
          <details className="border rounded-lg">
            <summary className="px-4 py-3 cursor-pointer font-medium text-sm hover:bg-slate-50">
              Link Settings (Optional)
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Require email to view</p>
                  <p className="text-xs text-slate-500">Track who views your document</p>
                </div>
                <Switch
                  checked={linkSettings.requireEmail}
                  onCheckedChange={(checked) => 
                    setLinkSettings({ ...linkSettings, requireEmail: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Allow download</p>
                  <p className="text-xs text-slate-500">Let viewers save a copy</p>
                </div>
                <Switch
                  checked={linkSettings.allowDownload}
                  onCheckedChange={(checked) => 
                    setLinkSettings({ ...linkSettings, allowDownload: checked })
                  }
                />
              </div>
              <div className="space-y-2 py-2">
                <Label className="text-sm font-medium">Link expires</Label>
                <select
                  value={linkSettings.expiresIn}
                  onChange={(e) => 
                    setLinkSettings({ ...linkSettings, expiresIn: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
          </details>
        </>
      ) : (
        /* Before Link Created */
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Create a shareable link
          </h3>
          <p className="text-sm text-slate-600 mb-6">
            Anyone with the link can view your document and you'll see analytics
          </p>
          <Button
            onClick={handleCreateLink}
            disabled={isGeneratingLink}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGeneratingLink ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Creating Link...
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Create Link
              </>
            )}
          </Button>
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-2 pt-4 border-t">
      {generatedLink && (
        <Button
          variant="outline"
          onClick={() => {
            // Reset and close
            setGeneratedLink(null);
            setShowCreateLinkDialog(false);
          }}
        >
          Create Another Link
        </Button>
      )}
      <Button
        onClick={() => {
          setShowCreateLinkDialog(false);
          if (generatedLink) {
            // Reset after closing
            setTimeout(() => setGeneratedLink(null), 300);
          }
        }}
      >
        Done
      </Button>
    </div>
  </DialogContent>
</Dialog>

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
          : `Step ${signatureRequest.step || 1} of 3: ${
              (signatureRequest.step || 1) === 1 ? 'Add Recipients' :
              (signatureRequest.step || 1) === 2 ? 'Place Signature Fields' :
              'Review & Send'
            }`
        }
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
      {/* Step 2: Place Signature Fields */}
{(signatureRequest.step || 1) === 2 && (
  <div className="h-full flex">
    {/* Left Sidebar - Field Types - MAKE IT NARROWER */}
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

      {/* Quick Actions - Make more compact */}
      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-slate-700 mb-2">Quick Actions:</p>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs py-1.5"
          onClick={() => {
            const newFields = (signatureRequest.recipients || []).map((_, index) => ({
              id: Date.now() + index,
              type: 'signature',
              x: 25,
              y: 60 + (index * 15),
              page: 1,
              recipientIndex: index,
            }));
            setSignatureRequest({
              ...signatureRequest,
              signatureFields: [...(signatureRequest.signatureFields || []), ...newFields]
            });
            if (previewPage !== 1) {
              setPreviewPage(1);
            }
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
                (f) => f.page !== previewPage
              );
              setSignatureRequest({ ...signatureRequest, signatureFields: updated });
            }
          }}
          disabled={(signatureRequest.signatureFields || []).filter((f) => f.page === previewPage).length === 0}
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

    {/* Main Area - FULL WIDTH PDF */}
    <div className="flex-1 p-4 overflow-auto bg-slate-100 flex flex-col">
      {/* PDF Container - MUCH LARGER */}
      <div 
        className="flex-1 bg-white shadow-2xl rounded-lg overflow-hidden relative mx-auto"
        style={{ 
          width: '210mm', // A4 width
          minHeight: '297mm', // A4 height
          maxWidth: '100%',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const fieldType = e.dataTransfer.getData('fieldType');
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          
          const newField = {
            id: Date.now(),
            type: fieldType,
            x,
            y,
            page: previewPage,
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
            <embed
              src={`${pdfUrl}#page=${previewPage}&toolbar=0&navpanes=0&scrollbar=0`}
              type="application/pdf"
              className="w-full h-full"
              style={{ 
                border: 'none', 
                pointerEvents: 'none',
                minHeight: '297mm', // A4 height
              }}
            />
            
            {/* Signature Field Overlays - IMPROVED POSITIONING */}
            {(signatureRequest.signatureFields || [])
              .filter((field) => field.page === previewPage)
              .map((field) => {
                const recipient = (signatureRequest.recipients || [])[field.recipientIndex];
                return (
                  <div
                    key={field.id}
                    className="absolute border-2 rounded cursor-move bg-white/95 shadow-xl group hover:shadow-2xl transition-all hover:z-50"
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      borderColor: recipient?.color || '#9333ea',
                      width: field.type === 'signature' ? '180px' : '140px',
                      height: field.type === 'signature' ? '70px' : '45px',
                      transform: 'translate(-50%, -50%)', // CENTER THE FIELD ON CURSOR
                    }}
                    draggable
                    onDragEnd={(e) => {
                      const rect = e.currentTarget.parentElement.getBoundingClientRect();
                      const newX = ((e.clientX - rect.left) / rect.width) * 100;
                      const newY = ((e.clientY - rect.top) / rect.height) * 100;
                      
                      const updated = (signatureRequest.signatureFields || []).map((f) =>
                        f.id === field.id ? { ...f, x: newX, y: newY } : f
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

      {/* Page Navigation - BELOW PDF */}
      {doc && doc.numPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 py-3 bg-white rounded-lg shadow-md">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
            disabled={previewPage <= 1}
            className="px-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-medium text-slate-700 px-4">
            Page {previewPage} of {doc.numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewPage(Math.min(doc.numPages, previewPage + 1))}
            disabled={previewPage >= doc.numPages}
            className="px-4"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
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
        // Validate based on mode
        if (signatureRequest.isTemplate) {
          // Template mode - just save the template
          if ((signatureRequest.signatureFields || []).length === 0) {
            alert('Please add at least one signature field');
            return;
          }
          
          setIsSending(true);
          
          // Save template to document
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
          
          // Success!
         // After successful template save
alert('✅ Document converted to signable template! You can now send it to multiple recipients.');
setShowSignatureDialog(false);
await fetchDocument(); // Add this line - it will refresh the document data
          
          // Reset form
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
          // Regular signature request mode
          const validRecipients = (signatureRequest.recipients || []).filter(
            (r) => r.name && r.email
          );
          if (validRecipients.length === 0) {
            alert('Please add at least one recipient with name and email');
            return;
          }

          setIsSending(true);

          // Call API to create signature requests
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

          // Success! Show the success dialog with real links
          setGeneratedLinks(data.signatureRequests);
          setShowSuccessDialog(true);
          setShowSignatureDialog(false);

          // Reset form
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
          console.log('✅ Signature requests created successfully');
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
{/* Fix Issues Dialog */}
{/* Fix Issues Dialog with Pagination - Professional Design */}
<Dialog open={showFixIssuesDialog} onOpenChange={setShowFixIssuesDialog}>
  <DialogContent className={`max-w-full w-full max-h-[95vh] overflow-hidden bg-white flex flex-col shadow-2xl rounded-lg ${isFullscreenEditMode ? 'fullscreen-edit-mode' : ''}`}>
    {/* Header */}
    <DialogHeader className="border-b pb-5 px-6">
      <div className="flex items-center justify-between">
        <div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Content Analysis & Fixes</DialogTitle>
          <p className="text-sm text-gray-500 mt-1.5">{doc?.filename}</p>
        </div>
        {contentAnalytics && (
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">
                {contentAnalytics.healthScore}
              </div>
              <div className="text-xs text-gray-500 font-medium">Health Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-gray-900">
                {contentAnalytics.readabilityScore}
              </div>
              <div className="text-xs text-gray-500 font-medium">Readability</div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-sm ${
              getTotalIssues() === 0
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-orange-50 text-orange-800 border border-orange-200'
            }`}>
              {getTotalIssues() === 0 ? '✓ No Issues' : `${getTotalIssues()} Issues Found`}
            </div>
          </div>
        )}
      </div>
    </DialogHeader>

    {/* Loading States */}
    {analyticsLoading ? (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Analyzing content...</p>
        </div>
      </div>
    ) : contentAnalytics?.scannedPdf ? (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-md space-y-4">
          <ImageIcon className="h-20 w-20 text-gray-300 mx-auto" />
          <h3 className="text-2xl font-bold text-gray-900">
            Scanned Document Detected
          </h3>
          <p className="text-gray-600 font-medium">
            This appears to be a scanned or image-based PDF. Text extraction is limited.
            For best results, please upload a text-based PDF document.
          </p>
        </div>
      </div>
    ) : !contentAnalytics ? (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading document analysis...</p>
        </div>
      </div>
    ) : getTotalIssues() === 0 ? (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center max-w-2xl space-y-6">
          <div className="h-24 w-24 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <Check className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900">
            Perfect! No Issues Found
          </h3>
          <p className="text-gray-600 font-medium text-lg">
            Your document looks great and is ready to be shared with employers, clients, or colleagues.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-left space-y-3">
            <h4 className="font-bold text-green-900 text-lg">Document Quality:</h4>
            <ul className="text-sm text-green-800 space-y-2">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> No grammar issues detected</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> No spelling errors found</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Clarity is excellent</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Readability score: {contentAnalytics.readabilityScore || 0}</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Health score: {contentAnalytics.healthScore || 0}/100</li>
            </ul>
          </div>
        </div>
      </div>
    ) : (
      <div className={`flex-1 grid gap-6 overflow-hidden p-1 ${isFullscreenEditMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Left Panel - Issues List (Hidden in Fullscreen Mode) */}
        {!isFullscreenEditMode && (
          <div className="border-r pr-6 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900 text-lg">Issues & Suggestions</h3>
                  <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-medium">
                    {getAllIssues().length} total
                  </span>
                </div>
              </div>
              {getAllIssues().map((issue, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ease-in-out ${
                    currentIssueIndex === index
                      ? 'border-purple-500 bg-purple-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => setCurrentIssueIndex(index)}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      issue.category === 'Grammar'
                        ? 'bg-red-50 text-red-800'
                        : issue.category === 'Spelling'
                        ? 'bg-yellow-50 text-yellow-800'
                        : 'bg-blue-50 text-blue-800'
                    }`}>
                      {issue.category}
                    </span>
                    {issue.suggestion && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-medium text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          applySuggestion(issue);
                        }}
                      >
                        Apply Fix
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 font-medium mb-2">{issue.issue || issue.message}</p>
                  {issue.suggestion && (
                    <p className="text-xs text-gray-600 italic">
                      💡 {issue.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Panel - Editable Content with Pagination */}
        <div className={`overflow-y-auto ${isFullscreenEditMode ? 'max-h-[85vh]' : 'max-h-[70vh]'} scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col`}>
          <div className="mb-5 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-lg">
                {showPdfView ? 'Original PDF View' : 'Edit Document'}
              </h3>
              <div className="flex items-center gap-4">
                {/* PDF/Edit Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className={`${showPdfView ? 'bg-blue-50 border-blue-300 text-blue-700' : 'text-blue-600 border-blue-200'} hover:bg-blue-50`}
                  onClick={() => setShowPdfView(!showPdfView)}
                >
                  {showPdfView ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Switch to Edit
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      View Original PDF
                    </>
                  )}
                </Button>
                
                {/* Fullscreen Toggle Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  onClick={() => setIsFullscreenEditMode(!isFullscreenEditMode)}
                >
                  {isFullscreenEditMode ? (
                    <>
                      <Minimize className="h-4 w-4 mr-2" />
                      Exit Fullscreen
                    </>
                  ) : (
                    <>
                      <Expand className="h-4 w-4 mr-2" />
                      Fullscreen Edit
                    </>
                  )}
                </Button>
                
                {/* Page Navigation - Show for both views */}
                {!showPdfView && paginatedContent.length > 1 && (
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-600 hover:text-gray-900"
                      onClick={handlePrevEditPage}
                      disabled={currentEditPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentEditPage + 1} / {paginatedContent.length}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-600 hover:text-gray-900"
                      onClick={handleNextEditPage}
                      disabled={currentEditPage === paginatedContent.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {!showPdfView && (
                  <span className="text-sm text-gray-600 font-medium">
                    {editableContent.split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {showPdfView 
                ? 'Viewing the original PDF format. Switch to edit mode to make changes.'
                : 'Make changes below to fix issues. Navigate between pages to edit the entire document.'
              }
            </p>
          </div>

          {/* Content Area - PDF or Editor */}
          {showPdfView ? (
            /* PDF Viewer */
            <div className="px-4 pb-6 flex-1">
              {pdfUrl ? (
                <div className="w-full h-[60vh] bg-white rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
                  <embed
                    src={`${pdfUrl}#page=${currentEditPage + 1}&toolbar=0&navpanes=0&scrollbar=1`}
                    type="application/pdf"
                    className="w-full h-full"
                    style={{ border: 'none' }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[60vh] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Textarea Editor */
            <div className="px-4 pb-6 flex-1">
              <Textarea
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                className="flex-1 w-full font-mono text-sm resize-none min-h-[50vh] border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg shadow-sm p-4"
                placeholder="Document content will appear here..."
              />
            </div>
          )}

          {/* Page Navigation Thumbnails - Only show in edit mode */}
          {!showPdfView && paginatedContent.length > 1 && (
            <div className="mt-3 pt-4 border-t px-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-3">
                {paginatedContent.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleGoToEditPage(index)}
                    className={`flex-shrink-0 px-4 py-2 text-sm rounded-lg transition-all duration-200 ease-in-out ${
                      currentEditPage === index
                        ? 'bg-purple-600 text-white font-medium shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    {/* Footer Actions */}
    {!analyticsLoading && !contentAnalytics?.scannedPdf && contentAnalytics && getTotalIssues() > 0 && (
      <div className="border-t pt-5 px-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600 font-medium">
          Editing page {currentEditPage + 1} of {paginatedContent.length} • {getAllIssues().length} issue{getAllIssues().length !== 1 ? 's' : ''}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowFixIssuesDialog(false);
              setEditableContent('');
              setPaginatedContent([]);
              setCurrentEditPage(0);
            }}
            disabled={isSavingFix}
            className="text-gray-700 border-gray-300 hover:bg-gray-50 font-medium"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSaveFixedContent}
            disabled={isSavingFix}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            {isSavingFix ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving All Pages...
              </>
            ) : (
              'Save All Changes'
            )}
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
}