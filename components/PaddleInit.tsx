"use client"

import { useEffect } from "react"

export default function PaddleInit() {
  useEffect(() => {
    const init = () => {
      if (!(window as any).Paddle) return

      ;(window as any).Paddle.Setup({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: 'sandbox',
      })

      // Only open checkout if _ptxn is in the URL
      // This prevents it firing on every page load
      const hasPtxn = new URLSearchParams(window.location.search).has('_ptxn')
      if (hasPtxn) {
        (window as any).Paddle.Checkout.open()
      }
    }

    if ((window as any).Paddle) {
      init()
    } else {
      window.addEventListener('load', init)
      return () => window.removeEventListener('load', init)
    }
  }, [])

  return null
}