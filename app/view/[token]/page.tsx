// app/view/[token]/page.tsx
// app/view/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, Download, Printer, Lock, Mail, Clock, AlertCircle } from 'lucide-react';

interface ShareData {
  success: boolean;
  document?: {
    id: string;
    filename: string;
    format: string;
    numPages: number;
    pdfUrl?: string;
    previewUrls?: string[];
  };
  settings?: {
    allowDownload: boolean;
    allowPrint: boolean;
    requireEmail: boolean;
    hasPassword: boolean;
    customMessage?: string;
  };
  expired?: boolean;
  maxViewsReached?: boolean;
  error?: string;
  requiresAuth?: boolean;
}

export default function ViewSharedDocument() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Authentication states
  const [requiresEmail, setRequiresEmail] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // ✅ Tracking states
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [sessionStartTime] = useState(Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set());
  const [timeOnPage, setTimeOnPage] = useState<Record<number, number>>({});
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Load shared document
  useEffect(() => {
    loadSharedDocument();
  }, [token]);

  // ✅ Track session start
  useEffect(() => {
    if (shareData?.document) {
      trackEvent('session_start', {});
      
      // Track session end on unmount
      return () => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        trackEvent('session_end', { timeSpent: duration });
      };
    }
  }, [shareData?.document]);

  // ✅ Track time spent (send every 30 seconds)
  useEffect(() => {
    if (!shareData?.document) return;

    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - lastActivityTime) / 1000);
      if (timeSpent > 0 && timeSpent < 60) { // Only if active
        trackEvent('time_spent', { timeSpent });
        setLastActivityTime(Date.now());
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [shareData?.document, lastActivityTime]);

  // ✅ Track user activity (reset idle timer)
  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(Date.now());
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);

  // ✅ Tracking function
  const trackEvent = async (event: string, data: any) => {
    try {
      // ✅ Ensure numeric values are valid
      const payload: any = {
        event,
        sessionId,
      };

      // Add page if available
      if (currentPage && !isNaN(currentPage)) {
        payload.page = currentPage;
      }

      // Add total pages if available
      if (shareData?.document?.numPages) {
        payload.totalPages = shareData.document.numPages;
      }

      // Add event-specific data with validation
      if (event === 'time_spent' && data.timeSpent) {
        const timeSpent = parseInt(data.timeSpent);
        if (!isNaN(timeSpent) && timeSpent > 0) {
          payload.timeSpent = timeSpent;
        } else {
          return; // Don't send invalid time data
        }
      } else if (event === 'scroll' && data.scrollDepth !== undefined) {
        const scrollDepth = parseFloat(data.scrollDepth);
        if (!isNaN(scrollDepth)) {
          payload.scrollDepth = scrollDepth;
        }
      } else if (data) {
        payload.metadata = data;
      }

      await fetch(`/api/view/${token}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Tracking error:', err);
    }
  };

  const loadSharedDocument = async (authData?: { email?: string; password?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/view/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData || {}),
      });

      const data = await res.json();
      
      // ✅ DEBUG: Log the response
      console.log('📄 Share data received:', data);
      console.log('📄 PDF URL:', data.document?.pdfUrl);
      console.log('📄 Preview URLs:', data.document?.previewUrls);

      if (!res.ok) {
        if (data.requiresAuth) {
          // Document requires email or password
          setRequiresEmail(data.requiresEmail || false);
          setRequiresPassword(data.requiresPassword || false);
          setShareData(data);
        } else {
          setError(data.error || 'Failed to load document');
        }
      } else {
        setShareData(data);
      }
    } catch (err) {
      console.error('Failed to load shared document:', err);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    await loadSharedDocument({
      email: requiresEmail ? email : undefined,
      password: requiresPassword ? password : undefined,
    });

    setIsAuthenticating(false);
  };

  const handleDownload = async () => {
    if (!shareData?.settings?.allowDownload) {
      // Track blocked download attempt
      await trackEvent('download_attempt', { allowed: false });
      alert('Downloads are disabled for this document');
      return;
    }

    // Track download attempt
    await trackEvent('download_attempt', { allowed: true });

    try {
      const res = await fetch(`/api/view/${token}/download`, {
        method: 'POST',
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = shareData.document?.filename || 'document.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download document');
    }
  };

  const handlePrint = async () => {
    if (!shareData?.settings?.allowPrint) {
      // Track blocked print attempt
      await trackEvent('print_attempt', { allowed: false });
      alert('Printing is disabled for this document');
      return;
    }

    // Track print attempt
    await trackEvent('print_attempt', { allowed: true });
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Document Not Found
          </h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Authentication required
  if ((requiresEmail || requiresPassword) && !shareData?.document) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Authentication Required
          </h1>
          <p className="text-slate-600 text-center mb-6">
            This document requires verification to view
          </p>

          {shareData?.settings?.customMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">{shareData.settings.customMessage}</p>
            </div>
          )}

          <form onSubmit={handleAuthenticate} className="space-y-4">
            {requiresEmail && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {requiresPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Lock className="h-4 w-4 inline mr-1" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isAuthenticating ? 'Verifying...' : 'View Document'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Document viewer
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="font-semibold text-slate-900">
                {shareData?.document?.filename}
              </h1>
              <p className="text-xs text-slate-500">
                {shareData?.document?.numPages} pages · {shareData?.document?.format?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shareData?.settings?.allowDownload && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            )}
            {shareData?.settings?.allowPrint && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-2 text-sm"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Document Viewer */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {shareData?.expired && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">This link has expired</p>
              <p className="text-sm text-amber-700">Contact the document owner for a new link</p>
            </div>
          </div>
        )}

        {shareData?.maxViewsReached && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">View limit reached</p>
              <p className="text-sm text-amber-700">This link has reached its maximum number of views</p>
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        {shareData?.document?.pdfUrl ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <iframe
              src={shareData.document.pdfUrl}
              className="w-full h-[calc(100vh-200px)] border-0"
              title={shareData.document.filename}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="font-semibold text-yellow-900 mb-2">Document URL Not Available</h3>
            <p className="text-sm text-yellow-700 mb-4">
              The PDF URL is missing. This might be a storage configuration issue.
            </p>
            <details className="text-left bg-white rounded p-4 text-xs">
              <summary className="font-medium cursor-pointer">Debug Info</summary>
              <pre className="mt-2 overflow-auto">
                {JSON.stringify(shareData?.document, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Image Preview (for non-PDF documents) */}
        {shareData?.document?.previewUrls && shareData.document.previewUrls.length > 0 && (
          <div className="space-y-4">
            {shareData.document.previewUrls.map((url, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
                <img
                  src={url}
                  alt={`Page ${index + 1}`}
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}