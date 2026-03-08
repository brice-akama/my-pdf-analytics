"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";

export default function SpacesList({ docId }: { docId: string }) {
  const router = useRouter();
  const [spaces, setSpaces] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/spaces", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSpaces(data.spaces?.slice(0, 5) || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="divide-y divide-slate-100">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <div className="h-9 w-9 rounded-xl bg-slate-100 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-12 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (spaces.length === 0) return null;

  return (
    <div className="divide-y divide-slate-100">
      {spaces.map((space) => (
        <div
          key={space._id}
          className="flex items-center gap-3 px-4 sm:px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ backgroundColor: space.color || "#8B5CF6" }}
          >
            {space.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {space.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-400">
                {space.documentsCount || 0} doc
                {space.documentsCount !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-200">·</span>
              <span className="text-[11px] text-slate-400">
                {space.teamMembers || 1} member
                {space.teamMembers !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
              space.isOwner
                ? "bg-violet-100 text-violet-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {space.isOwner ? "Owner" : space.role || "Member"}
          </span>
        </div>
      ))}
    </div>
  );
}