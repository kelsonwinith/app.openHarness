'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConsoleStore } from '@/lib/stores/console-store';
import { Button } from '@/components/ui/button';
import { PlayableExecutionCanvas } from '@/components/flow/playable-execution-canvas';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const projects = useConsoleStore((s) => s.projects);
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-xs text-muted-foreground">Project not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/projects')}
          className="mt-3 cursor-pointer"
        >
          View all projects
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col min-h-0 overflow-hidden bg-background">
      <PlayableExecutionCanvas project={project} />
    </div>
  );
}
