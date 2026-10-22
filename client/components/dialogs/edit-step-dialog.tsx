'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { ShieldAlert, RotateCcw } from 'lucide-react';

function EditStepContent({ workflowId, stepId }: { workflowId: string; stepId: string }) {
  const { closeDialog } = useUIStore();
  const workflows = useConsoleStore((s) => s.workflows);
  const skills = useConsoleStore((s) => s.skills);
  const updateStep = useConsoleStore((s) => s.updateStep);

  const workflow = workflows.find((w) => w.id === workflowId);
  const step = workflow?.steps.find((s) => s.id === stepId);
  const baseSkill = skills.find((s) => s.id === step?.skillId);

  const [gate, setGate] = useState(!!step?.gate);
  const [instructions, setInstructions] = useState(step?.instructions || '');

  if (!workflow || !step || !baseSkill) return null;

  const handleSave = () => {
    updateStep(workflow.id, step.id, {
      gate,
      instructions: instructions.trim()
    });
    closeDialog();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-sm">Configure Step: {baseSkill.name}</DialogTitle>
        <DialogDescription>
          Customize gate checkpoints and instruction overrides for this step in <strong>{workflow.name}</strong>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Gate checkpoint toggle */}
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3 bg-muted/20">
          <div>
            <div className="flex items-center gap-1.5 font-medium text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
              <span>Approval Gate Checkpoint</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-normal">
              Pause the run at the end of this step until manually approved or rejected.
            </p>
          </div>
          <input
            type="checkbox"
            id="gateCheckbox"
            checked={gate}
            onChange={(e) => setGate(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
          />
        </div>

        {/* Base skill instructions (read-only reference) */}
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground">Default Skill Instructions</span>
          <div className="rounded-md border bg-muted/40 p-2 text-[11px] text-muted-foreground leading-relaxed max-h-24 overflow-y-auto">
            {baseSkill.instructions}
          </div>
        </div>

        {/* Instruction override */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Instruction Override (Optional)
            </label>
            {instructions && (
              <button
                onClick={() => setInstructions('')}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
          <Textarea
            placeholder="Provide workflow-specific instructions that append to or override the base skill..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="text-xs min-h-[90px]"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function EditStepDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const isOpen = activeDialog === 'edit-step';
  const workflowId = dialogPayload?.workflowId as string | undefined;
  const stepId = dialogPayload?.stepId as string | undefined;

  if (!isOpen || !workflowId || !stepId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <EditStepContent key={stepId} workflowId={workflowId} stepId={stepId} />
    </Dialog>
  );
}
