import { LandingLayout } from '@/components/layout/LandingLayout';
import { PricingSection } from './sections/PricingSection';

export default function PricingPage() {
  return (
    <LandingLayout>
      <div className="pt-8">
        <PricingSection />
      </div>
    </LandingLayout>
  );
}
