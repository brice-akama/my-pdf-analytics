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
import { Copy, Check, TrendingUp, Users, FileCheck } from "lucide-react"
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
const [linkSettings, setLinkSettings] = useState({
  requireEmail: false,
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
});
const [isSendingSignature, setIsSendingSignature] = useState(false);

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

// Fetch analytics when document loads
useEffect(() => {
  if (doc) {
    fetchAnalytics();
  }
}, [doc]);

  // Save notes
const handleSaveNotes = async () => {
  setIsSavingNotes(true);
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/documents/${params.id}/notes`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  if (!pdfUrl) {
    fetchPdfForPreview();
  }
};

// Handle export visits (CSV format)
const handleExportVisits = () => {
  // Create sample analytics data
  const csvContent = [
    ['Date', 'Visitor', 'Time Spent', 'Pages Viewed'],
    ['2025-01-20', 'Anonymous', '5 min', '3'],
    ['2025-01-19', 'Anonymous', '8 min', '5'],
    ['2025-01-18', 'Anonymous', '3 min', '2'],
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc?.filename}-analytics.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Handle delete
const handleDelete = async () => {
  setIsDeleting(true);
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/documents/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
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
  alert('Convert to Signable feature coming soon! This will allow you to add signature fields to your PDF.');
};

// Handle update thumbnail
const handleUpdateThumbnail = () => {
  alert('Update Thumbnail feature coming soon! This will let you choose a custom preview image.');
};

  const fetchPdfForPreview = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`/api/documents/${params.id}/file`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setTotalPages(doc?.numPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch PDF:", error);
    }
  };

  const handlePreview = () => {
    setPreviewOpen(true);
    if (!pdfUrl) {
      fetchPdfForPreview();
    }
  };

  const handleDownload = async () => {
    if (!doc) return;

    setIsDownloading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/documents/${params.id}/file`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/documents/${params.id}/share`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkSettings),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        setGeneratedLink(data.shareLink);
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
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`/api/documents/${params.id}/signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
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
  <h1 className="font-semibold text-slate-900">{doc.filename}</h1>
  {!isEditingNotes ? (
    <button
      onClick={() => setIsEditingNotes(true)}
      className="text-xs text-slate-500 hover:text-purple-600 transition-colors text-left"
    >
      {doc.notes ? `📝 ${doc.notes}` : '📝 Add a note to this document'}
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
  <DropdownMenuItem onClick={handleConvertToSignable}>
    <FileSignature className="mr-2 h-4 w-4" />
    <span>Convert to signable</span>
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
<Dialog open={presentMode} onOpenChange={setPresentMode}>
  <DialogContent className="max-w-screen-2xl w-screen h-screen p-0 bg-black">
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
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full bg-white"
            title="PDF Presentation"
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
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-white font-medium">
          1 / {doc.numPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
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
                 className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <LinkIcon className="h-4 w-4" />
                  Create link
                </Button>
                <Button
                onClick={() => setShowSignatureDialog(true)}
                variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Request signatures
                </Button>
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
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {doc.filename}
              </DialogTitle>
              <div className="flex items-center gap-2">
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
                          <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
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
          

          
          <div className="flex-1 overflow-auto bg-slate-100 p-6">
            {pdfUrl ? (
              <div className="max-w-4xl mx-auto bg-white shadow-lg">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[calc(90vh-120px)]"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading preview...</p>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t bg-white flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {doc.numPages && `${doc.numPages} pages`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Create Share Link Dialog */}
<Dialog open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}>
  <DialogContent className="max-w-2xl bg-white">
    <DialogHeader>
      <DialogTitle className="text-xl">Create a shareable link</DialogTitle>
    </DialogHeader>
    
    {!generatedLink ? (
      <div className="space-y-6 py-4">
        {/* Link Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Require email to view</Label>
              <p className="text-sm text-slate-500">Viewers must enter their email before accessing</p>
            </div>
            <Switch
              checked={linkSettings.requireEmail}
              onCheckedChange={(checked) => 
                setLinkSettings({ ...linkSettings, requireEmail: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Allow download</Label>
              <p className="text-sm text-slate-500">Let viewers download the PDF</p>
            </div>
            <Switch
              checked={linkSettings.allowDownload}
              onCheckedChange={(checked) => 
                setLinkSettings({ ...linkSettings, allowDownload: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Notify on view</Label>
              <p className="text-sm text-slate-500">Get email when someone views the document</p>
            </div>
            <Switch
              checked={linkSettings.notifyOnView}
              onCheckedChange={(checked) => 
                setLinkSettings({ ...linkSettings, notifyOnView: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Link expires in</Label>
            <select
              id="expires"
              value={linkSettings.expiresIn}
              onChange={(e) => 
                setLinkSettings({ ...linkSettings, expiresIn: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password protection (optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={linkSettings.password}
              onChange={(e) => 
                setLinkSettings({ ...linkSettings, password: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowCreateLinkDialog(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateLink}
            disabled={isGeneratingLink}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGeneratingLink ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Generating...
              </>
            ) : (
              'Create Link'
            )}
          </Button>
        </div>
      </div>
    ) : (
      <div className="space-y-6 py-4">
        {/* Link Generated Success */}
        <div className="text-center py-6">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Your link is ready!
          </h3>
          <p className="text-slate-600">
            Share this link to give others access to your document
          </p>
        </div>

        {/* Generated Link */}
        <div className="space-y-3">
          <Label>Shareable Link</Label>
          <div className="flex gap-2">
            <Input
              value={generatedLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="gap-2"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
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

        {/* Link Settings Summary */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm text-slate-900">Link Settings:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            {linkSettings.requireEmail && <li>✓ Email required to view</li>}
            {linkSettings.allowDownload && <li>✓ Download enabled</li>}
            {linkSettings.notifyOnView && <li>✓ View notifications enabled</li>}
            {linkSettings.password && <li>✓ Password protected</li>}
            <li>✓ Expires in {linkSettings.expiresIn === 'never' ? 'never' : `${linkSettings.expiresIn} days`}</li>
          </ul>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-3">
          <Label>Share via</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`mailto:?subject=${encodeURIComponent(doc.filename)}&body=${encodeURIComponent('View this document: ' + generatedLink)}`)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this document: ' + generatedLink)}`)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(generatedLink)}`)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            onClick={() => setShowCreateLinkDialog(false)}
          >
            Done
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

{/* Request Signature Dialog - IMPROVED DESIGN */}
<Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
  <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-white">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">Request eSignature</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Recipient Info */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="recipientEmail" className="text-sm font-medium">Recipient Email *</Label>
          <Input
            id="recipientEmail"
            type="email"
            placeholder="recipient@example.com"
            value={signatureRequest.recipientEmail}
            onChange={(e) => 
              setSignatureRequest({ ...signatureRequest, recipientEmail: e.target.value })
            }
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recipientName" className="text-sm font-medium">Recipient Name *</Label>
          <Input
            id="recipientName"
            placeholder="John Doe"
            value={signatureRequest.recipientName}
            onChange={(e) => 
              setSignatureRequest({ ...signatureRequest, recipientName: e.target.value })
            }
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate" className="text-sm font-medium">Due Date (optional)</Label>
          <Input
            id="dueDate"
            type="date"
            value={signatureRequest.dueDate}
            onChange={(e) => 
              setSignatureRequest({ ...signatureRequest, dueDate: e.target.value })
            }
            min={new Date().toISOString().split('T')[0]}
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="message" className="text-sm font-medium">Message (optional)</Label>
          <Textarea
            id="message"
            placeholder="Please review and sign..."
            rows={3}
            value={signatureRequest.message}
            onChange={(e) => 
              setSignatureRequest({ ...signatureRequest, message: e.target.value })
            }
            className="text-sm resize-none"
          />
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <h4 className="font-medium text-xs text-slate-900 mb-2">Document:</h4>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-slate-900 truncate">{doc.filename}</p>
            <p className="text-xs text-slate-500">{doc.numPages} pages</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex gap-2">
          <div className="flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
              <FileSignature className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 text-xs mb-1">What happens next?</h4>
            <ul className="text-xs text-blue-800 space-y-0.5">
              <li>• Recipient gets email with signing link</li>
              <li>• You're notified when they sign</li>
              <li>• Completed document sent to you</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-3 border-t">
        <Button
          variant="outline"
          onClick={() => {
            setShowSignatureDialog(false);
            setSignatureRequest({
              recipientEmail: '',
              recipientName: '',
              message: '',
              dueDate: '',
            });
          }}
          disabled={isSendingSignature}
          className="text-sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSendSignatureRequest}
          disabled={isSendingSignature || !signatureRequest.recipientEmail || !signatureRequest.recipientName}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-sm"
        >
          {isSendingSignature ? (
            <>
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-3.5 w-3.5 mr-2" />
              Send Request
            </>
          )}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}