"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer"

// Add any route that should NOT show Navbar/Footer
const HIDDEN_ROUTES = ["/dashboard", "/login", "/signup" , "documents-page" , "sign", "signed" , "accept-invitation", "agreements" , "bulk-send", "careers", "cc", "compliance" , "docs" , "envelope" , "features", "file-requests", "forgot-password" , "invite", "invite-team", "nda-records" , "public", "portal", "reports", "spaces", "view", "view-sign" ,"zapier-login" ,"organization" ,"forgot-password" , "reset-password", "documents"]

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Hide on /dashboard and any sub-route like /dashboard/analytics etc
  const isHidden = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route))

  if (isHidden) return <>{children}</>

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}