'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@xterm/xterm/css/xterm.css';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal as TerminalIcon,
  X,
  RotateCcw,
  Trash2,
  Minimize2,
  Maximize2,
  Folder,
  CircleDot,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectPath: string;
  onStatusChange?: (running: boolean) => void;
}

export function ProjectTerminalModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectPath,
  onStatusChange
}: ProjectTerminalModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [pid, setPid] = useState<number | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [detectedAppUrl, setDetectedAppUrl] = useState<string | null>(null);

  const scanForAppUrl = useCallback((text: string) => {
    // Matches e.g. http://localhost:3000, http://127.0.0.1:5173, http://0.0.0.0:8080
    const match = text.match(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):([0-9]{3,5})(?:\/[^\s"']*)?/i);
    if (match) {
      const port = match[1];
      const cleanUrl = `http://localhost:${port}`;
      setDetectedAppUrl(cleanUrl);
    }
  }, []);

  // Notify parent of running status
  const handleStatusUpdate = useCallback(
    (running: boolean) => {
      setIsRunning(running);
      if (onStatusChange) onStatusChange(running);
    },
    [onStatusChange]
  );

  // Initialize terminal and stream
  useEffect(() => {
    if (!containerRef.current) return;

    // Create xterm instance if not already initialized
    if (!termRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 12,
        lineHeight: 1.25,
        fontFamily: 'Menlo, Monaco, "SF Mono", "Courier New", monospace',
        theme: {
          background: '#0c0e14',
          foreground: '#e2e8f0',
          cursor: '#38bdf8',
          cursorAccent: '#0c0e14',
          selectionBackground: '#1e3a5f',
          black: '#1e293b',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#fbbf24',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f8fafc'
        }
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(containerRef.current);
      fitAddon.fit();

      termRef.current = term;
      fitAddonRef.current = fitAddon;

      // Send user keystrokes to server
      term.onData((data) => {
        fetch('/api/terminal/input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, data })
        }).catch(() => {});
      });

      // Send window resize to PTY
      term.onResize(({ cols, rows }) => {
        fetch('/api/terminal/resize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, cols, rows })
        }).catch(() => {});
      });
    }

    // Connect to SSE stream
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const connectStream = async () => {
      try {
        const url = `/api/terminal/stream?projectId=${projectId}&projectPath=${encodeURIComponent(
          projectPath
        )}`;
        const res = await fetch(url, { signal: abortController.signal });

        if (!res.ok) {
          termRef.current?.writeln(`\r\n\x1b[31mFailed to connect to terminal backend: HTTP ${res.status}\x1b[0m\r\n`);
          return;
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const payload = JSON.parse(line.slice(6));
                  if (payload.type === 'data' || payload.type === 'backlog') {
                    termRef.current?.write(payload.data);
                    scanForAppUrl(payload.data);
                  } else if (payload.type === 'status') {
                    handleStatusUpdate(!!payload.running);
                    if (payload.pid) setPid(payload.pid);
                    if (!payload.running) setDetectedAppUrl(null);
                  }
                } catch {}
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleStatusUpdate(false);
        }
      }
    };

    connectStream();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddonRef.current?.fit();
      } catch {}
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      abortController.abort();
      resizeObserver.disconnect();
    };
  }, [projectId, projectPath, handleStatusUpdate]);

  // When modal becomes visible, refit xterm and focus
  useEffect(() => {
    if (isOpen && fitAddonRef.current && termRef.current) {
      const timeout = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          termRef.current?.focus();
        } catch {}
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isMaximized]);

  // Quick action: send Ctrl+C
  const handleSendCtrlC = () => {
    fetch('/api/terminal/input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, data: '\x03' })
    }).catch(() => {});
  };

  // Quick action: clear terminal
  const handleClear = () => {
    termRef.current?.clear();
  };

  // Quick action: restart shell
  const handleRestart = async () => {
    setDetectedAppUrl(null);
    termRef.current?.clear();
    termRef.current?.writeln('\x1b[33mRestarting shell process...\x1b[0m\r\n');
    await fetch('/api/terminal/kill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, restart: true, projectPath })
    }).catch(() => {});
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-200 select-none',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'flex flex-col bg-[#0c0e14] border border-border/80 shadow-2xl overflow-hidden transition-all duration-150',
          isMaximized
            ? 'w-[98vw] h-[96vh] rounded-xl'
            : 'w-[92vw] max-w-4xl h-[72vh] rounded-xl'
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-muted/20 shrink-0 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <TerminalIcon className="h-4 w-4 text-primary" />
              <span className="font-semibold">{projectName}</span>
              <span className="text-muted-foreground font-mono text-[11px]">Terminal</span>
            </div>

            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-mono gap-1 border-border/70 py-0 h-5',
                isRunning
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : 'text-muted-foreground'
              )}
            >
              <CircleDot
                className={cn('h-2.5 w-2.5', isRunning ? 'animate-pulse text-emerald-400' : 'text-muted-foreground')}
              />
              {isRunning ? (pid ? `Running (pid ${pid})` : 'Running') : 'Stopped'}
            </Badge>

            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70 bg-muted/40 px-2 py-0.5 rounded truncate max-w-xs">
              <Folder className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{projectPath}</span>
            </span>

            {/* Auto-detected Dev Server URL Quick Button */}
            {detectedAppUrl && (
              <a
                href={detectedAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 transition-colors shadow-2xs shrink-0 cursor-pointer"
                title={`Open detected dev server at ${detectedAppUrl} in new browser tab`}
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open App</span>
                <span className="font-mono text-[10px] text-emerald-400/80">({detectedAppUrl.replace('http://', '')})</span>
              </a>
            )}
          </div>

          {/* Quick Actions & Window Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSendCtrlC}
              className="h-7 px-2 text-[11px] gap-1 font-mono text-muted-foreground hover:text-foreground cursor-pointer"
              title="Interrupt current running process (Ctrl+C)"
            >
              <span>^C</span>
              <span className="hidden sm:inline">Interrupt</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear terminal screen"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleRestart}
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Restart terminal shell"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Restart</span>
            </Button>

            <div className="h-4 w-px bg-border/60 mx-1" />

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMaximized(!isMaximized)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              title="Close terminal (process stays running in background)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Xterm Render Container */}
        <div className="flex-1 p-2 bg-[#0c0e14] overflow-hidden select-text">
          <div ref={containerRef} className="h-full w-full" />
        </div>

        {/* Footer Info */}
        <div className="border-t border-border/40 px-3 py-1.5 bg-[#090b10] flex items-center justify-between text-[10px] text-muted-foreground font-mono shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Process persists in background when closed. Dev servers (e.g. npm run dev) stay alive.
          </span>
          <span className="opacity-70">
            Press <kbd className="bg-muted/30 px-1 py-0.5 rounded text-[9px]">Esc</kbd> or click ✕ to return to chat
          </span>
        </div>
      </div>
    </div>
  );
}
