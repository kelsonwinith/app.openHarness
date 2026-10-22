'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Plus,
  MoreVertical,
  Trash2,
  GripVertical,
  ShieldAlert,
  Settings2,
  FolderTree
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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Step, StepGroup, Skill } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

interface SortableStepItemProps {
  step: Step;
  baseSkill?: Skill;
  onToggleGate: (stepId: string, currentGate: boolean) => void;
  onDeleteStep: (stepId: string) => void;
  onOpenStepSettings: (step: Step) => void;
}

function SortableStepItem({
  step,
  baseSkill,
  onToggleGate,
  onDeleteStep,
  onOpenStepSettings
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 shadow-2xs transition-all select-none min-h-[40px]',
        isDragging && 'opacity-50 ring-2 ring-primary/40 z-20 shadow-md'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/40 hover:text-foreground active:cursor-grabbing p-0.5 rounded touch-none shrink-0"
        title="Drag to reorder skill within group"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Skill details */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-xs leading-normal">
            {baseSkill?.name || 'Custom Skill'}
          </span>
          {step.gate && (
            <Badge variant="gate" className="text-[10px] py-0">
              <ShieldAlert className="h-3 w-3 mr-0.5" /> Gate Checkpoint
            </Badge>
          )}
          {step.instructions && (
            <span className="text-[11px] text-muted-foreground/80 italic bg-muted/60 px-1.5 py-0.5 rounded">
              Override: {step.instructions}
            </span>
          )}
        </div>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant={step.gate ? 'default' : 'ghost'}
          onClick={() => onToggleGate(step.id, step.gate)}
          className={cn(
            'h-7 px-2 text-[11px]',
            step.gate && 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300'
          )}
          title={step.gate ? 'Gate active: run will pause here' : 'Add approval gate'}
        >
          <ShieldAlert className="h-3.5 w-3.5 mr-1" />
          Gate
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="iconSm" className="h-7 w-7">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpenStepSettings(step)}>
              <Settings2 className="mr-2 h-3.5 w-3.5" />
              Configure Instructions...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteStep(step.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Remove Skill
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface SortableGroupCardProps {
  group: StepGroup;
  skills: Skill[];
  onRenameGroup: (name: string) => void;
  onDeleteGroup: () => void;
  onAddSkill: () => void;
  onToggleGate: (stepId: string, currentGate: boolean) => void;
  onDeleteStep: (stepId: string) => void;
  onOpenStepSettings: (step: Step) => void;
  onReorderSteps: (oldIndex: number, newIndex: number) => void;
}

function SortableGroupCard({
  group,
  skills,
  onRenameGroup,
  onDeleteGroup,
  onAddSkill,
  onToggleGate,
  onDeleteStep,
  onOpenStepSettings,
  onReorderSteps
}: SortableGroupCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(group.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: group.id, disabled: isEditingName });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const stepSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleStepDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = group.steps.findIndex((s) => s.id === active.id);
      const newIndex = group.steps.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSteps(oldIndex, newIndex);
      }
    }
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed && trimmed !== group.name) {
      onRenameGroup(trimmed);
    } else {
      setTempName(group.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTempName(group.name);
      setIsEditingName(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border bg-muted/20 p-4 space-y-3 transition-all',
        isDragging && 'opacity-40 ring-2 ring-primary/40 z-10 shadow-lg'
      )}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground/40 hover:text-foreground active:cursor-grabbing p-1 rounded touch-none shrink-0"
            title="Drag to reorder group"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {isEditingName ? (
            <input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="h-7 w-60 rounded border border-primary bg-background px-2 text-xs font-semibold text-foreground focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.preventDefault();
                setTempName(group.name);
                setIsEditingName(true);
              }}
              className="text-xs font-semibold text-foreground truncate cursor-pointer select-none"
              title="Double-click to rename group"
            >
              {group.name}
            </span>
          )}

          <Badge variant="outline" className="font-mono text-[10px] shrink-0">
            {group.steps.length} {group.steps.length === 1 ? 'skill' : 'skills'}
          </Badge>
        </div>

        {/* Group Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={onAddSkill}
            className="h-7 text-xs px-2 gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Skill
          </Button>

          <Button
            variant="ghost"
            size="iconSm"
            onClick={onDeleteGroup}
            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer"
            title="Delete group"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Group Skills List */}
      {group.steps.length > 0 ? (
        <DndContext
          sensors={stepSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleStepDragEnd}
        >
          <SortableContext
            items={group.steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {group.steps.map((step) => {
                const baseSkill = skills.find((s) => s.id === step.skillId);
                return (
                  <SortableStepItem
                    key={step.id}
                    step={step}
                    baseSkill={baseSkill}
                    onToggleGate={onToggleGate}
                    onDeleteStep={onDeleteStep}
                    onOpenStepSettings={onOpenStepSettings}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-lg border border-dashed border-border/80 p-5 text-center bg-background/50">
          <p className="text-xs text-muted-foreground">No skills in this group yet</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddSkill}
            className="mt-2 text-xs h-7 text-primary hover:text-primary"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add First Skill
          </Button>
        </div>
      )}
    </div>
  );
}

function AddGroupDivider({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="group/divider relative flex h-7 w-full items-center justify-center -my-1 cursor-pointer transition-all z-10">
      {/* Expanded full hit target */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onAdd}
        title="Insert group here"
      />

      {/* Centered hairline guide */}
      <div className="h-px w-full bg-border/40 group-hover/divider:bg-primary/50 transition-colors" />

      {/* Perfectly centered insert pill */}
      <button
        type="button"
        onClick={onAdd}
        className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-2xs group-hover/divider:border-primary group-hover/divider:text-primary group-hover/divider:shadow-xs hover:bg-primary/5 cursor-pointer transition-all opacity-0 group-hover/divider:opacity-100 scale-95 group-hover/divider:scale-100 select-none pointer-events-auto"
        title="Insert group here"
      >
        <Plus className="h-3 w-3" />
        <span>Add Group</span>
      </button>
    </div>
  );
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const workflows = useConsoleStore((s) => s.workflows);
  const skills = useConsoleStore((s) => s.skills);
  const addGroup = useConsoleStore((s) => s.addGroup);
  const renameGroup = useConsoleStore((s) => s.renameGroup);
  const deleteGroup = useConsoleStore((s) => s.deleteGroup);
  const reorderGroups = useConsoleStore((s) => s.reorderGroups);
  const reorderGroupSteps = useConsoleStore((s) => s.reorderGroupSteps);
  const deleteGroupStep = useConsoleStore((s) => s.deleteGroupStep);
  const updateStep = useConsoleStore((s) => s.updateStep);

  const openDialog = useUIStore((s) => s.openDialog);

  const workflow = workflows.find((w) => w.id === workflowId);

  // Group sensors
  const groupSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Normalize groups: if workflow has steps but no groups, wrap in default group
  const workflowGroups: StepGroup[] = useMemo(() => {
    if (!workflow) return [];
    if (workflow.groups && workflow.groups.length > 0) {
      return workflow.groups;
    }
    if (workflow.steps && workflow.steps.length > 0) {
      return [
        {
          id: 'grp-default',
          name: 'Main Workflow',
          steps: workflow.steps
        }
      ];
    }
    return [];
  }, [workflow]);

  if (!workflow) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-xs text-muted-foreground">Workflow not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/workflows')}
          className="mt-3"
        >
          View all workflows
        </Button>
      </div>
    );
  }

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = workflowGroups.findIndex((g) => g.id === active.id);
      const newIndex = workflowGroups.findIndex((g) => g.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderGroups(workflow.id, oldIndex, newIndex);
      }
    }
  };

  const handleCreateGroup = (index?: number) => {
    addGroup(workflow.id, undefined, index);
  };

  const handleDeleteGroup = (group: StepGroup) => {
    openDialog('confirm', {
      title: `Delete group "${group.name}"?`,
      description: `This will remove the group and all of its ${group.steps.length} skill(s) from this workflow.`,
      confirmLabel: 'Delete Group',
      confirmVariant: 'destructive',
      onConfirm: () => {
        deleteGroup(workflow.id, group.id);
      }
    });
  };

  const toggleGate = (stepId: string, currentGate: boolean) => {
    updateStep(workflow.id, stepId, { gate: !currentGate });
  };

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      {workflowGroups.length > 0 ? (
        <DndContext
          sensors={groupSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleGroupDragEnd}
        >
          <SortableContext
            items={workflowGroups.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {workflowGroups.map((group, groupIdx) => (
                <React.Fragment key={group.id}>
                  {groupIdx > 0 && (
                    <AddGroupDivider onAdd={() => handleCreateGroup(groupIdx)} />
                  )}
                  <SortableGroupCard
                    group={group}
                    skills={skills}
                    onRenameGroup={(name) => renameGroup(workflow.id, group.id, name)}
                    onDeleteGroup={() => handleDeleteGroup(group)}
                    onAddSkill={() =>
                      openDialog('add-skill', {
                        workflowId: workflow.id,
                        groupId: group.id
                      })
                    }
                    onToggleGate={toggleGate}
                    onDeleteStep={(stepId) => deleteGroupStep(workflow.id, group.id, stepId)}
                    onOpenStepSettings={(s) =>
                      openDialog('edit-step', {
                        workflowId: workflow.id,
                        stepId: s.id,
                        instructions: s.instructions
                      })
                    }
                    onReorderSteps={(oldIndex, newIndex) =>
                      reorderGroupSteps(workflow.id, group.id, oldIndex, newIndex)
                    }
                  />
                </React.Fragment>
              ))}

              {/* Add block after the last group */}
              <button
                type="button"
                onClick={() => handleCreateGroup()}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-muted/10 p-4 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:bg-muted/25 hover:text-foreground transition-all cursor-pointer select-none"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Group
              </button>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FolderTree className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <h3 className="mt-2 text-xs font-semibold text-foreground">No groups in this workflow yet</h3>
          <p className="mt-1 text-[11px] text-muted-foreground max-w-sm mx-auto">
            Workflow templates organize skills into execution groups. Create your first group to start composing skills.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateGroup()}
            className="mt-4 gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Group
          </Button>
        </div>
      )}
    </div>
  );
}
