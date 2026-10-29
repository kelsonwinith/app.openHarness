'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  ConnectionMode
} from '@xyflow/react';
import {
  Play,
  SquareTerminal,
  Workflow as WorkflowIcon,
  ChevronDown,
  Check,
  ShieldAlert,
  Terminal,
  RotateCcw,
  Sparkles,
  Layers,
  LayoutGrid,
  Cpu,
  FolderTree
} from 'lucide-react';
import {
  Project,
  Session,
  Workflow,
  Run,
  RunStep,
  CanvasNode,
  CanvasEdge,
  PhaseNodeData,
  InputNodeData
} from '@/lib/domain/types';
import { ensureWorkflowGraph, getExecutionPathFromInput } from '@/lib/domain/workflow-graph';
import { useConsoleStore } from '@/lib/stores/console-store';
import { PhaseNode } from './phase-node';
import { PromptPuck } from './prompt-puck';
import { NodeLogModal } from '@/components/dialogs/node-log-modal';
import { ProjectFileExplorerDialog } from '@/components/dialogs/project-file-explorer-dialog';
import { ProjectTerminalModal } from '@/components/terminal/project-terminal-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const nodeTypes = {
  workflowInput: PhaseNode,
  input: PhaseNode,
  phase: PhaseNode
};

function FlowCameraController({
  activeNodeId,
  isIdle
}: {
  activeNodeId: string | null;
  isIdle: boolean;
}) {
  const { setCenter, fitView, getNode } = useReactFlow();

  useEffect(() => {
    if (isIdle || !activeNodeId) {
      const timer = setTimeout(() => {
        fitView({ duration: 800, padding: 0.25 });
      }, 50);
      return () => clearTimeout(timer);
    }

    const node = getNode(activeNodeId);
    if (node) {
      const w = node.measured?.width || 290;
      const h = node.measured?.height || 180;
      const centerX = node.position.x + w / 2;
      const centerY = node.position.y + h / 2;
      setCenter(centerX, centerY, { zoom: 1.15, duration: 800 });
    }
  }, [activeNodeId, isIdle, setCenter, fitView, getNode]);

  return null;
}

interface PlayableExecutionCanvasProps {
  project: Project;
  session?: Session;
}

