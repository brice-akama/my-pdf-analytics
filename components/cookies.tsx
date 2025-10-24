"use client"
import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [showCookieConsent, setShowCookieConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowCookieConsent(true);
    }
  }, []);

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

  const handleManagePreferences = () => {
    // You can redirect to a preferences page or open a modal
    alert('Manage preferences functionality - redirect to privacy settings page');
  };

  if (!showCookieConsent) return null;

  return (
    <>
      {/* Cookie Consent Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto lg:ml-8 lg:mb-8 lg:fixed lg:bottom-8 lg:left-8 lg:max-w-sm animate-fade-in">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              We value your privacy
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              We use cookies to enhance your browsing experience, analyze document sharing analytics, and deliver personalized content. By clicking "Accept All", you consent to our use of cookies for analytics and performance tracking of your PDF documents.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeclineCookies}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptCookies}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Accept All
              </button>
            </div>

            <button
              onClick={handleManagePreferences}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 underline transition-colors"
            >
              Manage Preferences
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default CookieConsent;