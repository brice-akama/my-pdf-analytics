// components/ShareSpaceDrawer.tsx
// 
// REPLACES: The <Dialog open={showShareDialog}> block in spaces/[id]/page.tsx
// PLACEMENT: Import this component, then drop <ShareSpaceDrawer /> where the Dialog was
//
// FEATURES ADDED vs old dialog:
//   • Full-screen drawer (not modal dialog)
//   • Sonner toasts (no browser alert)
//   • Custom branding (logo upload, welcome message, accent color)
//   • User NDA upload (their own PDF, not system default)
//   • Watermark toggle with preview
//   • Download restriction toggle
//   • Allow Q&A toggle
//   • View limit + expiry (already existed, now in new UI)
//   • Link label (already existed, polished)
//   • Security level (already existed, polished)
//   • Copy link with toast feedback
//   • Multi-step flow: Configure → Preview → Done
//
// BRAND COLORS (from your tailwind.config.ts):
//   brand.primary.500  = #0ea5e9  (sky blue)
//   brand.secondary.500 = #a855f7 (purple)
//   Use these class names: bg-brand-primary-500, text-brand-secondary-500, etc.

"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  X, Globe, Lock, ShieldCheck, Key, Mail, Plus, Eye, EyeOff,
  Calendar, Download, Upload, Copy, CheckCircle2, AlertCircle,
  MessageSquare, Droplets, Image as ImageIcon, Palette,
  FileText, ChevronRight, ChevronLeft, Loader2, Link2,
  Settings2, Sparkles, Tag, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// ─── Types ────────────────────────────────────────────────────────────────────

type SecurityLevel = "open" | "password" | "whitelist"

type ShareConfig = {
  // Basic
  label:         string
  securityLevel: SecurityLevel
  password:      string
  allowedEmails: string[]
  allowedDomains: string[]
  expiresAt:     string
  viewLimit:     string

  // Access controls
  allowDownloads:    boolean
  allowQA:           boolean
  enableWatermark:   boolean

  // Custom NDA
  requireNDA:        boolean
  ndaFile:           File | null
  ndaFileName:       string

  // Branding
  brandingEnabled:   boolean
  welcomeMessage:    string
  accentColor:       string
  logoFile:          File | null
  logoPreview:       string
}

