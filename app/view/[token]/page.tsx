// app/view/[token]/page.tsx
// app/view/[token]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, Download, Printer, Lock, Mail, Clock, AlertCircle, Check } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

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
    sharedByName?: string | null;   
    logoUrl?: string | null;  
  };
  expired?: boolean;
  maxViewsReached?: boolean;
  error?: string;
  requiresAuth?: boolean;
  emailNotAllowed?: boolean;
  message?: string;
  ndaText?: string;               
  requiresNDA?: boolean;          
  requiresEmail?: boolean;         
  requiresPassword?: boolean;      
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
const [pdfDoc, setPdfDoc] = useState<any>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);
const [contactPopoverOpen, setContactPopoverOpen] = useState(false);
const [helpPopoverOpen, setHelpPopoverOpen] = useState(false);
const [containerWidth, setContainerWidth] = useState(800);
const viewerContainerRef = useRef<HTMLDivElement>(null);
const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
const scrollContainerRef = useRef<HTMLDivElement>(null);
const [pdfDocument, setPdfDocument] = useState<any>(null);
const [scale, setScale] = useState(1.0);
const pageCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
const [brandingInfo, setBrandingInfo] = useState<{
  sharedByName?: string | null;
  logoUrl?: string | null;
} | null>(null);

  // Load shared document
  useEffect(() => {
    loadSharedDocument();
  }, [token]);

  // ✅ Track session start
  useEffect(() => {
    if (shareData?.document) {
      // Small delay to ensure email state is settled after auth
      setTimeout(() => {
        trackEvent('session_start', {});
      }, 100);
      // Track session end on unmount
      return () => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        trackEvent('session_end', { timeSpent: duration });
      };
    }
  }, [shareData?.document]);


  // ── Scroll detection to update current page ──────────────────
