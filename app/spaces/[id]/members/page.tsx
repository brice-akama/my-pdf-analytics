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
  Edit,
  Clock,
  Download,
  Activity,
  Trash2,
  Crown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Users,
  TrendingUp
} from 'lucide-react'

type Member = {
  id: string
  email: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  addedAt: string
  lastAccessedAt: string | null
  viewsCount: number
  downloadsCount: number
  invitationStatus: 'accepted' | 'pending'
  isExternal?: boolean
  lastActivity?: string
  invitationsSent?: number
  permissions?: string[]
}

// Permission helper
const getPermissionsList = (role: string) => {
  const permissions = {
    owner: ['Full control', 'Delete space', 'Manage billing', 'All admin permissions'],
    admin: ['Manage members', 'Upload documents', 'Delete documents', 'View analytics'],
    editor: ['Upload documents', 'Edit documents', 'View documents', 'Comment'],
    viewer: ['View documents', 'Download documents', 'Comment']
  }
  return permissions[role as keyof typeof permissions] || []
}

// Role Badge Component
const RoleBadge = ({ role }: { role: string }) => {
  const roleConfig = {
    owner: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-300',
      icon: Crown,
      label: 'Owner'
    },
    admin: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-300',
      icon: Shield,
      label: 'Admin'
    },
    editor: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: Edit,
      label: 'Editor'
    },
    viewer: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: Eye,
      label: 'Viewer'
    }
  }

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.text} ${config.border} text-xs font-semibold`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  )
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    active: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
      icon: CheckCircle2,
      label: 'Active'
    },
    inactive: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: XCircle,
      label: 'Inactive'
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
      icon: Clock,
      label: 'Pending'
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border} text-xs font-medium`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  )
}

// External Badge Component
const ExternalBadge = () => (
  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 text-xs font-medium">
    <AlertCircle className="h-3 w-3" />
    <span>External</span>
  </div>
)

