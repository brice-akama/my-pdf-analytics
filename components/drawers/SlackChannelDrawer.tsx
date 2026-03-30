"use client"

import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { Loader2, CheckCircle2, X } from "lucide-react"

type SlackChannel = {
  id: string
  name: string
  isPrivate?: boolean
  isMember?: boolean
}

type SlackStatus = {
  connected: boolean
  teamName?: string
  channelName?: string
  channelId?: string
}

type Props = {
  open: boolean
  onClose: () => void
  channels: SlackChannel[]
  loading: boolean
  slackStatus: SlackStatus
  onSelectChannel: (channelId: string, channelName: string) => void
}

export default function SlackChannelDrawer({
  open,
  onClose,
  channels,
  loading,
  slackStatus,
  onSelectChannel,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Select Slack Channel
                </h2>
                <p className="text-sm text-slate-600">{slackStatus.teamName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
              <p className="text-sm text-slate-600 font-medium">
                Loading channels...
              </p>
            </div>
          ) : channels.length > 0 ? (
            <div className="space-y-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onSelectChannel(channel.id, channel.name)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:border-purple-400 hover:bg-purple-50 ${
                    slackStatus.channelId === channel.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {channel.isPrivate ? "🔒" : "#"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">
                        {channel.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {channel.isPrivate
                          ? "Private channel"
                          : "Public channel"}
                        {!channel.isMember && " • Not a member"}
                      </div>
                    </div>
                    {slackStatus.channelId === channel.id && (
                      <CheckCircle2 className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-600">No channels found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </Drawer>
  )
}