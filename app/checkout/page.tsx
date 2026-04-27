"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { initializePaddle } from "@paddle/paddle-js"

export default function CheckoutPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'closed'>('loading')

  useEffect(() => {
    const init = async () => {
      const paddle = await initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "production"
          ? "production"
          : "sandbox",
        checkout: {
          settings: {
            successUrl: `${process.env.NEXT_PUBLIC_PADDLE_URL}/upgrade/success`,
          }
        },
        // ── FIXED: Listen for checkout events ──────────────────────────────
        eventCallback: (event: any) => {
          // Paddle fires this when the user closes the checkout popup
          if (
            event.name === 'checkout.closed' ||
            event.name === 'checkout.error'
          ) {
            setStatus('closed')
            // Redirect back to plan page after short delay
            // so user sees the message before being redirected
            setTimeout(() => {
              router.push('/plan?cancelled=true')
            }, 1500)
          }
        }
      })

      const ptxn = new URLSearchParams(window.location.search).get("_ptxn")
      if (ptxn && paddle) {
        paddle.Checkout.open({
          transactionId: ptxn,
        })
      } else {
        // No transaction ID — redirect back
        router.push('/plan')
      }
    }

    init()
  }, [router])

  // ── Closed state — shown briefly before redirect ──────────────────────────
  if (status === 'closed') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">↩</span>
          </div>
          <p className="text-slate-700 font-medium mb-1">Checkout closed</p>
          <p className="text-slate-500 text-sm">Taking you back to plans...</p>
        </div>
      </div>
    )
  }

  // ── Loading state — shown while Paddle popup is open ─────────────────────
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Loading secure checkout...</p>
        <p className="text-xs text-slate-400 mt-2">
          Complete your payment in the popup window
        </p>
        {/* Fallback link in case popup is blocked */}
        <button
          onClick={() => router.push('/plan')}
          className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline"
        >
          Cancel and go back
        </button>
      </div>
    </div>
  )
}