useEffect(() => {
  if (!shareData?.document) return;

  let scrollTimeout: NodeJS.Timeout;

  const handleScroll = () => {
    clearTimeout(scrollTimeout);

    scrollTimeout = setTimeout(() => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate which page is currently in view
      // Approximate: each page is ~1123px tall
      const pageHeight = 1123;
      const estimatedPage = Math.floor(scrollTop / pageHeight) + 1;
      
      // Clamp between 1 and total pages
      const newPage = Math.max(1, Math.min(shareData.document!.numPages, estimatedPage));
      
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    }, 100); // Debounce scroll events
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
  };
}, [shareData?.document, currentPage]);

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
      if (timeOnPage > 0 && timeOnPage < 600) {
        // ✅ FIXED: Don't use await in cleanup - just fire and forget
        fetch(`/api/view/${token}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'page_time',
            page: currentPage,
            timeSpent: timeOnPage,
            sessionId,
            email: email || null,
          }),
        }).catch(() => {}); // Ignore errors in cleanup
      }
    };
  }
}, [currentPage, shareData?.document]);

// ── Presence ping (real-time "viewing now") ───────────────────
useEffect(() => {
  if (!shareData?.document) return;

  const ping = () => {
    trackEvent('presence_ping', { page: currentPage });
  };

  ping(); // immediate first ping
  const interval = setInterval(ping, 10000); // every 10 seconds
  return () => clearInterval(interval);
}, [shareData?.document, currentPage]);

// ── Intent signals ────────────────────────────────────────────
useEffect(() => {
  if (!shareData?.document) return;

  // Text selection — strong buying signal
  const handleSelect = () => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length > 5) {
      trackEvent('intent_signal', {
        signal: 'text_selected',
        value: selected.substring(0, 100),
        pageNum: currentPage,
      });
    }
  };

  // Tab visibility — tracks when they switch away and come back
  const handleVisibility = () => {
    trackEvent('intent_signal', {
      signal: document.hidden ? 'tab_hidden' : 'tab_visible',
      pageNum: currentPage,
    });
  };

  // Copy attempt — very high intent
  const handleCopy = () => {
    trackEvent('intent_signal', {
      signal: 'copy_attempt',
      pageNum: currentPage,
    });
  };

  document.addEventListener('selectionchange', handleSelect);
  document.addEventListener('visibilitychange', handleVisibility);
  document.addEventListener('copy', handleCopy);

  return () => {
    document.removeEventListener('selectionchange', handleSelect);
    document.removeEventListener('visibilitychange', handleVisibility);
    document.removeEventListener('copy', handleCopy);
  };
}, [shareData?.document, currentPage]);

// ── Heatmap: clicks + mouse movement + scroll stops ───────────
useEffect(() => {
  if (!shareData?.document) return;

  let moveBuffer: { x: number; y: number; t: number }[] = [];
  let moveTimer: NodeJS.Timeout;
  let scrollStopTimer: NodeJS.Timeout;
  let lastScrollY = 0;

  const handleClick = (e: MouseEvent) => {
    const x = parseFloat(((e.clientX / window.innerWidth) * 100).toFixed(1));
    const y = parseFloat(
      (((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100).toFixed(1)
    );
    trackEvent('heatmap_click', {
      x,
      y,
      pageNum: currentPage,
      elementType: (e.target as HTMLElement)?.tagName?.toLowerCase() || 'unknown',
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    const x = parseFloat(((e.clientX / window.innerWidth) * 100).toFixed(1));
    const y = parseFloat(
      (((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100).toFixed(1)
    );
    moveBuffer.push({ x, y, t: Date.now() });

    // Flush buffer every 2 seconds
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (moveBuffer.length > 0) {
        trackEvent('heatmap_move', {
          points: moveBuffer.splice(0, moveBuffer.length),
          pageNum: currentPage,
        });
      }
    }, 2000);
  };

  const handleScrollStop = () => {
    clearTimeout(scrollStopTimer);
    const currentScrollY = window.scrollY;

    scrollStopTimer = setTimeout(() => {
      // They stopped scrolling for 1.5 seconds — record dwell position
      const y = parseFloat(
        ((currentScrollY / document.documentElement.scrollHeight) * 100).toFixed(1)
      );
      if (Math.abs(currentScrollY - lastScrollY) < 50) {
        trackEvent('heatmap_scroll_position', {
          y,
          pageNum: currentPage,
          dwellTime: 1500,
        });
      }
      lastScrollY = currentScrollY;
    }, 1500);
  };

  document.addEventListener('click', handleClick);
  document.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('scroll', handleScrollStop, { passive: true });

  return () => {
    document.removeEventListener('click', handleClick);
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScrollStop);
    clearTimeout(moveTimer);
    clearTimeout(scrollStopTimer);
  };
}, [shareData?.document, currentPage]);





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

  // ── Keyboard navigation ──────────────────────────────────────
  useEffect(() => {
    if (!shareData?.document) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        setCurrentPage(p => {
          const next = Math.min(shareData.document!.numPages, p + 1);
          if (next !== p) setIframeLoading(true);
          return next;
        });
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        setCurrentPage(p => {
          const prev = Math.max(1, p - 1);
          if (prev !== p) setIframeLoading(true);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [shareData?.document]);

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
        email: email || null,
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
          return;
        }
      } else if (event === 'scroll' && data.scrollDepth !== undefined) {
        const scrollDepth = parseFloat(data.scrollDepth);
        if (!isNaN(scrollDepth)) {
          payload.scrollDepth = scrollDepth;
          if (data.page) payload.page = data.page;
        }
      } else if (event === 'intent_signal') {
        // Spread directly onto payload — track route reads body.signal
        payload.signal = data.signal;
        payload.value = data.value || null;
        payload.pageNum = data.pageNum || currentPage;
      } else if (event === 'heatmap_click') {
        payload.x = data.x;
        payload.y = data.y;
        payload.pageNum = data.pageNum || currentPage;
        payload.elementType = data.elementType || 'unknown';
      } else if (event === 'heatmap_move') {
        payload.points = data.points;
        payload.pageNum = data.pageNum || currentPage;
      } else if (event === 'heatmap_scroll_position') {
        payload.y = data.y;
        payload.pageNum = data.pageNum || currentPage;
        payload.dwellTime = data.dwellTime || 1500;
      } else if (event === 'presence_ping') {
        // page already added above
      } else if (data && Object.keys(data).length > 0) {
        // fallback for any other events
        Object.assign(payload, data);
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
        console.log('   - sharedByName:', data.settings?.sharedByName);  
  console.log('   - logoUrl:', data.settings?.logoUrl); 
        setRequiresEmail(data.requiresEmail || false);
        setRequiresPassword(data.requiresPassword || false);
        setRequiresNDA(data.requiresNDA || false); // ⭐ NEW
        setNdaText(data.ndaText || ''); // ⭐ NEW
        setShareData(data);
        setIsVerified(true);

//   Capture branding info
if (data.settings?.sharedByName || data.settings?.logoUrl) {
  setBrandingInfo({
    sharedByName: data.settings.sharedByName,
    logoUrl: data.settings.logoUrl,
  });
  console.log('🎨 [VIEWER] Branding loaded:', data.settings.sharedByName, data.settings.logoUrl);
}
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
  const brandName = shareData?.settings?.sharedByName;
  const brandLogo = shareData?.settings?.logoUrl;

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Left Panel — Branding / Visual */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #24243e 100%)',
        }}
      >
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
          <div className="absolute top-1/2 -right-20 w-72 h-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
          <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
        </div>

        {/* Top logo area */}
       <div className="relative z-10">
          {brandLogo ? (
            // ✅ White frosted pill so logo colors always show correctly on dark bg
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <img
                src={brandLogo}
                alt={brandName || 'Company'}
                className="h-8 w-auto object-contain"
                style={{ maxWidth: '140px' }}
              />
              {brandName && (
                <span className="text-white font-semibold text-sm tracking-wide whitespace-nowrap">
                  {brandName}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm tracking-wide">DocMetrics</span>
            </div>
          )}
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          {/* Document icon */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed20, #3b82f620)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <svg className="h-10 w-10" fill="none" stroke="url(#iconGrad)" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              {brandName ? (
                <>{brandName}<br /><span style={{ color: '#a78bfa' }}>shared a document</span><br />with you</>
              ) : (
                <>A document has<br /><span style={{ color: '#a78bfa' }}>been shared</span><br />with you</>
              )}
            </h2>
            {shareData?.settings?.customMessage && (
              <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  "{shareData.settings.customMessage}"
                </p>
                {brandName && <p className="text-xs mt-2" style={{ color: '#a78bfa' }}>— {brandName}</p>}
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="space-y-3">
            {[
              { icon: '🔒', text: 'End-to-end encrypted' },
              { icon: '📊', text: 'Access tracked & logged' },
              { icon: '✅', text: 'Verified document sharing' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-3">
                <span className="text-base">{badge.icon}</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Powered by DocMetrics — Secure Document Intelligence
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md">

          {/* Mobile branding (shown only on mobile) */}
          <div className="lg:hidden mb-8 text-center">
            {brandLogo ? (
              <img src={brandLogo} alt={brandName || 'Company'} className="h-10 w-auto object-contain mx-auto mb-3" />
            ) : (
              <div className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            {brandName && <p className="text-sm font-medium text-slate-600">{brandName} shared a document with you</p>}
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: '#f3f0ff', color: '#7c3aed' }}>
              <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {requiresNDA ? 'NDA Required' : 'Verification Required'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {requiresNDA ? 'Sign NDA to continue' : 'Verify your identity'}
            </h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              {requiresNDA
                ? 'You must read and accept the Non-Disclosure Agreement before viewing this document.'
                : 'This document is protected. Please verify your identity to gain access.'}
            </p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-5">

            {/* NDA Section */}
            {requiresNDA && (
              <div className="space-y-4">
                {/* Name field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none"
                    style={{
                      borderColor: '#e2e8f0',
                      background: '#f8fafc',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Company field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Company <span className="font-normal text-slate-400 normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corporation"
                    className="w-full px-4 py-3 rounded-xl border text-sm transition-all outline-none"
                    style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                    onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* NDA scroll box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Non-Disclosure Agreement
                  </label>
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                    <div className="max-h-48 overflow-y-auto p-4" style={{ background: '#fafafa' }}>
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
                        {ndaText}
                      </pre>
                    </div>
                    {/* Fade overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                      style={{ background: 'linear-gradient(transparent, #fafafa)' }} />
                  </div>
                </div>

                {/* Accept checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={ndaAccepted}
                      onChange={(e) => setNdaAccepted(e.target.checked)}
                      required
                      className="sr-only"
                    />
                    <div
                      className="h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: ndaAccepted ? '#7c3aed' : '#cbd5e1',
                        background: ndaAccepted ? '#7c3aed' : 'white',
                      }}
                    >
                      {ndaAccepted && (
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I, <strong className="text-slate-900">{name || '[Your Name]'}</strong>
                    {company ? ` representing ${company}` : ''}, have read and agree to the terms of this Non-Disclosure Agreement.
                  </span>
                </label>
              </div>
            )}

            {/* Email input */}
            {requiresEmail && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none"
                    style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                    onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Enter the email this document was shared with</p>
              </div>
            )}

            {/* Password input */}
            {requiresPassword && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Access Password
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter access password"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all outline-none"
                    style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                    onFocus={(e) => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isAuthenticating || (requiresNDA && (!ndaAccepted || !name))}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all relative overflow-hidden group"
              style={{
                background: isAuthenticating || (requiresNDA && (!ndaAccepted || !name))
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                cursor: isAuthenticating || (requiresNDA && (!ndaAccepted || !name)) ? 'not-allowed' : 'pointer',
              }}
            >
              {isAuthenticating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : requiresNDA ? (
                'Accept NDA & View Document →'
              ) : (
                'Verify & View Document →'
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              Having trouble accessing this document?{' '}
              <span className="text-slate-600 font-medium cursor-pointer hover:underline">Contact the sender</span>
            </p>
          </form>
        </div>
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

{/* PDF Viewer - DocSend style, one page at a time */}
        {/* PDF Viewer - Full Width Professional */}
{shareData?.document?.pdfUrl ? (
  <div className="fixed inset-0 bg-slate-900">
    {/* ── Full-Width Top Navigation Bar ── */}
    <div className="w-full bg-[#1a1a2e] border-b border-white/10">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {brandingInfo?.logoUrl ? (
            <img
              src={brandingInfo.logoUrl}
              alt={brandingInfo.sharedByName || 'Company'}
              className="h-8 w-auto object-contain flex-shrink-0"
              style={{ maxWidth: '120px' }}
            />
          ) : (
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              {(brandingInfo?.sharedByName || 'D')[0].toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-white truncate">
            {brandingInfo?.sharedByName || 'DocMetrics'}
          </span>
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Previous Button */}
          <button
            onClick={() => {
              if (currentPage > 1) {
                setIframeLoading(true);
                setCurrentPage(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
            className="h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Counter */}
<div
  className="flex items-center gap-2 px-5 py-2 rounded-lg text-base font-semibold tabular-nums"
  style={{ 
    background: 'rgba(99,102,241,0.15)', 
    border: '1px solid rgba(99,102,241,0.3)' 
  }}
>
  <span className="text-white">{currentPage}</span>
  <span className="text-white/30">/</span>
  <span className="text-indigo-300">{shareData.document?.numPages || 0}</span>
</div>

{/* Next Button */}
<button
  onClick={() => {
    if (currentPage < (shareData.document?.numPages || 0)) {
      setIframeLoading(true);
      setCurrentPage(currentPage + 1);
    }
  }}
  disabled={currentPage === (shareData.document?.numPages || 0)}
  className="h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10"
  style={{ background: 'rgba(255,255,255,0.05)' }}
>
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right: Tools */}
        <div className="flex-1 flex justify-end">
          <div className="flex items-center gap-2">
            {/* Zoom Out */}
            <button
              onClick={() => {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                  const currentScale = parseFloat(iframe.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
                  const newScale = Math.max(0.5, currentScale - 0.1);
                  iframe.style.transform = `scale(${newScale})`;
                  iframe.style.transformOrigin = 'top center';
                }
              }}
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 group relative"
              title="Zoom Out"
            >
              <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Zoom Out
              </span>
            </button>

            {/* Zoom In */}
            <button
              onClick={() => {
                const iframe = document.querySelector('iframe');
                if (iframe) {
                  const currentScale = parseFloat(iframe.style.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1');
                  const newScale = Math.min(2, currentScale + 0.1);
                  iframe.style.transform = `scale(${newScale})`;
                  iframe.style.transformOrigin = 'top center';
                }
              }}
              className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 group relative"
              title="Zoom In"
            >
              <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Zoom In
              </span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Download Button */}
            {shareData?.settings?.allowDownload && (
              <button
                onClick={handleDownload}
                className="h-9 px-4 rounded-lg flex items-center gap-2 transition-all hover:bg-white/10 group"
              >
                <Download className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  Download
                </span>
              </button>
            )}

            {/* Contact Icon */}
            <div className="relative">
              <button
                onClick={() => { setContactPopoverOpen(v => !v); setHelpPopoverOpen(false); }}
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 group relative"
                style={{ background: contactPopoverOpen ? 'rgba(99,102,241,0.2)' : 'transparent' }}
              >
                <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {!contactPopoverOpen && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Contact
                  </span>
                )}
              </button>

              {/* Contact Popover */}
              {contactPopoverOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setContactPopoverOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-80 rounded-xl shadow-2xl overflow-hidden" style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Sent by</p>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                          {(brandingInfo?.sharedByName || 'D')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{brandingInfo?.sharedByName || 'DocMetrics'}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Document sender</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs font-semibold text-white mb-3">Ask {brandingInfo?.sharedByName || 'the sender'} a question</p>
                      <textarea placeholder={`Ask ${brandingInfo?.sharedByName || 'the sender'} a question`} className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none transition-all" rows={3} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Reply to: <span style={{ color: '#a5b4fc' }}>{email || 'you'}</span></p>
                        <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>Send</button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Help Icon */}
            <div className="relative">
              <button
                onClick={() => { setHelpPopoverOpen(v => !v); setContactPopoverOpen(false); }}
                className="h-9 w-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 group relative"
                style={{ background: helpPopoverOpen ? 'rgba(99,102,241,0.2)' : 'transparent' }}
              >
                <svg className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!helpPopoverOpen && (
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Help
                  </span>
                )}
              </button>

              {helpPopoverOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setHelpPopoverOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-72 rounded-xl shadow-2xl p-5" style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">DocMetrics</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Secure Document Intelligence</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>DocMetrics lets professionals share documents securely with full analytics.</p>
                    <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                      Learn more
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-white/5">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${(currentPage / shareData.document.numPages) * 100}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          }}
        />
      </div>
    </div>

    {/* PDF Viewer */}
    <div className="relative w-full h-[calc(100vh-57px)] bg-slate-800">
      {/* Loading Overlay */}
      {iframeLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-800">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white text-sm font-medium">
              Loading page {currentPage} of {shareData.document.numPages}
            </p>
          </div>
        </div>
      )}

      {/* PDF Iframe */}
      <iframe
        key={currentPage}
        src={`${shareData.document.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&page=${currentPage}`}
        className="w-full h-full border-0"
        title={`${shareData.document.filename} - Page ${currentPage}`}
        onLoad={() => setIframeLoading(false)}
      />
    </div>
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