export default function MembersPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [space, setSpace] = useState<any>(null)
  const [spaceOwner, setSpaceOwner] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [newRole, setNewRole] = useState<string>('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [addingMember, setAddingMember] = useState(false)

  useEffect(() => {
    fetchSpace()
    fetchMembers()
  }, [params.id])

  useEffect(() => {
    filterMembers()
  }, [members, searchQuery, roleFilter, statusFilter])

  const fetchSpace = async () => {
    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setSpace(data.space)
      }
    } catch (error) {
      console.error('Failed to fetch space:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/spaces/${params.id}/members`, {
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        
        // Enhance members with additional data
        const enhancedMembers = data.members.map((m: Member) => {
          // Check if external (not same domain as space owner)
          const ownerDomain = data.spaceOwner.split('@')[1]
          const memberDomain = m.email.split('@')[1]
          const isExternal = ownerDomain !== memberDomain
          
          // Generate last activity text
          let lastActivity = ''
          if (m.lastAccessedAt) {
            const hoursSince = Math.floor((Date.now() - new Date(m.lastAccessedAt).getTime()) / (1000 * 60 * 60))
            if (hoursSince < 1) lastActivity = 'Active now'
            else if (hoursSince < 24) lastActivity = `Active ${hoursSince}h ago`
            else lastActivity = `Active ${Math.floor(hoursSince / 24)}d ago`
          }
          
          return {
            ...m,
            isExternal,
            lastActivity,
            invitationsSent: m.invitationStatus === 'pending' ? 1 : 0,
            permissions: getPermissionsList(m.role)
          }
        })
        
        setMembers(enhancedMembers)
        setSpaceOwner(data.spaceOwner)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMembers = () => {
    let filtered = [...members]

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(member =>
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => member.status === statusFilter)
    }

    setFilteredMembers(filtered)
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return

    setAddingMember(true)

    try {
      const res = await fetch(`/api/spaces/${params.id}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('✅ Member invited successfully!')
        setNewMemberEmail('')
        setNewMemberRole('viewer')
        setShowAddMemberDialog(false)
        fetchMembers()
      } else {
        alert(data.error || 'Failed to invite member')
      }
    } catch (error) {
      console.error('Failed to add member:', error)
      alert('Failed to invite member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedMember || !newRole) return

    try {
      const res = await fetch(`/api/spaces/${params.id}/members/${selectedMember.email}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'change_role',
          role: newRole
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('✅ Role updated successfully!')
        setShowRoleChangeDialog(false)
        setSelectedMember(null)
        setNewRole('')
        fetchMembers()
      } else {
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update role')
    }
  }

  const handleToggleStatus = async (member: Member) => {
    if (member.role === 'owner') {
      alert('Cannot change owner status')
      return
    }

    try {
      const res = await fetch(`/api/spaces/${params.id}/members/${member.email}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'toggle_status'
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert(`✅ Member ${data.status === 'active' ? 'activated' : 'suspended'}!`)
        fetchMembers()
      } else {
        alert(data.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
      alert('Failed to update status')
    }
  }

  const handleRemoveMember = async (member: Member) => {
    if (member.role === 'owner') {
      alert('Cannot remove space owner')
      return
    }

    if (!confirm(`Remove ${member.email} from this space?`)) return

    try {
      const res = await fetch(`/api/spaces/${params.id}/members/${member.email}`, {
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
      console.error('Failed to remove member:', error)
      alert('Failed to remove member')
    }
  }

  const handleSelectMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId)
    } else {
      newSelected.add(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.id)))
    }
  }

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

  // Calculate stats
  const activeMembers = members.filter(m => m.status === 'active').length
  const pendingInvites = members.filter(m => m.invitationStatus === 'pending').length
  const totalViews = members.reduce((sum, m) => sum + m.viewsCount, 0)
  const totalDownloads = members.reduce((sum, m) => sum + m.downloadsCount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/spaces/${params.id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Member Management</h1>
              <p className="text-sm text-slate-600">{space?.name}</p>
            </div>
          </div>

          <Button
            onClick={() => setShowAddMemberDialog(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </header>

      <div className="p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{members.length}</p>
            </div>
            <p className="text-sm text-slate-600">Total Members</p>
          </div>

          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{activeMembers}</p>
            </div>
            <p className="text-sm text-slate-600">Active Members</p>
          </div>

          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{pendingInvites}</p>
            </div>
            <p className="text-sm text-slate-600">Pending Invites</p>
          </div>

          <div className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
            </div>
            <p className="text-sm text-slate-600">Total Views</p>
          </div>
        </div>

        {/* ✨ NEW: Team Composition Card */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Team Composition
              </h3>
              <p className="text-sm text-slate-600">
                {members.filter(m => !m.isExternal).length} internal • {' '}
                {members.filter(m => m.isExternal).length} external collaborators
              </p>
            </div>
            
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {members.filter(m => m.role === 'admin').length}
                </div>
                <div className="text-xs text-slate-600 mt-1">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {members.filter(m => m.role === 'editor').length}
                </div>
                <div className="text-xs text-slate-600 mt-1">Editors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-600">
                  {members.filter(m => m.role === 'viewer').length}
                </div>
                <div className="text-xs text-slate-600 mt-1">Viewers</div>
              </div>
            </div>
          </div>
          
          {/* Team Health Indicator */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${activeMembers === members.length ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-slate-600">
                  {activeMembers === members.length ? 'All members active' : `${activeMembers}/${members.length} members active`}
                </span>
              </div>
              {pendingInvites > 0 && (
                <span className="text-yellow-600 font-medium">
                  {pendingInvites} pending invite{pendingInvites > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
         </div>

        {/* ✨ NEW: Recent Activity */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
            <Button variant="ghost" size="sm" className="text-xs text-slate-600">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {/* Mock recent activities - you'll replace with real data later */}
            {members
              .filter(m => m.lastAccessedAt)
              .sort((a, b) => new Date(b.lastAccessedAt!).getTime() - new Date(a.lastAccessedAt!).getTime())
              .slice(0, 5)
              .map((member, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    member.invitationStatus === 'pending' 
                      ? 'bg-yellow-100' 
                      : 'bg-green-100'
                  }`}>
                    {member.invitationStatus === 'pending' ? (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900">
                      <strong>{member.email}</strong>{' '}
                      {member.invitationStatus === 'pending' ? 'invited' : 'last accessed'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {member.lastActivity || new Date(member.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RoleBadge role={member.role} />
                </div>
              ))}
            
            {members.filter(m => m.lastAccessedAt).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Activity className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No recent activity yet</p>
              </div>
            )}
          </div>
        </div>

        
                
        {/* ✨ NEW: Bulk Action Bar */}
        {selectedMembers.size > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                  {selectedMembers.size}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-slate-600">
                    Choose an action to apply to all selected members
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => alert('Bulk email coming soon!')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => alert('Bulk role change coming soon!')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Change Role
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => alert('Export coming soon!')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Remove ${selectedMembers.size} members from this space?`)) {
                      alert('Bulk remove coming soon!')
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search */}


        {/* Filters & Search */}
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by email..."
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
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>

            {selectedMembers.size > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Bulk Actions ({selectedMembers.size})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => alert('Bulk role change coming soon!')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Change Role
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => alert('Bulk email coming soon!')}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => alert('Export coming soon!')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => {
                      if (confirm(`Remove ${selectedMembers.size} members?`)) {
                        alert('Bulk remove coming soon!')
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Member</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Activity</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase">Last Access</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">No members found</p>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => handleSelectMember(member.id)}
                        disabled={member.role === 'owner'}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900">{member.email}</p>
                            {member.isExternal && <ExternalBadge />}
                          </div>
                          <p className="text-xs text-slate-500">
                            Added {new Date(member.addedAt).toLocaleDateString()}
                          </p>
                          {member.lastActivity && (
                            <p className="text-xs text-purple-600 mt-0.5">
                              {member.lastActivity}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={member.invitationStatus === 'pending' ? 'pending' : member.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {member.viewsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {member.downloadsCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {member.lastAccessedAt
                          ? new Date(member.lastAccessedAt).toLocaleDateString()
                          : 'Never'}
                      </span>
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                const perms = getPermissionsList(member.role)
                                alert(`${member.role.toUpperCase()} Permissions:\n\n${perms.map(p => `• ${p}`).join('\n')}`)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Permissions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMember(member)
                                setNewRole(member.role)
                                setShowRoleChangeDialog(true)
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(member)}
                            >
                              <Activity className="mr-2 h-4 w-4" />
                              {member.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                alert('Resend invitation coming soon!')
                              }}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Invite
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleRemoveMember(member)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this space
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Role
              </label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as 'viewer' | 'editor' | 'admin')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="viewer">Viewer - Can view documents</option>
                <option value="editor">Editor - Can upload and edit</option>
                <option value="admin">Admin - Full access except space deletion</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberDialog(false)
                setNewMemberEmail('')
                setNewMemberRole('viewer')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!newMemberEmail.trim() || addingMember}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {addingMember ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={showRoleChangeDialog} onOpenChange={setShowRoleChangeDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedMember?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Current Role:</strong> {selectedMember?.role}
              </p>
            </div>

            <div>
               <label className="text-sm font-medium text-slate-700 mb-2 block">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a role...</option>
                <option value="viewer">Viewer - Can view documents</option>
                <option value="editor">Editor - Can upload and edit</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ The member will be notified of this role change via email.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleChangeDialog(false)
                setSelectedMember(null)
                setNewRole('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={!newRole || newRole === selectedMember?.role}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Update Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}