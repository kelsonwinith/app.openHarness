'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { HARNESSES } from '@/lib/domain/constants';
import { HarnessId } from '@/lib/domain/types';
import { DynamicIcon } from '@/components/icons/dynamic-icon';
import { Play } from 'lucide-react';

export function LaunchRunDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const workflows = useConsoleStore((s) => s.workflows);
  const harnesses = useConsoleStore((s) => s.harnesses);
  const defaultHarness = useConsoleStore((s) => s.defaultHarness);
  const startRun = useConsoleStore((s) => s.startRun);
  const addSessionMessage = useConsoleStore((s) => s.addSessionMessage);

  const isOpen = activeDialog === 'launch-run';
  const workflowId = (dialogPayload?.workflowId as string | undefined) || workflows[0]?.id;
  const workflow = workflows.find((w) => w.id === workflowId);

  const [selectedHarness, setSelectedHarness] = useState<HarnessId>(defaultHarness);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !workflow) return null;

  const currentHarness = harnesses.find((h) => h.id === selectedHarness) || harnesses[0] || HARNESSES[0];

  const handleLaunch = () => {
    const targetSessionId = dialogPayload?.sessionId as string | undefined;
    const run = startRun(
      workflow.id,
      selectedHarness,
      dialogPayload?.projectId as string | undefined,
      targetSessionId
    );
    if (run) {
      if (targetSessionId) {
        addSessionMessage(targetSessionId, {
          id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          role: 'assistant',
          content: `Executing workflow: **${workflow.name}**`,
          runId: run.id,
          createdAt: Date.now()
        });
      }
      closeDialog();
    } else {
      setError('Unable to start run: add at least one step first.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Play className="h-4 w-4 fill-current text-primary" />
            Launch Workflow Run
          </DialogTitle>
          <DialogDescription>
            Execute <strong>{workflow.name}</strong> ({workflow.steps.length} steps) on a CLI harness.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
              {error}
            </p>
          )}
          {/* Harness selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Select Harness</label>
            <div className="grid grid-cols-2 gap-2">
              {harnesses.map((h) => {
                const isSelected = h.id === selectedHarness;
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHarness(h.id)}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-2xs ring-1 ring-primary/40'
                        : 'border-border/70 hover:bg-muted/40'
                    }`}
                  >
                    <DynamicIcon name={h.icon || 'SquareTerminal'} className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs leading-none flex items-center gap-1">
                        {h.name}
                        <span className="text-[10px] text-muted-foreground font-normal">v{h.version}</span>
                      </div>
                      <p className="mt-1 text-[10.5px] text-muted-foreground truncate">{h.tagline}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Snapshot note per ADR 0001 & ADR 0002 */}
          <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 text-[11px] text-muted-foreground leading-relaxed">
            Steps and instructions will be snapshotted at launch so workflow edits do not affect this run.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button onClick={handleLaunch}>
            <Play className="h-3.5 w-3.5 fill-current mr-1" />
            Launch Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
