import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { HARNESSES, DEFAULT_SKILLS } from '@/lib/domain/constants';

const OPENHARNESS_DIR = path.join(os.homedir(), '.openharness');
const SESSIONS_DIR = path.join(OPENHARNESS_DIR, 'sessions');
const CONFIG_FILE = path.join(OPENHARNESS_DIR, 'config.json');
const PROJECTS_FILE = path.join(OPENHARNESS_DIR, 'projects.json');
const WORKFLOWS_FILE = path.join(OPENHARNESS_DIR, 'workflows.json');
const RUNS_FILE = path.join(OPENHARNESS_DIR, 'runs.json');

function ensureDirectories() {
  if (!fs.existsSync(OPENHARNESS_DIR)) {
    fs.mkdirSync(OPENHARNESS_DIR, { recursive: true });
  }
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

function atomicWriteJson(filePath: string, data: unknown) {
  const tmpPath = `${filePath}.tmp.${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpPath, filePath);
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function GET() {
  try {
    ensureDirectories();

    const config = readJsonFile(CONFIG_FILE, {
      version: 1,
      theme: 'system',
      defaultHarness: 'opencode',
      simSpeed: 1,
      activeWorkflowId: null,
      activeProjectId: null,
      activeSessionId: null,
      notifications: {
        browserEnabled: true,
        soundEnabled: true,
        notifyOnGate: true,
        notifyOnComplete: true
      }
    });

    const projects = readJsonFile(PROJECTS_FILE, []);
    const workflows = readJsonFile(WORKFLOWS_FILE, []);
    const runs = readJsonFile(RUNS_FILE, []);

    // Read all sessions from ~/.openharness/sessions/<id>.json
    const sessionFiles = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.json'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessions: any[] = [];
    for (const file of sessionFiles) {
      const sess = readJsonFile(path.join(SESSIONS_DIR, file), null);
      if (sess) sessions.push(sess);
    }
    sessions.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

    return NextResponse.json({
      version: config.version || 1,
      theme: config.theme || 'system',
      defaultHarness: 'opencode',
      simSpeed: config.simSpeed || 1,
      activeWorkflowId: config.activeWorkflowId ?? null,
      activeProjectId: config.activeProjectId ?? null,
      activeSessionId: config.activeSessionId ?? null,
      harnesses: [...HARNESSES],
      projects,
      sessions,
      skills: [...DEFAULT_SKILLS],
      workflows,
      runs,
      notifications: config.notifications || {
        browserEnabled: true,
        soundEnabled: true,
        notifyOnGate: true,
        notifyOnComplete: true
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read state from ~/.openharness';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureDirectories();
    const body = await request.json();
    const {
      theme,
      simSpeed,
      activeWorkflowId,
      activeProjectId,
      activeSessionId,
      projects,
      workflows,
      sessions,
      runs,
      notifications
    } = body;

    // 1. Write config.json
    atomicWriteJson(CONFIG_FILE, {
      version: 1,
      theme: theme || 'system',
      defaultHarness: 'opencode',
      simSpeed: simSpeed || 1,
      activeWorkflowId: activeWorkflowId ?? null,
      activeProjectId: activeProjectId ?? null,
      activeSessionId: activeSessionId ?? null,
      notifications: notifications || {
        browserEnabled: true,
        soundEnabled: true,
        notifyOnGate: true,
        notifyOnComplete: true
      }
    });

    // 2. Write projects.json
    if (Array.isArray(projects)) {
      atomicWriteJson(PROJECTS_FILE, projects);
    }

    // 3. Write workflows.json
    if (Array.isArray(workflows)) {
      atomicWriteJson(WORKFLOWS_FILE, workflows);
    }

    // 4. Write runs.json
    if (Array.isArray(runs)) {
      atomicWriteJson(RUNS_FILE, runs);
    }

    // 5. Write individual sessions to ~/.openharness/sessions/<id>.json
    if (Array.isArray(sessions)) {
      const currentSessionIds = new Set(sessions.map((s) => s.id));
      for (const session of sessions) {
        if (!session.id) continue;
        const sessionFile = path.join(SESSIONS_DIR, `${session.id}.json`);
        atomicWriteJson(sessionFile, session);
      }

      // Clean up deleted sessions
      const existingFiles = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.json'));
      for (const file of existingFiles) {
        const id = file.replace(/\.json$/, '');
        if (!currentSessionIds.has(id)) {
          try {
            fs.unlinkSync(path.join(SESSIONS_DIR, file));
          } catch {}
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save state to ~/.openharness';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    ensureDirectories();
    atomicWriteJson(PROJECTS_FILE, []);
    atomicWriteJson(WORKFLOWS_FILE, []);
    atomicWriteJson(RUNS_FILE, []);

    const existingFiles = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.json'));
    for (const file of existingFiles) {
      try {
        fs.unlinkSync(path.join(SESSIONS_DIR, file));
      } catch {}
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reset ~/.openharness state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
