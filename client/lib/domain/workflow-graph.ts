import { Workflow, CanvasNode, CanvasEdge, PhaseNodeData, InputNodeData, StepGroup, Step } from './types';

/**
 * Ensures a workflow has valid nodes and edges for React Flow.
 * If graph data does not exist, automatically synthesizes a graph from groups/steps.
 */
export function ensureWorkflowGraph(wf: Workflow): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  if (Array.isArray(wf.nodes)) {
    // Normalize any legacy input nodes to unified phase nodes with isInput: true
    const normalizedNodes: CanvasNode[] = wf.nodes.map((node) => {
      if (node.type === 'workflowInput' || node.type === 'input') {
        const inputData = node.data as any;
        return {
          ...node,
          type: 'phase',
          data: {
            name: inputData.label || inputData.name || 'Input Entry',
            isInput: true,
            gate: false,
            harnessId: 'opencode',
            steps: inputData.steps || []
          } as PhaseNodeData
        };
      }
      return node;
    });

    const normalizedEdges: CanvasEdge[] = (wf.edges || []).map((edge) => ({
      ...edge,
      sourceHandle: edge.sourceHandle || 'bottom',
      targetHandle: edge.targetHandle || 'top',
      animated: edge.animated !== undefined ? edge.animated : true
    }));

    return {
      nodes: normalizedNodes,
      edges: normalizedEdges
    };
  }

  // If workflow has no existing groups or steps, start with an empty canvas
  if ((!wf.groups || wf.groups.length === 0) && (!wf.steps || wf.steps.length === 0)) {
    return { nodes: [], edges: [] };
  }

  // Synthesize from groups or steps
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  const groups = wf.groups && wf.groups.length > 0
    ? wf.groups
    : [
        {
          id: 'group-default',
          name: 'Execution Node',
          gate: false,
          isInput: true,
          steps: wf.steps || []
        }
      ];

  let prevNodeId: string | null = null;

  groups.forEach((group, index) => {
    const phaseNodeId = `phase-${group.id || index}`;
    nodes.push({
      id: phaseNodeId,
      type: 'phase',
      position: { x: 220, y: 70 + index * 190 },
      data: {
        name: group.name,
        description: group.description,
        gate: group.gate || false,
        isInput: group.isInput !== undefined ? group.isInput : index === 0,
        harnessId: 'opencode',
        steps: group.steps || []
      } as PhaseNodeData
    });

    if (prevNodeId) {
      edges.push({
        id: `e-${prevNodeId}-${phaseNodeId}`,
        source: prevNodeId,
        sourceHandle: 'bottom',
        target: phaseNodeId,
        targetHandle: 'top',
        animated: true
      });
    }

    prevNodeId = phaseNodeId;
  });

  return { nodes, edges };
}

/**
 * Converts a graph of CanvasNode and CanvasEdge back into step groups and steps for storage.
 */
export function syncGraphToWorkflow(
  wf: Workflow,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): Workflow {
  // Extract phase nodes
  const phaseNodes = nodes.filter((n) => n.type === 'phase');

  const groups: StepGroup[] = phaseNodes.map((n) => {
    const data = n.data as PhaseNodeData;
    return {
      id: n.id.replace(/^phase-/, ''),
      name: data.name || 'Untitled Node',
      description: data.description,
      gate: !!data.gate,
      isInput: !!data.isInput,
      steps: data.steps || []
    };
  });

  const steps: Step[] = [];
  groups.forEach((g) => {
    (g.steps || []).forEach((st) => {
      steps.push({ ...st, groupId: g.id });
    });
  });

  return {
    ...wf,
    nodes,
    edges,
    groups,
    steps,
    updatedAt: Date.now()
  };
}

/**
 * Returns an ordered array of Phase nodes reachable from a given input node ID by following edges.
 */
export function getExecutionPathFromInput(
  inputId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): CanvasNode[] {
  const result: CanvasNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  let currentId: string | undefined = inputId;
  visited.add(currentId);

  while (currentId) {
    // Find outbound edges from currentId
    const outbound = edges.filter((e) => e.source === currentId);
    if (outbound.length === 0) break;

    // Pick first unvisited target
    const nextEdge = outbound.find((e) => !visited.has(e.target));
    if (!nextEdge) break;

    currentId = nextEdge.target;
    visited.add(currentId);

    const targetNode = nodeMap.get(currentId);
    if (targetNode && targetNode.type === 'phase') {
      result.push(targetNode);
    }
  }

  return result;
}
