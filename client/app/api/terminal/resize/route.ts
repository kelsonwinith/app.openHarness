import { NextRequest, NextResponse } from 'next/server';
import { TerminalManager } from '@/lib/terminal/terminal-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, cols, rows } = body;

    if (!projectId || typeof cols !== 'number' || typeof rows !== 'number') {
      return NextResponse.json({ error: 'Invalid resize payload' }, { status: 400 });
    }

    const resized = TerminalManager.resize(projectId, cols, rows);
    return NextResponse.json({ success: resized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
