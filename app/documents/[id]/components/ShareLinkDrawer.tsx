"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Drawer } from '@/components/ui/drawer';
import { EmailAutocomplete } from '@/components/ui/EmailAutocomplete';
import NdaAgreementSelector from './NdaAgreementSelector';
import { toast } from 'sonner';
import {
  Share2, Users, Shield, Mail, ImageIcon, FileSignature,
  X, Check, Upload, Loader2, Eye,
} from 'lucide-react';

type ShareSettings = {
  requireEmail: boolean;
  allowDownload: boolean;
  expiresIn: number;
  password: string;
  recipientEmails: string[];
  sendEmailNotification: boolean;
  customMessage: string;
  requireNDA: boolean;
  allowedEmails: string[];
  recipientNames: string[];
  enableWatermark: boolean;
  watermarkText: string;
  watermarkPosition: 'top' | 'bottom' | 'center' | 'diagonal';
  ndaText: string;
  ndaTemplateId: string;
  customNdaText: string;
  useCustomNda: boolean;
  ndaAgreementId: string;
  ndaUrl: string;
  allowPrint: boolean;
  allowForwarding: boolean;
  notifyOnDownload: boolean;
  downloadLimit?: number;
  viewLimit?: number;
  selfDestruct: boolean;
  availableFrom: string;
  linkType: 'public' | 'email-gated' | 'domain-restricted';
  sharedByName: string;
  logoUrl: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: { _id: string; filename: string } | null;
  docId: string;
  editMode: 'create' | 'edit' | 'duplicate';
  editingLink: any;
  shareSettings: ShareSettings;
  setShareSettings: (s: any) => void;
  recipientInput: string;
  setRecipientInput: (v: string) => void;
  recipientNameInput: string;
  setRecipientNameInput: (v: string) => void;
  recipientInputMethod: 'single' | 'bulk' | 'csv';
  setRecipientInputMethod: (v: 'single' | 'bulk' | 'csv') => void;
  bulkRecipientInput: string;
  setBulkRecipientInput: (v: string) => void;
  csvPreview: Array<{ email: string; name?: string; company?: string }>;
  setCsvPreview: (v: Array<{ email: string; name?: string; company?: string }>) => void;
  showAllRecipients: boolean;
  setShowAllRecipients: (v: boolean) => void;
  logoFile: File | null;
  logoPreview: string | null;
  isUploadingLogo: boolean;
  handleLogoFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveLogo: () => void;
  handleAddRecipient: () => void;
  handleBulkAddRecipients: () => void;
  handleCSVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleConfirmCSV: () => void;
  handleAttachFromDrive: () => void;
  onConfirm: (opts: { title: string; message: string; onConfirm: () => void; danger?: boolean }) => void;
  onClose: () => void;
  onSuccess: () => void;
};

// ── Human-readable labels for stripped features ───────────────────
const STRIPPED_FEATURE_LABELS: Record<string, string> = {
  watermark:      'Dynamic watermark (Pro+)',
  nda:            'NDA requirement (Pro+)',
  branding:       'Custom branding (Starter+)',
  bulkRecipients: 'Multiple recipients (Pro+)',
}

