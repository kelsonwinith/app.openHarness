import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, targetParentDir, customName } = body;

    if (!url || !targetParentDir) {
      return NextResponse.json({ error: 'Git URL and destination directory are required' }, { status: 400 });
    }

    const parentDir = path.resolve(targetParentDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Determine folder name from git url if not provided
    const defaultName = path.basename(url, '.git').replace(/[^a-zA-Z0-9._-]/g, '');
    const folderName = customName ? customName.trim() : defaultName;
    const destination = path.join(parentDir, folderName);

    if (fs.existsSync(destination)) {
      return NextResponse.json(
        { error: `Destination folder already exists: ${destination}` },
        { status: 409 }
      );
    }

    // Execute git clone
    await execAsync(`git clone "${url}" "${destination}"`, { timeout: 180000 });

    let branch = 'main';
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: destination });
      branch = stdout.trim() || 'main';
    } catch {
      branch = 'main';
    }

    return NextResponse.json({
      success: true,
      project: {
        name: folderName,
        path: destination,
        currentBranch: branch,
        gitRemoteUrl: url.trim()
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
