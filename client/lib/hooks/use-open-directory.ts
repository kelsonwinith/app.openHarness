'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConsoleStore } from '@/lib/stores/console-store';

export function useOpenDirectory() {
  const router = useRouter();
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projects = useConsoleStore((s) => s.projects);
  const createProject = useConsoleStore((s) => s.createProject);
  const setActiveProject = useConsoleStore((s) => s.setActiveProject);

  const openDirectory = async () => {
    setIsOpening(true);
    setError(null);
    try {
      const pickerRes = await fetch('/api/projects/picker', { method: 'POST' });
      const pickerData = await pickerRes.json();

      if (pickerData.canceled || !pickerData.path) {
        return;
      }

      const targetPath = pickerData.path;

      // Check if project already registered
      const existing = projects.find((p) => p.path === targetPath);
      if (existing) {
        setActiveProject(existing.id);
        router.push(`/projects/${existing.id}`);
        return;
      }

      // Inspect directory and git metadata
      const openRes = await fetch('/api/projects/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: targetPath })
      });

      const openData = await openRes.json();
      if (!openRes.ok) {
        throw new Error(openData.error || 'Failed to open directory');
      }

      const newProject = createProject({
        name: openData.project.name,
        path: openData.project.path,
        description: `Imported from ${openData.project.path}`,
        currentBranch: openData.project.currentBranch,
        gitRemoteUrl: openData.project.gitRemoteUrl
      });

      router.push(`/projects/${newProject.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error opening directory';
      setError(msg);
      console.error('Error opening directory:', msg);
    } finally {
      setIsOpening(false);
    }
  };

  return { openDirectory, isOpening, error };
}
