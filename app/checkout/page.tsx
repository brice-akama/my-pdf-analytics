"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { initializePaddle } from "@paddle/paddle-js"

export default function CheckoutPage() {
  useEffect(() => {
    const init = async () => {
      const paddle = await initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: "sandbox",
        checkout: {
          settings: {
            successUrl: `${process.env.NEXT_PUBLIC_PADDLE_URL}/upgrade/success`,
          }
        }
      })

      const ptxn = new URLSearchParams(window.location.search).get("_ptxn")
      if (ptxn && paddle) {
        paddle.Checkout.open({
          transactionId: ptxn,
        })
      }
    }

    init()
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Loading secure checkout...</p>
      </div>
    </div>
  )
}