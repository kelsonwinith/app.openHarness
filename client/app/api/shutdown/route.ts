import { NextResponse } from 'next/server';
import { TerminalManager } from '@/lib/terminal/terminal-manager';
import { killAllAgentProcesses } from '@/app/api/harness/chat/route';

export async function POST() {
  try {
    const ptysKilled = TerminalManager.killAll('SIGTERM');
    const agentsKilled = killAllAgentProcesses();

    return NextResponse.json({
      success: true,
      message: 'Active agents and terminal sessions stopped',
      ptysKilled,
      agentsKilled
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown shutdown error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
