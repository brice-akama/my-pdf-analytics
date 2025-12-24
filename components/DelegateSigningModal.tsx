"use client"
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Mail, Loader2, AlertCircle, Info } from 'lucide-react';

interface DelegateSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureId: string;
  currentRecipient: {
    name: string;
    email: string;
  };
  onDelegated: () => void;
}

export const DelegateSigningModal: React.FC<DelegateSigningModalProps> = ({
  isOpen,
  onClose,
  signatureId,
  currentRecipient,
  onDelegated,
}) => {
  const [delegateName, setDelegateName] = useState('');
  const [delegateEmail, setDelegateEmail] = useState('');
  const [reason, setReason] = useState('');
  const [delegating, setDelegating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleDelegate = async () => {
    if (!delegateName.trim() || !delegateEmail.trim()) {
      setError('Please enter both name and email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(delegateEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setDelegating(true);
    setError(null);

    try {
      const response = await fetch(`/api/signature/${signatureId}/delegate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegateName: delegateName.trim(),
          delegateEmail: delegateEmail.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delegate signing');
      }

      // Success - Generate the signing link
      const signingLink = `${window.location.origin}/sign/${data.newUniqueId || signatureId}`;
      setGeneratedLink(signingLink);

    } catch (err: any) {
      console.error('Delegate error:', err);
      setError(err.message || 'Failed to delegate signing. Please try again.');
    } finally {
      setDelegating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-blue-600" />
            Delegate Signing Authority
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {!generatedLink ? (
            <>
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">What is delegation?</p>
                  <p className="text-xs text-blue-700 mt-1">
                    You are transferring your signing authority to another person who will sign on your behalf.
                  </p>
                </div>
              </div>

              {/* Current Recipient */}
              <div className="bg-slate-50 rounded-lg p-4 border">
                <p className="text-sm font-medium text-slate-700 mb-2">You (Original Recipient):</p>
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{currentRecipient.name}</p>
                    <p className="text-sm text-slate-600">{currentRecipient.email}</p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              {/* Delegate Form */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="delegate-name" className="text-sm font-medium text-slate-700">
                    Delegate Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="delegate-name"
                    value={delegateName}
                    onChange={(e) => setDelegateName(e.target.value)}
                    placeholder="Jane Smith"
                    className="mt-1"
                    disabled={delegating}
                  />
                </div>

                <div>
                  <Label htmlFor="delegate-email" className="text-sm font-medium text-slate-700">
                    Delegate Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="delegate-email"
                    type="email"
                    value={delegateEmail}
                    onChange={(e) => setDelegateEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="mt-1"
                    disabled={delegating}
                  />
                </div>

                <div>
                  <Label htmlFor="delegate-reason" className="text-sm font-medium text-slate-700">
                    Reason (Optional)
                  </Label>
                  <Textarea
                    id="delegate-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., I'm traveling and unavailable to sign..."
                    rows={3}
                    className="mt-1"
                    disabled={delegating}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Important:</strong> The delegate will sign on your behalf. The document owner will be notified of this delegation.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={delegating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelegate}
                  disabled={delegating || !delegateName.trim() || !delegateEmail.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {delegating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Delegating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Delegate Authority
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* SUCCESS VIEW WITH LINK */}
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900 mb-1">
                        Signing Authority Delegated Successfully!
                      </h4>
                      <p className="text-sm text-green-800">
                        {delegateName} ({delegateEmail}) will receive an email with the signing link.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delegate Info */}
                <div className="bg-slate-50 rounded-lg p-4 border">
                  <p className="text-sm font-medium text-slate-700 mb-2">Delegate:</p>
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-slate-900">{delegateName}</p>
                      <p className="text-sm text-slate-600">{delegateEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Signing Link */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Unique Signing Link
                  </Label>
                  <div className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center gap-2">
                      <Input
                        value={generatedLink}
                        readOnly
                        className="flex-1 text-sm font-mono bg-slate-50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedLink);
                          alert('Link copied to clipboard!');
                        }}
                        className="flex-shrink-0"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(generatedLink, '_blank')}
                        className="flex-shrink-0"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      💡 This link has been emailed to {delegateName}. You can also share it manually.
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>✓ What happened:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
                    <li>Email sent to {delegateEmail} with signing instructions</li>
                    <li>You ({currentRecipient.email}) transferred your authority</li>
                    <li>Delegate can now sign on your behalf</li>
                    <li>You can manually share the link above if needed</li>
                  </ul>
                </div>

                {/* Close Button */}
                <Button
                  onClick={() => {
                    onDelegated(); // Call the callback
                    onClose(); // Close modal
                    // Reset state
                    setDelegateName('');
                    setDelegateEmail('');
                    setReason('');
                    setGeneratedLink(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};