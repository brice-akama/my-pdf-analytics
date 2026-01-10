// components/OrganizationSwitcher.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  ChevronDown,
  Plus,
  Settings,
  Users,
  Check,
  LayoutDashboard  // ✅ NEW ICON
} from 'lucide-react'

type Organization = {
  id: string
  name: string
  slug: string
  role: string
  isOwner: boolean
  memberCount: number
  spaceCount: number
  plan: string
}

export function OrganizationSwitcher() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const res = await fetch('/api/organizations', {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setOrganizations(data.organizations)
          
          const lastOrgId = localStorage.getItem('currentOrgId')
          const lastOrg = data.organizations.find((o: Organization) => o.id === lastOrgId)
          setCurrentOrg(lastOrg || data.organizations[0] || null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchOrganization = (org: Organization) => {
    setCurrentOrg(org)
    localStorage.setItem('currentOrgId', org.id)
    window.location.reload()
  }

  const getCurrentOrgId = () => {
  return currentOrg?.id || null;
};

// Export or use globally
if (typeof window !== 'undefined') {
  (window as any).getCurrentOrgId = () => currentOrg?.id || null;
}

  if (loading) {
    return (
      <div className="h-9 w-48 bg-slate-100 animate-pulse rounded-lg" />
    )
  }

  if (organizations.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/organization/create')}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Create Organization
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600" />
            <span className="font-semibold truncate">
              {currentOrg?.name || 'Select Organization'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[280px] bg-white">
        <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
          Your Organizations
        </div>
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org)}
            className="flex items-center justify-between py-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                {org.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{org.name}</p>
                <p className="text-xs text-slate-500">
                  {org.memberCount} members · {org.spaceCount} spaces
                </p>
              </div>
            </div>
            {currentOrg?.id === org.id && (
              <Check className="h-4 w-4 text-purple-600 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {currentOrg && (
          <>
            {/* ✅ NEW: Organization Dashboard Link */}
            <DropdownMenuItem
              onClick={() => router.push(`/organization/${currentOrg.id}/dashboard`)}
              className="gap-2 font-medium"
            >
              <LayoutDashboard className="h-4 w-4" />
              Organization Dashboard
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => router.push(`/organization/${currentOrg.id}/members`)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Members
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => router.push(`/organization/${currentOrg.id}/settings`)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Organization Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem
          onClick={() => router.push('/organization/create')}
          className="gap-2 text-purple-600"
        >
          <Plus className="h-4 w-4" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}