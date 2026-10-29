import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import fs from 'fs';
import path from 'path';

interface TerminalSession {
  id: string;
  projectId: string;
  projectPath: string;
  ptyProcess: any;
  backlog: string;
  isRunning: boolean;
  pid?: number;
  listeners: Set<(data: string) => void>;
  statusListeners: Set<(running: boolean) => void>;
}

// Global cache for persistent terminal sessions across Next.js API requests
const globalForTerminal = global as unknown as {
  terminalSessions?: Map<string, TerminalSession>;
  projectPaths?: Map<string, string>;
};

const sessions: Map<string, TerminalSession> =
  globalForTerminal.terminalSessions || new Map<string, TerminalSession>();

const projectPaths: Map<string, string> =
  globalForTerminal.projectPaths || new Map<string, string>();

if (process.env.NODE_ENV !== 'production') {
  globalForTerminal.terminalSessions = sessions;
  globalForTerminal.projectPaths = projectPaths;
}

function ensureSpawnHelperExecutable() {
  if (process.platform === 'win32') return;
  try {
    const candidateDirs = [
      path.join(process.cwd(), 'node_modules/node-pty/prebuilds'),
      path.join(process.cwd(), 'client/node_modules/node-pty/prebuilds'),
      path.join(process.env.HOME || '', '.openharness/node-pty/prebuilds')
    ];
    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;
      const subdirs = fs.readdirSync(dir);
      for (const sub of subdirs) {
        const helper = path.join(dir, sub, 'spawn-helper');
        if (fs.existsSync(helper)) {
          try {
            fs.chmodSync(helper, 0o755);
          } catch {}
        }
      }
    }
  } catch {}
}

function getPty() {
  ensureSpawnHelperExecutable();
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node-pty');
  } catch {
    return null;
  }
}

function getDefaultShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'powershell.exe';
  }
  return process.env.SHELL || '/bin/zsh';
}

function getEnhancedPath(): string {
  const customDirs = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  const currentPath = process.env.PATH || '';
  return [...customDirs, currentPath].join(':');
}

export class TerminalManager {
  static getOrCreateSession(projectId: string, projectPath: string): TerminalSession {
    projectPaths.set(projectId, projectPath);

    let session = sessions.get(projectId);
    if (session && session.isRunning) {
      return session;
    }

    const ptyModule = getPty();
    const shell = getDefaultShell();
    const shellArgs = process.platform === 'win32' ? [] : ['-i'];
    const env = {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      PATH: getEnhancedPath()
    };

    let proc: any;
    let pid: number | undefined;

    if (ptyModule) {
      try {
        proc = ptyModule.spawn(shell, shellArgs, {
          name: 'xterm-256color',
          cols: 80,
          rows: 24,
          cwd: projectPath,
          env
        });
        pid = proc.pid;
      } catch (err) {
        console.warn('Failed to spawn with node-pty, falling back to child_process:', err);
      }
    }

    if (!proc) {
      // Fallback to standard child_process spawn
      proc = childProcess.spawn(shell, shellArgs, {
        cwd: projectPath,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      pid = proc.pid;
    }

    session = {
      id: projectId,
      projectId,
      projectPath,
      ptyProcess: proc,
      backlog: '',
      isRunning: true,
      pid,
      listeners: new Set(),
      statusListeners: new Set()
    };

    sessions.set(projectId, session);

    const onData = (chunk: string | Buffer) => {
      const text = chunk.toString();
      session!.backlog += text;

      // Retain max 200,000 characters in scrollback buffer
      if (session!.backlog.length > 200000) {
        session!.backlog = session!.backlog.slice(session!.backlog.length - 200000);
      }

      session!.listeners.forEach((listener) => {
        try {
          listener(text);
        } catch {}
      });
    };

    if (proc.onData) {
      // node-pty API
      proc.onData(onData);
      proc.onExit(() => {
        session!.isRunning = false;
        session!.statusListeners.forEach((fn) => fn(false));
      });
    } else {
      // child_process API
      proc.stdout?.on('data', onData);
      proc.stderr?.on('data', onData);
      proc.on('close', () => {
        session!.isRunning = false;
        session!.statusListeners.forEach((fn) => fn(false));
      });
    }

    return session;
  }

  static getSession(projectId: string): TerminalSession | undefined {
    return sessions.get(projectId);
  }

  static write(projectId: string, data: string): boolean {
    let session = sessions.get(projectId);
    if (!session || !session.isRunning) {
      const pPath = projectPaths.get(projectId);
      if (pPath) {
        session = this.getOrCreateSession(projectId, pPath);
      } else {
        return false;
      }
    }

    if (session.ptyProcess.write) {
      session.ptyProcess.write(data);
    } else if (session.ptyProcess.stdin) {
      session.ptyProcess.stdin.write(data);
    }
    return true;
  }

  static resize(projectId: string, cols: number, rows: number): boolean {
    const session = sessions.get(projectId);
    if (!session || !session.isRunning) return false;

    if (session.ptyProcess.resize) {
      try {
        session.ptyProcess.resize(Math.max(10, cols), Math.max(5, rows));
        return true;
      } catch {}
    }
    return false;
  }

  static kill(projectId: string, signal: string = 'SIGTERM'): boolean {
    const session = sessions.get(projectId);
    if (!session) return false;

    if (session.ptyProcess) {
      try {
        if (session.ptyProcess.kill) {
          session.ptyProcess.kill(signal);
        }
      } catch {}
    }
    session.isRunning = false;
    session.statusListeners.forEach((fn) => fn(false));
    session.listeners.clear();
    session.statusListeners.clear();
    sessions.delete(projectId);
    return true;
  }

  static restart(projectId: string, projectPath: string): TerminalSession {
    this.kill(projectId, 'SIGKILL');
    sessions.delete(projectId);
    return this.getOrCreateSession(projectId, projectPath);
  }

  static killAll(signal: string = 'SIGTERM'): number {
    let count = 0;
    for (const projectId of Array.from(sessions.keys())) {
      if (this.kill(projectId, signal)) {
        count++;
      }
    }
    return count;
  }
}

if (typeof process !== 'undefined') {
  const cleanup = () => {
    try {
      TerminalManager.killAll('SIGKILL');
    } catch {}
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}
