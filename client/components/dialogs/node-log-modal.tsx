'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Layers,
  ShieldAlert,
  CheckCircle2,
  Terminal,
  Activity as ActivityIcon
} from 'lucide-react';
import { CanvasNode, PhaseNodeData, RunStep } from '@/lib/domain/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NodeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: CanvasNode | null;
  runStep?: RunStep | null;
  onApproveGate?: () => void;
  onStopRun?: () => void;
}

export function NodeLogModal({
  isOpen,
  onClose,
  node,
  runStep,
  onApproveGate,
  onStopRun
}: NodeLogModalProps) {
  if (!node) return null;

  const data = node.data as PhaseNodeData;
  const isWaitingGate = runStep?.status === 'waiting' && runStep?.gate;
  const activities = runStep?.activities || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl h-[70vh] flex flex-col p-0 overflow-hidden bg-card text-card-foreground border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b px-5 py-3.5 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Terminal className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <DialogTitle className="text-sm font-semibold text-foreground truncate">
                  {data.name || 'Node Execution Logs'}
                </DialogTitle>
                <DialogDescription className="font-mono text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Layers className="h-3 w-3" />
                  <span>{(data.steps || []).length} skills attached</span>
                </DialogDescription>
              </div>
            </div>

            {runStep && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-mono uppercase px-2 py-0.5',
                  runStep.status === 'running'
                    ? 'bg-primary/10 text-primary border-primary/30 animate-pulse'
                    : runStep.status === 'waiting'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : runStep.status === 'done'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {runStep.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Checkpoint Banner if Paused at Gate */}
        {isWaitingGate && (
          <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-3 shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Approval Gate Checkpoint — Execution Paused</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onApproveGate?.();
                    onClose();
                  }}
                  className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium cursor-pointer"
                >
                  Approve & Continue
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onStopRun?.();
                    onClose();
                  }}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  Stop Run
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Live Traces / Logs Area */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-2 bg-background/50">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-12">
              <Terminal className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No execution traces recorded for this node yet.</p>
              <p className="text-[11px] opacity-70 mt-0.5">
                Dispatch a prompt onto an Input Node to stream live activities.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activities.map((act, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 bg-card p-3 text-[11px] shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                    <span className="font-semibold text-primary uppercase flex items-center gap-1">
                      <ActivityIcon className="h-3 w-3" />
                      {act.k}
                    </span>
                    <span>{new Date(act.at).toLocaleTimeString()}</span>
                  </div>
                  {act.text && <div className="text-foreground font-sans">{act.text}</div>}
                  {act.arg && (
                    <div className="text-muted-foreground font-mono bg-muted/40 p-1.5 rounded text-[10px] break-all">
                      {act.arg}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
