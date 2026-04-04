"use client"
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const CookieConsent = () => {
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const pathname = usePathname();

  // ── All paths where cookie banner should NOT show ──
  const hiddenPaths = [
    '/dashboard',
    '/portal',
    '/spaces',
    '/documents',
    '/invite',
    '/invite-team',
    '/sign',
    '/signed',
    '/view',
    '/login',
    '/signup',
    '/register',
    '/onboarding',
    '/settings',
    '/analytics',
    '/billing',
    '/profile',
  ]

  // Check if current path starts with any hidden path
  const isHiddenPage = hiddenPaths.some(path => 
    pathname?.startsWith(path)
  )

  useEffect(() => {
    // Don't show on hidden pages
    if (isHiddenPage) return

    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Small delay so it doesn't pop instantly
      const timer = setTimeout(() => {
        setShowCookieConsent(true);
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [pathname, isHiddenPage]);

  const handleAcceptCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
  };

  const handleDeclineCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookieConsent', 'declined');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
  };

  // Hide on app pages OR if already responded
  if (!showCookieConsent || isHiddenPage) return null;

  return (
    <>
      {/* Cookie Consent Popup */}
      <div className="fixed bottom-6 left-6 z-50 max-w-sm w-full animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              
              <h3 className="text-base font-bold text-slate-900">
                We value your privacy
              </h3>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed mb-5">
              We use cookies to enhance your browsing experience and analyze 
              how our site is used. You can accept all cookies or decline 
              non-essential ones.
            </p>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleDeclineCookies}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCookies}
                className="flex-1 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Accept All
              </button>
            </div>

            {/* Privacy link */}
            <p className="text-center mt-3">
              
             <a   href="/privacy"
                className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default CookieConsent;