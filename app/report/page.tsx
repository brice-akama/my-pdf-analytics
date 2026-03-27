'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

const REASONS = [
  { value: 'phishing', label: 'Phishing or fraud' },
  { value: 'spam', label: 'Spam or unsolicited content' },
  { value: 'inappropriate', label: 'Inappropriate or offensive content' },
  { value: 'misleading', label: 'Fake or misleading information' },
  { value: 'harassment', label: 'Harassment or threatening content' },
  { value: 'other', label: 'Other' },
]

export default function ReportPage() {
   const searchParams = useSearchParams()
const token = searchParams.get('token')
   
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) {
      setError('Please select a reason.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
       const res = await fetch(`/api/report?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details, reporterEmail }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit report')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Confirmation screen ────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#e2e8f0] rounded-xl px-8 py-10 text-center">
            {/* Checkmark */}
            <div className="w-12 h-12 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-6">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-[17px] font-semibold text-[#0f172a] mb-2">
              Report received
            </h1>
            <p className="text-[13px] text-[#64748b] leading-relaxed">
              Thank you. Our team will review this report and take appropriate action
              if the document violates our terms of service.
            </p>
          </div>
          <p className="text-center text-[11px] text-[#94a3b8] mt-5">
            DocMetrics &middot; Trust &amp; Safety
          </p>
        </div>
      </div>
    )
  }

  // ── Report form ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <p className="text-[11px] font-bold text-[#94a3b8] tracking-[1.5px] uppercase mb-8">
          DocMetrics
        </p>

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          {/* Accent bar */}
          <div className="h-[3px] bg-[#0f172a]" />

          <div className="px-8 py-8">
            <h1 className="text-[17px] font-bold text-[#0f172a] mb-1">
              Report this document
            </h1>
            <p className="text-[13px] text-[#64748b] mb-8 leading-relaxed">
              If you believe this document violates our terms of service or is being
              used for fraudulent purposes, let us know. We review every report.
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Reason */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[1px] mb-2.5">
                  Reason
                </label>
                <div className="space-y-2">
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'border-[#0f172a] bg-[#f8fafc]'
                          : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        reason === r.value
                          ? 'border-[#0f172a] bg-[#0f172a]'
                          : 'border-[#cbd5e1]'
                      }`}>
                        {reason === r.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-[13px] text-[#0f172a] font-medium">
                        {r.label}
                      </span>
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => { setReason(r.value); setError('') }}
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="mb-5">
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[1px] mb-2.5">
                  Details <span className="normal-case font-normal text-[#cbd5e1]">(optional)</span>
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-3 text-[13px] text-[#0f172a] border border-[#e2e8f0] rounded-lg resize-none outline-none focus:border-[#0f172a] transition-colors placeholder:text-[#cbd5e1]"
                />
                <p className="text-[11px] text-[#cbd5e1] text-right mt-1">
                  {details.length}/500
                </p>
              </div>

              {/* Reporter email */}
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-[#94a3b8] uppercase tracking-[1px] mb-2.5">
                  Your email <span className="normal-case font-normal text-[#cbd5e1]">(optional)</span>
                </label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={e => setReporterEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 text-[13px] text-[#0f172a] border border-[#e2e8f0] rounded-lg outline-none focus:border-[#0f172a] transition-colors placeholder:text-[#cbd5e1]"
                />
                <p className="text-[11px] text-[#94a3b8] mt-1.5 leading-relaxed">
                  We may contact you if we need more information about this report.
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-[12px] text-red-500 mb-4">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 bg-[#0f172a] text-white text-[13px] font-semibold rounded-lg transition-opacity disabled:opacity-50 hover:opacity-90"
              >
                {submitting ? 'Submitting...' : 'Submit report'}
              </button>

            </form>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#94a3b8] mt-5 leading-relaxed">
          Reports are reviewed by the DocMetrics Trust &amp; Safety team.<br />
          We do not share your identity with the document owner.
        </p>

      </div>
    </div>
  )
}