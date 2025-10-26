"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Upload,
  FolderOpen,
  FileText,
  Share2,
  Settings,
  Users,
  BarChart3,
  Plus
} from "lucide-react"

export default function SpaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [space, setSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpace()
  }, [params.id])

  const fetchSpace = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSpace(data.space)
        }
      }
    } catch (error) {
      console.error("Failed to fetch space:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading space...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Space not found</h2>
          <Button onClick={() => router.push('/spaces')}>Back to Spaces</Button>
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
                onClick={() => router.push('/spaces')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(to br, ${space.color}, ${space.color}dd)` }}
                >
                  <FolderOpen className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">{space.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Documents</span>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {space.documents?.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Members</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {space.members?.length || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Total Views</span>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="bg-white rounded-lg border shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Status</span>
              <div className={`h-2 w-2 rounded-full ${space.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {space.active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
          <Upload className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-600 mb-6">Upload documents to get started with this space</p>
          <Button className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Plus className="h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>
    </div>
  )
}