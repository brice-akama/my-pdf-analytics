"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

type DocumentType = {
  _id: string;
  filename: string;
  size: number;
  numPages: number;
  createdAt: string;
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

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  const fetchDocument = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/documents/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDoc(data.document);
        }
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
    } finally {
      setLoading(false);
    }
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
                  <p className="text-xs text-slate-500">
                    📝 Add a note to this document
                  </p>
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
                  <DropdownMenuItem>
                    <Presentation className="mr-2 h-4 w-4" />
                    <span>Present</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Export visits</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Update thumbnail</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
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
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <LinkIcon className="h-4 w-4" />
                  Create link
                </Button>
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Request signatures
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <BarChart3 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No performance data yet</h3>
            <p className="text-slate-600 mb-6">Share your document to start tracking performance</p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Share Document
            </Button>
          </div>
        )}

        {activeTab === 'utilization' && (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No utilization data yet</h3>
            <p className="text-slate-600 mb-6">Share your document to see how it's being used</p>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              Share Document
            </Button>
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
    </div>
  );
}