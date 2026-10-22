import React, { Suspense } from 'react';
import { ProjectSidebar } from '@/components/layout/project-sidebar';

export default function ProjectsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <Suspense fallback={<div className="w-72 shrink-0 border-r bg-muted/15" />}>
        <ProjectSidebar />
      </Suspense>
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Suspense fallback={<div className="p-6 text-xs text-muted-foreground">Loading project...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
