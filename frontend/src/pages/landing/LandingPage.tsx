import { LandingLayout } from '@/components/layout/LandingLayout';
import { FeaturesSection } from './sections/FeaturesSection';
import { FinalCtaSection } from './sections/FinalCtaSection';
import { HeroSection } from './sections/HeroSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { PricingSection } from './sections/PricingSection';
import { ProductPreviewSection } from './sections/ProductPreviewSection';
import { SecuritySection } from './sections/SecuritySection';
import { WhySection } from './sections/WhySection';

export default function LandingPage() {
  return (
    <LandingLayout>
      <HeroSection />
      <ProductPreviewSection />
      <WhySection />
      <FeaturesSection />
      <IntegrationsSection />
      <SecuritySection />
      <PricingSection />
      <FinalCtaSection />
    </LandingLayout>
  );
}
