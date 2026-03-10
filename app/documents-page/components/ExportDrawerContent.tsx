// app/documents-page/components/ExportDrawerContent.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

type Props = {
  documentId: string | null
  onClose: () => void
}

const PROVIDERS = [
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Store in your Google Drive account",
    gradient: "from-blue-500 to-green-500",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z" fill="#4285F4"/>
        <path d="M9.982 17l-4.018 6.515h8.071L18.053 17H9.982z" fill="#34A853"/>
        <path d="M18.053 17l4.018-6.77-4.018-6.745L14.035 10l4.018 7z" fill="#FBBC04"/>
        <path d="M3.982 15L7.964 8.23 3.946 1.485 0 8.23 3.982 15z" fill="#EA4335"/>
      </svg>
    ),
    apiPath: "/api/integrations/google-drive/export",
  },
  {
    id: "onedrive",
    name: "OneDrive for Business",
    description: "Save to OneDrive Business",
    gradient: "from-blue-500 to-blue-600",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.82 6.12a6.62 6.62 0 016.6 6.57c0 .11 0 .22-.01.33a4.42 4.42 0 012.4 3.9c0 2.44-1.98 4.42-4.42 4.42H7.42A4.42 4.42 0 013 16.92c0-2.01 1.34-3.7 3.18-4.25a6.62 6.62 0 016.64-6.55z" fill="#0078D4"/>
      </svg>
    ),
    apiPath: "/api/integrations/onedrive/export",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Export to your Dropbox folder",
    gradient: "from-blue-600 to-blue-700",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6.001-3.822L6 18.371z" fill="#0061FF"/>
      </svg>
    ),
    apiPath: null, // coming soon
  },
  {
    id: "box",
    name: "Box",
    description: "Upload to Box cloud storage",
    gradient: "from-blue-600 to-indigo-600",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 5.91v12.1c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5.91c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2zm10 10.18l-4.5-2.9V8.73L12 11.63l4.5-2.9v4.46l-4.5 2.9z" fill="#0061D5"/>
      </svg>
    ),
    apiPath: null,
  },
]

export default function ExportDrawerContent({ documentId, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!selected || !documentId) return
    const provider = PROVIDERS.find(p => p.id === selected)
    if (!provider?.apiPath) {
      toast.info(`${provider?.name} export coming soon!`)
      return
    }

    setExporting(true)
    try {
      const res = await fetch(provider.apiPath, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Exported to ${provider.name}!`, {
          description: data.driveFileName || data.oneDriveFileName,
          action: data.webUrl ? { label: "Open", onClick: () => window.open(data.webUrl, "_blank") } : undefined,
        })
        onClose()
      } else {
        toast.error(data.error || "Export failed")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header */}
      <div className="p-6 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Export to Cloud
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <p className="text-sm text-slate-500">Export your fully signed document to cloud storage</p>
      </div>

      {/* Providers */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {PROVIDERS.map((p) => (
            <motion.button key={p.id} onClick={() => setSelected(p.id)}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                selected === p.id
                  ? "border-purple-500 bg-purple-50 shadow-lg"
                  : "border-slate-200 bg-white hover:border-purple-300 hover:shadow-md"
              }`}>
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white shadow`}>
                  {p.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-500">{p.description}</p>
                  {!p.apiPath && <p className="text-xs text-orange-600 mt-0.5">Coming soon</p>}
                </div>
                {selected === p.id && <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-white/80 backdrop-blur">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleExport}
            disabled={!selected || exporting}
            className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Upload className="h-4 w-4" />
            {exporting ? "Exporting..." : "Connect & Export"}
          </Button>
        </div>
      </div>
    </div>
  )
}