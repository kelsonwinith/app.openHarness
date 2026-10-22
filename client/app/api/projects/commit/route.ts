import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectPath, message } = body;

    if (!projectPath || !fs.existsSync(projectPath)) {
      return NextResponse.json(
        { error: 'Project directory does not exist' },
        { status: 404 }
      );
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    const workingDir = path.resolve(projectPath);

    // Stage all changes
    await execAsync('git add -A', { cwd: workingDir });

    // Commit changes
    const escapedMsg = message.trim().replace(/"/g, '\\"');
    await execAsync(`git commit -m "${escapedMsg}"`, { cwd: workingDir });

    // Get current short commit hash and branch
    let commitHash = 'latest';
    let branch = 'main';

    try {
      const { stdout: hashOut } = await execAsync('git rev-parse --short HEAD', { cwd: workingDir });
      commitHash = hashOut.trim() || 'latest';
    } catch {}

    try {
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workingDir });
      branch = branchOut.trim() || 'main';
    } catch {}

    return NextResponse.json({
      success: true,
      commitHash,
      branch
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to commit changes';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
