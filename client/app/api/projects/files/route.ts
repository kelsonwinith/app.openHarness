import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectPath = searchParams.get('projectPath');
    const subpath = searchParams.get('subpath') || '';
    const filePath = searchParams.get('filePath');

    if (!projectPath) {
      return NextResponse.json({ error: 'projectPath is required' }, { status: 400 });
    }

    const resolvedRoot = path.resolve(projectPath);
    if (!fs.existsSync(resolvedRoot)) {
      return NextResponse.json({ error: 'Project directory not found' }, { status: 404 });
    }

    // 1. Single file reading
    if (filePath) {
      const targetFile = path.resolve(resolvedRoot, filePath);
      if (!targetFile.startsWith(resolvedRoot)) {
        return NextResponse.json({ error: 'Access denied: Path traversal' }, { status: 403 });
      }

      if (!fs.existsSync(targetFile)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const stat = await fs.promises.stat(targetFile);
      if (stat.isDirectory()) {
        return NextResponse.json({ error: 'Target is a directory' }, { status: 400 });
      }

      // Check file size (limit 2MB for preview)
      if (stat.size > 2 * 1024 * 1024) {
        return NextResponse.json({
          success: true,
          name: path.basename(targetFile),
          path: path.relative(resolvedRoot, targetFile),
          size: stat.size,
          tooLarge: true,
          content: 'File is too large to preview (> 2MB).'
        });
      }

      const ext = path.extname(targetFile).slice(1).toLowerCase();
      const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'avif'];
      if (imageExts.includes(ext)) {
        const buffer = await fs.promises.readFile(targetFile);
        const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
        return NextResponse.json({
          success: true,
          name: path.basename(targetFile),
          path: path.relative(resolvedRoot, targetFile),
          size: stat.size,
          isImage: true,
          dataUrl
        });
      }

      const buffer = await fs.promises.readFile(targetFile);
      const isBinary = buffer.subarray(0, 512).includes(0);
      if (isBinary) {
        return NextResponse.json({
          success: true,
          name: path.basename(targetFile),
          path: path.relative(resolvedRoot, targetFile),
          size: stat.size,
          isBinary: true,
          content: 'Binary file cannot be previewed as text.'
        });
      }

      const content = buffer.toString('utf8');
      return NextResponse.json({
        success: true,
        name: path.basename(targetFile),
        path: path.relative(resolvedRoot, targetFile),
        size: stat.size,
        content,
        isBinary: false
      });
    }

    // 2. Directory listing
    const targetDir = path.resolve(resolvedRoot, subpath);
    if (!targetDir.startsWith(resolvedRoot)) {
      return NextResponse.json({ error: 'Access denied: Path traversal' }, { status: 403 });
    }

    if (!fs.existsSync(targetDir)) {
      return NextResponse.json({ error: 'Directory not found' }, { status: 404 });
    }

    const dirents = await fs.promises.readdir(targetDir, { withFileTypes: true });

    // Filter ignored system items
    const ignored = new Set(['.git', '.DS_Store', 'Thumbs.db']);
    const entries = await Promise.all(
      dirents
        .filter((d) => !ignored.has(d.name))
        .map(async (d) => {
          const itemPath = path.join(targetDir, d.name);
          const relativePath = path.relative(resolvedRoot, itemPath);
          const isDir = d.isDirectory();
          let size: number | undefined;
          let mtime: number | undefined;

          try {
            const stat = await fs.promises.stat(itemPath);
            size = isDir ? undefined : stat.size;
            mtime = stat.mtimeMs;
          } catch {
            // Ignore stat failures on special permissions
          }

          return {
            name: d.name,
            path: relativePath,
            isDirectory: isDir,
            size,
            mtime,
            extension: isDir ? undefined : path.extname(d.name).slice(1).toLowerCase()
          };
        })
    );

    // Sort: directories first, then alphabetical
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    return NextResponse.json({
      success: true,
      rootName: path.basename(resolvedRoot),
      currentPath: subpath,
      entries
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read files';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
