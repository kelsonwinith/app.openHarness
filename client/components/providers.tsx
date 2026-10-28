'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useConsoleStore } from '@/lib/stores/console-store';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialize = useConsoleStore((s) => s.initialize);
  const syncSkills = useConsoleStore((s) => s.syncSkills);

  React.useEffect(() => {
    initialize();

    const handleFocus = async () => {
      try {
        const res = await fetch('/api/skills/list');
        const data = await res.json();
        if (data?.skills && Array.isArray(data.skills)) {
          syncSkills(data.skills);
        }
      } catch {}
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [initialize, syncSkills]);

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
