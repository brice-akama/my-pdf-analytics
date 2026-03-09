"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LinkIcon,
  Mail,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Check,
  FileSignature,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)} min ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  return `${Math.floor(secs / 86400)} days ago`;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0m 0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function ActivityTab({
  analytics,
  doc,
  token,
  onCreateLink,
  onEditLink,
  onOpenShareDrawer,
  onConfirm,
}: {
  analytics: any;
  doc: any;
  token: string;
  onCreateLink: () => void;
  onEditLink: (link: any) => void;
  onOpenShareDrawer: (
    link: any,
    mode: "edit" | "duplicate",
    settings: any
  ) => void;
  onConfirm: (opts: {
    title: string;
    message: string;
    danger?: boolean;
    onConfirm: () => void;
  }) => void;
}) {
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const [hoveredPage, setHoveredPage] = useState<{
    visitKey: string;
    page: number;
  } | null>(null);
  const [shareLinks, setShareLinks] = useState<any[]>([]);

  React.useEffect(() => {
    Promise.all([
      fetch(`/api/documents/${doc._id}/share`, {
        credentials: "include",
      }).then((r) => r.json()),
      fetch(`/api/documents/${doc._id}/signature-requests`, {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([shareData, sigData]) => {
        const links: any[] = [];

        if (shareData.success && shareData.shares) {
          shareData.shares.forEach((s: any) => {
            links.push({
              shareId: s.id,
              name: doc.filename,
              recipientEmail: s.recipientEmail,
              recipientName: s.recipientName,
              createdAgo: formatAgo(new Date(s.createdAt)),
              link: s.shareLink,
              visits: s.tracking?.views || 0,
              totalTime: formatTime(s.tracking?.totalTimeSpent || 0),
              lastViewed: s.tracking?.lastViewedAt
                ? formatAgo(new Date(s.tracking.lastViewedAt))
                : null,
              completion: `${Math.round(
                ((s.tracking?.views || 0) / Math.max(1, doc.numPages)) * 100
              )}%`,
              enabled: s.active && !s.expired,
              linkType: "share",
              settings: {
                requireEmail: s.settings?.requireEmail ?? true,
                allowDownload: s.settings?.allowDownload ?? false,
                allowPrint: s.settings?.allowPrint ?? true,
                allowForwarding: s.settings?.allowForwarding ?? true,
                notifyOnDownload: s.settings?.notifyOnDownload ?? false,
                selfDestruct: s.settings?.selfDestruct ?? false,
                enableWatermark: s.settings?.enableWatermark ?? false,
                watermarkText: s.settings?.watermarkText ?? "",
                watermarkPosition: s.settings?.watermarkPosition ?? "bottom",
                requireNDA: s.settings?.requireNDA ?? false,
                ndaTemplateId: s.settings?.ndaTemplateId ?? "",
                customMessage: s.settings?.customMessage ?? "",
                sharedByName: s.settings?.sharedByName ?? "",
                logoUrl: s.settings?.logoUrl ?? "",
                viewLimit: s.settings?.viewLimit,
                downloadLimit: s.settings?.downloadLimit,
                linkType: s.settings?.linkType ?? "public",
                password: "",
                expiresIn: s.settings?.expiresIn ?? 7,
              },
            });
          });
        }

        if (sigData.success && sigData.requests) {
          sigData.requests.forEach((r: any) => {
            links.push({
              shareId: r.uniqueId,
              recipientEmail: r.email,
              recipientName: r.name,
              createdAgo: r.createdAt ? formatAgo(new Date(r.createdAt)) : "—",
              link: r.signingLink,
              visits: r.viewCount || 0,
              totalTime: formatTime(r.totalTimeSpentSeconds || 0),
              lastViewed: r.viewedAt
                ? formatAgo(new Date(r.viewedAt))
                : null,
              completion:
                r.status === "signed" || r.status === "completed"
                  ? "100%"
                  : r.viewedAt
                  ? "In progress"
                  : "—",
              enabled: !["cancelled", "declined", "expired"].includes(r.status),
              linkType: r.linkType,
              source: r.source,
              signatureStatus: r.status,
              pageData: r.pageData || [],
              envelopeId: r.envelopeId || null,
              documentCount: r.documentCount || 1,
              settings: {},
            });
          });
        }

        setShareLinks(links);
      })
      .catch((err) => console.error("Failed to fetch links:", err));
  }, [doc._id, doc.filename, doc.numPages]);

  const allLinks = shareLinks;

  const shareVisits: any[] = (analytics.recipientPageTracking || []).map(
    (r: any, i: number) => ({
      key: r.recipientEmail || `anon-${i}`,
      email: r.recipientEmail || "Anonymous",
      senderName: doc.filename,
      timeAgo: r.firstOpened
        ? formatAgo(new Date(r.firstOpened))
        : "Unknown",
      totalTime: r.totalTimeOnDoc || "0m 0s",
      totalTimeSeconds: r.totalTimeSeconds || 0,
      location: analytics.locations?.[0]?.country || "Unknown",
      city: analytics.locations?.[0]?.topCities?.[0] || "",
      country: analytics.locations?.[0]?.country || "Unknown",
      pageData: r.pageData || [],
      bounced: r.bounced || false,
      firstOpened: r.firstOpened || null,
      visitType: "share",
    })
  );

  const sigVisits: any[] = shareLinks
    .filter((lnk) => lnk.linkType === "signature" && lnk.visits > 0)
    .map((lnk) => ({
      key: `sig-${lnk.shareId}`,
      email: lnk.recipientEmail || "Unknown",
      senderName: doc.filename,
      timeAgo: lnk.lastViewed || lnk.createdAgo,
      totalTime: lnk.totalTime || "0m 0s",
      totalTimeSeconds: 0,
      location: "Unknown",
      city: "",
      country: "Unknown",
      pageData: lnk.pageData || [],
      bounced: false,
      firstOpened: null,
      visitType: "signature",
      signatureStatus: lnk.signatureStatus,
    }));

  const allVisits: any[] = [...shareVisits, ...sigVisits];

  const getMaxTime = (pageData: any[]) =>
    Math.max(...pageData.map((p: any) => p.timeSpent || 0), 1);

  return (
    <div className="space-y-0">
      {/* ══ ALL VISITS SECTION ══ */}
      <div>
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">All Visits</h3>
          <span className="text-sm text-slate-400">
            {allVisits.length} {allVisits.length === 1 ? "visit" : "visits"}
          </span>
        </div>

        {allVisits.length === 0 ? (
          <div className="py-12 text-center border-b border-slate-100">
            <p className="text-sm text-slate-400">
              No visits yet. Once someone opens your link, they'll appear here.
            </p>
          </div>
        ) : (
          <div>
            {allVisits.map((visit) => {
              const isExpanded = expandedVisit === visit.key;
              const maxTime = getMaxTime(visit.pageData);

              return (
                <div
                  key={visit.key}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <div className="py-4 flex items-center gap-2 sm:gap-4">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                      {visit.email !== "Anonymous"
                        ? visit.email.charAt(0).toUpperCase()
                        : "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">
                          {visit.email}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {visit.senderName}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">
                          {visit.timeAgo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {visit.city && visit.city !== "Unknown"
                            ? `${visit.city}, `
                            : ""}
                          {visit.country}
                        </span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                      <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-500">
                          S
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium truncate max-w-[120px]">
                        {visit.senderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                      {visit.bounced ? (
                        <span className="text-xs font-medium text-red-500">
                          Bounced
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <svg
                            className="h-4 w-4 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M9 12l2 2 4-4"
                            />
                          </svg>
                          <span className="text-sm font-bold text-slate-800 tabular-nums">
                            {visit.totalTime}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() =>
                          setExpandedVisit(isExpanded ? null : visit.key)
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
                  </div>

                  {isExpanded && (
                    <div className="pb-6">
                      <div className="flex items-center gap-4 px-1 pb-4 mb-4 border-b border-slate-100 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              visit.visitType === "signature"
                                ? "bg-purple-500"
                                : "bg-sky-500"
                            }`}
                          />
                          <span className="text-xs font-semibold text-slate-500">
                            {visit.visitType === "signature"
                              ? "✍️ Signature request"
                              : "🔗 Share link view"}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {visit.city && visit.city !== "Unknown"
                            ? `${visit.city}, `
                            : ""}
                          {visit.country}
                        </span>
                        <span className="text-xs text-slate-400">
                          {visit.timeAgo}
                        </span>
                        {visit.visitType === "signature" &&
                          visit.signatureStatus && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                visit.signatureStatus === "signed"
                                  ? "bg-green-100 text-green-700"
                                  : visit.signatureStatus === "declined"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {visit.signatureStatus === "signed"
                                ? "✓ Signed"
                                : visit.signatureStatus === "declined"
                                ? "✗ Declined"
                                : "⏳ Pending"}
                            </span>
                          )}
                        <span className="ml-auto text-sm font-bold text-slate-900 tabular-nums">
                          {visit.totalTime}
                        </span>
                      </div>

                      {visit.pageData && visit.pageData.length > 0 ? (
                        <div
                          className="relative"
                          style={{
                            paddingLeft: "52px",
                            paddingBottom: "28px",
                          }}
                        >
                          {(() => {
                            const maxT = Math.max(
                              ...visit.pageData.map(
                                (p: any) => p.timeSpent || 0
                              ),
                              1
                            );
                            const fmt = (s: number) =>
                              `${String(Math.floor(s / 60)).padStart(
                                2,
                                "0"
                              )}:${String(s % 60).padStart(2, "0")}`;
                            return [maxT, Math.round(maxT * 0.5), 0].map(
                              (val, i) => (
                                <div
                                  key={i}
                                  className="absolute text-right text-[10px] text-slate-400 font-mono leading-none"
                                  style={{
                                    left: 0,
                                    top: `${(i / 2) * 100}%`,
                                    width: "44px",
                                    transform: "translateY(-50%)",
                                  }}
                                >
                                  {fmt(val)}
                                </div>
                              )
                            );
                          })()}

                          {[0, 0.5, 1].map((frac, i) => (
                            <div
                              key={i}
                              className="absolute left-0 right-0 border-t border-slate-100"
                              style={{ left: "52px", top: `${frac * 100}%` }}
                            />
                          ))}

                          {(() => {
                            const maxT = Math.max(
                              ...visit.pageData.map(
                                (p: any) => p.timeSpent || 0
                              ),
                              1
                            );
                            return (
                              <div
                                className="relative flex items-end gap-1.5"
                                style={{ height: "140px" }}
                              >
                                {visit.pageData.map((page: any) => {
                                  const heightPct =
                                    (page.timeSpent / maxT) * 100;
                                  const isHov =
                                    hoveredPage?.visitKey === visit.key &&
                                    hoveredPage?.page === page.page;
                                  const barColor =
                                    visit.visitType === "signature"
                                      ? isHov
                                        ? "#7c3aed"
                                        : "#a78bfa"
                                      : isHov
                                      ? "#0284c7"
                                      : "#38bdf8";

                                  return (
                                    <div
                                      key={page.page}
                                      className="flex-1 flex flex-col items-center justify-end h-full relative group/bar"
                                      onMouseEnter={() =>
                                        setHoveredPage({
                                          visitKey: visit.key,
                                          page: page.page,
                                        })
                                      }
                                      onMouseLeave={() =>
                                        setHoveredPage(null)
                                      }
                                    >
                                      {isHov && (
                                        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                          <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden w-48">
                                            <div
                                              className="relative bg-slate-100"
                                              style={{ height: "120px" }}
                                            >
                                              <iframe
                                                src={`/api/documents/${doc._id}/page?page=${page.page}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                                className="w-full h-full border-0 pointer-events-none"
                                                title={`Page ${page.page}`}
                                              />
                                              <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                P{page.page}
                                              </div>
                                            </div>
                                            <div className="flex items-center justify-between px-3 py-2.5">
                                              <div>
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                                                  Page
                                                </p>
                                                <p className="text-sm font-bold text-white">
                                                  {page.page}{" "}
                                                  <span className="text-slate-500 font-normal text-xs">
                                                    / {visit.pageData.length}
                                                  </span>
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-wider">
                                                  Time
                                                </p>
                                                <p className="text-sm font-bold text-white">
                                                  {String(
                                                    Math.floor(
                                                      page.timeSpent / 60
                                                    )
                                                  ).padStart(2, "0")}
                                                  :
                                                  {String(
                                                    page.timeSpent % 60
                                                  ).padStart(2, "0")}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="h-1 bg-slate-800 mx-3 mb-3 rounded-full overflow-hidden">
                                              <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                  width: `${Math.min(
                                                    (page.timeSpent / maxT) *
                                                      100,
                                                    100
                                                  )}%`,
                                                  background:
                                                    visit.visitType ===
                                                    "signature"
                                                      ? "#a78bfa"
                                                      : "#38bdf8",
                                                }}
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-center -mt-1">
                                            <div className="w-2.5 h-2.5 bg-slate-900 rotate-45" />
                                          </div>
                                        </div>
                                      )}

                                      <div
                                        className="w-full rounded-t-lg transition-all duration-150 cursor-pointer"
                                        style={{
                                          height: `${Math.max(
                                            heightPct,
                                            page.timeSpent > 0 ? 3 : 0
                                          )}%`,
                                          backgroundColor: page.skipped
                                            ? "#e2e8f0"
                                            : barColor,
                                          minHeight:
                                            page.timeSpent > 0 ? "4px" : "2px",
                                          opacity: page.skipped ? 0.5 : 1,
                                        }}
                                      />

                                      {page.visits > 1 && (
                                        <div
                                          className="absolute -top-1 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-white shadow-sm"
                                          title={`Revisited ${page.visits} times`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          <div className="flex gap-1.5 pt-2.5">
                            {visit.pageData.map((page: any) => (
                              <div
                                key={page.page}
                                className="flex-1 text-center text-[10px] text-slate-400 tabular-nums"
                              >
                                {page.page}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-6 text-center">
                          <div>
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                              <BarChart2 className="h-5 w-5 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-400">
                              No page data yet
                            </p>
                            <p className="text-[11px] text-slate-300 mt-0.5">
                              {visit.visitType === "signature"
                                ? "Recipient hasn't opened yet"
                                : "Waiting for first view"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-8" />

      {/* ══ ALL LINKS SECTION ══ */}
      <div>
        <div className="flex items-center justify-between py-4 border-b border-slate-200">
          <h3 className="text-base font-semibold text-slate-900">All Links</h3>
          <button
            onClick={onCreateLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
          >
            <LinkIcon className="h-3 w-3" /> New Link
          </button>
        </div>

        <div
          className="hidden sm:grid items-center py-2 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wide"
          style={{ gridTemplateColumns: "1fr 2fr auto auto auto" }}
        >
          <span>NAME</span>
          <span>LINK</span>
          <span className="text-center">ACTIVE</span>
          <span className="text-right mr-10">ACTIVITY</span>
          <span />
        </div>

        {allLinks.length === 0 ? (
          <div className="py-12 text-center border-b border-slate-100">
            <p className="text-sm text-slate-400">No links yet.</p>
          </div>
        ) : (
          allLinks.map((lnk, i) => (
            <div key={i}>
              {/* ── DESKTOP ROW ── */}
              <div
                className="hidden sm:grid items-center py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors group"
                style={{ gridTemplateColumns: "1fr 2fr auto auto auto" }}
              >
                <div className="flex items-center gap-2 pr-4">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(
                        lnk.recipientName ||
                        lnk.recipientEmail ||
                        "P"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                 <div className="min-w-0">
  <p className="text-sm font-semibold text-slate-900 truncate">
    {lnk.recipientName || (lnk.settings?.linkType === 'domain-restricted' ? `@${lnk.settings?.allowedDomain || 'domain'}` : 'Public link')}
  </p>
  {lnk.recipientEmail ? (
    <p className="text-xs text-slate-400 truncate">{lnk.recipientEmail}</p>
  ) : lnk.settings?.linkType === 'domain-restricted' ? (
    <p className="text-xs text-violet-500 truncate font-medium">Domain restricted</p>
  ) : (
    <p className="text-xs text-slate-400">{lnk.createdAgo}</p>
  )}
</div>
                </div>

                <div className="flex items-center gap-2 pr-4 min-w-0">
                  <div className="h-5 w-5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-xs text-slate-600 font-mono truncate flex-1">
                    {lnk.link
                      .replace("https://", "")
                      .replace("http://", "")}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lnk.link);
                      toast.success("Copied!", { duration: 2000 });
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-slate-400 hover:text-violet-600"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/documents/${doc._id}/share`,
                          {
                            method: "PATCH",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              shareId: lnk.shareId,
                              active: !lnk.enabled,
                            }),
                          }
                        );
                        if (res.ok) {
                          toast.success(
                            lnk.enabled ? "Link disabled" : "Link enabled"
                          );
                          window.location.reload();
                        } else {
                          toast.error("Failed to update link");
                        }
                      } catch {
                        toast.error("Network error");
                      }
                    }}
                    className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors"
                    style={{
                      background: lnk.enabled ? "#7c3aed" : "#e2e8f0",
                    }}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        lnk.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-end mr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1.5 hover:text-violet-600 transition-colors">
                        <span className="text-sm font-bold text-slate-900">
                          {lnk.visits}
                        </span>
                        <span className="text-xs text-slate-400">
                          {lnk.visits === 1 ? "visit" : "visits"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-white p-3 space-y-2"
                    >
                      {[
                        ["Total visits", lnk.visits],
                        ["Time spent", lnk.totalTime || "0m 0s"],
                        ["Last viewed", lnk.lastViewed || "Never"],
                        ["Completion", lnk.completion || "0%"],
                      ].map(([label, val]) => (
                        <div
                          key={label as string}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs text-slate-500">
                            {label}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {val}
                          </span>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-700">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuItem
                        onClick={() => {
                          onOpenShareDrawer(lnk, "edit", {
                            requireEmail: lnk.settings.requireEmail,
                            allowDownload: lnk.settings.allowDownload,
                            allowPrint: lnk.settings.allowPrint,
                            allowForwarding: lnk.settings.allowForwarding,
                            notifyOnDownload: lnk.settings.notifyOnDownload,
                            selfDestruct: lnk.settings.selfDestruct,
                            enableWatermark: lnk.settings.enableWatermark,
                            watermarkText: lnk.settings.watermarkText,
                            watermarkPosition: lnk.settings.watermarkPosition,
                            requireNDA: lnk.settings.requireNDA,
                            ndaTemplateId: lnk.settings.ndaTemplateId,
                            customMessage: lnk.settings.customMessage,
                            sharedByName: lnk.settings.sharedByName,
                            logoUrl: lnk.settings.logoUrl,
                            viewLimit: lnk.settings.viewLimit,
                            downloadLimit: lnk.settings.downloadLimit,
                            linkType: lnk.settings.linkType,
                            expiresIn: lnk.settings.expiresIn,
                            password: "",
                            recipientEmails: lnk.recipientEmail
                              ? [lnk.recipientEmail]
                              : [],
                            recipientNames: lnk.recipientName
                              ? [lnk.recipientName]
                              : [],
                            sendEmailNotification: false,
                            allowedEmails: lnk.recipientEmail
                              ? [lnk.recipientEmail]
                              : [],
                            ndaText: "",
                            customNdaText: "",
                            useCustomNda: false,
                            availableFrom: "",
                          });
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit link settings</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          onOpenShareDrawer(lnk, "duplicate", {
                            requireEmail: lnk.settings.requireEmail,
                            allowDownload: lnk.settings.allowDownload,
                            allowPrint: lnk.settings.allowPrint,
                            allowForwarding: lnk.settings.allowForwarding,
                            notifyOnDownload: lnk.settings.notifyOnDownload,
                            selfDestruct: lnk.settings.selfDestruct,
                            enableWatermark: lnk.settings.enableWatermark,
                            watermarkText: lnk.settings.watermarkText,
                            watermarkPosition: lnk.settings.watermarkPosition,
                            requireNDA: lnk.settings.requireNDA,
                            ndaTemplateId: lnk.settings.ndaTemplateId,
                            customMessage: lnk.settings.customMessage,
                            sharedByName: lnk.settings.sharedByName,
                            logoUrl: lnk.settings.logoUrl,
                            viewLimit: lnk.settings.viewLimit,
                            downloadLimit: lnk.settings.downloadLimit,
                            linkType: lnk.settings.linkType,
                            expiresIn: lnk.settings.expiresIn,
                            password: "",
                            recipientEmails: lnk.recipientEmail
                              ? [lnk.recipientEmail]
                              : [],
                            recipientNames: lnk.recipientName
                              ? [lnk.recipientName + " (Copy)"]
                              : [],
                            sendEmailNotification: false,
                            allowedEmails: lnk.recipientEmail
                              ? [lnk.recipientEmail]
                              : [],
                            ndaText: "",
                            customNdaText: "",
                            useCustomNda: false,
                            availableFrom: "",
                          });
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        <span>Duplicate link</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          onConfirm({
                            title: "Delete Link",
                            message: `Are you sure you want to permanently delete the link for ${
                              lnk.recipientName ||
                              lnk.recipientEmail ||
                              "this recipient"
                            }?`,
                            danger: true,
                            onConfirm: async () => {
                              try {
                                const res = await fetch(
                                  `/api/documents/${doc._id}/share?shareId=${lnk.shareId}`,
                                  { method: "DELETE", credentials: "include" }
                                );
                                if (res.ok) {
                                  toast.success("Link deleted");
                                  window.location.reload();
                                } else toast.error("Failed to delete link");
                              } catch {
                                toast.error("Network error");
                              }
                            },
                          });
                        }}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete this link</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* ── MOBILE LINK CARD ── */}
              <div className="sm:hidden py-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {(
                        lnk.recipientName ||
                        lnk.recipientEmail ||
                        "P"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {lnk.recipientName || "Public link"}
                        </p>
                        {lnk.recipientEmail && (
                          <p className="text-xs text-slate-400 truncate">
                            {lnk.recipientEmail}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `/api/documents/${doc._id}/share`,
                              {
                                method: "PATCH",
                                credentials: "include",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  shareId: lnk.shareId,
                                  active: !lnk.enabled,
                                }),
                              }
                            );
                            if (res.ok) {
                              toast.success(
                                lnk.enabled ? "Link disabled" : "Link enabled"
                              );
                              window.location.reload();
                            } else toast.error("Failed to update link");
                          } catch {
                            toast.error("Network error");
                          }
                        }}
                        className="w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-colors flex-shrink-0"
                        style={{
                          background: lnk.enabled ? "#7c3aed" : "#e2e8f0",
                        }}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            lnk.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-xs text-slate-500 font-mono truncate flex-1">
                        {lnk.link
                          .replace("https://", "")
                          .replace("http://", "")}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(lnk.link);
                          toast.success("Copied!", { duration: 2000 });
                        }}
                        className="text-slate-400 hover:text-violet-600 flex-shrink-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-bold text-slate-800">
                        {lnk.visits}
                      </span>
                      <span>
                        {lnk.visits === 1 ? "visit" : "visits"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{lnk.totalTime || "0m 0s"}</span>
                      <span className="text-slate-300">·</span>
                      <span>{lnk.createdAgo}</span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="ml-auto text-slate-400 hover:text-slate-700">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-white"
                        >
                          <DropdownMenuItem
                            onClick={() => {
                              onOpenShareDrawer(lnk, "edit", {
                                requireEmail: lnk.settings.requireEmail,
                                allowDownload: lnk.settings.allowDownload,
                                allowPrint: lnk.settings.allowPrint,
                                allowForwarding: lnk.settings.allowForwarding,
                                notifyOnDownload:
                                  lnk.settings.notifyOnDownload,
                                selfDestruct: lnk.settings.selfDestruct,
                                enableWatermark: lnk.settings.enableWatermark,
                                watermarkText: lnk.settings.watermarkText,
                                watermarkPosition:
                                  lnk.settings.watermarkPosition,
                                requireNDA: lnk.settings.requireNDA,
                                ndaTemplateId: lnk.settings.ndaTemplateId,
                                customMessage: lnk.settings.customMessage,
                                sharedByName: lnk.settings.sharedByName,
                                logoUrl: lnk.settings.logoUrl,
                                viewLimit: lnk.settings.viewLimit,
                                downloadLimit: lnk.settings.downloadLimit,
                                linkType: lnk.settings.linkType,
                                expiresIn: lnk.settings.expiresIn,
                                password: "",
                                recipientEmails: lnk.recipientEmail
                                  ? [lnk.recipientEmail]
                                  : [],
                                recipientNames: lnk.recipientName
                                  ? [lnk.recipientName]
                                  : [],
                                sendEmailNotification: false,
                                allowedEmails: lnk.recipientEmail
                                  ? [lnk.recipientEmail]
                                  : [],
                                ndaText: "",
                                customNdaText: "",
                                useCustomNda: false,
                                availableFrom: "",
                              });
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit settings</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              onConfirm({
                                title: "Delete Link",
                                message: `Are you sure you want to permanently delete the link for ${
                                  lnk.recipientName ||
                                  lnk.recipientEmail ||
                                  "this recipient"
                                }?`,
                                danger: true,
                                onConfirm: async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/documents/${doc._id}/share?shareId=${lnk.shareId}`,
                                      {
                                        method: "DELETE",
                                        credentials: "include",
                                      }
                                    );
                                    if (res.ok) {
                                      toast.success("Link deleted");
                                      window.location.reload();
                                    } else toast.error("Failed to delete");
                                  } catch {
                                    toast.error("Network error");
                                  }
                                },
                              });
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete link</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}