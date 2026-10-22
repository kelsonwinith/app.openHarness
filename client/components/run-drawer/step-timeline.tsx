import React from 'react';
import {
  CheckCircle2,
  CircleDashed,
  Loader2,
  ShieldAlert,
  XCircle
} from 'lucide-react';
import { Run, RunStep } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

interface StepTimelineProps {
  run: Run;
  selectedStepIdx: number;
  onSelectStep: (idx: number) => void;
}

export function StepTimeline({ run, selectedStepIdx, onSelectStep }: StepTimelineProps) {
  const renderStepStatusIcon = (step: RunStep) => {
    if (step.status === 'done') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    }
    if (step.status === 'waiting') {
      return <ShieldAlert className="h-3.5 w-3.5 text-amber-500 animate-bounce" />;
    }
    if (step.status === 'running') {
      return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
    }
    if (step.status === 'blocked' || step.status === 'stopped') {
      return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    }
    return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/50" />;
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
      {run.steps.map((step, idx) => {
        const isSelected = idx === selectedStepIdx;

        return (
          <button
            key={step.id}
            onClick={() => onSelectStep(idx)}
            className={cn(
              'group flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer',
              isSelected
                ? 'border-foreground/30 bg-secondary/80 font-medium shadow-xs'
                : 'border-border/60 bg-background/50 hover:bg-muted/40 text-muted-foreground'
            )}
          >
            {renderStepStatusIcon(step)}
            <span className="truncate max-w-[130px]">{step.name}</span>
            {step.gate && (
              <span title="Approval Gate" className="text-amber-500">
                <ShieldAlert className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
