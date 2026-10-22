import { NextRequest, NextResponse } from 'next/server';
import { TerminalManager } from '@/lib/terminal/terminal-manager';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, data } = body;

    if (!projectId || typeof data !== 'string') {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    const written = TerminalManager.write(projectId, data);
    return NextResponse.json({ success: written });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
