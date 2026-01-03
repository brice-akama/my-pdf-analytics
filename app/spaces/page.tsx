  //app/spaces/page.tsx
  
  "use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  FolderOpen,
  Users,
  Lock,
  Eye,
  Download,
  Share2,
  MoreVertical,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Grid,
  List,
  Filter,
  ArrowLeft,
  Settings,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Building2,
  Briefcase,
  DollarSign,
  Target,
  UserPlus,
  Link as LinkIcon,
  Mail,
  Copy,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

type SpaceType = {
  _id: string
  name: string
  description: string
  type: 'deal' | 'fundraising' | 'client' | 'custom'
  status: 'active' | 'archived' | 'draft'
  owner?: {  //   Make optional
    name: string
    email: string
  }
  teamMembers: number
  documentsCount: number
  viewsCount: number
  lastActivity: string
  createdAt: string
  color: string
  icon: string
  permissions: {
    canView: boolean
    canEdit: boolean
    canShare: boolean
    canDownload: boolean
  }
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'active' | 'archived' | 'draft'

export default function SpacesPage() {
  const router = useRouter()
  const [spaces, setSpaces] = useState<SpaceType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null)
  const [memberSpaces, setMemberSpaces] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
   



  

  // Create Space Form State
  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    type: 'custom' as SpaceType['type'],
    template: '',
    privacy: 'private',
    autoExpiry: false,
    expiryDate: '',
    requireNDA: false,
    enableWatermark: false,
    allowDownloads: true,
    notifyOnView: true
  })

  // Template Categories for Data Rooms
  const templates = [
    {
      id: 'ma-deal',
      name: 'M&A Deal Room',
      description: 'Complete due diligence data room for mergers and acquisitions',
      icon: '🤝',
      color: 'from-blue-500 to-blue-600',
      type: 'deal',
      folders: ['Financial Statements', 'Legal Documents', 'HR & Personnel', 'IP & Technology', 'Customer Data', 'Operations']
    },
    {
      id: 'fundraising',
      name: 'Fundraising Room',
      description: 'Investor data room for Series A-C fundraising rounds',
      icon: '💰',
      color: 'from-green-500 to-green-600',
      type: 'fundraising',
      folders: ['Pitch Deck', 'Financial Model', 'Cap Table', 'Legal Docs', 'Product Demo', 'Market Research']
    },
    {
      id: 'client-portal',
      name: 'Client Portal',
      description: 'Secure portal for ongoing client collaboration',
      icon: '🎯',
      color: 'from-cyan-500 to-cyan-600',
      type: 'client',
      folders: ['Project Files', 'Contracts', 'Invoices', 'Reports', 'Communications']
    },
    {
      id: 'board-room',
      name: 'Board Room',
      description: 'Confidential space for board meetings and governance',
      icon: '👔',
      color: 'from-purple-500 to-purple-600',
      type: 'custom',
      folders: ['Board Decks', 'Minutes', 'Resolutions', 'Financial Reports', 'Strategic Plans']
    },
    {
      id: 'sales-room',
      name: 'Sales Deal Room',
      description: 'Organized space for enterprise sales processes',
      icon: '📊',
      color: 'from-orange-500 to-orange-600',
      type: 'deal',
      folders: ['Proposals', 'Pricing', 'Case Studies', 'Product Info', 'Contracts', 'Security Docs']
    },
    {
      id: 'audit-room',
      name: 'Audit & Compliance',
      description: 'Secure repository for audit documentation',
      icon: '🔍',
      color: 'from-red-500 to-red-600',
      type: 'custom',
      folders: ['Audit Reports', 'Compliance Docs', 'Certifications', 'Policies', 'Risk Assessment']
    }
  ]

  // Fetch spaces
  useEffect(() => {
    fetchSpaces()
  }, [])

  const fetchSpaces = async () => {
  try {
    const res = await fetch('/api/spaces', {
      credentials: 'include',
    })

    if (res.status === 401) {
      router.push('/login')
      return
    }

    const data = await res.json()

    if (data.success) {
      // ✅ Separate owned spaces and member spaces
      const owned = data.spaces.filter((s: any) => s.isOwner)
      const member = data.spaces.filter((s: any) => !s.isOwner)
      
      setSpaces(owned)
      setMemberSpaces(member) // You'll need to add this state
    }
  } catch (error) {
    console.error('Failed to fetch spaces:', error)
  } finally {
    setLoading(false)
  }
}

  // Create new space
  const handleCreateSpace = async () => {
  if (!newSpace.name.trim()) {
    alert('Please enter a space name')
    return
  }

  setCreating(true)

  try {
    const res = await fetch("/api/spaces", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        ...newSpace,
        status: 'active' //  Set default status
      }),
    })

    const data = await res.json()

    if (res.ok && data.success) {
      alert('Space created successfully!')
      setShowCreateDialog(false)
      setShowTemplatesDialog(false)
      // Navigate to the new space (no immediate fetch to avoid racey updates)
      router.push(`/spaces/${data.space._id}`)
    } else {
      alert(data.error || 'Failed to create space')
    }
  } catch (error) {
    console.error('Create error:', error)
    alert('Failed to create space. Please try again.')
  } finally {
    setCreating(false)
  }
}
  

  // Filter spaces
  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         space.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || space.status === filterType
    return matchesSearch && matchesFilter
  })

  // Format status text (capitalize first letter)
