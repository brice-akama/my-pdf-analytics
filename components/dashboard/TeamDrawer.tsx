"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Mail,
  Trash2,
  Clock,
  Loader2,
  Sparkles,
  CheckCircle,
  Send,
  Eye,
  Users as UsersIcon,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  status: string
  avatarUrl?: string
  invitedAt?: string
  lastActiveAt?: string
}

interface TeamDrawerProps {
  open: boolean
  onClose: () => void
  user: UserType | null
  teamMembers: TeamMember[]
  loadingTeam: boolean
  inviteEmail: string
  inviteRole: string
  generatedInviteLink: string
  showInviteLinkDialog: boolean
  showDeleteMemberDialog: boolean
  memberToDelete: { id: string; name: string } | null
  onSetInviteEmail: (v: string) => void
  onSetInviteRole: (v: string) => void
  onInviteMember: () => void
  onRemoveMember: (id: string, name: string) => void
  onConfirmRemoveMember: () => void
  onUpdateRole: (id: string, role: string) => void
  onSetShowInviteLinkDialog: (v: boolean) => void
  onSetShowDeleteMemberDialog: (v: boolean) => void
  onSetMemberToDelete: (v: { id: string; name: string } | null) => void
  onSetGeneratedInviteLink: (v: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const getAvatarColor = (email: string) => {
  const colors = [
    "from-purple-500 to-purple-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
  ]
  return colors[email.charCodeAt(0) % colors.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamDrawer({
  open,
  onClose,
  user,
  teamMembers,
  loadingTeam,
  inviteEmail,
  inviteRole,
  generatedInviteLink,
  showInviteLinkDialog,
  showDeleteMemberDialog,
  memberToDelete,
  onSetInviteEmail,
  onSetInviteRole,
  onInviteMember,
  onRemoveMember,
  onConfirmRemoveMember,
  onUpdateRole,
  onSetShowInviteLinkDialog,
  onSetShowDeleteMemberDialog,
  onSetMemberToDelete,
  onSetGeneratedInviteLink,
}: TeamDrawerProps) {
  const router = useRouter()

  return (
    <>
      {/* ── Main drawer ── */}
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-4xl p-0 flex flex-col bg-white overflow-hidden"
        >
          {/* Header */}
          <SheetHeader className="px-8 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
            <SheetTitle className="text-2xl font-bold text-slate-900">Team Members</SheetTitle>
            <SheetDescription className="text-sm text-slate-600 mt-1">
              Invite colleagues and manage team permissions
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-8 py-6 space-y-6">

              {/* ── Invite section ── */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label className="text-lg font-bold text-slate-900 block mb-1">
                      Invite Team Member
                    </Label>
                    <p className="text-sm text-slate-600">
                      Enter their email address and select a role to send an invitation
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => onSetInviteEmail(e.target.value)}
                        className="h-12 text-base bg-white"
                      />
                    </div>
                    <div className="w-full sm:w-48 space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <select
                        value={inviteRole}
                        onChange={(e) => onSetInviteRole(e.target.value)}
                        className="w-full h-12 px-4 border border-slate-300 rounded-lg text-base bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={onInviteMember}
                    disabled={!inviteEmail.trim()}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Send Invitation
                  </Button>
                </div>

                {/* Role descriptions */}
                <div className="bg-white/80 border border-purple-200 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-900 mb-2">Role Permissions:</p>
                  <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-700">
                    {[
                      { label: "Admin",  desc: "Full access + team management",   icon: "✅" },
                      { label: "Member", desc: "Create, edit, share documents",   icon: "✅" },
                      { label: "Viewer", desc: "View documents only",             icon: "👁️" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-start gap-2">
                        <span>{r.icon}</span>
                        <div>
                          <p className="font-semibold">{r.label}</p>
                          <p className="text-slate-600">{r.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Member list ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold text-slate-900">
                    Team Members ({teamMembers.length})
                  </Label>
                  {teamMembers.some((m) => m.status === "invited") && (
                    <span className="text-xs text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded-full">
                      {teamMembers.filter((m) => m.status === "invited").length} pending
                    </span>
                  )}
                </div>

                {loadingTeam ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Loading team members...</p>
                  </div>
                ) : teamMembers.length > 0 ? (
                  <div className="border-2 border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                      >
                        {/* Avatar + info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div
                            className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAvatarColor(member.email)} flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md overflow-hidden`}
                          >
                            {member.avatarUrl ? (
                              <Image
                                src={member.avatarUrl}
                                alt={member.name}
                                width={48}
                                height={48}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              member.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{member.name}</p>
                            <p className="text-sm text-slate-500 truncate">{member.email}</p>
                            {member.status === "invited" && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-orange-500" />
                                <p className="text-xs text-orange-600 font-medium">
                                  Pending · Sent{" "}
                                  {member.invitedAt ? formatTimeAgo(member.invitedAt) : ""}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                          {member.role === "owner" ? (
                            <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md">
                              Owner
                            </span>
                          ) : (
                            <>
                              <select
                                value={member.role}
                                onChange={(e) => onUpdateRole(member.id, e.target.value)}
                                className="px-3 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium bg-white hover:border-purple-400 focus:border-purple-500 focus:outline-none transition-colors"
                                disabled={member.status === "invited"}
                              >
                                <option value="admin">Admin</option>
                                <option value="member">Member</option>
                                <option value="viewer">Viewer</option>
                              </select>

                              {member.status === "invited" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const loadingToast = toast.loading("Resending invitation...")
                                    const res = await fetch("/api/team/resend-invite", {
                                      method: "POST",
                                      credentials: "include",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ memberId: member.id }),
                                    })
                                    if (res.ok) {
                                      const data = await res.json()
                                      toast.success("Invitation resent!", { id: loadingToast })
                                      onSetGeneratedInviteLink(data.inviteLink)
                                      onSetShowInviteLinkDialog(true)
                                    } else {
                                      toast.error("Failed to resend", { id: loadingToast })
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  <Mail className="h-4 w-4" />
                                  Resend
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRemoveMember(member.id, member.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <UsersIcon className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-base font-medium text-slate-900 mb-1">No team members yet</p>
                    <p className="text-sm text-slate-500">Invite your first team member above</p>
                  </div>
                )}
              </div>

              {/* Upgrade prompt when on free plan */}
              {teamMembers.length >= 3 && user?.plan === "free" && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-yellow-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-yellow-900 mb-1">
                        🎯 Reached Free Plan Limit
                      </p>
                      <p className="text-sm text-yellow-800 mb-4">
                        Upgrade to Pro for unlimited team members, advanced analytics, and priority
                        support
                      </p>
                      <Button
                        size="lg"
                        onClick={() => { onClose(); router.push("/plan") }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold shadow-md"
                      >
                        ⚡ Upgrade Now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t bg-slate-50 sticky bottom-0 shadow-lg">
            <Button variant="outline" onClick={onClose} className="w-full h-12 text-base font-semibold">
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Invite link dialog ── */}
      <Dialog open={showInviteLinkDialog} onOpenChange={onSetShowInviteLinkDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Invitation Sent!</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  A link was emailed. Share it manually if needed.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-900">Invite email sent</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Backup Invite Link
              </p>
              <div className="flex gap-2">
                <Input
                  value={generatedInviteLink}
                  readOnly
                  className="flex-1 font-mono text-xs bg-slate-50"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink)
                    toast.success("Link copied to clipboard")
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Expires in 7 days · Use if the email doesn't arrive
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                onClick={() => onSetShowInviteLinkDialog(false)}
                className="h-10 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete member confirm dialog ── */}
      <Dialog open={showDeleteMemberDialog} onOpenChange={onSetShowDeleteMemberDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Remove Team Member
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600 pt-1">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-slate-900">{memberToDelete?.name}</span> from the
              team? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onSetShowDeleteMemberDialog(false)
                onSetMemberToDelete(null)
              }}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmRemoveMember}
              className="h-11 px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}