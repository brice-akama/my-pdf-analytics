// app/view/[token]/page.tsx
// app/view/[token]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, Download, Printer, Lock, Mail, Clock, AlertCircle, Check } from 'lucide-react';
import { Label } from '@radix-ui/react-dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  emailNotAllowed?: boolean;
  message?: string;
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
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random()}`);
  const [sessionStartTime] = useState(Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set());
  const [timeOnPage, setTimeOnPage] = useState<Record<number, number>>({});
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
const [pageStartTime, setPageStartTime] = useState(Date.now());
const [requiresNDA, setRequiresNDA] = useState(false);
const [ndaText, setNdaText] = useState('');
const [ndaAccepted, setNdaAccepted] = useState(false);
const [certificateId, setCertificateId] = useState<string | null>(null);
const [iframeLoading, setIframeLoading] = useState(true);
const [certificateDrawerOpen, setCertificateDrawerOpen] = useState(false);
const [certificatePdfUrl, setCertificatePdfUrl] = useState<string | null>(null);
const [loadingCertificate, setLoadingCertificate] = useState(false);

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

  // Track page changes and time spent per page
useEffect(() => {
  if (shareData?.document && currentPage > 0) {
    // Track page view
    trackEvent('page_view', { page: currentPage });
    
    // Reset page timer
    setPageStartTime(Date.now());
    
    return () => {
      // Track time spent on this page when leaving
      const timeOnPage = Math.floor((Date.now() - pageStartTime) / 1000);
      if (timeOnPage > 0 && timeOnPage < 600) { // Max 10 minutes per page
        trackEvent('page_time', { 
          page: currentPage, 
          timeSpent: timeOnPage 
        });
      }
    };
  }
}, [currentPage, shareData?.document]);

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

  const loadSharedDocument = async (authData?: { 
  email?: string; 
  password?: string;
  ndaAccepted?: boolean; // ⭐ NEW
  viewerName?: string; // ⭐ NEW
  viewerCompany?: string; // ⭐ NEW
}) => {
  console.log('🔍 [VIEWER] Loading shared document with token:', token);
  console.log('📋 [VIEWER] Auth data:', authData);
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

    console.log('📡 [VIEWER] Response status:', res.status);

    const data = await res.json();
    console.log('📦 [VIEWER] Response data:', data);

    if (!res.ok) {
      console.log('❌ [VIEWER] Request failed');
      if (data.unauthorized) {
         console.log('🚫 [VIEWER] Unauthorized access');
        setError(`❌ Access Denied: Your email (${authData?.email}) is not authorized to view this document.`);
        setShareData(null);
        return;
      }
      
      if (data.requiresAuth) {
        console.log('🔐 [VIEWER] Requires authentication');
        console.log('   - Requires Email:', data.requiresEmail);
        console.log('   - Requires Password:', data.requiresPassword);
        console.log('   - Requires NDA:', data.requiresNDA);
        setRequiresEmail(data.requiresEmail || false);
        setRequiresPassword(data.requiresPassword || false);
        setRequiresNDA(data.requiresNDA || false); // ⭐ NEW
        setNdaText(data.ndaText || ''); // ⭐ NEW
        setShareData(data);
      } else {
        console.log('❌ [VIEWER] Other error:', data.error);
        setError(data.error || 'Failed to load document');
      }
    } else {
      console.log('✅ [VIEWER] Document loaded successfully');
      console.log('📄 [VIEWER] Document data:', data.document);
      console.log('🔗 [VIEWER] PDF URL:', data.document?.pdfUrl);
      console.log('🎫 [VIEWER] Certificate ID:', data.certificateId);
      setShareData(data);
      setIsVerified(true);
      // ⭐ NEW: Store certificate ID if NDA was accepted
      // ⭐ Capture certificate ID if NDA was accepted
  if (data.certificateId) {
    console.log('📜 [VIEWER] NDA certificate created:', data.certificateId);
    setCertificateId(data.certificateId);
  }
    }
  } catch (err) {
    console.error('💥 [VIEWER] Fatal error:', err)
    console.error('Failed to load shared document:', err);
    setError('Failed to load document');
  } finally {
    setLoading(false);
  }
};


  const handleAuthenticate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  //   Check NDA acceptance if required
  if (requiresNDA && !ndaAccepted) {
    alert('You must accept the NDA to view this document');
    return;
  }
  
  setIsAuthenticating(true);

  await loadSharedDocument({
    email: requiresEmail ? email : undefined,
    password: requiresPassword ? password : undefined,
    ndaAccepted: requiresNDA ? ndaAccepted : undefined, 
    viewerName: requiresNDA ? name : undefined, // ⭐ NEW
    viewerCompany: requiresNDA ? company : undefined, // ⭐ NEW 
  });

  setIsAuthenticating(false);
};

  const handleDownload = async () => {
  if (!shareData?.settings?.allowDownload) {
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
      
      // ✅ Track successful download
      await trackEvent('download_success', { 
        filename: shareData.document?.filename 
      });
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
if ((requiresEmail || requiresPassword || requiresNDA) && !shareData?.document) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
          {requiresNDA ? 'NDA Acceptance Required' : 'Verification Required'}
        </h1>
        <p className="text-slate-600 text-center mb-6">
          {shareData?.message || 'Please verify your identity to view this document'}
        </p>

        {/* Custom message from sender */}
        {shareData?.settings?.customMessage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 mb-1">💬 Message from sender:</p>
            <p className="text-sm text-blue-800 italic">"{shareData.settings.customMessage}"</p>
          </div>
        )}

        <form onSubmit={handleAuthenticate} className="space-y-4">
          
          {/* ⭐ NDA SECTION */}
{requiresNDA && (
  <div className="border-2 border-amber-300 rounded-lg p-4 bg-amber-50">
    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
      <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Non-Disclosure Agreement
    </h3>
    
    {/* ⭐ NEW: Collect viewer info for NDA */}
    <div className="space-y-3 mb-4">
      <div>
        <Label className="text-sm font-medium text-slate-700">Your Full Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          required
          className="mt-1"
        />
      </div>
      
      <div>
        <Label className="text-sm font-medium text-slate-700">Company (Optional)</Label>
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Corporation"
          className="mt-1"
        />
      </div>
    </div>
    
    <div className="bg-white border rounded-lg p-4 max-h-60 overflow-y-auto mb-4">
      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
        {ndaText}
      </pre>
    </div>

    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={ndaAccepted}
        onChange={(e) => setNdaAccepted(e.target.checked)}
        required
        className="h-5 w-5 rounded border-slate-300 text-purple-600 mt-0.5 flex-shrink-0"
      />
      <span className="text-sm text-slate-900">
        <strong>I, {name || '[Your Name]'}{company ? ` representing ${company}` : ''}, have read and agree to the terms</strong> of this Non-Disclosure Agreement. 
        I understand that violating these terms may result in legal consequences.
      </span>
    </label>
  </div>
)}
          {/* Email input */}
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
              <p className="text-xs text-slate-500 mt-1">
                Enter the email address this document was shared with
              </p>
            </div>
          )}

          {/* Password input */}
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
            disabled={isAuthenticating || (requiresNDA && !ndaAccepted)}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isAuthenticating ? 'Verifying...' : requiresNDA ? 'Accept & View Document' : 'View Document'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Having trouble? Contact the document owner.
        </p>
      </div>
    </div>
  );
}

  // Document viewer
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ⭐ NDA Certificate Download Banner */}
{certificateId && (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
        <Check className="h-5 w-5 text-green-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-green-900 mb-1">
          NDA Acceptance Confirmed
        </h4>
        <p className="text-sm text-green-800 mb-3">
          Thank you for accepting the Non-Disclosure Agreement. 
          You can view or download your certificate for your records.
        </p>
        
        {/* ⭐ NEW: Button Group */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                setLoadingCertificate(true);
                const res = await fetch(`/api/nda-certificates/${certificateId}?shareId=${token}`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  setCertificatePdfUrl(url);
                  setCertificateDrawerOpen(true);
                }
              } catch (error) {
                console.error('View error:', error);
                alert('Failed to load certificate');
              } finally {
                setLoadingCertificate(false);
              }
            }}
            disabled={loadingCertificate}
            className="gap-2 bg-white hover:bg-green-50 border-green-300"
          >
            {loadingCertificate ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                View Certificate
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch(`/api/nda-certificates/${certificateId}?shareId=${token}`);
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `NDA-Certificate-${certificateId}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                }
              } catch (error) {
                console.error('Download error:', error);
                alert('Failed to download certificate');
              }
            }}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            Download Certificate
          </Button>
        </div>
        
        <p className="text-xs text-green-700 mt-2">
          Certificate ID: <code className="bg-white px-1 py-0.5 rounded">{certificateId}</code>
        </p>
      </div>
    </div>
  </div>
)}

