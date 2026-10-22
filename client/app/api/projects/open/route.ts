import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folderPath } = body;

    if (!folderPath) {
      return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
    }

    const resolvedPath = path.resolve(folderPath);

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: `Directory does not exist: ${resolvedPath}` }, { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      return NextResponse.json({ error: 'Specified path is not a directory' }, { status: 400 });
    }

    const folderName = path.basename(resolvedPath);
    let branch: string | null = null;
    let remoteUrl: string | null = null;

    try {
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: resolvedPath });
      branch = branchOut.trim() || null;
    } catch {
      branch = null;
    }

    try {
      const { stdout: remoteOut } = await execAsync('git config --get remote.origin.url', { cwd: resolvedPath });
      remoteUrl = remoteOut.trim() || null;
    } catch {
      remoteUrl = null;
    }

    return NextResponse.json({
      success: true,
      project: {
        name: folderName,
        path: resolvedPath,
        currentBranch: branch,
        gitRemoteUrl: remoteUrl
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
