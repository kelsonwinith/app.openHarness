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
import { FolderGit2, Loader2 } from 'lucide-react';

interface ProjectCloneFormValues {
  url: string;
  targetParentDir: string;
  customName: string;
}

export function ProjectCloneDialog() {
  const router = useRouter();
  const { activeDialog, closeDialog } = useUIStore();
  const createProject = useConsoleStore((s) => s.createProject);

  const isOpen = activeDialog === 'project-clone';
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<ProjectCloneFormValues>({
    defaultValues: {
      url: '',
      targetParentDir: '/tmp',
      customName: ''
    }
  });

  const customNameValue = watch('customName');

  if (!isOpen) return null;

  const onSubmit = async (data: ProjectCloneFormValues) => {
    setLoading(true);
    clearErrors('root');
    try {
      const res = await fetch('/api/projects/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: data.url.trim(),
          targetParentDir: data.targetParentDir.trim(),
          customName: data.customName.trim() || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to clone repository');
      }

      const project = createProject({
        name: resData.project.name,
        path: resData.project.path,
        description: `Cloned from ${resData.project.gitRemoteUrl}`,
        currentBranch: resData.project.currentBranch,
        gitRemoteUrl: resData.project.gitRemoteUrl
      });

      closeDialog();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cloning repository';
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
              <FolderGit2 className="h-4 w-4 text-primary" />
              Clone Git Repository
            </DialogTitle>
            <DialogDescription>
              Clone a remote Git repository to your local machine and create a new Project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            {errors.root && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
                {errors.root.message}
              </p>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Git Repository URL</label>
              <Input
                placeholder="https://github.com/organization/repository.git"
                aria-invalid={!!errors.url}
                {...register('url', {
                  required: 'Git repository URL is required',
                  validate: (val) => val.trim().length > 0 || 'Git repository URL cannot be empty',
                  onChange: (e) => {
                    const base = e.target.value.split('/').pop()?.replace('.git', '');
                    if (base && !customNameValue) setValue('customName', base);
                  }
                })}
                className="font-mono text-xs"
                autoFocus
              />
              {errors.url && (
                <p className="text-xs text-destructive font-medium">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Destination Parent Directory</label>
              <div className="flex gap-2">
                <Input
                  placeholder="/path/to/parent/directory"
                  aria-invalid={!!errors.targetParentDir}
                  {...register('targetParentDir', {
                    required: 'Destination parent directory is required',
                    validate: (val) => val.trim().length > 0 || 'Destination directory cannot be empty'
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
                        setValue('targetParentDir', pickerData.path);
                        clearErrors('targetParentDir');
                      }
                    } catch {}
                  }}
                  className="text-xs shrink-0"
                >
                  Browse...
                </Button>
              </div>
              {errors.targetParentDir && (
                <p className="text-xs text-destructive font-medium">{errors.targetParentDir.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Project / Folder Name (Optional)</label>
              <Input
                placeholder="Leave blank to use repository name"
                {...register('customName')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Clone Repository
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
