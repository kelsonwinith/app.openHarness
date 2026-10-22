'use client';

import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { HARNESSES } from '@/lib/domain/constants';
import { HarnessId } from '@/lib/domain/types';
import { DynamicIcon } from '@/components/icons/dynamic-icon';
import { MessagesSquare } from 'lucide-react';

interface SessionFormValues {
  name: string;
  description: string;
  gitBranch: string;
  harnessId: HarnessId;
  notes: string;
}

function SessionFormContent({
  projectId,
  sessionId
}: {
  projectId: string;
  sessionId?: string;
}) {
  const { closeDialog } = useUIStore();
  const sessions = useConsoleStore((s) => s.sessions);
  const projects = useConsoleStore((s) => s.projects);
  const harnesses = useConsoleStore((s) => s.harnesses);
  const defaultHarness = useConsoleStore((s) => s.defaultHarness);
  const createSession = useConsoleStore((s) => s.createSession);
  const updateSession = useConsoleStore((s) => s.updateSession);

  const project = projects.find((p) => p.id === projectId);
  const existingSession = sessions.find((s) => s.id === sessionId);
  const isEditing = !!existingSession;

  const [availableBranches, setAvailableBranches] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SessionFormValues>({
    defaultValues: {
      name: existingSession?.name || '',
      description: existingSession?.description || '',
      gitBranch: existingSession?.gitBranch || project?.currentBranch || 'main',
      harnessId: existingSession?.defaultHarnessId || defaultHarness,
      notes: existingSession?.notes || ''
    }
  });

  const selectedHarnessId = watch('harnessId');
  const currentBranch = watch('gitBranch');

  useEffect(() => {
    if (project?.path) {
      fetch('/api/projects/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: project.path })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.branches) setAvailableBranches(data.branches);
        })
        .catch(() => {});
    }
  }, [project?.path]);

  const onSubmit = (data: SessionFormValues) => {
    if (isEditing && existingSession) {
      updateSession(existingSession.id, {
        name: data.name.trim(),
        description: data.description.trim(),
        gitBranch: data.gitBranch.trim(),
        defaultHarnessId: data.harnessId,
        notes: data.notes.trim()
      });
    } else {
      createSession({
        projectId,
        name: data.name.trim(),
        description: data.description.trim(),
        gitBranch: data.gitBranch.trim() || 'main',
        defaultHarnessId: data.harnessId,
        status: 'active',
        notes: data.notes.trim()
      });
    }
    closeDialog();
  };

  return (
    <DialogContent className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <MessagesSquare className="h-4 w-4 text-primary" />
            {isEditing ? 'Edit Session' : 'Create Project Session'}
          </DialogTitle>
          <DialogDescription>
            A dedicated context within <strong>{project?.name || 'Project'}</strong> for tracking an objective and runs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Session Name / Objective</label>
            <Input
              placeholder="e.g. Implement user authentication, Fix memory leak"
              aria-invalid={!!errors.name}
              {...register('name', {
                required: 'Session name is required',
                validate: (val) => val.trim().length > 0 || 'Session name cannot be empty'
              })}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Short Summary (Optional)</label>
            <Input
              placeholder="Target goals or scope of this session..."
              {...register('description')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Target Git Branch</label>
            {availableBranches.length > 0 ? (
              <div className="flex gap-2">
                <Input
                  {...register('gitBranch')}
                  className="font-mono text-xs flex-1"
                />
                <select
                  value={currentBranch}
                  onChange={(e) => setValue('gitBranch', e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-mono"
                >
                  {availableBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <Input
                placeholder="main"
                {...register('gitBranch')}
                className="font-mono text-xs"
              />
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Default Harness for this Session</label>
            <div className="grid grid-cols-2 gap-2">
              {harnesses.map((h) => {
                const isSelected = h.id === selectedHarnessId;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setValue('harnessId', h.id)}
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                        : 'border-border/70 hover:bg-muted/40'
                    }`}
                  >
                    <DynamicIcon name={h.icon || 'SquareTerminal'} className="h-3.5 w-3.5 text-foreground" />
                    <span className="font-medium truncate">{h.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Working Notes / Context (Optional)</label>
            <Textarea
              placeholder="Requirements, acceptance criteria, or relevant file references..."
              {...register('notes')}
              className="min-h-[70px] text-xs font-mono"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? 'Save Session' : 'Create Session'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function SessionFormDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const isOpen = activeDialog === 'session-form';
  const projectId = dialogPayload?.projectId as string | undefined;
  const sessionId = dialogPayload?.sessionId as string | undefined;

  if (!isOpen || !projectId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <SessionFormContent
        key={sessionId || 'new'}
        projectId={projectId}
        sessionId={sessionId}
      />
    </Dialog>
  );
}
