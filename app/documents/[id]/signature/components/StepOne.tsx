"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Eye, EyeOff, Mail, Trash2, Users } from "lucide-react";
import { EmailAutocomplete } from "@/components/ui/EmailAutocomplete";
import type { SignatureRequest, CCRecipient, Recipient } from "./types";

interface StepOneProps {
  mode: string | null;
  signatureRequest: SignatureRequest;
  setSignatureRequest: React.Dispatch<React.SetStateAction<SignatureRequest>>;
}

const RANDOM_COLOR = () => `hsl(${Math.random() * 360}, 70%, 50%)`;

const ACCESS_CODE_OPTIONS = [
  { value: "custom",         label: "Custom Code" },
  { value: "last_4_ssn",     label: "Last 4 of SSN" },
  { value: "employee_id",    label: "Employee ID" },
  { value: "birth_date",     label: "Date of Birth" },
  { value: "account_number", label: "Account Number" },
  { value: "phone_last_4",   label: "Last 4 of Phone" },
];

function SectionCard({ title, subtitle, badge, children }: {
  title: string; subtitle?: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {badge && <span className="text-slate-400 text-sm font-normal">{badge}</span>}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
    </label>
  );
}

// ─── Recipients ───────────────────────────────────────────────────────────────

function RecipientsSection({ mode, signatureRequest, setSignatureRequest }: StepOneProps) {

  const updateField = (index: number, field: keyof Recipient, value: string) => {
    setSignatureRequest((prev) => {
      const updated = [...prev.recipients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, recipients: updated };
    });
  };

  // ⭐ When a suggestion is selected from the dropdown, auto-fill BOTH name + email
  const handleSelect = (index: number, s: { email: string; name: string | null }) => {
    setSignatureRequest((prev) => {
      const updated = [...prev.recipients];
      updated[index] = {
        ...updated[index],
        email: s.email,
        // Only fill name if suggestion has one — don't wipe a name the user already typed
        ...(s.name ? { name: s.name } : {}),
      };
      return { ...prev, recipients: updated };
    });
  };

  const remove = (index: number) => {
    setSignatureRequest((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const add = () => {
    setSignatureRequest((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { name: "", email: "", role: "", color: RANDOM_COLOR() }],
    }));
  };

  return (
    <SectionCard
      title={mode === "edit" ? "Define Recipient Roles" : "Who needs to sign?"}
      subtitle={
        mode === "edit"
          ? 'Add roles like "Client" or "Manager". Real emails are assigned when you use this template.'
          : "Add the people who need to sign this document."
      }
    >
      <div className="space-y-3">
        {signatureRequest.recipients.map((recipient, index) => (
          <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:border-purple-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-purple-700 font-bold text-sm">{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* ⭐ NAME field — autocomplete searches by name, auto-fills email too */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                    <EmailAutocomplete
                      value={recipient.name}
                      onChange={(val) => updateField(index, "name", val)}
                      onSelect={(s) => handleSelect(index, s)}
                      placeholder="Jane Smith"
                      searchBy="name"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* ⭐ EMAIL field — autocomplete searches by email, auto-fills name too */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Email Address
                      {mode === "edit" && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                    </label>
                    <EmailAutocomplete
                      value={recipient.email}
                      onChange={(val) => updateField(index, "email", val)}
                      onSelect={(s) => handleSelect(index, s)}
                      placeholder={mode === "edit" ? "Optional for template" : "jane@company.com"}
                      searchBy="email"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                {/* Role — plain input, no autocomplete needed */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Role <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    value={recipient.role || ""}
                    onChange={(e) => updateField(index, "role", e.target.value)}
                    placeholder="e.g., Client, Manager, Approver"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 mt-1">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={add} className="w-full border-dashed border-2 h-11 text-sm text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-xl">
          <Users className="h-4 w-4 mr-2" />Add Another Recipient
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Message & Timing ─────────────────────────────────────────────────────────

function MessageTimingSection({ signatureRequest, setSignatureRequest }: Omit<StepOneProps, "mode">) {
  return (
    <SectionCard title="Message & Timing" subtitle="Optionally add a note and set deadlines">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Message to Recipients <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Textarea
            value={signatureRequest.message || ""}
            onChange={(e) => setSignatureRequest((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Please review and sign this document at your earliest convenience..."
            rows={3} className="text-sm resize-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Due Date <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input type="date" value={signatureRequest.dueDate || ""} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, dueDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} className="h-9 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Scheduled Send <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input type="datetime-local" value={signatureRequest.scheduledSendDate || ""} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, scheduledSendDate: e.target.value }))} min={new Date().toISOString().slice(0, 16)} className="h-9 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Link Expiration</label>
          <select value={signatureRequest.expirationDays || "30"} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, expirationDays: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days (Recommended)</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="never">Never expire</option>
          </select>
          <p className="text-xs text-slate-400 mt-1">Signing links expire after this period for security</p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── CC Recipients ────────────────────────────────────────────────────────────

function CCRecipientsSection({ signatureRequest, setSignatureRequest }: Omit<StepOneProps, "mode">) {
  const ccList = signatureRequest.ccRecipients || [];

  const updateCC = (index: number, field: keyof CCRecipient, value: string) => {
    setSignatureRequest((prev) => {
      const updated = [...(prev.ccRecipients || [])];
      updated[index] = { ...updated[index], [field]: value } as CCRecipient;
      return { ...prev, ccRecipients: updated };
    });
  };

  // ⭐ Auto-fill both fields when CC suggestion picked
  const handleCCSelect = (index: number, s: { email: string; name: string | null }) => {
    setSignatureRequest((prev) => {
      const updated = [...(prev.ccRecipients || [])];
      updated[index] = {
        ...updated[index],
        email: s.email,
        ...(s.name ? { name: s.name } : {}),
      } as CCRecipient;
      return { ...prev, ccRecipients: updated };
    });
  };

  return (
    <SectionCard
      title="CC Recipients"
      badge="(Optional)"
      subtitle="These people get a view-only link to the signed document — they don't sign."
    >
      <div className="space-y-3">
        {ccList.map((cc, index) => (
          <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* ⭐ CC Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                    <EmailAutocomplete
                      value={cc.name}
                      onChange={(val) => updateCC(index, "name", val)}
                      onSelect={(s) => handleCCSelect(index, s)}
                      placeholder="John Doe"
                      searchBy="name"
                      className="h-9 text-sm"
                    />
                  </div>

                  {/* ⭐ CC Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <EmailAutocomplete
                      value={cc.email}
                      onChange={(val) => updateCC(index, "email", val)}
                      onSelect={(s) => handleCCSelect(index, s)}
                      placeholder="john@company.com"
                      searchBy="email"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">When to send copy</label>
                  <select value={cc.notifyWhen} onChange={(e) => updateCC(index, "notifyWhen", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="completed">When all signatures are completed </option>
                    <option value="immediately">Immediately after sending </option>
                  </select>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSignatureRequest((prev) => ({ ...prev, ccRecipients: (prev.ccRecipients || []).filter((_, i) => i !== index) }))} className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 mt-1">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={() => setSignatureRequest((prev) => ({ ...prev, ccRecipients: [...(prev.ccRecipients || []), { name: "", email: "", notifyWhen: "completed" as const }] }))} className="w-full border-dashed border-2 h-11 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-xl">
          <Mail className="h-4 w-4 mr-2" />Add CC Recipient
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Signing Order ────────────────────────────────────────────────────────────

function SigningOrderSection({ signatureRequest, setSignatureRequest }: Omit<StepOneProps, "mode">) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Signing Order</h3>
            <p className="text-xs text-slate-500 mt-0.5">Should recipients sign in a specific order?</p>
          </div>
          <div className="flex items-center gap-4">
            {(["any", "sequential"] as const).map((val) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="signingOrder" value={val} checked={val === "sequential" ? signatureRequest.signingOrder === "sequential" : signatureRequest.signingOrder !== "sequential"} onChange={() => setSignatureRequest((prev) => ({ ...prev, signingOrder: val }))} className="w-4 h-4 accent-purple-600" />
                <span className="text-sm text-slate-700">{val === "any" ? "Any order" : "Sequential"}</span>
              </label>
            ))}
          </div>
        </div>
        {signatureRequest.signingOrder === "sequential" && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-800">📋 Each person is notified only after the previous person completes their signature.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Visibility ───────────────────────────────────────────────────────────────

function VisibilitySection({ signatureRequest, setSignatureRequest }: Omit<StepOneProps, "mode">) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Signature Visibility</h3>
            <p className="text-xs text-slate-500 mt-0.5">What can each recipient see when signing?</p>
          </div>
          <select value={signatureRequest.viewMode || "isolated"} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, viewMode: e.target.value as "isolated" | "shared" }))} className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-auto w-full">
            <option value="isolated">Isolated — only their own fields</option>
            <option value="shared">Shared — all signatures visible</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Access Code ──────────────────────────────────────────────────────────────

function AccessCodeSection({ signatureRequest, setSignatureRequest }: Omit<StepOneProps, "mode">) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Access Code Protection</h3>
            <p className="text-xs text-slate-500 mt-0.5">Recipients must enter a code before viewing</p>
          </div>
          <Toggle checked={signatureRequest.accessCodeRequired || false} onChange={(val) => setSignatureRequest((prev) => ({ ...prev, accessCodeRequired: val, ...(!val && { accessCodeType: undefined, accessCodeHint: undefined, accessCode: undefined }) }))} />
        </div>
        {signatureRequest.accessCodeRequired && (
          <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Code Type</label>
              <select value={signatureRequest.accessCodeType || "custom"} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, accessCodeType: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {ACCESS_CODE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Hint for Recipients <span className="text-slate-400 font-normal">(optional)</span></label>
              <Input type="text" value={signatureRequest.accessCodeHint || ""} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, accessCodeHint: e.target.value }))} placeholder="e.g., 'Your employee ID'" className="h-9 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Set the Code</label>
              <div className="relative">
                <Input type={showCode ? "text" : "password"} value={signatureRequest.accessCode || ""} onChange={(e) => setSignatureRequest((prev) => ({ ...prev, accessCode: e.target.value }))} placeholder="Enter access code (min 4 characters)" className="h-9 text-sm pr-10" />
                <button type="button" onClick={() => setShowCode(!showCode)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Intent Video ─────────────────────────────────────────────────────────────

function IntentVideoSection({ signatureRequest, setSignatureRequest }: Omit<StepOneProps, "mode">) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Intent &amp; Acknowledgement Video</h3>
            <p className="text-xs text-slate-500 mt-0.5">Signers record a short video confirming intent before completing</p>
          </div>
          <Toggle checked={signatureRequest.intentVideoRequired || false} onChange={(val) => setSignatureRequest((prev) => ({ ...prev, intentVideoRequired: val }))} />
        </div>
        {signatureRequest.intentVideoRequired && (
          <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-xs font-semibold text-purple-900 mb-1.5 flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" />What signers will record:
            </p>
            <ul className="text-xs text-purple-800 space-y-1">
              <li>• Their full name</li>
              <li>• The document name</li>
              <li>• The current date</li>
              <li>• "I acknowledge and agree to sign this document"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function StepOne({ mode, signatureRequest, setSignatureRequest }: StepOneProps) {
  const isSendMode = mode === "send" || mode === "draft" || !mode;
  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-0 pb-16 space-y-4">
      <RecipientsSection mode={mode} signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />
      {isSendMode && <MessageTimingSection signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />}
      <CCRecipientsSection signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />
      <SigningOrderSection signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />
      <VisibilitySection signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />
      <AccessCodeSection signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />
      <IntentVideoSection signatureRequest={signatureRequest} setSignatureRequest={setSignatureRequest} />
    </div>
  );
}