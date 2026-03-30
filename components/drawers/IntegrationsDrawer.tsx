"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckCircle,
  FolderOpen,
  Sparkles,
  X,
  Download,
  Users,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  onClose: () => void

  // Statuses
  integrationStatus: Record<string, any>
  slackStatus: { connected: boolean; teamName?: string; channelName?: string; channelId?: string }
  gmailStatus: { connected: boolean; email?: string }
  outlookStatus: { connected: boolean; email?: string }
  oneDriveStatus: { connected: boolean; email?: string }
  hubspotStatus: { connected: boolean; portalId?: string; accountType?: string }
  teamsStatus: { connected: boolean; email?: string; channelName?: string; channelPicked?: boolean }

  // Google Drive
  onConnectGoogleDrive: () => void
  onDisconnectGoogleDrive: () => void
  onBrowseDriveFiles: () => void

  // OneDrive
  onConnectOneDrive: () => void
  onDisconnectOneDrive: () => void
  onBrowseOneDriveFiles: () => void

  // Slack
  onConnectSlack: () => void
  onDisconnectSlack: () => void
  onBrowseSlackChannels: () => void

  // Gmail
  onConnectGmail: () => void
  onDisconnectGmail: () => void

  // Outlook
  onConnectOutlook: () => void
  onDisconnectOutlook: () => void

  // HubSpot
  onConnectHubSpot: () => void
  onDisconnectHubSpot: () => void
  onBrowseHubSpotContacts: () => void
  onSyncHubSpotContacts: () => void

  // Teams
  onConnectTeams: () => void
  onDisconnectTeams: () => void
  onOpenTeamsChannelPicker: () => void
  fetchTeamsChannels: () => void

  // Zapier
  onOpenZapierSetup: () => void

  // Integration request
  onOpenIntegrationRequest: () => void
}

