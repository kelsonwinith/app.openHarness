import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = util.promisify(exec);

export async function POST(req: Request) {
  try {
    const { skillName } = await req.json();

    if (!skillName || typeof skillName !== 'string' || !skillName.trim()) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    const cleanName = skillName.trim();
    const env = {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
    };

    const homeDir = process.env.HOME || '';

    // 1. Run official CLI removal strictly in home directory: npx skills remove --global <skill-name> -y
    try {
      await execAsync(`npx skills remove --global ${cleanName} -y`, { cwd: homeDir, env });
    } catch (cliErr) {
      console.warn(`CLI removal warning for "${cleanName}":`, cliErr);
    }

    // 2. Also ensure ~/.agents/skills/<skill-name> is completely wiped on disk
    const globalSkillDir = path.join(homeDir, '.agents', 'skills', cleanName);
    if (fs.existsSync(globalSkillDir)) {
      try {
        fs.rmSync(globalSkillDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn(`Failed to remove directory ${globalSkillDir}:`, rmErr);
      }
    }

    return NextResponse.json({ success: true, removed: cleanName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove skill';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
