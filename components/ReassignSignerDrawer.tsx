"use client";

import { useState } from "react";
import { X, UserPlus, Mail, User, AlertTriangle, Check, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ReassignSignerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    shareId: string;
    recipientName: string;
    recipientEmail: string;
  };
  onReassigned: () => void;
}

export default function ReassignSignerDrawer({
  isOpen,
  onClose,
  link,
  onReassigned,
}: ReassignSignerDrawerProps) {
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValid =
    newName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());

  const handleReassign = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/signature/${link.shareId}/reassign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newName: newName.trim(),
          newEmail: newEmail.trim().toLowerCase(),
          allowOriginalToView: false,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to reassign signer");
        setLoading(false);
        return;
      }

      setDone(true);
      toast.success(`Document reassigned to ${newName}`);
      setTimeout(() => {
        onReassigned();
        handleClose();
      }, 1600);
    } catch {
      toast.error("Network error — please try again");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setNewName("");
    setNewEmail("");
    setDone(false);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Drawer:
          - Mobile  : bottom sheet, slides up, rounded top corners
          - sm+     : right side panel, full height, rounded left corners
      */}
      <div
        className="
          fixed z-50 bg-white flex flex-col
          inset-x-0 bottom-0 rounded-t-2xl max-h-[92vh]
          sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto
          sm:rounded-none sm:rounded-l-2xl sm:w-[480px] sm:max-h-full
        "
        style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.12), -8px 0 40px rgba(0,0,0,0.06)" }}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* ── Header ── */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between flex-shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-3">
            
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Signer</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Reassign this document to a new recipient
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">

          {/* From → To preview card */}
          <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            {/* Current */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Current
              </p>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                  {link.recipientName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate leading-tight">
                    {link.recipientName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{link.recipientEmail}</p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="h-7 w-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
              <ArrowRight className="h-3 w-3 text-slate-400" />
            </div>

            {/* New — live preview */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500 mb-2">
                New
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 transition-all duration-200"
                  style={{
                    background: newName
                      ? "linear-gradient(135deg, #7c3aed, #3b82f6)"
                      : "#e2e8f0",
                  }}
                >
                  {newName ? newName.charAt(0).toUpperCase() : (
                    <span className="text-slate-400 text-[10px]">?</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight">
                    {newName
                      ? <span className="text-slate-800">{newName}</span>
                      : <span className="text-slate-300 font-normal">Full name</span>
                    }
                  </p>
                  <p className="text-xs truncate">
                    {newEmail
                      ? <span className="text-slate-400">{newEmail}</span>
                      : <span className="text-slate-300">Email address</span>
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 mb-0.5">
                Access will be revoked immediately
              </p>
              <p className="text-xs text-red-500 leading-relaxed">
                <strong>{link.recipientName}</strong>'s signing link will be
                cancelled and they will be notified by email. This action
                cannot be undone.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              New Signer Details
            </p>

            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                <User className="h-3.5 w-3.5" /> Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jane Smith"
                disabled={loading || done}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 bg-white border border-slate-200 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 disabled:bg-slate-50"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. jane@company.com"
                disabled={loading || done}
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 bg-white border border-slate-200 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 disabled:bg-slate-50"
                onKeyDown={(e) => e.key === "Enter" && isValid && handleReassign()}
              />
            </div>
          </div>

          {/* What happens */}
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-xs font-bold text-blue-700 mb-2.5">What happens next</p>
            <ul className="space-y-2">
              {[
                `${link.recipientName || "Current signer"}'s link is cancelled`,
                "New signer receives a fresh signing link via email",
                "Document details and history remain unchanged",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-blue-600">
                  <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 sm:px-6 py-4 flex gap-3 flex-shrink-0 border-t border-slate-100 bg-white">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-all disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleReassign}
            disabled={!isValid || loading || done}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: done
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "linear-gradient(135deg, #7c3aed, #3b82f6)",
            }}
          >
            {done ? (
              <><Check className="h-4 w-4" /> Reassigned!</>
            ) : loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Reassigning...</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Reassign Document</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}