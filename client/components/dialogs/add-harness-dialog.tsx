'use client';

import React from 'react';
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
import { SUPPORTED_HARNESSES } from '@/lib/domain/constants';
import { DynamicIcon } from '@/components/icons/dynamic-icon';
import { Plus, Check } from 'lucide-react';

interface AddHarnessDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddHarnessDialog({ isOpen, onClose }: AddHarnessDialogProps) {
  const harnesses = useConsoleStore((s) => s.harnesses);
  const addHarness = useConsoleStore((s) => s.addHarness);

  const availableToAdd = SUPPORTED_HARNESSES.filter(
    (sh) => !harnesses.some((h) => h.id === sh.id)
  );

  const handleAdd = (harnessId: string) => {
    addHarness(harnessId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Agent Harness</DialogTitle>
          <DialogDescription>
            Select from the CLI agent harnesses supported by openHarness to make them available in your projects.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {availableToAdd.length > 0 ? (
            availableToAdd.map((sh) => (
              <div
                key={sh.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3 bg-card hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="rounded-lg bg-muted p-2 text-foreground shrink-0">
                    <DynamicIcon name={sh.icon || 'SquareTerminal'} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-foreground truncate">{sh.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.2 rounded">
                        v{sh.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{sh.tagline}</p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAdd(sh.id)}
                  className="h-7 text-xs gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground mb-2">
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="font-medium text-foreground">All supported harnesses added</p>
              <p className="text-muted-foreground">Every CLI agent harness supported by openHarness is currently active in your environment.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
