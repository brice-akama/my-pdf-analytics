"use client"

import { Button } from "@/components/ui/button"
import { Drawer } from "@/components/ui/drawer"
import { Loader2, Users, Download, X } from "lucide-react"

const getAvatarColor = (email: string) => {
  const colors = [
    "from-purple-500 to-purple-600",
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
  ]
  return colors[email.charCodeAt(0) % colors.length]
}

type Props = {
  open: boolean
  onClose: () => void
  contacts: any[]
  loading: boolean
  portalId?: string
  onSyncContacts: () => void
}

export default function HubSpotContactsDrawer({
  open,
  onClose,
  contacts,
  loading,
  portalId,
  onSyncContacts,
}: Props) {
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.873h-.067a2.199 2.199 0 00-1.978 1.267 2.198 2.198 0 00.07 1.8l-3.47 3.47a4.238 4.238 0 00-1.344-.246 4.33 4.33 0 00-3.751 2.184L3.072 6.694a2.192 2.192 0 10-.795.796l3.646 3.626a4.284 4.284 0 002.023 6.763 4.314 4.314 0 003.515-.81l3.466 3.466a2.198 2.198 0 101.566-.618l-3.467-3.467a4.314 4.314 0 00.81-3.515 4.285 4.285 0 00-2.128-3.065 2.198 2.198 0 012.129-3.82l.039.04 3.435-3.435A2.199 2.199 0 0018.164 7.93z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  HubSpot Contacts
                </h2>
                <p className="text-sm text-slate-600">
                  {portalId ? `Portal: ${portalId}` : "Your CRM contacts"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-orange-600 mb-4" />
              <p className="text-sm text-slate-600 font-medium">
                Loading contacts...
              </p>
            </div>
          ) : contacts.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">
                Found {contacts.length} contact(s) in HubSpot
              </p>
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-orange-400 hover:bg-orange-50/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                        contact.email || "a"
                      )} flex items-center justify-center text-white font-semibold`}
                    >
                      {contact.firstName?.charAt(0)?.toUpperCase() ||
                        contact.email?.charAt(0)?.toUpperCase() ||
                        "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      <p className="text-sm text-slate-600 truncate">
                        {contact.email}
                      </p>
                      {contact.company && (
                        <p className="text-xs text-slate-500">
                          {contact.company}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No contacts found in HubSpot</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={onSyncContacts}
              disabled={contacts.length === 0}
              className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Sync {contacts.length} Contacts
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}