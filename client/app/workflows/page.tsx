'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow, Plus } from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Button } from '@/components/ui/button';

export default function WorkflowsIndexPage() {
  const router = useRouter();
  const workflows = useConsoleStore((s) => s.workflows);
  const isInitialized = useConsoleStore((s) => s.isInitialized);
  const openDialog = useUIStore((s) => s.openDialog);

  // If initialized and workflows exist, auto-navigate to the first one
  useEffect(() => {
    if (isInitialized && workflows.length > 0) {
      router.replace(`/workflows/${workflows[0].id}`);
    }
  }, [isInitialized, workflows, router]);

  if (!isInitialized) return null;

  if (workflows.length > 0) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground shadow-xs">
          <Workflow className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            No Workflows Yet
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Relay composes reusable skills into ordered sequences executed step-by-step by your CLI agent harness.
          </p>
        </div>

        <div className="flex items-center justify-center pt-2">
          <Button onClick={() => openDialog('workflow-form')}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
