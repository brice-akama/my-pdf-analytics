"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Clock, Edit, X, LinkIcon, Mail, FileSignature,
  Eye, Presentation, Upload, Download, Shield, ImageIcon,
  Users, Trash2,
} from "lucide-react";

type DocumentType = {
  _id: string;
  filename: string;
  createdAt: string;
  notes?: string;
  thumbnail?: string;
  isTemplate?: boolean;
  ownerEmail?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  doc: DocumentType;
  liveViewerCount: number;
  notes: string;
  setNotes: (notes: string) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (v: boolean) => void;
  isSavingNotes: boolean;
  onSaveNotes: () => void;
  isDownloading: boolean;
  onPreview: () => void;
  onPresent: () => void;
  onDownload: () => void;
  onExportVisits: () => void;
  onUpdateThumbnail: () => void;
  onOpenLinkDrawer: (type: "public" | "email-gated") => void;
  onDelete: () => void;
  router: any;
  formatTimeAgo: (date: string) => string;
};

export default function MobileSidebar({
  open, onClose, doc, liveViewerCount,
  notes, setNotes, isEditingNotes, setIsEditingNotes,
  isSavingNotes, onSaveNotes, isDownloading,
  onPreview, onPresent, onDownload, onExportVisits,
  onUpdateThumbnail, onOpenLinkDrawer, onDelete,
  router, formatTimeAgo,
}: Props) {
  const actions = [
    { icon: Eye, label: "Preview", onClick: () => { onPreview(); onClose(); } },
    { icon: Presentation, label: "Present", onClick: () => { onPresent(); onClose(); } },
    {
      icon: Upload, label: "Upload new version",
      onClick: () => { document.getElementById("upload-new-version-input")?.click(); onClose(); },
    },
    {
      icon: Download,
      label: isDownloading ? "Downloading..." : "Download",
      onClick: () => { onDownload(); onClose(); },
      disabled: isDownloading,
    },
    {
      icon: Clock, label: "Version History",
      onClick: () => { router.push(`/documents/${doc._id}/versions`); onClose(); },
    },
    {
      icon: FileSignature,
      label: doc?.isTemplate ? "Edit Template" : "Convert to signable",
      onClick: () => { router.push(`/documents/${doc._id}/signature?mode=edit`); onClose(); },
    },
    {
      icon: Shield, label: "Compliance Report",
      onClick: () => { router.push("/compliance"); onClose(); },
    },
    { icon: Eye, label: "Export visits", onClick: () => { onExportVisits(); onClose(); } },
    { icon: ImageIcon, label: "Update thumbnail", onClick: () => { onUpdateThumbnail(); onClose(); } },
    ...(doc?.isTemplate
      ? [{
          icon: Users, label: "Bulk Send",
          onClick: () => { router.push(`/documents/${doc._id}/bulk-send`); onClose(); },
        }]
      : []),
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-[60] md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[300px] bg-white z-[70] md:hidden flex flex-col shadow-2xl"
          >
            {/* Header */}
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
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Doc Info */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Document Info
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {doc.isTemplate && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                      <FileSignature className="h-3 w-3 mr-1" />Template
                    </span>
                  )}
                  {liveViewerCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      {liveViewerCount} viewing live
                    </span>
                  )}
                </div>
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
                    <span className={`text-xs ${doc.notes ? "text-slate-600" : "text-slate-300 italic"}`}>
                      {doc.notes || "Add a note to this document"}
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
                        onClick={() => { setIsEditingNotes(false); setNotes(doc.notes || ""); }}
                        className="flex-1 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => { await onSaveNotes(); onClose(); }}
                        disabled={isSavingNotes}
                        className="flex-1 py-1.5 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSavingNotes ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Share */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Share</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { onOpenLinkDrawer("public"); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
                  >
                    <LinkIcon className="h-4 w-4 flex-shrink-0" />
                    Create document link
                  </button>
                  <button
                    onClick={() => { onOpenLinkDrawer("email-gated"); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    Email-gated link
                  </button>
                  <button
                    onClick={() => { router.push(`/documents/${doc._id}/signature?mode=send`); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    <FileSignature className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    Request signatures
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Actions</p>
                <div className="space-y-1">
                  {actions.map((item) => (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      disabled={(item as any).disabled}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-left"
                    >
                      <item.icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold text-red-400 uppercase tracking-widest mb-3">Danger Zone</p>
                <button
                  onClick={() => { onDelete(); onClose(); }}
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
  );
}