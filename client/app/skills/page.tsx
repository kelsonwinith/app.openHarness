'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Library,
  Plus,
  Search,
  Trash2,
  Workflow as WorkflowIcon,
  Eye,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skill } from '@/lib/domain/types';
import { SkillDetailDialog } from '@/components/dialogs/skill-detail-dialog';
import { fmtDate, fmtRel, cn } from '@/lib/utils';

type SortField = 'name' | 'workflows' | 'createdAt' | 'updatedAt';
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

export default function SkillsPage() {
  const skills = useConsoleStore((s) => s.skills);
  const workflows = useConsoleStore((s) => s.workflows);
  const syncSkills = useConsoleStore((s) => s.syncSkills);
  const deleteSkill = useConsoleStore((s) => s.deleteSkill);
  const getSkillUsageCount = useConsoleStore((s) => s.getSkillUsageCount);

  const openDialog = useUIStore((s) => s.openDialog);

  const [loading, setLoading] = useState(skills.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadSkills = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    else if (skills.length === 0) setLoading(true);

    try {
      const res = await fetch('/api/skills/list');
      const data = await res.json();
      if (data.skills && Array.isArray(data.skills)) {
        syncSkills(data.skills);
      }
    } catch {
      // Ignore network / parse errors
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [skills.length, syncSkills]);

  useEffect(() => {
    loadSkills(false);

    const handleFocus = () => {
      loadSkills(false);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadSkills]);

  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
      if (sortField === 'updatedAt') {
        const timeA = a.updatedAt || a.createdAt || 0;
        const timeB = b.updatedAt || b.createdAt || 0;
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

  const handleDeleteSkill = (skill: Skill, e: React.MouseEvent) => {
    e.stopPropagation();
    const usage = getSkillUsageCount(skill.id);
    const affectedWfs = workflows.filter((w) =>
      w.steps.some((s) => s.skillId === skill.id) ||
      (w.groups || []).some((g) => g.steps.some((s) => s.skillId === skill.id))
    );

    openDialog('confirm', {
      title: `Delete skill "${skill.name}"?`,
      description:
        usage > 0
          ? `This skill is currently referenced in ${usage} step(s) across ${affectedWfs.length} workflow(s). Deleting it will execute "npx skills remove --global ${skill.name}" and automatically prune those step references from each affected workflow.`
          : `This will execute "npx skills remove --global ${skill.name}" and permanently delete it from ~/.agents/skills.`,
      confirmLabel: 'Delete Skill',
      confirmVariant: 'destructive',
      onConfirm: async () => {
        try {
          await fetch('/api/skills/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skillName: skill.name })
          });
        } catch (err) {
          console.error('Failed to remove skill via CLI:', err);
        }

        deleteSkill(skill.id);
        if (selectedSkill?.id === skill.id) {
          setSelectedSkill(null);
        }
      }
    });
  };

  const selectedUsageCount = selectedSkill ? getSkillUsageCount(selectedSkill.id) : 0;

  return (
    <div className="flex h-full w-full flex-col min-h-0 bg-background overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b px-6 py-3.5 shrink-0 bg-muted/10">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Skills
          </h1>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground flex items-center gap-1.5">
            {skills.length}
            {(loading || isRefreshing) && (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter installed skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background/60"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSkills(true)}
            disabled={loading || isRefreshing}
            className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer bg-background/60"
            title="Re-scan skills from disk"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-primary')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => openDialog('skill-form')}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Install Skill
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {loading && skills.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-3" />
            <p className="text-xs font-semibold text-foreground">Loading skills from disk...</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Scanning local and global agent skill repositories</p>
          </div>
        ) : sortedSkills.length > 0 ? (
          <div className="rounded-lg border border-border/70 bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-medium text-muted-foreground">
                    <SortHeader
                      label="Name"
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
                    <SortHeader
                      label="Updated"
                      field="updatedAt"
                      currentField={sortField}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      className="w-36"
                    />
                    <th className="py-2.5 px-4 font-medium w-20 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {sortedSkills.map((skill) => {
                    const usageCount = getSkillUsageCount(skill.id);
                    const createdAt = skill.createdAt || Date.now();
                    const updatedAt = skill.updatedAt || createdAt;

                    return (
                      <tr
                        key={skill.id}
                        onClick={() => setSelectedSkill(skill)}
                        className="group hover:bg-muted/40 cursor-pointer transition-colors h-11"
                      >
                        {/* Name Column */}
                        <td className="py-2.5 px-4 align-middle">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate">
                              {skill.name}
                            </span>
                            {skill.source && (
                              <span className="text-[10px] font-mono text-muted-foreground/70 bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                                {skill.source}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Workflows Column */}
                        <td className="py-2.5 px-4 align-middle text-muted-foreground">
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
                        <td className="py-2.5 px-4 align-middle text-muted-foreground text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground/60" />
                            {fmtDate(createdAt)}
                          </span>
                        </td>

                        {/* Updated At Column */}
                        <td className="py-2.5 px-4 align-middle text-muted-foreground text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/60" />
                            {fmtRel(updatedAt)}
                          </span>
                        </td>

                        {/* Actions Column: Always visible trash icon & inspect icon */}
                        <td className="py-2.5 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="iconSm"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Inspect skill contents"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSkill(skill);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="iconSm"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                              title="Delete skill"
                              onClick={(e) => handleDeleteSkill(skill, e)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground shadow-xs">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {search ? 'No matching skills found' : 'No skills installed'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {search
                ? `No installed skills match "${search}". Try adjusting your search query.`
                : 'Install or import agent skills via NPX or GitHub repository to compose your workflow sequences.'}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => openDialog('skill-form')}
                className="mt-4 gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Install Skill
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal with File Explorer */}
      {selectedSkill && (
        <SkillDetailDialog
          skill={selectedSkill}
          isOpen={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          usageCount={selectedUsageCount}
        />
      )}
    </div>
  );
}
