// app/templates/group/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Search,
  ArrowLeft,
  Plus,
  Folder,
  Calendar,
  Users,
  MoreVertical,
  Trash2,
  Edit,
  Send,
  Copy,
  Clock,
  TrendingUp,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type GroupTemplate = {
  _id: string
  name: string
  description: string
  documents: Array<{
    documentId: string
    filename: string
    numPages: number
    order: number
  }>
  recipientRoles: Array<{
    index: number
    role: string
    color: string
  }>
  settings: {
    viewMode: string
    signingOrder: string
    expirationDays: string
  }
  createdAt: string
  lastUsed: string | null
  usageCount: number
}

export default function GroupTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<GroupTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/templates/group", {
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setTemplates(data.templates)
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"?`)) return

    try {
      const res = await fetch(`/api/templates/group/${templateId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (res.ok) {
        alert("✅ Template deleted successfully")
        fetchTemplates()
      } else {
        alert("❌ Failed to delete template")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("❌ Failed to delete template")
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/documents-page')}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <path d="M 60 50 L 60 150 L 140 150 L 140 70 L 120 50 Z" fill="url(#logoGrad)"/>
                <rect x="75" y="100" width="12" height="30" fill="white" opacity="0.9" rx="2"/>
                <rect x="94" y="85" width="12" height="45" fill="white" opacity="0.9" rx="2"/>
                <rect x="113" y="70" width="12" height="60" fill="white" opacity="0.9" rx="2"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-900">
              DocMetrics
            </span>
          </div>

          <div className="flex-1 flex justify-center px-8">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search templates by name or description..."
                className="w-full pl-11 h-10 bg-slate-50 border-slate-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={() => router.push('/templates/group/create')}
            className="gap-2 bg-purple-600 hover:bg-purple-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900 mb-1">
              Document Group Templates
            </h1>
            <p className="text-sm text-slate-600">
              Manage and reuse document bundles for repeated workflows
            </p>
          </div>

          {/* Templates Table */}
          {loading ? (
            <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-slate-600 text-sm">Loading templates...</p>
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="bg-white rounded-lg border shadow-sm">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Documents
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Usage
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Settings
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTemplates.map((template) => (
                      <tr 
                        key={template._id} 
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        {/* Template Name & Description */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0">
                              <Folder className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-900 mb-0.5">
                                {template.name}
                              </div>
                              {template.description && (
                                <div className="text-sm text-slate-500 line-clamp-1">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Documents */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-700">
                              {template.documents.length}
                            </span>
                          </div>
                        </td>

                        {/* Recipients */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-700">
                              {template.recipientRoles.length}
                            </span>
                          </div>
                        </td>

                        {/* Usage Count */}
                        <td className="px-4 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                            <span className="text-sm font-semibold text-green-700">
                              {template.usageCount}
                            </span>
                            <span className="text-xs text-green-600">uses</span>
                          </div>
                        </td>

                        {/* Settings */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                              {template.settings.viewMode === 'shared' ? 'Shared' : 'Isolated'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 w-fit">
                              {template.settings.signingOrder === 'sequential' ? 'Sequential' : 'Parallel'}
                            </span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-600">
                            {formatDate(template.createdAt)}
                          </div>
                          {template.lastUsed && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              Last: {formatDate(template.lastUsed)}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => router.push(`/templates/group/${template._id}/use`)}
                              size="sm"
                              className="gap-1.5 bg-purple-600 hover:bg-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Use
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white border shadow-md rounded-md">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/templates/group/${template._id}/use`)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Use Template
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/templates/group/${template._id}/edit`)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Template
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(template._id)
                                    alert('Template ID copied!')
                                  }}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTemplate(template._id, template.name)}
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
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
            </div>
          ) : (
            <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
              <div className="inline-flex h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                <Folder className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No templates found' : 'No templates yet'}
              </h3>
              <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                {searchQuery 
                  ? 'Try adjusting your search criteria or create a new template'
                  : 'Create your first document group template to streamline your workflow'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => router.push('/templates/group/create')}
                  className="gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Template
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}