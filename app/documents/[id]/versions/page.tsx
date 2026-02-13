"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Download, Clock, FileText, ChevronRight, 
  RotateCcw, Trash2, Eye, TrendingUp, Users, 
  History, Upload, Check, AlertCircle, ChevronLeft, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Version = {
  _id: string;
  version: number;
  filename: string;
  size: number;
  numPages: number;
  cloudinaryPdfUrl: string;
  cloudinaryOriginalUrl: string;
  createdAt: string;
  uploadedBy: string;
  uploaderName: string;
  uploaderEmail: string;
  uploaderAvatar: string | null;
  changeLog?: string;
  isCurrent?: boolean;
  analytics: {
    views: number;
    downloads: number;
  };
};

export default function VersionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [document, setDocument] = useState<any>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [changeLog, setChangeLog] = useState('');
  const [showEditNoteDialog, setShowEditNoteDialog] = useState(false);
  
  // Preview Drawer States
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchVersions();
  }, [params.id]);

  // ✅ Hide loading when preview drawer opens
useEffect(() => {
  if (showPreviewDrawer && previewVersion) {
    const timer = setTimeout(() => {
      setPreviewLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }
}, [showPreviewDrawer, previewVersion]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}/versions`, {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentVersion(data.currentVersion);
        setVersions(data.versions);
        setDocument(data.document);
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;
    
    setRestoring(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/versions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: selectedVersion._id,
          changeLog: changeLog || `Restored version ${selectedVersion.version}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Version ${selectedVersion.version} restored successfully!`, {
          description: `Now at version ${data.newVersion}`
        });
        setShowRestoreDialog(false);
        setChangeLog('');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Failed to restore version');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const handleDownload = async (version: Version) => {
  const downloadToast = toast.loading(`Downloading version ${version.version}...`);
  
  try {
    console.log('🔽 Starting download for version:', version.version);
    
    const res = await fetch(`/api/documents/${params.id}/versions/download?versionId=${version._id}`, {
      credentials: 'include',
    });
    
    console.log('📡 Download response status:', res.status);
    
    if (!res.ok) {
      const error = await res.json();
      console.error('❌ Download failed:', error);
      throw new Error(error.error || 'Download failed');
    }
    
    const blob = await res.blob();
    console.log('💾 Blob received:', blob.size, 'bytes');
    
    // ✅ FIX: Check if we're in browser before using window/document
    if (typeof window === 'undefined') {
      throw new Error('Download must be triggered from browser');
    }
    
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a'); // ✅ Use window.document
    a.href = url;
    a.download = `${version.filename.replace(/\.[^/.]+$/, '')}_v${version.version}.pdf`;
    a.style.display = 'none';
    window.document.body.appendChild(a);
    a.click();
    
    // ✅ Cleanup after a short delay
    setTimeout(() => {
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    console.log('✅ Download successful');
    toast.success(`Version ${version.version} downloaded!`, { id: downloadToast });
    
  } catch (error) {
    console.error('❌ Download error:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to download', { id: downloadToast });
  }
};

   const handleView = (version: Version) => {
  setPreviewVersion(version);
  setPreviewPage(1);
  setTotalPages(version.numPages);
  setShowPreviewDrawer(true);
  setPreviewLoading(true);
  
  // ✅ Auto-hide loading after 2 seconds (PDF should be loaded by then)
  setTimeout(() => {
    setPreviewLoading(false);
  }, 2000);
};

  const handleUpdateNote = async () => {
    if (!selectedVersion) return;
    
    try {
      const res = await fetch(`/api/documents/${params.id}/versions/note`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: selectedVersion._id,
          changeLog: changeLog
        })
      });

      if (res.ok) {
        toast.success('Note updated successfully');
        setShowEditNoteDialog(false);
        setChangeLog('');
        fetchVersions();
      } else {
        toast.error('Failed to update note');
      }
    } catch (error) {
      console.error('Update note error:', error);
      toast.error('Failed to update note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium">Loading version history...</p>
        </div>
      </div>
    );
  }

  const allVersions = currentVersion ? [currentVersion, ...versions] : versions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header - Mobile Responsive */}
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/documents/${params.id}`)}
                className="hover:bg-purple-50 flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <History className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-slate-900 text-sm md:text-base truncate">Version History</h1>
                  <p className="text-xs md:text-sm text-slate-500 truncate">{document?.filename}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-2 md:px-4 py-1.5 md:py-2">
                <p className="text-xs md:text-sm font-medium text-purple-900 whitespace-nowrap">
                  {allVersions.length} Version{allVersions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Current Version Banner - Mobile Responsive */}
        {currentVersion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8 text-white shadow-2xl"
          >
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 md:gap-6 flex-1 min-w-0">
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <h2 className="text-lg md:text-2xl font-bold">Current Version</h2>
                    <span className="px-3 py-1 bg-white/30 backdrop-blur-sm text-white text-sm font-bold rounded-full flex-shrink-0">
                      v{currentVersion.version}
                    </span>
                  </div>
                  <p className="text-white/90 mb-3 md:mb-4 text-sm md:text-base break-all">{currentVersion.filename}</p>
                  
                  <div className="grid grid-cols-2 md:flex md:items-center gap-3 md:gap-6 text-white/80 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(currentVersion.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span>{formatSize(currentVersion.size)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 flex-shrink-0" />
                      <span>{currentVersion.analytics.views} views</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 flex-shrink-0" />
                      <span>{currentVersion.analytics.downloads} downloads</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 mt-4">
                    {currentVersion.uploaderAvatar ? (
                      <img 
                        src={currentVersion.uploaderAvatar} 
                        alt={currentVersion.uploaderName}
                        className="h-6 w-6 md:h-8 md:w-8 rounded-full border-2 border-white/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-white text-xs md:text-sm font-semibold border-2 border-white/50 flex-shrink-0">
                        {getInitials(currentVersion.uploaderName)}
                      </div>
                    )}
                    <div className="text-xs md:text-sm min-w-0">
                      <p className="font-medium text-white truncate">Uploaded by {currentVersion.uploaderName}</p>
                      <p className="text-white/70 truncate">{currentVersion.uploaderEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push(`/documents/${params.id}`)}
                className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg w-full md:w-auto text-sm md:text-base"
              >
                View Document
              </Button>
            </div>
          </motion.div>
        )}

        {/* Version Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Version Timeline</h2>
            <p className="text-sm text-slate-500">
              {versions.length} previous version{versions.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {versions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <History className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Previous Versions</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                This is the first version of this document. When you upload a new version, 
                previous versions will appear here.
              </p>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Timeline Line - Hidden on mobile */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-transparent" />

              <div className="space-y-6">
                {versions.map((version, index) => (
                  <motion.div
                    key={version._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline Dot - Hidden on mobile */}
                    <div className="hidden md:block absolute left-8 top-6 h-4 w-4 rounded-full bg-white border-4 border-purple-500 shadow-lg transform -translate-x-1/2" />

                    <div className="md:ml-20 bg-white rounded-lg md:rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-xl transition-all duration-200 overflow-hidden group">
                      <div className="p-4 md:p-6">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-3 md:gap-4">
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                              <span className="px-2 md:px-3 py-1 bg-slate-100 text-slate-700 text-xs md:text-sm font-bold rounded-lg flex-shrink-0">
                                v{version.version}
                              </span>
                              <h3 className="font-semibold text-slate-900 text-sm md:text-base break-all">{version.filename}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-4 text-xs md:text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="h-3 w-3 md:h-4 md:w-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{formatDate(version.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <FileText className="h-3 w-3 md:h-4 md:w-4 text-slate-400 flex-shrink-0" />
                                <span>{formatSize(version.size)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Eye className="h-3 w-3 md:h-4 md:w-4 text-slate-400 flex-shrink-0" />
                                <span>{version.analytics.views} views</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Download className="h-3 w-3 md:h-4 md:w-4 text-slate-400 flex-shrink-0" />
                                <span>{version.analytics.downloads} downloads</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                              {version.uploaderAvatar ? (
                                <img 
                                  src={version.uploaderAvatar} 
                                  alt={version.uploaderName}
                                  className="h-6 w-6 md:h-8 md:w-8 rounded-full border-2 border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs md:text-sm font-semibold border-2 border-purple-200 flex-shrink-0">
                                  {getInitials(version.uploaderName)}
                                </div>
                              )}
                              <div className="text-xs md:text-sm min-w-0 flex-1">
                                <p className="font-medium text-slate-900 truncate">{version.uploaderName}</p>
                                <p className="text-slate-500 truncate">{version.uploaderEmail}</p>
                              </div>
                            </div>

                            {version.changeLog && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs md:text-sm text-blue-900 flex-1">
                                    <strong>📝 Note:</strong> {version.changeLog}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setSelectedVersion(version);
                                      setChangeLog(version.changeLog || '');
                                      setShowEditNoteDialog(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 text-xs flex-shrink-0"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                            )}

                            {!version.changeLog && (
                              <button
                                onClick={() => {
                                  setSelectedVersion(version);
                                  setChangeLog('');
                                  setShowEditNoteDialog(true);
                                }}
                                className="mt-2 text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add note
                              </button>
                            )}
                          </div>

                          {/* Action Buttons - Mobile Responsive */}
                          <div className="flex md:flex-col flex-row flex-wrap gap-2 w-full md:w-auto mt-3 md:mt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(version)}
                              className="gap-1 md:gap-2 flex-1 md:flex-none text-xs md:text-sm"
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4" />
                              <span>View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(version)}
                              className="gap-1 md:gap-2 flex-1 md:flex-none text-xs md:text-sm"
                            >
                              <Download className="h-3 w-3 md:h-4 md:w-4" />
                              <span>Download</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedVersion(version);
                                setShowRestoreDialog(true);
                              }}
                              className="gap-1 md:gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex-1 md:flex-none text-xs md:text-sm"
                            >
                              <RotateCcw className="h-3 w-3 md:h-4 md:w-4" />
                              <span>Restore</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Drawer */}
      <Drawer open={showPreviewDrawer} onOpenChange={setShowPreviewDrawer}>
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
                    Version {previewVersion?.version}
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {previewVersion?.filename}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => previewVersion && handleDownload(previewVersion)}
                    className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPreviewDrawer(false)}
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
              {previewLoading ? (
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
                  <p className="text-slate-300 font-medium">Loading preview...</p>
                </motion.div>
              ) : previewVersion ? (
                <motion.div
                  key="pdf"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full h-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                  <iframe
  src={`/api/documents/${params.id}/versions/view?versionId=${previewVersion._id}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
  className="w-full h-full"
  style={{ border: 'none' }}
  title="Version Preview"
/>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Page Navigation */}
          {previewVersion && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <div className="flex items-center gap-4 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-8 py-4 shadow-2xl border border-slate-700/50">
                <span className="text-white font-medium text-sm">
                  Version {previewVersion.version} • {previewVersion.numPages} pages
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Drawer>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-lg mx-4 bg-white scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 rounded-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Restore Version {selectedVersion?.version}?</DialogTitle>
            <DialogDescription>
              This will make version {selectedVersion?.version} the current version. 
              The current version will be saved to history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">What will happen:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Version {selectedVersion?.version} becomes the current version</li>
                    <li>Current version (v{currentVersion?.version}) saved to history</li>
                    <li>New version number created (v{(currentVersion?.version || 0) + 1})</li>
                    <li>All previous versions remain accessible</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Add a note (optional)
              </Label>
              <Textarea
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                placeholder="e.g., Restored to fix formatting issues"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowRestoreDialog(false);
                setChangeLog('');
              }}
              disabled={restoring}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={restoring}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {restoring ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Version
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
        <DialogContent className="max-w-md mx-4 bg-white rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Version Note</DialogTitle>
            <DialogDescription>
              Add or update notes for version {selectedVersion?.version}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">
              Version Note
            </Label>
            <Textarea
              value={changeLog}
              onChange={(e) => setChangeLog(e.target.value)}
              placeholder="e.g., Updated pricing section, Fixed typos, Client feedback incorporated"
              rows={4}
              className="resize-none"
              maxLength={500}
            />
            <p className="text-xs text-slate-500 mt-1">
              {changeLog.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditNoteDialog(false);
                setChangeLog('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNote}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Save Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}