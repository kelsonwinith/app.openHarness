'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  Plus,
  FolderOpen,
  GitBranch,
  Loader2
} from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useOpenDirectory } from '@/lib/hooks/use-open-directory';
import { Button } from '@/components/ui/button';

export default function ProjectsIndexPage() {
  const router = useRouter();
  const projects = useConsoleStore((s) => s.projects);
  const activeProjectId = useConsoleStore((s) => s.activeProjectId);
  const isInitialized = useConsoleStore((s) => s.isInitialized);
  const openDialog = useUIStore((s) => s.openDialog);
  const { openDirectory, isOpening, error } = useOpenDirectory();

  // If projects exist, auto-redirect to active or first project (exact parity with workflows)
  useEffect(() => {
    if (isInitialized && projects.length > 0) {
      const targetId = activeProjectId && projects.some((p) => p.id === activeProjectId)
        ? activeProjectId
        : projects[0].id;
      router.replace(`/projects/${targetId}`);
    }
  }, [isInitialized, projects, activeProjectId, router]);

  if (!isInitialized || projects.length > 0) {
    return null; // Will redirect or initializing
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground shadow-xs">
          <FolderGit2 className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            No Projects Yet
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Relay connects your agent harness to local codebases. Open a directory directly in Finder or create a project to start.
          </p>
          {error && (
            <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5 mt-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
          <Button onClick={openDirectory} disabled={isOpening}>
            {isOpening ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
            )}
            Open Directory
          </Button>

          <Button variant="outline" onClick={() => openDialog('project-create')}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Project
          </Button>

          <Button variant="outline" onClick={() => openDialog('project-clone')}>
            <GitBranch className="h-3.5 w-3.5 mr-1" />
            Clone Git Repo
          </Button>
        </div>
      </div>
    </div>
  );
}