type Props = {
  open:      boolean
  onClose:   () => void
  spaceId:   string
  spaceName: string
  onSuccess?: (url: string) => void
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ["Configure", "Branding", "Review"] as const
type Step = 0 | 1 | 2

// ─── Color presets for branding ───────────────────────────────────────────────

const COLOR_PRESETS = [
  { name: "Sky",    hex: "#0ea5e9" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Slate",  hex: "#334155" },
  { name: "Emerald",hex: "#10b981" },
  { name: "Rose",   hex: "#f43f5e" },
  { name: "Amber",  hex: "#f59e0b" },
]

// ─── Main component ───────────────────────────────────────────────────────────

export function ShareSpaceDrawer({ open, onClose, spaceId, spaceName, onSuccess }: Props) {
  const [step, setStep]           = useState<Step>(0)
  const [sending, setSending]     = useState(false)
  const [shareUrl, setShareUrl]   = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailInput, setEmailInput]     = useState("")
  const [domainInput, setDomainInput]   = useState("")

  const ndaInputRef  = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [cfg, setCfg] = useState<ShareConfig>({
    label:           "",
    securityLevel:   "password",
    password:        "",
    allowedEmails:   [],
    allowedDomains:  [],
    expiresAt:       "",
    viewLimit:       "",
    allowDownloads:  true,
    allowQA:         true,
    enableWatermark: false,
    requireNDA:      false,
    ndaFile:         null,
    ndaFileName:     "",
    brandingEnabled: false,
    welcomeMessage:  "",
    accentColor:     "#0ea5e9",
    logoFile:        null,
    logoPreview:     "",
  })

  const set = useCallback(<K extends keyof ShareConfig>(k: K, v: ShareConfig[K]) => {
    setCfg(prev => ({ ...prev, [k]: v }))
  }, [])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e || cfg.allowedEmails.includes(e)) return
    set("allowedEmails", [...cfg.allowedEmails, e])
    setEmailInput("")
  }

  function addDomain() {
    const d = domainInput.trim().toLowerCase().replace(/^@/, "")
    if (!d || cfg.allowedDomains.includes(d)) return
    set("allowedDomains", [...cfg.allowedDomains, d])
    setDomainInput("")
  }

  function handleLogoFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => set("logoPreview", e.target?.result as string)
    reader.readAsDataURL(file)
    set("logoFile", file)
  }

  function handleNdaFile(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("NDA must be a PDF file")
      return
    }
    set("ndaFile", file)
    set("ndaFileName", file.name)
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  function validateStep0(): boolean {
    if ((cfg.securityLevel === "password" || cfg.securityLevel === "whitelist") && !cfg.password.trim()) {
      toast.error("Password is required for this security level")
      return false
    }
    if (cfg.securityLevel === "whitelist" && cfg.allowedEmails.length === 0 && cfg.allowedDomains.length === 0) {
      // auto-add any typed email
      if (emailInput.trim()) {
        set("allowedEmails", [...cfg.allowedEmails, emailInput.trim().toLowerCase()])
        setEmailInput("")
        return true
      }
      toast.error("Add at least one email or domain for whitelist security")
      return false
    }
    return true
  }

  // ── Generate link ─────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setSending(true)
    try {
      // 1. If custom NDA uploaded, upload it first
      let ndaDocumentUrl  = null
      let ndaDocumentName = null

      if (cfg.requireNDA && cfg.ndaFile) {
        const ndaForm = new FormData()
        ndaForm.append("file", cfg.ndaFile)
        ndaForm.append("isNDA", "true")
        const ndaRes  = await fetch(`/api/spaces/${spaceId}/upload`, {
          method: "POST", body: ndaForm, credentials: "include",
        })
        const ndaData = await ndaRes.json()
        if (!ndaData.success) throw new Error(ndaData.error || "NDA upload failed")
        ndaDocumentUrl  = ndaData.document.cloudinaryPdfUrl
        ndaDocumentName = ndaData.document.name
      }

      // 2. If logo uploaded, upload it
      let logoUrl = null
      if (cfg.brandingEnabled && cfg.logoFile) {
        const logoForm = new FormData()
        logoForm.append("file", cfg.logoFile)
        logoForm.append("type", "logo")
        const logoRes  = await fetch(`/api/spaces/${spaceId}/branding/logo`, {
          method: "POST", body: logoForm, credentials: "include",
        })
        const logoData = await logoRes.json()
        if (logoData.success) logoUrl = logoData.url
      }

      // 3. Create share link
      const res = await fetch(`/api/spaces/${spaceId}/public-access`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label:         cfg.label.trim() || null,
          securityLevel: cfg.securityLevel,
          password:      (cfg.securityLevel === "password" || cfg.securityLevel === "whitelist")
                           ? cfg.password : undefined,
          allowedEmails:  cfg.securityLevel === "whitelist" ? cfg.allowedEmails : [],
          allowedDomains: cfg.securityLevel === "whitelist" ? cfg.allowedDomains : [],
          expiresAt:      cfg.expiresAt || null,
          viewLimit:      cfg.viewLimit ? parseInt(cfg.viewLimit) : null,

          // Access controls
          allowDownloads:  cfg.allowDownloads,
          allowQA:         cfg.allowQA,
          enableWatermark: cfg.enableWatermark,

          // NDA
          requireNDA:      cfg.requireNDA,
          ndaDocumentUrl,
          ndaDocumentName,

          // Branding
          branding: cfg.brandingEnabled ? {
            enabled:        true,
            welcomeMessage: cfg.welcomeMessage || null,
            accentColor:    cfg.accentColor,
            logoUrl,
          } : null,
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to create link")

      setShareUrl(data.publicUrl)
      setStep(2)
      onSuccess?.(data.publicUrl)
      toast.success("Share link created!")
    } catch (err: any) {
      toast.error(err.message || "Failed to create share link")
    } finally {
      setSending(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to copy — please copy manually")
    }
  }

  function handleClose() {
    // Reset state
    setStep(0)
    setSending(false)
    setShareUrl("")
    setEmailInput("")
    setDomainInput("")
    setCfg({
      label: "", securityLevel: "password", password: "",
      allowedEmails: [], allowedDomains: [], expiresAt: "", viewLimit: "",
      allowDownloads: true, allowQA: true, enableWatermark: false,
      requireNDA: false, ndaFile: null, ndaFileName: "",
      brandingEnabled: false, welcomeMessage: "", accentColor: "#0ea5e9",
      logoFile: null, logoPreview: "",
    })
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Drawer — slides in from right */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-primary-500 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-white" />
              </div>
              Share Space
            </h2>
            <p className="text-sm text-slate-500 mt-0.5 ml-10">
              {spaceName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="h-9 w-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Step indicator ──────────────────────────────────────────────── */}
        {step < 2 && (
          <div className="flex items-center gap-0 px-7 py-4 border-b border-slate-100 bg-slate-50">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  i === step
                    ? "bg-brand-primary-500 text-white"
                    : i < step
                    ? "text-brand-primary-500"
                    : "text-slate-400"
                }`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === step ? "bg-white text-brand-primary-500" :
                    i < step ? "bg-brand-primary-100 text-brand-primary-600" :
                    "bg-slate-200 text-slate-400"
                  }`}>
                    {i < step ? "✓" : i + 1}
                  </span>
                  {label}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════
                STEP 0 — Configure access
                ════════════════════════════════════════════════════════ */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-7 space-y-7"
              >

                {/* Link label */}
                <div>
                  <Label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-brand-primary-500" />
                    Link Label
                    <span className="text-slate-400 font-normal text-xs">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Sequoia – Series A, Tiger Global, a16z…"
                    value={cfg.label}
                    onChange={e => set("label", e.target.value)}
                    className="border-slate-200 focus:border-brand-primary-400 focus:ring-brand-primary-100"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">
                    Name this link so you recognize it in analytics
                  </p>
                </div>

                {/* Security level */}
                <div>
                  <Label className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand-primary-500" />
                    Security Level
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: "open",      icon: Globe,       title: "Open",      sub: "Email only" },
                      { id: "password",  icon: Lock,        title: "Password",  sub: "Email + password" },
                      { id: "whitelist", icon: ShieldCheck, title: "Whitelist", sub: "Specific emails" },
                    ] as const).map(({ id, icon: Icon, title, sub }) => (
                      <button
                        key={id}
                        onClick={() => set("securityLevel", id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          cfg.securityLevel === id
                            ? "border-brand-primary-500 bg-brand-primary-50"
                            : "border-slate-200 hover:border-brand-primary-200 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-2 ${cfg.securityLevel === id ? "text-brand-primary-500" : "text-slate-400"}`} />
                        <div className={`text-sm font-semibold ${cfg.securityLevel === id ? "text-brand-primary-700" : "text-slate-800"}`}>
                          {title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password field */}
                {(cfg.securityLevel === "password" || cfg.securityLevel === "whitelist") && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <Label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Key className="h-4 w-4 text-brand-primary-500" />
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a secure password"
                        value={cfg.password}
                        onChange={e => set("password", e.target.value)}
                        className="pr-10 font-mono border-slate-200 focus:border-brand-primary-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Whitelist emails/domains */}
                {cfg.securityLevel === "whitelist" && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 p-4 bg-brand-primary-50 border border-brand-primary-100 rounded-xl"
                  >
                    {/* Emails */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-brand-primary-500" />
                        Allowed Emails
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="john@investor.com"
                          value={emailInput}
                          onChange={e => setEmailInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEmail() } }}
                          className="bg-white border-slate-200 focus:border-brand-primary-400"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addEmail}
                          className="border-brand-primary-200 text-brand-primary-600 hover:bg-brand-primary-50">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {cfg.allowedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {cfg.allowedEmails.map(e => (
                            <span key={e} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-primary-200 rounded-full text-xs text-brand-primary-700 font-medium">
                              {e}
                              <button onClick={() => set("allowedEmails", cfg.allowedEmails.filter(x => x !== e))}
                                className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Domains */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-800 mb-2 block">
                        Allowed Domains <span className="font-normal text-slate-400 text-xs">(optional)</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="sequoia.com"
                          value={domainInput}
                          onChange={e => setDomainInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDomain() } }}
                          className="bg-white border-slate-200 focus:border-brand-primary-400"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addDomain}
                          className="border-brand-primary-200 text-brand-primary-600 hover:bg-brand-primary-50">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {cfg.allowedDomains.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {cfg.allowedDomains.map(d => (
                            <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-brand-primary-200 rounded-full text-xs text-brand-primary-700 font-medium">
                              @{d}
                              <button onClick={() => set("allowedDomains", cfg.allowedDomains.filter(x => x !== d))}
                                className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Expiry + view limit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-brand-primary-500" />
                      Expiry Date
                      <span className="text-slate-400 font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={cfg.expiresAt}
                      onChange={e => set("expiresAt", e.target.value)}
                      className="border-slate-200 focus:border-brand-primary-400"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-brand-primary-500" />
                      View Limit
                      <span className="text-slate-400 font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      min="1"
                      value={cfg.viewLimit}
                      onChange={e => set("viewLimit", e.target.value)}
                      className="border-slate-200 focus:border-brand-primary-400"
                    />
                  </div>
                </div>

                {/* Access controls */}
                <div>
                  <Label className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-brand-primary-500" />
                    Access Controls
                  </Label>
                  <div className="space-y-3">
                    {([
                      {
                        key:   "allowDownloads" as const,
                        icon:  <Download className="h-4 w-4 text-brand-primary-500" />,
                        title: "Allow Downloads",
                        sub:   "Visitors can download documents",
                      },
                      {
                        key:   "allowQA" as const,
                        icon:  <MessageSquare className="h-4 w-4 text-brand-primary-500" />,
                        title: "Enable Q&A",
                        sub:   "Visitors can ask questions on documents",
                      },
                      {
                        key:   "enableWatermark" as const,
                        icon:  <Droplets className="h-4 w-4 text-brand-primary-500" />,
                        title: "Dynamic Watermark",
                        sub:   "Overlay visitor's email on every page",
                      },
                    ]).map(({ key, icon, title, sub }) => (
                      <div key={key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {icon}
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{title}</p>
                            <p className="text-xs text-slate-500">{sub}</p>
                          </div>
                        </div>
                        <Switch
                          checked={cfg[key] as boolean}
                          onCheckedChange={v => set(key, v)}
                          className="data-[state=checked]:bg-brand-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* NDA requirement */}
                <div>
                  <Label className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-brand-primary-500" />
                    Require NDA Signature
                  </Label>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Require NDA Before Access</p>
                      <p className="text-xs text-slate-500">Visitor must sign your NDA before viewing documents</p>
                    </div>
                    <Switch
                      checked={cfg.requireNDA}
                      onCheckedChange={v => set("requireNDA", v)}
                      className="data-[state=checked]:bg-brand-primary-500"
                    />
                  </div>

                  {cfg.requireNDA && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-4 bg-brand-primary-50 border border-brand-primary-100 rounded-xl"
                    >
                      <p className="text-xs font-semibold text-slate-700 mb-2">
                        Upload your NDA document (PDF)
                      </p>
                      {cfg.ndaFileName ? (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-brand-primary-200">
                          <FileText className="h-5 w-5 text-brand-primary-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-800 flex-1 truncate">{cfg.ndaFileName}</span>
                          <button
                            onClick={() => { set("ndaFile", null); set("ndaFileName", "") }}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => ndaInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-brand-primary-200 rounded-xl p-6 text-center hover:bg-white transition-colors"
                        >
                          <Upload className="h-8 w-8 text-brand-primary-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-brand-primary-600">Click to upload NDA PDF</p>
                          <p className="text-xs text-slate-400 mt-1">Your custom NDA document</p>
                        </button>
                      )}
                      <input
                        ref={ndaInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleNdaFile(f) }}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        💡 This is YOUR NDA — visitors will see and sign your document, not a system default
                      </p>
                    </motion.div>
                  )}
                </div>

              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 1 — Branding
                ════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-7 space-y-7"
              >
                {/* Enable branding toggle */}
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-brand-secondary-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Custom Branding</p>
                      <p className="text-xs text-slate-500">Add your logo, colors, and welcome message to the portal</p>
                    </div>
                  </div>
                  <Switch
                    checked={cfg.brandingEnabled}
                    onCheckedChange={v => set("brandingEnabled", v)}
                    className="data-[state=checked]:bg-brand-secondary-500"
                  />
                </div>

                {cfg.brandingEnabled && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Logo upload */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-brand-secondary-500" />
                        Company Logo
                      </Label>
                      {cfg.logoPreview ? (
                        <div className="relative inline-block">
                          <img
                            src={cfg.logoPreview}
                            alt="Logo preview"
                            className="h-20 max-w-[200px] object-contain rounded-xl border border-slate-200 p-2 bg-white"
                          />
                          <button
                            onClick={() => { set("logoFile", null); set("logoPreview", "") }}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-brand-secondary-200 rounded-xl p-8 text-center hover:bg-brand-secondary-50 transition-colors"
                        >
                          <ImageIcon className="h-10 w-10 text-brand-secondary-300 mx-auto mb-2" />
                          <p className="text-sm font-medium text-brand-secondary-600">Upload your logo</p>
                          <p className="text-xs text-slate-400 mt-1">PNG, SVG, or JPG recommended</p>
                        </button>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }}
                      />
                    </div>

                    {/* Accent color */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-brand-secondary-500" />
                        Accent Color
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 flex-wrap">
                          {COLOR_PRESETS.map(p => (
                            <button
                              key={p.hex}
                              onClick={() => set("accentColor", p.hex)}
                              className={`h-8 w-8 rounded-lg border-2 transition-all ${
                                cfg.accentColor === p.hex
                                  ? "border-slate-900 scale-110 shadow-md"
                                  : "border-transparent hover:scale-105"
                              }`}
                              style={{ backgroundColor: p.hex }}
                              title={p.name}
                            />
                          ))}
                        </div>
                        {/* Custom hex input */}
                        <div className="flex items-center gap-2 ml-auto">
                          <div
                            className="h-8 w-8 rounded-lg border border-slate-200 shadow-sm"
                            style={{ backgroundColor: cfg.accentColor }}
                          />
                          <Input
                            value={cfg.accentColor}
                            onChange={e => set("accentColor", e.target.value)}
                            className="w-28 font-mono text-sm border-slate-200"
                            placeholder="#0ea5e9"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Welcome message */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-brand-secondary-500" />
                        Welcome Message
                        <span className="text-slate-400 font-normal text-xs">(optional)</span>
                      </Label>
                      <Textarea
                        placeholder="Welcome to our data room. Please review the documents carefully..."
                        value={cfg.welcomeMessage}
                        onChange={e => set("welcomeMessage", e.target.value)}
                        rows={3}
                        className="border-slate-200 focus:border-brand-secondary-400 resize-none"
                      />
                      <p className="text-xs text-slate-400 mt-1.5">
                        Shown to visitors when they first open the portal
                      </p>
                    </div>

                    {/* Preview card */}
                    <div>
                      <Label className="text-sm font-semibold text-slate-800 mb-3 block">Portal Preview</Label>
                      <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        {/* Portal header preview */}
                        <div
                          className="p-5 text-white"
                          style={{ backgroundColor: cfg.accentColor }}
                        >
                          {cfg.logoPreview && (
                            <img src={cfg.logoPreview} alt="Logo" className="h-8 mb-3 object-contain" />
                          )}
                          <p className="font-bold text-lg">{spaceName}</p>
                          {cfg.welcomeMessage && (
                            <p className="text-sm opacity-90 mt-1">{cfg.welcomeMessage}</p>
                          )}
                        </div>
                        <div className="p-4 bg-slate-50 text-xs text-slate-500 text-center">
                          Visitor portal preview
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!cfg.brandingEnabled && (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
                    <Sparkles className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">Enable custom branding above to personalize the portal</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 2 — Done / Success
                ════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-7 space-y-6"
              >
                {/* Success banner */}
                <div className="flex items-start gap-4 p-5 bg-green-50 border border-green-200 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Share link created!</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      Copy and send this link to your investor or client
                    </p>
                  </div>
                </div>

                {/* Link copy */}
                <div>
                  <Label className="text-sm font-semibold text-slate-800 mb-2 block">Secure Share URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      onClick={e => (e.target as HTMLInputElement).select()}
                      className="flex-1 font-mono text-sm bg-slate-50 border-slate-200 cursor-text"
                    />
                    <Button
                      onClick={copyLink}
                      className="bg-brand-primary-500 hover:bg-brand-primary-600 text-white gap-2 flex-shrink-0"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <p className="text-sm font-bold text-slate-800 mb-3">Link Summary</p>
                  {[
                    { icon: <ShieldCheck className="h-4 w-4" />, label: "Security",  value: cfg.securityLevel },
                    { icon: <Download className="h-4 w-4" />,    label: "Downloads", value: cfg.allowDownloads ? "Allowed" : "Blocked" },
                    { icon: <Droplets className="h-4 w-4" />,    label: "Watermark", value: cfg.enableWatermark ? "Enabled" : "Off" },
                    { icon: <MessageSquare className="h-4 w-4" />, label: "Q&A",     value: cfg.allowQA ? "Enabled" : "Off" },
                    ...(cfg.requireNDA ? [{ icon: <FileText className="h-4 w-4" />, label: "NDA",  value: cfg.ndaFileName || "Required" }] : []),
                    ...(cfg.expiresAt  ? [{ icon: <Clock className="h-4 w-4" />,    label: "Expires", value: new Date(cfg.expiresAt).toLocaleDateString() }] : []),
                    ...(cfg.viewLimit  ? [{ icon: <Eye className="h-4 w-4" />,       label: "View limit", value: cfg.viewLimit }] : []),
                    ...(cfg.brandingEnabled ? [{ icon: <Sparkles className="h-4 w-4" />, label: "Branding", value: "Custom" }] : []),
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <span className="text-brand-primary-500">{icon}</span>
                      <span className="text-slate-500 w-24">{label}</span>
                      <span className="font-semibold text-slate-800 capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Create another */}
                <button
                  onClick={() => { setStep(0); setShareUrl("") }}
                  className="text-sm text-brand-primary-600 hover:text-brand-primary-700 font-medium flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Create another share link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer actions ───────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 px-7 py-5 flex items-center justify-between bg-white">
          {step === 0 && (
            <>
              <Button variant="outline" onClick={handleClose} className="text-slate-600">
                Cancel
              </Button>
              <Button
                onClick={() => { if (validateStep0()) setStep(1) }}
                className="bg-brand-primary-500 hover:bg-brand-primary-600 text-white gap-2"
              >
                Next: Branding
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => setStep(0)} className="gap-2 text-slate-600">
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={sending}
                className="bg-brand-primary-500 hover:bg-brand-primary-600 text-white gap-2 min-w-[160px]"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                ) : (
                  <><Link2 className="h-4 w-4" /> Generate Link</>
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div />
              <Button onClick={handleClose} className="bg-slate-900 hover:bg-slate-800 text-white">
                Done
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}