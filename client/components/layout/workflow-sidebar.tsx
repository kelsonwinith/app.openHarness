'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Trash2,
  Workflow as WorkflowIcon,
  GripVertical
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Workflow } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

interface SortableWorkflowItemProps {
  wf: Workflow;
  isActive: boolean;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

function SortableWorkflowItem({
  wf,
  isActive,
  onRename,
  onDelete
}: SortableWorkflowItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(wf.name);

  useEffect(() => {
    setEditName(wf.name);
  }, [wf.name]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: wf.id, disabled: isEditing });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleSave = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== wf.name) {
      onRename(trimmed);
    } else {
      setEditName(wf.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditName(wf.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors select-none',
        isActive
          ? 'bg-secondary font-medium text-foreground shadow-2xs'
          : 'hover:bg-muted/40 text-muted-foreground',
        isDragging && 'opacity-40 z-10'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/30 hover:text-foreground active:cursor-grabbing p-0.5 touch-none shrink-0"
        title="Drag to reorder workflow"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {isEditing ? (
        <div
          className="flex items-center gap-1.5 flex-1 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          <WorkflowIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-6 flex-1 rounded border border-primary bg-background px-1.5 text-xs font-normal text-foreground focus:outline-none"
          />
        </div>
      ) : (
        <Link
          href={`/workflows/${wf.id}`}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setEditName(wf.name);
            setIsEditing(true);
          }}
          className="flex items-center gap-1.5 truncate flex-1 ml-1 cursor-pointer min-w-0"
          title="Click to open, double-click to rename"
        >
          <WorkflowIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate">{wf.name}</span>
        </Link>
      )}

      <Button
        variant="ghost"
        size="iconSm"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
        title="Delete workflow"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function WorkflowSidebar() {
  const params = useParams();
  const router = useRouter();
  const activeWfId = params.id as string | undefined;

  const workflows = useConsoleStore((s) => s.workflows);
  const updateWorkflow = useConsoleStore((s) => s.updateWorkflow);
  const deleteWorkflow = useConsoleStore((s) => s.deleteWorkflow);
  const reorderWorkflows = useConsoleStore((s) => s.reorderWorkflows);

  const openDialog = useUIStore((s) => s.openDialog);

  const [search, setSearch] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = workflows.findIndex((w) => w.id === active.id);
      const newIndex = workflows.findIndex((w) => w.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderWorkflows(oldIndex, newIndex);
      }
    }
  };

  const handleDeleteWorkflow = (wfId: string, wfName: string) => {
    openDialog('confirm', {
      title: `Delete "${wfName}"?`,
      description: 'This workflow will be permanently removed. Run history and shared skills will not be affected.',
      confirmLabel: 'Delete Workflow',
      confirmVariant: 'destructive',
      onConfirm: () => {
        deleteWorkflow(wfId);
        if (activeWfId === wfId) {
          router.push('/workflows');
        }
      }
    });
  };


  return (
    <aside className="flex w-72 shrink-0 flex-col border-r bg-muted/15 select-none">
      {/* Top search & create header */}
      <div className="flex flex-col gap-2 p-3 border-b shrink-0">
        <div className="flex items-center justify-between">
          <Link
            href="/workflows"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            Workflows ({workflows.length})
          </Link>
          <Button
            size="sm"
            variant="default"
            onClick={() => openDialog('workflow-form')}
            className="h-7 px-2 text-[11px]"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> New
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background/60"
          />
        </div>
      </div>

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col min-h-0">
        {filteredWorkflows.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <WorkflowIcon className="h-7 w-7 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No workflows found</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredWorkflows.map((w) => w.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredWorkflows.map((wf) => (
                  <SortableWorkflowItem
                    key={wf.id}
                    wf={wf}
                    isActive={activeWfId === wf.id}
                    onRename={(newName) => updateWorkflow(wf.id, { name: newName })}
                    onDelete={() => handleDeleteWorkflow(wf.id, wf.name)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}
