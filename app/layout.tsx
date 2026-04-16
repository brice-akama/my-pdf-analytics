import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackToTop from "@/components/BackToTop";
import CookieConsent from "@/components/cookies";
import { Toaster } from 'sonner'
import { PublicLayout } from "@/components/public-layout"
import PaddleInit from "@/components/PaddleInit";
 

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
      <head>
        {/* Paddle.js — loads the checkout form when _ptxn is in the URL */}
        <script src="https://cdn.paddle.com/paddle/v2/paddle.js" async />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        <PublicLayout>
          {children}
        </PublicLayout>
        <PaddleInit />
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