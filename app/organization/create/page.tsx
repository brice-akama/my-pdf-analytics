// app/organization/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Building2,
  Folder,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

export default function CreateOrganizationPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    allowMemberSpaces: true,
    requireApproval: false,
    defaultSpacePrivacy: 'private' as 'private' | 'link'
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Organization name is required')
      return
    }

    if (!formData.slug.trim()) {
      setError('Organization slug is required')
      return
    }

    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok && data.success) {
        router.push(`/organization/${data.organization.id}/dashboard`)
      } else {
        setError(data.error || 'Failed to create organization')
      }
    } catch (err) {
      console.error('Create error:', err)
      setError('Failed to create organization. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/spaces')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Create Organization</h1>
              <p className="text-sm text-slate-600">Set up your team workspace</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit}>
          {/* Main Card */}
          <div className="bg-white rounded-2xl border shadow-lg overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 text-white">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Create Your Organization</h2>
              <p className="text-purple-100">
                Bring your team together in one workspace
              </p>
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Organization Name */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900">
                  Organization Name *
                </Label>
                <Input
                  type="text"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="text-lg h-12"
                  disabled={creating}
                  autoFocus
                />
                <p className="text-sm text-slate-500">
                  This is your company or team name
                </p>
              </div>

              {/* URL Slug */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900">
                  URL Slug *
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm px-3 py-2 bg-slate-100 rounded-lg border">
                    yourapp.com/org/
                  </span>
                  <Input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 h-12"
                    disabled={creating}
                  />
                </div>
                <p className="text-sm text-slate-500">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>

              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Organization Settings
                </h3>

                {/* Settings Options */}
                <div className="space-y-4">
                  {/* Allow Member Spaces */}
                  <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Folder className="h-5 w-5 text-purple-600" />
                        <p className="font-semibold text-slate-900">Allow Member Spaces</p>
                      </div>
                      <p className="text-sm text-slate-600">
                        Team members can create their own spaces without admin approval
                      </p>
                    </div>
                    <Switch
                      checked={formData.allowMemberSpaces}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, allowMemberSpaces: checked })
                      }
                      disabled={creating}
                    />
                  </div>

                  {/* Require Approval */}
                  <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-blue-600" />
                        <p className="font-semibold text-slate-900">Require Approval</p>
                      </div>
                      <p className="text-sm text-slate-600">
                        New spaces need admin approval before they're created
                      </p>
                    </div>
                    <Switch
                      checked={formData.requireApproval}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, requireApproval: checked })
                      }
                      disabled={creating}
                    />
                  </div>

                  {/* Default Privacy */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Lock className="h-5 w-5 text-green-600" />
                      <p className="font-semibold text-slate-900">Default Space Privacy</p>
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, defaultSpacePrivacy: 'private' })}
                        disabled={creating}
                        className={`w-full flex items-start gap-3 p-4 border rounded-lg transition-all ${
                          formData.defaultSpacePrivacy === 'private'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <Lock className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium text-slate-900">Private</div>
                          <div className="text-sm text-slate-600">
                            Only invited people can access spaces
                          </div>
                        </div>
                        {formData.defaultSpacePrivacy === 'private' && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600 ml-auto flex-shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, defaultSpacePrivacy: 'link' })}
                        disabled={creating}
                        className={`w-full flex items-start gap-3 p-4 border rounded-lg transition-all ${
                          formData.defaultSpacePrivacy === 'link'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <Users className="h-5 w-5 text-slate-700 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <div className="font-medium text-slate-900">Link Access</div>
                          <div className="text-sm text-slate-600">
                            Anyone with the link can access spaces
                          </div>
                        </div>
                        {formData.defaultSpacePrivacy === 'link' && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600 ml-auto flex-shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• You'll be the organization owner with full control</li>
                      <li>• You can invite team members and manage permissions</li>
                      <li>• Start creating spaces for your projects and deals</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 border-t px-8 py-6 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/spaces')}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.name.trim() || !formData.slug.trim() || creating}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}