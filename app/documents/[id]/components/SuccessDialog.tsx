"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

type GeneratedLink = {
  recipient?: string;
  email?: string;
  link?: string;
  status?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: { filename: string; numPages: number };
  generatedLinks: GeneratedLink[];
  onClose: () => void;
};

export default function SuccessDialog({ open, onOpenChange, doc, generatedLinks, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 bg-white flex flex-col">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-900">Signature Request Sent!</DialogTitle>
              <p className="text-sm text-slate-600 mt-1">
                Emails have been sent to all recipients with their signing links
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Document Summary */}
          <div className="bg-slate-50 rounded-lg p-4 border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{doc.filename}</p>
                <p className="text-sm text-slate-500">Sent to {(generatedLinks || []).length} recipient(s)</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Signing Links Generated</h3>
            <div className="space-y-3">
              {(generatedLinks || []).map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white hover:border-purple-300 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.recipient}</p>
                        <p className="text-sm text-slate-600">{item.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />{item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <Label className="text-xs font-medium text-slate-700 mb-2 block">Unique Signing Link</Label>
                    <div className="flex items-center gap-2">
                      <Input value={item.link} readOnly className="flex-1 text-sm font-mono bg-white" />
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(item.link ?? ''); toast.success('Link copied!'); }} className="flex-shrink-0">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(item.link, '_blank')} className="flex-shrink-0">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">💡 This unique link has been emailed to {item.recipient}. You can also share it manually.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              What happens next?
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              {['Each recipient will receive an email with their unique signing link', 'They can click the link to view and sign the document', "You'll receive notifications when each person signs", 'Track signing status in your dashboard'].map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="flex-shrink-0 mt-0.5">✓</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
          <Button variant="outline" onClick={() => { const all = (generatedLinks || []).map((i) => `${i.recipient} (${i.email}): ${i.link}`).join('\n\n'); navigator.clipboard.writeText(all); toast.success('All links copied!'); }}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copy All Links
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}