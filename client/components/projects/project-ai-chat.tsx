'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Play,
  Loader2,
  Workflow as WorkflowIcon,
  SquareTerminal,
  ChevronDown,
  Check,
  X,
  MessageSquare,
  Pause,
  Square,
  ShieldAlert,
  Terminal,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useConsoleStore } from '@/lib/stores/console-store';
import { useUIStore } from '@/lib/stores/ui-store';
import { Project, Session, ChatMessage, Workflow, Step } from '@/lib/domain/types';
import { HARNESSES } from '@/lib/domain/constants';
import { DynamicIcon } from '@/components/icons/dynamic-icon';
import { FormattedChatMessage } from './formatted-chat-message';
import { WorkflowRunMessage } from './workflow-run-message';
import { ProjectTerminalModal } from '@/components/terminal/project-terminal-modal';
import { cn } from '@/lib/utils';

function createMessage(
  role: 'user' | 'assistant',
  content: string,
  extra?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role,
    content,
    createdAt: Date.now(),
    ...extra
  };
}

export function ProjectAIChat({
  project,
  session
}: {
  project: Project;
  session?: Session;
}) {
  const router = useRouter();
  const workflows = useConsoleStore((s) => s.workflows);
  const skills = useConsoleStore((s) => s.skills);
  const harnesses = useConsoleStore((s) => s.harnesses);
  const updateSessionHarness = useConsoleStore((s) => s.updateSessionHarness);
  const defaultHarness = useConsoleStore((s) => s.defaultHarness);
  const createSession = useConsoleStore((s) => s.createSession);
  const addSessionMessage = useConsoleStore((s) => s.addSessionMessage);
  const updateSessionMessage = useConsoleStore((s) => s.updateSessionMessage);
  const startRun = useConsoleStore((s) => s.startRun);
  const runs = useConsoleStore((s) => s.runs);
  const pauseRun = useConsoleStore((s) => s.pauseRun);
  const resumeRun = useConsoleStore((s) => s.resumeRun);
  const stopRun = useConsoleStore((s) => s.stopRun);
  const approveGate = useConsoleStore((s) => s.approveGate);
  const rejectGate = useConsoleStore((s) => s.rejectGate);
  const reviseGate = useConsoleStore((s) => s.reviseGate);
  const setActiveSession = useConsoleStore((s) => s.setActiveSession);
  const openDialog = useUIStore((s) => s.openDialog);

  const setDefaultHarness = useConsoleStore((s) => s.setDefaultHarness);

  const [selectedHarnessId, setSelectedHarnessId] = useState<string>(
    session?.defaultHarnessId || defaultHarness || 'opencode'
  );

  useEffect(() => {
    if (session?.defaultHarnessId) {
      setSelectedHarnessId(session.defaultHarnessId);
      setDefaultHarness(session.defaultHarnessId);
    }
  }, [session?.defaultHarnessId, setDefaultHarness]);

  const activeHarness =
    harnesses.find((h) => h.id === selectedHarnessId) ||
    harnesses[0] ||
    HARNESSES[0];

  const handleSelectHarness = (harnessId: string) => {
    setSelectedHarnessId(harnessId);
    setDefaultHarness(harnessId);
    if (session) {
      updateSessionHarness(session.id, harnessId);
    }
  };

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedWorkflow = selectedWorkflowId
    ? workflows.find((w) => w.id === selectedWorkflowId) || null
    : null;

  const isSkillInstalled = (step: Step) => {
    return !!skills.find(
      (sk) =>
        sk.id === step.skillId ||
        sk.name.toLowerCase() === step.skillId.toLowerCase() ||
        (step.skillName && sk.name.toLowerCase() === step.skillName.toLowerCase()) ||
        (step.skillId.startsWith('skill-') && sk.name.toLowerCase() === step.skillId.replace(/^skill-/, '').toLowerCase())
    );
  };

  const missingSteps = useMemo(() => {
    if (!selectedWorkflow) return [];
    return selectedWorkflow.steps.filter((st) => !isSkillInstalled(st));
  }, [selectedWorkflow, skills]);

  const hasMissingSkills = missingSteps.length > 0;

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);

  useEffect(() => {
    fetch(`/api/terminal/status?projectId=${project.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.running) setIsTerminalRunning(true);
      })
      .catch(() => {});
  }, [project.id]);

  // Active execution run for this session/project
  const activeRun = runs.find(
    (r) =>
      (r.sessionId === session?.id || (!r.sessionId && r.projectId === project.id)) &&
      (r.status === 'running' || r.status === 'waiting' || r.status === 'paused')
  );

  // If in an existing session, use its messages; if none yet, provide initial greeting
  const initialGreeting: ChatMessage = {
    id: 'greeting',
    role: 'assistant',
    content: session
      ? `Hello! How can I assist you with **${session.name}**?`
      : `Hello! What would you like to build, investigate, or refactor in **${project.name}**?`,
    createdAt: 0
  };

  const displayMessages: ChatMessage[] = session
    ? (session.messages && session.messages.length > 0 ? session.messages : [initialGreeting])
    : [initialGreeting];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length, loading]);

  const suggestions = [
    { label: 'Run project discovery & explore conventions', workflowName: 'Feature delivery' },
    { label: 'Implement a new feature with human gate approval', workflowName: 'Feature delivery' },
    { label: 'Reproduce and fix a bug with regression tests', workflowName: 'Bug fix' },
    { label: 'Audit documentation against current implementation', workflowName: 'Docs refresh' }
  ];

  const findMatchingWorkflow = (text: string) => {
    const lower = text.toLowerCase();
    let matchedWf = workflows.find((w) => {
      if (lower.includes('bug') || lower.includes('fix') || lower.includes('issue') || lower.includes('error')) {
        return w.name.toLowerCase().includes('bug');
      }
      if (lower.includes('doc') || lower.includes('audit') || lower.includes('contract')) {
        return w.name.toLowerCase().includes('doc');
      }
      return w.name.toLowerCase().includes('feature') || w.name.toLowerCase().includes('delivery');
    });

    if (!matchedWf && workflows.length > 0) {
      matchedWf = workflows[0];
    }
    return matchedWf;
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();

    // Feedback sent while at an approval gate reproduces the current step with adjustments
    if (activeRun && activeRun.status === 'waiting') {
      if (!text) return;
      setInput('');
      const targetSessionId = session?.id;
      if (targetSessionId) {
        addSessionMessage(targetSessionId, createMessage('user', text));
      }
      reviseGate(text);
      return;
    }

    if ((!text && !selectedWorkflow) || loading) return;
    if (selectedWorkflow && hasMissingSkills) return;

    setInput('');
    setLoading(true);

    let targetSessionId = session?.id;

    if (!targetSessionId) {
      const sessionTitle = selectedWorkflow
        ? selectedWorkflow.name
        : text.length > 42
        ? `${text.slice(0, 42).trim()}...`
        : text || 'New Chat';

      const newSession = createSession({
        projectId: project.id,
        name: sessionTitle,
        description: text ? text.slice(0, 140) : `Running ${selectedWorkflow?.name}`,
        gitBranch: project.currentBranch || 'main',
        defaultHarnessId: activeHarness.id,
        status: 'active',
        messages: []
      });
      targetSessionId = newSession.id;
      setActiveSession(newSession.id);
      router.replace(`/projects/${project.id}/sessions/${newSession.id}`);
    }

    // CASE 1: If workflow is selected, run workflow automatically with tagged skills
    if (selectedWorkflow) {
      if (text) {
        addSessionMessage(targetSessionId, createMessage('user', text));
      }

      const run = startRun(selectedWorkflow.id, activeHarness.id, project.id, targetSessionId);
      if (run) {
        addSessionMessage(
          targetSessionId,
          createMessage(
            'assistant',
            `Executing workflow: **${selectedWorkflow.name}** across ${selectedWorkflow.steps.length} skills.`,
            { runId: run.id }
          )
        );
      }
      setLoading(false);
      return;
    }

    // CASE 2: None selected -> Direct agent chat with OpenCode streaming
    const userMsg = createMessage('user', text);
    addSessionMessage(targetSessionId, userMsg);

    // Create placeholder assistant message for streaming
    const assistantMsg = createMessage('assistant', '');
    addSessionMessage(targetSessionId, assistantMsg);

    try {
      const res = await fetch('/api/harness/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: project.path,
          sessionId: targetSessionId,
          prompt: text
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect to OpenCode harness');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  accumulated += data.text;
                  updateSessionMessage(targetSessionId, assistantMsg.id, accumulated);
                } else if (data.fileChanges) {
                  updateSessionMessage(targetSessionId, assistantMsg.id, accumulated, { fileChanges: data.fileChanges });
                } else if (data.error) {
                  accumulated += `\n\n**Error:** ${data.error}`;
                  updateSessionMessage(targetSessionId, assistantMsg.id, accumulated);
                }
              } catch {}
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error communicating with OpenCode harness';
      updateSessionMessage(targetSessionId, assistantMsg.id, `**Error:** ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchFromChat = (msg: ChatMessage) => {
    if (!msg.suggestedWorkflowId) return;
    const wf = workflows.find((w) => w.id === msg.suggestedWorkflowId);
    if (!wf) return;

    const targetSessionId = session?.id;
    if (!targetSessionId) return;

    // Start execution run immediately for this session
    const run = startRun(wf.id, activeHarness.id, project.id, targetSessionId);
    if (run) {
      addSessionMessage(
        targetSessionId,
        createMessage('assistant', `Executing workflow: **${wf.name}**`, { runId: run.id })
      );
    }
  };

  const handleSelectWorkflow = (wf: Workflow) => {
    let targetSessionId = session?.id;

    if (!targetSessionId) {
      const newSession = createSession({
        projectId: project.id,
        name: wf.name,
        description: `Running ${wf.name} on ${activeHarness.name}`,
        gitBranch: project.currentBranch || 'main',
        defaultHarnessId: activeHarness.id,
        status: 'active',
        messages: []
      });
      targetSessionId = newSession.id;
      setActiveSession(newSession.id);
      router.replace(`/projects/${project.id}/sessions/${newSession.id}`);
    }

    const run = startRun(wf.id, activeHarness.id, project.id, targetSessionId);
    if (run) {
      addSessionMessage(
        targetSessionId,
        createMessage('assistant', `Executing workflow: **${wf.name}**`, { runId: run.id })
      );
    }
  };

  return (
    <div className="flex h-full w-full flex-col min-h-0 bg-background">
      {/* Scrollable message stream */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {displayMessages.map((msg) => {
            const isAssistant = msg.role === 'assistant';

            if (!isAssistant) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-xs text-primary-foreground shadow-2xs leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex items-start gap-3 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground border shadow-2xs mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 space-y-3 min-w-0">
                  {msg.runId ? (
                    <WorkflowRunMessage runId={msg.runId} />
                  ) : (
                    <FormattedChatMessage
                      content={msg.content}
                      fileChanges={msg.fileChanges}
                      projectPath={project.path}
                      currentBranch={project.currentBranch || 'main'}
                    />
                  )}

                  {/* Inline Suggested Action Card */}
                  {msg.suggestedWorkflowId && (
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-3 shadow-2xs max-w-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground">
                          {msg.suggestedWorkflowName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {msg.stepsCount} steps
                        </span>
                      </div>

                      {msg.suggestedPlan && (
                        <ul className="space-y-1.5 text-[11px] text-muted-foreground list-disc list-inside">
                          {msg.suggestedPlan.map((step, idx) => (
                            <li key={idx} className="leading-snug">
                              {step}
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button
                        size="sm"
                        onClick={() => handleLaunchFromChat(msg)}
                        className="w-full text-xs gap-1.5 h-8 font-medium cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Launch Run
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic pl-10">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>OpenCode is inspecting the codebase and thinking...</span>
            </div>
          )}

          {/* Quick Suggestions Chips */}
          {displayMessages.length === 1 && (
            <div className="pt-2 pl-10">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSend(s.label)}
                    className="rounded-full border border-border/80 bg-background hover:bg-muted/70 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs text-left"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Docked minimal input bar */}
      <div className="border-t bg-background/95 backdrop-blur-xs p-4">
        <div className="mx-auto max-w-3xl">
          {/* Tagged Skills Bar for Selected Workflow Flow */}
          {selectedWorkflow && (
            <div
              className={cn(
                'mb-2 flex flex-col gap-2 p-2.5 rounded-xl border text-xs transition-colors',
                hasMissingSkills
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-primary/5 border-primary/20'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span
                    className={cn(
                      'font-semibold text-xs flex items-center gap-1.5 shrink-0',
                      hasMissingSkills ? 'text-destructive font-bold' : 'text-foreground'
                    )}
                  >
                    {hasMissingSkills ? (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                    ) : (
                      <WorkflowIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    Flow: {selectedWorkflow.name}
                  </span>
                  <span className="text-muted-foreground/40 text-xs shrink-0">•</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedWorkflow.groups && selectedWorkflow.groups.length > 0 ? (
                      selectedWorkflow.groups.map((group, gIdx) => (
                        <React.Fragment key={group.id}>
                          <div className="flex items-center gap-1 bg-background/60 border border-border/70 rounded-md px-1.5 py-0.5">
                            <span className="text-[9.5px] font-semibold text-muted-foreground mr-0.5">{group.name}:</span>
                            {group.steps.map((st, sIdx) => {
                              const isInstalled = isSkillInstalled(st);
                              const skill = skills.find(
                                (sk) =>
                                  sk.id === st.skillId ||
                                  sk.name.toLowerCase() === st.skillId.toLowerCase() ||
                                  (st.skillName && sk.name.toLowerCase() === st.skillName.toLowerCase()) ||
                                  (st.skillId.startsWith('skill-') && sk.name.toLowerCase() === st.skillId.replace(/^skill-/, '').toLowerCase())
                              );
                              const displayName = skill?.name || st.skillName || st.skillId;
                              return (
                                <span
                                  key={st.id || sIdx}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border shadow-2xs',
                                    isInstalled
                                      ? 'bg-background/90 border-border/80 text-foreground'
                                      : 'bg-destructive/15 border-destructive/40 text-destructive font-semibold'
                                  )}
                                  title={isInstalled ? undefined : `Missing skill: ${displayName}`}
                                >
                                  <span>{displayName}</span>
                                  {!isInstalled && (
                                    <span className="text-[8px] uppercase font-bold text-destructive">
                                      (missing)
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                          {group.gate && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                              <ShieldAlert className="h-3 w-3" />
                              Gate
                            </span>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      selectedWorkflow.steps.map((st, sIdx) => {
                        const isInstalled = isSkillInstalled(st);
                        const skill = skills.find(
                          (sk) =>
                            sk.id === st.skillId ||
                            sk.name.toLowerCase() === st.skillId.toLowerCase() ||
                            (st.skillName && sk.name.toLowerCase() === st.skillName.toLowerCase()) ||
                            (st.skillId.startsWith('skill-') && sk.name.toLowerCase() === st.skillId.replace(/^skill-/, '').toLowerCase())
                        );
                        const displayName = skill?.name || st.skillName || st.skillId;
                        return (
                          <span
                            key={st.id || sIdx}
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium border shadow-2xs',
                              isInstalled
                                ? 'bg-background/90 border-border/80 text-foreground'
                                : 'bg-destructive/15 border-destructive/40 text-destructive font-semibold'
                            )}
                            title={isInstalled ? undefined : `Missing skill: ${displayName}`}
                          >
                            <span
                              className={cn(
                                'text-[9px] font-mono',
                                isInstalled ? 'text-muted-foreground' : 'text-destructive/80'
                              )}
                            >
                              0{sIdx + 1}
                            </span>
                            <span>{displayName}</span>
                            {!isInstalled && (
                              <span className="text-[8.5px] uppercase font-bold text-destructive">
                                (missing)
                              </span>
                            )}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedWorkflowId(null)}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-colors"
                  title="Deselect workflow and switch to direct agent chat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {hasMissingSkills && (
                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-destructive/20 text-[11px] text-destructive">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertCircle className="h-3 w-3 shrink-0 text-destructive" />
                    <span className="truncate">
                      Execution blocked: {missingSteps.length}{' '}
                      {missingSteps.length === 1 ? 'skill is' : 'skills are'} missing or uninstalled.
                    </span>
                  </div>
                  <Link
                    href={`/workflows/${selectedWorkflow.id}`}
                    className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 shrink-0 text-destructive text-[11px]"
                  >
                    Reinstall in Editor
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Active Gate Checkpoint Banner when paused for developer approval */}
          {activeRun && activeRun.status === 'waiting' && (
            <div className="mb-2 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                <div className="min-w-0 truncate">
                  <span className="font-semibold text-foreground">
                    Approval Gate: &ldquo;{activeRun.steps[activeRun.currentStep]?.groupName || activeRun.steps[activeRun.currentStep]?.name || 'Step'}&rdquo; Complete
                  </span>
                  <span className="text-muted-foreground ml-2 hidden sm:inline text-[11px]">
                    Approve to proceed, or write prompt below to reproduce step
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  onClick={approveGate}
                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-3 shadow-2xs font-medium"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Approve & Continue
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={rejectGate}
                  className="h-7 text-xs text-destructive hover:text-destructive cursor-pointer px-2"
                  title="Stop workflow execution"
                >
                  <X className="h-3 w-3 mr-1" />
                  Stop Run
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Agent Harness Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 px-3 rounded-xl gap-1.5 text-xs shrink-0 bg-muted/20 border-border/70 hover:bg-muted/40 cursor-pointer shadow-2xs"
                  title="Select agent harness for this session"
                >
                  <SquareTerminal className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline font-medium">{activeHarness.name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                  Select Agent Harness
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {harnesses.map((h) => {
                  const isSelected = h.id === activeHarness.id;
                  return (
                    <DropdownMenuItem
                      key={h.id}
                      onClick={() => handleSelectHarness(h.id)}
                      className="flex items-center justify-between py-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <DynamicIcon name={h.icon || 'SquareTerminal'} className="h-3.5 w-3.5 text-foreground shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate">{h.name}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-2 shrink-0" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Workflow Selection Dropdown (None or Flow) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-11 px-3 rounded-xl gap-1.5 text-xs shrink-0 border-border/70 cursor-pointer shadow-2xs max-w-[170px]',
                    selectedWorkflow
                      ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/15'
                      : 'bg-muted/20 hover:bg-muted/40 text-muted-foreground'
                  )}
                  title="Select workflow flow or none (direct chat)"
                >
                  {selectedWorkflow ? (
                    <WorkflowIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate font-medium">
                    {selectedWorkflow ? selectedWorkflow.name : 'Flow: None'}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-60 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-68 max-h-80 overflow-y-auto">
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground">
                  Workflow Flow Selection
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Option 1: None (Direct Agent Chat) */}
                <DropdownMenuItem
                  onClick={() => setSelectedWorkflowId(null)}
                  className="flex items-center justify-between py-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">None (Direct Chat)</div>
                      <p className="text-[10px] text-muted-foreground">Direct conversation with OpenCode agent</p>
                    </div>
                  </div>
                  {!selectedWorkflowId && <Check className="h-3.5 w-3.5 text-primary ml-2 shrink-0" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Option 2..N: Workflows */}
                {workflows.length > 0 ? (
                  workflows.map((wf) => {
                    const isSelected = selectedWorkflowId === wf.id;
                    const wfMissingCount = wf.steps.filter((st) => !isSkillInstalled(st)).length;
                    return (
                      <DropdownMenuItem
                        key={wf.id}
                        onClick={() => setSelectedWorkflowId(wf.id)}
                        className="flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <WorkflowIcon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", wfMissingCount > 0 ? "text-destructive" : "text-primary")} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-foreground truncate">{wf.name}</span>
                              <span className="text-[9.5px] font-mono text-muted-foreground">
                                {wf.steps.length} {wf.steps.length === 1 ? 'skill' : 'skills'}
                              </span>
                              {wfMissingCount > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-[9px] px-1.5 py-0 h-4 font-semibold"
                                >
                                  {wfMissingCount} missing
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary ml-2 shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No workflow templates found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {activeRun && activeRun.status !== 'waiting' ? (
              <div className="flex-1 flex items-center justify-between h-11 px-3.5 rounded-xl border border-primary/30 bg-primary/5 shadow-2xs text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeRun.status === 'running' && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  )}
                  {activeRun.status === 'paused' && (
                    <Pause className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}

                  <div className="min-w-0 truncate">
                    <span className="font-semibold text-foreground">
                      {activeRun.status === 'paused'
                        ? `Paused at skill ${Math.min(activeRun.currentStep + 1, activeRun.steps.length)} of ${activeRun.steps.length}:`
                        : `Running skill ${Math.min(activeRun.currentStep + 1, activeRun.steps.length)} of ${activeRun.steps.length}:`}
                    </span>
                    <span className="text-muted-foreground ml-1.5 font-medium truncate">
                      &ldquo;{activeRun.steps[activeRun.currentStep]?.name}&rdquo;
                    </span>
                  </div>
                </div>

                {/* Progress Actions */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {activeRun.status === 'running' ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={pauseRun}
                        className="h-7 text-xs cursor-pointer px-2.5"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={stopRun}
                        className="h-7 text-xs text-destructive hover:text-destructive cursor-pointer px-2"
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={resumeRun}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-2.5 shadow-2xs"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Resume
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={stopRun}
                        className="h-7 text-xs text-destructive hover:text-destructive cursor-pointer px-2"
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="relative flex-1 flex items-center"
              >
                <Input
                  placeholder={
                    activeRun?.status === 'waiting'
                      ? `Write prompt feedback to reproduce this step, or approve above...`
                      : selectedWorkflow
                      ? `Run flow "${selectedWorkflow.name}" (optional instructions)...`
                      : session
                      ? `Message ${session.name}...`
                      : `Ask AI or describe what to build in ${project.name}...`
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className={cn(
                    "pr-12 text-xs h-11 rounded-xl bg-muted/20 border-border/70 focus-visible:ring-1 shadow-2xs",
                    activeRun?.status === 'waiting' && "border-amber-500/50 bg-amber-500/5 focus-visible:ring-amber-500/50"
                  )}
                />
                <Button
                  type="submit"
                  size="iconSm"
                  disabled={
                    loading ||
                    (activeRun?.status === 'waiting'
                      ? !input.trim()
                      : selectedWorkflow
                      ? hasMissingSkills
                      : !input.trim())
                  }
                  className={cn(
                    "absolute right-2 h-7 w-7 rounded-lg cursor-pointer transition-colors",
                    activeRun?.status === 'waiting'
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : selectedWorkflow && hasMissingSkills && "opacity-40 cursor-not-allowed bg-destructive/60 hover:bg-destructive/60"
                  )}
                  title={
                    activeRun?.status === 'waiting'
                      ? 'Send feedback to reproduce step'
                      : selectedWorkflow
                      ? hasMissingSkills
                        ? 'Execution blocked: workflow contains missing skills. Reinstall in Workflow Editor to run.'
                        : 'Launch workflow'
                      : 'Send message'
                  }
                >
                  {activeRun?.status === 'waiting' ? (
                    <Send className="h-3.5 w-3.5" />
                  ) : selectedWorkflow ? (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </form>
            )}

            {/* Terminal Toggle Button on right side of chat */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={cn(
                'relative h-11 px-3 rounded-xl gap-1.5 text-xs shrink-0 border-border/70 cursor-pointer shadow-2xs transition-all',
                isTerminalOpen
                  ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                  : 'bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
              )}
              title="Toggle interactive project terminal (runs app in background)"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">Terminal</span>
              {isTerminalRunning && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-background" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Persistent Terminal Modal Window */}
      <ProjectTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        projectPath={project.path}
        onStatusChange={setIsTerminalRunning}
      />
    </div>
  );
}
