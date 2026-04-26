"use client";

// app/documents/[id]/components/AttachmentsDrawer.tsx
//
// WHAT THIS FILE DOES:
//   Drawer that shows all attachments a signer uploaded during signing.
//   Follows the exact same open/close pattern as EvidenceDrawer.
//   Each attachment has a View button (opens in new tab) and a Download button.
//
// USED BY: SignaturesTab — shown when a recipient has attachments.

import { useState } from "react";
import { X, Paperclip, Download, Eye, FileText, Image, File } from "lucide-react";

// ── File type helpers ─────────────────────────────────────────────────────────

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) {
    return <Image className="h-4 w-4 text-blue-500" />;
  }
  if (fileType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-slate-400" />;
}

function getFileTypeBadge(fileType: string): string {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("image/")) return fileType.split("/")[1].toUpperCase();
  if (fileType.includes("wordprocessingml") || fileType === "application/msword") return "DOCX";
  if (fileType.includes("spreadsheetml") || fileType === "application/vnd.ms-excel") return "XLSX";
  return "FILE";
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Attachment row ────────────────────────────────────────────────────────────

function AttachmentRow({
  attachment,
  signatureId,
}: {
  attachment: any;
  signatureId: string;
}) {
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const viewUrl = `/api/signature/${signatureId}/attachments/${attachment.id || attachment._id}?action=view`;
  const downloadUrl = `/api/signature/${signatureId}/attachments/${attachment.id || attachment._id}?action=download`;

  const handleView = () => {
    setIsViewing(true);
    window.open(viewUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setIsViewing(false), 1500);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename || attachment.originalFilename || "attachment";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
      {/* Icon */}
      <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
        {getFileIcon(attachment.fileType || "")}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {attachment.filename || attachment.originalFilename || "Untitled"}
          </p>
          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
            {getFileTypeBadge(attachment.fileType || "")}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{formatFileSize(attachment.fileSize)}</span>
          {attachment.attachmentType && (
            <>
              <span>·</span>
              <span className="capitalize">{attachment.attachmentType.replace(/_/g, " ")}</span>
            </>
          )}
          {attachment.uploadedAt && (
            <>
              <span>·</span>
              <span>{formatDate(attachment.uploadedAt)}</span>
            </>
          )}
        </div>

        {attachment.description && (
          <p className="text-xs text-slate-500 mt-1 italic">
            "{attachment.description}"
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleView}
          disabled={isViewing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <Eye className="h-3.5 w-3.5" />
          {isViewing ? "Opening…" : "View"}
        </button>
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {isDownloading ? "…" : "Download"}
        </button>
      </div>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export default function AttachmentsDrawer({
  open,
  onClose,
  recipient,
  attachments,
}: {
  open: boolean;
  onClose: () => void;
  recipient: {
    name: string;
    email: string;
    signedAt?: string | null;
  } | null;
  // attachments already fetched by SignaturesTab, passed in as prop
  // shape matches what /api/signature/[id]/attachments returns
  attachments: any[];
}) {
  if (!open || !recipient) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Paperclip className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Attachments
              </p>
              <p className="text-xs text-slate-400">{recipient.name} · {recipient.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <Paperclip className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-900 mb-1">
                No attachments
              </p>
              <p className="text-xs text-slate-400">
                This signer did not upload any attachments during signing.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {attachments.length} attachment{attachments.length !== 1 ? "s" : ""} uploaded
              </p>
              {attachments.map((attachment: any, i: number) => (
                <AttachmentRow
                  key={attachment.id || attachment._id || i}
                  attachment={attachment}
                  // signatureId is the uniqueId of the signature request
                  signatureId={attachment.signatureRequestId}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {recipient.signedAt && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
            <p className="text-[11px] text-slate-400">
              Signed on {new Date(recipient.signedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        )}
      </div>
    </>
  );
}