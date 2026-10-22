'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Square,
  FastForward,
  Check,
  Ban,
  Clock,
  Sparkles
} from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fmtClock, fmtDur } from '@/lib/utils';
import { ActivityItem } from './activity-item';
import { StepTimeline } from './step-timeline';
import { HARNESSES } from '@/lib/domain/constants';

export function RunDrawer() {
  const {
    activeRunId,
    drawerOpen,
    drawerExpanded,
    closeRunDrawer,
    toggleDrawerExpanded
  } = useUIStore();

  const runs = useConsoleStore((s) => s.runs);
  const pauseRun = useConsoleStore((s) => s.pauseRun);
  const resumeRun = useConsoleStore((s) => s.resumeRun);
  const stopRun = useConsoleStore((s) => s.stopRun);
  const approveGate = useConsoleStore((s) => s.approveGate);
  const rejectGate = useConsoleStore((s) => s.rejectGate);
  const cycleRunSpeed = useConsoleStore((s) => s.cycleRunSpeed);

  const run = runs.find((r) => r.id === activeRunId);

  const [userSelectedStepIdx, setUserSelectedStepIdx] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(() => {
    if (!run) return 0;
    const end = run.endedAt || Date.now();
    return Math.max(0, end - run.startedAt - (run.pausedMs || 0));
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Active step tracking without cascading setState
  const currentStepIdx = run ? Math.min(run.currentStep, run.steps.length - 1) : 0;
  const selectedStepIdx = userSelectedStepIdx !== null ? userSelectedStepIdx : Math.max(0, currentStepIdx);

  // Live elapsed timer
  const runStartedAt = run?.startedAt;
  const runEndedAt = run?.endedAt;
  const runPausedMs = run?.pausedMs;
  const runStatus = run?.status;

  useEffect(() => {
    if (!runStartedAt) return;
    if (runStatus === 'running' || runStatus === 'waiting') {
      const interval = setInterval(() => {
        const end = runEndedAt || Date.now();
        const currentElapsed = Math.max(0, end - runStartedAt - (runPausedMs || 0));
        setElapsed(currentElapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [runStartedAt, runEndedAt, runPausedMs, runStatus]);

  // Auto-scroll to bottom of activity feed
  const activityCount = run?.steps[selectedStepIdx]?.activities?.length ?? 0;
  useEffect(() => {
    if (scrollRef.current && (runStatus === 'running' || runStatus === 'waiting')) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activityCount, runStatus]);

  if (!drawerOpen || !run) return null;

  const currentStep = run.steps[selectedStepIdx] || run.steps[0];
  const harness = HARNESSES.find((h) => h.id === run.harnessId) || HARNESSES[0];
  const isWaitingGate = run.status === 'waiting';

  const getStatusBadge = () => {
    switch (run.status) {
      case 'running':
        return <Badge variant="blue" className="animate-pulse">Running</Badge>;
      case 'waiting':
        return <Badge variant="gate">At Gate</Badge>;
      case 'paused':
        return <Badge variant="muted">Paused</Badge>;
      case 'completed':
        return <Badge variant="green">Completed</Badge>;
      case 'stopped':
        return <Badge variant="destructive">Stopped</Badge>;
      default:
        return <Badge variant="outline">{run.status}</Badge>;
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
        onClick={closeRunDrawer}
      />

      {/* Drawer panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l bg-background shadow-2xl transition-all duration-200 ${
          drawerExpanded ? 'w-full md:w-[85vw]' : 'w-full md:w-[540px]'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="font-semibold text-xs tracking-tight truncate max-w-[200px]">
              {run.workflowName}
            </span>
            {getStatusBadge()}
            <Badge variant="outline" className="font-mono text-[10px]">
              {harness.name}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground mr-2">
              <Clock className="h-3.5 w-3.5" />
              <span>{fmtClock(elapsed)}</span>
            </div>

            <Button
              variant="ghost"
              size="iconSm"
              onClick={toggleDrawerExpanded}
              title={drawerExpanded ? 'Restore' : 'Expand'}
            >
              {drawerExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="iconSm"
              onClick={closeRunDrawer}
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Live Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            {run.status === 'running' && (
              <Button size="sm" variant="outline" onClick={pauseRun}>
                <Pause className="h-3 w-3 mr-1" /> Pause
              </Button>
            )}
            {run.status === 'paused' && (
              <Button size="sm" variant="default" onClick={resumeRun}>
                <Play className="h-3 w-3 mr-1 fill-current" /> Resume
              </Button>
            )}
            {['running', 'waiting', 'paused'].includes(run.status) && (
              <Button size="sm" variant="destructive" onClick={stopRun}>
                <Square className="h-3 w-3 mr-1 fill-current" /> Stop
              </Button>
            )}
            {['running', 'waiting'].includes(run.status) && (
              <Button size="sm" variant="ghost" onClick={cycleRunSpeed} title="Simulation Speed">
                <FastForward className="h-3.5 w-3.5 mr-1" />
                <span className="font-mono">{run.speed || 1}×</span>
              </Button>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground">
            Step {Math.min(run.currentStep + 1, run.steps.length)} of {run.steps.length}
          </div>
        </div>

        {/* Steps Timeline Navigation */}
        <div className="border-b px-4 pt-3 pb-2 bg-muted/10">
          <StepTimeline
            run={run}
            selectedStepIdx={selectedStepIdx}
            onSelectStep={setUserSelectedStepIdx}
          />
        </div>

        {/* Current Step Overview */}
        {currentStep && (
          <div className="border-b px-4 py-2.5 bg-muted/5 flex items-center justify-between text-xs">
            <div>
              <div className="font-medium flex items-center gap-1.5">
                <span>{currentStep.name}</span>
                {currentStep.gate && (
                  <Badge variant="gate" className="text-[10px] py-0">
                    Gate Checkpoint
                  </Badge>
                )}
              </div>
              {currentStep.instructions && (
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1 italic">
                  Override: {currentStep.instructions}
                </p>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground font-mono">
              {currentStep.endedAt && currentStep.startedAt
                ? fmtDur(currentStep.endedAt - currentStep.startedAt)
                : currentStep.startedAt
                ? 'in progress'
                : 'pending'}
            </div>
          </div>
        )}

        {/* Activities Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {currentStep && currentStep.activities.length > 0 ? (
            currentStep.activities.map((act, i) => (
              <ActivityItem
                key={`${act.at}-${i}`}
                activity={act}
                harnessId={run.harnessId}
              />
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-center text-xs text-muted-foreground">
              <Sparkles className="h-6 w-6 opacity-30 mb-2" />
              <p>Waiting for harness activity...</p>
            </div>
          )}
        </div>

        {/* Gate Approval / Rejection Action Banner */}
        {isWaitingGate && (
          <div className="border-t bg-amber-500/10 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold text-amber-700 dark:text-amber-300">
                Gate Approval Required
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Approve to continue execution or reject to halt the run.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="destructive"
                size="sm"
                onClick={rejectGate}
                className="flex-1 sm:flex-none"
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={approveGate}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Approve & Continue
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
