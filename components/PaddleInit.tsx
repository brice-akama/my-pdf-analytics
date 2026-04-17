"use client"

import { useEffect } from "react"
import { initializePaddle } from "@paddle/paddle-js"

export default function PaddleInit() {
  useEffect(() => {
    const init = async () => {
      const paddle = await initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        environment: "sandbox",
      })

      // Only open checkout if _ptxn is in the URL
      const ptxn = new URLSearchParams(window.location.search).get("_ptxn")
      if (ptxn && paddle) {
        paddle.Checkout.open({
          transactionId: ptxn,
        })
      }
    }

    init()
  }, [])

  return null
}