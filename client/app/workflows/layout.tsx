import React, { Suspense } from 'react';
import { WorkflowSidebar } from '@/components/layout/workflow-sidebar';

export default function WorkflowsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      <Suspense fallback={<div className="w-72 shrink-0 border-r bg-muted/15" />}>
        <WorkflowSidebar />
      </Suspense>
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Suspense fallback={<div className="p-6 text-xs text-muted-foreground">Loading workflow...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
