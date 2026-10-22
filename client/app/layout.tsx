import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { Providers } from '@/components/providers';
import { AppRail } from '@/components/layout/app-rail';
import { GlobalDialogs } from '@/components/dialogs/global-dialogs';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Relay — Agent Harness Console',
  description: 'Compose agent workflows, attach skills, and watch a CLI harness execute them step by step.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen overflow-hidden`}>
        <Providers>
          <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
            {/* Left 68px Navigation Rail */}
            <Suspense fallback={<div className="w-[68px] shrink-0 border-r bg-muted/20" />}>
              <AppRail />
            </Suspense>

            {/* Central App Column */}
            <div className="flex min-w-0 flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<div className="p-6 text-xs text-muted-foreground">Loading...</div>}>
                {children}
              </Suspense>
            </div>

            {/* Global Dialog Modals */}
            <GlobalDialogs />
          </div>
        </Providers>
      </body>
    </html>
  );
}
