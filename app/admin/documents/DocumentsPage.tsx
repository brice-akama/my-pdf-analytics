'use client'

import DocumentAnalytics from "./DocumentAnalytics"

// app/admin/documents/DocumentsPage.tsx
//
// WHAT THIS FILE DOES:
//   Thin wrapper so DocumentAnalytics can be imported as a React Admin
//   custom route. Add any page-level providers here if needed later.

 

export default function DocumentsPage() {
  return <DocumentAnalytics />
}