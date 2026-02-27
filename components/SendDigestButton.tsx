"use client"

import { useState } from "react"
import { Mail, CheckCircle, Loader2 } from "lucide-react"

export function SendDigestButton({ spaceId }: { spaceId: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSend() {
    setStatus('loading')
    try {
      const res  = await fetch(`/api/spaces/${spaceId}/send-digest`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ days: 7 }),
      })
      const json = await res.json()
      if (json.success) {
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 4000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={status === 'loading' || status === 'sent'}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        transition-all border
        ${status === 'sent'
          ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
          : status === 'error'
          ? 'bg-red-50 border-red-200 text-red-700'
          : status === 'loading'
          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
        }
      `}
    >
      {status === 'loading' ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
      ) : status === 'sent' ? (
        <><CheckCircle className="h-4 w-4" /> Digest sent!</>
      ) : status === 'error' ? (
        <><Mail className="h-4 w-4" /> Failed — try again</>
      ) : (
        <><Mail className="h-4 w-4" /> Send digest now</>
      )}
    </button>
  )
}

