// page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatedFeaturesSection } from "@/components/animated-features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar/navbar";
import { SocialProofSection } from "@/components/social-proof-section";
import { FeatureBentoSection } from "@/components/feature-bento-section";

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

  
    <div className="bg-gradient-to-br from-white via-indigo-50 to-indigo-100 -mt-16 pt-16">
      
      <HeroSection />
    </div>

    <SocialProofSection />
    <AnimatedFeaturesSection />
    <FeatureBentoSection />

    <Footer />
  </>
);
}

