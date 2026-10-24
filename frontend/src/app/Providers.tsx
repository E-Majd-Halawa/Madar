import { Toaster } from '@/components/ui/Toaster';
import type { ReactNode } from 'react';
import { useApplyLocale, useApplyTheme } from '@/hooks/useApplyPreferences';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { useWorkspaceBootstrap } from '@/hooks/useWorkspaceBootstrap';

/** App-wide side effects: theme, language/direction and workspace loading. */
export function Providers({ children }: { children: ReactNode }) {
  useApplyTheme();
  useApplyLocale();
  useWorkspaceBootstrap();
  useWorkspaceData();
  return <>
      {children}
      <Toaster />
    </>;
}
