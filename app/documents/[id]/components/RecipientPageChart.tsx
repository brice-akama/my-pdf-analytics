"use client";

import { useState } from "react";

export default function RecipientPageChart({
  pageData,
  docId,
}: {
  pageData: any[];
  docId: string;
}) {
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const maxTime = Math.max(...pageData.map((p: any) => p.timeSpent || 0), 1);

  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Time Spent Per Page
      </p>
      <div
        className="relative"
        style={{ paddingLeft: "52px", paddingBottom: "28px" }}
      >
        {/* Y-axis labels */}
        {[maxTime, Math.round(maxTime * 0.5), 0].map((val, i) => (
          <div
            key={i}
            className="absolute text-right text-[10px] text-slate-400 font-mono"
            style={{
              left: 0,
              top: `${(i / 2) * 100}%`,
              width: "44px",
              transform: "translateY(-50%)",
            }}
          >
            {`${String(Math.floor(val / 60)).padStart(2, "0")}:${String(
              val % 60
            ).padStart(2, "0")}`}
          </div>
        ))}

        {/* Gridlines */}
        <div
          className="absolute inset-0"
          style={{ paddingLeft: "52px", paddingBottom: "28px" }}
        >
          {[0, 0.5, 1].map((frac, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 border-t border-slate-100"
              style={{ top: `${frac * 100}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div
          className="relative flex items-end gap-2"
          style={{ height: "160px" }}
        >
          {pageData.map((page: any) => {
            const heightPct =
              maxTime > 0 ? (page.timeSpent / maxTime) * 100 : 0;
            const isHov = hoveredPage === page.page;

            return (
              <div
                key={page.page}
                className="flex-1 flex flex-col items-center justify-end h-full relative"
                onMouseEnter={() => setHoveredPage(page.page)}
                onMouseLeave={() => setHoveredPage(null)}
              >
                {/* Tooltip with PDF preview */}
                {isHov && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                    <div
                      className="bg-slate-900 rounded-xl shadow-2xl overflow-hidden"
                      style={{ width: "200px" }}
                    >
                      <div
                        className="relative bg-white"
                        style={{ height: "130px" }}
                      >
                        <iframe
                          src={`/api/documents/${docId}/page?page=${page.page}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                          className="w-full h-full border-0 pointer-events-none"
                          title={`Page ${page.page} preview`}
                        />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                            PAGE
                          </p>
                          <p className="text-sm font-bold text-white">
                            {page.page} / {pageData.length}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                            TIME SPENT
                          </p>
                          <p className="text-sm font-bold text-white">
                            {String(
                              Math.floor(page.timeSpent / 60)
                            ).padStart(2, "0")}
                            :
                            {String(page.timeSpent % 60).padStart(2, "0")}
                          </p>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-700">
                        <div
                          className="h-full bg-violet-400 transition-all"
                          style={{
                            width: `${Math.min(
                              (page.timeSpent / maxTime) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5" />
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className="w-full rounded-t transition-all cursor-pointer"
                  style={{
                    height: `${Math.max(
                      heightPct,
                      page.timeSpent > 0 ? 2 : 0
                    )}%`,
                    background: isHov
                      ? "#7c3aed"
                      : page.skipped
                      ? "#e2e8f0"
                      : "#a855f7",
                    minHeight: page.timeSpent > 0 ? "4px" : "0",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis page numbers */}
        <div className="flex gap-2 pt-2">
          {pageData.map((page: any) => (
            <div
              key={page.page}
              className="flex-1 text-center text-xs text-slate-400"
            >
              {page.page}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}