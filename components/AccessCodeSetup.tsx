// components/AccessCodeSetup.tsx
"use client";
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ACCESS_CODE_TYPES, validateAccessCode } from '@/lib/accessCodeConfig';

interface AccessCodeSetupProps {
  documentId: string;
  recipients: Array<{ name: string; email: string }>;
  onSetupComplete?: () => void;
}

export const AccessCodeSetup: React.FC<AccessCodeSetupProps> = ({
  documentId,
  recipients,
  onSetupComplete,
}) => {
  const [selectedType, setSelectedType] = useState(ACCESS_CODE_TYPES[0]);
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeHint, setAccessCodeHint] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [setting, setSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSetAccessCode = async () => {
    setError(null);
    setSuccess(null);

    // Validate
    const validation = validateAccessCode(accessCode);
    if (!validation.valid) {
      setError(validation.error || 'Invalid access code');
      return;
    }

    if (!applyToAll && selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    setSetting(true);

    try {
      const res = await fetch(`/api/documents/${documentId}/access-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          accessCodeType: selectedType.id,
          accessCodeHint: accessCodeHint.trim() || null,
          applyToAll: applyToAll,
          recipientEmails: applyToAll ? null : selectedRecipients,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to set access code');
        setSetting(false);
        return;
      }

      setSuccess(`✅ Access code applied to ${data.recipientsUpdated} recipient${data.recipientsUpdated !== 1 ? 's' : ''}`);
      
      setTimeout(() => {
        if (onSetupComplete) {
          onSetupComplete();
        }
      }, 2000);

    } catch (err) {
      console.error('Failed to set access code:', err);
      setError('Failed to set access code. Please try again.');
    } finally {
      setSetting(false);
    }
  };

  const handleRecipientToggle = (email: string) => {
    setSelectedRecipients(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  return (
    <div className="bg-white rounded-lg border-2 border-purple-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Lock className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Access Code Protection</h3>
          <p className="text-sm text-slate-600">Require recipients to enter a code before viewing</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Access Code Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          What type of access code?
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ACCESS_CODE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`p-4 border-2 rounded-lg text-left transition-all hover:border-purple-400 ${
                selectedType.id === type.id
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{type.name}</p>
                  <p className="text-xs text-slate-600 mt-1">{type.description}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">e.g., {type.example}</p>
                </div>
                {selectedType.id === type.id && (
                  <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Use Cases Info */}
      {selectedType && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">
            💡 Common use cases for {selectedType.name}:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            {selectedType.useCases.map((useCase, idx) => (
              <li key={idx}>• {useCase}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Access Code Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Set Access Code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showCode ? 'text' : 'password'}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder={`Enter ${selectedType.name.toLowerCase()}`}
            className="w-full px-4 py-3 pr-12 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Minimum 4 characters. Recipients will need this to access the document.
        </p>
      </div>

      {/* Optional Hint */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Hint (Optional)
        </label>
        <textarea
          value={accessCodeHint}
          onChange={(e) => setAccessCodeHint(e.target.value)}
          placeholder="e.g., 'Your employee ID' or 'Last 4 of the SSN on file'"
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
          rows={2}
        />
        <p className="text-xs text-slate-500 mt-1">
          This hint will be shown to recipients on the access code screen
        </p>
      </div>

      {/* Recipient Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Apply to which recipients?
        </label>
        
        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="h-4 w-4 text-purple-600 rounded"
            />
            <span className="text-sm text-slate-700 font-medium">
              Apply to all recipients
            </span>
          </label>
        </div>

        {!applyToAll && (
          <div className="border-2 border-slate-200 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
            {recipients.map((recipient) => (
              <label
                key={recipient.email}
                className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRecipients.includes(recipient.email)}
                  onChange={() => handleRecipientToggle(recipient.email)}
                  className="h-4 w-4 text-purple-600 rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{recipient.name}</p>
                  <p className="text-xs text-slate-600">{recipient.email}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900 mb-2">🔒 Security Features:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Access code is encrypted and never stored in plain text</li>
              <li>• Recipients have 5 attempts before temporary lockout</li>
              <li>• Failed attempts trigger a 30-minute cooldown period</li>
              <li>• All access attempts are logged for audit purposes</li>
              <li>• Case-insensitive verification for ease of use</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSetAccessCode}
        disabled={!accessCode.trim() || setting}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        {setting ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Setting Access Code...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            Set Access Code
          </>
        )}
      </button>
    </div>
  );
};