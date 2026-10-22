import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { Skill, SkillFile } from '@/lib/domain/types';

const execAsync = util.promisify(exec);

function readDirectoryFiles(dirPath: string, rootDir: string = dirPath, depth: number = 0): SkillFile[] {
  const files: SkillFile[] = [];
  if (!fs.existsSync(dirPath) || depth > 5) return files;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '.git' && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          files.push(...readDirectoryFiles(fullPath, rootDir, depth + 1));
        }
      } else {
        try {
          // Skip binary files and huge files > 1MB
          const stat = fs.statSync(fullPath);
          if (stat.size > 1024 * 1024) continue;

          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({
            name: entry.name,
            path: path.relative(rootDir, fullPath),
            content
          });
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // Return partial files on error
  }
  return files;
}

function loadLockfileSources(): Record<string, string> {
  const sources: Record<string, string> = {};

  const candidates = [
    path.join(process.env.HOME || '', '.agents', 'skills-lock.json')
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed?.skills && typeof parsed.skills === 'object') {
          for (const [name, meta] of Object.entries(parsed.skills)) {
            if ((meta as any)?.source) {
              sources[name] = (meta as any).source;
            }
          }
        }
      } catch {}
    }
  }

  return sources;
}

export async function GET() {
  try {
    const skillMap = new Map<string, Skill>();
    const sources = loadLockfileSources();

    // Strictly scan global ~/.agents/skills in user home directory
    const globalSkillsDir = path.join(process.env.HOME || '', '.agents', 'skills');
    const candidateSkillDirs = [globalSkillsDir];

    // Fast path: direct filesystem scan (< 10ms)
    for (const baseDir of candidateSkillDirs) {
      if (!fs.existsSync(baseDir)) continue;

      try {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

          const skillName = entry.name;
          if (skillMap.has(skillName)) continue;

          const skillDirPath = path.join(baseDir, skillName);
          const files = readDirectoryFiles(skillDirPath);
          const skillMd = files.find((f) => f.name.toLowerCase() === 'skill.md');
          const instructions = skillMd?.content || `Execute ${skillName} instructions.`;
          const source = sources[skillName] || undefined;

          let statTime = Date.now();
          try {
            statTime = fs.statSync(skillDirPath).mtimeMs;
          } catch {}

          skillMap.set(skillName, {
            id: `skill-${skillName}`,
            name: skillName,
            instructions,
            source,
            files,
            createdAt: statTime,
            updatedAt: statTime
          });
        }
      } catch {}
    }

    // Fallback: If no skills found via direct filesystem, run global npx in user home dir
    if (skillMap.size === 0) {
      const homeDir = process.env.HOME || '';
      const env = {
        ...process.env,
        PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
      };

      try {
        const { stdout } = await execAsync('npx skills ls -g --json', { cwd: homeDir, env, timeout: 3000 });
        const parsed = JSON.parse(stdout);
        const cliSkills: Array<{ name: string; path: string; source?: string }> = Array.isArray(parsed) ? parsed : [];

        for (const item of cliSkills) {
          if (!item.path || !fs.existsSync(item.path) || skillMap.has(item.name)) continue;
          const files = readDirectoryFiles(item.path);
          const skillMd = files.find((f) => f.name.toLowerCase() === 'skill.md');
          const instructions = skillMd?.content || `Execute ${item.name} instructions.`;

          skillMap.set(item.name, {
            id: `skill-${item.name}`,
            name: item.name,
            instructions,
            source: item.source || sources[item.name] || undefined,
            files,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      skills: Array.from(skillMap.values())
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list installed skills';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
