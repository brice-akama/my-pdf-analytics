"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer"

// Routes where Navbar/Footer should be hidden
const HIDDEN_ROUTES = [
  "/dashboard",
  "/login",
  "/signup",
  "/documents-page",
  "/sign",
  "/signed",
  "/accept-invitation",
  "/agreements",
  "/bulk-send",
  "/careers",
  "/cc",
  "/compliance",
  "/docs",
  "/envelope",
  
  "/file-requests",
  "/forgot-password",
  "/invite",
  "/invite-team",
  "/nda-records",
  "/public",
  "/portal",
  "/reports",
  "/spaces",
  "/view",
  "/view-sign",
  "/zapier-login",
  "/organization",
  "/reset-password",
  "/documents"
]

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const isHidden = HIDDEN_ROUTES.some((route) => {
    // exact match OR sub-route match
    return pathname === route || pathname.startsWith(route + "/")
  })

  if (isHidden) return <>{children}</>

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}