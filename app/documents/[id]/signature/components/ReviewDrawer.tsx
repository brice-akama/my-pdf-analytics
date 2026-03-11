"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, FileSignature, FileText, Mail, X } from "lucide-react";
import { toast } from "sonner";
import type { DocumentType, SignatureRequest } from "./types";

interface ReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  doc: DocumentType;
  mode: string | null;
  signatureRequest: SignatureRequest;
  isSending: boolean;
  handleSendSignature: () => void;
}

function SettingRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      {count !== undefined && <span className="text-xs text-slate-400">{count} total</span>}
    </div>
  );
}

export default function ReviewDrawer({
  open, onClose, doc, mode, signatureRequest, isSending, handleSendSignature,
}: ReviewDrawerProps) {
  if (!open) return null;

  const isSendMode = mode === "send" || !mode;

  const handleConfirmSend = () => {
    if (signatureRequest.signatureFields.length === 0) {
      toast.error("No fields placed", { description: "Go back and drag at least one field onto the document." });
      return;
    }
    const validRecipients = signatureRequest.recipients.filter((r) => r.name && (isSendMode ? r.email : true));
    if (validRecipients.length === 0) {
      toast.error(isSendMode ? "Missing recipient emails" : "No roles defined", {
        description: isSendMode ? "All recipients need an email address before sending." : "Add at least one role to save this template.",
      });
      return;
    }
    onClose();
    handleSendSignature();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[560px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-purple-600" />
              {mode === "edit" ? "Review Template" : "Review & Send"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Final check before {mode === "edit" ? "saving" : "sending"}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Document summary */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{doc.filename}</p>
              <p className="text-xs text-slate-500 mt-0.5">{signatureRequest.signatureFields.length} field(s) · {doc.numPages} page(s)</p>
            </div>
          </div>

          {/* No-fields warning */}
          {signatureRequest.signatureFields.length === 0 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
              <svg className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-amber-900">No signature fields placed</p>
                <p className="text-xs text-amber-700 mt-0.5">Go back and add at least one field before sending.</p>
              </div>
            </div>
          )}

          {/* Recipients */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <SectionHeader label="Recipients" count={signatureRequest.recipients.length} />
            <div className="p-4 space-y-2">
              {signatureRequest.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: recipient.color }}>
                    <span className="text-white font-bold text-xs">{recipient.name?.charAt(0) || index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{recipient.name || `Recipient ${index + 1}`}</p>
                    <p className="text-xs text-slate-500 truncate">{recipient.email || "No email"}</p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                    {signatureRequest.signatureFields.filter((f) => f.recipientIndex === index).length} fields
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Placed fields */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <SectionHeader label="Placed Fields" count={signatureRequest.signatureFields.length} />
            <div className="p-4 grid grid-cols-2 gap-2">
              {signatureRequest.signatureFields.length > 0 ? (
                signatureRequest.signatureFields.map((field) => {
                  const recipient = signatureRequest.recipients[field.recipientIndex];
                  return (
                    <div key={field.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="h-6 w-6 rounded-lg flex-shrink-0" style={{ backgroundColor: recipient?.color || "#9333ea" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate capitalize">{field.type}</p>
                        <p className="text-xs text-slate-400 truncate">Pg {field.page} · {recipient?.name || `R${field.recipientIndex + 1}`}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 col-span-2 py-2">No fields placed yet.</p>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <SectionHeader label="Settings" />
            <div className="divide-y divide-slate-100">
              <SettingRow label="Signing order" value={signatureRequest.signingOrder === "sequential" ? "Sequential" : "Any order"} />
              <SettingRow label="Visibility" value={signatureRequest.viewMode === "shared" ? "Shared" : "Isolated"} />
              {signatureRequest.expirationDays && (
                <SettingRow label="Link expiration" value={signatureRequest.expirationDays === "never" ? "Never" : `${signatureRequest.expirationDays} days`} />
              )}
              {signatureRequest.accessCodeRequired && (
                <SettingRow label="Access code" value={<span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Enabled</span>} />
              )}
              {signatureRequest.intentVideoRequired && (
                <SettingRow label="Intent video" value={<span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Camera className="h-3 w-3" />Enabled</span>} />
              )}
            </div>
          </div>

          {/* CC Recipients */}
          {signatureRequest.ccRecipients && signatureRequest.ccRecipients.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader label="CC Recipients" count={signatureRequest.ccRecipients.length} />
              <div className="p-4 space-y-2">
                {signatureRequest.ccRecipients.map((cc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{cc.name}</p>
                      <p className="text-xs text-slate-500 truncate">{cc.email}</p>
                    </div>
                    <span className="text-xs text-blue-600 flex-shrink-0">{cc.notifyWhen === "completed" ? "On complete" : "Immediately"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          {isSendMode && signatureRequest.message && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SectionHeader label="Message" />
              <div className="px-5 py-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{signatureRequest.message}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          {isSendMode && (signatureRequest.dueDate || signatureRequest.scheduledSendDate) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {signatureRequest.dueDate && <SettingRow label="Due date" value={new Date(signatureRequest.dueDate).toLocaleDateString()} />}
                {signatureRequest.scheduledSendDate && <SettingRow label="Scheduled send" value={new Date(signatureRequest.scheduledSendDate).toLocaleString()} />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Editing
          </Button>
          <Button onClick={handleConfirmSend} disabled={isSending || signatureRequest.signatureFields.length === 0} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 disabled:opacity-50">
            {isSending ? (
              <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />{mode === "edit" ? "Saving..." : "Sending..."}</>
            ) : mode === "edit" ? (
              <><FileSignature className="h-4 w-4 mr-2" />Save Template</>
            ) : (
              <><Mail className="h-4 w-4 mr-2" />Send Request</>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}