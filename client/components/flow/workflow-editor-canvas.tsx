'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  ConnectionMode,
  PanOnScrollMode,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  Panel
} from '@xyflow/react';
import {
  Save,
  Check,
  RotateCcw,
  ArrowRightCircle,
  Layers,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Workflow, CanvasNode, CanvasEdge, PhaseNodeData, InputNodeData, Skill } from '@/lib/domain/types';
import { ensureWorkflowGraph, syncGraphToWorkflow } from '@/lib/domain/workflow-graph';
import { PhaseNode } from './phase-node';
import { PhaseSkillPickerDialog } from '@/components/dialogs/phase-skill-picker-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const nodeTypes = {
  workflowInput: PhaseNode,
  input: PhaseNode,
  phase: PhaseNode
};

interface WorkflowEditorCanvasProps {
  workflow: Workflow;
  skills: Skill[];
  onSave: (updatedWorkflow: Workflow) => void;
  onBack?: () => void;
}

export function WorkflowEditorCanvas({
  workflow,
  skills,
  onSave,
  onBack
}: WorkflowEditorCanvasProps) {
  const router = useRouter();
  const initialGraph = useMemo(() => ensureWorkflowGraph(workflow), [workflow]);

  const [nodes, setNodes] = useState<Node[]>(initialGraph.nodes as unknown as Node[]);
  const [edges, setEdges] = useState<Edge[]>(initialGraph.edges as unknown as Edge[]);
  const [isDirty, setIsDirty] = useState(false);
  const [skillPickerPhaseId, setSkillPickerPhaseId] = useState<string | null>(null);

  // Unsaved changes leave warning state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Reset graph and dirty state when workflow prop changes
  useEffect(() => {
    const graph = ensureWorkflowGraph(workflow);
    setNodes(graph.nodes as unknown as Node[]);
    setEdges(graph.edges as unknown as Edge[]);
    setIsDirty(false);
    setShowLeaveConfirm(false);
    setPendingUrl(null);
    setPendingAction(null);
  }, [workflow.id]);

  // Intercept navigation when there are unsaved changes
  useEffect(() => {
    if (!isDirty) return;

    // 1. Browser tab close / reload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. In-app navigation capture
    const handleClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't intercept clicks inside the leave confirmation dialog
      if (target.closest('[data-leave-confirm-dialog]')) return;

      // Don't intercept clicks inside other dialogs like skill picker
      if (target.closest('[role="dialog"]')) return;

      // Don't intercept clicks inside the workflow editor action bar
      if (target.closest('[data-editor-action-bar]')) return;

      // Check if click is on an anchor tag leaving this workflow
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (
          href &&
          !href.startsWith('#') &&
          !href.startsWith('javascript:') &&
          anchor.getAttribute('target') !== '_blank'
        ) {
          try {
            const targetUrl = new URL(href, window.location.origin);
            if (
              targetUrl.pathname !== window.location.pathname ||
              targetUrl.search !== window.location.search
            ) {
              e.preventDefault();
              e.stopPropagation();
              setPendingUrl(targetUrl.pathname + targetUrl.search);
              setShowLeaveConfirm(true);
              return;
            }
          } catch {
            if (href !== window.location.pathname) {
              e.preventDefault();
              e.stopPropagation();
              setPendingUrl(href);
              setShowLeaveConfirm(true);
              return;
            }
          }
        }
      }

      // Check if click is on a button outside the canvas in aside sidebar
      const btn = target.closest('button');
      if (btn && !target.closest('.react-flow')) {
        if (target.closest('aside')) {
          e.preventDefault();
          e.stopPropagation();
          setPendingAction(() => {
            btn.click();
          });
          setShowLeaveConfirm(true);
          return;
        }
      }
    };

    window.addEventListener('click', handleClickCapture, true);

    // 3. Browser Back / Forward buttons
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setPendingUrl('/workflows');
      setShowLeaveConfirm(true);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('click', handleClickCapture, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty, router]);

  const activeSkillPickerPhase = useMemo(() => {
    return nodes.find((n) => n.id === skillPickerPhaseId) || null;
  }, [nodes, skillPickerPhaseId]);

  const attachedSkillIds = useMemo(() => {
    if (!activeSkillPickerPhase) return new Set<string>();
    const phaseData = activeSkillPickerPhase.data as PhaseNodeData;
    return new Set((phaseData.steps || []).map((s) => s.skillId));
  }, [activeSkillPickerPhase]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      setIsDirty(true);
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      setIsDirty(true);
    },
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true
          },
          eds
        )
      );
      setIsDirty(true);
    },
    []
  );

  const handleAddNode = () => {
    const id = `phase-${Date.now().toString(36)}`;
    const newNode: Node = {
      id,
      type: 'phase',
      position: { x: 220 + Math.random() * 80, y: 80 + nodes.length * 60 },
      data: {
        name: `Node ${nodes.length + 1}`,
        gate: false,
        isInput: nodes.length === 0,
        harnessId: 'opencode',
        steps: []
      } as PhaseNodeData
    };
    setNodes((nds) => [...nds, newNode]);
    setIsDirty(true);
  };

  const handleToggleInput = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const prev = n.data as PhaseNodeData;
          return {
            ...n,
            data: {
              ...n.data,
              isInput: !prev.isInput
            }
          };
        }
        return n;
      })
    );
    setIsDirty(true);
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              name: newName
            }
          };
        }
        return n;
      })
    );
    setIsDirty(true);
  };

  const handleToggleGate = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const prev = ((n.data as unknown) as PhaseNodeData).gate;
          return {
            ...n,
            data: {
              ...n.data,
              gate: !prev
            }
          };
        }
        return n;
      })
    );
    setIsDirty(true);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (skillPickerPhaseId === nodeId) setSkillPickerPhaseId(null);
    setIsDirty(true);
  };

  const handleRemoveSkill = (nodeId: string, stepIndex: number) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const prev = n.data as PhaseNodeData;
          return {
            ...n,
            data: {
              ...prev,
              steps: (prev.steps || []).filter((_, i) => i !== stepIndex)
            }
          };
        }
        return n;
      })
    );
    setIsDirty(true);
  };

  const handleReorderSkills = (nodeId: string, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const prev = n.data as PhaseNodeData;
          const steps = [...(prev.steps || [])];
          if (fromIndex < 0 || fromIndex >= steps.length || toIndex < 0 || toIndex >= steps.length) {
            return n;
          }
          const [moved] = steps.splice(fromIndex, 1);
          steps.splice(toIndex, 0, moved);
          return {
            ...n,
            data: {
              ...prev,
              steps
            }
          };
        }
        return n;
      })
    );
    setIsDirty(true);
  };

  const handleToggleSkillInPhase = (skill: Skill) => {
    if (!skillPickerPhaseId) return;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === skillPickerPhaseId) {
          const prev = n.data as PhaseNodeData;
          const currentSteps = prev.steps || [];
          const exists = currentSteps.some((st) => st.skillId === skill.id);
          const nextSteps = exists
            ? currentSteps.filter((st) => st.skillId !== skill.id)
            : [
                ...currentSteps,
                {
                  id: `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                  skillId: skill.id,
                  skillName: skill.name,
                  order: currentSteps.length
                }
              ];
          return {
            ...n,
            data: {
              ...prev,
              steps: nextSteps
            }
          };
        }
        return n;
      })
    );
    setIsDirty(true);
  };

  const handleSave = () => {
    const updated = syncGraphToWorkflow(
      workflow,
      nodes as unknown as CanvasNode[],
      edges as unknown as CanvasEdge[]
    );
    onSave(updated);
    setIsDirty(false);
  };

  const handleCancel = () => {
    setNodes(initialGraph.nodes as unknown as Node[]);
    setEdges(initialGraph.edges as unknown as Edge[]);
    setSkillPickerPhaseId(null);
    setIsDirty(false);
  };

  const handleConfirmExit = () => {
    setIsDirty(false);
    setShowLeaveConfirm(false);
    const url = pendingUrl;
    const action = pendingAction;
    setPendingUrl(null);
    setPendingAction(null);

    if (url) {
      router.push(url);
    } else if (action) {
      action();
    } else if (onBack) {
      onBack();
    }
  };

  const handleConfirmSaveAndExit = () => {
    const updated = syncGraphToWorkflow(
      workflow,
      nodes as unknown as CanvasNode[],
      edges as unknown as CanvasEdge[]
    );
    onSave(updated);
    setIsDirty(false);
    setShowLeaveConfirm(false);
    const url = pendingUrl;
    const action = pendingAction;
    setPendingUrl(null);
    setPendingAction(null);

    if (url) {
      router.push(url);
    } else if (action) {
      action();
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirm(false);
    setPendingUrl(null);
    setPendingAction(null);
  };

  // Enhance nodes with interactive callbacks
  const enrichedNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      type: 'phase',
      data: {
        ...n.data,
        isExecutionMode: false,
        onAddSkill: (nodeId: string) => setSkillPickerPhaseId(nodeId),
        onRemoveSkill: (nodeId: string, stepIndex: number) => handleRemoveSkill(nodeId, stepIndex),
        onReorderSkills: (nodeId: string, fromIndex: number, toIndex: number) => handleReorderSkills(nodeId, fromIndex, toIndex),
        onToggleInput: (nodeId: string) => handleToggleInput(nodeId),
        onToggleGate: (nodeId: string) => handleToggleGate(nodeId),
        onDeleteNode: (nodeId: string) => handleDeleteNode(nodeId),
        onRenameNode: (nodeId: string, newName: string) => handleRenameNode(nodeId, newName)
      }
    }));
  }, [nodes]);

  return (
    <div className="relative flex h-full w-full flex-col min-h-0 bg-background overflow-hidden">
      {/* Top Header / Draft Action Bar */}
      <div data-editor-action-bar className="flex items-center justify-between border-b px-6 py-2.5 shrink-0 bg-muted/20 backdrop-blur-xs z-10">
        {/* Left Side: Single Add Node Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddNode}
            className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
          >
            <Plus className="h-3.5 w-3.5 text-primary" />
            + Node
          </Button>
        </div>

        {/* Right Side: Cancel and Save Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={!isDirty}
            onClick={handleCancel}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Cancel
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={!isDirty}
            onClick={handleSave}
            className={cn(
              'h-8 text-xs gap-1.5 font-medium cursor-pointer transition-colors',
              isDirty
                ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10'
                : 'text-emerald-600 dark:text-emerald-400 disabled:opacity-100 cursor-default hover:bg-transparent'
            )}
          >
            {isDirty ? (
              <Save className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            {isDirty ? 'Unsaved' : 'Saved'}
          </Button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="relative flex-1 h-full w-full min-h-0 bg-background">
        <ReactFlow
          nodes={enrichedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={30}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          panOnScroll={true}
          panOnScrollMode={PanOnScrollMode.Free}
          zoomOnScroll={false}
          zoomOnPinch={true}
          panOnDrag={true}
          snapToGrid={true}
          snapGrid={[12, 12]}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 }
          }}
          fitView
          className="bg-background"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="hsl(var(--muted-foreground) / 0.35)"
          />
          <Controls className="!bg-card !border-border !shadow-sm !rounded-xl overflow-hidden" />
        </ReactFlow>
      </div>

      {/* Skill Picker Dialog */}
      <PhaseSkillPickerDialog
        isOpen={!!skillPickerPhaseId}
        onClose={() => setSkillPickerPhaseId(null)}
        phaseName={(activeSkillPickerPhase?.data as PhaseNodeData)?.name}
        skills={skills}
        attachedSkillIds={attachedSkillIds}
        onToggleSkill={handleToggleSkillInPhase}
      />

      {/* Unsaved Changes Leave Warning Dialog */}
      <Dialog open={showLeaveConfirm} onOpenChange={(open) => !open && handleCancelLeave()}>
        <DialogContent
          data-leave-confirm-dialog
          className="max-w-md bg-card text-card-foreground border-border shadow-2xl p-6"
        >
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-semibold">
                Unsaved Changes
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              You have unsaved changes in &ldquo;{workflow.name}&rdquo;. Leaving without saving will discard your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-4 border-t mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelLeave}
              className="h-8 px-3 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleConfirmExit}
              className="h-8 px-3.5 text-xs font-medium cursor-pointer text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
            >
              Exit
            </Button>

            <Button
              size="sm"
              onClick={handleConfirmSaveAndExit}
              className="h-8 px-3.5 text-xs font-medium cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save and exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
