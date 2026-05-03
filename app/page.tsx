'use client';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Hero from '@/components/home/Hero';
import TrustStrip from '@/components/home/TrustStrip';
import Categories from '@/components/home/Categories';
import HowItWorks from '@/components/home/HowItWorks';
import FeaturedProviders from '@/components/home/FeaturedProviders';
import FeaturedVendors from '@/components/home/FeaturedVendors';
import PromoSlider from '@/components/home/PromoSlider';
import CtaSection from '@/components/home/CtaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCounters } from '@/hooks/useCounters';
import { useRipple } from '@/hooks/useRipple';
import { useScrollProgress } from '@/hooks/useScrollProgress';

export default function HomePage() {
  useScrollReveal();
  useCounters();
  useRipple();
  useScrollProgress();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <Categories />
        <PromoSlider />
        <HowItWorks />
        <FeaturedProviders />
        <FeaturedVendors />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
