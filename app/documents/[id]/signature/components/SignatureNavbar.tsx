"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentType, SignatureRequest } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SignatureNavbarProps {
  doc: DocumentType;
  mode: string | null;
  signatureRequest: SignatureRequest;
  setSignatureRequest: React.Dispatch<React.SetStateAction<SignatureRequest>>;
  isSending: boolean;
  handleSendSignature: () => void;
  showReviewDrawer: boolean;
  setShowReviewDrawer: (v: boolean) => void;
}

const STEP_LABELS = ["Recipients", "Place Fields", "Review"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignatureNavbar({
  doc,
  mode,
  signatureRequest,
  setSignatureRequest,
  isSending,
  handleSendSignature,
  showReviewDrawer,
  setShowReviewDrawer,
}: SignatureNavbarProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canProceedStep1 = () => {
    if (mode === "edit") return signatureRequest.recipients.some((r) => r.name);
    return signatureRequest.recipients.some((r) => r.name && r.email);
  };

  const handleContinueStep1 = () => {
    if (mode === "edit") {
      if (!signatureRequest.recipients.some((r) => r.name)) {
        toast.error("Please add at least one role", {
          description: 'Add a role like "Client" or "Manager" to continue.',
        });
        return;
      }
    } else {
      if (!signatureRequest.recipients.some((r) => r.name && r.email)) {
        toast.error("Missing recipient details", {
          description: "Please add a name and email address for each recipient.",
        });
        return;
      }
    }
    setSignatureRequest((prev) => ({ ...prev, step: 2 }));
    setMobileMenuOpen(false);
  };

  // ── Mobile slide menu ──────────────────────────────────────────────────────

  const MobileMenu = () => (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow-2xl rounded-b-3xl overflow-hidden animate-in slide-in-from-top duration-300">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-slate-900 text-sm">
              {mode === "edit" ? "Create Template" : "Signature Request"}
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 space-y-3">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive   = signatureRequest.step === stepNum;
            const isComplete = signatureRequest.step > stepNum;
            return (
              <div
                key={stepNum}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isActive   ? "bg-purple-50 border border-purple-200"
                  : isComplete ? "bg-green-50 border border-green-200"
                  : "bg-slate-50 border border-slate-200"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                    isActive   ? "bg-purple-600 text-white"
                    : isComplete ? "bg-green-500 text-white"
                    : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isComplete ? "✓" : stepNum}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive   ? "text-purple-700"
                    : isComplete ? "text-green-700"
                    : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto text-xs text-purple-500 font-medium">Current</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Document info */}
        <div className="mx-5 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 mb-0.5">Document</p>
          <p className="text-sm font-medium text-slate-800 truncate">{doc.filename}</p>
        </div>

        {/* Mobile action buttons */}
        <div className="px-5 pb-6 flex flex-col gap-3">
          {signatureRequest.step > 1 && (
            <Button
              variant="outline"
              onClick={() => {
                setSignatureRequest((prev) => ({ ...prev, step: prev.step - 1 }));
                setMobileMenuOpen(false);
              }}
              className="w-full rounded-xl border-slate-200 text-slate-600 h-11"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to {STEP_LABELS[signatureRequest.step - 2]}
            </Button>
          )}

          {signatureRequest.step === 1 && (
            <Button
              onClick={handleContinueStep1}
              disabled={!canProceedStep1()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11 disabled:opacity-50"
            >
              Continue to Place Fields
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {signatureRequest.step === 2 && (
            <Button
              onClick={() => { setShowReviewDrawer(true); setMobileMenuOpen(false); }}
              className="w-full border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl h-11"
              variant="outline"
            >
              <FileSignature className="h-4 w-4 mr-2" />
              Review & Send
            </Button>
          )}

          {signatureRequest.step === 3 && (
            <Button
              onClick={() => { handleSendSignature(); setMobileMenuOpen(false); }}
              disabled={isSending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-11"
            >
              {isSending ? (
                <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />{mode === "edit" ? "Saving..." : "Sending..."}</>
              ) : mode === "edit" ? (
                <><FileSignature className="h-4 w-4 mr-2" />Save Template</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" />Send Request</>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => router.push(`/documents/${doc._id}`)}
            className="w-full text-slate-500 h-10 rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Document
          </Button>
        </div>
      </div>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Main nav row */}
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/documents/${doc._id}`)}
                className="flex-shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold text-slate-900 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-xs">
                    {doc.filename}
                  </h1>
                  {mode === "edit" && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 flex-shrink-0">
                      <FileSignature className="h-3 w-3" />
                      Template
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {mode === "edit" ? "Create Reusable Template"
                    : mode === "draft" ? "Continue Signature Request"
                    : "Send Signature Request"}
                  {" · "}Step {signatureRequest.step} of 3
                </p>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Desktop buttons */}
              <div className="hidden sm:flex items-center gap-2">
                {signatureRequest.step > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSignatureRequest((prev) => ({ ...prev, step: prev.step - 1 }))}
                    className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />Back
                  </Button>
                )}
                {signatureRequest.step === 1 && (
                  <Button size="sm" onClick={handleContinueStep1} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4">
                    Continue<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {signatureRequest.step === 2 && (
                  <Button size="sm" variant="outline" onClick={() => setShowReviewDrawer(true)} className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl">
                    <FileSignature className="h-4 w-4 mr-1.5" />Review &amp; Send
                  </Button>
                )}
                {signatureRequest.step === 3 && (
                  <Button size="sm" onClick={handleSendSignature} disabled={isSending} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-4">
                    {isSending ? (
                      <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />{mode === "edit" ? "Saving..." : "Sending..."}</>
                    ) : mode === "edit" ? (
                      <><FileSignature className="h-4 w-4 mr-1.5" />Save Template</>
                    ) : (
                      <><Mail className="h-4 w-4 mr-1.5" />Send Request</>
                    )}
                  </Button>
                )}
              </div>

              {/* Mobile: compact action + hamburger */}
              <div className="flex sm:hidden items-center gap-2">
                {signatureRequest.step === 1 && (
                  <Button size="sm" onClick={handleContinueStep1} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-3">
                    Next<ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {signatureRequest.step === 2 && (
                  <Button size="sm" variant="outline" onClick={() => setShowReviewDrawer(true)} className="border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl px-3">
                    Review
                  </Button>
                )}
                {signatureRequest.step === 3 && (
                  <Button size="sm" onClick={handleSendSignature} disabled={isSending} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-3">
                    {isSending ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : mode === "edit" ? "Save" : "Send"}
                  </Button>
                )}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="pb-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    signatureRequest.step >= step ? "bg-purple-600" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex sm:hidden justify-between mt-1.5 px-0.5">
              {STEP_LABELS.map((label, idx) => {
                const stepNum = idx + 1;
                return (
                  <span
                    key={stepNum}
                    className={`text-[10px] font-medium transition-colors ${
                      signatureRequest.step === stepNum ? "text-purple-600"
                      : signatureRequest.step > stepNum  ? "text-slate-400"
                      : "text-slate-300"
                    }`}
                  >
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <MobileMenu />}
    </>
  );
}