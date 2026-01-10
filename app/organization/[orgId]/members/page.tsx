// app/organization/[orgId]/members/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Search,
  UserPlus,
  MoreVertical,
  Mail,
  Shield,
  Eye,
  Clock,
  Trash2,
  Crown,
  CheckCircle2,
  Users,
  Building2,
  Activity,
  Download
} from 'lucide-react'

type OrgMember = {
  id: string
  userId: string | null
  email: string
  name: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  status: 'active' | 'invited' | 'suspended'
  permissions: {
    canCreateSpaces: boolean
    canInviteMembers: boolean
    canViewAllSpaces: boolean
    canManageBilling: boolean
    canManageSettings: boolean
  }
  joinedAt: Date | null
  invitedAt: Date | null
  lastActiveAt: Date | null
}

// Role Badge Component
const RoleBadge = ({ role }: { role: string }) => {
  const roleConfig = {
    owner: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Crown, label: 'Owner' },
    admin: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Shield, label: 'Admin' },
    member: { bg: 'bg-green-100', text: 'text-green-700', icon: Users, label: 'Member' },
    viewer: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Eye, label: 'Viewer' }
  }

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg} ${config.text} text-xs font-semibold`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  )
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    invited: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Invited' },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.invited

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${config.bg} ${config.text} text-xs font-medium`}>
      {config.label}
    </span>
  )
}

export default function OrganizationMembersPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<OrgMember[]>([])
  const [org, setOrg] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'admin' | 'viewer'>('member')
  const [inviting, setInviting] = useState(false)
  const [invitationLink, setInvitationLink] = useState('')
const [showLinkDialog, setShowLinkDialog] = useState(false)

  useEffect(() => {
    fetchOrganization()
    fetchMembers()
  }, [params.orgId])

  const fetchOrganization = async () => {
    try {
      const res = await fetch(`/api/organizations/${params.orgId}/settings`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setOrg(data.organization)
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/organizations/${params.orgId}/members`, {
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
  if (!inviteEmail.trim()) return

  setInviting(true)

  try {
    const res = await fetch(`/api/organizations/${params.orgId}/members`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail.trim(),
        role: inviteRole
      })
    })

    const data = await res.json()

    if (res.ok && data.success) {
      // ✅ NEW: Store invitation link and show dialog
      setInvitationLink(data.invitationLink || `${window.location.origin}/accept-invitation?orgId=${params.orgId}&email=${inviteEmail}`)
      setShowLinkDialog(true)
      
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteDialog(false)
      fetchMembers()
    } else {
      alert(data.error || 'Failed to invite member')
    }
  } catch (error) {
    console.error('Invite error:', error)
    alert('Failed to invite member')
  } finally {
    setInviting(false)
  }
}

const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(invitationLink)
    alert('✅ Invitation link copied to clipboard!')
  } catch (error) {
    console.error('Copy error:', error)
    alert('Failed to copy. Please copy manually.')
  }
}

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`Remove ${email} from this organization?`)) return

    try {
      const res = await fetch(`/api/organizations/${params.orgId}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('✅ Member removed successfully!')
        fetchMembers()
      } else {
        alert(data.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Remove error:', error)
      alert('Failed to remove member')
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/organization/${params.orgId}/dashboard`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Team Members</h1>
              <p className="text-sm text-slate-600">{org?.name}</p>
            </div>
          </div>

          <Button
            onClick={() => setShowInviteDialog(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{members.length}</p>
            </div>
            <p className="text-sm text-slate-600">Total Members</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {members.filter(m => m.status === 'active').length}
              </p>
            </div>
            <p className="text-sm text-slate-600">Active</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {members.filter(m => m.status === 'invited').length}
              </p>
            </div>
            <p className="text-sm text-slate-600">Pending</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {members.filter(m => m.role === 'admin').length}
              </p>
            </div>
            <p className="text-sm text-slate-600">Admins</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Joined</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Permissions</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={member.status} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString()
                        : member.invitedAt
                        ? `Invited ${new Date(member.invitedAt).toLocaleDateString()}`
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.canCreateSpaces && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Create Spaces</span>
                      )}
                      {member.permissions.canInviteMembers && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">Invite</span>
                      )}
                      {member.permissions.canManageSettings && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">Settings</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.role === 'owner' ? (
                      <span className="text-xs text-slate-500">Owner</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemoveMember(member.id, member.email)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to {org?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email Address</label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin' | 'viewer')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="member">Member - Create and manage spaces</option>
                <option value="admin">Admin - Full organization access</option>
                <option value="viewer">Viewer - Read-only access</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {inviting ? 'Inviting...' : 'Send Invitation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ NEW: Invitation Link Dialog */}
<Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
  <DialogContent className="max-w-2xl bg-white h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        Member Invited Successfully!
      </DialogTitle>
      <DialogDescription>
        Share this link with the new member
      </DialogDescription>
    </DialogHeader>

    <div className="space-y-4 py-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900 mb-2">
          <strong>✅ Invitation sent!</strong>
        </p>
        <p className="text-sm text-green-800">
          The member will receive an email with instructions. You can also manually share the link below.
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          Invitation Link
        </label>
        <div className="flex gap-2">
          <Input
            value={invitationLink}
            readOnly
            className="flex-1 font-mono text-sm bg-slate-50"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button 
            onClick={handleCopyLink}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Copy
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          💡 This link will allow the member to accept the invitation and join your organization
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 font-semibold mb-2">Next Steps:</p>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Copy the invitation link above</li>
          <li>Send it to the new member via your preferred method</li>
          <li>The member clicks the link and accepts the invitation</li>
          <li>They'll be added to your organization automatically</li>
        </ol>
      </div>
    </div>

    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        onClick={() => setShowLinkDialog(false)}
      >
        Done
      </Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}