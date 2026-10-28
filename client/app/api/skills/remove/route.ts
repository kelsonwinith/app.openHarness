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
    const homeDir = process.env.HOME || '';
    const env = {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
    };

    // 1. Immediately wipe ~/.agents/skills/<skill-name> from disk (< 2ms)
    const globalSkillDir = path.join(homeDir, '.agents', 'skills', cleanName);
    if (fs.existsSync(globalSkillDir)) {
      try {
        fs.rmSync(globalSkillDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn(`Failed to remove directory ${globalSkillDir}:`, rmErr);
      }
    }

    // 2. Remove entry from ~/.agents/skills-lock.json if present (< 2ms)
    const lockfilePath = path.join(homeDir, '.agents', 'skills-lock.json');
    if (fs.existsSync(lockfilePath)) {
      try {
        const raw = fs.readFileSync(lockfilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed?.skills && parsed.skills[cleanName]) {
          delete parsed.skills[cleanName];
          fs.writeFileSync(lockfilePath, JSON.stringify(parsed, null, 2), 'utf8');
        }
      } catch {}
    }

    // 3. Asynchronously invoke official CLI removal to update internal CLI state without blocking response
    execAsync(`npx skills remove --global ${cleanName} -y`, { cwd: homeDir, env }).catch((cliErr) => {
      console.warn(`CLI background cleanup warning for "${cleanName}":`, cliErr);
    });

    return NextResponse.json({ success: true, removed: cleanName });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove skill';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
