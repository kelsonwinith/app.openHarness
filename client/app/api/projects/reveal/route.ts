import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folderPath } = body;

    if (!folderPath) {
      return NextResponse.json({ error: 'Folder path is required' }, { status: 400 });
    }

    const resolved = path.resolve(folderPath);
    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'Directory does not exist' }, { status: 404 });
    }

    const platform = process.platform;
    let cmd = '';

    if (platform === 'darwin') {
      cmd = `open "${resolved}"`;
    } else if (platform === 'win32') {
      cmd = `explorer.exe "${resolved}"`;
    } else {
      cmd = `xdg-open "${resolved}"`;
    }

    await execAsync(cmd);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reveal folder';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
