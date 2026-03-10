// app/documents-page/components/Sidebar.tsx
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText, Upload, Folder, FolderOpen,
  Trash2, Users, X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type ActiveView = "documents" | "templates" | "archive" | "team-documents" | "team-templates"

type Props = {
  activeView: ActiveView
  setActiveView: (v: ActiveView) => void
  counts: {
    documents: number
    templates: number
    archive: number
    groupTemplates: number
    teamDocuments: number
    teamTemplates: number
  }
  teamName: string
  mobile?: boolean
  onClose?: () => void
  onUploadClick: () => void
  onFetchTeam: () => void
  onBulkMode: () => void
}

export default function Sidebar({
  activeView, setActiveView, counts, teamName,
  mobile, onClose, onUploadClick, onFetchTeam, onBulkMode,
}: Props) {
  const router = useRouter()

  const navItem = (view: ActiveView, icon: React.ReactNode, label: string, count: number) => (
    <button
      key={view}
      onClick={() => { setActiveView(view); if (view.startsWith("team")) onFetchTeam(); onClose?.() }}
      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
        activeView === view
          ? "bg-purple-50 text-purple-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <div className="flex items-center gap-2.5">{icon}<span>{label}</span></div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
        activeView === view ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-500"
      }`}>{count}</span>
    </button>
  )

  const content = (
    <nav className="flex-1 p-4 space-y-6">

      {/* Create button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm h-9">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 bg-white border border-slate-200 shadow-lg rounded-2xl p-1">
          <DropdownMenuItem onClick={() => { onUploadClick(); onClose?.() }}
            className="p-3 rounded-xl cursor-pointer hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div><p className="text-sm font-semibold text-slate-900">Document</p>
                <p className="text-xs text-slate-500">Upload a PDF document</p></div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => { onUploadClick(); onClose?.() }}
            className="p-3 rounded-xl cursor-pointer hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-4 w-4 text-purple-600" />
              </div>
              <div><p className="text-sm font-semibold text-slate-900">Template</p>
                <p className="text-xs text-slate-500">Reusable signable document</p></div>
            </div>
          </DropdownMenuItem>

          <div className="h-px bg-slate-100 my-1 mx-3" />

          <DropdownMenuItem onClick={() => { onBulkMode(); onClose?.() }}
            className="p-3 rounded-xl cursor-pointer hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div><p className="text-sm font-semibold text-slate-900">Select Existing</p>
                <p className="text-xs text-slate-500">Choose from uploaded documents</p></div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => { router.push("/templates/group/create"); onClose?.() }}
            className="p-3 rounded-xl cursor-pointer hover:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Folder className="h-4 w-4 text-purple-600" />
              </div>
              <div><p className="text-sm font-semibold text-slate-900">Group Template</p>
                <p className="text-xs text-slate-500">Multi-doc reusable workflow</p></div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Personal section */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">Personal</p>
        <div className="space-y-0.5">
          {navItem("documents", <FileText className="h-4 w-4 flex-shrink-0" />, "Documents", counts.documents)}
          {navItem("templates", <FolderOpen className="h-4 w-4 flex-shrink-0" />, "Templates", counts.templates)}
          {navItem("archive", <Trash2 className="h-4 w-4 flex-shrink-0" />, "Archive", counts.archive)}
          <button
            onClick={() => { router.push("/templates/group"); onClose?.() }}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span>Group Templates</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
              {counts.groupTemplates}
            </span>
          </button>
        </div>
      </div>

      {/* Team section */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Team — {teamName}
        </p>
        <div className="space-y-0.5">
          {navItem("team-documents", <Users className="h-4 w-4 flex-shrink-0" />, "Documents", counts.teamDocuments)}
          {navItem("team-templates", <FolderOpen className="h-4 w-4 flex-shrink-0" />, "Templates", counts.teamTemplates)}
        </div>
      </div>
    </nav>
  )

  if (mobile) {
    return (
      <AnimatePresence>
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-[280px] bg-white z-[70] lg:hidden flex flex-col shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                DocMetrics
              </span>
              <button onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            {content}
          </motion.div>
        </>
      </AnimatePresence>
    )
  }

  return (
    <aside className="hidden lg:flex w-60 flex-col border-r border-slate-200 bg-white min-h-screen flex-shrink-0">
      {content}
    </aside>
  )
}