import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, targetPath, initGit = true, description = '' } = body;

    if (!name || !targetPath) {
      return NextResponse.json({ error: 'Name and target path are required' }, { status: 400 });
    }

    const resolvedPath = path.resolve(targetPath);

    // Create directory if it does not exist
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }

    let branch = 'main';

    if (initGit) {
      const gitDir = path.join(resolvedPath, '.git');
      if (!fs.existsSync(gitDir)) {
        await execAsync('git init -b main', { cwd: resolvedPath }).catch(async () => {
          await execAsync('git init', { cwd: resolvedPath });
        });
      }

      try {
        const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: resolvedPath });
        branch = stdout.trim() || 'main';
      } catch {
        branch = 'main';
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        name: path.basename(resolvedPath) || name.trim(),
        description: description.trim(),
        path: resolvedPath,
        currentBranch: branch,
        gitRemoteUrl: null
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
