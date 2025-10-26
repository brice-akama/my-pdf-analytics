"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FolderOpen,
  Plus,
  Search,
  MoreVertical,
  Share2,
  Trash2,
  Settings,
  ArrowLeft,
  Users,
  FileText,
  Clock,
  Archive,
  Grid,
  List
} from "lucide-react"

type SpaceType = {
  _id: string
  name: string
  template: string | null
  color: string
  active: boolean
  documents: any[]
  members: any[]
  updatedAt: string
}

type TemplateType = {
  id: string
  name: string
  description: string
  icon: string
  color: string
  folders: string[]
}

export default function SpacesPage() {
  const router = useRouter()
  const [spaces, setSpaces] = useState<SpaceType[]>([])
  const [templates, setTemplates] = useState<TemplateType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null)
  const [newSpaceName, setNewSpaceName] = useState("")
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterActive, setFilterActive] = useState('all')

  useEffect(() => {
    fetchSpaces()
    fetchTemplates()
  }, [])

  const fetchSpaces = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch("/api/spaces", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
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

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/spaces/templates")
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      alert('Please enter a space name')
      return
    }

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const res = await fetch("/api/spaces", {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newSpaceName,
          template: selectedTemplate?.id,
          color: selectedTemplate?.color.split(' ')[1] || '#8B5CF6'
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setShowCreateDialog(false)
          setShowTemplates(false)
          setNewSpaceName("")
          setSelectedTemplate(null)
          fetchSpaces()
          // Navigate to the new space
          router.push(`/spaces/${data.spaceId}`)
        }
      }
    } catch (error) {
      console.error("Failed to create space:", error)
      alert("Failed to create space")
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago'
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago'
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago'
    
    return date.toLocaleDateString()
  }

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterActive === 'all' || 
      (filterActive === 'active' && space.active) ||
      (filterActive === 'archived' && !space.active)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading spaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">Spaces</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
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
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters & Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">Show:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {filterActive === 'all' ? 'My Spaces' : filterActive === 'active' ? 'Active' : 'Archived'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterActive('all')}>
                  My Spaces
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterActive('active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterActive('archived')}>
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant={filterActive === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(filterActive === 'active' ? 'all' : 'active')}
            >
              Active
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search spaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Spaces List/Grid */}
        {filteredSpaces.length === 0 ? (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? 'No spaces found' : 'No spaces yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Create your first data room to organize deals and projects'
              }
            </p>
            {!searchQuery && (
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowTemplates(true)}
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
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => (
              <div
                key={space._id}
                className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/spaces/${space._id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(to br, ${space.color}, ${space.color}dd)` }}
                    >
                      <FolderOpen className="h-6 w-6 text-white" />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">
                    {space.name}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(space.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>{space.documents?.length || 0}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {space.members?.slice(0, 3).map((member, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                        >
                          {member.email?.charAt(0).toUpperCase()}
                        </div>
                      ))}
                    </div>
                    {space.members && space.members.length > 3 && (
                      <span className="text-xs text-slate-500">
                        +{space.members.length - 3} more
                      </span>
                    )}
                    {space.active && (
                      <span className="ml-auto bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          /* List View - MATCHES SCREENSHOT */
<div className="bg-white rounded-xl border shadow-sm overflow-hidden">
  <table className="w-full">
    <thead className="bg-slate-50 border-b">
      <tr>
        <th className="text-left px-6 py-3 w-12">
          <input type="checkbox" className="rounded border-slate-300" />
        </th>
        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 uppercase">
          Name ↕
        </th>
        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 uppercase">
          Last Updated ↓
        </th>
        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 uppercase">
          Owner ↕
        </th>
        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-700 uppercase">
          Active ↕
        </th>
        <th className="text-right px-6 py-3"></th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      {filteredSpaces.map((space) => (
        <tr
          key={space._id}
          className="hover:bg-slate-50 cursor-pointer transition-colors group"
          onClick={() => router.push(`/spaces/${space._id}`)}
        >
          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" className="rounded border-slate-300" />
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: space.color }}
              >
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium text-slate-900">{space.name}</span>
            </div>
          </td>
          <td className="px-6 py-4 text-sm text-slate-600">
            {formatTimeAgo(space.updatedAt)}
          </td>
          <td className="px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                {space.members?.[0]?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </td>
          <td className="px-6 py-4">
            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={space.active} className="sr-only peer" readOnly />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-slate-700">Yes</span>
            </label>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 bg-slate-100 hover:bg-slate-200 border-0"
              >
                <Archive className="h-4 w-4" />
                Share
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        )}
      </div>

      {/* Create Space Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Give your data room a name to get started
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Space Name</label>
              <Input
                placeholder="e.g. Q4 Fundraise, Client Portal"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                autoFocus
              />
            </div>

            {selectedTemplate && (
              <div className="p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div>
                    <p className="font-medium text-slate-900">{selectedTemplate.name}</p>
                    <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setSelectedTemplate(null)}
                >
                  Remove Template
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowCreateDialog(false)
                setShowTemplates(true)
              }}
            >
              {selectedTemplate ? 'Change Template' : 'Use a Template'}
            </Button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setNewSpaceName("")
                setSelectedTemplate(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSpace}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Create Space
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      {/* Templates Gallery Dialog - MATCHES SCREENSHOT */}
<Dialog open={showTemplates} onOpenChange={setShowTemplates}>
  <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-semibold text-slate-900">Space template gallery</DialogTitle>
      <DialogDescription className="text-base text-slate-600">
        These templates can help you get started.
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid md:grid-cols-2 gap-6 py-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-slate-300 transition-all"
        >
          {/* Colorful Header Image */}
          <div 
            className={`h-32 bg-gradient-to-br ${template.color} relative overflow-hidden`}
          >
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
              }}></div>
            </div>
            {/* Icon */}
            <div className="absolute bottom-4 left-4 text-5xl opacity-90">
              {template.icon}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white p-6">
            <h3 className="font-semibold text-lg text-slate-900 mb-2">
              {template.name}
            </h3>
            <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
              {template.description}
            </p>

            {/* Use Template Button */}
            <Button
              onClick={() => {
                setSelectedTemplate(template)
                setShowTemplates(false)
                setShowCreateDialog(true)
              }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white"
            >
              Use template
            </Button>
          </div>
        </div>
      ))}
    </div>
  </DialogContent>
</Dialog>
    </div>
  )
}