import { NextRequest, NextResponse } from 'next/server';
import { TerminalManager } from '@/lib/terminal/terminal-manager';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const session = TerminalManager.getSession(projectId);
  return NextResponse.json({
    running: session ? session.isRunning : false,
    pid: session?.pid
  });
}
