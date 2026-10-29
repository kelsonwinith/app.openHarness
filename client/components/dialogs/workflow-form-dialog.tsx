'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';

interface WorkflowFormValues {
  name: string;
}

function WorkflowFormContent({ workflowId }: { workflowId?: string }) {
  const router = useRouter();
  const { closeDialog } = useUIStore();
  const workflows = useConsoleStore((s) => s.workflows);
  const createWorkflow = useConsoleStore((s) => s.createWorkflow);
  const updateWorkflow = useConsoleStore((s) => s.updateWorkflow);

  const workflow = workflows.find((w) => w.id === workflowId);
  const isEditing = !!workflow;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<WorkflowFormValues>({
    defaultValues: {
      name: workflow?.name || ''
    }
  });

  const onSubmit = (data: WorkflowFormValues) => {
    if (isEditing && workflow) {
      updateWorkflow(workflow.id, {
        name: data.name.trim()
      });
      closeDialog();
    } else {
      const created = createWorkflow(data.name.trim());
      closeDialog();
      router.push(`/workflows/${created.id}`);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEditing ? 'Edit Workflow' : 'Create New Workflow'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update workflow metadata.'
              : 'Define a new harness-agnostic workflow sequence.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Workflow Name</label>
            <Input
              placeholder="e.g. Feature delivery, Bug fix, Release"
              aria-invalid={!!errors.name}
              {...register('name', {
                required: 'Workflow name is required',
                validate: (val) => val.trim().length > 0 || 'Workflow name cannot be empty'
              })}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Changes' : 'Create Workflow'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function WorkflowFormDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const isOpen = activeDialog === 'workflow-form';
  const workflowId = dialogPayload?.workflowId as string | undefined;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <WorkflowFormContent key={workflowId || 'new'} workflowId={workflowId} />
    </Dialog>
  );
}
