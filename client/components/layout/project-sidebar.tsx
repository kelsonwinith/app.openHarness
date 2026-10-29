'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  FolderGit2,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  GitBranch,
  ChevronDown,
  ChevronRight,
  MessagesSquare,
  FolderOpen,
  GripVertical,
  AlertTriangle,
  FolderSearch
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { useOpenDirectory } from '@/lib/hooks/use-open-directory';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Project, Session } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

interface SortableSessionItemProps {
  session: Session;
  projectId: string;
  isSessionActive: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

function SortableSessionItem({
  session,
  isSessionActive,
  onSelect,
  onRename,
  onDelete
}: SortableSessionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: session.id, disabled: isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(trimmed);
    } else {
      setEditName(session.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditName(session.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1 text-[11px] transition-colors',
        isSessionActive
          ? 'bg-secondary font-medium text-foreground shadow-2xs'
          : 'hover:bg-muted/40 text-muted-foreground',
        isDragging && 'opacity-40 z-10'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/30 hover:text-foreground active:cursor-grabbing p-0.5 touch-none shrink-0"
        title="Drag to reorder session"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {isEditing ? (
        <div className="flex items-center gap-1.5 flex-1 ml-1" onClick={(e) => e.stopPropagation()}>
          <MessagesSquare className="h-3 w-3 shrink-0 opacity-70" />
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-5 flex-1 rounded border border-primary bg-background px-1.5 text-[11px] font-normal text-foreground focus:outline-none"
          />
        </div>
      ) : (
        <Link
          href={`/projects/${session.projectId}/sessions/${session.id}`}
          onClick={onSelect}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditName(session.name);
            setIsEditing(true);
          }}
          className="flex items-center gap-1.5 truncate flex-1 ml-1 cursor-pointer"
          title="Click to open, double-click to rename"
        >
          <MessagesSquare className="h-3 w-3 shrink-0 opacity-70" />
          <span className="truncate">{session.name}</span>
        </Link>
      )}

      <Button
        variant="ghost"
        size="iconSm"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
        title="Delete session"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface SortableProjectItemProps {
  project: Project;
  isProjectActive: boolean;
  isExpanded: boolean;
  activeSessionId?: string;
  projectSessions: Session[];
  isMissing?: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
  onSelectProject: () => void;
  onNewChat: () => void;
  onReveal: () => void;
  onLocateFolder: () => void;
  onDeleteProject: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (session: Session, newName: string) => void;
  onDeleteSession: (session: Session) => void;
  onReorderSessions: (oldIndex: number, newIndex: number) => void;
}

function SortableProjectItem({
  project,
  isProjectActive,
  isExpanded,
  activeSessionId,
  projectSessions,
  isMissing,
  onToggleExpand,
  onSelectProject,
  onNewChat,
  onReveal,
  onLocateFolder,
  onDeleteProject,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onReorderSessions
}: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: project.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const sessionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSessionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projectSessions.findIndex((s) => s.id === active.id);
      const newIndex = projectSessions.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSessions(oldIndex, newIndex);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('space-y-0.5', isDragging && 'opacity-40 z-10')}
    >
      {/* Project Row */}
      <div
        className={cn(
          'group flex items-center justify-between rounded-lg border border-transparent px-2 py-1.5 transition-all text-xs select-none',
          isProjectActive
            ? 'border-border bg-background shadow-xs font-semibold text-foreground'
            : 'hover:bg-muted/60 text-muted-foreground'
        )}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground/30 hover:text-foreground active:cursor-grabbing p-0.5 touch-none shrink-0"
            title="Drag to reorder project"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          <button
            onClick={onToggleExpand}
            className="p-0.5 text-muted-foreground/60 hover:text-foreground cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          <FolderGit2 className={cn('h-3.5 w-3.5 shrink-0', isMissing ? 'text-amber-500' : 'text-primary')} />

          <Link
            href={`/projects/${project.id}`}
            onClick={onSelectProject}
            className={cn(
              'truncate flex-1 cursor-pointer font-medium',
              isMissing && 'text-muted-foreground/80 line-through decoration-amber-500/50'
            )}
            title={isMissing ? `${project.name} (Directory missing on disk)` : project.name}
          >
            {project.name}
          </Link>

          {isMissing ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLocateFolder();
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 cursor-pointer shrink-0 transition-colors"
              title="Directory missing on disk. Click to locate folder..."
            >
              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
              <span>Missing</span>
            </button>
          ) : (
            project.currentBranch && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[9.5px] text-muted-foreground font-mono">
                <GitBranch className="h-2 w-2" />
                {project.currentBranch}
              </span>
            )
          )}
        </div>

        {/* Actions: + for New Chat, and ... for Options */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!isMissing && (
            <Button
              variant="ghost"
              size="iconSm"
              className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
              title="New Chat"
              onClick={(e) => {
                e.stopPropagation();
                onNewChat();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="iconSm"
                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Project options"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isMissing ? (
                <>
                  <DropdownMenuItem onClick={onLocateFolder} className="text-amber-600 dark:text-amber-400 font-medium cursor-pointer">
                    <FolderSearch className="mr-2 h-3.5 w-3.5" />
                    Locate Folder...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={onNewChat}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    New Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onReveal}>
                    <FolderOpen className="mr-2 h-3.5 w-3.5" />
                    Reveal in Finder
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={onDeleteProject}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Remove Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Nested Sessions */}
      {isExpanded && (
        <div className="pl-6 space-y-0.5 border-l ml-3 border-border/40">
          <DndContext
            sensors={sessionSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSessionDragEnd}
          >
            <SortableContext
              items={projectSessions.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {projectSessions.map((session) => (
                <SortableSessionItem
                  key={session.id}
                  session={session}
                  projectId={project.id}
                  isSessionActive={activeSessionId === session.id}
                  onSelect={() => onSelectSession(session.id)}
                  onRename={(newName) => onRenameSession(session, newName)}
                  onDelete={() => onDeleteSession(session)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {projectSessions.length === 0 && (
            <button
              onClick={onNewChat}
              className="text-[10.5px] text-muted-foreground/60 hover:text-primary py-1 px-2 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-2.5 w-2.5" /> Start new chat
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function ProjectSidebar() {
  const params = useParams();
  const router = useRouter();
  const activeProjectId = params.id as string | undefined;
  const activeSessionId = params.sessionId as string | undefined;

  const projects = useConsoleStore((s) => s.projects);
  const updateProject = useConsoleStore((s) => s.updateProject);
  const sessions = useConsoleStore((s) => s.sessions);
  const deleteProject = useConsoleStore((s) => s.deleteProject);
  const deleteSession = useConsoleStore((s) => s.deleteSession);
  const updateSession = useConsoleStore((s) => s.updateSession);
  const setActiveProject = useConsoleStore((s) => s.setActiveProject);
  const setActiveSession = useConsoleStore((s) => s.setActiveSession);
  const reorderProjects = useConsoleStore((s) => s.reorderProjects);
  const reorderSessions = useConsoleStore((s) => s.reorderSessions);

  const openDialog = useUIStore((s) => s.openDialog);
  const { openDirectory, isOpening } = useOpenDirectory();

  const [search, setSearch] = useState('');
  const [missingProjects, setMissingProjects] = useState<Record<string, boolean>>({});

  const verifyProjects = useCallback(async () => {
    if (projects.length === 0) return;
    try {
      const res = await fetch('/api/projects/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects: projects.map((p) => ({ id: p.id, path: p.path }))
        })
      });
      const data = await res.json();
      if (data.statuses) {
        const missing: Record<string, boolean> = {};
        for (const [id, s] of Object.entries(data.statuses as Record<string, { exists: boolean }>)) {
          if (!s.exists) missing[id] = true;
        }
        setMissingProjects(missing);
      }
    } catch {}
  }, [projects]);

  useEffect(() => {
    verifyProjects();
  }, [verifyProjects]);

  const handleLocateFolder = async (projectId: string) => {
    try {
      const pickerRes = await fetch('/api/projects/picker', { method: 'POST' });
      const pickerData = await pickerRes.json();
      if (!pickerData.path) return;

      const openRes = await fetch('/api/projects/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: pickerData.path })
      });
      const openData = await openRes.json();
      if (!openRes.ok) {
        alert(openData.error || 'Failed to open directory');
        return;
      }

      updateProject(projectId, {
        path: openData.project.path,
        name: openData.project.name,
        currentBranch: openData.project.currentBranch,
        gitRemoteUrl: openData.project.gitRemoteUrl
      });

      setMissingProjects((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    } catch (err) {
      console.error('Failed to locate folder:', err);
    }
  };
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    projects.forEach((p) => {
      init[p.id] = true;
    });
    return init;
  });

  const projectSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredProjects = projects.filter((p) => {
    const matchesProject =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.path.toLowerCase().includes(search.toLowerCase());
    const projectSessions = sessions.filter((s) => s.projectId === p.id);
    const matchesSession = projectSessions.some((s) =>
      s.name.toLowerCase().includes(search.toLowerCase())
    );
    return matchesProject || matchesSession;
  });

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex((p) => p.id === active.id);
      const newIndex = projects.findIndex((p) => p.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderProjects(oldIndex, newIndex);
      }
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    openDialog('confirm', {
      title: `Remove project "${projectName}"?`,
      description: 'The project reference will be removed from Relay. Files on disk are safe.',
      confirmLabel: 'Remove Project',
      confirmVariant: 'destructive',
      onConfirm: () => {
        deleteProject(projectId);
      }
    });
  };

  const handleReveal = async (folderPath: string) => {
    try {
      await fetch('/api/projects/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath })
      });
    } catch (err) {
      console.error('Failed to open file manager:', err);
    }
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r bg-muted/15 select-none">
      {/* Top Header */}
      <div className="flex flex-col gap-2 p-3 border-b">
        <div className="flex items-center justify-between">
          <Link
            href="/projects"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Projects ({projects.length})
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default" className="h-7 px-2 text-[11px]">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={openDirectory} disabled={isOpening}>
                <FolderOpen className="mr-2 h-3.5 w-3.5 text-primary" />
                Open Directory...
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog('project-create')}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Create New Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog('project-clone')}>
                <FolderGit2 className="mr-2 h-3.5 w-3.5" />
                Clone Git Repository...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter projects & sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/60"
          />
        </div>
      </div>

      {/* Projects and Sessions Tree */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col min-h-0">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <FolderGit2 className="h-7 w-7 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No projects found</p>
          </div>
        ) : (
          <DndContext
            sensors={projectSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleProjectDragEnd}
          >
            <SortableContext
              items={filteredProjects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredProjects.map((project) => {
                  const isProjectActive = activeProjectId === project.id && !activeSessionId;
                  const isExpanded = expanded[project.id] ?? true;
                  const projectSessions = sessions.filter((s) => s.projectId === project.id);

                  const isMissing = !!missingProjects[project.id];

                  return (
                    <SortableProjectItem
                      key={project.id}
                      project={project}
                      isProjectActive={isProjectActive}
                      isExpanded={isExpanded}
                      activeSessionId={activeSessionId}
                      projectSessions={projectSessions}
                      isMissing={isMissing}
                      onToggleExpand={(e) => toggleExpand(project.id, e)}
                      onSelectProject={() => {
                        setActiveProject(project.id);
                        setActiveSession(null);
                      }}
                      onNewChat={() => {
                        if (isMissing) {
                          handleLocateFolder(project.id);
                          return;
                        }
                        setActiveProject(project.id);
                        setActiveSession(null);
                        router.push(`/projects/${project.id}`);
                      }}
                      onReveal={() => handleReveal(project.path)}
                      onLocateFolder={() => handleLocateFolder(project.id)}
                      onDeleteProject={() => handleDeleteProject(project.id, project.name)}
                      onSelectSession={(sessId) => {
                        setActiveProject(project.id);
                        setActiveSession(sessId);
                      }}
                      onRenameSession={(sess, newName) => {
                        updateSession(sess.id, { name: newName });
                      }}
                      onDeleteSession={(sess) => {
                        openDialog('confirm', {
                          title: `Delete session "${sess.name}"?`,
                          description: 'Are you sure you want to delete this session? This action cannot be undone.',
                          confirmLabel: 'Delete Session',
                          confirmVariant: 'destructive',
                          onConfirm: () => {
                            deleteSession(sess.id);
                            if (activeSessionId === sess.id) {
                              setActiveSession(null);
                              router.push(`/projects/${project.id}`);
                            }
                          }
                        });
                      }}
                      onReorderSessions={(oldIndex, newIndex) =>
                        reorderSessions(project.id, oldIndex, newIndex)
                      }
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}
