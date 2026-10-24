import type { ReactNode } from 'react';
import { LandingFooter } from './LandingFooter';
import { LandingHeader } from './LandingHeader';

export function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-ambient min-h-dvh">
      <LandingHeader />
      <main>{children}</main>
      <LandingFooter />
    </div>
  );
}
