'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Terminal,
  Brain,
  FileCode2,
  FilePlus,
  FileMinus,
  FileText,
  GitBranch,
  GitCommit,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileChange } from '@/lib/domain/types';

export function stripAnsi(text: string): string {
  return text
    // eslint-disable-next-line no-control-regex
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/\x1b\([a-zA-Z]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/\r\n/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/\r/g, '\n');
}

interface ParsedMessagePart {
  type: 'thinking' | 'text' | 'code';
  content: string;
  language?: string;
}

export function parseMessageContent(rawContent: string): ParsedMessagePart[] {
  const cleaned = stripAnsi(rawContent);
  const parts: ParsedMessagePart[] = [];

  // Check for <thinking>...</thinking> or [Thinking: ...]
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = thinkingRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = cleaned.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push(...parseCodeBlocks(textBefore));
      }
    }

    parts.push({
      type: 'thinking',
      content: match[1].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleaned.length) {
    const remaining = cleaned.slice(lastIndex);
    if (remaining.trim()) {
      parts.push(...parseCodeBlocks(remaining));
    }
  }

  return parts.length > 0 ? parts : [{ type: 'text', content: cleaned }];
}

function parseCodeBlocks(text: string): ParsedMessagePart[] {
  const parts: ParsedMessagePart[] = [];
  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = codeRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push({
        type: 'text',
        content: text.slice(lastIdx, m.index)
      });
    }

    parts.push({
      type: 'code',
      language: m[1] || 'bash',
      content: m[2].trimEnd()
    });

    lastIdx = m.index + m[0].length;
  }

  if (lastIdx < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIdx)
    });
  }

  return parts;
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
        <span className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-primary" />
          {language || 'text'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ThinkingBlock({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-border/60 bg-muted/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[11.5px]">OpenCode Thinking & Reasoning</span>
        </span>
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 text-[11px] text-muted-foreground/90 border-t border-border/40 font-mono leading-relaxed whitespace-pre-wrap bg-background/50">
          {content}
        </div>
      )}
    </div>
  );
}

function FileDiffViewer({ diff }: { diff: string }) {
  const lines = diff.split('\n');
  return (
    <pre className="p-2.5 overflow-x-auto font-mono text-[10.5px] leading-relaxed bg-zinc-950 text-zinc-200 rounded-md my-1 border border-zinc-800">
      {lines.map((line, idx) => {
        let lineStyle = 'text-zinc-400';
        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineStyle = 'text-emerald-400 bg-emerald-950/40 font-medium px-1';
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineStyle = 'text-rose-400 bg-rose-950/40 font-medium px-1';
        } else if (line.startsWith('@@')) {
          lineStyle = 'text-indigo-400 bg-indigo-950/30';
        }
        return (
          <div key={idx} className={lineStyle}>
            {line}
          </div>
        );
      })}
    </pre>
  );
}

function FileChangesCard({
  changes,
  projectPath,
  currentBranch
}: {
  changes: FileChange[];
  projectPath?: string;
  currentBranch?: string;
}) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState<{ hash: string; branch: string } | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  const totalAdditions = changes.reduce((acc, c) => acc + c.additions, 0);
  const totalDeletions = changes.reduce((acc, c) => acc + c.deletions, 0);

  const handleCommit = async () => {
    if (!projectPath || !commitMessage.trim()) return;
    setCommitting(true);
    setCommitError(null);

    try {
      const res = await fetch('/api/projects/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath,
          message: commitMessage.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to commit changes');
      }

      setCommitted({
        hash: data.commitHash,
        branch: data.branch
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error committing changes';
      setCommitError(msg);
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="my-3 rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          <span>{changes.length} file{changes.length > 1 ? 's' : ''} modified</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {totalAdditions > 0 && <span className="text-emerald-500 font-medium">+{totalAdditions}</span>}
          {totalDeletions > 0 && <span className="text-rose-500 font-medium">-{totalDeletions}</span>}
        </div>
      </div>

      <div className="divide-y divide-border/40 rounded-lg border border-border/60 bg-background/60 overflow-hidden">
        {changes.map((file) => {
          const isExpanded = expandedFile === file.path;
          return (
            <div key={file.path} className="text-xs">
              <button
                type="button"
                onClick={() => setExpandedFile(isExpanded ? null : file.path)}
                className="flex w-full items-center justify-between p-2 hover:bg-muted/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0 font-mono text-[11px]">
                  {file.status === 'added' ? (
                    <FilePlus className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : file.status === 'deleted' ? (
                    <FileMinus className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  ) : (
                    <FileCode2 className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  )}
                  <span className="truncate text-foreground font-medium">{file.path}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                  {file.additions > 0 && <span className="text-emerald-500">+{file.additions}</span>}
                  {file.deletions > 0 && <span className="text-rose-500">-{file.deletions}</span>}
                  {file.diff && (
                    isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </button>
              {isExpanded && file.diff && (
                <div className="px-2 pb-2">
                  <FileDiffViewer diff={file.diff} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Review & Commit Bar */}
      {projectPath && (
        <div className="rounded-lg border border-border/70 bg-background/90 p-2.5 space-y-2 mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground font-mono">
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              <span className="font-semibold text-foreground">{committed?.branch || currentBranch || 'main'}</span>
            </div>
            {committed ? (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                Committed {committed.hash}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Review & stage changes
              </span>
            )}
          </div>

          {commitError && (
            <p className="text-[11px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-2 py-1">
              {commitError}
            </p>
          )}

          {!committed ? (
            <div className="flex items-center gap-2">
              <Input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message (e.g. feat: implement auth module)..."
                disabled={committing}
                className="h-7 text-xs bg-muted/40 font-mono flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !committing && commitMessage.trim()) {
                    e.preventDefault();
                    handleCommit();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleCommit}
                disabled={committing || !commitMessage.trim()}
                className="h-7 px-2.5 text-xs font-medium cursor-pointer shrink-0"
              >
                {committing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <GitCommit className="h-3 w-3 mr-1" />
                )}
                Commit
              </Button>
            </div>
          ) : (
            <div className="text-[11px] text-muted-foreground italic font-mono">
              Changes committed successfully.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FormattedChatMessage({
  content,
  fileChanges,
  projectPath,
  currentBranch
}: {
  content: string;
  fileChanges?: FileChange[];
  projectPath?: string;
  currentBranch?: string;
}) {
  const parts = parseMessageContent(content);

  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-foreground min-w-0">
      {parts.map((part, index) => {
        if (part.type === 'thinking') {
          return <ThinkingBlock key={index} content={part.content} />;
        }
        if (part.type === 'code') {
          return <CodeBlock key={index} code={part.content} language={part.language} />;
        }
        return (
          <div key={index} className="whitespace-pre-wrap break-words leading-relaxed">
            {part.content}
          </div>
        );
      })}

      {fileChanges && fileChanges.length > 0 && (
        <FileChangesCard
          changes={fileChanges}
          projectPath={projectPath}
          currentBranch={currentBranch}
        />
      )}
    </div>
  );
}
