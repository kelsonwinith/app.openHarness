'use client';

import React, { useState } from 'react';
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
import { FolderPlus, Loader2 } from 'lucide-react';

interface ProjectCreateFormValues {
  name: string;
  targetPath: string;
  initGit: boolean;
}

export function ProjectCreateDialog() {
  const router = useRouter();
  const { activeDialog, closeDialog } = useUIStore();
  const createProject = useConsoleStore((s) => s.createProject);

  const isOpen = activeDialog === 'project-create';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<ProjectCreateFormValues>({
    defaultValues: {
      name: '',
      targetPath: '',
      initGit: true
    }
  });

  const targetPathValue = watch('targetPath');
  const initGitValue = watch('initGit');

  if (!isOpen) return null;

  const onSubmit = async (data: ProjectCreateFormValues) => {
    setLoading(true);
    clearErrors('root');
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          targetPath: data.targetPath.trim(),
          initGit: data.initGit
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to create project directory');
      }

      const project = createProject({
        name: resData.project.name,
        path: resData.project.path,
        currentBranch: resData.project.currentBranch,
        gitRemoteUrl: resData.project.gitRemoteUrl
      });

      closeDialog();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating project';
      setError('root', { message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FolderPlus className="h-4 w-4 text-primary" />
              Create New Project
            </DialogTitle>
            <DialogDescription>
              Scaffold a new codebase directory on your machine for agent harness runs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            {errors.root && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
                {errors.root.message}
              </p>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Project Name</label>
              <Input
                placeholder="e.g. my-agentic-service"
                aria-invalid={!!errors.name}
                {...register('name', {
                  required: 'Project name is required',
                  validate: (val) => val.trim().length > 0 || 'Project name cannot be empty',
                  onChange: (e) => {
                    const val = e.target.value;
                    if (!targetPathValue || targetPathValue.endsWith('/')) {
                      setValue('targetPath', `/Users/${val.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`);
                    }
                  }
                })}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Local Directory Path</label>
              <div className="flex gap-2">
                <Input
                  placeholder="/path/to/project"
                  aria-invalid={!!errors.targetPath}
                  {...register('targetPath', {
                    required: 'Directory path is required',
                    validate: (val) => val.trim().length > 0 || 'Directory path cannot be empty'
                  })}
                  className="font-mono text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/projects/picker', { method: 'POST' });
                      const pickerData = await res.json();
                      if (pickerData.path) {
                        setValue('targetPath', pickerData.path);
                        const parts = pickerData.path.split('/').filter(Boolean);
                        if (parts.length > 0) {
                          setValue('name', parts[parts.length - 1]);
                        }
                        clearErrors('targetPath');
                        clearErrors('name');
                      }
                    } catch {}
                  }}
                  className="text-xs shrink-0"
                >
                  Browse...
                </Button>
              </div>
              {errors.targetPath && (
                <p className="text-xs text-destructive font-medium">{errors.targetPath.message}</p>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={initGitValue}
                onChange={(e) => setValue('initGit', e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              Initialize a Git repository in this directory
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
