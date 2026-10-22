'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skill, SkillFile } from '@/lib/domain/types';
import { getSkillFiles } from '@/lib/domain/skill-files';
import { fmtDate, fmtRel } from '@/lib/utils';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Workflow as WorkflowIcon,
  Calendar,
  Clock
} from 'lucide-react';

interface SkillDetailDialogProps {
  skill: Skill | null;
  isOpen: boolean;
  onClose: () => void;
  usageCount: number;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  file?: SkillFile;
}

function getFileIcon(filename: string) {
  if (filename.endsWith('.md')) return <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
  if (filename.endsWith('.py')) return <FileCode className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  if (filename.endsWith('.json')) return <FileJson className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  if (filename.endsWith('.ts') || filename.endsWith('.js')) return <FileCode className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return <FileCode className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
  return <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

export function SkillDetailDialog({
  skill,
  isOpen,
  onClose,
  usageCount
}: SkillDetailDialogProps) {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('SKILL.md');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // Derive files list
  const files: SkillFile[] = useMemo(() => {
    if (!skill) return [];
    return getSkillFiles(skill);
  }, [skill]);

  // Ensure selected file exists in current skill
  const activeFile = useMemo(() => {
    return files.find((f) => f.path === selectedFilePath) || files[0] || null;
  }, [files, selectedFilePath]);

  // Build tree structure
  const fileTree = useMemo(() => {
    const root: { folders: Record<string, TreeNode>; files: TreeNode[] } = {
      folders: {},
      files: []
    };

    files.forEach((file) => {
      const parts = file.path.split('/');
      if (parts.length === 1) {
        root.files.push({
          name: parts[0],
          path: file.path,
          isFolder: false,
          file
        });
      } else {
        const folderName = parts[0];
        const fileName = parts.slice(1).join('/');
        if (!root.folders[folderName]) {
          root.folders[folderName] = {
            name: folderName,
            path: folderName,
            isFolder: true,
            children: []
          };
        }
        root.folders[folderName].children?.push({
          name: fileName,
          path: file.path,
          isFolder: false,
          file
        });
      }
    });

    return root;
  }, [files]);

  // When a new skill is selected, reset selectedFilePath to SKILL.md or the first file and collapse all folders
  useEffect(() => {
    if (skill) {
      setSelectedFilePath('SKILL.md');
      setExpandedFolders({});
    }
  }, [skill?.id]);

  if (!skill) return null;

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const handleCopy = () => {
    if (!activeFile?.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = activeFile?.content ? activeFile.content.split('\n') : [];
  const createdAt = skill.createdAt || Date.now();
  const updatedAt = skill.updatedAt || createdAt;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[78vh] flex flex-col p-0 overflow-hidden gap-0 border-border bg-card">
        {/* Top Header */}
        <DialogHeader className="px-5 py-3.5 border-b shrink-0 bg-muted/10">
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span>{skill.name}</span>
                {skill.source && (
                  <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-normal">
                    {skill.source}
                  </span>
                )}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground font-normal">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Added {fmtDate(createdAt)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Updated {fmtRel(updatedAt)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <WorkflowIcon className="h-3 w-3" />
                  {usageCount} {usageCount === 1 ? 'workflow' : 'workflows'}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body: Split Pane (File Explorer + Uniform Raw Code Viewer) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-56 sm:w-60 border-r border-border bg-muted/15 flex flex-col shrink-0 select-none">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              <span>EXPLORER</span>
              <span className="font-mono text-[9px]">{files.length} files</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
              {/* Folders (collapsed by default) */}
              {Object.entries(fileTree.folders).map(([folderName, folderNode]) => {
                const isExpanded = expandedFolders[folderName] ?? false;
                return (
                  <div key={folderName} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleFolder(folderName)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors text-xs font-medium cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 shrink-0" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                      )}
                      <span className="truncate">{folderName}</span>
                    </button>

                    {isExpanded && (
                      <div className="pl-4 space-y-0.5 border-l border-border/40 ml-2">
                        {folderNode.children?.map((child) => {
                          const isSelected = activeFile?.path === child.path;
                          return (
                            <button
                              type="button"
                              key={child.path}
                              onClick={() => setSelectedFilePath(child.path)}
                              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                              }`}
                            >
                              {getFileIcon(child.name)}
                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Root Files */}
              {fileTree.files.map((item) => {
                const isSelected = activeFile?.path === item.path;
                return (
                  <button
                    type="button"
                    key={item.path}
                    onClick={() => setSelectedFilePath(item.path)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {getFileIcon(item.name)}
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Uniform Raw Code Viewer */}
          <div className="flex-1 flex flex-col min-w-0 bg-background/50 overflow-hidden">
            {activeFile ? (
              <>
                {/* File Header Bar */}
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 bg-muted/10 shrink-0 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {getFileIcon(activeFile.name)}
                    <span className="font-mono text-foreground font-medium truncate">
                      {activeFile.path}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      ({lines.length} lines)
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer px-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* File Content Area: Uniform Monospace Line-Numbered Code View */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed bg-muted/5 select-text">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4">
                    {/* Line Numbers */}
                    <div className="select-none text-right text-muted-foreground/30 pr-2 border-r border-border/30">
                      {lines.map((_, i) => (
                        <div key={i} className="leading-5">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="overflow-x-auto">
                      {lines.map((line, i) => (
                        <div key={i} className="leading-5 whitespace-pre font-mono text-foreground/90">
                          {line || ' '}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Select a file from the explorer to inspect
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
