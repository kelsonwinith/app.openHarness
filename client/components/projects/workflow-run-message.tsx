'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Loader2,
  Circle,
  XCircle,
  ChevronDown,
  ChevronRight,
  SquareTerminal,
  Check,
  X,
  Clock
} from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { Button } from '@/components/ui/button';
import { RunStep, Activity } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

interface WorkflowRunMessageProps {
  runId: string;
}

export function WorkflowRunMessage({ runId }: WorkflowRunMessageProps) {
  const run = useConsoleStore((s) => s.runs.find((r) => r.id === runId));
  const pauseRun = useConsoleStore((s) => s.pauseRun);
  const resumeRun = useConsoleStore((s) => s.resumeRun);
  const stopRun = useConsoleStore((s) => s.stopRun);
  const approveGate = useConsoleStore((s) => s.approveGate);
  const rejectGate = useConsoleStore((s) => s.rejectGate);

  // Expanded state for step activity logs
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  if (!run) {
    return (
      <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground">
        Workflow run <code>{runId}</code> not found or expired.
      </div>
    );
  }

  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const isRunning = run.status === 'running';
  const isWaiting = run.status === 'waiting';
  const isPaused = run.status === 'paused';
  const isCompleted = run.status === 'completed';
  const isStopped = run.status === 'stopped' || run.status === 'failed';

  const currentStep = run.steps[run.currentStep];

  return (
    <div className="w-full max-w-2xl rounded-xl border bg-card/60 p-4 shadow-2xs space-y-4">
      {/* Run Header */}
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <SquareTerminal className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground truncate">
                {run.workflowName}
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[9.5px] font-mono text-muted-foreground">
                OpenCode v2.1.2
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {isCompleted
                ? `Completed ${run.steps.length} of ${run.steps.length} skills`
                : `Executing skill ${Math.min(run.currentStep + 1, run.steps.length)} of ${run.steps.length}`}
            </p>
          </div>
        </div>

        {/* Status Badge & Run Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isRunning && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </span>
          )}
          {isWaiting && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
              <ShieldAlert className="h-3 w-3" />
              Approval Required
            </span>
          )}
          {isPaused && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border">
              <Pause className="h-3 w-3" />
              Paused
            </span>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </span>
          )}
          {isStopped && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-destructive/15 text-destructive border border-destructive/20">
              <AlertCircle className="h-3 w-3" />
              Stopped
            </span>
          )}

          {/* Quick controls */}
          {(isRunning || isPaused) && (
            <div className="flex items-center gap-1 pl-1">
              {isRunning ? (
                <Button
                  size="iconSm"
                  variant="ghost"
                  onClick={pauseRun}
                  title="Pause execution"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  size="iconSm"
                  variant="ghost"
                  onClick={resumeRun}
                  title="Resume execution"
                  className="h-6 w-6 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="iconSm"
                variant="ghost"
                onClick={stopRun}
                title="Stop execution"
                className="h-6 w-6 text-muted-foreground hover:text-destructive cursor-pointer"
              >
                <Square className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Approval Gate Alert Banner */}
      {isWaiting && currentStep && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Gate Checkpoint: &ldquo;{currentStep.name}&rdquo;
              </h4>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                This workflow step requires your authorization before continuing to subsequent skills.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 pl-6">
            <Button
              size="sm"
              onClick={approveGate}
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Approve & Continue
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={rejectGate}
              className="h-7 text-xs text-destructive hover:text-destructive cursor-pointer"
            >
              <X className="h-3 w-3 mr-1" />
              Reject & Stop
            </Button>
          </div>
        </div>
      )}

      {/* Step Pipeline List */}
      <div className="space-y-1.5">
        <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Skills Execution Pipeline
        </h5>

        <div className="space-y-1">
          {run.steps.map((step, idx) => {
            const isStepActive = idx === run.currentStep && (isRunning || isWaiting);
            const isStepDone = step.status === 'done';
            const isStepStopped = step.status === 'stopped' || step.status === 'blocked';
            const isStepWaiting = step.status === 'waiting';
            const isExpanded = expandedSteps[step.id] ?? (isStepActive || isStepWaiting);

            return (
              <div
                key={step.id}
                className={cn(
                  'rounded-lg border transition-all text-xs overflow-hidden',
                  isStepActive
                    ? 'border-primary/40 bg-primary/5 shadow-2xs'
                    : isStepWaiting
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : isStepDone
                    ? 'border-border/60 bg-muted/20'
                    : 'border-border/40 bg-background/50 opacity-70'
                )}
              >
                {/* Step Row Header */}
                <div
                  onClick={() => toggleStepExpanded(step.id)}
                  className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Status Icon */}
                    <div className="shrink-0">
                      {isStepDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : isStepActive ? (
                        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                      ) : isStepWaiting ? (
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      ) : isStepStopped ? (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground/30" />
                      )}
                    </div>

                    <span className="text-[10.5px] font-mono text-muted-foreground shrink-0">
                      0{idx + 1}
                    </span>

                    <span className="font-medium text-xs text-foreground truncate">
                      {step.name}
                    </span>

                    {step.gate && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-muted text-muted-foreground border shrink-0">
                        Gate
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    {step.activities.length > 0 && (
                      <span className="text-[10px] text-muted-foreground/80 font-mono">
                        {step.activities.length} event{step.activities.length > 1 ? 's' : ''}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>

                {/* Collapsible Activity Stream */}
                {isExpanded && step.activities.length > 0 && (
                  <div className="border-t bg-background/80 p-2.5 space-y-1.5 font-mono text-[11px]">
                    {step.activities.map((act: Activity, aIdx: number) => (
                      <div
                        key={aIdx}
                        className="flex items-start gap-2 text-muted-foreground leading-relaxed"
                      >
                        <span className="text-[9.5px] text-muted-foreground/50 shrink-0 select-none">
                          {new Date(act.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span
                          className={cn(
                            'px-1 py-0.2 rounded text-[9.5px] uppercase font-bold shrink-0',
                            act.k === 'run'
                              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                              : act.k === 'edit'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : act.k === 'gate-ok'
                              ? 'bg-emerald-500/20 text-emerald-600'
                              : act.k === 'gate'
                              ? 'bg-amber-500/20 text-amber-600'
                              : act.k === 'stop'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {act.k}
                        </span>
                        <span className="text-foreground/90 flex-1 break-all">
                          {act.text || act.arg || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