export default function ShareLinkDrawer({
  open, onOpenChange, doc, docId, editMode, editingLink,
  shareSettings, setShareSettings,
  recipientInput, setRecipientInput,
  recipientNameInput, setRecipientNameInput,
  recipientInputMethod, setRecipientInputMethod,
  bulkRecipientInput, setBulkRecipientInput,
  csvPreview, setCsvPreview,
  showAllRecipients, setShowAllRecipients,
  logoFile, logoPreview, isUploadingLogo,
  handleLogoFileSelect, handleRemoveLogo,
  handleAddRecipient, handleBulkAddRecipients,
  handleCSVUpload, handleConfirmCSV, handleAttachFromDrive,
  onConfirm, onClose, onSuccess,
}: Props) {

  const handleSubmit = async () => {
    if (!docId) return;

    // Auto-add typed email if valid
    if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
      if (!shareSettings.recipientEmails.includes(recipientInput)) {
        shareSettings.recipientEmails.push(recipientInput);
        setRecipientInput('');
      }
    }

    // Validate NDA
    if (shareSettings.requireNDA && !shareSettings.ndaAgreementId) {
      toast.error('Please select or upload an NDA agreement PDF');
      return;
    }

    try {
      // ── EDIT mode ─────────────────────────────────────────────────
      if (editMode === 'edit' && editingLink?.shareId) {
        const res = await fetch(`/api/documents/${docId}/share`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            shareId: editingLink.shareId,
            requireEmail: shareSettings.requireEmail,
            allowDownload: shareSettings.allowDownload,
            allowPrint: shareSettings.allowPrint,
            notifyOnView: true,
            password: shareSettings.password || null,
            expiresIn: shareSettings.expiresIn === 0 ? 'never' : shareSettings.expiresIn.toString(),
            enableWatermark: shareSettings.enableWatermark,
            watermarkText: shareSettings.watermarkText || null,
            watermarkPosition: shareSettings.watermarkPosition,
            requireNDA: shareSettings.requireNDA,
            ndaAgreementId: shareSettings.ndaAgreementId || null,
            ndaUrl: shareSettings.ndaUrl || null,
            allowForwarding: shareSettings.allowForwarding,
            notifyOnDownload: shareSettings.notifyOnDownload,
            downloadLimit: shareSettings.downloadLimit || null,
            viewLimit: shareSettings.viewLimit || null,
            selfDestruct: shareSettings.selfDestruct,
            customMessage: shareSettings.customMessage || null,
            sharedByName: shareSettings.sharedByName || null,
            logoUrl: shareSettings.logoUrl || null,
            linkType: shareSettings.linkType,
            allowedDomain: shareSettings.linkType === 'domain-restricted'
              ? (shareSettings as any).allowedDomain
              : null,
          }),
        });

        if (res.ok) {
          toast.success('Link updated successfully!');
          onClose();
          onSuccess();
        } else {
          const data = await res.json();
          toast.error(data.error || 'Failed to update link');
        }
        return;
      }

      // ── CREATE / DUPLICATE mode ───────────────────────────────────
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          requireEmail: shareSettings.requireEmail,
          allowDownload: shareSettings.allowDownload,
          password: shareSettings.password || null,
          expiresIn: shareSettings.expiresIn === 0 ? 'never' : shareSettings.expiresIn.toString(),
          allowedEmails: shareSettings.recipientEmails,
          recipientEmails: shareSettings.recipientEmails,
          recipientNames: shareSettings.recipientNames || [],
          customMessage: shareSettings.customMessage || null,
          sendEmailNotification: shareSettings.sendEmailNotification,
          notifyOnView: true,
          allowPrint: shareSettings.allowPrint,
          trackDetailedAnalytics: true,
          enableWatermark: shareSettings.enableWatermark,
          watermarkText: shareSettings.watermarkText || null,
          watermarkPosition: shareSettings.watermarkPosition,
          requireNDA: shareSettings.requireNDA,
          ndaAgreementId: shareSettings.ndaAgreementId || null,
          ndaUrl: shareSettings.ndaUrl || null,
          allowForwarding: shareSettings.allowForwarding,
          notifyOnDownload: shareSettings.notifyOnDownload,
          downloadLimit: shareSettings.downloadLimit || null,
          viewLimit: shareSettings.viewLimit || null,
          selfDestruct: shareSettings.selfDestruct,
          availableFrom: shareSettings.availableFrom || null,
          linkType: shareSettings.linkType,
          sharedByName: shareSettings.sharedByName || null,
          allowedDomain: shareSettings.linkType === 'domain-restricted'
            ? (shareSettings as any).allowedDomain
            : null,
          logoUrl: shareSettings.logoUrl || null,
        }),
      });

      // ── Parse response ONCE — branch on status ────────────────────
      const data = await res.json()

      if (!res.ok) {
        // ── Share limit reached ──────────────────────────────────────
        if (res.status === 403 && data.error === 'SHARE_LIMIT_REACHED') {
          const PLAN_NEXT: Record<string, string> = {
            free:     'Starter',
            starter:  'Pro',
            pro:      'Business',
            business: 'Business',
          }
          const nextPlan = PLAN_NEXT[data.plan] ?? 'a higher plan'
          toast.error(
            `You've used all ${data.limit} share link${data.limit === 1 ? '' : 's'} on your ${data.plan} plan.`,
            {
              duration: 7000,
              description: `Upgrade to ${nextPlan} for unlimited share links.`,
              action: {
                label: `Upgrade to ${nextPlan}`,
                onClick: () => { window.location.href = '/plan' },
              },
            }
          )
          return
        }

        // ── All other errors ─────────────────────────────────────────
        toast.error(data.error || 'Failed to create share link')
        return
      }

      // ── Success path ──────────────────────────────────────────────
      if (data.success) {
        let shareLink = '';

        if (data.shareLink) {
          shareLink = data.shareLink;
        } else if (data.shareLinks?.length > 0) {
          shareLink = data.shareLinks[0].shareLink;
        }

        onClose();
        navigator.clipboard.writeText(shareLink).catch(() => {});

        const emailResults: { email: string; sent: boolean; error?: string }[] =
          data.emailResults || [];
        const failedEmails = emailResults.filter((r) => !r.sent);
        const sentEmails = emailResults.filter((r) => r.sent);

        // ── Main success toast ──────────────────────────────────────
        toast.success(
          sentEmails.length > 0
            ? `Link created & sent to ${sentEmails.length} recipient${sentEmails.length > 1 ? 's' : ''}!`
            : editMode === 'duplicate'
            ? 'Link duplicated!'
            : 'Share link created!',
          {
            description: (
              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                  <code className="text-xs text-slate-600 truncate flex-1 max-w-[200px]">
                    {shareLink}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      toast.success('Copied!', { duration: 1500 });
                    }}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => window.open(shareLink, '_blank')}
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Open Link
                </button>
              </div>
            ),
            duration: 8000,
            icon: '🔗',
          }
        );

        // ── Email failures toast ────────────────────────────────────
        if (failedEmails.length > 0) {
          toast.warning(
            `${failedEmails.length} email${failedEmails.length > 1 ? 's' : ''} couldn't be sent`,
            {
              description: (
                <div className="space-y-1 mt-1">
                  <p className="text-xs text-slate-600">
                    Your link was created. These recipients didn't receive an email:
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-0.5">
                    {failedEmails.map((f) => (
                      <p key={f.email} className="text-xs text-slate-500 truncate">
                        · {f.email}
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Share the link manually to reach them.
                  </p>
                </div>
              ),
              duration: 12000,
              icon: '⚠️',
            }
          );
        }

        // ── Stripped features toast ─────────────────────────────────
        // The backend strips premium features silently when the plan
        // does not support them. We surface that here so the user
        // knows their link was created but without those features.
        const stripped: string[] = data.strippedFeatures || []
        if (stripped.length > 0) {
          const featureNames = stripped
            .map((f) => STRIPPED_FEATURE_LABELS[f] || f)
            .join(', ')
          toast.info('Some features were not applied', {
            duration: 8000,
            description: `Your plan does not include: ${featureNames}. Your link was still created without them.`,
            action: {
              label: 'Upgrade',
              onClick: () => { window.location.href = '/plan' },
            },
          })
        }

        onSuccess();
      }

    } catch {
      toast.error('Failed. Please try again.');
    }
  };

  const buttonLabel = editMode === 'edit'
    ? 'Save Changes →'
    : shareSettings.recipientEmails.length > 0 && shareSettings.sendEmailNotification
    ? `Send to ${shareSettings.recipientEmails.length} →`
    : editMode === 'duplicate' ? 'Duplicate Link →' : 'Generate Link →';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <div className="h-full flex flex-col bg-[#fafafa]">

        {/* Header */}
        <div className="bg-white border-b px-6 py-5 sticky top-0 z-[90]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  {editMode === 'edit' ? 'Edit Link' : editMode === 'duplicate' ? 'Duplicate Link' : 'Share Document'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{doc?.filename}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6d28d9, #2563eb)' }}
              >
                {buttonLabel}
              </button>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

            {/* SECTION 1 — Recipients */}
            

            {/* SECTION 2 — Access Control */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Access Control</h3>
              </div>
              <div className="divide-y divide-slate-100">
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Require email to view</div>
                    <div className="text-xs text-slate-400 mt-0.5">Viewer must enter email before accessing</div>
                  </div>
                  <Switch
                    checked={shareSettings.requireEmail}
                    onCheckedChange={(c) => setShareSettings({ ...shareSettings, requireEmail: c })}
                  />
                </label>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Link expires</div>
                    <div className="text-xs text-slate-400 mt-0.5">Auto-disable after selected time</div>
                  </div>
                  <select
                    value={shareSettings.expiresIn}
                    onChange={(e) => setShareSettings({ ...shareSettings, expiresIn: parseInt(e.target.value) })}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={0}>Never</option>
                  </select>
                </div>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Allow download</div>
                    <div className="text-xs text-slate-400 mt-0.5">Viewer can save a copy of the PDF</div>
                  </div>
                  <Switch
                    checked={shareSettings.allowDownload}
                    onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowDownload: c })}
                  />
                </label>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Allow printing</div>
                    <div className="text-xs text-slate-400 mt-0.5">Viewer can print the document</div>
                  </div>
                  <Switch
                    checked={shareSettings.allowPrint}
                    onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowPrint: c })}
                  />
                </label>
              </div>
            </div>

            {/* SECTION 3 — Personal Message */}
           

            {/* SECTION 4 — Branding */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-900 text-sm">
                  Branding <span className="text-slate-400 font-normal">(optional)</span>
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Your name or company</label>
                  <Input
                    value={shareSettings.sharedByName || ''}
                    onChange={(e) => setShareSettings({ ...shareSettings, sharedByName: e.target.value })}
                    placeholder="Acme Corp"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Company logo</label>
                  {logoPreview || shareSettings.logoUrl ? (
                    <div className="space-y-2">
                      <div className="h-24 rounded-xl border-2 border-violet-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                        <img src={logoPreview || shareSettings.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload-input')?.click()} className="flex-1 text-xs" disabled={isUploadingLogo}>
                          <Upload className="h-3.5 w-3.5 mr-1.5" /> Change
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleRemoveLogo} className="flex-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" disabled={isUploadingLogo}>
                          <X className="h-3.5 w-3.5 mr-1.5" /> Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => document.getElementById('logo-upload-input')?.click()}
                      disabled={isUploadingLogo}
                      className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-400 hover:bg-violet-50 transition-colors disabled:opacity-50"
                    >
                      {isUploadingLogo ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
                          <span className="text-xs text-slate-500">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <ImageIcon className="h-6 w-6 text-slate-300" />
                          <span className="text-xs font-medium text-slate-500">Click to upload logo</span>
                          <span className="text-xs text-slate-400">PNG, JPG, SVG · Max 2MB</span>
                        </div>
                      )}
                    </button>
                  )}
                  <input type="file" id="logo-upload-input" accept="image/*" onChange={handleLogoFileSelect} className="hidden" />
                </div>
              </div>
            </div>

            {/* SECTION 5 — Advanced */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <div className="divide-y divide-slate-100">
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Restrict to company domain</div>
                    <div className="text-xs text-slate-400 mt-0.5">Only emails from a specific domain can open this link</div>
                  </div>
                  <Switch
                    checked={shareSettings.linkType === 'domain-restricted'}
                    onCheckedChange={(c) => setShareSettings({
                      ...shareSettings,
                      linkType: c ? 'domain-restricted' : 'public',
                      requireEmail: c ? true : shareSettings.requireEmail,
                    })}
                  />
                </label>
                {shareSettings.linkType === 'domain-restricted' && (
                  <div className="px-5 pb-3.5 space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-sm font-semibold text-slate-500">@</span>
                      <input
                        type="text"
                        placeholder="docmetrics.io"
                        value={(shareSettings as any).allowedDomain || ''}
                        onChange={(e) => setShareSettings({
                          ...shareSettings,
                          allowedDomain: e.target.value.toLowerCase().replace('@', ''),
                        } as any)}
                        className="flex-1 bg-transparent text-sm outline-none text-slate-700 placeholder:text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Only <strong>@{(shareSettings as any).allowedDomain || 'yourdomain.com'}</strong> emails can open this link.
                    </p>
                  </div>
                )}
                <div className="px-5 py-3.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Password protect</label>
                  <Input
                    type="password"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                    placeholder="Leave empty for no password"
                    className="text-sm"
                  />
                </div>
                <div className="px-5 py-3.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">View limit</label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      placeholder="Unlimited"
                      value={shareSettings.viewLimit || ''}
                      onChange={(e) => setShareSettings({ ...shareSettings, viewLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-32 text-sm"
                    />
                    <span className="text-xs text-slate-400">Set 1 for one-time access</span>
                  </div>
                </div>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Self-destruct after first view</div>
                    <div className="text-xs text-slate-400 mt-0.5">Link deactivates after opening once</div>
                  </div>
                  <Switch
                    checked={shareSettings.selfDestruct}
                    onCheckedChange={(c) => setShareSettings({ ...shareSettings, selfDestruct: c })}
                  />
                </label>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Allow forwarding</div>
                    <div className="text-xs text-slate-400 mt-0.5">Recipients can share link with others</div>
                  </div>
                  <Switch
                    checked={shareSettings.allowForwarding}
                    onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowForwarding: c })}
                  />
                </label>
                <div className="px-5 py-3.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Available from (schedule)</label>
                  <Input
                    type="datetime-local"
                    value={shareSettings.availableFrom || ''}
                    onChange={(e) => setShareSettings({ ...shareSettings, availableFrom: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1">Link inactive until this date/time</p>
                </div>
              </div>
            </div>

            {/* SECTION 6 — Premium */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-slate-700 text-sm">Premium Features</h3>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Premium</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="px-5 py-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-slate-800">Require NDA acceptance</div>
                      <div className="text-xs text-slate-400 mt-0.5">Viewer must accept agreement before viewing</div>
                    </div>
                    <Switch
                      checked={shareSettings.requireNDA}
                      onCheckedChange={(c) => setShareSettings({ ...shareSettings, requireNDA: c })}
                    />
                  </label>
                  {shareSettings.requireNDA && (
                    <div className="pt-1">
                      <NdaAgreementSelector
                        shareSettings={shareSettings}
                        setShareSettings={setShareSettings}
                      />
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="text-sm font-medium text-slate-800">Watermark pages</div>
                      <div className="text-xs text-slate-400 mt-0.5">Stamp viewer's email on each page</div>
                    </div>
                    <Switch
                      checked={shareSettings.enableWatermark}
                      onCheckedChange={(c) => setShareSettings({ ...shareSettings, enableWatermark: c })}
                    />
                  </label>
                  {shareSettings.enableWatermark && (
                    <div className="space-y-2 pt-1">
                      <Input
                        value={shareSettings.watermarkText}
                        onChange={(e) => setShareSettings({ ...shareSettings, watermarkText: e.target.value })}
                        placeholder="Leave empty to use viewer's email"
                        className="text-sm"
                      />
                      <select
                        value={shareSettings.watermarkPosition}
                        onChange={(e) => setShareSettings({ ...shareSettings, watermarkPosition: e.target.value as any })}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                      >
                        <option value="bottom">Bottom</option>
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="diagonal">Diagonal</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tracking notice */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
              <Eye className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Views, time spent, and page engagement are automatically tracked and available in your analytics dashboard.
              </p>
            </div>
            <div className="h-4" />
          </div>
        </div>
      </div>
    </Drawer>
  );
}