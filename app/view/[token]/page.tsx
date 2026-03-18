'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, Download, Printer, Lock, Mail, Clock, AlertCircle, Check, Menu, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
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
    senderEmail?: string | null;
    enableWatermark?: boolean;
    watermarkText?: string | null;
    watermarkPosition?: 'top' | 'bottom' | 'center' | 'diagonal';
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

const BRAND_NAME = 'DocMetrics';

export default function ViewSharedDocument() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contactSenderOpen, setContactSenderOpen] = useState(false);
const [contactSenderMsg, setContactSenderMsg] = useState('');
const [contactSenderEmail, setContactSenderEmail] = useState('');
const [contactSenderSending, setContactSenderSending] = useState(false);
const [contactSenderSent, setContactSenderSent] = useState(false);
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
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [requiresNDA, setRequiresNDA] = useState(false);
  const [ndaText, setNdaText] = useState('');
  const [ndaUrl, setNdaUrl] = useState<string | null>(null);
const [ndaError, setNdaError] = useState<string | null>(null);
  const [ndaAccepted, setNdaAccepted] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [certificateDrawerOpen, setCertificateDrawerOpen] = useState(false);
  const [certificatePdfUrl, setCertificatePdfUrl] = useState<string | null>(null);
  const [loadingCertificate, setLoadingCertificate] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [contactMessage, setContactMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [containerWidth, setContainerWidth] = useState(850);
  const [helpPopoverOpen, setHelpPopoverOpen] = useState(false);
const [pageVideos, setPageVideos] = useState<Record<number, string>>({}) // pageNum → videoUrl
const [activeVideo, setActiveVideo] = useState<{ url: string; page: number } | null>(null)
const [videoBouncing, setVideoBouncing] = useState(false)
const [videoDismissed, setVideoDismissed] = useState(false)
const [pageReactions, setPageReactions] = useState<Record<number, 'clear' | 'confused'>>({})
const [showEndQuestion, setShowEndQuestion] = useState(false)
const [endQuestionAnswer, setEndQuestionAnswer] = useState<string | null>(null)
const [endQuestionSubmitted, setEndQuestionSubmitted] = useState(false)
  const [brandingInfo, setBrandingInfo] = useState<{
    sharedByName?: string | null;
    logoUrl?: string | null;
    senderEmail?: string | null;
  } | null>(null);

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Derived: display name — always falls back to DocMetrics
  const displayName = brandingInfo?.sharedByName || BRAND_NAME;
  const displayLogo = brandingInfo?.logoUrl || null;

  // Fetch video walkthroughs for this document
useEffect(() => {
  const fetchVideos = async () => {
    try {
      const res = await fetch(`/api/view/${token}/videos`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.videos) {
          const map: Record<number, string> = {}
          data.videos.forEach((v: any) => {
            map[v.pageNumber] = v.cloudinaryUrl
          })
          setPageVideos(map)
        }
      }
    } catch (e) { /* silent */ }
  }
  fetchVideos()
}, [token])

  useEffect(() => { loadSharedDocument(); }, [token]);

  useEffect(() => {
    if (shareData?.document) {
      setTimeout(() => { trackEvent('session_start', {}); }, 100);
      return () => {
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        trackEvent('session_end', { timeSpent: duration });
      };
    }
  }, [shareData?.document]);

 useEffect(() => {
  const measure = () => {
    if (scrollContainerRef.current) {
      const padding = window.innerWidth < 640 ? 16 : 32;
      const w = scrollContainerRef.current.clientWidth - padding * 2;
      if (w > 0) setContainerWidth(w);
    }
  };

  // ✅ FIX 1: Don't just run once — poll until the ref is available.
  // The scroll container only mounts AFTER shareData loads, so on first
  // render the ref is null. We retry every 100ms until it exists.
  if (!scrollContainerRef.current) {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        clearInterval(interval);
        measure();
      }
    }, 100);
    // Clean up if component unmounts before ref appears
    const cleanup = () => clearInterval(interval);
    window.addEventListener('resize', measure);
    return () => { clearInterval(interval); window.removeEventListener('resize', measure); };
  }

  measure();
  window.addEventListener('resize', measure);
  return () => window.removeEventListener('resize', measure);
}, []);


  // Scroll → page detection
  useEffect(() => {
    if (!shareData?.document) return;
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.scrollY;
        const newPage = Math.max(1, Math.min(shareData.document!.numPages, Math.floor(scrollTop / 1123) + 1));
        if (newPage !== currentPage) setCurrentPage(newPage);
      }, 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(scrollTimeout); };
  }, [shareData?.document, currentPage]);

  const pageStartTimeRef = useRef(Date.now());
  const currentPageRef = useRef(currentPage);
  const emailRef = useRef(email);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
  useEffect(() => { emailRef.current = email; }, [email]);

  useEffect(() => {
    if (shareData?.document && currentPage > 0) {
      trackEvent('page_view', { page: currentPage });
      pageStartTimeRef.current = Date.now();
      // Bounce bubble if this page has a video
if (pageVideos[currentPage] && !videoDismissed) {
  setVideoBouncing(true)
  setTimeout(() => setVideoBouncing(false), 3000)
}

// Show end-of-doc question on last page
if (currentPage === shareData.document!.numPages && !endQuestionSubmitted) {
  setTimeout(() => setShowEndQuestion(true), 8000)
}
      return () => {
        const t = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
        if (t > 0 && t < 600) {
          fetch(`/api/view/${token}/track`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'page_time', page: currentPage, timeSpent: t, scrollDepth: 100, sessionId, email: emailRef.current || null }),
          }).catch(() => {});
        }
      };
    }
  }, [currentPage, shareData?.document]);

  useEffect(() => {
    if (!shareData?.document) return;
    const send = () => {
      const t = Math.floor((Date.now() - pageStartTimeRef.current) / 1000);
      if (t > 0 && t < 600) {
        navigator.sendBeacon(`/api/view/${token}/track`, new Blob([
          JSON.stringify({ event: 'page_time', page: currentPageRef.current, timeSpent: t, sessionId, email: emailRef.current || null })
        ], { type: 'application/json' }));
        pageStartTimeRef.current = Date.now();
      }
    };
    const handleVisibility = () => { if (document.hidden) send(); else pageStartTimeRef.current = Date.now(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', send);
    return () => { document.removeEventListener('visibilitychange', handleVisibility); window.removeEventListener('beforeunload', send); };
  }, [shareData?.document, sessionId, token]);

  useEffect(() => {
    if (!shareData?.document) return;
    const ping = () => trackEvent('presence_ping', { page: currentPage });
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, [shareData?.document, currentPage]);

  useEffect(() => {
    if (!shareData?.document) return;
    const interval = setInterval(() => {
      const t = Math.floor((Date.now() - lastActivityTime) / 1000);
      if (t > 0 && t < 60) { trackEvent('time_spent', { timeSpent: t }); setLastActivityTime(Date.now()); }
    }, 30000);
    return () => clearInterval(interval);
  }, [shareData?.document, lastActivityTime]);

  useEffect(() => {
    if (!shareData?.document) return;
    const handleKey = (e: KeyboardEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); container.scrollBy({ top: 120, behavior: 'smooth' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); container.scrollBy({ top: -120, behavior: 'smooth' }); }
      if (e.key === 'PageDown') { e.preventDefault(); const n = Math.min(shareData.document!.numPages, currentPage + 1); document.getElementById(`page-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      if (e.key === 'PageUp') { e.preventDefault(); const p = Math.max(1, currentPage - 1); document.getElementById(`page-${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [shareData?.document, currentPage]);

  useEffect(() => {
    const h = () => setLastActivityTime(Date.now());
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(e => window.addEventListener(e, h));
    return () => ['mousemove', 'keydown', 'scroll', 'click'].forEach(e => window.removeEventListener(e, h));
  }, []);

  const trackEvent = async (event: string, data: any) => {
    try {
      const payload: any = { event, sessionId, email: email || null };
      if (currentPage && !isNaN(currentPage)) payload.page = currentPage;
      if (shareData?.document?.numPages) payload.totalPages = shareData.document.numPages;
      if (event === 'time_spent' && data.timeSpent) {
        const t = parseInt(data.timeSpent);
        if (!isNaN(t) && t > 0) payload.timeSpent = t; else return;
      } else if (data && Object.keys(data).length > 0) {
        Object.assign(payload, data);
      }
      await fetch(`/api/view/${token}/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (_) {}
  };

  const loadSharedDocument = async (authData?: { email?: string; password?: string; ndaAccepted?: boolean; viewerName?: string; viewerCompany?: string; }) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/view/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData || {}),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.unauthorized) {
          setError(`Access Denied: Your email (${authData?.email}) is not authorized to view this document.`);
          setShareData(null);
          return;
        }
        if (data.requiresAuth) {
          setRequiresEmail(data.requiresEmail || false);
          setRequiresPassword(data.requiresPassword || false);
          setRequiresNDA(data.requiresNDA || false);
           setNdaText(data.ndaText || '');
setNdaUrl(data.ndaUrl || null);
setNdaError(data.ndaError || null);
console.log('📜 NDA data from API:', {
  requiresNDA: data.requiresNDA,
  ndaUrl: data.ndaUrl,
  ndaText: data.ndaText,
  ndaError: data.ndaError,
  ndaAgreementId: data.ndaAgreementId,
});
          setShareData(data);
          setIsVerified(true);
          if (data.settings) {
            setBrandingInfo({
              sharedByName: typeof data.settings.sharedByName === 'string' ? data.settings.sharedByName : null,
              logoUrl: typeof data.settings.logoUrl === 'string' ? data.settings.logoUrl : null,
              senderEmail: typeof data.settings.senderEmail === 'string' ? data.settings.senderEmail : null,
            });
          }
        } else {
          setError(data.error || 'Failed to load document');
        }
      } else {
        setShareData(data);
        setIsVerified(true);
        if (data.certificateId) setCertificateId(data.certificateId);
        if (data.settings) {
          setBrandingInfo({
            sharedByName: typeof data.settings.sharedByName === 'string' ? data.settings.sharedByName : null,
            logoUrl: typeof data.settings.logoUrl === 'string' ? data.settings.logoUrl : null,
            senderEmail: typeof data.settings.senderEmail === 'string' ? data.settings.senderEmail : null,
          });
        }
      }
    } catch (_) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresNDA && !ndaAccepted) { alert('You must accept the NDA to view this document'); return; }
    setIsAuthenticating(true);
    await loadSharedDocument({
       email: email || undefined,           //  always send if we have it
  password: password || undefined,
      ndaAccepted: requiresNDA ? ndaAccepted : undefined,
      viewerName: requiresNDA ? name : undefined,
      viewerCompany: requiresNDA ? company : undefined,
    });
    setIsAuthenticating(false);
  };


  const handleReaction = async (page: number, reaction: 'clear' | 'confused') => {
  setPageReactions(prev => ({ ...prev, [page]: reaction }))
  try {
    await fetch(`/api/view/${token}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page,
        reaction,
        email: email || null,
        sessionId,
      })
    })
  } catch { /* silent */ }
}

const handleEndQuestion = async (answer: string) => {
  setEndQuestionAnswer(answer)
  setEndQuestionSubmitted(true)
  setShowEndQuestion(false)
  try {
    await fetch(`/api/view/${token}/reaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: 0,
        reaction: answer,
        type: 'deal_intent',
        email: email || null,
        sessionId,
      })
    })
  } catch { /* silent */ }
}

  const handleDownload = async () => {
    if (!shareData?.settings?.allowDownload) { await trackEvent('download_attempt', { allowed: false }); toast.error('Downloads are disabled for this document'); return; }
    await trackEvent('download_attempt', { allowed: true });
    try {
      const res = await fetch(`/api/view/${token}/download`, { method: 'POST' });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = shareData.document?.filename || 'document.pdf';
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
        await trackEvent('download_success', { filename: shareData.document?.filename });
      }
    } catch (_) { toast.error('Failed to download document'); }
  };

  const goToPrev = () => {
    if (currentPage > 1) {
      const p = currentPage - 1;
      document.getElementById(`page-${p}`)?.scrollIntoView({ behavior: 'smooth' });
      setCurrentPage(p);
    }
  };

  const goToNext = () => {
    const total = shareData?.document?.numPages || 0;
    if (currentPage < total) {
      const n = currentPage + 1;
      document.getElementById(`page-${n}`)?.scrollIntoView({ behavior: 'smooth' });
      setCurrentPage(n);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600 text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Unavailable</h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          
        </div>
      </div>
    );
  }

  // ── Auth screen ──
  if ((requiresEmail || requiresPassword || requiresNDA) && !shareData?.document) {
    const customMessage = typeof shareData?.settings?.customMessage === 'string'
      ? shareData.settings.customMessage
      : null;

    return (
      <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── Left Panel ── */}
        <div
          className="hidden lg:flex lg:w-[42%] relative overflow-hidden flex-col justify-between p-12"
          style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #1a1040 50%, #1e1b4b 100%)' }}
        >
          {/* Subtle orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
          </div>

          {/* Logo / sender name */}
          <div className="relative z-10">
            {displayLogo ? (
              <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.14)' }}>
                <img src={displayLogo} alt={displayName} className="h-7 w-auto object-contain" style={{ maxWidth: '120px' }} />
                <span className="text-white font-semibold text-sm">{displayName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                  {displayName[0].toUpperCase()}
                </div>
                <span className="text-white font-semibold text-sm">{displayName}</span>
              </div>
            )}
          </div>

          {/* Center */}
          <div className="relative z-10 space-y-6">
            {/* Doc icon */}
            

            <div>
              

              {/* Custom message — only if sender wrote one */}
              {customMessage && (
                <div className="mt-5 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    &ldquo;{customMessage}&rdquo;
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#a78bfa' }}>— {displayName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer — just company name, no spam badges */}
          <div className="relative z-10">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{BRAND_NAME}</p>
          </div>
        </div>

        {/* ── Right Panel — Form ── */}
        <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-white">
          <div className="w-full max-w-md">

            {/* Mobile branding */}
            <div className="lg:hidden mb-8 text-center">
              {displayLogo
                ? <img src={displayLogo} alt={displayName} className="h-9 w-auto object-contain mx-auto mb-3" />
                : (
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mx-auto mb-3 text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}>
                    {displayName[0].toUpperCase()}
                  </div>
                )
              }
              
            </div>

            <div className="mb-7">
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
                  ? 'Read and accept the Non-Disclosure Agreement before viewing this document.'
                  : 'This document is protected. Please verify your identity to continue.'}
              </p>
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-5">
              {requiresNDA && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                      style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                      onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Company <span className="font-normal text-slate-400 normal-case">(optional)</span>
                    </label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corporation"
                      className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                      style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                      onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                  <div>
  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
    Non-Disclosure Agreement
  </label>

  {ndaUrl ? (
    // ✅ PDF agreement uploaded — show iframe
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
      <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-medium text-slate-700">Agreement Document</span>
        </div>
        <a
          href={ndaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium hover:underline"
          style={{ color: '#7c3aed' }}
        >
          Open full PDF ↗
        </a>
      </div>
      <iframe
        src={`${ndaUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        className="w-full border-0"
        style={{ height: '260px' }}
        title="NDA Agreement"
      />
    </div>
  ) : ndaError ? (
    // ✅ NDA required but no agreement configured — show error
    <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
      <svg className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-xs text-red-700 leading-relaxed">{ndaError}</p>
    </div>
  ) : (
    // ✅ Loading / fallback
    <div className="rounded-xl p-4 text-center" style={{ border: '1px dashed #e2e8f0' }}>
      <p className="text-xs text-slate-400">Loading agreement...</p>
    </div>
  )}
</div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative mt-0.5 flex-shrink-0" onClick={() => setNdaAccepted(v => !v)}>
                      <div className="h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: ndaAccepted ? '#7c3aed' : '#cbd5e1', background: ndaAccepted ? '#7c3aed' : 'white' }}>
                        {ndaAccepted && <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I, <strong className="text-slate-900">{name || '[Your Name]'}</strong>
                      {company ? ` representing ${company}` : ''}, have read and agree to the terms of this Non-Disclosure Agreement.
                    </span>
                  </label>
                </div>
              )}

              {requiresEmail && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                      style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                      onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Enter the email this document was shared with</p>
                </div>
              )}

              {requiresPassword && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Access Password</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter access password" required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                      style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                      onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                </div>
              )}

              <button type="submit"
                disabled={isAuthenticating || (requiresNDA && (!ndaAccepted || !name))}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
                style={{
                  background: isAuthenticating || (requiresNDA && (!ndaAccepted || !name))
                    ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  cursor: isAuthenticating || (requiresNDA && (!ndaAccepted || !name)) ? 'not-allowed' : 'pointer',
                }}>
                {isAuthenticating
                  ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Verifying...</span>
                  : requiresNDA ? 'Accept NDA & View Document →' : 'Verify & View Document →'}
              </button>

             <p className="text-center text-xs text-slate-400">
  Having trouble?{' '}
  <button
    type="button"
    onClick={() => setContactSenderOpen(true)}
    className="text-violet-600 font-medium hover:underline"
  >
    Contact the sender
  </button>
</p>
            </form>

            {contactSenderOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
    onClick={() => { setContactSenderOpen(false); setContactSenderSent(false); setContactSenderMsg(''); setContactSenderEmail(''); }}
  >
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
         
        <button
          onClick={() => { setContactSenderOpen(false); setContactSenderSent(false); setContactSenderMsg(''); setContactSenderEmail(''); }}
          className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {contactSenderSent ? (
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold text-slate-900">Message sent!</p>
            <p className="text-sm text-slate-500">{brandingInfo?.senderEmail} will receive your message and can reply to your email.</p>
            <button
              onClick={() => { setContactSenderOpen(false); setContactSenderSent(false); setContactSenderMsg(''); setContactSenderEmail(''); }}
              className="mt-2 px-5 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Your email</label>
              <input
                type="email"
                value={contactSenderEmail}
                onChange={e => setContactSenderEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Message</label>
              <textarea
                value={contactSenderMsg}
                onChange={e => setContactSenderMsg(e.target.value)}
                placeholder={`Write your message to ${brandingInfo?.senderEmail}...`}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all"
                style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <button
              disabled={!contactSenderMsg.trim() || !contactSenderEmail.trim() || contactSenderSending}
              onClick={async () => {
                if (!contactSenderMsg.trim() || !contactSenderEmail.trim()) return;
                setContactSenderSending(true);
                try {
                  const res = await fetch(`/api/view/${token}/message`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      message: contactSenderMsg.trim(),
                      senderEmail: contactSenderEmail.trim(),
                      sessionId,
                      context: 'auth_screen',
                    }),
                  });
                  if (res.ok) setContactSenderSent(true);
                  else toast.error('Failed to send. Please try again.');
                } catch { toast.error('Network error. Please try again.'); }
                finally { setContactSenderSending(false); }
              }}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
            >
              {contactSenderSending
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                 : `Send message to ${brandingInfo?.senderEmail}`}
            </button>
          </div>
        )}
      </div>

    </div>
  </div>
)}
          </div>
        </div>
      </div>
    );
  }

  // ── Document viewer ──
  const totalPages = shareData?.document?.numPages || 0;

  return (
    <div className="min-h-screen bg-slate-900">

      {/* NDA Certificate Banner */}
      {certificateId && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-900">NDA accepted — certificate available</p>
              <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-green-200 text-green-700">{certificateId}</code>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline"
                onClick={async () => {
                  try {
                    setLoadingCertificate(true);
                    const res = await fetch(`/api/nda-certificates/${certificateId}?shareId=${token}`);
                    if (res.ok) { const blob = await res.blob(); const url = window.URL.createObjectURL(blob); setCertificatePdfUrl(url); setCertificateDrawerOpen(true); }
                  } catch (_) { toast.error('Failed to load certificate'); } finally { setLoadingCertificate(false); }
                }}
                disabled={loadingCertificate}
                className="gap-1.5 text-xs h-8 border-green-300 hover:bg-green-50"
              >
                {loadingCertificate ? <div className="animate-spin h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full" /> : <Eye className="h-3.5 w-3.5" />}
                View
              </Button>
              <Button size="sm"
                onClick={async () => {
                  const res = await fetch(`/api/nda-certificates/${certificateId}?shareId=${token}`);
                  if (res.ok) { const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `NDA-Certificate-${certificateId}.pdf`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); }
                }}
                className="gap-1.5 text-xs h-8 bg-green-600 hover:bg-green-700"
              >
                <Download className="h-3.5 w-3.5" />Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Drawer */}
      {certificateDrawerOpen && certificatePdfUrl && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setCertificateDrawerOpen(false); window.URL.revokeObjectURL(certificatePdfUrl!); setCertificatePdfUrl(null); }} />
          <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl z-50 flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-green-50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center"><Check className="h-4 w-4 text-green-600" /></div>
                <div><h3 className="text-base font-bold text-slate-900">NDA Certificate</h3><p className="text-xs text-slate-500">ID: {certificateId}</p></div>
              </div>
              <button onClick={() => { setCertificateDrawerOpen(false); window.URL.revokeObjectURL(certificatePdfUrl!); setCertificatePdfUrl(null); }} className="h-8 w-8 rounded-lg hover:bg-green-100 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-100 p-4">
              <iframe src={`${certificatePdfUrl}#toolbar=0`} className="w-full h-full border-0 bg-white rounded-lg shadow" title="NDA Certificate" />
            </div>
            <div className="border-t px-6 py-4 bg-white flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setCertificateDrawerOpen(false); window.URL.revokeObjectURL(certificatePdfUrl!); setCertificatePdfUrl(null); }}>Close</Button>
              <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  const res = await fetch(`/api/nda-certificates/${certificateId}?shareId=${token}`);
                  if (res.ok) { const blob = await res.blob(); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `NDA-Certificate-${certificateId}.pdf`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a); }
                }}>
                <Download className="h-3.5 w-3.5" />Download PDF
              </Button>
            </div>
          </div>
        </>
      )}

      {shareData?.document?.pdfUrl ? (
        <div className="fixed inset-0 bg-slate-900 flex flex-col">

          {/* ═══════════════════════════════════════════════════════
              NAVBAR — desktop full / mobile compact with hamburger
          ═══════════════════════════════════════════════════════ */}
          <div className="w-full bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between px-3 sm:px-6 h-14">

              {/* Left: Sender branding */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {displayLogo ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center p-1"
                      style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <img src={displayLogo} alt={displayName} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-semibold text-white text-sm truncate hidden sm:block">{displayName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {displayName[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-white text-sm truncate hidden sm:block">{displayName}</span>
                  </div>
                )}
              </div>

              {/* Center: Page navigation — always visible */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={goToPrev} disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <ChevronLeft className="h-4 w-4 text-white" />
                </button>
                <div className="px-3 py-1.5 rounded-lg text-sm font-semibold tabular-nums flex items-center gap-1.5"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <span className="text-white">{currentPage}</span>
                  <span className="text-white/30">/</span>
                  <span className="text-indigo-300">{totalPages}</span>
                </div>
                <button onClick={goToNext} disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg flex items-center justify-center disabled:opacity-30 hover:bg-white/10 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <ChevronRight className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Right: Desktop tools + Mobile hamburger */}
              <div className="flex-1 flex justify-end items-center gap-1">

                {/* Desktop only tools */}
                <div className="hidden sm:flex items-center gap-1">
                  <button onClick={() => setZoomScale(s => Math.max(0.5, parseFloat((s - 0.15).toFixed(2))))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" title="Zoom out">
                    <ZoomOut className="h-4 w-4 text-white/70" />
                  </button>
                  <span className="text-xs text-white/40 w-10 text-center tabular-nums">{Math.round(zoomScale * 100)}%</span>
                  <button onClick={() => setZoomScale(s => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors" title="Zoom in">
                    <ZoomIn className="h-4 w-4 text-white/70" />
                  </button>
                  <div className="h-5 w-px bg-white/10 mx-1" />
                  {shareData?.settings?.allowDownload && (
                    <button onClick={handleDownload}
                      className="h-8 px-3 rounded-lg flex items-center gap-1.5 hover:bg-white/10 transition-colors">
                      <Download className="h-4 w-4 text-white/70" />
                      <span className="text-sm text-white/70">Download</span>
                    </button>
                  )}
                  <div className="h-5 w-px bg-white/10 mx-1" />
                  {/* Contact */}
                  <div className="relative">
                    <button onClick={() => setContactOpen(v => !v)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                      style={{ background: contactOpen ? 'rgba(99,102,241,0.2)' : undefined }}
                      title="Contact sender">
                      <Mail className="h-4 w-4 text-white/70" />
                    </button>
                    {contactOpen && <ContactPopover brandingInfo={brandingInfo} displayName={displayName} email={email} token={token} sessionId={sessionId} onClose={() => setContactOpen(false)} />}
                  </div>

                  {/* 🚩 Report abuse */}
  <a
    href={`/report?token=${token}`}
    target="_blank"
    rel="noopener noreferrer"
    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-colors group relative"
    title="Report this document"
  >
    <svg className="h-4 w-4 text-white/30 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21V5a2 2 0 012-2h9.172a2 2 0 011.414.586l3.828 3.828A2 2 0 0121 8.828V21M3 21h18M9 21v-6h6v6" />
      {/* Flag icon alternative — use this simpler path instead if preferred: */}
      {/* <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M3 5l14 4-14 4" /> */}
    </svg>
    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      Report
    </span>
  </a>

  {/* ❓ About DocMetrics */}
  <div className="relative">
    <button
      onClick={() => setHelpPopoverOpen(v => !v)}
      className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors group relative"
      style={{ background: helpPopoverOpen ? 'rgba(99,102,241,0.2)' : undefined }}
    >
      <svg className="h-4 w-4 text-white/30 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {!helpPopoverOpen && (
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          About
        </span>
      )}
    </button>

    {helpPopoverOpen && (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setHelpPopoverOpen(false)} />
        <div className="absolute right-0 top-11 z-50 w-64 rounded-xl shadow-2xl p-5"
          style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              D
            </div>
            <div>
              <p className="text-sm font-bold text-white">{BRAND_NAME}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Secure Document Intelligence</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {BRAND_NAME} lets professionals share documents securely with full analytics and access control.
          </p>
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
            onClick={() => setHelpPopoverOpen(false)}
          >
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

                {/* Mobile: hamburger */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="sm:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Menu className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 w-full bg-white/5">
              <div className="h-full transition-all duration-300"
                style={{ width: `${totalPages ? (currentPage / totalPages) * 100 : 0}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              MOBILE SIDEBAR
          ═══════════════════════════════════════════ */}
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/60 z-40 sm:hidden" onClick={() => setSidebarOpen(false)} />

              {/* Sidebar panel */}
              <div className="fixed right-0 top-0 h-full w-72 z-50 flex flex-col sm:hidden"
                style={{ background: '#1a1a2e', borderLeft: '1px solid rgba(255,255,255,0.08)' }}>

                {/* Sidebar header */}
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-2.5">
                    {displayLogo
                      ? <img src={displayLogo} alt={displayName} className="h-7 w-auto object-contain" style={{ maxWidth: '100px' }} />
                      : <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                          {displayName[0].toUpperCase()}
                        </div>
                    }
                    <span className="text-white font-semibold text-sm">{displayName}</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4 text-white/60" />
                  </button>
                </div>

                {/* Sidebar body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

                  {/* Document info */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Document</p>
                    <p className="text-sm font-medium text-white truncate">{shareData.document?.filename}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{totalPages} page{totalPages !== 1 ? 's' : ''}</p>
                  </div>

                  {/* Zoom */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Zoom</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setZoomScale(s => Math.max(0.5, parseFloat((s - 0.15).toFixed(2))))}
                        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <ZoomOut className="h-4 w-4 text-white/70" />
                      </button>
                      <span className="text-sm text-white font-medium tabular-nums flex-1 text-center">{Math.round(zoomScale * 100)}%</span>
                      <button onClick={() => setZoomScale(s => Math.min(2.5, parseFloat((s + 0.15).toFixed(2))))}
                        className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <ZoomIn className="h-4 w-4 text-white/70" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  {shareData?.settings?.allowDownload && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</p>
                      <button onClick={() => { handleDownload(); setSidebarOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Download className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/80">Download document</span>
                      </button>
                    </div>
                  )}

                  {/* Contact sender */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Contact {displayName}
                    </p>
                    {messageSent ? (
                      <div className="flex flex-col items-center py-5 gap-2">
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-400" />
                        </div>
                        <p className="text-sm font-semibold text-white">Message sent!</p>
                        <button onClick={() => { setMessageSent(false); setContactMessage(''); }} className="text-xs underline" style={{ color: 'rgba(165,180,252,0.7)' }}>Send another</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <textarea
                          value={contactMessage}
                          onChange={e => setContactMessage(e.target.value)}
                          placeholder={`Write your message to ${displayName}...`}
                          rows={4}
                          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            From: <span style={{ color: '#a5b4fc' }}>{email || 'anonymous'}</span>
                          </p>
                          <button
                            disabled={!contactMessage.trim() || isSendingMessage}
                            onClick={async () => {
                              if (!contactMessage.trim()) return;
                              setIsSendingMessage(true);
                              try {
                                const res = await fetch(`/api/view/${token}/message`, {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ message: contactMessage.trim(), senderEmail: email || null, sessionId }),
                                });
                                if (res.ok) { setMessageSent(true); toast.success('Message sent!'); }
                                else toast.error('Failed to send. Please try again.');
                              } catch { toast.error('Network error.'); }
                              finally { setIsSendingMessage(false); }
                            }}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {isSendingMessage ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* About */}
                  {/* Report + About row */}
<div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
  <a
    href={`/report?token=${token}`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-xs transition-colors"
    style={{ color: 'rgba(255,255,255,0.25)' }}
    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
  >
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18M3 5l14 4-14 4" />
    </svg>
    Report
  </a>
  <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
  <a
    href="/about"
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs transition-colors"
    style={{ color: 'rgba(255,255,255,0.25)' }}
    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(165,180,252,0.7)')}
    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
  >
    About {BRAND_NAME}
  </a>
  <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
  
</div>
                </div>
              </div>
            </>
          )}

          {/* PDF viewer */}
          {/* ── Video Walkthrough Floating Bubble ── */}
{Object.keys(pageVideos).length > 0 && !videoDismissed && (
  <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

    {/* Expanded video player */}
    {activeVideo && (
      <div className="w-72 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between px-3 py-2.5"
          style={{ background: 'rgba(99,102,241,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-semibold text-white">
            {activeVideo.page === 0 ? 'Introduction' : `Page ${activeVideo.page} — walkthrough`}
          </p>
          <button
            onClick={() => setActiveVideo(null)}
            className="h-5 w-5 rounded flex items-center justify-center hover:bg-white/10">
            <X className="h-3 w-3 text-white/60" />
          </button>
        </div>
        <video
  src={activeVideo.url}
  controls
  autoPlay
  className="w-full"
  style={{ maxHeight: '160px', background: '#000' }}
  onPlay={(e) => {
  const v = e.currentTarget
  // Only count as replay if more than 3 seconds in
  // This prevents false replays from initial autoplay buffering
  if (v.currentTime > 3) {
    trackEvent('video_replayed', {
      page: activeVideo.page,
      replayedAt: Math.round(v.currentTime),
    })
  }
}}
  onEnded={() => {
    trackEvent('video_watched', {
      page: activeVideo.page,
      watchedFully: true
    })
  }}
  onTimeUpdate={(e) => {
    const v = e.currentTarget
    const pct = Math.round((v.currentTime / v.duration) * 100)
    if (pct === 50 || pct === 75 || pct === 100) {
      trackEvent('video_progress', { page: activeVideo.page, percent: pct })
    }
  }}
/>
        <div className="px-3 py-2">
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            from {displayName}
          </p>
        </div>
      </div>
    )}

    {/* Bubble button */}
    <div className="relative">
  {/* Pulse ring — only when current page has a video and bubble is not open */}
  {pageVideos[currentPage] && !activeVideo && (
    <>
      <div className="absolute inset-0 rounded-full animate-ping"
        style={{ background: 'rgba(99,102,241,0.3)', animationDuration: '2s' }} />
      <div className="absolute inset-0 rounded-full animate-ping"
        style={{ background: 'rgba(99,102,241,0.15)', animationDuration: '2s', animationDelay: '0.5s' }} />
    </>
  )}

  {/* Tooltip — appears for 3 seconds when bubble bounces */}
  {videoBouncing && !activeVideo && (
    <div
      className="absolute bottom-full mb-3 right-0 whitespace-nowrap rounded-xl px-3 py-2 shadow-xl"
      style={{
        background: '#1e2533',
        border: '1px solid rgba(99,102,241,0.4)',
        animation: 'fadeInOut 3s ease forwards',
      }}
    >
      <p className="text-xs font-semibold text-white">
        I recorded a walkthrough for this page
      </p>
      <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Click to watch — {Math.floor((pageVideos[currentPage] ? 60 : 0))}s
      </p>
      {/* Arrow pointing down to bubble */}
      <div className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45"
        style={{ background: '#1e2533', borderRight: '1px solid rgba(99,102,241,0.4)', borderBottom: '1px solid rgba(99,102,241,0.4)' }} />
    </div>
  )}

  <button
    onClick={() => {
      const videoUrl = pageVideos[currentPage] || pageVideos[0]
      if (!videoUrl) return
      const page = pageVideos[currentPage] ? currentPage : 0
      if (activeVideo?.page === page) {
        setActiveVideo(null)
      } else {
        setActiveVideo({ url: videoUrl, page })
      }
    }}
    className={`relative h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all
      ${videoBouncing ? 'animate-bounce' : ''}
      ${activeVideo ? 'ring-4 ring-indigo-400 ring-opacity-60' : ''}
    `}
    style={{
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      border: '3px solid white',
    }}
  >
    {displayLogo ? (
      <img src={displayLogo} className="rounded-full h-full w-full object-cover p-0.5" alt="" />
    ) : (
      <span className="text-white font-bold text-lg">
        {displayName.charAt(0).toUpperCase()}
      </span>
    )}
  </button>

      {/* Red dot — page has video */}
      {pageVideos[currentPage] && !activeVideo && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">▶</span>
        </span>
      )}

      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); setActiveVideo(null); setVideoDismissed(true) }}
        className="absolute -top-2 -left-2 h-5 w-5 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(30,37,51,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
        title="Dismiss"
      >
        <X className="h-2.5 w-2.5 text-white/60" />
      </button>
    </div>
  </div>
)}

{/* ── End of Document Intent Question ── */}
{showEndQuestion && !endQuestionSubmitted && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
    <div className="rounded-2xl shadow-2xl overflow-hidden"
      style={{ background: '#1e2533', border: '1px solid rgba(99,102,241,0.3)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm font-bold text-white">
          You have reviewed this document
        </p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          What best describes where you are?
        </p>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {[
          { value: 'ready_to_move_forward', label: 'Ready to move forward', color: '#22c55e' },
          { value: 'need_more_info', label: 'Need more information', color: '#f59e0b' },
           { value: 'discussing_with_team', label: 'Discussing with my team', color: '#6366f1' },
          { value: 'not_interested', label: 'Not the right fit', color: '#64748b' },
        ].map(option => (
          <button
            key={option.value}
            onClick={() => handleEndQuestion(option.value)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold text-white text-left transition-all hover:opacity-90 active:scale-95"
            style={{ background: `${option.color}20`, border: `1px solid ${option.color}40` }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="px-5 pb-4 flex justify-end">
        <button
          onClick={() => setShowEndQuestion(false)}
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.25)' }}>
          Skip
        </button>
      </div>
    </div>
  </div>
)}
          <div
  ref={(el) => {
    // ✅ FIX 2: Measure immediately when the div first mounts in the DOM.
    // Using a callback ref means we get called the instant React attaches it —
    // no polling needed, no race condition.
    (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (el) {
      const padding = window.innerWidth < 640 ? 16 : 32;
      const w = el.clientWidth - padding * 2;
      if (w > 0) setContainerWidth(w);
    }
  }}
  className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-800 w-full"
  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
>
  <div className="flex flex-col items-center py-4 gap-4 w-full px-2 sm:px-8">
   {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
  <div key={pageNum} className="flex flex-col items-center w-full">

    {/* The page itself */}
    <LazyPage
      pageNum={pageNum}
      token={token}
      scrollContainer={scrollContainerRef}
      onVisible={p => setCurrentPage(p)}
      zoomScale={zoomScale}
      containerWidth={containerWidth}
      sessionId={sessionId}
      email={email}
      onScrolled={p => trackEvent('scroll', { page: p, scrollDepth: 100 })}
      onReaction={handleReaction}
      reaction={pageReactions[pageNum]}
      watermark={shareData?.settings?.enableWatermark ? {
        enabled: true,
        text: shareData.settings.watermarkText || email || 'CONFIDENTIAL',
        position: shareData.settings.watermarkPosition || 'diagonal',
      } : undefined}
    />

    {/* Reaction bar — below the page, outside PDF content */}
    <div
      style={{
        width: `${Math.min(containerWidth, 850) * zoomScale}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        marginBottom: '8px',
        borderRadius: '0 0 12px 12px',
        background: 'rgba(255,255,255,0.04)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Page number label */}
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: 500 }}>
        Page {pageNum}
      </span>

      {/* Reaction buttons or submitted state */}
      {!pageReactions[pageNum] ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            Was this page clear?
          </span>
          <button
            onClick={() => handleReaction(pageNum, 'clear')}
            style={{
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'transparent',
              color: 'rgba(74,222,128,0.7)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(34,197,94,0.15)'
              e.currentTarget.style.color = '#4ade80'
              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.6)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'rgba(74,222,128,0.7)'
              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'
            }}
          >
            Yes, clear
          </button>
          
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: pageReactions[pageNum] === 'clear' ? '#4ade80' : '#f87171',
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: pageReactions[pageNum] === 'clear'
              ? 'rgba(74,222,128,0.7)'
              : 'rgba(248,113,113,0.7)',
          }}>
            {pageReactions[pageNum] === 'clear'
              ? 'Marked as clear'
              : 'Noted — the sender will follow up'}
          </span>
        </div>
      )}
    </div>
  </div>
))}
  </div>
