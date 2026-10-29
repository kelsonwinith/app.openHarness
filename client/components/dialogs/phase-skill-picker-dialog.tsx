'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Layers,
  X,
  Workflow as WorkflowIcon,
  Calendar,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Skill } from '@/lib/domain/types';
import { useConsoleStore } from '@/lib/stores/console-store';
import { SkillDetailDialog } from '@/components/dialogs/skill-detail-dialog';
import { fmtDate, cn } from '@/lib/utils';

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
    <th className={cn('py-2.5 px-4 font-medium select-none', className)}>
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

interface PhaseSkillPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phaseName?: string;
  skills: Skill[];
  attachedSkillIds: Set<string>;
  onToggleSkill: (skill: Skill) => void;
}

export function PhaseSkillPickerDialog({
  isOpen,
  onClose,
  phaseName,
  skills,
  attachedSkillIds,
  onToggleSkill
}: PhaseSkillPickerDialogProps) {
  const getSkillUsageCount = useConsoleStore((s) => s.getSkillUsageCount);

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.instructions && s.instructions.toLowerCase().includes(q))
    );
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card text-card-foreground border-border shadow-2xl">
          {/* Header */}
          <DialogHeader className="border-b px-6 py-3.5 shrink-0 bg-muted/20">
            <div className="flex items-center justify-between gap-4 pr-7">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <DialogTitle className="text-sm font-semibold text-foreground truncate">
                    Add Skills to Node
                  </DialogTitle>
                  <DialogDescription className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Layers className="h-3 w-3" />
                    <span className="font-medium text-foreground">{phaseName || 'Selected Node'}</span>
                    <span>•</span>
                    <span>{attachedSkillIds.size} attached</span>
                  </DialogDescription>
                </div>
              </div>

              {/* Search Bar - Normal size at right side */}
              <div className="relative w-64 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills by name or instructions..."
                  className="h-8 pl-8 pr-7 text-xs bg-background/60 border-border"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Table Content (Direct edge-to-edge layout, without nested card borders) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {sortedSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-xs font-semibold text-foreground">
                  {search ? `No skills matching "${search}"` : 'No skills available'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {search
                    ? 'Try adjusting your search query'
                    : 'Install skills in the Skills catalog to attach them to workflow nodes'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-muted/40 backdrop-blur-xs z-10 border-b border-border/60">
                  <tr className="text-[11px] font-medium text-muted-foreground">
                    <SortHeader
                      label="Name"
                      field="name"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      className="pl-6"
                    />
                    <SortHeader
                      label="Workflows"
                      field="workflows"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      className="w-36"
                    />
                    <SortHeader
                      label="Date Added"
                      field="createdAt"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      className="w-36"
                    />
                    <th className="py-2.5 pr-6 font-medium w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sortedSkills.map((skill) => {
                    const isAttached = attachedSkillIds.has(skill.id);
                    const usageCount = getSkillUsageCount(skill.id);
                    const createdAt = skill.createdAt || Date.now();

                    return (
                      <tr
                        key={skill.id}
                        onClick={() => onToggleSkill(skill)}
                        className={cn(
                          'group hover:bg-muted/40 cursor-pointer transition-colors h-11',
                          isAttached && 'bg-emerald-500/[0.03]'
                        )}
                      >
                        {/* Name Column */}
                        <td className="py-2.5 pl-6 pr-4 align-middle">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={cn(
                                  'font-medium text-xs truncate transition-colors',
                                  isAttached
                                    ? 'text-foreground font-semibold'
                                    : 'text-foreground group-hover:text-primary'
                                )}
                              >
                                {skill.name}
                              </span>
                              {skill.source && (
                                <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                                  {skill.source}
                                </span>
                              )}
                            </div>
                            {skill.instructions && (
                              <span className="text-[11px] text-muted-foreground/70 line-clamp-1 font-mono">
                                {skill.instructions}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Workflows Column */}
                        <td className="py-2.5 px-4 align-middle text-muted-foreground">
                          {usageCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground">
                              <WorkflowIcon className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                              {usageCount} {usageCount === 1 ? 'workflow' : 'workflows'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-[11px] font-mono">—</span>
                          )}
                        </td>

                        {/* Date Added Column */}
                        <td className="py-2.5 px-4 align-middle text-muted-foreground text-[11px]">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                            {fmtDate(createdAt)}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-2.5 pl-4 pr-6 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="iconSm"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Inspect skill contents"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSkill(skill);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant={isAttached ? 'outline' : 'default'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSkill(skill);
                              }}
                              className={cn(
                                'group/btn h-7 w-20 px-2 text-xs font-medium shrink-0 cursor-pointer transition-all',
                                isAttached
                                  ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              )}
                            >
                              {isAttached ? (
                                <>
                                  <span className="flex items-center group-hover/btn:hidden">
                                    <Check className="h-3 w-3 mr-1" />
                                    Added
                                  </span>
                                  <span className="hidden items-center group-hover/btn:flex text-destructive">
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Attach
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Preview Dialog */}
      <SkillDetailDialog
        skill={previewSkill}
        isOpen={!!previewSkill}
        onClose={() => setPreviewSkill(null)}
        usageCount={previewSkill ? getSkillUsageCount(previewSkill.id) : 0}
      />
    </>
  );
}
