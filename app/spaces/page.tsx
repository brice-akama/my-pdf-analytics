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
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<SpaceType | null>(null)



  

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
      const res = await fetch("/api/spaces", {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSpaces(data.spaces)
        }
      }
    } catch (error) {
      console.error("Failed to fetch spaces:", error)
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

    try {
      const res = await fetch("/api/spaces", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newSpace),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Space created successfully!')
        setShowCreateDialog(false)
        setShowTemplatesDialog(false)
        fetchSpaces()
        // Navigate to the new space
        router.push(`/spaces/${data.space._id}`)
      } else {
        alert(data.error || 'Failed to create space')
      }
    } catch (error) {
      console.error('Create error:', error)
      alert('Failed to create space. Please try again.')
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
                onClick={() => router.push('/app')}
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
              
              <div className="ml-2 border-l pl-2 flex gap-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
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
        {filteredSpaces.length > 0 && (
          <div className={viewMode === 'grid' 
            ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredSpaces.map((space) => (
              <div
                key={space._id}
                className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer group"
                onClick={() => router.push(`/spaces/${space._id}`)}
              >
                {viewMode === 'grid' ? (
  <>
    {spaces.map((space) => (
      <div
        key={space._id}
        className="group bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer relative"
        onClick={() => router.push(`/spaces/${space._id}`)}
      >
        {/* Status Badge - Top Right */}
        {space.status && (
          <div className="absolute top-4 right-4 z-10">
            <span className={`
              px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm
              ${space.status === 'active'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : space.status === 'archived'
                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
              }
            `}>
              {formatStatus(space.status)}
            </span>
          </div>
        )}

        {/* Header Section with Icon */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-4">
            {/* Icon with Type-based Color */}
            <div className={`
              h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0
              ${space.type === 'deal' ? 'bg-blue-100 text-blue-600' :
                space.type === 'fundraising' ? 'bg-green-100 text-green-600' :
                space.type === 'client' ? 'bg-cyan-100 text-cyan-600' :
                'bg-purple-100 text-purple-600'}
            `}>
              {getSpaceIcon(space.type)}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1 group-hover:text-purple-600 transition-colors">
                {space.name}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {space.description || 'No description'}
              </p>
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
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
        </div>

        {/* Metrics Section */}
        <div className="p-6 pb-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Files */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {space.documentsCount || 0}
              </div>
              <div className="text-xs text-slate-500 font-medium">Documents</div>
            </div>

            {/* Views */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 mb-2">
                <Eye className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {space.viewsCount || 0}
              </div>
              <div className="text-xs text-slate-500 font-medium">Total Views</div>
            </div>

            {/* Members */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 mb-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {space.teamMembers || 0}
              </div>
              <div className="text-xs text-slate-500 font-medium">Members</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">
                Updated {formatTimeAgo(space.lastActivity || space.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {getInitial(space.owner)}
                </span>
              </div>
              
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent pt-12 pb-4 px-6 opacity-0 group-hover:opacity-100 transition-opacity">
    <Button
      className="w-full bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click
        router.push(`/spaces/${space._id}`);
      }}
    >
      <Eye className="h-4 w-4 mr-2" />
      View Details
    </Button>
  </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-purple-500 rounded-lg pointer-events-none transition-colors" />
      </div>
    ))}
  </>
) : (
 

                  // List View
                  <div className="p-6 flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${space.color} flex items-center justify-center text-white flex-shrink-0`}>
                      {getSpaceIcon(space.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">
                        {space.name}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-1">
                        {space.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-slate-900">{space.documentsCount}</div>
                        <div className="text-xs text-slate-500">Files</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-slate-900">{space.viewsCount}</div>
                        <div className="text-xs text-slate-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-slate-900">{space.teamMembers}</div>
                        <div className="text-xs text-slate-500">Members</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Analytics</DropdownMenuItem>
                          <DropdownMenuItem>Settings</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover\:from-purple-700 hover\:to-blue-700"
        >
          Create Space
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</div>
  )
}