// app/templates/group/[templateId]/share/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Share2,
  Users,
  Check,
  X,
  Loader2,
  Eye,
  Edit,
  UserPlus,
  Trash2,
} from "lucide-react"
import { motion } from "framer-motion"

type TeamMember = {
  id: string
  email: string
  name: string
  hasAccess: boolean
}

type SharedUser = {
  userId: string
  permissions: {
    canView: boolean
    canUse: boolean
    canEdit: boolean
    canShare: boolean
  }
  sharedAt: string
  sharedBy: string
}

export default function ShareTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params?.templateId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [sharedWith, setSharedWith] = useState<SharedUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isOwnedByUser, setIsOwnedByUser] = useState(false)

  useEffect(() => {
    if (templateId) {
      fetchSharingSettings()
    }
  }, [templateId])

  const fetchSharingSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/templates/group/${templateId}/share`, {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setTeamMembers(data.teamMembers || [])
          setSharedWith(data.sharedWith || [])
          setIsOwnedByUser(data.isOwnedByUser)
          
          // Pre-select users who already have access
          const alreadyShared = new Set(
            data.teamMembers
              .filter((m: TeamMember) => m.hasAccess)
              .map((m: TeamMember) => m.id)
          ) as Set<string>
          setSelectedUsers(alreadyShared)
        }
      }
    } catch (error) {
      console.error("Failed to fetch sharing settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleShareTemplate = async () => {
    if (selectedUsers.size === 0) {
      alert("Please select at least one team member")
      return
    }

    try {
      setSaving(true)
      
      const res = await fetch(`/api/templates/group/${templateId}/share`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          permissions: {
            canView: true,
            canUse: true,
            canEdit: false,
            canShare: false
          }
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(`✅ ${data.message}`)
        router.push(`/templates/group/${templateId}/preview`)
      } else {
        alert(`❌ Failed to share: ${data.error}`)
      }
    } catch (error) {
      console.error("Share error:", error)
      alert("❌ Failed to share template")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAccess = async (userId: string, userName: string) => {
    if (!confirm(`Remove access for ${userName}?`)) return

    try {
      const res = await fetch(`/api/templates/group/${templateId}/share`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      })

      if (res.ok) {
        alert("✅ Access removed successfully")
        fetchSharingSettings()
      } else {
        alert("❌ Failed to remove access")
      }
    } catch (error) {
      console.error("Remove access error:", error)
      alert("❌ Failed to remove access")
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading sharing settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">
              Share Template
            </h1>
            <p className="text-sm text-slate-600">
              Manage team access to this template
            </p>
          </div>

          <Button
            onClick={handleShareTemplate}
            disabled={saving || selectedUsers.size === 0 || !isOwnedByUser}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Permissions Notice */}
          {!isOwnedByUser && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                ⚠️ You don't own this template. Only the owner can manage sharing settings.
              </p>
            </div>
          )}

          {/* Team Members Not Available */}
          {teamMembers.length === 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No Team Members
              </h3>
              <p className="text-slate-600 mb-6">
                This template is in your personal workspace. Invite team members to your organization to share templates.
              </p>
            </div>
          )}

          {/* Team Members List */}
          {teamMembers.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Team Members
                    </h2>
                    <p className="text-sm text-slate-600">
                      {selectedUsers.size} of {teamMembers.length} selected
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y">
                {teamMembers.map((member) => {
                  const isSelected = selectedUsers.has(member.id)
                  
                  return (
                    <motion.div
                      key={member.id}
                      className={`p-4 transition-colors ${
                        isSelected ? 'bg-purple-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleUserSelection(member.id)}
                          disabled={!isOwnedByUser}
                          className="h-5 w-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed"
                        />

                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-600">{member.email}</p>
                        </div>

                        {/* Status Badge */}
                        {isSelected ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Has Access
                            </span>
                            
                            {isOwnedByUser && member.hasAccess && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAccess(member.id, member.name)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            No Access
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Permissions Info */}
          {teamMembers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                What can shared users do?
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  View template details and preview documents
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Use template to send signature requests
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cannot edit or delete the template
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cannot share template with others
                </li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}