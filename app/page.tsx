// page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedFeaturesSection } from "@/components/animated-features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar/navbar";
import { SocialProofSection } from "@/components/social-proof-section";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // ✅ If token exists, user is already logged in — redirect to dashboard
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <>
      <Navbar />
      <HeroSection />
      <SocialProofSection />
      <AnimatedFeaturesSection />
      <Footer />
    </>
  );
}

