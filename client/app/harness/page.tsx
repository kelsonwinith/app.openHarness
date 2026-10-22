'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Cpu,
  Search,
  Calendar
} from 'lucide-react';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Harness } from '@/lib/domain/types';
import { DynamicIcon } from '@/components/icons/dynamic-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddHarnessDialog } from '@/components/dialogs/add-harness-dialog';
import { fmtDate } from '@/lib/utils';

export default function HarnessPage() {
  const harnesses = useConsoleStore((s) => s.harnesses);
  const deleteHarness = useConsoleStore((s) => s.deleteHarness);
  const openDialog = useUIStore((s) => s.openDialog);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredHarnesses = useMemo(() => {
    return harnesses.filter((h) => {
      const q = search.toLowerCase();
      return h.name.toLowerCase().includes(q);
    });
  }, [harnesses, search]);

  const handleDeleteHarness = (h: Harness, e: React.MouseEvent) => {
    e.stopPropagation();
    openDialog('confirm', {
      title: `Remove "${h.name}" from active harnesses?`,
      description: 'This harness will no longer be selectable in projects until re-added.',
      confirmLabel: 'Remove Harness',
      confirmVariant: 'destructive',
      onConfirm: () => {
        deleteHarness(h.id);
      }
    });
  };

  return (
    <div className="flex h-full w-full flex-col min-h-0 bg-background overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b px-6 py-3.5 shrink-0 bg-muted/10">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold tracking-tight text-foreground">
            Harness
          </h1>
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {harnesses.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter added harnesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background/60"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Harness
          </Button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {filteredHarnesses.length > 0 ? (
          <div className="rounded-lg border border-border/70 bg-card overflow-hidden shadow-xs w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-medium text-muted-foreground select-none">
                    <th className="py-2.5 px-4 font-medium">Name</th>
                    <th className="py-2.5 px-4 font-medium w-36">Version</th>
                    <th className="py-2.5 px-4 font-medium w-44">Added</th>
                    <th className="py-2.5 px-4 font-medium w-20 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredHarnesses.map((h) => {
                    const addedAt = h.addedAt || Date.now();

                    return (
                      <tr
                        key={h.id}
                        className="group hover:bg-muted/40 transition-colors"
                      >
                        {/* Name Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-1.5 text-foreground shrink-0">
                              <DynamicIcon name={h.icon || 'SquareTerminal'} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-foreground block">
                                {h.name}
                              </span>
                              {h.tagline && (
                                <p className="text-[11px] text-muted-foreground truncate max-w-md mt-0.5">
                                  {h.tagline}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Version Column */}
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10.5px] bg-muted/70 text-muted-foreground px-2 py-0.5 rounded">
                            v{h.version}
                          </span>
                        </td>

                        {/* Added Column */}
                        <td className="py-3 px-4 text-muted-foreground text-[11px]">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground/60" />
                            {fmtDate(addedAt)}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                            title="Remove harness"
                            onClick={(e) => handleDeleteHarness(h, e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              {search ? 'No matching harnesses found' : 'No harnesses added'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {search
                ? `No added harnesses match "${search}".`
                : 'Select from available agent harnesses supported by openHarness to make them selectable in your projects.'}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Harness
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Harness Picker Modal */}
      <AddHarnessDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
