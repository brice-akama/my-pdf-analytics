"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  X,
  Upload,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type UserType = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  profile_image: string | null
  plan?: string
}

interface NotificationPreferences {
  emailNotifications: boolean
  documentReminders: boolean
  marketingEmails: boolean
}

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  user: UserType | null
  uploadingAvatar: boolean
  notificationPreferences: NotificationPreferences
  showCurrentPassword: boolean
  showNewPassword: boolean
  showConfirmPassword: boolean
  onToggleCurrentPw: () => void
  onToggleNewPw: () => void
  onToggleConfirmPw: () => void
  onAvatarUpload: (file: File) => void
  onRemoveAvatar: () => void
  onSaveProfile: () => void
  onPasswordChange: () => void
  onUpdatePreferences: (prefs: NotificationPreferences) => void
  onSetPreferences: (prefs: NotificationPreferences) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (email: string) => email.charAt(0).toUpperCase()

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsDrawer({
  open,
  onClose,
  user,
  uploadingAvatar,
  notificationPreferences,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  onToggleCurrentPw,
  onToggleNewPw,
  onToggleConfirmPw,
  onAvatarUpload,
  onRemoveAvatar,
  onSaveProfile,
  onPasswordChange,
  onUpdatePreferences,
  onSetPreferences,
}: SettingsDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[600px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Hidden file input */}
            <input
              id="settings-avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onAvatarUpload(file)
              }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b bg-gradient-to-r from-purple-50 to-blue-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Manage your account settings and preferences
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/80 transition-colors flex items-center justify-center"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="profile" className="w-full">
                {/* Tab list */}
                <div className="sticky top-0 bg-white border-b px-6 pt-4 z-10">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>
                </div>

                <div className="px-6 py-6">

                  {/* ── Profile tab ── */}
                  <TabsContent value="profile" className="space-y-6 mt-0">

                    {/* Avatar section */}
                    <div className="space-y-4 pb-6 border-b">
                      <Label className="text-base font-semibold">Profile Picture</Label>
                      <div className="flex items-center gap-6">
                        {/* Large preview */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`h-28 w-28 rounded-full bg-gradient-to-br ${getAvatarColor(user?.email ?? "")} flex items-center justify-center text-white font-bold text-4xl shadow-lg overflow-hidden ring-4 ring-white`}
                          >
                            {user?.profile_image ? (
                              <Image
                                src={user.profile_image}
                                alt="Profile"
                                width={112}
                                height={112}
                                className="rounded-full object-cover w-full h-full"
                              />
                            ) : (
                              getInitials(user?.email ?? "")
                            )}
                          </div>
                          <div className="absolute bottom-2 right-2 h-7 w-7 bg-green-500 rounded-full border-4 border-white" />
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 flex-1 min-w-0">
                          <div>
                            <p className="text-base font-semibold text-slate-900 mb-1">
                              {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-sm text-slate-500 mb-3 break-all">{user?.email}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                document.getElementById("settings-avatar-upload")?.click()
                              }
                              disabled={uploadingAvatar}
                              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                              <Upload className="h-4 w-4" />
                              Upload Photo
                            </Button>
                            {user?.profile_image && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onRemoveAvatar}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Recommended: Square image, at least 400×400 px
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Profile fields */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          id="profile-full-name"
                          defaultValue={
                            user?.first_name && user?.last_name
                              ? `${user.first_name} ${user.last_name}`.trim()
                              : ""
                          }
                          className="h-11"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          defaultValue={user?.email}
                          type="email"
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input
                          id="profile-company-name"
                          defaultValue={user?.company_name ?? ""}
                          className="h-11"
                          placeholder="Acme Inc."
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Notifications tab ── */}
                  <TabsContent value="notifications" className="space-y-4 mt-0">
                    {[
                      {
                        key: "emailNotifications" as const,
                        title: "Email Notifications",
                        desc: "Receive email when someone views your document",
                      },
                      {
                        key: "documentReminders" as const,
                        title: "Document Reminders",
                        desc: "Get reminders about pending signatures",
                      },
                      {
                        key: "marketingEmails" as const,
                        title: "Marketing Emails",
                        desc: "Receive updates about new features",
                      },
                    ].map(({ key, title, desc }) => (
                      <div key={key} className="flex items-center justify-between py-4 border-b last:border-0">
                        <div>
                          <p className="font-medium text-slate-900">{title}</p>
                          <p className="text-sm text-slate-500 mt-1">{desc}</p>
                        </div>
                        <Switch
                          checked={notificationPreferences[key]}
                          onCheckedChange={(checked) => {
                            const next = { ...notificationPreferences, [key]: checked }
                            onSetPreferences(next)
                            onUpdatePreferences(next)
                          }}
                        />
                      </div>
                    ))}
                  </TabsContent>

                  {/* ── Security tab ── */}
                  <TabsContent value="security" className="space-y-4 mt-0">
                    {[
                      {
                        id: "current-password",
                        label: "Current Password",
                        show: showCurrentPassword,
                        onToggle: onToggleCurrentPw,
                      },
                      {
                        id: "new-password",
                        label: "New Password",
                        show: showNewPassword,
                        onToggle: onToggleNewPw,
                      },
                      {
                        id: "confirm-password",
                        label: "Confirm New Password",
                        show: showConfirmPassword,
                        onToggle: onToggleConfirmPw,
                      },
                    ].map(({ id, label, show, onToggle }) => (
                      <div key={id} className="space-y-2">
                        <Label>{label}</Label>
                        <div className="relative">
                          <Input
                            id={id}
                            type={show ? "text" : "password"}
                            placeholder={`Enter ${label.toLowerCase()}`}
                            className="h-11 pr-10"
                          />
                          <button
                            type="button"
                            onClick={onToggle}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={onPasswordChange}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      Update Password
                    </Button>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-white sticky bottom-0">
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={onClose} className="h-11">
                  Cancel
                </Button>
                <Button
                  onClick={onSaveProfile}
                  className="h-11 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}