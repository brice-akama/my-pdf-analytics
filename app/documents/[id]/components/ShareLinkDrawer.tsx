"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Drawer } from '@/components/ui/drawer';
import { EmailAutocomplete } from '@/components/ui/EmailAutocomplete';
import NdaSelector from './NdaSelector';
import { toast } from 'sonner';
import {
  Share2, Users, Shield, Mail, ImageIcon, FileSignature,
  X, Check, Upload, Loader2, Eye, Link as LinkIcon,
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
    if (recipientInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientInput)) {
      if (!shareSettings.recipientEmails.includes(recipientInput)) {
        shareSettings.recipientEmails.push(recipientInput);
        setRecipientInput('');
      }
    }

    try {
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
            ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId,
            customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null,
            allowForwarding: shareSettings.allowForwarding,
            notifyOnDownload: shareSettings.notifyOnDownload,
            downloadLimit: shareSettings.downloadLimit || null,
            viewLimit: shareSettings.viewLimit || null,
            selfDestruct: shareSettings.selfDestruct,
            customMessage: shareSettings.customMessage || null,
            sharedByName: shareSettings.sharedByName || null,
            logoUrl: shareSettings.logoUrl || null,
            linkType: shareSettings.linkType,
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
          ndaTemplateId: shareSettings.useCustomNda ? null : shareSettings.ndaTemplateId,
          customNdaText: shareSettings.useCustomNda ? shareSettings.customNdaText : null,
          allowForwarding: shareSettings.allowForwarding,
          notifyOnDownload: shareSettings.notifyOnDownload,
          downloadLimit: shareSettings.downloadLimit || null,
          viewLimit: shareSettings.viewLimit || null,
          selfDestruct: shareSettings.selfDestruct,
          availableFrom: shareSettings.availableFrom || null,
          linkType: shareSettings.linkType,
          sharedByName: shareSettings.sharedByName || null,
          logoUrl: shareSettings.logoUrl || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let shareLink = '';
          let recipientCount = 0;
          let emailsWereSent = false;

          if (data.shareLink) {
            shareLink = data.shareLink;
          } else if (data.shareLinks?.length > 0) {
            shareLink = data.shareLinks[0].shareLink;
            recipientCount = data.shareLinks.length;
            emailsWereSent = recipientCount > 0 && shareSettings.sendEmailNotification;
          }

          onClose();
          navigator.clipboard.writeText(shareLink).catch(() => {});

          toast.success(
            emailsWereSent
              ? `Link created & sent to ${recipientCount} recipient${recipientCount > 1 ? 's' : ''}!`
              : editMode === 'duplicate' ? 'Link duplicated!' : 'Share link created!',
            {
              description: (
                <div className="space-y-2 mt-1">
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                    <code className="text-xs text-slate-600 truncate flex-1 max-w-[200px]">{shareLink}</code>
                    <button onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Copied!', { duration: 1500 }); }} className="text-xs font-semibold text-purple-600 hover:text-purple-700">Copy</button>
                  </div>
                  <button onClick={() => window.open(shareLink, '_blank')} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Open Link</button>
                </div>
              ),
              duration: 8000,
              icon: '🔗',
            }
          );
          onSuccess();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create share link');
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
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Recipients</h3>
                </div>
                {shareSettings.recipientEmails.length > 0 && (
                  <span className="px-2.5 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">
                    {shareSettings.recipientEmails.length} added
                  </span>
                )}
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500">Leave empty for "anyone with the link"</p>

                {/* Input method tabs */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-0.5 gap-0.5">
                  {(['single', 'bulk', 'csv'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setRecipientInputMethod(method)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${recipientInputMethod === method ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {method === 'single' ? 'Add One' : method === 'bulk' ? 'Paste List' : 'CSV'}
                    </button>
                  ))}
                </div>

                {/* Single */}
                {recipientInputMethod === 'single' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <EmailAutocomplete
                        value={recipientNameInput}
                        onChange={(val) => setRecipientNameInput(val)}
                        onSelect={({ email, name }) => {
                          if (name) setRecipientNameInput(name);
                          if (email && !recipientInput) setRecipientInput(email);
                        }}
                        placeholder="John Doe"
                        className="text-sm"
                        searchBy="name"
                      />
                      <EmailAutocomplete
                        value={recipientInput}
                        onChange={(val) => setRecipientInput(val)}
                        onSelect={({ email, name }) => {
                          setRecipientInput(email);
                          if (name && !recipientNameInput) setRecipientNameInput(name);
                        }}
                        placeholder="investor@vc.com"
                        className="text-sm"
                      />
                    </div>
                    <Button type="button" onClick={handleAddRecipient} variant="outline" size="sm" className="w-full">
                      Add Recipient
                    </Button>
                  </div>
                )}

                {/* Bulk */}
                {recipientInputMethod === 'bulk' && (
                  <div className="space-y-2">
                    <textarea
                      value={bulkRecipientInput}
                      onChange={(e) => setBulkRecipientInput(e.target.value)}
                      placeholder={"john@sequoia.com\nsarah@a16z.com\nmike@kleiner.com"}
                      rows={5}
                      className="w-full font-mono text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-violet-400"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {bulkRecipientInput ? `${bulkRecipientInput.split(/[\n,]+/).filter(e => e.trim()).length} detected` : 'Paste emails above'}
                      </span>
                      <Button onClick={handleBulkAddRecipients} disabled={!bulkRecipientInput.trim()} size="sm" className="gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Add All
                      </Button>
                    </div>
                  </div>
                )}

                {/* CSV */}
                {recipientInputMethod === 'csv' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleAttachFromDrive} className="h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-colors text-sm font-medium text-slate-600">
                        <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 1.485L3.982 15h4.035l8.028-13.515h-4.035zm6.982 13.515l-4.018-6.77-4.017 6.77h8.035zM1.946 17l4.018 6.515L9.982 17H1.946z"/></svg>
                        <span className="text-xs">Google Drive</span>
                      </button>
                      <button onClick={() => document.getElementById('csv-local-upload')?.click()} className="h-20 flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium text-slate-600">
                        <Upload className="h-5 w-5 text-slate-400" />
                        <span className="text-xs">Local CSV</span>
                      </button>
                      <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" id="csv-local-upload" />
                    </div>
                    {csvPreview.length > 0 && (
                      <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{csvPreview.length} contacts found</span>
                          <Button size="sm" onClick={handleConfirmCSV} className="h-7 text-xs gap-1"><Check className="h-3 w-3" /> Import</Button>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {csvPreview.slice(0, 8).map((c, i) => (
                            <div key={i} className="text-xs bg-white rounded px-2 py-1 border truncate">
                              <span className="font-medium">{c.email}</span>
                              {c.name && <span className="text-slate-400 ml-1.5">· {c.name}</span>}
                            </div>
                          ))}
                          {csvPreview.length > 8 && <p className="text-xs text-slate-400 text-center">+{csvPreview.length - 8} more</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Added recipients */}
                {shareSettings.recipientEmails.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-violet-50 border border-violet-200 rounded-xl">
                      <span className="text-xs font-semibold text-violet-800">{shareSettings.recipientEmails.length} recipient{shareSettings.recipientEmails.length !== 1 ? 's' : ''}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setShowAllRecipients(!showAllRecipients)} className="text-xs text-violet-600 hover:underline">{showAllRecipients ? 'Collapse' : 'View all'}</button>
                        <span className="text-violet-300">·</span>
                        <button onClick={() => onConfirm({ title: 'Remove All Recipients', message: 'Are you sure you want to remove all recipients?', danger: true, onConfirm: () => setShareSettings({ ...shareSettings, recipientEmails: [] }) })} className="text-xs text-red-500 hover:underline">Clear</button>
                      </div>
                    </div>
                    {showAllRecipients && (
                      <div className="max-h-48 overflow-y-auto space-y-1 border rounded-xl p-2 bg-slate-50">
                        {shareSettings.recipientEmails.map((email, idx) => (
                          <div key={idx} className="flex items-center justify-between px-2 py-1.5 bg-white rounded-lg border group hover:border-violet-300 transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[10px] font-bold">{email.charAt(0).toUpperCase()}</span>
                              </div>
                              <span className="text-xs text-slate-700 truncate">{email}</span>
                            </div>
                            <button onClick={() => setShareSettings({ ...shareSettings, recipientEmails: shareSettings.recipientEmails.filter((_, i) => i !== idx) })} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-1">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-violet-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="text-xs font-medium text-slate-800">Send email notification</div>
                          <div className="text-xs text-slate-400">Email recipients with the access link</div>
                        </div>
                      </div>
                      <Switch checked={shareSettings.sendEmailNotification} onCheckedChange={(c) => setShareSettings({ ...shareSettings, sendEmailNotification: c })} />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2 — Access Control */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Access Control</h3>
              </div>
              <div className="divide-y divide-slate-100">
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div><div className="text-sm font-medium text-slate-800">Require email to view</div><div className="text-xs text-slate-400 mt-0.5">Viewer must enter email before accessing</div></div>
                  <Switch checked={shareSettings.requireEmail} onCheckedChange={(c) => setShareSettings({ ...shareSettings, requireEmail: c })} />
                </label>
                <div className="flex items-center justify-between px-5 py-3.5">
                  <div><div className="text-sm font-medium text-slate-800">Link expires</div><div className="text-xs text-slate-400 mt-0.5">Auto-disable after selected time</div></div>
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
                  <div><div className="text-sm font-medium text-slate-800">Allow download</div><div className="text-xs text-slate-400 mt-0.5">Viewer can save a copy of the PDF</div></div>
                  <Switch checked={shareSettings.allowDownload} onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowDownload: c })} />
                </label>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div><div className="text-sm font-medium text-slate-800">Allow printing</div><div className="text-xs text-slate-400 mt-0.5">Viewer can print the document</div></div>
                  <Switch checked={shareSettings.allowPrint} onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowPrint: c })} />
                </label>
              </div>
            </div>

            {/* SECTION 3 — Personal Message */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Personal Message <span className="text-slate-400 font-normal">(optional)</span></h3>
              </div>
              <div className="p-5">
                <Textarea
                  value={shareSettings.customMessage}
                  onChange={(e) => setShareSettings({ ...shareSettings, customMessage: e.target.value })}
                  placeholder="Hi, please review the attached document..."
                  rows={3}
                  className="text-sm resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 mt-1.5 text-right">{shareSettings.customMessage.length}/500</p>
              </div>
            </div>

            {/* SECTION 4 — Branding */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Branding <span className="text-slate-400 font-normal">(optional)</span></h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Your name or company</label>
                  <Input value={shareSettings.sharedByName || ''} onChange={(e) => setShareSettings({ ...shareSettings, sharedByName: e.target.value })} placeholder="Acme Corp" className="text-sm" />
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
                    <button type="button" onClick={() => document.getElementById('logo-upload-input')?.click()} disabled={isUploadingLogo} className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-violet-400 hover:bg-violet-50 transition-colors disabled:opacity-50">
                      {isUploadingLogo ? (
                        <div className="flex flex-col items-center gap-2"><Loader2 className="h-6 w-6 text-violet-500 animate-spin" /><span className="text-xs text-slate-500">Uploading...</span></div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5"><ImageIcon className="h-6 w-6 text-slate-300" /><span className="text-xs font-medium text-slate-500">Click to upload logo</span><span className="text-xs text-slate-400">PNG, JPG, SVG · Max 2MB</span></div>
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
                <h3 className="font-semibold text-slate-700 text-sm">Advanced Settings</h3>
                <span className="ml-auto text-xs text-slate-400">optional</span>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="px-5 py-3.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Password protect</label>
                  <Input type="password" value={shareSettings.password} onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })} placeholder="Leave empty for no password" className="text-sm" />
                </div>
                <div className="px-5 py-3.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">View limit</label>
                  <div className="flex items-center gap-3">
                    <Input type="number" min="0" placeholder="Unlimited" value={shareSettings.viewLimit || ''} onChange={(e) => setShareSettings({ ...shareSettings, viewLimit: e.target.value ? parseInt(e.target.value) : undefined })} className="w-32 text-sm" />
                    <span className="text-xs text-slate-400">Set 1 for one-time access</span>
                  </div>
                </div>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div><div className="text-sm font-medium text-slate-800">Self-destruct after first view</div><div className="text-xs text-slate-400 mt-0.5">Link deactivates after opening once</div></div>
                  <Switch checked={shareSettings.selfDestruct} onCheckedChange={(c) => setShareSettings({ ...shareSettings, selfDestruct: c })} />
                </label>
                <label className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div><div className="text-sm font-medium text-slate-800">Allow forwarding</div><div className="text-xs text-slate-400 mt-0.5">Recipients can share link with others</div></div>
                  <Switch checked={shareSettings.allowForwarding} onCheckedChange={(c) => setShareSettings({ ...shareSettings, allowForwarding: c })} />
                </label>
                <div className="px-5 py-3.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Available from (schedule)</label>
                  <Input type="datetime-local" value={shareSettings.availableFrom || ''} onChange={(e) => setShareSettings({ ...shareSettings, availableFrom: e.target.value })} className="text-sm" />
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
                    <div><div className="text-sm font-medium text-slate-800">Require NDA acceptance</div><div className="text-xs text-slate-400 mt-0.5">Viewer must sign terms before viewing</div></div>
                    <Switch checked={shareSettings.requireNDA} onCheckedChange={(c) => setShareSettings({ ...shareSettings, requireNDA: c })} />
                  </label>
                  {shareSettings.requireNDA && (
                    <div className="space-y-3 pt-1">
                      <NdaSelector shareSettings={shareSettings} setShareSettings={setShareSettings} />
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-800">✅ Acceptance is timestamped and logged for legal records.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div><div className="text-sm font-medium text-slate-800">Watermark pages</div><div className="text-xs text-slate-400 mt-0.5">Stamp viewer's email on each page</div></div>
                    <Switch checked={shareSettings.enableWatermark} onCheckedChange={(c) => setShareSettings({ ...shareSettings, enableWatermark: c })} />
                  </label>
                  {shareSettings.enableWatermark && (
                    <div className="space-y-2 pt-1">
                      <Input value={shareSettings.watermarkText} onChange={(e) => setShareSettings({ ...shareSettings, watermarkText: e.target.value })} placeholder="Leave empty to use viewer's email" className="text-sm" />
                      <select value={shareSettings.watermarkPosition} onChange={(e) => setShareSettings({ ...shareSettings, watermarkPosition: e.target.value as any })} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
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
              <p className="text-xs text-blue-700">Views, time spent, and page engagement are automatically tracked and available in your analytics dashboard.</p>
            </div>
            <div className="h-4" />
          </div>
        </div>
      </div>
    </Drawer>
  );
}