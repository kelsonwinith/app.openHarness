'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Layers,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Terminal,
  ArrowRightCircle,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { PhaseNodeData, Step } from '@/lib/domain/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhaseNodeProps {
  id: string;
  data: PhaseNodeData & {
    isExecutionMode?: boolean;
    connectedHandleIds?: string[];
    status?: 'pending' | 'running' | 'waiting' | 'done' | 'failed';
    isDropActive?: boolean;
    onDropPrompt?: (nodeId: string, promptText: string) => void;
    onOpenLogs?: (id: string) => void;
    onAddSkill?: (id: string) => void;
    onRemoveSkill?: (id: string, stepIndex: number) => void;
    onReorderSkills?: (id: string, fromIndex: number, toIndex: number) => void;
    onToggleInput?: (id: string) => void;
    onToggleGate?: (id: string) => void;
    onDeleteNode?: (id: string) => void;
    onRenameNode?: (id: string, newName: string) => void;
  };
}

export function PhaseNode({ id, data }: PhaseNodeProps) {
  const isExecutionMode = data.isExecutionMode;
  const status = data.status || 'pending';
  const steps: Step[] = data.steps || [];
  const hasGate = !!data.gate;
  const isInput = !!data.isInput;

  const isRunning = status === 'running';
  const isWaitingGate = status === 'waiting';
  const isDone = status === 'done';

  const connectedHandleIds = React.useMemo(() => {
    return new Set(data.connectedHandleIds || []);
  }, [data.connectedHandleIds]);

  const isHandleConnected = (handleId: string) => {
    // In workflow editor, all 4 handles remain visible to allow connecting edges
    if (!isExecutionMode) return true;
    // In project execution mode, only show the handle if it actually has an edge connected
    return connectedHandleIds.has(handleId);
  };

  // Inline renaming state (double-click name to edit)
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(data.name || 'Untitled Node');

  // Skill reordering state
  const [draggedSkillIndex, setDraggedSkillIndex] = useState<number | null>(null);
  const [dragOverSkillIndex, setDragOverSkillIndex] = useState<number | null>(null);

  useEffect(() => {
    setEditName(data.name || 'Untitled Node');
  }, [data.name]);

  const handleCommitName = () => {
    setIsEditingName(false);
    const trimmed = editName.trim();
    if (trimmed && trimmed !== data.name) {
      data.onRenameNode?.(id, trimmed);
    } else {
      setEditName(data.name || 'Untitled Node');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditName(data.name || 'Untitled Node');
      setIsEditingName(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isExecutionMode || !isInput) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isExecutionMode || !isInput) return;
    e.preventDefault();
    const prompt =
      e.dataTransfer.getData('application/openharness-prompt') ||
      e.dataTransfer.getData('text/plain');
    if (prompt) {
      data.onDropPrompt?.(id, prompt);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'group relative w-[280px] rounded-xl border border-border/80 dark:border-zinc-700/90 light:border-zinc-300 bg-card text-card-foreground p-3.5 shadow-xs transition-[border-color,box-shadow,background-color] duration-150 select-none',
        isExecutionMode ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
        isInput && isExecutionMode && data.isDropActive && 'ring-4 ring-emerald-500/40 border-emerald-500 shadow-md',
        isInput && !isRunning && !isWaitingGate && !isDone && 'border-emerald-500/60 dark:border-emerald-500/50 shadow-xs',
        isRunning
          ? 'border-primary bg-card ring-4 ring-primary/20 shadow-md'
          : isWaitingGate
          ? 'border-amber-500 bg-card ring-4 ring-amber-500/20 shadow-md'
          : isDone
          ? 'border-emerald-500/80 bg-card'
          : !isExecutionMode
          ? 'hover:border-foreground/50 hover:shadow-sm'
          : undefined
      )}
    >
      {/* 4 Connection Handles (Top, Right, Bottom, Left) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={cn(
          isExecutionMode ? '!cursor-default' : 'cursor-crosshair',
          !isHandleConnected('top') && 'handle-hidden !opacity-0 !pointer-events-none !invisible'
        )}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={cn(
          isExecutionMode ? '!cursor-default' : 'cursor-crosshair',
          !isHandleConnected('right') && 'handle-hidden !opacity-0 !pointer-events-none !invisible'
        )}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={cn(
          isExecutionMode ? '!cursor-default' : 'cursor-crosshair',
          !isHandleConnected('bottom') && 'handle-hidden !opacity-0 !pointer-events-none !invisible'
        )}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={cn(
          isExecutionMode ? '!cursor-default' : 'cursor-crosshair',
          !isHandleConnected('left') && 'handle-hidden !opacity-0 !pointer-events-none !invisible'
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg text-xs shrink-0 transition-colors',
              isRunning
                ? 'bg-primary text-primary-foreground animate-spin'
                : isWaitingGate
                ? 'bg-amber-500 text-white animate-pulse'
                : isDone
                ? 'bg-emerald-500 text-white'
                : isInput
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5" />
            ) : isWaitingGate ? (
              <ShieldAlert className="h-3.5 w-3.5" />
            ) : isDone ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : isInput ? (
              <ArrowRightCircle className="h-3.5 w-3.5" />
            ) : (
              <Layers className="h-3.5 w-3.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleCommitName}
                onKeyDown={handleKeyDown}
                autoFocus
                className="nodrag h-6 w-full text-xs font-semibold text-foreground bg-muted/60 border border-primary/50 rounded px-1.5 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h4
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (!isExecutionMode) setIsEditingName(true);
                }}
                className={cn(
                  'text-xs font-semibold text-foreground truncate',
                  !isExecutionMode && 'cursor-text hover:text-primary transition-colors'
                )}
                title={!isExecutionMode ? 'Double click to rename' : undefined}
              >
                {data.name || 'Untitled Node'}
              </h4>
            )}

            <div className="flex items-center gap-1.5 mt-0.5">
              {isInput && (
                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[9px]">
                  <ArrowRightCircle className="h-2.5 w-2.5" />
                  Input
                </span>
              )}
              {hasGate && (
                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold text-[9px]">
                  <ShieldAlert className="h-2.5 w-2.5" />
                  Gate
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Execution Mode: Logs Button */}
        {isExecutionMode && (
          <div className="nodrag flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                data.onOpenLogs?.(id);
              }}
              className="h-6 px-2 text-[10px] gap-1 cursor-pointer font-medium hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Terminal className="h-2.5 w-2.5 text-primary" />
              Logs
            </Button>
          </div>
        )}

        {/* Workflow Editor Quick Actions (Before gate toggle is Input toggle) */}
        {!isExecutionMode && (
          <div className="nodrag flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Toggle to become Input Node (Before Gate Toggle) */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 rounded-md cursor-pointer transition-colors',
                isInput
                  ? 'text-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title={isInput ? 'Input entry node (click to disable)' : 'Toggle to become Input node'}
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleInput?.(id);
              }}
            >
              <ArrowRightCircle className="h-3 w-3" />
            </Button>

            {/* Toggle Gate */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-6 w-6 rounded-md cursor-pointer transition-colors',
                hasGate
                  ? 'text-amber-500 bg-amber-500/15 hover:bg-amber-500/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title={hasGate ? 'Gate enabled (click to disable)' : 'Toggle gate'}
              onClick={(e) => {
                e.stopPropagation();
                data.onToggleGate?.(id);
              }}
            >
              <ShieldAlert className="h-3 w-3" />
            </Button>

            {/* Delete Node */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md cursor-pointer transition-colors"
              title="Delete node"
              onClick={(e) => {
                e.stopPropagation();
                data.onDeleteNode?.(id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Skills Stack */}
      <div className="mt-2.5 space-y-1.5">
        {steps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-2 px-2 text-center text-[10px] text-muted-foreground">
            No skills attached
          </div>
        ) : (
          <div className="space-y-1">
            {steps.map((st, idx) => {
              const isBeingDragged = draggedSkillIndex === idx;
              const isOver = dragOverSkillIndex === idx;

              return (
                <div
                  key={st.id || `${st.skillId}-${idx}`}
                  draggable={!isExecutionMode && steps.length > 1}
                  onDragStart={(e) => {
                    if (isExecutionMode) return;
                    e.stopPropagation();
                    setDraggedSkillIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(idx));
                  }}
                  onDragOver={(e) => {
                    if (isExecutionMode || draggedSkillIndex === null) return;
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverSkillIndex !== idx) {
                      setDragOverSkillIndex(idx);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.stopPropagation();
                    if (dragOverSkillIndex === idx) {
                      setDragOverSkillIndex(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedSkillIndex !== null && draggedSkillIndex !== idx) {
                      data.onReorderSkills?.(id, draggedSkillIndex, idx);
                    }
                    setDraggedSkillIndex(null);
                    setDragOverSkillIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggedSkillIndex(null);
                    setDragOverSkillIndex(null);
                  }}
                  className={cn(
                    'nodrag group/step relative flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1 text-[11px] border border-border/50 font-mono text-muted-foreground transition-all',
                    !isExecutionMode && steps.length > 1 && 'cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-muted/60',
                    isBeingDragged && 'opacity-30 border-dashed border-primary',
                    isOver && !isBeingDragged && 'border-primary ring-1 ring-primary bg-primary/10'
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
                    {!isExecutionMode && steps.length > 1 && (
                      <GripVertical className="h-3 w-3 text-muted-foreground/40 group-hover/step:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
                    )}
                    <span className="truncate text-foreground font-medium">
                      {st.skillName || st.skillId}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pl-1">
                    {!isExecutionMode && (
                      <div className="opacity-0 group-hover/step:opacity-100 flex items-center gap-0.5 transition-opacity">
                        {steps.length > 1 && (
                          <>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx > 0) data.onReorderSkills?.(id, idx, idx - 1);
                              }}
                              className={cn(
                                'p-0.5 rounded transition-colors',
                                idx === 0
                                  ? 'text-muted-foreground/20 cursor-not-allowed'
                                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted cursor-pointer'
                              )}
                              title="Move up"
                            >
                              <ChevronUp className="h-2.5 w-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === steps.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx < steps.length - 1) data.onReorderSkills?.(id, idx, idx + 1);
                              }}
                              className={cn(
                                'p-0.5 rounded transition-colors',
                                idx === steps.length - 1
                                  ? 'text-muted-foreground/20 cursor-not-allowed'
                                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted cursor-pointer'
                              )}
                              title="Move down"
                            >
                              <ChevronDown className="h-2.5 w-2.5" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            data.onRemoveSkill?.(id, idx);
                          }}
                          className="hover:text-destructive text-muted-foreground/60 p-0.5 rounded cursor-pointer transition-colors"
                          title="Remove skill"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Editor Add Skill Button */}
        {!isExecutionMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onAddSkill?.(id);
            }}
            className="nodrag w-full flex items-center justify-center gap-1 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            Add Skill
          </button>
        )}
      </div>
    </div>
  );
}
