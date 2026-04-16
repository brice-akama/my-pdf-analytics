"use client"

import { useEffect } from "react"

export default function PaddleInit() {
  useEffect(() => {
    const init = () => {
      if ((window as any).Paddle) {
        (window as any).Paddle.Setup({
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
          environment: process.env.PADDLE_ENVIRONMENT === 'production' 
            ? undefined  
            : 'sandbox',
        })
        // This detects _ptxn in the URL and opens the checkout form automatically
        (window as any).Paddle.Checkout.open()
      }
    }

    // Wait for Paddle script to load
    if ((window as any).Paddle) {
      init()
    } else {
      window.addEventListener('load', init)
      return () => window.removeEventListener('load', init)
    }
  }, [])

  return null
}