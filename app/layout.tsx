import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackToTop from "@/components/BackToTop";
import CookieConsent from "@/components/cookies";
import { Toaster } from 'sonner'
import { PublicLayout } from "@/components/public-layout"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docmetrics.io"),
  title: {
    default: "DocMetrics",
    template: "%s | DocMetrics",
  },
  description:
    "Document sharing with analytics — see who opened, read, and spent time on your docs.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {/*
          PublicLayout checks the current path:
          - /dashboard and all sub-routes → Navbar & Footer hidden
          - all other pages → Navbar & Footer shown normally
        */}
        <PublicLayout>
          {children}
        </PublicLayout>
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          duration={4000}
        />
        <BackToTop />
        <CookieConsent />
      </body>
    </html>
  );
}