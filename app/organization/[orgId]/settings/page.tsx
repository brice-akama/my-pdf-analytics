// app/spaces/[id]/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ArrowLeft,
  Settings,
  Save,
  Trash2,
  Archive,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
  Shield,
  Bell,
  Palette,
  Loader2
} from 'lucide-react'

export default function SpaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [space, setSpace] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    privacy: 'private',
    requireNDA: false,
    enableWatermark: false,
    notifyOnView: true,
    allowDownloads: true,
    autoExpiry: false,
    expiryDate: ''
  })

  useEffect(() => {
    fetchSpace()
  }, [params.id])

  const fetchSpace = async () => {
    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        const spaceData = data.space
        
        setSpace(spaceData)
        setFormData({
          name: spaceData.name || '',
          description: spaceData.description || '',
          color: spaceData.color || '#6366f1',
          privacy: spaceData.privacy || 'private',
          requireNDA: spaceData.settings?.requireNDA || false,
          enableWatermark: spaceData.settings?.enableWatermark || false,
          notifyOnView: spaceData.settings?.notifyOnView || true,
          allowDownloads: spaceData.settings?.allowDownloads || true,
          autoExpiry: spaceData.settings?.autoExpiry || false,
          expiryDate: spaceData.settings?.expiryDate || ''
        })
      }
    } catch (error) {
      console.error('Failed to fetch space:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          privacy: formData.privacy,
          settings: {
            requireNDA: formData.requireNDA,
            enableWatermark: formData.enableWatermark,
            notifyOnView: formData.notifyOnView,
            allowDownloads: formData.allowDownloads,
            autoExpiry: formData.autoExpiry,
            expiryDate: formData.expiryDate
          }
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('✅ Settings saved successfully!')
        fetchSpace()
      } else {
        alert(data.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Archive this space? You can restore it later.')) return

    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      })

      if (res.ok) {
        alert('✅ Space archived successfully!')
        router.push('/spaces')
      } else {
        alert('Failed to archive space')
      }
    } catch (error) {
      console.error('Archive error:', error)
      alert('Failed to archive space')
    }
  }

  const handleDelete = async () => {
    if (!confirm('⚠️ DELETE this space permanently? This CANNOT be undone!\n\nType "DELETE" to confirm.')) return

    try {
      const res = await fetch(`/api/spaces/${params.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        alert('✅ Space deleted successfully!')
        router.push('/spaces')
      } else {
        alert('Failed to delete space')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete space')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  const colors = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#06b6d4'  // Cyan
  ]

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
              <h1 className="text-lg font-semibold text-slate-900">Space Settings</h1>
              <p className="text-sm text-slate-600">{space?.name}</p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">General Information</h2>

              <div className="space-y-6">
                <div>
                  <Label className="text-sm font-semibold text-slate-900">Space Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter space name"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-900">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What is this space for?"
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-slate-900 mb-3 block">
                    <Palette className="inline h-4 w-4 mr-1" />
                    Space Color
                  </Label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-12 w-12 rounded-lg border-2 transition-all hover:scale-110 ${
                          formData.color === color
                            ? 'border-slate-900 ring-2 ring-offset-2 ring-slate-900'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                <Shield className="inline h-5 w-5 mr-2 text-purple-600" />
                Security Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Require NDA</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Visitors must sign NDA before accessing documents
                    </p>
                  </div>
                  <Switch
                    checked={formData.requireNDA}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, requireNDA: checked })
                    }
                  />
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Dynamic Watermarks</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Add viewer email to all documents
                    </p>
                  </div>
                  <Switch
                    checked={formData.enableWatermark}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, enableWatermark: checked })
                    }
                  />
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">View Notifications</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Get notified when someone views documents
                    </p>
                  </div>
                  <Switch
                    checked={formData.notifyOnView}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, notifyOnView: checked })
                    }
                  />
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Auto-Expire Access</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Automatically revoke access after a date
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoExpiry}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, autoExpiry: checked })
                    }
                  />
                </div>

                {formData.autoExpiry && (
                  <div className="ml-4 space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => 
                        setFormData({ ...formData, expiryDate: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                <Lock className="inline h-5 w-5 mr-2 text-blue-600" />
                Access Permissions
              </h2>

              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Allow Downloads</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Members can download documents from this space
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowDownloads}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, allowDownloads: checked })
                    }
                  />
                </div>

                <div className="space-y-3 p-4 border rounded-lg">
                  <Label className="text-sm font-semibold text-slate-900">Privacy Level</Label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, privacy: 'private' })}
                      className={`w-full flex items-start gap-3 p-4 border rounded-lg transition-all ${
                        formData.privacy === 'private'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <Lock className="h-5 w-5 text-slate-700 mt-0.5" />
                      <div className="text-left">
                        <div className="font-medium text-slate-900">Private</div>
                        <div className="text-sm text-slate-600">
                          Only invited people can access
                        </div>
                      </div>
                      {formData.privacy === 'private' && (
                        <CheckCircle2 className="h-5 w-5 text-purple-600 ml-auto" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, privacy: 'link' })}
                      className={`w-full flex items-start gap-3 p-4 border rounded-lg transition-all ${
                        formData.privacy === 'link'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <Globe className="h-5 w-5 text-slate-700 mt-0.5" />
                      <div className="text-left">
                        <div className="font-medium text-slate-900">Link Access</div>
                        <div className="text-sm text-slate-600">
                          Anyone with the link can access
                        </div>
                      </div>
                      {formData.privacy === 'link' && (
                        <CheckCircle2 className="h-5 w-5 text-purple-600 ml-auto" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">
                <AlertCircle className="inline h-5 w-5 mr-2 text-red-600" />
                Danger Zone
              </h2>

              <div className="space-y-4">
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Archive className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-1">Archive Space</h3>
                      <p className="text-sm text-yellow-700">
                        Archive this space to hide it from active spaces. You can restore it later.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleArchive}
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Space
                  </Button>
                </div>

                <div className="border border-red-200 bg-red-50 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">Delete Space</h3>
                      <p className="text-sm text-red-700 mb-2">
                        Permanently delete this space and all its documents. This action cannot be undone.
                      </p>
                      <p className="text-xs text-red-600 font-medium">
                        ⚠️ All documents, folders, and settings will be permanently deleted
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Space Permanently
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}