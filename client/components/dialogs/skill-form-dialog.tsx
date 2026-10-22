'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Loader2 } from 'lucide-react';

function parseSourceToName(source: string): string {
  let s = source.trim();
  s = s.replace(/^(?:npx\s+)?skills\s+(?:add\s+)?/, '').trim();

  // 1. Check for explicit --skill or -s flag
  const skillFlagMatch = s.match(/(?:--skill|-s)\s+([a-zA-Z0-9_-]+)/);
  if (skillFlagMatch && skillFlagMatch[1]) {
    return skillFlagMatch[1].trim();
  }

  // 2. Check for package@skill syntax
  if (s.includes('@') && !s.startsWith('@')) {
    const atParts = s.split('@');
    if (atParts.length > 1) {
      const candidate = atParts[1].split(' ')[0].trim();
      if (candidate) return candidate;
    }
  }

  // 3. GitHub repository URL
  if (s.includes('github.com/')) {
    const parts = s.split('github.com/')[1].split(' ')[0].split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].replace('.git', '');
    }
  }

  // 4. Default fallback
  const firstToken = s.split(' ')[0];
  return firstToken.split('/').pop()?.replace('.git', '') || firstToken;
}

interface SkillFormValues {
  name: string;
  source: string;
}

function SkillFormContent({ skillId }: { skillId?: string }) {
  const { closeDialog } = useUIStore();
  const skills = useConsoleStore((s) => s.skills);
  const createSkill = useConsoleStore((s) => s.createSkill);
  const updateSkill = useConsoleStore((s) => s.updateSkill);

  const skill = skills.find((s) => s.id === skillId);
  const isEditing = !!skill;

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors }
  } = useForm<SkillFormValues>({
    defaultValues: {
      name: skill?.name || '',
      source: ''
    }
  });

  const onSubmit = async (data: SkillFormValues) => {
    if (isEditing && skill) {
      updateSkill(skill.id, {
        name: data.name.trim()
      });
      closeDialog();
    } else {
      setLoading(true);
      clearErrors('root');
      try {
        const res = await fetch('/api/skills/install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: data.source.trim() })
        });
        const resData = await res.json();
        if (!res.ok) {
          throw new Error(resData.error || 'Failed to install skill');
        }
        createSkill(resData.skill);
        closeDialog();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error installing skill';
        setError('root', { message: msg });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <DialogContent className="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEditing ? 'Rename Skill' : 'Install Skill'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the name of this skill.'
              : 'Enter an NPX package name or GitHub repository URL to install into your skill library via official CLI.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3">
          {errors.root && (
            <p className="text-xs text-destructive font-medium bg-destructive/10 border border-destructive/20 rounded px-2.5 py-1.5">
              {errors.root.message}
            </p>
          )}
          {isEditing ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Skill Name</label>
              <Input
                placeholder="Skill name"
                aria-invalid={!!errors.name}
                {...register('name', {
                  required: 'Skill name is required',
                  validate: (val) => val.trim().length > 0 || 'Skill name cannot be empty'
                })}
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">NPX Package or GitHub URL</label>
              <Input
                placeholder="e.g. npx skills add vercel-react-best-practices or github.com/owner/repo"
                aria-invalid={!!errors.source}
                disabled={loading}
                {...register('source', {
                  required: 'Package or repository source is required',
                  validate: (val) => val.trim().length > 0 || 'Package source cannot be empty'
                })}
                autoFocus
              />
              {errors.source && (
                <p className="text-xs text-destructive font-medium">{errors.source.message}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeDialog} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Install Skill'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

export function SkillFormDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const isOpen = activeDialog === 'skill-form';
  const skillId = dialogPayload?.skillId as string | undefined;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <SkillFormContent skillId={skillId} />
    </Dialog>
  );
}
