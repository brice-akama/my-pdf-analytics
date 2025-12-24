//app/components/ReassignSignerModal.tsx
"use client"
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserX, UserCheck, Mail, Loader2, AlertCircle } from 'lucide-react';

interface ReassignSignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  signatureId: string;
  currentRecipient: {
    name: string;
    email: string;
  };
  onReassigned: () => void;
}

export const ReassignSignerModal: React.FC<ReassignSignerModalProps> = ({
  isOpen,
  onClose,
  signatureId,
  currentRecipient,
  onReassigned,
}) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add this with your other useState declarations (around line 20)
const [generatedLink, setGeneratedLink] = useState<string | null>(null);
// Add this new state with other useState declarations
const [allowOriginalToView, setAllowOriginalToView] = useState(false);

  const handleReassign = async () => {
  if (!newName.trim() || !newEmail.trim()) {
    setError('Please enter both name and email');
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    setError('Please enter a valid email address');
    return;
  }

  setReassigning(true);
  setError(null);

  try {
    const response = await fetch(`/api/signature/${signatureId}/reassign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        newName: newName.trim(),
        newEmail: newEmail.trim(),
        allowOriginalToView: allowOriginalToView, //   ADD THIS
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to reassign signer');
    }

    // ⭐ Generate the signing link
    const signingLink = `${window.location.origin}/sign/${data.newUniqueId || signatureId}`;
    setGeneratedLink(signingLink);

  } catch (err: any) {
    console.error('Reassign error:', err);
    setError(err.message || 'Failed to reassign signer. Please try again.');
  } finally {
    setReassigning(false);
  }
};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white sm:max-w-md scrollball-thin max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UserX className="h-6 w-6 text-orange-600" />
            Reassign Signer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
  {!generatedLink ? (
    <>
      {/* Current Recipient */}
      <div className="bg-slate-50 rounded-lg p-4 border">
        <p className="text-sm font-medium text-slate-700 mb-2">Current Recipient:</p>
        <div className="flex items-center gap-2">
          <UserX className="h-5 w-5 text-slate-400" />
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

      {/* New Recipient Form */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="new-name" className="text-sm font-medium text-slate-700">
            New Recipient Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="John Doe"
            className="mt-1"
            disabled={reassigning}
          />
        </div>

        <div>
          <Label htmlFor="new-email" className="text-sm font-medium text-slate-700">
            New Recipient Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="new-email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="john@company.com"
            className="mt-1"
            disabled={reassigning}
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
          <strong>⚠️ Note:</strong> The new recipient will receive an email with the signing link. 
          The previous recipient will be notified of the change.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={reassigning}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleReassign}
          disabled={reassigning || !newName.trim() || !newEmail.trim()}
          className="flex-1 bg-orange-600 hover:bg-orange-700"
        >
          {reassigning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reassigning...
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Reassign Signer
            </>
          )}
        </Button>
      </div>
    </>
  ) : (
    <>
      {/* ⭐ SUCCESS VIEW WITH LINK */}
      <div className="space-y-4">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">
                Signer Reassigned Successfully!
              </h4>
              <p className="text-sm text-green-800">
                {newName} ({newEmail}) will receive an email with the signing link.
              </p>
            </div>
          </div>
        </div>

        {/* New Recipient Info */}
        <div className="bg-slate-50 rounded-lg p-4 border">
          <p className="text-sm font-medium text-slate-700 mb-2">New Recipient:</p>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-slate-900">{newName}</p>
              <p className="text-sm text-slate-600">{newEmail}</p>
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
              💡 This link has been emailed to {newName}. You can also share it manually.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>✓ What happened:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4 list-disc">
            <li>Email sent to {newEmail} with signing instructions</li>
            <li>Previous recipient ({currentRecipient.email}) notified of change</li>
            <li>You can manually share the link above if needed</li>
          </ul>
        </div>

        {/* Close Button */}
        <Button
          onClick={() => {
            onReassigned(); // Call the callback
            onClose(); // Close modal
            // Reset state
            setNewName('');
            setNewEmail('');
            setGeneratedLink(null);
          }}
          className="w-full bg-purple-600 hover:bg-purple-700"
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