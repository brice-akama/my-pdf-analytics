"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { 
  ArrowLeft, Download, Clock, FileText, ChevronRight, 
  RotateCcw, Trash2, Eye, TrendingUp, Users, 
  History, Upload, Check, AlertCircle, ChevronLeft, X, Shield,
  MoreVertical, Calendar, FileCheck, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

type ExpiryStatus = 'active' | 'expiring_soon' | 'expired' | 'superseded';

type VersionWithExpiry = Version & {
  expiryDate?: string;
  expiryReason?: string;
  status?: ExpiryStatus;
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
  const [showExpiryDialog, setShowExpiryDialog] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryReason, setExpiryReason] = useState('');
  const [settingExpiry, setSettingExpiry] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  // Mobile sidebar state (same pattern as doc/[id]/page.tsx)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, [params.id]);

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

  const handleSetExpiry = async () => {
    if (!selectedVersion) return;
    setSettingExpiry(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/expiry`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: selectedVersion._id,
          expiryDate: expiryDate || null,
          reason: expiryReason || null
        })
      });
      if (res.ok) {
        toast.success(expiryDate ? 'Expiry date set successfully' : 'Expiry date removed');
        setShowExpiryDialog(false);
        setExpiryDate('');
        setExpiryReason('');
        fetchVersions();
      } else {
        toast.error('Failed to set expiry date');
      }
    } catch (error) {
      console.error('Set expiry error:', error);
      toast.error('Failed to set expiry date');
    } finally {
      setSettingExpiry(false);
    }
  };

  const getExpiryStatus = (version: VersionWithExpiry): ExpiryStatus => {
    if (!version.expiryDate) return 'active';
    const now = new Date();
    const expiry = new Date(version.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'active';
  };

  const getExpiryBadge = (version: VersionWithExpiry) => {
    const status = getExpiryStatus(version);
    if (!version.expiryDate) return null;
    const badges = {
      expired: { bg: 'bg-red-100 border-red-300 text-red-800', icon: '🔴', text: 'Expired' },
      expiring_soon: { bg: 'bg-amber-100 border-amber-300 text-amber-800', icon: '⚠️', text: 'Expiring Soon' },
      active: { bg: 'bg-green-100 border-green-300 text-green-800', icon: '✅', text: 'Active' },
      superseded: { bg: 'bg-gray-100 border-gray-300 text-gray-800', icon: '📦', text: 'Superseded' },
    };
    const badge = badges[status];
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}>
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </div>
    );
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
    if (daysUntilExpiry === 0) return 'Expires today';
    if (daysUntilExpiry === 1) return 'Expires tomorrow';
    if (daysUntilExpiry <= 30) return `Expires in ${daysUntilExpiry} days (${formattedDate})`;
    return `Valid until ${formattedDate}`;
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
      const res = await fetch(`/api/documents/${params.id}/versions/download?versionId=${version._id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        if (res.status === 403 && error.expiryDate) {
          toast.error('Cannot Download Expired Version', {
            description: error.message || 'This version has expired and cannot be downloaded',
            duration: 5000,
          });
          throw new Error('Version expired');
        }
        throw new Error(error.error || 'Download failed');
      }
      const blob = await res.blob();
      if (typeof window === 'undefined') throw new Error('Download must be triggered from browser');
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${version.filename.replace(/\.[^/.]+$/, '')}_v${version.version}.pdf`;
      a.style.display = 'none';
      window.document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      toast.success(`Version ${version.version} downloaded!`, { id: downloadToast });
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download', { id: downloadToast });
    }
  };

  const handleView = (version: Version) => {
    setPreviewVersion(version);
    setPreviewPage(1);
    setTotalPages(version.numPages);
    setShowPreviewDrawer(true);
    setPreviewLoading(true);
    setTimeout(() => setPreviewLoading(false), 2000);
  };

  const handleUpdateNote = async () => {
    if (!selectedVersion) return;
    try {
      const res = await fetch(`/api/documents/${params.id}/versions/note`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: selectedVersion._id, changeLog })
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
      toast.error('Failed to update note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-slate-600 font-medium text-sm">Loading version history...</p>
        </div>
      </div>
    );
  }

  const allVersions = currentVersion ? [currentVersion, ...versions] : versions;

  return (
    <div className="min-h-screen bg-white">

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
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-[280px] bg-white z-[70] md:hidden flex flex-col shadow-2xl"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <History className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[160px]">Version History</p>
                    <p className="text-[11px] text-slate-400">{allVersions.length} versions</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">

                {/* Doc info */}
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Document</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{document?.filename}</p>
                  {currentVersion && (
                    <p className="text-xs text-slate-400 mt-1">Current: v{currentVersion.version} · {formatSize(currentVersion.size)}</p>
                  )}
                </div>

                {/* Version stats */}
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Stats</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Total Versions', value: allVersions.length, color: 'text-purple-600' },
                      { label: 'Total Views', value: allVersions.reduce((s, v) => s + v.analytics.views, 0), color: 'text-sky-600' },
                      { label: 'Total Downloads', value: allVersions.reduce((s, v) => s + v.analytics.downloads, 0), color: 'text-emerald-600' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{s.label}</span>
                        <span className={`text-sm font-black tabular-nums ${s.color}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Actions</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => { router.push(`/documents/${params.id}`); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      View Document
                    </button>
                    <Link href="/compliance" onClick={() => setMobileMenuOpen(false)}>
                      <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors">
                        <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        View All Expired Docs
                      </div>
                    </Link>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── EXPIRY WARNING BANNER ── */}
      {currentVersion && (currentVersion as VersionWithExpiry).expiryDate &&
        getExpiryStatus(currentVersion as VersionWithExpiry) !== 'active' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 text-white px-4 py-3"
        >
          <div className="max-w-6xl mx-auto flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">⚠️ This Document Has Expired</p>
              <p className="text-xs text-red-100 mt-0.5">
                {formatExpiryDate((currentVersion as VersionWithExpiry).expiryDate!)}
                {(currentVersion as VersionWithExpiry).expiryReason && ` · ${(currentVersion as VersionWithExpiry).expiryReason}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── HEADER ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">

            {/* LEFT */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => router.push(`/documents/${params.id}`)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {/* Icon + title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                  <History className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 leading-tight">Version History</h1>
                  <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-[300px]">{document?.filename}</p>
                </div>
              </div>
            </div>

            {/* RIGHT — Desktop */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <Link href="/compliance">
                <Button variant="outline" size="sm" className="gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  View All Expired Docs
                </Button>
              </Link>
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                <p className="text-sm font-semibold text-purple-900 whitespace-nowrap">
                  {allVersions.length} Version{allVersions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* RIGHT — Mobile: version count pill + hamburger */}
            <div className="flex md:hidden items-center gap-2 flex-shrink-0">
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5">
                <p className="text-xs font-semibold text-purple-900 whitespace-nowrap">
                  {allVersions.length} v{allVersions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* ── STATS BAR (mobile only quick glance) ── */}
        <div className="flex md:hidden items-center gap-0 divide-x divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl mb-4 overflow-hidden">
          {[
            { label: 'Versions', value: allVersions.length, color: 'text-purple-600' },
            { label: 'Views', value: allVersions.reduce((s, v) => s + v.analytics.views, 0), color: 'text-sky-600' },
            { label: 'Downloads', value: allVersions.reduce((s, v) => s + v.analytics.downloads, 0), color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="flex-1 px-3 py-3 text-center">
              <div className={`text-lg font-black tabular-nums ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── CURRENT VERSION BANNER ── */}
        {currentVersion && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-4 sm:mb-8 text-white shadow-xl"
          >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3 sm:gap-5 flex-1 min-w-0">
                {/* Icon */}
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-base sm:text-xl font-bold">Current Version</h2>
                    <span className="px-2.5 py-0.5 bg-white/30 text-white text-xs sm:text-sm font-bold rounded-full flex-shrink-0">
                      v{currentVersion.version}
                    </span>
                    {(currentVersion as VersionWithExpiry).expiryDate && getExpiryBadge(currentVersion as VersionWithExpiry)}
                  </div>

                  <p className="text-white/90 text-xs sm:text-sm mb-3 truncate">{currentVersion.filename}</p>

                  {/* Stats grid — 2 cols on mobile, row on desktop */}
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-6 text-white/80 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatDate(currentVersion.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{formatSize(currentVersion.size)} · {currentVersion.numPages}p</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{currentVersion.analytics.views} views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{currentVersion.analytics.downloads} downloads</span>
                    </div>
                  </div>

                  {/* Uploader */}
                  <div className="flex items-center gap-2 mt-3">
                    {currentVersion.uploaderAvatar ? (
                      <img
                        src={currentVersion.uploaderAvatar}
                        alt={currentVersion.uploaderName}
                        className="h-6 w-6 rounded-full border-2 border-white/50 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white/50 flex-shrink-0">
                        {getInitials(currentVersion.uploaderName)}
                      </div>
                    )}
                    <div className="text-xs min-w-0">
                      <span className="font-medium text-white truncate">{currentVersion.uploaderName}</span>
                      <span className="text-white/60 ml-1.5 truncate hidden sm:inline">{currentVersion.uploaderEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* View doc button */}
              <Button
                onClick={() => router.push(`/documents/${params.id}`)}
                className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg w-full sm:w-auto text-sm flex-shrink-0"
                size="sm"
              >
                View Document
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── VERSION TIMELINE ── */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-xl font-bold text-slate-900">Version Timeline</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {versions.length} previous version{versions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {versions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-10 sm:p-16 text-center"
            >
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <History className="h-7 w-7 sm:h-10 sm:w-10 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2">No Previous Versions</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                This is the first version. When you upload a new version, previous versions will appear here.
              </p>
            </motion.div>
          ) : (
            <div className="relative">
              {/* Timeline line — desktop only */}
              <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 via-blue-200 to-transparent" />

              <div className="space-y-3 sm:space-y-6">
                {versions.map((version, index) => (
                  <motion.div
                    key={version._id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline dot — desktop only */}
                    <div className="hidden md:block absolute left-8 top-5 h-4 w-4 rounded-full bg-white border-4 border-purple-500 shadow-lg transform -translate-x-1/2" />

                    <div className="md:ml-20 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200 overflow-hidden group">
                      <div className="p-4 sm:p-6">

                        {/* ── TOP ROW: version badge + filename + expiry + actions menu ── */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg flex-shrink-0">
                              v{version.version}
                            </span>
                            {getExpiryBadge(version as VersionWithExpiry)}
                            <h3 className="font-semibold text-slate-900 text-sm truncate min-w-0">{version.filename}</h3>
                          </div>

                          {/* ── 3-DOT MENU (mobile) / action buttons (desktop) ── */}
                          <div className="flex-shrink-0">
                            {/* Desktop action buttons */}
                            <div className="hidden sm:flex flex-col gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleView(version)} className="gap-2 text-xs w-full justify-start">
                                <Eye className="h-3.5 w-3.5" />View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDownload(version)} className="gap-2 text-xs w-full justify-start">
                                <Download className="h-3.5 w-3.5" />Download
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedVersion(version); setShowRestoreDialog(true); }} className="gap-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 w-full justify-start">
                                <RotateCcw className="h-3.5 w-3.5" />Restore
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedVersion(version); setExpiryDate((version as VersionWithExpiry).expiryDate?.split('T')[0] || ''); setExpiryReason((version as VersionWithExpiry).expiryReason || ''); setShowExpiryDialog(true); }} className="gap-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full justify-start">
                                <Clock className="h-3.5 w-3.5" />Expiry
                              </Button>
                            </div>

                            {/* Mobile 3-dot dropdown */}
                            <div className="sm:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 bg-white shadow-lg border border-slate-200">
                                  <DropdownMenuItem onClick={() => handleView(version)}>
                                    <Eye className="mr-2 h-4 w-4" /><span>View</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownload(version)}>
                                    <Download className="mr-2 h-4 w-4" /><span>Download</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedVersion(version); setShowRestoreDialog(true); }} className="text-purple-600 focus:text-purple-600 focus:bg-purple-50">
                                    <RotateCcw className="mr-2 h-4 w-4" /><span>Restore</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedVersion(version); setExpiryDate((version as VersionWithExpiry).expiryDate?.split('T')[0] || ''); setExpiryReason((version as VersionWithExpiry).expiryReason || ''); setShowExpiryDialog(true); }} className="text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                                    <Clock className="mr-2 h-4 w-4" /><span>Set Expiry</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { setSelectedVersion(version); setChangeLog(version.changeLog || ''); setShowEditNoteDialog(true); }}>
                                    <FileCheck className="mr-2 h-4 w-4" /><span>{version.changeLog ? 'Edit Note' : 'Add Note'}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        {/* ── STATS GRID ── */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{formatDate(version.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{formatSize(version.size)} · {version.numPages}p</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{version.analytics.views} views</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Download className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span>{version.analytics.downloads} downloads</span>
                          </div>
                        </div>

                        {/* ── UPLOADER ROW ── */}
                        <div className="flex items-center gap-2 mb-3">
                          {version.uploaderAvatar ? (
                            <img src={version.uploaderAvatar} alt={version.uploaderName} className="h-6 w-6 rounded-full border-2 border-slate-200 flex-shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-semibold border-2 border-purple-200 flex-shrink-0">
                              {getInitials(version.uploaderName)}
                            </div>
                          )}
                          <div className="text-xs min-w-0">
                            <span className="font-medium text-slate-800 truncate">{version.uploaderName}</span>
                            <span className="text-slate-400 ml-1.5 hidden sm:inline truncate">{version.uploaderEmail}</span>
                          </div>
                        </div>

                        {/* ── EXPIRY INFO ── */}
                        {(version as VersionWithExpiry).expiryDate && (
                          <div className="mb-3 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                            <Calendar className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800">
                              <span className="font-semibold">{formatExpiryDate((version as VersionWithExpiry).expiryDate!)}</span>
                              {(version as VersionWithExpiry).expiryReason && (
                                <span className="text-amber-700 ml-1.5">· {(version as VersionWithExpiry).expiryReason}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── CHANGELOG NOTE ── */}
                        {version.changeLog ? (
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs text-blue-900 flex-1">
                                <strong>📝</strong> {version.changeLog}
                              </p>
                              <button
                                onClick={() => { setSelectedVersion(version); setChangeLog(version.changeLog || ''); setShowEditNoteDialog(true); }}
                                className="text-blue-600 hover:text-blue-700 text-[11px] font-semibold flex-shrink-0 hidden sm:block"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setSelectedVersion(version); setChangeLog(''); setShowEditNoteDialog(true); }}
                            className="hidden sm:flex text-xs text-purple-600 hover:text-purple-700 items-center gap-1"
                          >
                            <span className="text-lg leading-none">+</span> Add note
                          </button>
                        )}

                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PREVIEW DRAWER ── */}
      <Drawer open={showPreviewDrawer} onOpenChange={setShowPreviewDrawer}>
        <motion.div className="h-[100vh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Header */}
          <div className="sticky top-0 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-white">
                    Version {previewVersion?.version}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 truncate max-w-[180px] sm:max-w-none">
                    {previewVersion?.filename}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => previewVersion && handleDownload(previewVersion)} className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl">
                  <Download className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowPreviewDrawer(false)} className="text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden p-4 sm:p-8 flex items-center justify-center bg-slate-900">
            <AnimatePresence mode="wait">
              {previewLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-300 font-medium">Loading preview...</p>
                </motion.div>
              ) : previewVersion ? (
                <motion.div key="pdf" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full max-w-6xl bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
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

          {/* Footer pill */}
          {previewVersion && !previewLoading && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl px-6 py-3 shadow-2xl border border-slate-700/50">
                <span className="text-white font-medium text-sm whitespace-nowrap">
                  v{previewVersion.version} · {previewVersion.numPages} pages · {formatSize(previewVersion.size)}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </Drawer>

      {/* ── RESTORE DIALOG ── */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-lg mx-4 bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Restore Version {selectedVersion?.version}?</DialogTitle>
            <DialogDescription>
              This will make v{selectedVersion?.version} the current version. The current version will be saved to history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">What will happen:</p>
                  <ul className="space-y-1 ml-4 list-disc text-xs">
                    <li>Version {selectedVersion?.version} becomes current</li>
                    <li>Current v{currentVersion?.version} saved to history</li>
                    <li>New version number: v{(currentVersion?.version || 0) + 1}</li>
                    <li>All previous versions remain accessible</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Add a note (optional)</Label>
              <Textarea value={changeLog} onChange={(e) => setChangeLog(e.target.value)} placeholder="e.g., Restored to fix formatting issues" rows={3} className="resize-none" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowRestoreDialog(false); setChangeLog(''); }} disabled={restoring}>Cancel</Button>
            <Button onClick={handleRestore} disabled={restoring} className="bg-purple-600 hover:bg-purple-700">
              {restoring ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />Restoring...</>
              ) : (
                <><RotateCcw className="h-4 w-4 mr-2" />Restore Version</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDIT NOTE DIALOG ── */}
      <Dialog open={showEditNoteDialog} onOpenChange={setShowEditNoteDialog}>
        <DialogContent className="max-w-md mx-4 bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Version Note</DialogTitle>
            <DialogDescription>Add or update notes for version {selectedVersion?.version}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium mb-2 block">Version Note</Label>
            <Textarea value={changeLog} onChange={(e) => setChangeLog(e.target.value)} placeholder="e.g., Updated pricing section, Fixed typos" rows={4} className="resize-none" maxLength={500} />
            <p className="text-xs text-slate-400 mt-1 text-right">{changeLog.length}/500</p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowEditNoteDialog(false); setChangeLog(''); }}>Cancel</Button>
            <Button onClick={handleUpdateNote} className="bg-purple-600 hover:bg-purple-700">Save Note</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── SET EXPIRY DIALOG ── */}
      <Dialog open={showExpiryDialog} onOpenChange={setShowExpiryDialog}>
        <DialogContent className="max-w-md mx-4 bg-white rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Set Expiry Date</DialogTitle>
            <DialogDescription>Set when version {selectedVersion?.version} should expire</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>💡 Why set expiry dates?</strong><br />
                Prevent use of outdated contracts · Ensure compliance · Legal audit trail
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Expiry Date (Optional)</Label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              <p className="text-xs text-slate-400 mt-1">Leave empty to remove expiry date</p>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Reason (Optional)</Label>
              <Textarea value={expiryReason} onChange={(e) => setExpiryReason(e.target.value)} placeholder="e.g., New pricing takes effect, Legal requirements changed" rows={3} className="resize-none text-sm" maxLength={200} />
              <p className="text-xs text-slate-400 mt-1 text-right">{expiryReason.length}/200</p>
            </div>
            {expiryDate && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-900">
                  <strong>⏰ You'll be notified</strong> 30 days, 7 days, and on the expiry date.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => { setShowExpiryDialog(false); setExpiryDate(''); setExpiryReason(''); }} disabled={settingExpiry}>Cancel</Button>
            <Button onClick={handleSetExpiry} disabled={settingExpiry} className="bg-blue-600 hover:bg-blue-700">
              {settingExpiry ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />Setting...</>
              ) : (
                <><Clock className="h-4 w-4 mr-2" />{expiryDate ? 'Set Expiry' : 'Remove Expiry'}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}