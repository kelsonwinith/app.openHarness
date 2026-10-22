import { NextRequest, NextResponse } from 'next/server';
import { TerminalManager } from '@/lib/terminal/terminal-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, signal, restart, projectPath } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    if (restart && projectPath) {
      TerminalManager.restart(projectId, projectPath);
      return NextResponse.json({ success: true, restarted: true });
    }

    const killed = TerminalManager.kill(projectId, signal || 'SIGINT');
    return NextResponse.json({ success: killed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