export default function IntegrationsDrawer({
  open,
  onClose,
  integrationStatus,
  slackStatus,
  gmailStatus,
  outlookStatus,
  oneDriveStatus,
  hubspotStatus,
  teamsStatus,
  onConnectGoogleDrive,
  onDisconnectGoogleDrive,
  onBrowseDriveFiles,
  onConnectOneDrive,
  onDisconnectOneDrive,
  onBrowseOneDriveFiles,
  onConnectSlack,
  onDisconnectSlack,
  onBrowseSlackChannels,
  onConnectGmail,
  onDisconnectGmail,
  onConnectOutlook,
  onDisconnectOutlook,
  onConnectHubSpot,
  onDisconnectHubSpot,
  onBrowseHubSpotContacts,
  onSyncHubSpotContacts,
  onConnectTeams,
  onDisconnectTeams,
  onOpenTeamsChannelPicker,
  fetchTeamsChannels,
  onOpenZapierSetup,
  onOpenIntegrationRequest,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[700px] lg:w-[900px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Integrations
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Connect DocMetrics with your favorite tools
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-5xl">
                <div className="mb-8">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

                    {/* ── Slack ────────────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                          </svg>
                        </div>
                        {slackStatus.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Connected
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onBrowseSlackChannels}>
                                {slackStatus.channelName ? "Change Channel" : "Select Channel"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={onDisconnectSlack} className="text-red-600">
                                <X className="h-4 w-4 mr-2" /> Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="outline" onClick={onConnectSlack}>Connect</Button>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Slack</h4>
                      <p className="text-sm text-slate-600">Get real-time notifications in Slack</p>
                      {slackStatus.connected && slackStatus.channelName && (
                        <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs text-purple-900">✓ Posting to <span className="font-semibold">#{slackStatus.channelName}</span></p>
                        </div>
                      )}
                      {slackStatus.connected && !slackStatus.channelName && (
                        <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-xs text-orange-900">⚠️ No channel selected yet</p>
                        </div>
                      )}
                    </div>

                    {/* ── Microsoft Teams ──────────────────────────────────── */}
                    <div className="border-2 border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M20.625 7.5h-8.25A1.125 1.125 0 0011.25 8.625v7.5c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125v-7.5A1.125 1.125 0 0020.625 7.5zM14.25 6a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm-9 1.5a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75zm0 1.5C3.004 9 1.5 10.343 1.5 12v3.75c0 .414.336.75.75.75H6v-4.125C6 11.009 7.009 10 8.25 10H9V9.75A2.25 2.25 0 005.25 9z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">Microsoft Teams</h3>
                            <p className="text-xs text-slate-500">
                              {teamsStatus.connected && teamsStatus.channelPicked
                                ? `📢 ${teamsStatus.channelName}`
                                : teamsStatus.connected
                                ? "⚠️ No channel selected yet"
                                : "Get notified in Teams"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">
                        Get real-time notifications in your Teams channel when documents are viewed, downloaded, or signed.
                      </p>
                      {teamsStatus.connected ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" className="w-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {teamsStatus.channelPicked ? "Connected" : "Pick a Channel"}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => { fetchTeamsChannels(); onOpenTeamsChannelPicker() }}>
                              Change Channel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDisconnectTeams} className="text-red-600">
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white" onClick={onConnectTeams}>
                          Connect Teams
                        </Button>
                      )}
                    </div>

                    {/* ── Zapier ───────────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:bg-orange-50/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-1.768 5.44a.75.75 0 01-.712.513H8.918a.75.75 0 01-.712-.513L6.438 8.247A.75.75 0 017.15 7.2h9.7a.75.75 0 01.712 1.047z" />
                          </svg>
                        </div>
                        <Button size="sm" variant="outline" onClick={onOpenZapierSetup}>Setup</Button>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Zapier</h4>
                      <p className="text-sm text-slate-600">Connect to 5,000+ apps via Zapier</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {["View", "Download", "Signature", "File Request"].map((trigger) => (
                          <span key={trigger} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* ── Google Drive ─────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                          📁
                        </div>
                        {integrationStatus.google_drive?.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Connected
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onBrowseDriveFiles}>
                                <FolderOpen className="h-4 w-4 mr-2" /> Browse Files
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={onDisconnectGoogleDrive} className="text-red-600">
                                <X className="h-4 w-4 mr-2" /> Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="outline" onClick={onConnectGoogleDrive}>Connect</Button>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Google Drive</h4>
                      <p className="text-sm text-slate-600">Import documents from Drive</p>
                      {integrationStatus.google_drive?.connected && (
                        <p className="text-xs text-green-600 mt-2">✓ {integrationStatus.google_drive.email}</p>
                      )}
                    </div>

                    {/* ── OneDrive ─────────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10.923 4.993A6.257 6.257 0 0116.4 2a6.25 6.25 0 015.93 4.247A4.503 4.503 0 0124 10.5a4.5 4.5 0 01-4.5 4.5H5.25A4.75 4.75 0 01.5 10.25a4.75 4.75 0 014.548-4.747 6.253 6.253 0 015.875-.51z" />
                          </svg>
                        </div>
                        {oneDriveStatus.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Connected
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onBrowseOneDriveFiles}>
                                <FolderOpen className="h-4 w-4 mr-2" /> Browse Files
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={onDisconnectOneDrive} className="text-red-600">
                                <X className="h-4 w-4 mr-2" /> Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="outline" onClick={onConnectOneDrive}>Connect</Button>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">OneDrive</h4>
                      <p className="text-sm text-slate-600">Import documents from OneDrive</p>
                      {oneDriveStatus.connected && oneDriveStatus.email && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-900">✓ <span className="font-semibold">{oneDriveStatus.email}</span></p>
                        </div>
                      )}
                    </div>

                    {/* ── Outlook ──────────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.36-.19-.59-.52-.22-.33-.33-.74-.11-.42-.11-.87t.11-.87q.11-.41.33-.74.23-.33.59-.52.36-.2.85-.2t.87.2q.36.19.58.52.23.33.33.74.11.42.11.87zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.32-.32-.34-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.31.3.75V10.85l1.24.72h.01q.06.04.12.09l-.01-.01q.4.26.4.72zm-7.85-3.06l-2.35 4.56-2.56-4.56H9.3l3.57 6.17-3.57 6.17h1.97l2.56-4.57 2.35 4.57h2.09l-3.6-6.17 3.6-6.17h-2.12z" />
                          </svg>
                        </div>
                        {outlookStatus.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Connected
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onDisconnectOutlook} className="text-red-600">
                                <X className="h-4 w-4 mr-2" /> Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="outline" onClick={onConnectOutlook}>Connect</Button>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Outlook</h4>
                      <p className="text-sm text-slate-600">Send tracked emails via Outlook</p>
                      {outlookStatus.connected && outlookStatus.email && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-900">✓ Sending as <span className="font-semibold">{outlookStatus.email}</span></p>
                        </div>
                      )}
                    </div>

                    {/* ── HubSpot ──────────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.873h-.067a2.199 2.199 0 00-1.978 1.267 2.198 2.198 0 00.07 1.8l-3.47 3.47a4.238 4.238 0 00-1.344-.246 4.33 4.33 0 00-3.751 2.184L3.072 6.694a2.192 2.192 0 10-.795.796l3.646 3.626a4.284 4.284 0 002.023 6.763 4.314 4.314 0 003.515-.81l3.466 3.466a2.198 2.198 0 101.566-.618l-3.467-3.467a4.314 4.314 0 00.81-3.515 4.285 4.285 0 00-2.128-3.065 2.198 2.198 0 012.129-3.82l.039.04 3.435-3.435A2.199 2.199 0 0018.164 7.93z" />
                          </svg>
                        </div>
                        {hubspotStatus.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Connected
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onBrowseHubSpotContacts}>
                                <Users className="h-4 w-4 mr-2" /> View Contacts
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={onSyncHubSpotContacts}>
                                <Download className="h-4 w-4 mr-2" /> Sync Contacts
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={onDisconnectHubSpot} className="text-red-600">
                                <X className="h-4 w-4 mr-2" /> Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="outline" onClick={onConnectHubSpot}>Connect</Button>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">HubSpot</h4>
                      <p className="text-sm text-slate-600">Sync contacts and track deals</p>
                      {hubspotStatus.connected && hubspotStatus.portalId && (
                        <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-xs text-orange-900">✓ Portal ID: <span className="font-semibold">{hubspotStatus.portalId}</span></p>
                        </div>
                      )}
                    </div>

                    {/* ── Gmail ────────────────────────────────────────────── */}
                    <div className="group bg-white border-2 border-slate-200 rounded-xl p-5 hover:border-red-400 hover:bg-red-50/30 transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                          </svg>
                        </div>
                        {gmailStatus.connected ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Connected
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={onDisconnectGmail} className="text-red-600">
                                <X className="h-4 w-4 mr-2" /> Disconnect
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="outline" onClick={onConnectGmail}>Connect</Button>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">Gmail</h4>
                      <p className="text-sm text-slate-600">Send tracked emails directly</p>
                      {gmailStatus.connected && gmailStatus.email && (
                        <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs text-red-900">✓ Sending as <span className="font-semibold">{gmailStatus.email}</span></p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Coming Soon */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">More Integrations</h3>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
                      <Sparkles className="h-8 w-8 text-slate-500" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">More Integrations Coming Soon</h4>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      We're working on integrations with Salesforce, Notion, Airtable, Zoom, and more!
                    </p>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-6 max-w-2xl mx-auto">
                      {[
                        { name: "Salesforce", icon: "☁️" },
                        { name: "Notion", icon: "📝" },
                        { name: "Airtable", icon: "🗂️" },
                        { name: "Zoom", icon: "🎥" },
                        { name: "Monday", icon: "📋" },
                        { name: "Asana", icon: "✅" },
                        { name: "Jira", icon: "🔵" },
                        { name: "Trello", icon: "🟦" },
                      ].map((item) => (
                        <div key={item.name} className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 opacity-60">
                          <div className="text-3xl">{item.icon}</div>
                          <p className="text-xs text-slate-600 font-medium">{item.name}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { onClose(); onOpenIntegrationRequest() }}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Request an Integration
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t bg-white sticky bottom-0 shadow-lg">
              <Button variant="outline" onClick={onClose} className="h-12 px-6 float-right">
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}