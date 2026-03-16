// app/documents-page/components/ExportDrawerContent.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

type Props = {
  documentId: string | null
  onClose: () => void
}

const PROVIDERS = [
  {
    id:          "google-drive",
    name:        "Google Drive",
    description: "Store in your Google Drive account",
    gradient:    "from-blue-500 to-green-500",
    statusKey:   "google_drive",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z" fill="#4285F4"/>
        <path d="M9.982 17l-4.018 6.515h8.071L18.053 17H9.982z" fill="#34A853"/>
        <path d="M18.053 17l4.018-6.77-4.018-6.745L14.035 10l4.018 7z" fill="#FBBC04"/>
        <path d="M3.982 15L7.964 8.23 3.946 1.485 0 8.23 3.982 15z" fill="#EA4335"/>
      </svg>
    ),
    apiPath:     "/api/integrations/google-drive/export",
    connectPath: "/api/integrations/google-drive/connect",
  },
  {
    id:          "onedrive",
    name:        "OneDrive",
    description: "Save to your Microsoft OneDrive",
    gradient:    "from-blue-500 to-blue-600",
    statusKey:   "onedrive",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.82 6.12a6.62 6.62 0 016.6 6.57c0 .11 0 .22-.01.33a4.42 4.42 0 012.4 3.9c0 2.44-1.98 4.42-4.42 4.42H7.42A4.42 4.42 0 013 16.92c0-2.01 1.34-3.7 3.18-4.25a6.62 6.62 0 016.64-6.55z" fill="#0078D4"/>
      </svg>
    ),
    apiPath:     "/api/integrations/onedrive/export",
    connectPath: "/api/integrations/onedrive/connect",
  },
  {
    id:          "dropbox",
    name:        "Dropbox",
    description: "Export to your Dropbox folder",
    gradient:    "from-blue-600 to-blue-700",
    statusKey:   null,
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6.001-3.822L6 18.371z" fill="#0061FF"/>
      </svg>
    ),
    apiPath:     null,
    connectPath: null,
  },
]

export default function ExportDrawerContent({ documentId, onClose }: Props) {
  const [selected,          setSelected]          = useState<string | null>(null)
  const [exporting,         setExporting]         = useState(false)
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, any>>({})
  const [loadingStatus,     setLoadingStatus]     = useState(true)

  // Fetch integration statuses on mount
  useEffect(() => {
    fetch('/api/integrations/status', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setIntegrationStatus(data) })
      .catch(() => {})
      .finally(() => setLoadingStatus(false))
  }, [])

  const handleExport = async () => {
    if (!selected || !documentId) return

    const provider = PROVIDERS.find(p => p.id === selected)
    if (!provider) return

    // Not yet built
    if (!provider.apiPath) {
      toast.info(`${provider.name} export coming soon!`)
      return
    }

    // Not connected — redirect to connect
    const isConnected = provider.statusKey
      ? integrationStatus[provider.statusKey]?.connected
      : false

    if (!isConnected) {
      toast.error(`${provider.name} not connected`, {
        description: 'You will be redirected to connect it.',
        action: {
          label: 'Connect',
          onClick: () => {
            if (provider.connectPath) window.location.href = provider.connectPath
          },
        },
      })
      return
    }

    setExporting(true)
    try {
      const res  = await fetch(provider.apiPath, {
        method:      'POST',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ documentId }),
      })
      const data = await res.json()

      if (res.ok) {
        const fileName = data.driveFileName || data.oneDriveFileName
        toast.success(`Exported to ${provider.name}!`, {
          description: fileName,
          action: data.webUrl
            ? { label: 'Open', onClick: () => window.open(data.webUrl, '_blank') }
            : undefined,
        })
        onClose()
      } else {
        // Handle not-connected error from route itself
        if (res.status === 404 && data.error?.includes('not connected')) {
          toast.error(`${provider.name} not connected`, {
            description: 'Connect it from Settings → Integrations.',
            action: provider.connectPath
              ? { label: 'Connect', onClick: () => { window.location.href = provider.connectPath! } }
              : undefined,
          })
        } else {
          toast.error(data.error || 'Export failed')
        }
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">

      {/* Header */}
      <div className="p-6 border-b bg-white/80 backdrop-blur flex-shrink-0">
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
        <p className="text-sm text-slate-500">
          Export your signed document to cloud storage
        </p>
      </div>

      {/* Providers */}
      <div className="flex-1 overflow-y-auto p-6">
        {loadingStatus ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {PROVIDERS.map((p) => {
              const isConnected = p.statusKey
                ? !!integrationStatus[p.statusKey]?.connected
                : false
              const isComingSoon = !p.apiPath

              return (
                <motion.button
                  key={p.id}
                  onClick={() => !isComingSoon && setSelected(p.id)}
                  whileHover={!isComingSoon ? { scale: 1.02 } : {}}
                  whileTap={!isComingSoon ? { scale: 0.98 } : {}}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    isComingSoon
                      ? 'border-slate-100 bg-white/60 opacity-60 cursor-not-allowed'
                      : selected === p.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white shadow flex-shrink-0`}>
                      {p.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{p.name}</h3>
                        {/* Connection badge */}
                        {!isComingSoon && (
                          isConnected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3" />Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                              <AlertCircle className="h-3 w-3" />Not connected
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{p.description}</p>
                      {isComingSoon && (
                        <p className="text-xs text-orange-600 mt-0.5 font-medium">Coming soon</p>
                      )}
                      {!isComingSoon && !isConnected && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          Select to connect and export
                        </p>
                      )}
                    </div>

                    {/* Selected check */}
                    {selected === p.id && (
                      <CheckCircle2 className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t bg-white/80 backdrop-blur flex-shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selected || exporting || loadingStatus}
            className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {exporting
              ? <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</>
              : <><Upload className="h-4 w-4" />Export</>
            }
          </Button>
        </div>
      </div>

    </div>
  )
}