{/* ⭐ Certificate Viewer Drawer */}
{certificateDrawerOpen && certificatePdfUrl && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={() => {
        setCertificateDrawerOpen(false);
        if (certificatePdfUrl) {
          window.URL.revokeObjectURL(certificatePdfUrl);
          setCertificatePdfUrl(null);
        }
      }}
    />
    
    {/* Drawer */}
    <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between bg-green-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              NDA Acceptance Certificate
            </h3>
            <p className="text-sm text-slate-600">
              Certificate ID: {certificateId}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setCertificateDrawerOpen(false);
            if (certificatePdfUrl) {
              window.URL.revokeObjectURL(certificatePdfUrl);
              setCertificatePdfUrl(null);
            }
          }}
          className="h-8 w-8 rounded-lg hover:bg-green-100 flex items-center justify-center"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden bg-slate-100 p-4">
        <iframe
          src={`${certificatePdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          className="w-full h-full border-0 bg-white rounded-lg shadow-lg"
          title="NDA Certificate"
        />
      </div>

      {/* Footer Actions */}
      <div className="border-t px-6 py-4 bg-white flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setCertificateDrawerOpen(false);
            if (certificatePdfUrl) {
              window.URL.revokeObjectURL(certificatePdfUrl);
              setCertificatePdfUrl(null);
            }
          }}
        >
          Close
        </Button>
        <Button
          onClick={async () => {
            try {
              const res = await fetch(`/api/nda-certificates/${certificateId}?shareId=${token}`);
              if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `NDA-Certificate-${certificateId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }
            } catch (error) {
              console.error('Download error:', error);
              alert('Failed to download certificate');
            }
          }}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>
    </div>
  </>
)}
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

            {/* ⭐ Loading overlay */}
    {iframeLoading && (
      <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading document...</p>
          <p className="text-slate-500 text-sm mt-2">
            {shareData.document.numPages} pages • {shareData.document.format?.toUpperCase()}
          </p>
        </div>
      </div>
    )}
<iframe
  src={`${shareData.document.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
  className="w-full h-[calc(100vh-200px)] border-0"
  title={shareData.document.filename}
  onLoad={() => {
    setCurrentPage(1);
    setIframeLoading(false);
  }}
  style={{
    pointerEvents: 'auto',
  }}
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