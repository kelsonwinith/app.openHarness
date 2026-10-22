'use client';

import React from 'react';
import { LaunchRunDialog } from './launch-run-dialog';
import { AddSkillDialog } from './add-skill-dialog';
import { EditStepDialog } from './edit-step-dialog';
import { WorkflowFormDialog } from './workflow-form-dialog';
import { SkillFormDialog } from './skill-form-dialog';
import { ConfirmDialog } from './confirm-dialog';
import { ProjectCreateDialog } from './project-create-dialog';
import { ProjectOpenDialog } from './project-open-dialog';
import { ProjectCloneDialog } from './project-clone-dialog';
import { SessionFormDialog } from './session-form-dialog';

export function GlobalDialogs() {
  return (
    <>
      <LaunchRunDialog />
      <AddSkillDialog />
      <EditStepDialog />
      <WorkflowFormDialog />
      <SkillFormDialog />
      <ConfirmDialog />
      <ProjectCreateDialog />
      <ProjectOpenDialog />
      <ProjectCloneDialog />
      <SessionFormDialog />
    </>
  );
}
