// app/organization/[orgId]/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Users,
  FolderOpen,
  TrendingUp,
  Activity,
  Plus,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function OrganizationDashboard() {
  const params = useParams()
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizationData()
  }, [params.orgId])

  const fetchOrganizationData = async () => {
    try {
      // Fetch organization details
      const orgRes = await fetch(`/api/organizations/${params.orgId}/settings`, {
        credentials: 'include',
      })

      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setOrg(orgData.organization)
      }

      // Fetch members
      const membersRes = await fetch(`/api/organizations/${params.orgId}/members`, {
        credentials: 'include',
      })

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setMembers(membersData.members || [])
      }

      // Fetch spaces
      const spacesRes = await fetch(`/api/spaces?organizationId=${params.orgId}`, {
        credentials: 'include',
      })

      if (spacesRes.ok) {
        const spacesData = await spacesRes.json()
        setSpaces(spacesData.spaces || [])
      }

    } catch (error) {
      console.error('Failed to fetch organization data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Organization not found</h2>
          <Button onClick={() => router.push('/spaces')}>Back to Spaces</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/spaces')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  {org.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{org.name}</h1>
                  <p className="text-sm text-slate-600 capitalize">{org.plan} Plan</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/organization/${params.orgId}/members`}>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Members
                </Button>
              </Link>
              
              <Link href={`/organization/${params.orgId}/settings`}>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{org.memberCount}</p>
            </div>
            <p className="text-sm text-slate-600">Team Members</p>
            <p className="text-xs text-slate-500 mt-1">
              {org.settings.maxMembers === -1 ? 'Unlimited' : `of ${org.settings.maxMembers}`}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{org.spaceCount}</p>
            </div>
            <p className="text-sm text-slate-600">Active Spaces</p>
            <p className="text-xs text-slate-500 mt-1">
              {org.settings.maxSpaces === -1 ? 'Unlimited' : `of ${org.settings.maxSpaces}`}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {spaces.reduce((sum, s) => sum + (s.viewsCount || 0), 0)}
              </p>
            </div>
            <p className="text-sm text-slate-600">Total Views</p>
            <p className="text-xs text-slate-500 mt-1">This month</p>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {spaces.reduce((sum, s) => sum + (s.documentsCount || 0), 0)}
              </p>
            </div>
            <p className="text-sm text-slate-600">Documents</p>
            <p className="text-xs text-slate-500 mt-1">Across all spaces</p>
          </div>
        </div>

        {/* Recent Spaces */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Spaces</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/spaces')}
            >
              View All
            </Button>
          </div>

          {spaces.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-4">No spaces yet</p>
              <Button onClick={() => router.push('/spaces')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Space
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {spaces.slice(0, 5).map((space) => (
                <div
                  key={space._id}
                  onClick={() => router.push(`/spaces/${space._id}`)}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 cursor-pointer border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ background: space.color || '#6366f1' }}
                    >
                      <FolderOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{space.name}</p>
                      <p className="text-sm text-slate-500">
                        {space.documentsCount || 0} documents · {space.teamMembers || 0} members
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(space.lastActivity || space.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
            <Link href={`/organization/${params.orgId}/members`}>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {members.slice(0, 8).map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg border"
              >
                <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate text-sm">
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
 

 