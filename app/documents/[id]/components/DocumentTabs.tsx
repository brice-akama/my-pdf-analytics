"use client";

import { ChevronDown } from "lucide-react";

type Tab = "activity" | "performance" | "signatures" | "utilization";

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "activity", label: "Activity", emoji: "📋" },
  { id: "performance", label: "Performance", emoji: "📊" },
  { id: "signatures", label: "Signatures", emoji: "✍️" },
  { id: "utilization", label: "Utilization", emoji: "📈" },
];

export default function DocumentTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-[65px] z-40 mt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Mobile: dropdown */}
        <div className="flex md:hidden py-3">
          <div className="relative w-full">
            <select
              value={activeTab}
              onChange={(e) => onTabChange(e.target.value as Tab)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 pr-10 cursor-pointer"
            >
              {TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.emoji} {tab.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Desktop: tab bar */}
        <div className="hidden md:flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}