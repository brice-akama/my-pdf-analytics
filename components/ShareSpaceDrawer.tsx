"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  X, Globe, Lock, ShieldCheck, Key, Mail, Plus, Eye, EyeOff,
  Calendar, Download, Upload, Copy, CheckCircle2, AlertCircle,
  MessageSquare, Droplets, Image as ImageIcon, Palette, FileText,
  ChevronRight, ChevronLeft, Loader2, Link2, Settings2, Sparkles,
  Tag, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

// ─── Types ────────────────────────────────────────────────────────────────────
type SecurityLevel = "open" | "password" | "whitelist"

type ShareConfig = {
  label: string
  securityLevel: SecurityLevel
  password: string
  allowedEmails: string[]
  allowedDomains: string[]
  expiresAt: string
  viewLimit: string
  allowDownloads: boolean
  allowQA: boolean
  enableWatermark: boolean
  requireNDA: boolean
  requireOtp: boolean
  ndaFile: File | null
  ndaFileName: string
   companyName: string
  brandingEnabled: boolean
  welcomeMessage: string
  accentColor: string
  logoFile: File | null
  logoPreview: string
}

type Props = {
  open: boolean
  onClose: () => void
  spaceId: string
  spaceName: string
  onSuccess?: (url: string) => void
}

const STEPS = ["Configure", "Review"] as const
type Step = 0 | 1

// ─── Color presets — each has a real Tailwind bg class + hex ─────────────────
const COLOR_PRESETS = [
  { name: "Sky",     hex: "#0ea5e9", tw: "bg-sky-500"      },
  { name: "Purple",  hex: "#a855f7", tw: "bg-purple-500"   },
  { name: "Slate",   hex: "#334155", tw: "bg-slate-700"    },
  { name: "Emerald", hex: "#10b981", tw: "bg-emerald-500"  },
  { name: "Rose",    hex: "#f43f5e", tw: "bg-rose-500"     },
  { name: "Amber",   hex: "#f59e0b", tw: "bg-amber-500"    },
  { name: "Indigo",  hex: "#6366f1", tw: "bg-indigo-500"   },
  { name: "Teal",    hex: "#14b8a6", tw: "bg-teal-500"     },
]

