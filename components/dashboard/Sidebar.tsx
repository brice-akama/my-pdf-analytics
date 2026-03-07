"use client"

import {
  LayoutDashboard,
  Folder,
  FolderOpen,
  FileText,
  FileSignature,
  Inbox,
  Users,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageType =
  | "dashboard"
  | "content-library"
  | "spaces"
  | "agreements"
  | "file-requests"
  | "contacts"
  | "documents"
  | "reports"

interface SidebarItem {
  id: PageType
  icon: React.ElementType
  label: string
  badge: string | null
}

interface SidebarProps {
  activePage: PageType
  onNavigate: (page: PageType) => void
}

// ─── Data ─────────────────────────────────────────────────────────────────────

export const sidebarItems: SidebarItem[] = [
  { id: "dashboard",       icon: LayoutDashboard, label: "Dashboard",       badge: null },
  { id: "content-library", icon: Folder,          label: "Content library", badge: null },
  { id: "spaces",          icon: FolderOpen,      label: "Spaces",          badge: "Data rooms" },
  { id: "documents",       icon: FileText,        label: "Documents",       badge: null },
  { id: "agreements",      icon: FileSignature,   label: "Agreements",      badge: null },
  { id: "file-requests",   icon: Inbox,           label: "File requests",   badge: null },
  { id: "contacts",        icon: Users,           label: "Contacts",        badge: null },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white shadow-sm sticky top-16 h-[calc(100vh-64px)] flex-shrink-0">
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              activePage === item.id
                ? "bg-purple-50 text-purple-700"
                : "text-slate-700 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-xs text-slate-500 font-normal truncate flex-shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  )
}