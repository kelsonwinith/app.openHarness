import { spawn, exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { FileChange } from '@/lib/domain/types';

const execAsync = util.promisify(exec);

async function getGitFileChanges(dir: string): Promise<FileChange[]> {
  try {
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: dir });
    if (!statusOut.trim()) return [];

    const changes: FileChange[] = [];
    const lines = statusOut.trim().split('\n');

    const numstatMap = new Map<string, { add: number; del: number }>();
    try {
      const { stdout: numstatOut } = await execAsync('git diff --numstat', { cwd: dir });
      for (const line of numstatOut.trim().split('\n')) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          numstatMap.set(parts[2], {
            add: parseInt(parts[0], 10) || 0,
            del: parseInt(parts[1], 10) || 0
          });
        }
      }
    } catch {}

    for (const line of lines) {
      if (line.length < 4) continue;
      const statusCode = line.slice(0, 2);
      const filePath = line.slice(3).trim();
      let status: 'modified' | 'added' | 'deleted' = 'modified';
      if (statusCode.includes('?') || statusCode.includes('A')) {
        status = 'added';
      } else if (statusCode.includes('D')) {
        status = 'deleted';
      }

      let diff = '';
      try {
        const { stdout: diffOut } = await execAsync(`git diff -U3 -- "${filePath}"`, { cwd: dir });
        diff = diffOut;
      } catch {}

      const stat = numstatMap.get(filePath) || { add: 0, del: 0 };
      changes.push({
        path: filePath,
        status,
        additions: stat.add,
        deletions: stat.del,
        diff: diff || undefined
      });
    }

    return changes;
  } catch {
    return [];
  }
}

function resolveOpenCodeBinary(): string {
  const candidates = [
    '/opt/homebrew/bin/opencode',
    '/usr/local/bin/opencode',
    '/usr/bin/opencode'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'opencode';
}

function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\([a-zA-Z]|\r/g, '');
}

export async function POST(req: Request) {
  try {
    const { projectPath, sessionId, prompt, model } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (projectPath && !fs.existsSync(projectPath)) {
      return new Response(
        JSON.stringify({ error: `Project directory does not exist on disk: ${projectPath}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const workingDir = projectPath ? path.resolve(projectPath) : process.cwd();
    const binary = resolveOpenCodeBinary();

    const args: string[] = ['run', '--format', 'default', '--auto', '--thinking'];
    if (sessionId) {
      args.push('--session', String(sessionId).replace(/[^a-zA-Z0-9_-]/g, ''));
    }
    if (model) {
      args.push('--model', String(model));
    }
    args.push(prompt);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        let childProcess: ReturnType<typeof spawn> | null = null;

        try {
          childProcess = spawn(binary, args, {
            cwd: workingDir,
            env: {
              ...process.env,
              PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
            }
          });

          childProcess.stdout?.on('data', (chunk: Buffer) => {
            const text = stripAnsi(chunk.toString());
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          });

          childProcess.stderr?.on('data', (chunk: Buffer) => {
            const text = stripAnsi(chunk.toString());
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          });

          childProcess.on('error', (err) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
            controller.close();
          });

          childProcess.on('close', async (code) => {
            let fileChanges: FileChange[] = [];
            try {
              fileChanges = await getGitFileChanges(workingDir);
            } catch {}
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, exitCode: code, fileChanges })}\n\n`)
            );
            controller.close();
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to launch OpenCode process';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error in harness chat';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
