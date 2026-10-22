import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projects: Array<{ id: string; path: string }> = body.projects || [];

    const statuses: Record<string, { exists: boolean }> = {};

    for (const proj of projects) {
      if (!proj.path) {
        statuses[proj.id] = { exists: false };
        continue;
      }
      try {
        const resolved = path.resolve(proj.path);
        const exists = fs.existsSync(resolved) && fs.statSync(resolved).isDirectory();
        statuses[proj.id] = { exists };
      } catch {
        statuses[proj.id] = { exists: false };
      }
    }

    return NextResponse.json({ success: true, statuses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
