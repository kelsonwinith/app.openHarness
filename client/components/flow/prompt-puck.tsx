'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  GripHorizontal,
  CornerDownLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PromptPuckProps {
  onDispatch: (prompt: string, inputNodeId: string) => void;
  onDragStateChange?: (isDragging: boolean) => void;
  disabled?: boolean;
}

export function PromptPuck({
  onDispatch,
  onDragStateChange,
  disabled
}: PromptPuckProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isExpanded]);

  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    isDraggingRef.current = true;
    const text = prompt.trim() || 'Execute workflow task';
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.setData('application/openharness-prompt', text);
    e.dataTransfer.effectAllowed = 'copyMove';
    setIsDragging(true);
    onDragStateChange?.(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragStateChange?.(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handlePuckClick = () => {
    if (isDraggingRef.current) return;
    setIsExpanded(true);
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in fade-in zoom-in-95 duration-150">
        <div
          draggable={!disabled}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handlePuckClick}
          className={cn(
            'group flex items-center gap-2.5 rounded-full px-4 py-2.5 shadow-xl transition-all duration-200 border cursor-grab active:cursor-grabbing backdrop-blur-md select-none',
            prompt.trim()
              ? 'bg-primary text-primary-foreground border-primary/50 ring-4 ring-primary/20 hover:scale-105'
              : 'bg-card text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground',
            isDragging && 'opacity-50 scale-95'
          )}
          title="Drag & drop onto an Input Node, or click to edit context"
        >
          <GripHorizontal className="h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-1.5 font-medium text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Prompt Puck</span>
          </div>
          {prompt.trim() && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="rounded-2xl border border-border/80 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 text-xs border-b mb-2 select-none">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Compose Prompt & Dispatch to Input Node</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              title="Collapse into draggable puck"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Collapse Puck</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                setIsExpanded(false);
              }
            }}
            placeholder="Type your task instructions here... (Press Enter to collapse & drag, Shift+Enter for new line)"
            className="w-full resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground select-none">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Enter to collapse & drag • Shift+Enter for new line
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="h-7 text-xs gap-1.5 cursor-pointer rounded-lg font-medium"
              >
                <GripHorizontal className="h-3.5 w-3.5" />
                Collapse & Drag
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
