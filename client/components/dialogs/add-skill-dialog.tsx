'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Skill } from '@/lib/domain/types';
import { SkillDetailDialog } from '@/components/dialogs/skill-detail-dialog';
import { fmtDate, cn } from '@/lib/utils';
import {
  Search,
  Workflow as WorkflowIcon,
  Calendar,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles
} from 'lucide-react';

type SortField = 'name' | 'workflows' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  currentOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
}

function SortHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
  className
}: SortHeaderProps) {
  const isActive = currentField === field;
  return (
    <th className={cn('py-2 px-3 font-medium select-none', className)}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer text-[11px] font-medium group"
      >
        <span className={isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}>
          {label}
        </span>
        {isActive ? (
          currentOrder === 'asc' ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        )}
      </button>
    </th>
  );
}

export function AddSkillDialog() {
  const { activeDialog, dialogPayload, closeDialog } = useUIStore();
  const skills = useConsoleStore((s) => s.skills);
  const workflows = useConsoleStore((s) => s.workflows);
  const addStep = useConsoleStore((s) => s.addStep);
  const deleteStep = useConsoleStore((s) => s.deleteStep);
  const addSkillToGroup = useConsoleStore((s) => s.addSkillToGroup);
  const deleteGroupStep = useConsoleStore((s) => s.deleteGroupStep);
  const getSkillUsageCount = useConsoleStore((s) => s.getSkillUsageCount);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);

  const isOpen = activeDialog === 'add-skill';
  const workflowId = dialogPayload?.workflowId as string | undefined;
  const groupId = dialogPayload?.groupId as string | undefined;

  const currentWorkflow = useMemo(() => {
    return workflows.find((w) => w.id === workflowId);
  }, [workflows, workflowId]);

  const currentGroup = useMemo(() => {
    if (!currentWorkflow || !groupId) return null;
    return currentWorkflow.groups?.find((g) => g.id === groupId);
  }, [currentWorkflow, groupId]);

  // Set of skill IDs currently included in the target group/workflow
  const includedSkillIds = useMemo(() => {
    const set = new Set<string>();
    if (currentGroup) {
      for (const step of currentGroup.steps) {
        set.add(step.skillId);
      }
    } else if (currentWorkflow) {
      for (const step of currentWorkflow.steps) {
        set.add(step.skillId);
      }
    }
    return set;
  }, [currentGroup, currentWorkflow]);

  // Map of skill ID -> name of other group it is included in within this workflow
  const otherGroupUsage = useMemo(() => {
    const map = new Map<string, string>();
    if (!currentWorkflow?.groups) return map;

    for (const grp of currentWorkflow.groups) {
      if (grp.id === groupId) continue;
      for (const step of grp.steps) {
        if (!map.has(step.skillId)) {
          map.set(step.skillId, grp.name);
        }
      }
    }
    return map;
  }, [currentWorkflow, groupId]);

  const filteredSkills = useMemo(() => {
    return skills.filter((s) => {
      return search === '' || s.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [skills, search]);

  const sortedSkills = useMemo(() => {
    return [...filteredSkills].sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortField === 'workflows') {
        const countA = getSkillUsageCount(a.id);
        const countB = getSkillUsageCount(b.id);
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      }
      if (sortField === 'createdAt') {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
  }, [filteredSkills, sortField, sortOrder, getSkillUsageCount]);

  if (!isOpen || !workflowId) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const handleToggle = (skillId: string) => {
    const isIncluded = includedSkillIds.has(skillId);

    if (isIncluded) {
      // Remove all instances of this skill from the target group or workflow
      if (groupId && currentGroup) {
        const matchingSteps = currentGroup.steps.filter((st) => st.skillId === skillId);
        matchingSteps.forEach((st) => {
          deleteGroupStep(workflowId, groupId, st.id);
        });
      } else if (currentWorkflow) {
        const matchingSteps = currentWorkflow.steps.filter((st) => st.skillId === skillId);
        matchingSteps.forEach((st) => {
          deleteStep(workflowId, st.id);
        });
      }
    } else {
      // Add skill to target group or workflow
      if (groupId) {
        addSkillToGroup(workflowId, groupId, skillId, false, '');
      } else {
        addStep(workflowId, skillId);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden gap-0 border-border bg-card">
          {/* Header */}
          <DialogHeader className="px-5 py-3.5 border-b shrink-0 bg-muted/10">
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <span>Manage Workflow Skills</span>
                  {currentGroup && (
                    <Badge variant="outline" className="text-[10px] font-medium font-sans gap-1 text-primary border-primary/30">
                      <Layers className="h-3 w-3" />
                      {currentGroup.name}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] font-mono font-medium">
                    {includedSkillIds.size} included
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Toggle skills to include or exclude them from this workflow node.
                </DialogDescription>
              </div>

              {/* Search Bar */}
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter skills by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background/60"
                  autoFocus
                />
              </div>
            </div>
          </DialogHeader>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-background/50">
            {sortedSkills.length > 0 ? (
              <div className="rounded-lg border border-border/70 bg-card overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-medium text-muted-foreground">
                      <SortHeader
                        label="Skill Name"
                        field="name"
                        currentField={sortField}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <SortHeader
                        label="Workflows"
                        field="workflows"
                        currentField={sortField}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                        className="w-32"
                      />
                      <SortHeader
                        label="Date Added"
                        field="createdAt"
                        currentField={sortField}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                        className="w-32"
                      />
                      <th className="py-2 px-4 font-medium w-32 text-right">Include</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {sortedSkills.map((skill) => {
                      const isIncluded = includedSkillIds.has(skill.id);
                      const otherGroupName = otherGroupUsage.get(skill.id);
                      const usageCount = getSkillUsageCount(skill.id);
                      const createdAt = skill.createdAt || Date.now();

                      return (
                        <tr
                          key={skill.id}
                          onClick={() => handleToggle(skill.id)}
                          className={cn(
                            'group hover:bg-muted/40 cursor-pointer transition-colors h-10 select-none',
                            isIncluded && 'bg-primary/5 hover:bg-primary/10'
                          )}
                        >
                          {/* Name Column */}
                          <td className="py-2 px-3 align-middle">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={cn(
                                  'text-xs transition-colors truncate',
                                  isIncluded
                                    ? 'font-semibold text-foreground group-hover:text-primary'
                                    : 'font-medium text-foreground/85 group-hover:text-foreground'
                                )}
                              >
                                {skill.name}
                              </span>

                              {skill.source && (
                                <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                                  {skill.source}
                                </span>
                              )}

                              {isIncluded && (
                                <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0 font-medium">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  Included
                                </span>
                              )}

                              {!isIncluded && otherGroupName && (
                                <span
                                  className="text-[10px] font-mono text-muted-foreground bg-muted/60 border border-border px-1.5 py-0.5 rounded inline-flex items-center gap-1 shrink-0"
                                  title={`This skill is also used in the "${otherGroupName}" group`}
                                >
                                  In &ldquo;{otherGroupName}&rdquo;
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Workflows Column */}
                          <td className="py-2 px-3 align-middle text-muted-foreground">
                            {usageCount > 0 ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                                <WorkflowIcon className="h-2.5 w-2.5 text-muted-foreground" />
                                {usageCount} {usageCount === 1 ? 'workflow' : 'workflows'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50 text-[11px] font-mono">—</span>
                            )}
                          </td>

                          {/* Date Added Column */}
                          <td className="py-2 px-3 align-middle text-muted-foreground text-[11px]">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground/60" />
                              {fmtDate(createdAt)}
                            </span>
                          </td>

                          {/* Action / Toggle Column */}
                          <td className="py-2 px-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewSkill(skill);
                                }}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Preview Skill"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

                              <Switch
                                checked={isIncluded}
                                onCheckedChange={() => handleToggle(skill.id)}
                                aria-label={`Toggle inclusion of ${skill.name}`}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed border-border/70">
                <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-foreground">No matching skills found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Try refining your search term or install new skills from the Skills Library.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Embedded Skill Preview Dialog */}
      {previewSkill && (
        <SkillDetailDialog
          skill={previewSkill}
          isOpen={!!previewSkill}
          onClose={() => setPreviewSkill(null)}
          usageCount={getSkillUsageCount(previewSkill.id)}
        />
      )}
    </>
  );
}
