"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Users,
  Plus,
  Mail,
  Trash2,
  MoreVertical,
  Copy,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"

type Contact = {
  id: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  invitationStatus?: 'pending' | 'accepted'
  invitationLink?: string
  addedAt: string
}

export function MembersTab({
  spaceId,
  contacts,
  userEmail,
  canManageContacts,
  fetchContacts,
}: {
  spaceId: string
  contacts: Contact[]
  userEmail: string | undefined
  canManageContacts: boolean
  fetchContacts: () => void
}) {
  const [showAddContactDialog, setShowAddContactDialog] = useState(false)
  const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false)
  const [showInviteLinkDialog, setShowInviteLinkDialog] = useState(false)
  const [invitationLink, setInvitationLink] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactRole, setContactRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [addingContact, setAddingContact] = useState(false)
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkRole, setBulkRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [bulkInviting, setBulkInviting] = useState(false)
  const [bulkInviteResults, setBulkInviteResults] = useState<{
    success: string[]
    failed: { email: string; reason: string }[]
  } | null>(null)

  const handleAddContact = async () => {
    if (!contactEmail.trim()) return
    setAddingContact(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contactEmail.trim(), role: contactRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add contact')
      if (data.success) {
        await fetchContacts()
        setContactEmail('')
        setContactRole('viewer')
        setShowAddContactDialog(false)
        setInvitationLink(data.invitationLink)
        setShowInviteLinkDialog(true)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add contact')
    } finally {
      setAddingContact(false)
    }
  }

  const handleBulkInvite = async () => {
    const emailList = bulkEmails
      .split(/[,\n]/)
      .map(e => e.trim())
      .filter(e => e.length > 0)

    if (emailList.length < 2) {
      toast.error('Please enter at least 2 email addresses')
      return
    }

    setBulkInviting(true)
    setBulkInviteResults(null)

    try {
      const res = await fetch(`/api/spaces/${spaceId}/contacts/bulk`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailList, role: bulkRole })
      })
      const data = await res.json()
      if (data.success) {
        setBulkInviteResults({
          success: data.results.success,
          failed: data.results.failed
        })
        await fetchContacts()
        if (data.results.failed.length === 0) {
          setBulkEmails('')
          setTimeout(() => {
            setShowBulkInviteDialog(false)
            setBulkInviteResults(null)
          }, 3000)
        }
      } else {
        toast.error(data.error || 'Bulk invite failed')
      }
    } catch (error) {
      toast.error('Failed to send invitations')
    } finally {
      setBulkInviting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Members</h2>
          <p className="text-sm text-slate-500 mt-1">{contacts.length} people have access</p>
        </div>
        {canManageContacts && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBulkInviteDialog(true)}
              className="gap-2 text-xs flex-1 sm:flex-none justify-center"
            >
              <Users className="h-3.5 w-3.5" />
              Bulk Invite
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddContactDialog(true)}
              className="gap-2 text-xs bg-slate-900 hover:bg-slate-800 text-white flex-1 sm:flex-none justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Member
            </Button>
          </div>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="border rounded-xl bg-white p-12 text-center">
          <Users className="h-6 w-6 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">No members yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Invite people to collaborate in this space</p>
          {canManageContacts && (
            <Button
              size="sm"
              onClick={() => setShowAddContactDialog(true)}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Member
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-xl bg-white overflow-hidden">

          {/* Owner row */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-slate-50">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{userEmail}</p>
              <p className="text-xs text-slate-400">Space owner</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-900 text-white flex-shrink-0">
              Owner
            </span>
          </div>

          {/* Members list */}
          <div className="divide-y divide-slate-100">
            {contacts.map((contact) => (
              <div key={contact.email} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{contact.email}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400 capitalize">{contact.role}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400">
                      Added {new Date(contact.addedAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                    {contact.invitationStatus === 'pending' && (
                      <>
                        <span className="text-slate-200">·</span>
                        <span className="text-xs text-orange-500 font-medium">⏳ Pending</span>
                      </>
                    )}
                  </div>

                  {/* Invite link — always visible */}
                  {contact.invitationLink && (
                    <div className={`flex items-center gap-2 mt-1.5 px-2 py-1 rounded border ${
                      contact.invitationStatus === 'pending'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[9px] font-medium flex-shrink-0 text-slate-400">
                        {contact.invitationStatus === 'pending' ? '⏳ INVITE' : '🔗 SPACE'}
                      </span>
                      <input
                        readOnly
                        value={contact.invitationLink}
                        className="flex-1 px-1 text-[10px] font-mono bg-transparent text-slate-500 outline-none min-w-0"
                        onClick={e => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contact.invitationLink!)
                          toast.success('Link copied!')
                        }}
                        className="flex-shrink-0 p-1 rounded hover:bg-white transition-colors"
                        title="Copy link"
                      >
                        <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>

                {canManageContacts && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white">
                      {contact.invitationStatus === 'pending' && (
                        <>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/spaces/${spaceId}/contacts`, {
                                  method: 'POST',
                                  credentials: 'include',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: contact.email, role: contact.role, resend: true })
                                })
                                const data = await res.json()
                                if (data.success) toast.success('Invitation resent')
                                else toast.error(data.error || 'Failed to resend')
                              } catch { toast.error('Failed to resend') }
                            }}
                          >
                            <Mail className="mr-2 h-3.5 w-3.5" />
                            Resend Invite
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={async () => {
                          if (!window.confirm(`Remove ${contact.email}?`)) return
                          try {
                            const res = await fetch(`/api/spaces/${spaceId}/members/${contact.email}`, {
                              method: 'DELETE', credentials: 'include'
                            })
                            const data = await res.json()
                            if (data.success) { toast.success('Member removed'); fetchContacts() }
                            else toast.error(data.error || 'Failed to remove')
                          } catch { toast.error('Failed to remove member') }
                        }}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="px-4 py-3 border-t bg-slate-50">
            <p className="text-xs text-slate-400">{contacts.length + 1} total member{contacts.length + 1 !== 1 ? 's' : ''} including owner</p>
          </div>
        </div>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add Contact
            </DialogTitle>
            <DialogDescription>Invite one person or multiple at once</DialogDescription>
          </DialogHeader>

          <div className="flex items-center bg-slate-100 rounded-lg p-1 w-fit gap-1 mt-2">
            <button
              onClick={() => setBulkMode(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!bulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Single
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${bulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bulk
            </button>
          </div>

          <div className="space-y-4 py-2">
            {!bulkMode ? (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email address</label>
                  <Input type="email" placeholder="contact@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
                  <select value={contactRole} onChange={(e) => setContactRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="viewer">Viewer — can view documents</option>
                    <option value="editor">Editor — can upload and edit</option>
                    <option value="admin">Admin — full access</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email addresses</label>
                  <Textarea
                    placeholder={"john@company.com\njane@company.com\nmike@company.com"}
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">Separate with commas or new lines</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Role for all</label>
                  <select value={bulkRole} onChange={(e) => setBulkRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                    <option value="viewer">Viewer — can view documents</option>
                    <option value="editor">Editor — can upload and edit</option>
                    <option value="admin">Admin — full access</option>
                  </select>
                </div>
              </>
            )}

            {bulkInviteResults && (
              <div className="space-y-2">
                {bulkInviteResults.success.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    ✅ {bulkInviteResults.success.length} invited: {bulkInviteResults.success.join(', ')}
                  </div>
                )}
                {bulkInviteResults.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    ❌ {bulkInviteResults.failed.map(f => `${f.email} (${f.reason})`).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => {
              setShowAddContactDialog(false)
              setContactEmail('')
              setBulkEmails('')
              setBulkInviteResults(null)
            }}>
              Cancel
            </Button>
            <Button
              onClick={bulkMode ? handleBulkInvite : handleAddContact}
              disabled={bulkMode ? (bulkInviting || !bulkEmails.trim()) : (!contactEmail.trim() || addingContact)}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              {(bulkMode ? bulkInviting : addingContact) ? 'Sending...' : bulkMode ? 'Send Invitations' : 'Add Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Invite Dialog */}
      <Dialog open={showBulkInviteDialog} onOpenChange={setShowBulkInviteDialog}>
        <DialogContent className="max-w-2xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Bulk Invite Contacts
            </DialogTitle>
            <DialogDescription>
              Invite multiple people at once (comma or newline separated)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email Addresses (2 or more)</label>
              <Textarea
                placeholder="john@company.com, jane@company.com&#10;mike@company.com"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">Separate emails with commas or new lines. Minimum 2 emails.</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Role for All Invitees</label>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value as 'viewer' | 'editor' | 'admin')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="viewer">Viewer - Can view documents</option>
                <option value="editor">Editor - Can upload and edit</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>

            {bulkInviteResults && (
              <div className="space-y-3">
                {bulkInviteResults.success.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-900 mb-2">✅ Successfully invited ({bulkInviteResults.success.length})</p>
                    <div className="space-y-1">
                      {bulkInviteResults.success.map((email) => (
                        <div key={email} className="text-sm text-green-700">• {email}</div>
                      ))}
                    </div>
                  </div>
                )}
                {bulkInviteResults.failed.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-2">❌ Failed ({bulkInviteResults.failed.length})</p>
                    <div className="space-y-1">
                      {bulkInviteResults.failed.map((item) => (
                        <div key={item.email} className="text-sm text-red-700">• {item.email}: {item.reason}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>📧 What happens next:</strong>
                <br />• Each person receives an invitation email
                <br />• They can accept and join the space
                <br />• All invites have the same role initially
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkInviteDialog(false)
                setBulkEmails('')
                setBulkInviteResults(null)
              }}
              disabled={bulkInviting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkInvite}
              disabled={bulkInviting || bulkEmails.trim().length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {bulkInviting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" />Send Invitations</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invitation Success Modal */}
      <Dialog open={showInviteLinkDialog} onOpenChange={setShowInviteLinkDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">Member Added!</DialogTitle>
                <DialogDescription className="text-sm mt-0.5">
                  An invitation email has been sent. Share the link below as a backup.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
              <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Invite email sent to <span className="font-semibold">{contactEmail || 'recipient'}</span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Backup Invite Link</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={invitationLink}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700 outline-none select-all"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  className="flex-shrink-0 gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(invitationLink)
                    toast.success('Link copied!')
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-slate-400">Expires in 7 days · Send this if the email doesn't arrive</p>
            </div>

            <div className="flex justify-end pt-1 border-t">
              <Button
                onClick={() => setShowInviteLinkDialog(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}