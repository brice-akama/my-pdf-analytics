// components/DashboardOverview.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Eye,
  Users,
  Link2,
  FileSignature,
  Radio,
  TrendingUp,
  Clock,
  FileText,
  ChevronRight,
  Flame,
  Shield,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0m 0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function formatTimeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function formatMMSS(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getDeviceIcon(device: string) {
  if (device === "mobile") return <Smartphone className="h-3 w-3" />;
  if (device === "tablet") return <Tablet className="h-3 w-3" />;
  return <Monitor className="h-3 w-3" />;
}


// ─── Detect touch device ──────────────────────────────────────────────────────

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(
      window.matchMedia("(hover: none) and (pointer: coarse)").matches
    );
  }, []);
  return isTouch;
}

// ─── Page Bar Chart ───────────────────────────────────────────────────────────

function PageBarChart({ visit, docId }: { visit: any; docId: string }) {
  const isTouch = useIsTouchDevice();
  const [activePage, setActivePage] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const maxT = Math.max(
    ...visit.pageData.map((p: any) => p.timeSpent || 0),
    1
  );
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!isTouch || activePage === null) return;
    function handler(e: TouchEvent) {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) {
        setActivePage(null);
      }
    }
    document.addEventListener("touchstart", handler);
    return () => document.removeEventListener("touchstart", handler);
  }, [isTouch, activePage]);

  return (
    <div
      ref={chartRef}
      className="relative"
      style={{ paddingLeft: "52px", paddingBottom: "28px" }}
    >
      {[maxT, Math.round(maxT * 0.5), 0].map((val, i) => (
        <div
          key={`y-label-${i}`}
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
      ))}

      {[0, 0.5, 1].map((frac, i) => (
        <div
          key={i}
          className="absolute right-0 border-t border-slate-100"
          style={{ left: "52px", top: `${frac * 100}%` }}
        />
      ))}

      <div className="relative flex items-end gap-1.5" style={{ height: "140px" }}>
        {visit.pageData.map((page: any) => {
          const heightPct = (page.timeSpent / maxT) * 100;
          const isActive = activePage === page.page;

          return (
            <div
              key={page.page}
              className="flex-1 flex flex-col items-center justify-end h-full relative"
              onMouseEnter={!isTouch ? () => setActivePage(page.page) : undefined}
              onMouseLeave={!isTouch ? () => setActivePage(null) : undefined}
              onTouchEnd={
                isTouch
                  ? (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActivePage((prev) =>
                        prev === page.page ? null : page.page
                      );
                    }
                  : undefined
              }
            >
              {!isTouch && isActive && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                  <div className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden w-48">
                    <div className="relative bg-slate-100" style={{ height: "120px" }}>
                      <iframe
                        src={`/api/documents/${docId}/page?page=${page.page}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                        className="w-full h-full border-0 pointer-events-none"
                        title={`Page ${page.page}`}
                      />
                      <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        P{page.page}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Page</p>
                        <p className="text-sm font-bold text-white">{page.page}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">Time</p>
                        <p className="text-sm font-bold text-white">{fmt(page.timeSpent)}</p>
                      </div>
                    </div>
                    <div className="h-1 bg-slate-800 mx-3 mb-3 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all"
                        style={{ width: `${Math.min((page.timeSpent / maxT) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center -mt-1">
                    <div className="w-2.5 h-2.5 bg-slate-900 rotate-45" />
                  </div>
                </div>
              )}

              <div
                className="w-full rounded-t-lg transition-all duration-150 cursor-pointer select-none"
                style={{
                  height: `${Math.max(heightPct, page.timeSpent > 0 ? 3 : 0)}%`,
                  backgroundColor: isActive ? "#0284c7" : "#38bdf8",
                  minHeight: page.timeSpent > 0 ? "4px" : "2px",
                  opacity: page.skipped ? 0.5 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5 pt-2.5">
        {visit.pageData.map((page: any) => (
          <div
               key={`x-${page.page}`} 
            className="flex-1 text-center text-[10px] text-slate-400 tabular-nums"
          >
            {page.page}
          </div>
        ))}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-3 min-w-[180px]">
      <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
      <p className="text-lg font-black text-slate-900 mb-2">
        {data?.views ?? 0}{" "}
        <span className="text-xs font-normal text-slate-500">
          {data?.views === 1 ? "visit" : "visits"}
        </span>
      </p>
      {data?.topDocs?.length > 0 && (
        <div className="border-t border-slate-100 pt-2 space-y-1">
          {data.topDocs.map((doc: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 truncate max-w-[120px]" title={doc.name}>
                {doc.name}
              </span>
              <span className="text-xs font-semibold text-slate-900 flex-shrink-0">
                {doc.views}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function KPICard({
  icon,
  label,
  value,
  sub,
  live,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div className="bg-white border-b border-r border-slate-100 px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400">{icon}</span>
        {live && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function IntentBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    high: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wide ${map[level] || map.low}`}
    >
      {level}
    </span>
  );
}

export default function DashboardOverview() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactTab, setContactTab] = useState<"my" | "team">("my");
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [expandedContact, setExpandedContact] = useState<string | null>(null);

  const handleTabChange = (tab: "my" | "team") => {
    setContactTab(tab);
    setShowAllContacts(false);
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/analytics", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (e) {
      setError("Could not load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-slate-400">{error || "No data"}</p>
      </div>
    );
  }

  const {
    totalViews,
    uniqueViewers,
    activeLinks,
    pendingSignatures,
    mostEngagedContacts = [],
    liveViewers,
    viewsByDate = [],
    topDocuments = [],
    recentVisits = [],
    hotVisitors = [],
    recentNDAs = [],
  } = analytics;

  const tickFormatter = (val: string, idx: number) => (idx % 5 === 0 ? val : "");

  return (
    <div className="space-y-0 bg-white border border-slate-200 rounded-lg overflow-hidden">

      {/* ── Most engaged contacts — shown first ─────────────────── */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Most engaged contacts
            </h2>
            <p className="text-xs text-slate-400">Last 30 days</p>
          </div>
          <div className="flex border border-slate-200 rounded-md overflow-hidden text-xs">
            <button
              onClick={() => handleTabChange("my")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                contactTab === "my"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              My documents
            </button>
            <button
              onClick={() => handleTabChange("team")}
              className={`px-3 py-1.5 font-medium transition-colors border-l border-slate-200 ${
                contactTab === "team"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
               Team documents
            </button>
          </div>
        </div>

        {(() => {
          const filtered = mostEngagedContacts.filter((c: any) =>
            contactTab === "team"
              ? c.source === "team" || c.source === "both"
              : c.source === "my" || c.source === "both" || !c.source
          );
          const visible = showAllContacts ? filtered : filtered.slice(0, 5);

          if (filtered.length === 0) {
            return (
              <div className="text-center py-10">
                <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  {contactTab === "team"
                    ? "No team document visits yet"
                    : "No contacts have viewed your documents yet"}
                </p>
              </div>
            );
          }

          return (
            <div>
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <div className="col-span-5">Contact</div>
                <div className="col-span-3">Document</div>
                <div className="col-span-1 text-center">Visits ↓</div>
                <div className="col-span-1 text-center">Docs</div>
                <div className="col-span-2 text-right">Time spent</div>
              </div>

              <div className="divide-y divide-slate-50">
                {visible.map((contact: any, i: number) => {
  const isExpanded = expandedContact === contact.email;

  return (
    <div key={i} className="divide-y divide-slate-50">
      {/* ── Main row ── */}
      <div className="grid grid-cols-12 gap-2 px-3 py-3 items-center hover:bg-slate-50 transition-colors group">
        <div className="col-span-5 flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate group-hover:text-violet-700 transition-colors">
              {contact.email.split("@")[0]}
            </p>
            <p className="text-[10px] text-slate-400">
              {contact.email} · {formatTimeAgo(contact.lastSeen)}
            </p>
          </div>
        </div>

        <div className="col-span-3 min-w-0">
          <p className="text-[10px] text-slate-500 truncate">
            {contact.topDocName || "—"}
          </p>
        </div>

        <div className="col-span-1 text-center">
          <span className="text-xs font-semibold text-slate-700 tabular-nums">
            {contact.visits}
          </span>
        </div>

        <div className="col-span-1 text-center">
          <span className="text-xs font-semibold text-slate-700 tabular-nums">
            {contact.docs}
          </span>
        </div>

        <div className="col-span-2 text-right flex items-center justify-end gap-2">
          <span className="text-xs font-mono font-semibold text-slate-700 tabular-nums">
            {formatMMSS(contact.totalTime)}
          </span>
          {/* Expand button — only show if pageData exists */}
          {contact.pageData?.length > 0 && (
            <button
              onClick={() => setExpandedContact(isExpanded ? null : contact.email)}
              className="h-5 w-5 flex items-center justify-center text-slate-300 hover:text-violet-600 transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

     {/* ── Expanded bar chart + Deal Insight ── */}
{isExpanded && contact.pageData?.length > 0 && (
  <div className="px-4 py-4 bg-slate-50/60 border-t border-slate-100">

    {/* Deal Insight narrative — shown if signals exist */}
    {contact.dealInsight && (
      <div className="mb-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px]">🎯</span>
          </div>
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
            Deal Insight
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed mb-2">
          {contact.dealInsight.narrative}
        </p>
        <div className="flex flex-wrap gap-2">
          {contact.dealInsight.reReadPages?.map((r: any) => (
            <span
              key={`${r.docId}-${r.page}`}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"
            >
              Page {r.page} re-read {r.count}× — {r.docName}
            </span>
          ))}
          {contact.dealInsight.videoReplays?.map((v: any) => (
            <span
              key={`${v.docId}-${v.page}`}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"
            >
              Page {v.page} video replayed {v.count}× — {v.docName}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Page bar chart */}
    <div className="flex items-center gap-2 mb-3">
      <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        Page engagement · {contact.topDocName || "document"}
      </span>
      <span className="ml-auto text-[10px] text-slate-400">
        {formatMMSS(contact.totalTime)} total
      </span>
    </div>
    <PageBarChart
      visit={{
        pageData: contact.pageData,
        visitType: "share",
      }}
      docId={contact.topDocId}
    />
  </div>
)}
    </div>
  );
})}
              </div>

              {filtered.length > 5 && (
                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setShowAllContacts((prev) => !prev)}
                    className="text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                  >
                    {showAllContacts
                      ? "Show less"
                      : `Show ${filtered.length - 5} more contact${filtered.length - 5 !== 1 ? "s" : ""}`}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Top documents + Recent visits + Hot visitors ─────────── */}
      <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100">

        {/* Top documents */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
              Top Documents
            </h3>
            <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
          </div>

          {topDocuments.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No documents yet</p>
          ) : (
            <div className="space-y-1">
              {topDocuments.map((doc: any, i: number) => (
                <button
                  key={doc.id}
                  onClick={() => router.push(`/documents/${doc.id}`)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded hover:bg-slate-50 transition-colors group text-left"
                >
                  <span className="text-xs text-slate-400 w-4 flex-shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate group-hover:text-violet-700 transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{doc.numPages} pages</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Eye className="h-3 w-3 text-slate-300" />
                    <span className="text-xs font-semibold text-slate-700 tabular-nums">
                      {doc.views}
                    </span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-violet-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent visits */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
              Recent Visits
            </h3>
            <Clock className="h-3.5 w-3.5 text-slate-400" />
          </div>

          {recentVisits.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No visits yet</p>
          ) : (
            <div className="space-y-1">
              {recentVisits.slice(0, 6).map((visit: any, i: number) => (
                <button
                  key={i}
                  onClick={() => router.push(`/documents/${visit.documentId}`)}
                  className="w-full flex items-start gap-2 px-2 py-2 rounded hover:bg-slate-50 transition-colors group text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {visit.email}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate" title={visit.documentName}>
                      {visit.documentName}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatTimeAgo(visit.startedAt)}
                    </span>
                    <div className="flex items-center gap-1 text-slate-300">
                      {getDeviceIcon(visit.device)}
                      {visit.location && (
                        <span className="text-[9px] text-slate-400 truncate max-w-[60px]">
                          {visit.location}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hot visitors + NDAs */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                Hot Visitors
              </h3>
              <Flame className="h-3.5 w-3.5 text-orange-400" />
            </div>

            {hotVisitors.length === 0 ? (
              <p className="text-xs text-slate-400 py-2 text-center">
                No high-intent visitors yet
              </p>
            ) : (
              <div className="space-y-1">
                {hotVisitors.map((v: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {v.email}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {v.visits} {v.visits === 1 ? "visit" : "visits"} ·{" "}
                        {v.totalTime > 0 ? formatTime(v.totalTime) : "—"} ·{" "}
                        {v.docsViewed} doc{v.docsViewed !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <IntentBadge level={v.intentLevel} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {recentNDAs.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
                  NDA Signings
                </h3>
                <Shield className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="space-y-1">
                {recentNDAs.map((n: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{n.email}</p>
                      <p className="text-[10px] text-slate-400 truncate">{n.documentName}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                      {formatTimeAgo(n.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hotVisitors.length === 0 && recentNDAs.length === 0 && (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">
                Share documents to start tracking engagement
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-slate-100">
        <KPICard
          icon={<Eye className="h-4 w-4" />}
          label="Total views"
          value={totalViews.toLocaleString()}
        />
        <KPICard
          icon={<Users className="h-4 w-4" />}
          label="Unique viewers"
          value={uniqueViewers.toLocaleString()}
        />
        <KPICard
          icon={<Link2 className="h-4 w-4" />}
          label="Active links"
          value={activeLinks.toLocaleString()}
        />
        <KPICard
          icon={<FileSignature className="h-4 w-4" />}
          label="Pending signatures"
          value={pendingSignatures.toLocaleString()}
        />
        <KPICard
          icon={<Radio className="h-4 w-4" />}
          label="Live right now"
          value={liveViewers}
          live={liveViewers > 0}
        />
      </div>

      {/* ── Visit stats chart — last ──────────────────────────── */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Visit stats</h2>
            <p className="text-xs text-slate-400">number per day · last 30 days</p>
          </div>
          {liveViewers > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              {liveViewers} viewing now
            </span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={viewsByDate}
            margin={{ top: 4, right: 16, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={tickFormatter}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="views"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${payload.date}`}
                    cx={cx}
                    cy={cy}
                    r={payload.views > 0 ? 3 : 2}
                    fill={payload.views > 0 ? "#7c3aed" : "#e2e8f0"}
                    stroke={payload.views > 0 ? "#7c3aed" : "#cbd5e1"}
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{ r: 5, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}