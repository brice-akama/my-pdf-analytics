'use client'

// app/admin/billing/BillingPageWrapper.tsx
//
// Thin wrapper so BillingPage can be imported as a React Admin custom route.

import BillingPage from './BillingPage'

export default function BillingPageWrapper() {
  return <BillingPage />
}