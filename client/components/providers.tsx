'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useConsoleStore } from '@/lib/stores/console-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useConsoleStore((s) => s.initialize);

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
