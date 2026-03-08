"use client";

import { toast } from "sonner";
import {
  ArrowLeft, Eye, Upload, LinkIcon, ChevronDown, Mail,
  FileSignature, MoreVertical, Presentation, Clock,
  Shield, Download, Trash2, Users, Edit, FileText,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

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
  doc: DocumentType;
  liveViewerCount: number;
  notes: string;
  setNotes: (v: string) => void;
  isEditingNotes: boolean;
  setIsEditingNotes: (v: boolean) => void;
  isSavingNotes: boolean;
  onSaveNotes: () => void;
  isDownloading: boolean;
  onPreview: () => void;
  onPresent: () => void;
  onDownload: () => void;
  onExportVisits: () => void;
  onOpenLinkDrawer: (type: "public" | "email-gated") => void;
  onDeleteClick: () => void;
  onMobileMenuOpen: () => void;
  onRefreshDocument: () => void;
  router: any;
  formatTimeAgo: (date: string) => string;
};

export default function DocumentHeader({
  doc, liveViewerCount, notes, setNotes,
  isEditingNotes, setIsEditingNotes, isSavingNotes,
  onSaveNotes, isDownloading, onPreview, onPresent,
  onDownload, onExportVisits, onOpenLinkDrawer,
  onDeleteClick, onMobileMenuOpen, onRefreshDocument,
  router, formatTimeAgo,
}: Props) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 gap-3">

          {/* ── LEFT (Desktop) ── */}
          <div className="hidden md:flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
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

              {/* Notes */}
              {!isEditingNotes ? (
                <button onClick={() => setIsEditingNotes(true)} className="flex items-center gap-1.5 mt-1 group">
                  <Edit className="h-3 w-3 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                  <span className={`text-xs transition-colors ${doc.notes ? "text-slate-500 group-hover:text-slate-700" : "text-slate-300 group-hover:text-slate-500 italic"}`}>
                    {doc.notes || "Add a note to this document"}
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
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSaveNotes(); }
                      if (e.key === "Escape") { setIsEditingNotes(false); setNotes(doc.notes || ""); }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-300">{notes.length}/200</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setIsEditingNotes(false); setNotes(doc.notes || ""); }}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onSaveNotes}
                        disabled={isSavingNotes}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-md disabled:opacity-50"
                      >
                        {isSavingNotes ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isEditingNotes && (
                <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(doc.createdAt)}
                  {doc?.ownerEmail && (
                    <><span className="text-slate-200">·</span><span>{doc.ownerEmail}</span></>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* ── LEFT (Mobile) ── */}
          <div className="flex md:hidden items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push("/dashboard")}
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

          {/* ── RIGHT (Desktop) ── */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onPreview}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
                  >
                    <Eye className="h-4 w-4" /><span>Preview</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Preview document</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => document.getElementById("upload-new-version-input")?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden lg:inline">Upload new version</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>Upload a new version</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
                formData.append("file", renamedFile);
                try {
                  const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
                  if (res.ok) { toast.success("New version uploaded!"); onRefreshDocument(); }
                  else toast.error("Failed to upload version");
                } catch { toast.error("Upload failed"); }
                e.target.value = "";
              }}
            />

            {/* Create link split button */}
            <div className="flex items-center rounded-lg overflow-hidden border border-sky-500 shadow-sm">
              <button
                onClick={() => onOpenLinkDrawer("public")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5" />Create link
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-2 py-1.5 bg-sky-500 hover:bg-sky-600 text-white border-l border-sky-400 transition-colors">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white shadow-lg border border-slate-200 p-1">
                  <DropdownMenuItem onClick={() => onOpenLinkDrawer("public")} className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50">
                    <LinkIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Document link</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Anyone with the link can view</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenLinkDrawer("email-gated")} className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-50">
                    <Mail className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Email-gated link</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Viewer must enter email to access</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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

            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-slate-200">
                <DropdownMenuItem onClick={onPresent}><Presentation className="mr-2 h-4 w-4" /><span>Present</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/signature?mode=edit`)}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  <span>{doc?.isTemplate ? "Edit Template" : "Convert to signable"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/versions`)}>
                  <Clock className="mr-2 h-4 w-4" /><span>Version History</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/compliance")}>
                  <Shield className="mr-2 h-4 w-4" /><span>Compliance Report</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
                  {isDownloading
                    ? <div className="mr-2 h-4 w-4 animate-spin border-2 border-sky-500 border-t-transparent rounded-full" />
                    : <Download className="mr-2 h-4 w-4" />}
                  <span>Download</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportVisits}>
                  <Eye className="mr-2 h-4 w-4" /><span>Export visits</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {doc?.isTemplate && (
                  <DropdownMenuItem onClick={() => router.push(`/documents/${doc._id}/bulk-send`)}>
                    <Users className="mr-2 h-4 w-4" /><span>Bulk Send</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onDeleteClick} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" /><span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── RIGHT (Mobile): hamburger ── */}
          <button
            onClick={onMobileMenuOpen}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors flex-shrink-0"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}