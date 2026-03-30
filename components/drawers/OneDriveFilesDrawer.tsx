"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer } from "@/components/ui/drawer"
import { motion } from "framer-motion"
import { FileText, Search, Download, Loader2, X } from "lucide-react"

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  if (seconds < 3600) return Math.floor(seconds / 60) + " min ago"
  if (seconds < 86400) return Math.floor(seconds / 3600) + " hours ago"
  if (seconds < 604800) return Math.floor(seconds / 86400) + " days ago"
  return date.toLocaleDateString()
}

type Props = {
  open: boolean
  onClose: () => void
  files: any[]
  loading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedFiles: Set<string>
  onToggleFile: (id: string) => void
  onImportSelected: () => void
  onDisconnect: () => void
  connectedEmail?: string
}

export default function OneDriveFilesDrawer({
  open,
  onClose,
  files,
  loading,
  searchQuery,
  onSearchChange,
  selectedFiles,
  onToggleFile,
  onImportSelected,
  onDisconnect,
  connectedEmail,
}: Props) {
  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-sky-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10.923 4.993A6.257 6.257 0 0116.4 2a6.25 6.25 0 015.93 4.247A4.503 4.503 0 0124 10.5a4.5 4.5 0 01-4.5 4.5H5.25A4.75 4.75 0 01.5 10.25a4.75 4.75 0 014.548-4.747 6.253 6.253 0 015.875-.51z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Import from OneDrive
                </h2>
                <p className="text-sm text-slate-600">{connectedEmail}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search your OneDrive files..."
              className="pl-10 bg-white"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Found {filtered.length} PDF file(s) in your OneDrive
          </p>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-slate-600 font-medium">
                Loading your OneDrive files...
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative bg-white border-2 rounded-xl p-5 transition-all cursor-pointer ${
                    selectedFiles.has(file.id)
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 hover:border-sky-400 hover:bg-sky-50/30"
                  }`}
                  onClick={() => onToggleFile(file.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedFiles.has(file.id)
                          ? "bg-sky-600 border-sky-600"
                          : "border-slate-300 group-hover:border-sky-400"
                      }`}
                    >
                      {selectedFiles.has(file.id) && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0 shadow-md">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate mb-1">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {file.size && (
                          <span>{formatFileSize(parseInt(file.size))}</span>
                        )}
                        {file.modifiedTime && (
                          <>
                            <span>•</span>
                            <span>
                              Modified {formatTimeAgo(file.modifiedTime)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchQuery ? "No files found" : "No PDF files in OneDrive"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Upload PDFs to your OneDrive to import them here"}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>
              {selectedFiles.size > 0
                ? `${selectedFiles.size} file${selectedFiles.size > 1 ? "s" : ""} selected`
                : `${files.length} file(s) available — click to select`}
            </span>
            <button
              onClick={onDisconnect}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect OneDrive
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {selectedFiles.size > 0 && (
              <Button
                onClick={onImportSelected}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Import {selectedFiles.size} File
                {selectedFiles.size > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  )
}