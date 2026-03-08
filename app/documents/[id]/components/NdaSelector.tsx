"use client";

import React from "react";
import { toast } from "sonner";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function NdaSelector({
  shareSettings,
  setShareSettings,
}: {
  shareSettings: any;
  setShareSettings: (s: any) => void;
}) {
  const [uploadedAgreements, setUploadedAgreements] = React.useState<any[]>(
    []
  );
  const [loadingAgreements, setLoadingAgreements] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [ndaMode, setNdaMode] = React.useState<"select" | "custom">("select");

  React.useEffect(() => {
    setLoadingAgreements(true);
    fetch("/api/agreements/uploaded", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUploadedAgreements(data.agreements || []);
      })
      .catch(console.error)
      .finally(() => setLoadingAgreements(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported for NDA upload");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

    setIsUploading(true);
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
        const newAgreement = {
          _id: data.agreementId,
          filename: file.name,
        };
        setUploadedAgreements((prev) => [newAgreement, ...prev]);
        setShareSettings({
          ...shareSettings,
          ndaTemplateId: data.agreementId,
          useCustomNda: false,
        });
        toast.success("NDA uploaded and selected!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3 pt-1">
      {/* Mode tabs */}
      <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
        <button
          onClick={() => {
            setNdaMode("select");
            setShareSettings({ ...shareSettings, useCustomNda: false });
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            ndaMode === "select"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          Select / Upload
        </button>
        <button
          onClick={() => {
            setNdaMode("custom");
            setShareSettings({ ...shareSettings, useCustomNda: true });
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            ndaMode === "custom"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          Custom Text
        </button>
      </div>

      {ndaMode === "select" && (
        <div className="space-y-2">
          {loadingAgreements ? (
            <div className="flex justify-center p-3">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          ) : (
            <select
              value={shareSettings.ndaTemplateId || ""}
              onChange={(e) =>
                setShareSettings({
                  ...shareSettings,
                  ndaTemplateId: e.target.value,
                  useCustomNda: false,
                })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none"
            >
              <option value="">
                {uploadedAgreements.length === 0
                  ? "No agreements uploaded yet"
                  : "Select an uploaded NDA..."}
              </option>
              {uploadedAgreements.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.filename || a.title || `Agreement ${a._id.slice(-6)}`}
                </option>
              ))}
            </select>
          )}

          <div>
            <input
              type="file"
              accept=".pdf"
              id="nda-upload-input"
              className="hidden"
              onChange={handleUpload}
            />
            <label
              htmlFor="nda-upload-input"
              className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg px-3 py-3 cursor-pointer transition-colors text-sm font-medium ${
                isUploading
                  ? "border-slate-200 text-slate-400 pointer-events-none"
                  : "border-slate-300 text-slate-600 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload new NDA (PDF)
                </>
              )}
            </label>
          </div>

          {shareSettings.ndaTemplateId && (
            <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg">
              <FileText className="h-4 w-4 text-violet-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-violet-800 truncate">
                {uploadedAgreements.find(
                  (a) => a._id === shareSettings.ndaTemplateId
                )?.filename || "Agreement selected"}
              </span>
              <button
                onClick={() =>
                  setShareSettings({ ...shareSettings, ndaTemplateId: "" })
                }
                className="ml-auto text-violet-400 hover:text-violet-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {ndaMode === "custom" && (
        <Textarea
          value={shareSettings.customNdaText}
          onChange={(e) =>
            setShareSettings({
              ...shareSettings,
              customNdaText: e.target.value,
            })
          }
          placeholder="Enter your NDA terms here..."
          rows={6}
          className="text-xs font-mono"
          maxLength={2000}
        />
      )}
    </div>
  );
}