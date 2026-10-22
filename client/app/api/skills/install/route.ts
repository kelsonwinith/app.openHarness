import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { SkillFile } from '@/lib/domain/types';

const execAsync = util.promisify(exec);

function readDirectoryFiles(dirPath: string, rootDir: string = dirPath): SkillFile[] {
  const files: SkillFile[] = [];
  if (!fs.existsSync(dirPath)) return files;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git' && entry.name !== 'node_modules') {
        files.push(...readDirectoryFiles(fullPath, rootDir));
      }
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        files.push({
          name: entry.name,
          path: path.relative(rootDir, fullPath),
          content
        });
      } catch {
        // Skip binary or unreadable files
      }
    }
  }
  return files;
}

function extractSkillNameFromMd(content: string): string | null {
  const match = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (match) {
    const nameMatch = match[1].match(/^name:\s*(.+)$/m);
    if (nameMatch) {
      return nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return null;
}

function parseSourceToName(source: string): string {
  let s = source.trim();
  s = s.replace(/^(?:npx\s+)?skills\s+(?:add\s+)?/, '').trim();

  // 1. Look for explicit --skill or -s flag
  const skillFlagMatch = s.match(/(?:--skill|-s)\s+([a-zA-Z0-9_-]+)/);
  if (skillFlagMatch && skillFlagMatch[1]) {
    return skillFlagMatch[1].trim();
  }

  // 2. Look for package@skill syntax
  if (s.includes('@') && !s.startsWith('@')) {
    const atParts = s.split('@');
    if (atParts.length > 1) {
      const candidate = atParts[1].split(' ')[0].trim();
      if (candidate) return candidate;
    }
  }

  // 3. GitHub repository URL
  if (s.includes('github.com/')) {
    const parts = s.split('github.com/')[1].split(' ')[0].split('/').filter(Boolean);
    if (parts.length >= 2) {
      return parts[1].replace('.git', '');
    }
  }

  // 4. Default fallback
  const firstToken = s.split(' ')[0];
  return firstToken.split('/').pop()?.replace('.git', '') || firstToken;
}

export async function POST(req: Request) {
  try {
    const { source, projectPath } = await req.json();

    if (!source || typeof source !== 'string' || !source.trim()) {
      return NextResponse.json({ error: 'Skill package or repository source is required' }, { status: 400 });
    }

    const cleanSource = source.trim().replace(/^(?:npx\s+)?skills\s+(?:add\s+)?/, '');
    const homeDir = process.env.HOME || '';

    // Execute real global skill installation strictly into ~/.agents/skills (-g flag)
    const cmd = `npx skills add ${cleanSource} -g -y`;
    const env = {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
    };

    let stdout = '';
    try {
      const result = await execAsync(cmd, { cwd: homeDir, env });
      stdout = result.stdout;
    } catch (execErr: unknown) {
      const errOut = execErr instanceof Error ? execErr.message : String(execErr);
      return NextResponse.json(
        { error: `Failed to install skill "${cleanSource}": ${errOut}` },
        { status: 500 }
      );
    }

    // Determine derived skill name from input, stdout, or frontmatter
    let finalName = parseSourceToName(cleanSource);

    // Check stdout for exact installed skill name
    const stdoutMatch =
      stdout.match(/Selected \d+ skill(?:s)?:\s*([a-zA-Z0-9_-]+)/i) ||
      stdout.match(/[✓✔]\s*([a-zA-Z0-9_-]+)\s+\(copied\)/i) ||
      stdout.match(/→\s*~?\/?\.agents\/skills\/([a-zA-Z0-9_-]+)/i);

    if (stdoutMatch && stdoutMatch[1]) {
      finalName = stdoutMatch[1].trim();
    }

    // Look for installed skill folder strictly in global ~/.agents/skills
    const globalSkillDir = path.join(homeDir, '.agents', 'skills', finalName);
    let foundDir: string | null = fs.existsSync(globalSkillDir) ? globalSkillDir : null;

    let instructions = `Execute ${finalName} instructions.`;
    let files: SkillFile[] = [];

    if (foundDir) {
      files = readDirectoryFiles(foundDir);
      const skillMd = files.find((f) => f.name.toLowerCase() === 'skill.md');
      if (skillMd) {
        instructions = skillMd.content;
        const frontmatterName = extractSkillNameFromMd(skillMd.content);
        if (frontmatterName) {
          finalName = frontmatterName;
        }
      }
    }

    const skill = {
      id: `skill-${Date.now()}-${finalName}`,
      name: finalName,
      instructions,
      source: cleanSource,
      files,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return NextResponse.json({
      success: true,
      skill,
      rawOutput: stdout
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error installing skill';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
