"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Camera,
  CheckSquare,
  Eye,
  EyeOff,
  Mail,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { SignatureRequest, Recipient, CCRecipient } from "./types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditDrawerProps {
  open: boolean;
  onClose: () => void;
  mode: string | null;
  signatureRequest: SignatureRequest;
  setSignatureRequest: React.Dispatch<React.SetStateAction<SignatureRequest>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANDOM_COLOR = () => `hsl(${Math.random() * 360}, 70%, 50%)`;

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
    </label>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function EditDrawer({
  open,
  onClose,
  mode,
  signatureRequest,
  setSignatureRequest,
}: EditDrawerProps) {
  const [showCode, setShowCode] = useState(false);

  if (!open) return null;

  const isSendMode = mode === "send" || mode === "draft" || !mode;

  // ── Recipients helpers ──────────────────────────────────────────────────

  const updateRecipient = (
    index: number,
    field: keyof Recipient,
    value: string
  ) => {
    setSignatureRequest((prev) => {
      const updated = [...prev.recipients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, recipients: updated };
    });
  };

  const removeRecipient = (index: number) => {
    setSignatureRequest((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const addRecipient = () => {
    setSignatureRequest((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        { name: "", email: "", role: "", color: RANDOM_COLOR() },
      ],
    }));
  };

  // ── CC helpers ──────────────────────────────────────────────────────────

  const updateCC = (
    index: number,
    field: keyof CCRecipient,
    value: string
  ) => {
    setSignatureRequest((prev) => {
      const updated = [...(prev.ccRecipients || [])];
      updated[index] = { ...updated[index], [field]: value } as CCRecipient;
      return { ...prev, ccRecipients: updated };
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Changes apply without losing placed fields
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── 1. Recipients ── */}
          <SectionCard
            title="Recipients"
            subtitle="Edit names, emails and roles"
          >
            <div className="space-y-3">
              {signatureRequest.recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Badge */}
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-purple-700 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Full Name
                          </label>
                          <Input
                            value={recipient.name}
                            onChange={(e) =>
                              updateRecipient(index, "name", e.target.value)
                            }
                            placeholder="Jane Smith"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Email
                            {signatureRequest.isTemplate && (
                              <span className="text-slate-400 font-normal ml-1">
                                (optional)
                              </span>
                            )}
                          </label>
                          <Input
                            type="email"
                            value={recipient.email}
                            onChange={(e) =>
                              updateRecipient(index, "email", e.target.value)
                            }
                            placeholder={
                              signatureRequest.isTemplate
                                ? "Optional"
                                : "jane@company.com"
                            }
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Role
                          <span className="text-slate-400 font-normal ml-1">
                            (optional)
                          </span>
                        </label>
                        <Input
                          value={recipient.role || ""}
                          onChange={(e) =>
                            updateRecipient(index, "role", e.target.value)
                          }
                          placeholder="e.g., Client, Manager"
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRecipient(index)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addRecipient}
                className="w-full border-dashed border-2 h-11 text-sm text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-xl"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Another Recipient
              </Button>
            </div>
          </SectionCard>

          {/* ── 2. Signing Order ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Signing Order
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sign in any order or sequentially?
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {(["any", "sequential"] as const).map((val) => (
                    <label
                      key={val}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="signingOrderDrawer"
                        value={val}
                        checked={
                          val === "sequential"
                            ? signatureRequest.signingOrder === "sequential"
                            : signatureRequest.signingOrder !== "sequential"
                        }
                        onChange={() =>
                          setSignatureRequest((prev) => ({
                            ...prev,
                            signingOrder: val,
                          }))
                        }
                        className="w-4 h-4 accent-purple-600"
                      />
                      <span className="text-sm text-slate-700">
                        {val === "any" ? "Any order" : "Sequential"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {signatureRequest.signingOrder === "sequential" && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-xs text-amber-800">
                    📋 Each person is notified only after the previous person
                    signs.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Signature Visibility ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Signature Visibility
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    What can each recipient see?
                  </p>
                </div>
                <select
                  value={signatureRequest.viewMode || "isolated"}
                  onChange={(e) =>
                    setSignatureRequest((prev) => ({
                      ...prev,
                      viewMode: e.target.value as "isolated" | "shared",
                    }))
                  }
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 sm:w-auto w-full"
                >
                  <option value="isolated">Isolated — only their fields</option>
                  <option value="shared">Shared — all signatures visible</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── 4. Access Code ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Access Code
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Require a code before viewing
                  </p>
                </div>
                <Toggle
                  checked={signatureRequest.accessCodeRequired || false}
                  onChange={(val) =>
                    setSignatureRequest((prev) => ({
                      ...prev,
                      accessCodeRequired: val,
                      ...(!val && {
                        accessCodeType: undefined,
                        accessCodeHint: undefined,
                        accessCode: undefined,
                      }),
                    }))
                  }
                />
              </div>
              {signatureRequest.accessCodeRequired && (
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Access Code
                    </label>
                    <div className="relative">
                      <Input
                        type={showCode ? "text" : "password"}
                        value={signatureRequest.accessCode || ""}
                        onChange={(e) =>
                          setSignatureRequest((prev) => ({
                            ...prev,
                            accessCode: e.target.value,
                          }))
                        }
                        placeholder="Enter access code (min 4 characters)"
                        className="h-9 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCode(!showCode)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCode ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Hint for Recipients
                      <span className="text-slate-400 font-normal ml-1">
                        (optional)
                      </span>
                    </label>
                    <Input
                      type="text"
                      value={signatureRequest.accessCodeHint || ""}
                      onChange={(e) =>
                        setSignatureRequest((prev) => ({
                          ...prev,
                          accessCodeHint: e.target.value,
                        }))
                      }
                      placeholder="e.g., 'Your employee ID'"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 5. Intent Video ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Intent Video
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Signers record a short video confirming intent
                  </p>
                </div>
                <Toggle
                  checked={signatureRequest.intentVideoRequired || false}
                  onChange={(val) =>
                    setSignatureRequest((prev) => ({
                      ...prev,
                      intentVideoRequired: val,
                    }))
                  }
                />
              </div>
              {signatureRequest.intentVideoRequired && (
                <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs font-semibold text-purple-900 mb-1 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    Signers will record:
                  </p>
                  <ul className="text-xs text-purple-800 space-y-0.5">
                    <li>• Their full name</li>
                    <li>• The document name &amp; date</li>
                    <li>• "I acknowledge and agree to sign"</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── 6. CC Recipients ── */}
          <SectionCard
            title="CC Recipients"
            subtitle="Copy people on completion without requiring their signature"
          >
            <div className="space-y-3">
              {(signatureRequest.ccRecipients || []).map((cc, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Mail className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Name
                          </label>
                          <Input
                            value={cc.name}
                            onChange={(e) =>
                              updateCC(index, "name", e.target.value)
                            }
                            placeholder="John Doe"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={cc.email}
                            onChange={(e) =>
                              updateCC(index, "email", e.target.value)
                            }
                            placeholder="john@company.com"
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Notify when
                        </label>
                        <select
                          value={cc.notifyWhen}
                          onChange={(e) =>
                            updateCC(index, "notifyWhen", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="completed">
                            When all signatures are completed
                          </option>
                          <option value="immediately">
                            Immediately after sending
                          </option>
                        </select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setSignatureRequest((prev) => ({
                          ...prev,
                          ccRecipients: (prev.ccRecipients || []).filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={() =>
                  setSignatureRequest((prev) => ({
                    ...prev,
                    ccRecipients: [
                      ...(prev.ccRecipients || []),
                      {
                        name: "",
                        email: "",
                        notifyWhen: "completed" as const,
                      },
                    ],
                  }))
                }
                className="w-full border-dashed border-2 h-11 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-xl"
              >
                <Mail className="h-4 w-4 mr-2" />
                Add CC Recipient
              </Button>
            </div>
          </SectionCard>

          {/* ── 7. Message & Due Date (send/draft mode only) ── */}
          {isSendMode && (
            <SectionCard title="Message & Timing">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Message to Recipients
                  </label>
                  <Textarea
                    value={signatureRequest.message || ""}
                    onChange={(e) =>
                      setSignatureRequest((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Please review and sign..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={signatureRequest.dueDate || ""}
                    onChange={(e) =>
                      setSignatureRequest((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}