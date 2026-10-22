import { DEFAULT_SKILLS, GENERIC_PLAN, PLANS } from './constants';
import { Activity, ActivityKind, HarnessId, Run, Skill, Step, Workflow } from './types';
import { uid } from '../utils';

export function createStep(skillId: string, gate = false, instructions = ''): Step {
  return {
    id: uid('step'),
    skillId,
    gate,
    instructions
  };
}

export function buildSampleRun(wf: Workflow, harnessId: HarnessId, startedAt: number): Run {
  let t = startedAt;
  const steps = wf.steps.map((s) => {
    const plan = PLANS[s.skillId] || GENERIC_PLAN;
    const start = t;
    const activities: Activity[] = plan.slice(0, 3).map((p, j) => ({
      k: p.k as ActivityKind,
      arg: p.arg,
      text: p.text,
      at: start + j * 13000
    }));

    if (s.gate) {
      activities.push({
        k: 'gate-ok',
        gate: true,
        text: 'Approved by you — continuing',
        at: start + 48000
      });
    }

    t = start + 71000;
    const skill = DEFAULT_SKILLS.find((sk) => sk.id === s.skillId);
    return {
      id: uid('rst'),
      stepId: s.id,
      skillId: s.skillId,
      name: skill ? skill.name : 'Unknown skill',
      gate: !!s.gate,
      instructions: s.instructions || '',
      status: 'done' as const,
      activities,
      startedAt: start,
      endedAt: t
    };
  });

  return {
    id: uid('run'),
    workflowId: wf.id,
    workflowName: wf.name,
    harnessId,
    status: 'completed',
    startedAt,
    endedAt: t,
    pausedMs: 0,
    pausedAt: null,
    currentStep: steps.length,
    speed: 1,
    steps
  };
}

export function generateSampleData(): {
  skills: Skill[];
  workflows: Workflow[];
  runs: Run[];
} {
  return {
    skills: [],
    workflows: [],
    runs: []
  };
}
