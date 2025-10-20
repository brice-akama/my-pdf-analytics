// page.tsx
import { AnimatedFeaturesSection } from "@/components/animated-features-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar/navbar";
import { SocialProofSection } from "@/components/social-proof-section";

export default function Home() {
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