</div>

        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <AlertCircle className="h-10 w-10 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold text-yellow-900 mb-1">Document URL Not Available</h3>
            <p className="text-sm text-yellow-700 mb-3">The PDF URL is missing. This may be a storage configuration issue.</p>
            <details className="text-left bg-white rounded p-4 text-xs">
              <summary className="font-medium cursor-pointer">Debug Info</summary>
              <pre className="mt-2 overflow-auto">{JSON.stringify(shareData?.document, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contact Popover (desktop) ────────────────────────────────────────────────
function ContactPopover({ brandingInfo, displayName, email, token, sessionId, onClose }: {
  brandingInfo: any; displayName: string; email: string; token: string; sessionId: string; onClose: () => void;
}) {
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-11 z-50 w-80 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: '#1e2533', border: '1px solid rgba(255,255,255,0.08)' }}>

        {/* Sender info */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Sent by</p>
          <div className="flex items-center gap-3">
            {brandingInfo?.logoUrl ? (
              <div className="h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center p-1"
                style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <img src={brandingInfo.logoUrl} alt={displayName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div>
              
              {brandingInfo?.senderEmail
                ? <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(165,180,252,0.85)' }}>{brandingInfo.senderEmail}</p>
                : <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Document sender</p>
              }
            </div>

          </div>
        </div>

        {/* Message form */}
        <div className="px-5 py-4">
          {sent ? (
            <div className="flex flex-col items-center py-3 gap-2">
              <div className="h-9 w-9 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-sm font-semibold text-white">Sent!</p>
              <button onClick={() => { setSent(false); setMsg(''); }} className="text-xs underline" style={{ color: 'rgba(165,180,252,0.7)' }}>Send another</button>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-white mb-2">Ask {brandingInfo.senderEmail} a question</p>
              <textarea value={msg} onChange={e => setMsg(e.target.value)}
                placeholder={`Write your message...`} rows={3}
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-none outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  From: <span style={{ color: '#a5b4fc' }}>{email || 'anonymous'}</span>
                </p>
                <button
                  disabled={!msg.trim() || sending}
                  onClick={async () => {
                    if (!msg.trim()) return;
                    setSending(true);
                    try {
                      const res = await fetch(`/api/view/${token}/message`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: msg.trim(), senderEmail: email || null, sessionId }),
                      });
                      if (res.ok) setSent(true);
                    } finally { setSending(false); }
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── LazyPage ─────────────────────────────────────────────────────────────────
function LazyPage({ pageNum, token, scrollContainer, onVisible, zoomScale, watermark, containerWidth, sessionId, email, onScrolled , onReaction, reaction }: {
  pageNum: number;
  token: string;
  scrollContainer: React.RefObject<HTMLDivElement | null>;
  onVisible: (page: number) => void;
  zoomScale: number;
  containerWidth: number;   // ✅ NEW
  sessionId: string;
  email: string;
  onScrolled: (page: number) => void;
  watermark?: { enabled: boolean; text: string; position: string };
  onReaction: (page: number, reaction: 'clear' | 'confused') => void;
  reaction?: 'clear' | 'confused';
}) {
  // Base page dimensions (standard A4 at 96dpi)
  const BASE_WIDTH = 850;
  const BASE_HEIGHT = 1100;
  const ASPECT_RATIO = BASE_HEIGHT / BASE_WIDTH;

  // ✅ Page fills container width, never exceeds BASE_WIDTH, zoom scales on top
  const fitWidth = Math.min(containerWidth, BASE_WIDTH);
  const pageWidth = Math.round(fitWidth * zoomScale);
  const pageHeight = Math.round(fitWidth * ASPECT_RATIO * zoomScale);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [scrolledFully, setScrolledFully] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    const obs = new IntersectionObserver(
  entries => { entries.forEach(e => { if (e.isIntersecting) { setIsVisible(true); onVisible(pageNum); } }); },
  { 
    root: scrollContainer.current, 
    threshold: 0,
    rootMargin: '400px 0px 400px 0px'  //  start loading 400px before visible
  }
);
    obs.observe(divRef.current);
    return () => obs.disconnect();
  }, [scrollContainer.current]);

  useEffect(() => {
    if (!bottomRef.current || scrolledFully) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !scrolledFully) { setScrolledFully(true); onScrolled(pageNum); } },
      { root: scrollContainer.current, threshold: 0.5 }
    );
    obs.observe(bottomRef.current);
    return () => obs.disconnect();
  }, [scrollContainer.current, scrolledFully]);

  return (
    <div ref={divRef} id={`page-${pageNum}`}
      className="relative bg-white shadow-2xl flex-shrink-0"
      style={{ width: `${pageWidth}px`, height: `${pageHeight}px`, transition: 'width 0.2s ease, height 0.2s ease', overflow: 'hidden', flexShrink: 0, }}>
      {isVisible ? (
        <>
          {!loaded && (
           <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
  <div className="text-center">
    <div className="animate-spin h-6 w-6 border-2 border-indigo-400/60 border-t-transparent rounded-full mx-auto mb-2" />
    <p className="text-slate-500 text-xs">Page {pageNum}</p>
  </div>
</div>
          )}
          <iframe
            src={`/api/view/${token}/page?page=${pageNum}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            className="border-0"
            title={`Page ${pageNum}`}
            style={{ display: 'block', pointerEvents: 'none', width: 'calc(100% + 20px)', marginRight: '-20px', height: 'calc(100% + 20px)', marginBottom: '-20px' }}
            scrolling="no"
            onLoad={e => {
              setLoaded(true);
              try {
                const doc = (e.target as HTMLIFrameElement).contentDocument;
                if (doc) {
                  const s = doc.createElement('style');
                  s.textContent = `::-webkit-scrollbar{display:none!important}body{overflow:hidden!important;margin:0!important}embed{width:100%!important;height:100%!important}`;
                  doc.head?.appendChild(s);
                }
              } catch (_) {}
            }}
          />
          {/* Watermark overlay */}
{watermark?.enabled && (
  <div
    className="absolute inset-0 pointer-events-none select-none flex items-center justify-center"
    style={{
      zIndex: 10,
      ...(watermark.position === 'diagonal' ? {
        transform: 'rotate(-35deg)',
      } : watermark.position === 'top' ? {
        alignItems: 'flex-start', paddingTop: '24px',
      } : watermark.position === 'center' ? {
        alignItems: 'center',
      } : {
        alignItems: 'flex-end', paddingBottom: '24px',
      }),
    }}
  >
    <span style={{
      fontSize: `${Math.max(12, pageWidth * 0.022)}px`,
      fontWeight: 600,
      color: 'rgba(100, 100, 100, 0.18)',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {watermark.text}
    </span>
  </div>
)}
        <div ref={bottomRef} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', pointerEvents: 'none' }} />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
          <p className="text-slate-400 text-sm">Page {pageNum}</p>
        </div>
      )}
    </div>
  );
}