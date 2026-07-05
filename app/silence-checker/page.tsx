import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import SilenceChecker from './SilenceChecker';

export const metadata: Metadata = {
  title: 'Deal Silence Checker — What Does the Silence After Your Proposal Mean?',
  description:
    'Answer 5 questions about a specific deal that has gone quiet. Get an instant plain-English read on what the silence pattern typically suggests and what to do next.',
  alternates: {
    canonical: 'https://docmetrics.io/silence-checker',
  },
  openGraph: {
    title: 'Deal Silence Checker — What Is the Silence Telling You?',
    description:
      '5 questions. Instant read. Find out whether your deal is paralysed, disengaged, or stuck in internal friction.',
    url: 'https://docmetrics.io/silence-checker',
    siteName: 'DocMetrics',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-silence-checker.png',
        width: 1200,
        height: 630,
        alt: 'Deal Silence Checker by DocMetrics',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deal Silence Checker — What Is the Silence Telling You?',
    description:
      '5 questions. Instant read. Find out whether your deal is paralysed, disengaged, or stuck in internal friction.',
    images: ['/og-silence-checker.png'],
  },
  keywords: [
    'deal silence checker',
    'proposal went quiet',
    'no response after proposal',
    'sales follow up after proposal',
    'buyer silence after proposal',
    'proposal not responded to',
    'deal stalled after proposal',
    'free sales tool',
    'proposal analytics',
    'docmetrics',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Deal Silence Checker',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://docmetrics.io/silence-checker',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: {
    '@type': 'Organization',
    name: 'DocMetrics',
    url: 'https://docmetrics.io',
  },
  description:
    'A free tool that reads the silence after a proposal and tells you whether the deal is paralysed, disengaged, or stuck in internal friction.',
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ background: '#fafafa', minHeight: '100vh' }}>

        {/* Hero */}
        <div style={{
          maxWidth: 640, margin: '0 auto',
          padding: '4rem 1.25rem 2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <span style={{
            display: 'inline-block', padding: '5px 14px',
            borderRadius: 20, background: '#f5f3ff', color: '#6d28d9',
            fontSize: 12, fontWeight: 600, letterSpacing: '.04em',
            textTransform: 'uppercase', marginBottom: '1.25rem',
          }}>
            Free Tool
          </span>
          <h1 style={{
            fontSize: 'clamp(22px, 5vw, 34px)', fontWeight: 700,
            color: '#111827', lineHeight: 1.25, marginBottom: '1rem',
          }}>
            Deal Silence Checker
          </h1>
          <p style={{
            fontSize: 16, color: '#6b7280', lineHeight: 1.65,
            maxWidth: 500, margin: '0 auto 2.5rem',
          }}>
            Sent a proposal and heard nothing back? Answer five questions
            about what you observed and get a plain-English read on what
            the silence is most likely telling you.
          </p>
        </div>

        {/* Checker */}
        <div style={{
          maxWidth: 640, margin: '0 auto',
          border: '1px solid #e5e7eb', borderRadius: 20,
          background: '#fff', overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.04)',
          marginBottom: '5rem',
        }}>
          <Suspense fallback={
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', minHeight: 400,
            }}>
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          }>
            <SilenceChecker />
          </Suspense>
        </div>

        {/* Explainer */}
        <div style={{
          maxWidth: 640, margin: '0 auto',
          padding: '0 1.25rem 5rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <h2 style={{
            fontSize: 20, fontWeight: 700, color: '#111827',
            marginBottom: '0.5rem', textAlign: 'center',
          }}>
            Why silence is not one thing
          </h2>
          <p style={{
            fontSize: 14, color: '#6b7280', textAlign: 'center',
            marginBottom: '2.5rem', lineHeight: 1.65,
          }}>
            Most reps treat silence after a proposal as a single signal.
            It is not. These are the four patterns it most often turns out to be.
          </p>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {[
              {
                label: 'Paralysed buyer',
                color: '#7c3aed',
                body: 'Silence in communication alongside continued document engagement. They are working through a decision privately, not moving on.',
              },
              {
                label: 'Genuine disengagement',
                color: '#dc2626',
                body: 'Silence on both sides — no communication and no document activity. Something changed on their end and the proposal is no longer active.',
              },
              {
                label: 'Internal friction',
                color: '#d97706',
                body: 'A second stakeholder appeared or the champion went quiet mid-conversation. The deal is moving internally without the rep in the room.',
              },
              {
                label: 'Insufficient signal',
                color: '#6b7280',
                body: 'No visibility into what happened after sending. Every follow-up is a guess because there is no data to interpret.',
              },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '16px 18px', borderRadius: 12,
                border: '1px solid #f1f5f9', background: '#fff',
                display: 'flex', gap: 14,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: item.color, flexShrink: 0, marginTop: 6,
                }} />
                <div>
                  <p style={{
                    margin: '0 0 4px', fontSize: 13,
                    fontWeight: 600, color: '#111827',
                  }}>
                    {item.label}
                  </p>
                  <p style={{
                    margin: 0, fontSize: 13,
                    color: '#6b7280', lineHeight: 1.65,
                  }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          maxWidth: 560, margin: '0 auto',
          padding: '0 1.25rem 5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.65 }}>
            This tool is built and maintained by{' '}
            
            <a  href="https://docmetrics.io"
              style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 500 }}
            >
              DocMetrics
            </a>
            {' '}— see what happens to your proposals after you send them.
          </p>
        </div>

      </div>
    </>
  );
}