'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Sun,
  Moon,
  Monitor,
  Trash2,
  Download,
  BookOpen,
  Bell,
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  Play
} from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { notificationService } from '@/lib/notifications/notification-service';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const resetToEmpty = useConsoleStore((s) => s.resetToEmpty);
  const workflows = useConsoleStore((s) => s.workflows);
  const skills = useConsoleStore((s) => s.skills);
  const projects = useConsoleStore((s) => s.projects);
  const harnesses = useConsoleStore((s) => s.harnesses);
  const notifications = useConsoleStore((s) => s.notifications);
  const updateNotifications = useConsoleStore((s) => s.updateNotifications);

  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setPermission(notificationService.getPermission());
  }, []);

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      updateNotifications({ browserEnabled: true });
    }
  };

  const handleTestNotification = () => {
    notificationService.notify({
      title: 'OpenHarness Notification Test',
      body: 'Notifications are working! You will be alerted when runs finish or require gate approval.',
      type: 'test',
      soundEnabled: notifications.soundEnabled,
      browserEnabled: notifications.browserEnabled
    });
  };

  const openDialog = useUIStore((s) => s.openDialog);

  const handleExportData = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      harnesses,
      projects,
      workflows,
      skills
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relay-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    openDialog('confirm', {
      title: 'Reset console data to empty?',
      description: 'All local projects, workflows, and installed skills will be wiped.',
      confirmLabel: 'Reset Console',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        await resetToEmpty();
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b pb-5">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Console Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure appearance, default CLI agent harness, and local data persistence.
        </p>
      </div>

      {/* Theme */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance & Theme
          </h2>
          <p className="text-xs text-muted-foreground">
            Select light, dark, or system appearance. Styled with shadcn Zinc palette.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('light')}
            className="text-xs cursor-pointer"
          >
            <Sun className="h-3.5 w-3.5 mr-1 text-amber-500" /> Light
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="text-xs cursor-pointer"
          >
            <Moon className="h-3.5 w-3.5 mr-1" /> Dark
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme('system')}
            className="text-xs cursor-pointer"
          >
            <Monitor className="h-3.5 w-3.5 mr-1" /> System
          </Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Desktop & Audio Alerts
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get alerted in Chrome or macOS when a workflow completes or an approval gate checkpoint requires your review.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            className="text-xs cursor-pointer shrink-0"
          >
            <Play className="h-3 w-3 mr-1" />
            Test Alert
          </Button>
        </div>

        <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-foreground">Browser Notification Permission</div>
              <p className="text-[11px] text-muted-foreground">
                Status:{' '}
                <span
                  className={
                    permission === 'granted'
                      ? 'text-emerald-500 font-semibold'
                      : permission === 'denied'
                      ? 'text-rose-500 font-semibold'
                      : 'text-amber-500 font-semibold'
                  }
                >
                  {permission}
                </span>
              </p>
            </div>
            {permission !== 'granted' && (
              <Button size="sm" onClick={handleRequestPermission} className="text-xs cursor-pointer">
                Enable Browser Notifications
              </Button>
            )}
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifications.browserEnabled}
                onChange={(e) => updateNotifications({ browserEnabled: e.target.checked })}
                className="mt-0.5 rounded border-input text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium">Desktop Notifications</span>
                <p className="text-[11px] text-muted-foreground">
                  Pop up system alerts even when Chrome is unfocused or minimized.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifications.soundEnabled}
                onChange={(e) => updateNotifications({ soundEnabled: e.target.checked })}
                className="mt-0.5 rounded border-input text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium flex items-center gap-1">
                  {notifications.soundEnabled ? <Volume2 className="h-3 w-3 text-primary" /> : <VolumeX className="h-3 w-3" />}
                  Sound Chime
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Play subtle synthesized audio chimes for events.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifications.notifyOnGate}
                onChange={(e) => updateNotifications({ notifyOnGate: e.target.checked })}
                className="mt-0.5 rounded border-input text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-500" />
                  Alert on Gate Checkpoints
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Notify immediately when execution pauses waiting for approval.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifications.notifyOnComplete}
                onChange={(e) => updateNotifications({ notifyOnComplete: e.target.checked })}
                className="mt-0.5 rounded border-input text-primary focus:ring-primary"
              />
              <div>
                <span className="font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Alert on Completion
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Notify when a multi-skill workflow finishes.
                </p>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="space-y-3 border-t pt-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Data Storage & Persistence
          </h2>
          <p className="text-xs text-muted-foreground">
            OpenHarness persists projects, workflow templates, sessions, and configuration directly to your machine at{' '}
            <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">~/.openharness/</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportData} className="cursor-pointer">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export Configuration (.json)
          </Button>

          <Button variant="destructive" size="sm" onClick={handleResetData} className="cursor-pointer">
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Reset to Empty
          </Button>
        </div>
      </section>

      {/* Architecture and Glossary Reference */}
      <section className="rounded-xl border bg-muted/20 p-4 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>Architectural Integrity & Canonical Glossary</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This console implements the agent harness domain specifications defined in{' '}
          <strong className="text-foreground">GLOSSARY.md</strong> and Architectural Decision Records:
        </p>
        <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-1 font-mono">
          <li>ADR 0001: Workflows reference shared skills by ID</li>
          <li>ADR 0002: Workflow definitions are harness-agnostic</li>
          <li>ADR 0004: Repository adapter pattern for persistence and execution</li>
          <li>ADR 0021: Workflows serve as templates executed in Project Sessions</li>
          <li>ADR 0025: Skills are atomic units without categories or types</li>
        </ul>
      </section>
    </div>
  );
}
