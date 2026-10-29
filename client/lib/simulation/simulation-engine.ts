import { GENERIC_PLAN, PLANS } from '../domain/constants';
import { ActivityKind, Run, RunStep } from '../domain/types';

export type SimulationCallback = (updatedRun: Run, eventType?: 'activity' | 'gate' | 'completed' | 'stopped') => void;

export class SimulationEngine {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private activeRun: Run | null = null;
  private onUpdate: SimulationCallback | null = null;

  registerListener(listener: SimulationCallback) {
    this.onUpdate = listener;
  }

  attachRun(run: Run | null) {
    this.activeRun = run;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (run && run.status === 'running') {
      this.scheduleNextTick(350);
    }
  }

  private getPlanForSkill(skillId: string) {
    return PLANS[skillId] || GENERIC_PLAN;
  }

  scheduleNextTick(delay?: number) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.activeRun || this.activeRun.status !== 'running') return;

    const speed = this.activeRun.speed || 1;
    const wait = typeof delay === 'number' ? delay : (680 + Math.random() * 420) / speed;
    this.timer = setTimeout(() => this.tick(), Math.max(100, wait));
  }

  private tick() {
    if (!this.activeRun || this.activeRun.status !== 'running') return;

    const step = this.activeRun.steps[this.activeRun.currentStep];
    if (!step) {
      this.completeRun();
      return;
    }

    if (step.status === 'pending') {
      step.status = 'running';
      step.startedAt = Date.now();
    }

    const plan = this.getPlanForSkill(step.skillId);
    if (step.activities.length < plan.length) {
      const item = plan[step.activities.length];
      step.activities.push({
        k: item.k as ActivityKind,
        arg: item.arg,
        text: item.text,
        at: Date.now()
      });

      this.onUpdate?.(this.activeRun, 'activity');
      this.scheduleNextTick();
      return;
    }

    this.finishStep(step);
  }

  private finishStep(step: RunStep) {
    if (!this.activeRun) return;

    step.endedAt = Date.now();
    if (step.gate) {
      step.status = 'waiting';
      step.activities.push({
        k: 'gate',
        gate: true,
        text: 'Approval required to continue',
        at: Date.now()
      });
      this.activeRun.status = 'waiting';
      this.onUpdate?.(this.activeRun, 'gate');
      return;
    }

    step.status = 'done';
    step.activities.push({
      k: 'done',
      text: 'Step complete',
      at: Date.now()
    });

    this.activeRun.currentStep += 1;
    if (this.activeRun.currentStep >= this.activeRun.steps.length) {
      this.completeRun();
      return;
    }

    this.onUpdate?.(this.activeRun, 'activity');
    this.scheduleNextTick();
  }

  private completeRun() {
    if (!this.activeRun) return;
    this.activeRun.status = 'completed';
    this.activeRun.endedAt = Date.now();
    this.activeRun.currentStep = this.activeRun.steps.length;
    this.onUpdate?.(this.activeRun, 'completed');
  }

  pause() {
    if (!this.activeRun || this.activeRun.status !== 'running') return;
    if (this.timer) clearTimeout(this.timer);
    this.activeRun.status = 'paused';
    this.activeRun.pausedAt = Date.now();
    this.onUpdate?.(this.activeRun, 'stopped');
  }

  resume() {
    if (!this.activeRun || this.activeRun.status !== 'paused') return;
    if (this.activeRun.pausedAt) {
      this.activeRun.pausedMs = (this.activeRun.pausedMs || 0) + (Date.now() - this.activeRun.pausedAt);
    }
    this.activeRun.pausedAt = null;
    this.activeRun.status = 'running';
    this.onUpdate?.(this.activeRun, 'activity');
    this.scheduleNextTick(200);
  }

  stop() {
    if (!this.activeRun) return;
    if (this.timer) clearTimeout(this.timer);
    const step = this.activeRun.steps[this.activeRun.currentStep];
    if (step && ['running', 'waiting', 'pending'].includes(step.status)) {
      step.status = 'stopped';
      step.endedAt = Date.now();
      step.activities.push({ k: 'stop', text: 'Stopped by user', at: Date.now() });
    }
    this.activeRun.status = 'stopped';
    this.activeRun.endedAt = Date.now();
    this.activeRun.pausedAt = null;
    this.onUpdate?.(this.activeRun, 'stopped');
  }

  approveGate() {
    if (!this.activeRun || this.activeRun.status !== 'waiting') return;
    const step = this.activeRun.steps[this.activeRun.currentStep];
    if (!step) return;

    step.status = 'done';
    step.endedAt = Date.now();
    step.activities.push({
      k: 'gate-ok',
      gate: true,
      text: 'Approved by you — continuing',
      at: Date.now()
    });

    this.activeRun.status = 'running';
    this.activeRun.currentStep += 1;

    if (this.activeRun.currentStep >= this.activeRun.steps.length) {
      this.completeRun();
      return;
    }

    this.onUpdate?.(this.activeRun, 'activity');
    this.scheduleNextTick(250);
  }

  rejectGate() {
    if (!this.activeRun || this.activeRun.status !== 'waiting') return;
    const step = this.activeRun.steps[this.activeRun.currentStep];
    if (step) {
      step.status = 'blocked';
      step.endedAt = Date.now();
      step.activities.push({
        k: 'gate-no',
        gate: true,
        text: 'Rejected by you — run stopped',
        at: Date.now()
      });
    }
    this.activeRun.status = 'stopped';
    this.activeRun.endedAt = Date.now();
    this.onUpdate?.(this.activeRun, 'stopped');
  }

  reviseGate(feedback: string) {
    if (!this.activeRun || this.activeRun.status !== 'waiting') return;
    const currentStep = this.activeRun.steps[this.activeRun.currentStep];
    if (!currentStep) return;

    const currentGroupId = currentStep.groupId;

    // Find the first step in this group to restart reproduction from
    let firstGroupStepIdx = this.activeRun.currentStep;
    if (currentGroupId) {
      const idx = this.activeRun.steps.findIndex((s) => s.groupId === currentGroupId);
      if (idx !== -1) firstGroupStepIdx = idx;
    }

    // Reset all steps in this group back to pending and log user feedback
    this.activeRun.steps.forEach((step, idx) => {
      const isSameGroup = currentGroupId ? step.groupId === currentGroupId : idx === this.activeRun!.currentStep;
      if (isSameGroup) {
        step.status = 'pending';
        step.startedAt = null;
        step.endedAt = null;
        step.activities.push({
          k: 'ask',
          text: `Feedback received: "${feedback.trim()}" — re-running step`,
          at: Date.now()
        });
      }
    });

    this.activeRun.currentStep = firstGroupStepIdx;
    this.activeRun.status = 'running';
    this.onUpdate?.(this.activeRun, 'activity');
    this.scheduleNextTick(250);
  }

  setSpeed(speed: number) {
    if (!this.activeRun) return;
    this.activeRun.speed = speed;
    this.onUpdate?.(this.activeRun);
    if (this.activeRun.status === 'running') {
      this.scheduleNextTick(150);
    }
  }
}

export const simulationEngine = new SimulationEngine();
