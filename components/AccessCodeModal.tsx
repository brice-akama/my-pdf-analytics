// components/AccessCodeModal.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Eye, EyeOff, CheckCircle, Clock } from 'lucide-react';

interface AccessCodeModalProps {
  signatureId: string;
  onVerified: () => void;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  signatureId,
  onVerified,
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [accessCodeInfo, setAccessCodeInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    checkAccessCodeStatus();
  }, [signatureId]);

  useEffect(() => {
    if (isLocked && lockoutUntil) {
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = lockoutUntil.getTime() - now.getTime();

        if (remaining <= 0) {
          setIsLocked(false);
          setLockoutUntil(null);
          setCountdown('');
          clearInterval(timer);
          checkAccessCodeStatus();
        } else {
          const minutes = Math.floor(remaining / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLocked, lockoutUntil]);

  const checkAccessCodeStatus = async () => {
    try {
      const res = await fetch(`/api/signature/${signatureId}/access-code`);
      const data = await res.json();

      if (data.success) {
        setAccessCodeInfo(data);
        setIsLocked(data.isLocked);
        if (data.lockoutUntil) {
          setLockoutUntil(new Date(data.lockoutUntil));
        }
        if (data.isVerified) {
          onVerified();
        }
      }
    } catch (err) {
      console.error('Failed to check access code status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      setError('Please enter the access code');
      return;
    }

    if (isLocked) {
      setError(`Account is locked. Please try again in ${countdown}`);
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const res = await fetch(`/api/signature/${signatureId}/access-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() }),
      });

      const data = await res.json();

      if (data.success && data.verified) {
        // ✅ Access code verified
        onVerified();
      } else if (data.locked) {
        // 🔒 Account locked
        setIsLocked(true);
        if (data.lockoutUntil) {
          setLockoutUntil(new Date(data.lockoutUntil));
        }
        setError(data.message);
        setAccessCode('');
      } else {
        // ❌ Invalid code
        setError(data.message);
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setAccessCode('');
      }
    } catch (err) {
      console.error('Access code verification error:', err);
      setError('Failed to verify access code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const getAccessCodeLabel = () => {
    if (!accessCodeInfo) return 'Access Code';
    
    switch (accessCodeInfo.accessCodeType) {
      case 'last_4_ssn':
        return 'Last 4 of SSN';
      case 'employee_id':
        return 'Employee ID';
      case 'birth_date':
        return 'Date of Birth';
      case 'account_number':
        return 'Account Number';
      case 'phone_last_4':
        return 'Last 4 of Phone';
      default:
        return 'Access Code';
    }
  };

  const getAccessCodePlaceholder = () => {
    if (!accessCodeInfo) return 'Enter access code';
    
    switch (accessCodeInfo.accessCodeType) {
      case 'last_4_ssn':
        return 'e.g., 1234';
      case 'employee_id':
        return 'e.g., EMP-5678';
      case 'birth_date':
        return 'e.g., 01151990';
      case 'account_number':
        return 'e.g., 9876';
      case 'phone_last_4':
        return 'e.g., 5678';
      default:
        return 'Enter access code';
    }
  };

  return (
    <div className="fixed inset-0  flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl">
          <div className="flex items-center gap-3 text-white">
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Secure Access Required</h3>
              <p className="text-sm text-white/90 mt-1">
                Enter the access code to view this document
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLocked ? (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    Account Temporarily Locked
                  </p>
                  <p className="text-sm text-red-700 mb-2">
                    Too many failed attempts. Please wait before trying again.
                  </p>
                  {countdown && (
                    <div className="bg-red-100 border border-red-300 rounded px-3 py-2 text-center">
                      <p className="text-lg font-mono font-bold text-red-900">{countdown}</p>
                      <p className="text-xs text-red-700 mt-1">Time remaining</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{error}</p>
                    {attemptsRemaining !== null && attemptsRemaining > 0 && (
                      <p className="text-xs text-red-700 mt-1">
                        {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                      </p>
                    )}
                  </div>
                </div>
              )}

              {accessCodeInfo?.accessCodeHint && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Hint:</p>
                    <p className="text-sm text-blue-800">{accessCodeInfo.accessCodeHint}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {getAccessCodeLabel()} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCode ? 'text' : 'password'}
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder={getAccessCodePlaceholder()}
                      className="w-full px-4 py-3 pr-12 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-mono"
                      autoFocus
                      disabled={verifying}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showCode ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    The access code was provided by the document sender
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!accessCode.trim() || verifying}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Verify & Continue
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 mb-2">
                    <strong className="text-slate-900">🔒 Security Notice:</strong>
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>• This document is protected with access code authentication</li>
                    <li>• After {accessCodeInfo?.maxAttempts || 5} failed attempts, access will be temporarily locked</li>
                    <li>• All access attempts are logged for security</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};