'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConsoleStore } from '@/lib/stores/console-store';
import { WorkflowEditorCanvas } from '@/components/flow/workflow-editor-canvas';
import { Button } from '@/components/ui/button';
import { Workflow } from '@/lib/domain/types';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const workflows = useConsoleStore((s) => s.workflows);
  const skills = useConsoleStore((s) => s.skills);
  const updateWorkflow = useConsoleStore((s) => s.updateWorkflow);

  const workflow = useMemo(() => {
    return workflows.find((w) => w.id === workflowId);
  }, [workflows, workflowId]);

  if (!workflow) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-xs text-muted-foreground">Workflow not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/workflows')}
          className="mt-3 cursor-pointer"
        >
          View all workflows
        </Button>
      </div>
    );
  }

  const handleSave = (updated: Workflow) => {
    updateWorkflow(workflow.id, updated);
  };

  return (
    <div className="flex h-full w-full flex-col min-h-0 overflow-hidden bg-background">
      <WorkflowEditorCanvas
        workflow={workflow}
        skills={skills}
        onSave={handleSave}
        onBack={() => router.push('/workflows')}
      />
    </div>
  );
}
