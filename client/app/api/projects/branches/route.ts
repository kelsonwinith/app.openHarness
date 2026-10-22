import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectPath } = body;

    if (!projectPath || !fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Valid project path is required' }, { status: 400 });
    }

    try {
      const { stdout } = await execAsync('git branch -a', { cwd: path.resolve(projectPath) });
      const branches = stdout
        .split('\n')
        .map((b) => b.replace(/^[* ]+/, '').trim())
        .filter((b) => b && !b.includes('->'));

      const uniqueBranches = Array.from(new Set(branches));
      return NextResponse.json({ success: true, branches: uniqueBranches });
    } catch {
      return NextResponse.json({ success: true, branches: ['main'] });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
