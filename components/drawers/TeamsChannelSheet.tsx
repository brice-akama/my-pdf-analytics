"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CheckCircle, Loader2, X } from "lucide-react"

type TeamsChannel = {
  channelId: string
  channelName: string
}

type TeamsTeam = {
  teamId: string
  teamName: string
  channels: TeamsChannel[]
}

type Props = {
  open: boolean
  onClose: () => void
  teams: TeamsTeam[]
  loading: boolean
  saving: boolean
  selectedTeamId: string
  selectedChannelId: string
  selectedTeamName: string
  selectedChannelName: string
  onSelectChannel: (
    teamId: string,
    channelId: string,
    teamName: string,
    channelName: string
  ) => void
  onSave: () => void
  onRetry: () => void
}

export default function TeamsChannelSheet({
  open,
  onClose,
  teams,
  loading,
  saving,
  selectedTeamId,
  selectedChannelId,
  selectedTeamName,
  selectedChannelName,
  onSelectChannel,
  onSave,
  onRetry,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="right"
        className="w-[520px] sm:w-[580px] p-0 flex flex-col bg-white"
      >
        {/* Hidden title for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Pick a Teams Channel</SheetTitle>
        </SheetHeader>

        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                <svg
                  className="h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.625 7.5h-8.25A1.125 1.125 0 0011.25 8.625v7.5c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125v-7.5A1.125 1.125 0 0020.625 7.5zM14.25 6a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm-9 1.5a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75zm0 1.5C3.004 9 1.5 10.343 1.5 12v3.75c0 .414.336.75.75.75H6v-4.125C6 11.009 7.009 10 8.25 10H9V9.75A2.25 2.25 0 005.25 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pick a Teams Channel
                </h2>
                <p className="text-sm text-slate-500">
                  Choose where to receive document notifications
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600 mb-4" />
              <p className="text-slate-600 font-medium">
                Loading your teams...
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Fetching channels from Microsoft Teams
              </p>
            </div>
          ) : teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg
                  className="h-10 w-10 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.625 7.5h-8.25A1.125 1.125 0 0011.25 8.625v7.5c0 .621.504 1.125 1.125 1.125h8.25c.621 0 1.125-.504 1.125-1.125v-7.5A1.125 1.125 0 0020.625 7.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                No teams found
              </h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Make sure you are a member of at least one Microsoft Team and
                try reconnecting.
              </p>
              <Button variant="outline" className="mt-4" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
                <p className="text-sm text-purple-700">
                  Select a channel below. All document notifications — views,
                  downloads, signatures — will be posted there.
                </p>
              </div>

              {/* Teams + Channels */}
              {teams.map((team) => (
                <div key={team.teamId}>
                  {/* Team header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {team.teamName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {team.teamName}
                    </p>
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400">
                      {team.channels.length} channel
                      {team.channels.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Channels */}
                  <div className="space-y-1 ml-2">
                    {team.channels.map((channel) => (
                      <button
                        key={channel.channelId}
                        onClick={() =>
                          onSelectChannel(
                            team.teamId,
                            channel.channelId,
                            team.teamName,
                            channel.channelName
                          )
                        }
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group ${
                          selectedChannelId === channel.channelId
                            ? "bg-purple-100 text-purple-800 border-2 border-purple-400 shadow-sm"
                            : "hover:bg-slate-50 text-slate-700 border-2 border-transparent hover:border-slate-200"
                        }`}
                      >
                        <span
                          className={`text-base font-medium ${
                            selectedChannelId === channel.channelId
                              ? "text-purple-500"
                              : "text-slate-400 group-hover:text-slate-500"
                          }`}
                        >
                          #
                        </span>
                        <span className="flex-1 font-medium">
                          {channel.channelName}
                        </span>
                        {selectedChannelId === channel.channelId ? (
                          <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-purple-400 transition-colors flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50">
          {selectedChannelId && (
            <div className="bg-white border border-purple-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Selected channel</p>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedTeamName} → #{selectedChannelName}
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={!selectedChannelId || saving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Channel
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}