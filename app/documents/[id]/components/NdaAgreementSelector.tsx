"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Upload, FileText, Loader2, Check, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Agreement = {
  _id: string;
  filename: string;
  filesize: number;
  cloudinaryPdfUrl: string;
  createdAt: string;
};

type Props = {
  shareSettings: any;
  setShareSettings: (s: any) => void;
};

export default function NdaAgreementSelector({ shareSettings, setShareSettings }: Props) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected agreement derived from shareSettings
  const selectedAgreement = agreements.find(
    (a) => a._id === shareSettings.ndaAgreementId
  );

  // Fetch user's uploaded agreements
  useEffect(() => {
    if (!shareSettings.requireNDA) return;
    fetchAgreements();
  }, [shareSettings.requireNDA]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
       const res = await fetch("/api/agreements/upload", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAgreements(data.agreements || []);
      }
    } catch (err) {
      console.error("Failed to fetch agreements:", err);
    } finally {
      setLoading(false);
    }
  };

  // Upload a new NDA PDF → saves to agreements collection → auto-selects it
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

       const res = await fetch("/api/agreements/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Agreement uploaded!");

        // Add to local list and auto-select
        const newAgreement: Agreement = {
          _id: data.agreementId,
          filename: file.name,
          filesize: file.size,
          cloudinaryPdfUrl: data.cloudinaryUrl,
          createdAt: new Date().toISOString(),
        };

        setAgreements((prev) => [newAgreement, ...prev]);

        // Auto-select the newly uploaded agreement
        setShareSettings((prev: any) => ({
          ...prev,
          ndaAgreementId: data.agreementId,
          ndaUrl: data.cloudinaryUrl,
          // Clear old text-based NDA fields
          ndaTemplateId: "",
          customNdaText: "",
          useCustomNda: false,
        }));

        setDropdownOpen(false);
      } else {
        toast.error(data.error || "Failed to upload agreement");
      }
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelect = (agreement: Agreement) => {
    setShareSettings((prev: any) => ({
      ...prev,
      ndaAgreementId: agreement._id,
      ndaUrl: agreement.cloudinaryPdfUrl,
      // Clear old text-based NDA fields
      ndaTemplateId: "",
      customNdaText: "",
      useCustomNda: false,
    }));
    setDropdownOpen(false);
  };

  const handleClear = () => {
    setShareSettings((prev: any) => ({
      ...prev,
      ndaAgreementId: "",
      ndaUrl: "",
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-3">
      {/* Selected agreement display */}
      {selectedAgreement ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900 truncate">
              {selectedAgreement.filename}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              {formatFileSize(selectedAgreement.filesize)} ·{" "}
              {formatDate(selectedAgreement.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={selectedAgreement.cloudinaryPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-700 hover:text-green-800 underline"
            >
              Preview
            </a>
            <button
              onClick={handleClear}
              className="h-6 w-6 flex items-center justify-center rounded-md text-green-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
          <p className="text-xs text-slate-500">No agreement selected</p>
        </div>
      )}

      {/* Dropdown selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white hover:border-violet-400 transition-colors"
        >
          <span className="text-slate-500 text-xs">
            {loading ? "Loading agreements..." : "Select from saved agreements"}
          </span>
          {loading ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {agreements.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No agreements uploaded yet</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload a PDF below to get started
                </p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {agreements.map((agreement) => (
                  <button
                    key={agreement._id}
                    type="button"
                    onClick={() => handleSelect(agreement)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {agreement.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(agreement.filesize)} ·{" "}
                        {formatDate(agreement.createdAt)}
                      </p>
                    </div>
                    {shareSettings.ndaAgreementId === agreement._id && (
                      <Check className="h-4 w-4 text-violet-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload new agreement */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="hidden"
          id="nda-pdf-upload"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload new NDA / Agreement PDF
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 text-center mt-1.5">
          PDF only · Max 10MB · Saved to your agreements library
        </p>
      </div>

      {/* Legal notice */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-xs text-green-800">
          ✅ Viewer must accept this agreement before accessing the document.
          Acceptance is timestamped and logged for legal records.
        </p>
      </div>
    </div>
  );
}