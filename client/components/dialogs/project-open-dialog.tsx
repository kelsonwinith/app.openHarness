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
import { FolderOpen, Loader2, Sparkles } from 'lucide-react';

interface ProjectOpenFormValues {
  folderPath: string;
}

export function ProjectOpenDialog() {
  const router = useRouter();
  const { activeDialog, closeDialog } = useUIStore();
  const createProject = useConsoleStore((s) => s.createProject);
  const projects = useConsoleStore((s) => s.projects);
  const setActiveProject = useConsoleStore((s) => s.setActiveProject);

  const isOpen = activeDialog === 'project-open';
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<ProjectOpenFormValues>({
    defaultValues: {
      folderPath: ''
    }
  });

  const folderPathValue = watch('folderPath');

  if (!isOpen) return null;

  const importPath = async (targetPath: string) => {
    setLoading(true);
    clearErrors();
    try {
      const res = await fetch('/api/projects/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: targetPath })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to open directory');
      }

      // Check if project already registered
      const existing = projects.find((p) => p.path === data.project.path);
      if (existing) {
        setActiveProject(existing.id);
        closeDialog();
        router.push(`/projects/${existing.id}`);
        return;
      }

      const project = createProject({
        name: data.project.name,
        path: data.project.path,
        currentBranch: data.project.currentBranch,
        gitRemoteUrl: data.project.gitRemoteUrl
      });

      closeDialog();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error opening directory';
      setError('root', { message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleNativePick = async () => {
    setPicking(true);
    clearErrors();
    try {
      const res = await fetch('/api/projects/picker', { method: 'POST' });
      const data = await res.json();

      if (data.canceled) {
        return;
      }

      if (data.path) {
        setValue('folderPath', data.path);
        await importPath(data.path);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to launch native file picker';
      setError('root', { message: msg });
    } finally {
      setPicking(false);
    }
  };

  const onSubmit = async (data: ProjectOpenFormValues) => {
    await importPath(data.folderPath.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FolderOpen className="h-4 w-4 text-primary" />
              Open Existing Directory Project
            </DialogTitle>
            <DialogDescription>
              Select a project folder via native Finder / File Explorer, or enter its path.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {errors.root && (
              <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
                {errors.root.message}
              </p>
            )}
            {/* Native OS Picker Button */}
            <div className="rounded-xl border border-dashed p-4 text-center bg-muted/20">
              <Button
                type="button"
                variant="default"
                onClick={handleNativePick}
                disabled={picking || loading}
                className="w-full gap-2 text-xs"
              >
                {picking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Choose Folder in Finder / File Explorer...
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Opens your native macOS Finder or Windows Explorer folder chooser.
              </p>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <span className="relative bg-background px-2 text-[10px] uppercase text-muted-foreground font-mono">
                Or enter path manually
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Local Directory Path</label>
              <Input
                placeholder="/Users/username/workspace/my-repo"
                aria-invalid={!!errors.folderPath}
                {...register('folderPath', {
                  required: 'Directory path is required',
                  validate: (val) => val.trim().length > 0 || 'Directory path cannot be empty'
                })}
                className="font-mono text-xs"
              />
              {errors.folderPath && (
                <p className="text-xs text-destructive font-medium">{errors.folderPath.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={loading || picking}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || picking || !folderPathValue.trim()}>
              {loading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              Open Path
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