export function PlayableExecutionCanvas({
  project,
  session
}: PlayableExecutionCanvasProps) {
  const router = useRouter();
  const workflows = useConsoleStore((s) => s.workflows);
  const harnesses = useConsoleStore((s) => s.harnesses);
  const runs = useConsoleStore((s) => s.runs);
  const startRun = useConsoleStore((s) => s.startRun);
  const approveGate = useConsoleStore((s) => s.approveGate);
  const stopRun = useConsoleStore((s) => s.stopRun);
  const reviseGate = useConsoleStore((s) => s.reviseGate);

  // No default workflow or harness selected initially
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const [selectedHarnessId, setSelectedHarnessId] = useState<string | null>(
    session?.defaultHarnessId || null
  );

  const selectedHarness = useMemo(() => {
    if (!selectedHarnessId) return null;
    return harnesses.find((h) => h.id === selectedHarnessId) || null;
  }, [harnesses, selectedHarnessId]);

  const selectedWorkflow = useMemo(() => {
    if (!selectedWorkflowId) return null;
    return workflows.find((w) => w.id === selectedWorkflowId) || null;
  }, [workflows, selectedWorkflowId]);

  const isReady = !!selectedHarness && !!selectedWorkflow;

  // Terminal & File Explorer modal state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);

  // Prompt Puck drag state
  const [isPuckDragging, setIsPuckDragging] = useState(false);

  // Active phase node for logs modal dialog
  const [activeLogNodeId, setActiveLogNodeId] = useState<string | null>(null);

  // Active run for this session/project
  const activeRun = useMemo(() => {
    return runs.find(
      (r) =>
        r.projectId === project.id &&
        (!session || r.sessionId === session.id) &&
        ['running', 'waiting', 'paused'].includes(r.status)
    );
  }, [runs, project.id, session]);

  const lastCompletedRun = useMemo(() => {
    return runs.find(
      (r) =>
        r.projectId === project.id &&
        (!session || r.sessionId === session.id) &&
        ['completed', 'stopped'].includes(r.status)
    );
  }, [runs, project.id, session]);

  const currentRun = activeRun || lastCompletedRun;

  // Build the graph
  const baseGraph = useMemo(() => {
    if (!selectedWorkflow) return { nodes: [], edges: [] };
    return ensureWorkflowGraph(selectedWorkflow);
  }, [selectedWorkflow]);

  // Map of connected handle IDs per node ID from graph edges
  const connectedHandlesByNodeId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    baseGraph.edges.forEach((edge) => {
      if (edge.source) {
        if (!map.has(edge.source)) map.set(edge.source, new Set());
        map.get(edge.source)!.add(edge.sourceHandle || 'bottom');
      }
      if (edge.target) {
        if (!map.has(edge.target)) map.set(edge.target, new Set());
        map.get(edge.target)!.add(edge.targetHandle || 'top');
      }
    });
    return map;
  }, [baseGraph.edges]);

  // Map run status onto graph nodes
  const playableNodes = useMemo(() => {
    return baseGraph.nodes.map((node) => {
      const phaseData = node.data as PhaseNodeData;
      const isInput = !!phaseData.isInput || node.type === 'workflowInput' || node.type === 'input';
      let status: 'pending' | 'running' | 'waiting' | 'done' | 'failed' = 'pending';

      if (currentRun) {
        // Find matching steps for this phase
        const phaseSteps = currentRun.steps.filter(
          (st) =>
            st.groupId === node.id.replace(/^phase-/, '') ||
            st.groupName?.toLowerCase() === phaseData.name?.toLowerCase()
        );

        if (phaseSteps.length > 0) {
          const anyRunning = phaseSteps.some((s) => s.status === 'running');
          const anyWaiting = phaseSteps.some((s) => s.status === 'waiting');
          const allDone = phaseSteps.every((s) => s.status === 'done');

          if (anyWaiting) status = 'waiting';
          else if (anyRunning) status = 'running';
          else if (allDone) status = 'done';
        }
      }

      return {
        ...node,
        type: 'phase',
        data: {
          ...node.data,
          isExecutionMode: true,
          status,
          isInput,
          connectedHandleIds: Array.from(connectedHandlesByNodeId.get(node.id) || []),
          isDropActive: isPuckDragging,
          isActiveRun: activeRun?.status === 'running',
          isExecuted: lastCompletedRun?.status === 'completed',
          onDropPrompt: (nodeId: string, promptText: string) => {
            handleDispatch(promptText, nodeId);
          },
          onOpenLogs: (id: string) => setActiveLogNodeId(id)
        }
      };
    });
  }, [baseGraph.nodes, connectedHandlesByNodeId, isPuckDragging, activeRun, lastCompletedRun, currentRun]);

  const activeNode = useMemo(() => {
    return playableNodes.find(
      (n) => (n.data as any).status === 'running' || (n.data as any).status === 'waiting'
    );
  }, [playableNodes]);

  const activeNodeId = activeNode ? activeNode.id : null;
  const isIdle = !activeRun;

  const playableEdges = useMemo(() => {
    return baseGraph.edges.map((edge) => ({
      ...edge,
      animated: activeRun?.status === 'running'
    }));
  }, [baseGraph.edges, activeRun]);

  // Handle prompt dispatch when puck is dropped onto an Input Node
  const handleDispatch = useCallback(
    (promptText: string, inputNodeId: string) => {
      if (!selectedWorkflow || !selectedHarness) return;

      startRun(selectedWorkflow.id, selectedHarness.id, project.id, session?.id);
      setIsPuckDragging(false);
    },
    [selectedWorkflow, selectedHarness, project.id, session, startRun]
  );

  // Selected node for logs modal dialog
  const logModalNode = useMemo(() => {
    return (
      (playableNodes.find((n) => n.id === activeLogNodeId) as unknown as CanvasNode) || null
    );
  }, [playableNodes, activeLogNodeId]);

  // Current run step for the selected modal node
  const logModalRunStep = useMemo(() => {
    if (!currentRun || !logModalNode) return null;
    return (
      currentRun.steps.find(
        (st) =>
          st.groupId === logModalNode.id.replace(/^phase-/, '') ||
          st.groupName?.toLowerCase() === (logModalNode.data as PhaseNodeData).name?.toLowerCase()
      ) || currentRun.steps[currentRun.currentStep] || null
    );
  }, [currentRun, logModalNode]);

  // Setup HTML5 drop listener for the whole canvas
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const promptData = e.dataTransfer.getData('application/openharness-prompt') || e.dataTransfer.getData('text/plain');
    if (!promptData) return;

    // Detect target input node (node with isInput, or fallback to first node)
    const targetInput = playableNodes.find((n) => (n.data as PhaseNodeData).isInput) || playableNodes[0];
    if (targetInput) {
      handleDispatch(promptData, targetInput.id);
    }
  };

  return (
    <div
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
      className="relative flex h-full w-full flex-col min-h-0 bg-background overflow-hidden"
    >
      {/* Top Header Control Bar */}
      <div className="flex items-center justify-between border-b px-6 py-2.5 shrink-0 bg-muted/20 backdrop-blur-xs z-20">
        <div className="flex items-center gap-2.5">
          {/* Agent / Harness Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs font-semibold cursor-pointer max-w-[200px]"
              >
                <Cpu className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{selectedHarness?.name || 'Select Agent'}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Agent Harness
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSelectedHarnessId(null)}
                className="flex items-center justify-between cursor-pointer text-xs text-muted-foreground"
              >
                <span>None (No Agent)</span>
                {!selectedHarnessId && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
              {harnesses.map((h) => (
                <DropdownMenuItem
                  key={h.id}
                  onClick={() => setSelectedHarnessId(h.id)}
                  className="flex items-center justify-between cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Cpu className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{h.name}</span>
                  </div>
                  {selectedHarnessId === h.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-border" />

          {/* Workflow Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs font-semibold cursor-pointer max-w-[240px]"
              >
                <WorkflowIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{selectedWorkflow?.name || 'Select Workflow'}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                Workflows
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSelectedWorkflowId(null)}
                className="flex items-center justify-between cursor-pointer text-xs text-muted-foreground"
              >
                <span>None (No Workflow)</span>
                {!selectedWorkflowId && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
              {workflows.map((wf) => (
                <DropdownMenuItem
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  className="flex items-center justify-between cursor-pointer text-xs"
                >
                  <span className="truncate">{wf.name}</span>
                  {selectedWorkflowId === wf.id && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Active Run Status Badge (Only checkpoint pause, no executing 1/3) */}
          {activeRun?.status === 'waiting' && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono px-2 py-0.5 animate-pulse bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            >
              Checkpoint Paused
            </Badge>
          )}
        </div>

        {/* Right Actions: File Explorer, Terminal */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFileExplorerOpen(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
            title="Open Project File Explorer"
          >
            <FolderTree className="h-3.5 w-3.5" />
            Files
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTerminalOpen(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer font-medium"
            title="Open Interactive Shell Terminal"
          >
            <SquareTerminal className="h-3.5 w-3.5" />
            Terminal
          </Button>
        </div>
      </div>

      {/* Playable React Flow Canvas or Guidance State */}
      {!isReady ? (
        <div className="relative flex-1 h-full w-full min-h-0 flex flex-col items-center justify-center p-8 text-center select-none bg-background">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-4 border border-border/80 shadow-xs">
            {!selectedHarness && !selectedWorkflow ? (
              <WorkflowIcon className="h-7 w-7 opacity-60" />
            ) : !selectedHarness ? (
              <Cpu className="h-7 w-7 opacity-60" />
            ) : (
              <WorkflowIcon className="h-7 w-7 opacity-60" />
            )}
          </div>
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            {!selectedHarness && !selectedWorkflow
              ? 'Select Agent Harness and Workflow'
              : !selectedHarness
              ? 'Select Agent Harness'
              : 'Select Workflow'}
          </h2>
          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
            {!selectedHarness && !selectedWorkflow
              ? 'Choose an agent harness and workflow from the top bar to inspect the decision graph and dispatch tasks.'
              : !selectedHarness
              ? 'Choose an agent harness from the top bar to execute workflows in your project.'
              : 'Choose a workflow from the top bar to view the decision graph and start execution.'}
          </p>
        </div>
      ) : (
        <div className="relative flex-1 h-full w-full min-h-0 bg-background">
          <ReactFlowProvider>
            <ReactFlow
              nodes={playableNodes as unknown as Node[]}
              edges={playableEdges as unknown as Edge[]}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={false}
              panOnScroll={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              onDragOver={handleCanvasDragOver}
              onDrop={handleCanvasDrop}
              className="bg-background cursor-default execution-canvas"
            >
              <FlowCameraController activeNodeId={activeNodeId} isIdle={isIdle} />
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1.5}
                color="hsl(var(--muted-foreground) / 0.35)"
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}

      {/* Floating Collapsible Prompt Puck (Only shown when agent and workflow are selected) */}
      {isReady && (
        <PromptPuck
          onDispatch={(prompt) => {
            const targetInput = playableNodes.find((n) => (n.data as PhaseNodeData).isInput) || playableNodes[0];
            const entryId = targetInput?.id || 'start';
            handleDispatch(prompt, entryId);
          }}
          onDragStateChange={(dragging) => setIsPuckDragging(dragging)}
          disabled={activeRun?.status === 'running'}
        />
      )}

      {/* Node Execution Logs Modal Dialog */}
      <NodeLogModal
        isOpen={!!activeLogNodeId}
        onClose={() => setActiveLogNodeId(null)}
        node={logModalNode}
        runStep={logModalRunStep}
        onApproveGate={() => approveGate()}
        onStopRun={() => stopRun()}
      />

      {/* Embedded Terminal Modal */}
      <ProjectTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        projectPath={project.path}
        projectId={project.id}
        projectName={project.name}
      />

      {/* Project File Explorer Modal */}
      <ProjectFileExplorerDialog
        isOpen={isFileExplorerOpen}
        onClose={() => setIsFileExplorerOpen(false)}
        project={project}
      />
    </div>
  );
}
