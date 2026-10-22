'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  FolderGit2,
  Workflow as WorkflowIcon,
  Library,
  SquareTerminal,
  Settings,
  Layers,
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConsoleStore } from '@/lib/stores/console-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function AppRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const projects = useConsoleStore((s) => s.projects);

  const mainNavItems = [
    { label: 'Projects', href: '/projects', icon: FolderGit2, count: projects.length || undefined },
    { label: 'Workflows', href: '/workflows', icon: WorkflowIcon },
    { label: 'Skills', href: '/skills', icon: Library },
    { label: 'Harness', href: '/harness', icon: SquareTerminal }
  ];

  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <aside className="flex w-[68px] shrink-0 flex-col items-center border-r bg-muted/20 py-3 select-none">
      {/* Brand logo */}
      <Link
        href="/projects"
        className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105"
        title="Relay Console"
      >
        <Layers className="h-5 w-5" />
      </Link>

      <div className="my-3.5 h-px w-8 bg-border/80" />

      {/* Main navigation items */}
      <nav className="flex flex-col items-center gap-1.5">
        {mainNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.count ? (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section (pushed down with mt-auto) */}
      <div className="mt-auto flex flex-col items-center gap-2 pt-2">
        {/* Settings at bottom of side nav including theme setting */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'relative flex h-[50px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer',
                isSettingsActive
                  ? 'bg-secondary text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              title="Settings & Appearance"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-52 mb-1">
            <DropdownMenuLabel className="text-[11px] font-medium text-muted-foreground">
              Appearance & Theme
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => setTheme('light')}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sun className="h-3.5 w-3.5 text-amber-500" /> Light
              </span>
              {theme === 'light' && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('dark')}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Moon className="h-3.5 w-3.5 text-sky-400" /> Dark
              </span>
              {theme === 'dark' && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('system')}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" /> System
              </span>
              {theme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => router.push('/settings')}
              className="text-xs cursor-pointer"
            >
              <Settings className="mr-2 h-3.5 w-3.5" />
              All Console Settings...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
