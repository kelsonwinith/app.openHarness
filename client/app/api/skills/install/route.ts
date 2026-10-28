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

function loadLockfileSources(): Record<string, string> {
  const sources: Record<string, string> = {};
  const homeDir = process.env.HOME || '';

  const candidates = [
    path.join(homeDir, '.agents', '.skill-lock.json'),
    path.join(homeDir, '.agents', 'skills-lock.json'),
    path.join(process.cwd(), 'skills-lock.json'),
    path.join(process.cwd(), '.agents', '.skill-lock.json'),
    path.join(process.cwd(), '.agents', 'skills-lock.json'),
    path.join(process.cwd(), '..', 'skills-lock.json'),
    path.join(process.cwd(), '..', '.agents', '.skill-lock.json'),
    path.join(process.cwd(), '..', '.agents', 'skills-lock.json')
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed?.skills && typeof parsed.skills === 'object') {
          for (const [name, meta] of Object.entries(parsed.skills)) {
            const src = (meta as any)?.source;
            if (src && !sources[name]) {
              sources[name] = src;
            }
          }
        }
      } catch {}
    }
  }

  return sources;
}

function copyDirectorySync(srcDir: string, destDir: string) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.git' && entry.name !== 'node_modules') {
        copyDirectorySync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export async function POST(req: Request) {
  try {
    const { source, skillName, projectPath } = await req.json();

    if (!source || typeof source !== 'string' || !source.trim()) {
      return NextResponse.json({ error: 'Skill package or repository source is required' }, { status: 400 });
    }

    const homeDir = process.env.HOME || '';
    const env = {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
    };

    const cleanSource = source.trim().replace(/^(?:npx\s+)?skills\s+(?:add\s+)?/, '');
    const targetSkillName =
      (skillName && typeof skillName === 'string' && skillName.trim())
        ? skillName.trim()
        : parseSourceToName(cleanSource);

    // If cleanSource is a bare skill name (e.g. "frontend-design" without owner/repo or URL),
    // resolve its install package via lockfiles or CLI search
    let installTarget = cleanSource;
    const isBareName = !cleanSource.includes('/') && !cleanSource.includes('@') && !cleanSource.startsWith('http');

    if (isBareName) {
      const lockSources = loadLockfileSources();
      if (lockSources[targetSkillName]) {
        installTarget = `${lockSources[targetSkillName]}@${targetSkillName}`;
      } else {
        // Query official skills CLI registry
        try {
          const { stdout: findOut } = await execAsync(`npx skills find ${targetSkillName}`, { cwd: homeDir, env, timeout: 6000 });
          const match = findOut.match(/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+@[a-zA-Z0-9_.-]+)/);
          if (match && match[1]) {
            installTarget = match[1];
          }
        } catch {
          // ignore find failure
        }
      }
    } else if (targetSkillName && !cleanSource.includes('@') && !cleanSource.includes('--skill')) {
      // If a repo like "anthropics/skills" was given and target skill is "frontend-design", specify target
      if (cleanSource.includes('/') && !cleanSource.startsWith('http')) {
        installTarget = `${cleanSource}@${targetSkillName}`;
      }
    }

    let stdout = '';
    let installSuccess = false;

    // Check if target is still a bare name and could not be resolved via registry
    if (!installTarget.includes('/') && !installTarget.includes('@') && !installTarget.startsWith('http')) {
      // Fallback: check workspace local .agents/skills/<targetSkillName>
      const localCandidates = [
        path.join(process.cwd(), '.agents', 'skills', targetSkillName),
        path.join(process.cwd(), '..', '.agents', 'skills', targetSkillName)
      ];
      for (const loc of localCandidates) {
        if (fs.existsSync(loc)) {
          const dest = path.join(homeDir, '.agents', 'skills', targetSkillName);
          copyDirectorySync(loc, dest);
          installSuccess = true;
          stdout = `Copied local skill from ${loc} to ${dest}`;
          break;
        }
      }

      if (!installSuccess) {
        return NextResponse.json(
          { error: `Unable to resolve install repository for skill "${targetSkillName}". Please specify the repository (e.g. owner/repo@${targetSkillName}).` },
          { status: 400 }
        );
      }
    } else {
      const cmd = `npx skills add ${installTarget} -g -y`;
      try {
        const result = await execAsync(cmd, { cwd: homeDir, env });
        stdout = result.stdout;
        installSuccess = true;
      } catch (execErr: unknown) {
        // If npx skills add fails, check local fallback before returning error
        const localCandidates = [
          path.join(process.cwd(), '.agents', 'skills', targetSkillName),
          path.join(process.cwd(), '..', '.agents', 'skills', targetSkillName)
        ];
        for (const loc of localCandidates) {
          if (fs.existsSync(loc)) {
            const dest = path.join(homeDir, '.agents', 'skills', targetSkillName);
            copyDirectorySync(loc, dest);
            installSuccess = true;
            stdout = `Copied local fallback skill from ${loc} to ${dest}`;
            break;
          }
        }

        if (!installSuccess) {
          const errOut = execErr instanceof Error ? execErr.message : String(execErr);
          return NextResponse.json(
            { error: `Failed to install skill "${installTarget}": ${errOut}` },
            { status: 500 }
          );
        }
      }
    }

    // Determine derived skill name from target, stdout, or frontmatter
    let finalName = targetSkillName || parseSourceToName(installTarget);

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

    if (!foundDir && targetSkillName) {
      const altDir = path.join(homeDir, '.agents', 'skills', targetSkillName);
      if (fs.existsSync(altDir)) {
        foundDir = altDir;
        finalName = targetSkillName;
      }
    }

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
      id: `skill-${finalName}`,
      name: finalName,
      instructions,
      source: installTarget,
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