export function ShareSpaceDrawer({ open, onClose, spaceId, spaceName, onSuccess }: Props) {
  const [step, setStep] = useState<0 | 1>(0)
  const [sending, setSending] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [domainInput, setDomainInput] = useState("")
  const ndaInputRef  = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [existingNDAs, setExistingNDAs] = useState<{ _id: string; filename: string }[]>([])
const [ndaLoading, setNdaLoading] = useState(false)

  const [cfg, setCfg] = useState<ShareConfig>({
    label: "", securityLevel: "password", password: "",
    allowedEmails: [], allowedDomains: [],
    expiresAt: "", viewLimit: "",
    allowDownloads: true, allowQA: true, enableWatermark: false,
    requireNDA: false, ndaFile: null, ndaFileName: "",
    brandingEnabled: false, welcomeMessage: "",
    accentColor: "#0ea5e9", logoFile: null, logoPreview: "",
    companyName: "",
    requireOtp: false,
  })

  const set = useCallback(<K extends keyof ShareConfig>(k: K, v: ShareConfig[K]) => {
    setCfg(prev => ({ ...prev, [k]: v }))
  }, [])

  async function fetchExistingNDAs() {
  setNdaLoading(true)
  try {
    const res = await fetch("/api/agreements/upload", { credentials: "include" })
    const data = await res.json()
    if (data.success) setExistingNDAs(data.agreements)
  } catch {
    toast.error("Failed to load existing NDAs")
  } finally {
    setNdaLoading(false)
  }
}

  // ── Helpers ────────────────────────────────────────────────────────────────
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
    if (file.type !== "application/pdf") { toast.error("NDA must be a PDF"); return }
    set("ndaFile", file)
    set("ndaFileName", file.name)
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateStep0(): boolean {
    if ((cfg.securityLevel === "password" || cfg.securityLevel === "whitelist") && !cfg.password.trim()) {
      toast.error("Password is required for this security level"); return false
    }
    if (cfg.securityLevel === "whitelist" && cfg.allowedEmails.length === 0 && cfg.allowedDomains.length === 0) {
      if (emailInput.trim()) {
        set("allowedEmails", [...cfg.allowedEmails, emailInput.trim().toLowerCase()])
        setEmailInput(""); return true
      }
      toast.error("Add at least one email or domain for whitelist security"); return false
    }
    return true
  }

  // ── Generate link ───────────────────────────────────────────────────────────
  async function handleGenerate() {
    setSending(true)
    try {
      let ndaDocumentUrl = null, ndaDocumentName = null
      if (cfg.requireNDA && cfg.ndaFile) {
        
const ndaForm = new FormData()
ndaForm.append("file", cfg.ndaFile)
const ndaRes = await fetch(`/api/agreements/upload`, { 
  method: "POST", body: ndaForm, credentials: "include" 
})
const ndaData = await ndaRes.json()
if (!ndaData.success) throw new Error(ndaData.error || "NDA upload failed")
ndaDocumentUrl  = ndaData.document.cloudinaryPdfUrl
ndaDocumentName = ndaData.document.filename
      }

      let logoUrl = null
      if (cfg.brandingEnabled && cfg.logoFile) {
        const lf = new FormData()
        lf.append("file", cfg.logoFile)
        lf.append("type", "logo")
        const lr = await fetch(`/api/spaces/${spaceId}/branding/logo`, { method: "POST", body: lf, credentials: "include" })
        const ld = await lr.json()
        if (ld.success) logoUrl = ld.url
      }

      const res  = await fetch(`/api/spaces/${spaceId}/public-access`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: cfg.label.trim() || null,
          securityLevel: cfg.securityLevel,
          password: (cfg.securityLevel === "password" || cfg.securityLevel === "whitelist") ? cfg.password : undefined,
          allowedEmails:  cfg.securityLevel === "whitelist" ? cfg.allowedEmails  : [],
          allowedDomains: cfg.securityLevel === "whitelist" ? cfg.allowedDomains : [],
          expiresAt:  cfg.expiresAt  || null,
          viewLimit:  cfg.viewLimit  ? parseInt(cfg.viewLimit) : null,
          allowDownloads:  cfg.allowDownloads,
          allowQA:         cfg.allowQA,
          enableWatermark: cfg.enableWatermark,
          requireOtp: cfg.requireOtp,
          requireNDA: cfg.requireNDA, ndaDocumentUrl, ndaDocumentName,
          branding: cfg.brandingEnabled ? {
            enabled: true,
            welcomeMessage: cfg.welcomeMessage || null,
            accentColor: cfg.accentColor,
            logoUrl,
            companyName: cfg.companyName || null,
          } : null,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to create link")
      setShareUrl(data.publicUrl)
      setStep(1)
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
    setStep(0); setSending(false); setShareUrl(""); setEmailInput(""); setDomainInput("")
    setCfg({
      label: "", securityLevel: "password", password: "",
      allowedEmails: [], allowedDomains: [],
      expiresAt: "", viewLimit: "",
      allowDownloads: true, allowQA: true, enableWatermark: false,
      requireNDA: false, ndaFile: null, ndaFileName: "",
      brandingEnabled: false, welcomeMessage: "",
      accentColor: "#0ea5e9", logoFile: null, logoPreview: "",
      companyName: "",
      requireOtp: false,
    })
    setExistingNDAs([])
    setNdaLoading(false)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* ── Drawer — wide enough to show everything at once ──────────────── */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl"
        /* 640px on desktop, full width on mobile */
        style={{ width: "min(640px, 100vw)" }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Sky-blue icon using real Tailwind class */}
            <div className="h-9 w-9 rounded-xl bg-sky-500 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">Share Space</p>
              <p className="text-xs text-slate-400 leading-tight">{spaceName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* ── Step indicator ─────────────────────────────────────────────────── */}
        {step < 1 && (
          <div className="px-7 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    i === step
                      ? "bg-sky-500 text-white"
                      : i < step
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === step ? "bg-white/20" : i < step ? "bg-emerald-200" : "bg-slate-200"
                    }`}>
                      {i < step ? "✓" : i + 1}
                    </span>
                    {label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px w-6 ${i < step ? "bg-emerald-300" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Scrollable Body ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════ STEP 0 — Configure ═══ */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-7 space-y-6"
              >
                {/* Link label */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-sky-500" />
                    Link Label <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Investor Pack — Series A"
                    value={cfg.label}
                    onChange={e => set("label", e.target.value)}
                    className="border-slate-200 focus:border-sky-400 focus:ring-sky-100"
                  />
                  <p className="text-xs text-slate-400">Name this link to recognize it in analytics</p>
                </div>

                {/* Security level — show ALL three cards side by side */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
                    Security Level
                  </Label>
                  {/* 3-column grid so user sees all options at once */}
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: "open",      icon: Globe,       title: "Open",      sub: "Email only",        color: "text-emerald-600", bg: "bg-emerald-50" },
                      { id: "password",  icon: Lock,        title: "Password",  sub: "Email + password",  color: "text-sky-600",     bg: "bg-sky-50"     },
                      { id: "whitelist", icon: ShieldCheck, title: "Whitelist", sub: "Specific emails",   color: "text-purple-600",  bg: "bg-purple-50"  },
                    ] as const).map(({ id, icon: Icon, title, sub, color, bg }) => (
                      <button
                        key={id}
                        onClick={() => set("securityLevel", id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all flex flex-col gap-2 ${
                          cfg.securityLevel === id
                            ? "border-sky-500 bg-sky-50 shadow-sm"
                            : "border-slate-200 hover:border-sky-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg ${cfg.securityLevel === id ? bg : "bg-slate-100"} flex items-center justify-center`}>
                          <Icon className={`h-4 w-4 ${cfg.securityLevel === id ? color : "text-slate-400"}`} />
                        </div>
                        <p className="font-semibold text-slate-800 text-sm">{title}</p>
                        <p className="text-xs text-slate-500 leading-tight">{sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Password field */}
                {(cfg.securityLevel === "password" || cfg.securityLevel === "whitelist") && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-800">Password <span className="text-red-400">*</span></Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Set a secure password"
                        value={cfg.password}
                        onChange={e => set("password", e.target.value)}
                        className="pr-10 font-mono border-slate-200 focus:border-sky-400"
                      />
                      <button
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Whitelist emails / domains */}
                {cfg.securityLevel === "whitelist" && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Emails */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-sky-500" /> Allowed Emails
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="name@company.com"
                          value={emailInput}
                          onChange={e => setEmailInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addEmail() } }}
                          className="bg-white border-slate-200 focus:border-sky-400 text-sm"
                        />
                        <Button size="sm" onClick={addEmail} className="bg-sky-500 hover:bg-sky-600 text-white px-3">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {cfg.allowedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {cfg.allowedEmails.map(e => (
                            <span key={e} className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full">
                              {e}
                              <button onClick={() => set("allowedEmails", cfg.allowedEmails.filter(x => x !== e))} className="text-sky-500 hover:text-red-500 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Domains */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-sky-500" /> Allowed Domains
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="company.com"
                          value={domainInput}
                          onChange={e => setDomainInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addDomain() } }}
                          className="bg-white border-slate-200 focus:border-sky-400 text-sm"
                        />
                        <Button size="sm" onClick={addDomain} className="bg-sky-500 hover:bg-sky-600 text-white px-3">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {cfg.allowedDomains.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {cfg.allowedDomains.map(d => (
                            <span key={d} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              @{d}
                              <button onClick={() => set("allowedDomains", cfg.allowedDomains.filter(x => x !== d))} className="text-purple-500 hover:text-red-500 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expiry + view limit — side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-sky-500" /> Expiry Date
                      <span className="text-slate-400 font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      value={cfg.expiresAt}
                      onChange={e => set("expiresAt", e.target.value)}
                      className="border-slate-200 focus:border-sky-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-sky-500" /> View Limit
                      <span className="text-slate-400 font-normal text-xs">(optional)</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      value={cfg.viewLimit}
                      onChange={e => set("viewLimit", e.target.value)}
                      className="border-slate-200 focus:border-sky-400"
                    />
                  </div>
                </div>

                {/* Access controls — 3-column grid so user sees all at once */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-sky-500" /> Access Controls
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { key: "allowDownloads" as const, icon: Download,     title: "Downloads",  sub: "Allow file downloads",         color: "text-sky-600",     bg: "bg-sky-50"     },
                      { key: "allowQA"        as const, icon: MessageSquare, title: "Q&A",        sub: "Allow visitor questions",      color: "text-purple-600",  bg: "bg-purple-50"  },
                      { key: "enableWatermark"as const, icon: Droplets,     title: "Watermark",  sub: "Overlay email on pages",       color: "text-amber-600",   bg: "bg-amber-50"   },
                      { key: "requireOtp" as const, icon: ShieldCheck, title: "Email OTP", sub: "Verify email with code", color: "text-green-600", bg: "bg-green-50" },
                    ]).map(({ key, icon: Icon, title, sub, color, bg }) => (
                      <div
                        key={key}
                        onClick={() => set(key, !cfg[key])}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          cfg[key]
                            ? "border-sky-400 bg-sky-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className={`h-7 w-7 rounded-lg ${cfg[key] ? bg : "bg-slate-100"} flex items-center justify-center mb-2`}>
                          <Icon className={`h-3.5 w-3.5 ${cfg[key] ? color : "text-slate-400"}`} />
                        </div>
                        <p className="font-semibold text-slate-800 text-xs">{title}</p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{sub}</p>
                        <div className="mt-2 flex justify-end">
                          <Switch
                            checked={cfg[key]}
                            onCheckedChange={v => set(key, v)}
                            // Use inline style for the checked color — avoids custom token issues
                            style={cfg[key] ? { backgroundColor: "#0ea5e9" } : {}}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NDA requirement */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Require NDA Signature</p>
                        <p className="text-xs text-slate-500">Visitor must sign before viewing</p>
                      </div>
                    </div>
                    <Switch
                      checked={cfg.requireNDA}
                      onCheckedChange={v => set("requireNDA", v)}
                      style={cfg.requireNDA ? { backgroundColor: "#f97316" } : {}}
                    />
                  </div>
                  {cfg.requireNDA && (
  <div className="p-4 border-t border-slate-100 space-y-3">
    <p className="text-xs font-semibold text-slate-700">Select or upload your NDA (PDF)</p>

    {/* If a file is already chosen/selected */}
    {cfg.ndaFileName ? (
      <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
        <span className="text-sm text-orange-800 font-medium truncate">{cfg.ndaFileName}</span>
        <button
          onClick={() => { set("ndaFile", null); set("ndaFileName", "") }}
          className="text-slate-400 hover:text-red-500 transition-colors ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <>
        {/* Fetch existing on first open */}
        {existingNDAs.length === 0 && !ndaLoading && (
          <button
            onClick={fetchExistingNDAs}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium underline"
          >
            Load my existing NDAs
          </button>
        )}

        {ndaLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your NDAs…
          </div>
        )}

        {/* List of existing NDAs to pick from */}
        {existingNDAs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">Choose from your existing NDAs:</p>
            {existingNDAs.map(nda => (
              <button
                key={nda._id}
                onClick={() => set("ndaFileName", nda.filename)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
              >
                <FileText className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm text-slate-700 truncate">{nda.filename}</span>
              </button>
            ))}
          </div>
        )}

        {/* Always show upload option */}
        <button
          onClick={() => ndaInputRef.current?.click()}
          className="w-full border-2 border-dashed border-orange-200 rounded-xl p-4 text-center hover:bg-orange-50 transition-colors"
        >
          <Upload className="h-5 w-5 text-orange-400 mx-auto mb-1" />
          <p className="text-sm text-slate-600 font-medium">Upload a new NDA PDF</p>
        </button>
      </>
    )}

    <input ref={ndaInputRef} type="file" accept=".pdf" className="hidden"
      onChange={e => { const f = e.target.files?.[0]; if (f) handleNdaFile(f) }} />
    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
       This is YOUR NDA — visitors will see and sign your document, not a system default
    </p>
  </div>
)}
                </div>

                {/* ── Custom Branding (inline — no extra step needed) ────────── */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Custom Branding</p>
                        <p className="text-xs text-slate-500">Add your logo, colors &amp; welcome message</p>
                      </div>
                    </div>
                    <Switch
                      checked={cfg.brandingEnabled}
                      onCheckedChange={v => set("brandingEnabled", v)}
                      style={cfg.brandingEnabled ? { backgroundColor: "#a855f7" } : {}}
                    />
                  </div>

                  {cfg.brandingEnabled && (
                    <div className="p-4 border-t border-slate-100 space-y-5">
                        {/* Company Name */}
<div className="space-y-1.5">
  <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
    <Tag className="h-3.5 w-3.5 text-purple-500" /> Company Name
  </Label>
  <Input
    placeholder="e.g. Acme Capital"
    value={cfg.companyName}
    onChange={e => set("companyName", e.target.value)}
    className="border-slate-200 focus:border-purple-400"
  />
  <p className="text-xs text-slate-400">Displayed on the visitor portal header</p>
</div>
                      {/* Logo upload */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <ImageIcon className="h-3.5 w-3.5 text-purple-500" /> Company Logo
                        </Label>
                        {cfg.logoPreview ? (
                          <div className="relative inline-block">
                            <img src={cfg.logoPreview} alt="Logo" className="h-16 rounded-xl border border-slate-200 object-contain bg-slate-50 p-2" />
                            <button
                              onClick={() => { set("logoFile", null); set("logoPreview", "") }}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => logoInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-purple-200 rounded-xl p-6 text-center hover:bg-purple-50 transition-colors"
                          >
                            <Upload className="h-7 w-7 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-700">Upload your logo</p>
                            <p className="text-xs text-slate-400 mt-0.5">PNG, SVG, or JPG recommended</p>
                          </button>
                        )}
                        <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoFile(f) }} />
                      </div>

                      {/* Accent color */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5 text-purple-500" /> Accent Color
                        </Label>
                        <div className="flex items-center gap-2 flex-wrap">
                          {COLOR_PRESETS.map(p => (
                            <button
                              key={p.hex}
                              onClick={() => set("accentColor", p.hex)}
                              title={p.name}
                              className={`h-9 w-9 rounded-xl border-2 transition-all ${p.tw} ${
                                cfg.accentColor === p.hex
                                  ? "border-slate-900 scale-110 shadow-lg ring-2 ring-offset-1 ring-slate-400"
                                  : "border-transparent hover:scale-105 hover:border-white hover:shadow-md"
                              }`}
                            />
                          ))}
                          <div className="flex items-center gap-1.5 ml-1 border border-slate-200 rounded-xl px-3 py-1.5 bg-white">
                            <div className="h-5 w-5 rounded-md border border-slate-300 flex-shrink-0" style={{ backgroundColor: cfg.accentColor }} />
                            <Input
                              value={cfg.accentColor}
                              onChange={e => set("accentColor", e.target.value)}
                              className="w-24 font-mono text-sm border-0 p-0 h-auto focus:ring-0 shadow-none"
                              placeholder="#0ea5e9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Welcome message */}
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-800">
                          Welcome Message <span className="text-slate-400 font-normal">(optional)</span>
                        </Label>
                        <Textarea
                          placeholder="Welcome to our investor portal. Please review the documents below..."
                          value={cfg.welcomeMessage}
                          onChange={e => set("welcomeMessage", e.target.value)}
                          rows={3}
                          className="border-slate-200 focus:border-purple-400 resize-none"
                        />
                        <p className="text-xs text-slate-400">Shown to visitors when they first open the portal</p>
                      </div>

                      {/* Portal preview */}
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-800">Portal Preview</Label>
                        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="p-5 text-white" style={{ backgroundColor: cfg.accentColor }}>
                            {cfg.logoPreview && (
                              <img src={cfg.logoPreview} alt="Logo" className="h-8 mb-3 object-contain" />
                            )}
                            <p className="font-bold text-lg">{spaceName}</p>
                            {cfg.welcomeMessage && (
                              <p className="text-sm opacity-90 mt-1">{cfg.welcomeMessage}</p>
                            )}
                          </div>
                          <div className="p-3 bg-slate-50 text-xs text-slate-500 text-center">Visitor portal preview</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-7 space-y-6"
              >
                {/* Success banner */}
                <div className="flex items-start gap-4 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">Share link created!</p>
                    <p className="text-sm text-emerald-700 mt-0.5">Copy and send this link to your investor or client</p>
                  </div>
                </div>

                {/* Link copy */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-800">Secure Share URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      onClick={e => (e.target as HTMLInputElement).select()}
                      className="flex-1 font-mono text-sm bg-slate-50 border-slate-200 cursor-text"
                    />
                    <Button
                      onClick={copyLink}
                      className="text-white gap-2 flex-shrink-0"
                      style={{ backgroundColor: "#0ea5e9" }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Summary grid */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm font-bold text-slate-800 mb-3">Link Summary</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <ShieldCheck className="h-4 w-4" />, label: "Security",  value: cfg.securityLevel },
                      { icon: <Download    className="h-4 w-4" />, label: "Downloads", value: cfg.allowDownloads ? "Allowed" : "Blocked" },
                      { icon: <Droplets    className="h-4 w-4" />, label: "Watermark", value: cfg.enableWatermark ? "Enabled" : "Off" },
                      { icon: <MessageSquare className="h-4 w-4" />, label: "Q&A",     value: cfg.allowQA ? "Enabled" : "Off" },
                      ...(cfg.requireNDA  ? [{ icon: <FileText  className="h-4 w-4" />, label: "NDA",       value: cfg.ndaFileName || "Required" }] : []),
                      ...(cfg.expiresAt   ? [{ icon: <Clock     className="h-4 w-4" />, label: "Expires",   value: new Date(cfg.expiresAt).toLocaleDateString() }] : []),
                      ...(cfg.viewLimit   ? [{ icon: <Eye       className="h-4 w-4" />, label: "View limit",value: cfg.viewLimit }] : []),
                      ...(cfg.brandingEnabled ? [{ icon: <Sparkles className="h-4 w-4" />, label: "Branding", value: "Custom" }] : []),
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-slate-100">
                        <span className="text-sky-500">{icon}</span>
                        <span className="text-slate-500 text-xs">{label}</span>
                        <span className="font-semibold text-slate-800 capitalize ml-auto text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setStep(0); setShareUrl("") }}
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Create another share link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 px-7 py-5 flex items-center justify-between bg-white">
          {step === 0 && (
            <>
              <Button variant="outline" onClick={handleClose} className="text-slate-600">Cancel</Button>
              <Button
                onClick={() => { if (validateStep0()) handleGenerate() }}
                disabled={sending}
                className="text-white gap-2 min-w-[160px]"
                style={{ backgroundColor: "#0ea5e9" }}
              >
                {sending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><Link2 className="h-4 w-4" /> Generate Link</>
                }
              </Button>
            </>
          )}
          {step === 1 && (
            <>
              <div />
              <Button onClick={handleClose} className="bg-slate-900 hover:bg-slate-800 text-white">Done</Button>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}