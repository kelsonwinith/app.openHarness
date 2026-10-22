import React from 'react';
import {
  FileText,
  Search,
  FolderOpen,
  Terminal,
  FileCode,
  FilePlus,
  ListTodo,
  Brain,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Activity, HarnessId } from '@/lib/domain/types';
import { TOOL_NAMES } from '@/lib/domain/constants';
import { fmtTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ActivityItemProps {
  activity: Activity;
  harnessId: HarnessId;
}

export function ActivityItem({ activity, harnessId }: ActivityItemProps) {
  const getToolDisplayName = (kind: string) => {
    const tools = TOOL_NAMES[harnessId] || TOOL_NAMES.opencode;
    return tools[kind] || kind;
  };

  const renderIcon = () => {
    switch (activity.k) {
      case 'read':
        return <FileText className="h-3.5 w-3.5 text-blue-500" />;
      case 'search':
        return <Search className="h-3.5 w-3.5 text-amber-500" />;
      case 'glob':
        return <FolderOpen className="h-3.5 w-3.5 text-purple-500" />;
      case 'run':
        return <Terminal className="h-3.5 w-3.5 text-emerald-500" />;
      case 'edit':
        return <FileCode className="h-3.5 w-3.5 text-indigo-500" />;
      case 'write':
        return <FilePlus className="h-3.5 w-3.5 text-teal-500" />;
      case 'plan':
        return <ListTodo className="h-3.5 w-3.5 text-sky-500" />;
      case 'think':
        return <Brain className="h-3.5 w-3.5 text-muted-foreground" />;
      case 'ask':
        return <MessageSquare className="h-3.5 w-3.5 text-amber-500" />;
      case 'gate':
        return <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />;
      case 'gate-ok':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'gate-no':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'done':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'stop':
        return <XCircle className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  if (activity.k === 'gate') {
    return (
      <div className="my-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
        <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4" />
          <span>Approval Gate Checkpoint</span>
          <span className="ml-auto text-[10px] opacity-75 font-mono">{fmtTime(activity.at)}</span>
        </div>
        <p className="mt-1 text-[11.5px] leading-relaxed">
          {activity.text || 'This step requires your approval before the harness continues.'}
        </p>
      </div>
    );
  }

  if (activity.k === 'gate-ok') {
    return (
      <div className="my-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>{activity.text}</span>
        </div>
        <span className="text-[10px] opacity-75 font-mono">{fmtTime(activity.at)}</span>
      </div>
    );
  }

  if (activity.k === 'gate-no') {
    return (
      <div className="my-1.5 rounded-md border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-medium">
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          <span>{activity.text}</span>
        </div>
        <span className="text-[10px] opacity-75 font-mono">{fmtTime(activity.at)}</span>
      </div>
    );
  }

  if (activity.k === 'think') {
    return (
      <div className="flex items-start gap-2.5 py-1 px-1 text-xs text-muted-foreground">
        <span className="mt-0.5 shrink-0 opacity-70">{renderIcon()}</span>
        <span className="flex-1 italic leading-relaxed text-[11.5px]">{activity.text}</span>
        <span className="shrink-0 text-[10px] font-mono opacity-50">{fmtTime(activity.at)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 py-1.5 px-1 text-xs group hover:bg-muted/30 rounded-md transition-colors">
      <span className="mt-0.5 shrink-0">{renderIcon()}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {activity.arg && (
            <Badge variant="secondary" className="font-mono text-[10px] py-0 px-1.5">
              {getToolDisplayName(activity.k)}
            </Badge>
          )}
          {activity.arg && (
            <span className="font-mono text-[11px] text-foreground font-medium truncate max-w-[280px]">
              {activity.arg}
            </span>
          )}
        </div>
        {activity.text && (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-normal">
            {activity.text}
          </p>
        )}
      </div>
      <span className="shrink-0 text-[10px] font-mono text-muted-foreground/60">{fmtTime(activity.at)}</span>
    </div>
  );
}
