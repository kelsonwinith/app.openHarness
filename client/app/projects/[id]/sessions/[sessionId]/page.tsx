'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useConsoleStore } from '@/lib/stores/console-store';
import { Button } from '@/components/ui/button';
import { PlayableExecutionCanvas } from '@/components/flow/playable-execution-canvas';

export default function SessionWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const sessionId = params.sessionId as string;

  const projects = useConsoleStore((s) => s.projects);
  const sessions = useConsoleStore((s) => s.sessions);

  const project = projects.find((p) => p.id === projectId);
  const session = sessions.find((s) => s.id === sessionId);

  if (!project || !session) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-xs text-muted-foreground">Session or Project not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(project ? `/projects/${project.id}` : '/projects')}
          className="mt-3 cursor-pointer"
        >
          Back to {project?.name || 'Projects'}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col min-h-0 overflow-hidden bg-background">
      <PlayableExecutionCanvas project={project} session={session} />
    </div>
  );
}
