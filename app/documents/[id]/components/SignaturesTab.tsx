"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ChevronUp, FileSignature } from "lucide-react";
import DocSendStyleCharts from "@/components/DocSendStyleCharts";
import RecipientPageChart from "./RecipientPageChart";
 

function formatTimeSig(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function formatAgoSig(dateStr: string | null): string {
  if (!dateStr) return "—";
  const secs = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  signed: { label: "Signed", color: "text-green-700", bg: "bg-green-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
  declined: { label: "Declined", color: "text-red-700", bg: "bg-red-100" },
  awaiting_turn: {
    label: "Awaiting Turn",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  delegated: {
    label: "Delegated",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-slate-500",
    bg: "bg-slate-100",
  },
};

export default function SignaturesTab({
  analytics,
  docId,
}: {
  analytics: any;
  docId: string;
}) {
  const [expandedRecipient, setExpandedRecipient] = useState<string | null>(
    null
  );

  if (!analytics) {
    return (
      <div className="py-32 text-center border-b border-slate-100">
        <FileSignature className="h-10 w-10 text-slate-200 mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          No signature requests yet
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Send this document for signature to start tracking
        </p>
      </div>
    );
  }

  const { recipients, summary, funnel, allSigned } = analytics;

  return (
    <div className="space-y-0">
      {allSigned && (
        <div className="py-4 px-4 mb-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-green-900">
            All recipients have signed! Document is complete.
          </p>
          <a
            href={`/signed/${recipients[0]?.id}`}
            className="ml-auto text-xs font-semibold text-green-700 underline"
          >
            Download signed PDF
          </a>
        </div>
      )}

      {/* ── SUMMARY KPIs ── */}
      <div className="py-5 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Overview
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-slate-100 mb-5">
          {[
            { label: "Sent", value: summary.total, color: "text-slate-900" },
            {
              label: "Opened",
              value: summary.viewed,
              color: "text-sky-600",
            },
            {
              label: "Signed",
              value: summary.signed,
              color: "text-green-600",
            },
            {
              label: "Declined",
              value: summary.declined,
              color: "text-red-500",
            },
          ].map((s) => (
            <div key={s.label} className="px-4 first:pl-0">
              <div
                className={`text-3xl font-black tabular-nums ${s.color}`}
              >
                {s.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">
              Completion
            </span>
            <span className="text-xs font-bold text-slate-900">
              {summary.completionRate}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── FUNNEL ── */}
      <div className="py-5 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Signing Funnel
        </p>
        <div className="flex items-end gap-3">
          {funnel.map((step: any, i: number) => (
            <div key={i} className="flex-1">
              <div
                className="flex items-end gap-1 mb-2"
                style={{ height: "80px" }}
              >
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max(step.pct, 4)}%`,
                    background:
                      i === 0
                        ? "#0ea5e9"
                        : i === 1
                        ? "#a855f7"
                        : "#22c55e",
                    opacity: 0.85,
                  }}
                />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {step.label}
              </p>
              <p className="text-xl font-black text-slate-900">{step.count}</p>
              <p className="text-[11px] text-slate-400">{step.pct}%</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-black text-violet-600 tabular-nums">
            {formatTimeSig(
              recipients.reduce(
                (sum: number, r: any) =>
                  sum + (r.totalTimeSpentSeconds || 0),
                0
              )
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total Time Spent
          </div>
        </div>
      </div>

      {/* ── PAGE ENGAGEMENT ── */}
      {analytics.pageEngagement && analytics.pageEngagement.length > 0 && (
        <div className="py-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5">
            Page Engagement — Signers
          </p>
          <DocSendStyleCharts
            documentId={docId}
            pageEngagement={analytics.pageEngagement}
            totalPages={
              analytics.totalDocPages || analytics.pageEngagement.length
            }
            locations={[]}
          />
        </div>
      )}

      {/* ── PER-RECIPIENT ROWS ── */}
      <div>
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">
            Recipients
          </h3>
          <span className="text-sm text-slate-400">
            {recipients.length} total
          </span>
        </div>

        {recipients.map((r: any) => {
          const isExpanded = expandedRecipient === r.id;
          const cfg = statusConfig[r.status] || statusConfig["pending"];

          return (
            <div
              key={r.id}
              className="border-b border-slate-100 last:border-b-0"
            >
              <div className="py-4 flex items-center gap-2 sm:gap-4">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: r.color || "#9333ea" }}
                >
                  {r.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {r.name}
                    </span>
                    {r.role && (
                      <span className="text-xs text-slate-400">
                        · {r.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{r.email}</p>
                </div>

                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.label}
                </span>

                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatTimeSig(r.totalTimeSpentSeconds)}
                  </p>
                  <p className="text-[11px] text-slate-400">reading</p>
                </div>

                <button
                  onClick={() =>
                    setExpandedRecipient(isExpanded ? null : r.id)
                  }
                  className="h-7 w-7 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {isExpanded && (
                <div className="pb-6 space-y-5">
                  {/* Timeline */}
                  <div className="flex items-center gap-0">
                    {[
                      { label: "Sent", time: r.sentAt, done: true },
                      {
                        label: "Opened",
                        time: r.viewedAt,
                        done: !!r.viewedAt,
                      },
                      {
                        label: "Signed",
                        time: r.signedAt,
                        done: !!r.signedAt,
                      },
                    ].map((step, i, arr) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              step.done ? "bg-violet-500" : "bg-slate-200"
                            }`}
                          >
                            {step.done ? "✓" : i + 1}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                            {step.label}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatAgoSig(step.time)}
                          </p>
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mb-5 ${
                              step.done ? "bg-violet-300" : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {r.status === "declined" && r.declineReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-800 mb-1">
                        Decline Reason:
                      </p>
                      <p className="text-sm text-red-700 italic">
                        "{r.declineReason}"
                      </p>
                      <p className="text-[11px] text-red-500 mt-1">
                        {formatAgoSig(r.declinedAt)}
                      </p>
                    </div>
                  )}

                  {r.delegatedTo && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 mb-1">
                        Delegated To:
                      </p>
                      <p className="text-sm text-purple-700">
                        {r.delegatedTo.name} ({r.delegatedTo.email})
                      </p>
                    </div>
                  )}

                  {r.pageData && r.pageData.length > 0 && (
                    <RecipientPageChart
                      pageData={r.pageData}
                      docId={docId}
                    />
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Views", value: r.viewCount || 0 },
                      {
                        label: "Time to Open",
                        value: formatTimeSig(r.timeToOpenSeconds),
                      },
                      {
                        label: "Time to Sign",
                        value: formatTimeSig(r.timeToSignSeconds),
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-slate-50 rounded-lg p-3 text-center"
                      >
                        <p className="text-lg font-black text-slate-900">
                          {s.value}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}