const formatStatus = (status: string) => {
  if (!status) return 'Unknown';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

// Get initial from user object
const getInitial = (user: any) => {
  if (!user) return 'U';
  return user.name?.charAt(0) || user.email?.charAt(0) || 'U';
};

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago'
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago'
    
    return date.toLocaleDateString()
  }

  // Get space icon
  const getSpaceIcon = (type: string) => {
    switch (type) {
      case 'deal': return <Briefcase className="h-5 w-5" />
      case 'fundraising': return <DollarSign className="h-5 w-5" />
      case 'client': return <Target className="h-5 w-5" />
      default: return <FolderOpen className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading spaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Data Rooms</h1>
                <p className="text-sm text-slate-600">Secure spaces for deals, fundraising, and collaboration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTemplatesDialog(true)}
                className="gap-2"
              >
                <Grid className="h-4 w-4" />
                Templates
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Space
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="search"
                placeholder="Search spaces..."
                className="pl-10 h-12 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('active')}
              >
                Active
              </Button>
              <Button
                variant={filterType === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('archived')}
              >
                Archived
              </Button>
              
              {/* Remove view toggle - always use table view */}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredSpaces.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Create your first data room</h3>
            <p className="text-slate-600 max-w-2xl mx-auto mb-6">
              Organize your deals, fundraising rounds, or client projects in secure, trackable spaces. 
              Monitor who views what and when.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setShowTemplatesDialog(true)}
                variant="outline"
                className="gap-2"
              >
                <Grid className="h-4 w-4" />
                Browse Templates
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Space
              </Button>
            </div>
          </div>
        )}

        {/* Spaces Grid/List */}
       {/* Spaces Table - Professional View */}
{filteredSpaces.length > 0 && (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <table className="w-full">
      <thead className="bg-slate-50 border-b">
        <tr>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider w-12">
            <input type="checkbox" className="rounded" />
          </th>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Name
          </th>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Type
          </th>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Documents
          </th>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Members
          </th>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Activity
          </th>
          <th className="text-left px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Status
          </th>
          <th className="text-right px-6 py-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {filteredSpaces.map((space) => (
          <tr
            key={space._id}
            className="hover:bg-slate-50 transition-colors cursor-pointer group"
            onClick={() => router.push(`/spaces/${space._id}`)}
          >
            {/* Checkbox */}
            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" className="rounded" />
            </td>
            
            {/* Name & Description */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className={`
                  h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm
                  ${space.type === 'deal' ? 'bg-blue-100 text-blue-600' :
                    space.type === 'fundraising' ? 'bg-green-100 text-green-600' :
                    space.type === 'client' ? 'bg-cyan-100 text-cyan-600' :
                    'bg-purple-100 text-purple-600'}
                `}>
                  {getSpaceIcon(space.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-purple-600 transition-colors">
                    {space.name}
                  </p>

                </div>
              </div>
            </td>
            
            {/* Type */}
            <td className="px-6 py-4">
              <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                ${space.type === 'deal' ? 'bg-blue-50 text-blue-700' :
                  space.type === 'fundraising' ? 'bg-green-50 text-green-700' :
                  space.type === 'client' ? 'bg-cyan-50 text-cyan-700' :
                  'bg-purple-50 text-purple-700'}
              `}>
                {space.type === 'deal' ? 'Deal Room' :
                 space.type === 'fundraising' ? 'Fundraising' :
                 space.type === 'client' ? 'Client' :
                 'Custom'}
              </span>
            </td>
            
            {/* Documents */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">
                  {space.documentsCount || 0}
                </span>
                <span className="text-xs text-slate-500">files</span>
              </div>
            </td>
            
            {/* Members */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">
                  {space.teamMembers || 0}
                </span>
                <span className="text-xs text-slate-500">members</span>
              </div>
            </td>
            
            {/* Activity */}
            <td className="px-6 py-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Eye className="h-3 w-3 text-slate-400" />
                  <span className="font-medium">{space.viewsCount || 0}</span>
                  <span className="text-slate-500">views</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(space.lastActivity || space.createdAt)}
                </div>
              </div>
            </td>
            
            {/* Status */}
            <td className="px-6 py-4">
              <span className={`
                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                ${space.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : space.status === 'archived'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-amber-100 text-amber-700'}
              `}>
                {formatStatus(space.status)}
              </span>
            </td>
            
            {/* Actions */}
            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/spaces/${space._id}`)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Open
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
  onClick={(e) => {
    e.stopPropagation();
    console.log("Navigating to space ID:", space._id); // Add this line
    router.push(`/spaces/${space._id}`);
  }}
>
  <Eye className="mr-2 h-4 w-4" />
  Open Space
</DropdownMenuItem>

                    <DropdownMenuItem>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Access
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    
    {/* Shared with You */}
{memberSpaces.length > 0 && (
  <div className="mt-12">
    <h2 className="text-xl font-semibold text-slate-900 mb-4">
      Shared with You
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {memberSpaces.map((space) => (
        <div
          key={space._id}
          onClick={() => router.push(`/spaces/${space._id}`)}
          className="bg-white rounded-xl border shadow-sm hover:shadow-xl transition-all cursor-pointer p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ background: space.color || '#6366f1' }}
            >
              <FolderOpen className="h-6 w-6 text-white" />
            </div>

            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {space.role || 'Member'}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {space.name}
          </h3>

          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {space.description}
          </p>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {space.documentsCount || 0}
            </span>

            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {space.teamMembers || 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

    {/* Table Footer with Stats */}
    <div className="border-t bg-slate-50 px-6 py-3">
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-600">
          Showing <span className="font-medium text-slate-900">{filteredSpaces.length}</span> spaces
        </p>
        <div className="flex items-center gap-6 text-slate-600">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium">
              {filteredSpaces.reduce((sum, s) => sum + (s.documentsCount || 0), 0)}
            </span>
            total documents
          </span>
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="font-medium">
              {filteredSpaces.reduce((sum, s) => sum + (s.viewsCount || 0), 0)}
            </span>
            total views
          </span>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      {/* Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl">Choose a Template</DialogTitle>
            <DialogDescription>
              Start with a pre-configured data room template or create a custom space
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border rounded-xl p-6 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  setNewSpace({
                    ...newSpace,
                    name: template.name,
                    type: template.type as SpaceType['type'],
                    template: template.id
                  })
                  setShowTemplatesDialog(false)
                  setShowCreateDialog(true)
                }}
              >
                <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-3xl mb-4`}>
                  {template.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-purple-600 transition-colors">
                  {template.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {template.description}
                </p>
                <div className="text-xs text-slate-500">
                  Includes: {template.folders.slice(0, 3).join(', ')}
                  {template.folders.length > 3 && ` +${template.folders.length - 3} more`}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Space Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Create Data Room</DialogTitle>
            <DialogDescription>
              Set up a secure space for your deal, project, or collaboration
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Space Name *</Label>
                <Input
                  placeholder="e.g., Series A Fundraising Room"
                  value={newSpace.name}
                  onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="What is this space for?"
                  rows={3}
                  value={newSpace.description}
                  onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Space Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'deal', label: 'Deal Room', icon: Briefcase },
                    { value: 'fundraising', label: 'Fundraising', icon: DollarSign },
                    { value: 'client', label: 'Client Portal', icon: Target },
                    { value: 'custom', label: 'Custom', icon: FolderOpen }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setNewSpace({ ...newSpace, type: type.value as SpaceType['type'] })}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                        newSpace.type === type.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <type.icon className="h-5 w-5 text-slate-700" />
                      <span className="font-medium text-slate-900">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">Require NDA</p>
                  <p className="text-sm text-slate-500">Visitors must sign NDA before access</p>
                </div>
                <Switch
                  checked={newSpace.requireNDA}
                  onCheckedChange={(checked) => setNewSpace({ ...newSpace, requireNDA: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">Dynamic Watermarks</p>
                  <p className="text-sm text-slate-500">Add viewer email to all documents</p>
                </div>
                <Switch
                  checked={newSpace.enableWatermark}
                  onCheckedChange={(checked) => setNewSpace({ ...newSpace, enableWatermark: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">Auto-expire Access</p>
                  <p className="text-sm text-slate-500">Automatically revoke access after date</p>
                </div>
                <Switch
                  checked={newSpace.autoExpiry}
                  onCheckedChange={(checked) => setNewSpace({ ...newSpace, autoExpiry: checked })}
                />
              </div>
              
              {newSpace.autoExpiry && (
                <div className="space-y-2 ml-4">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={newSpace.expiryDate}
                    onChange={(e) => setNewSpace({ ...newSpace, expiryDate: e.target.value })}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">View Notifications</p>
                  <p className="text-sm text-slate-500">Get notified when someone views content</p>
                </div>
                <Switch
                  checked={newSpace.notifyOnView}
                  onCheckedChange={(checked) => setNewSpace({ ...newSpace, notifyOnView: checked })}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="permissions" className="space-y-4 mt-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">Allow Downloads</p>
                  <p className="text-sm text-slate-500">Users can download documents</p>
                </div>
                <Switch
                  checked={newSpace.allowDownloads}
                  onCheckedChange={(checked) => setNewSpace({ ...newSpace, allowDownloads: checked })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Privacy Setting</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setNewSpace({ ...newSpace, privacy: 'private' })}
                    className={`w-full flex items-start gap-3 p-4 border rounded-lg transition-all ${
                      newSpace.privacy === 'private'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    <Lock className="h-5 w-5 text-slate-700 mt-0.5" />
                    <div className="text-left">
                      <div className="font-medium text-slate-900">Private</div>
                      <div className="text-sm text-slate-600">Only invited people can access</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setNewSpace({ ...newSpace, privacy: 'link' })}
                    className={`w-full flex items-start gap-3 p-4 border rounded-lg transition-all ${
newSpace.privacy === 'link'
? 'border-purple-500 bg-purple-50'
: 'border-slate-200 hover:border-purple-300'
}`}
>
<LinkIcon className="h-5 w-5 text-slate-700 mt-0.5" />
<div className="text-left">
<div className="font-medium text-slate-900">Link Access</div>
<div className="text-sm text-slate-600">Anyone with the link can access</div>
</div>
</button>
</div>
</div>
</TabsContent>
</Tabs>
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false)
            setNewSpace({
              name: '',
              description: '',
              type: 'custom',
              template: '',
              privacy: 'private',
              autoExpiry: false,
              expiryDate: '',
              requireNDA: false,
              enableWatermark: false,
              allowDownloads: true,
              notifyOnView: true
            })
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateSpace}
          disabled={creating}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {creating ? 'Creating...' : 'Create Space'}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</div>
  )
}