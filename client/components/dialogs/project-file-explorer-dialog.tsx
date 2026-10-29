'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FolderTree,
  File,
  FileText,
  FileCode,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Search,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileQuestion
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  mtime?: number;
  extension?: string;
}

interface ProjectFileExplorerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(extension?: string, isDirectory?: boolean, isExpanded?: boolean) {
  if (isDirectory) {
    return isExpanded ? (
      <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
    ) : (
      <Folder className="h-4 w-4 text-amber-500 shrink-0" />
    );
  }
  if (!extension) return <File className="h-4 w-4 text-muted-foreground shrink-0" />;

  const codeExts = [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'py',
    'go',
    'rs',
    'c',
    'cpp',
    'java',
    'html',
    'css',
    'scss',
    'yaml',
    'yml',
    'sh',
    'bash',
    'zsh',
    'sql'
  ];
  if (codeExts.includes(extension)) {
    return <FileCode className="h-4 w-4 text-primary shrink-0" />;
  }

  const textExts = ['md', 'txt', 'log', 'env', 'gitignore', 'lock'];
  if (textExts.includes(extension)) {
    return <FileText className="h-4 w-4 text-sky-500 shrink-0" />;
  }

  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function ProjectFileExplorerDialog({
  isOpen,
  onClose,
  project
}: ProjectFileExplorerDialogProps) {
  // Directory cache: path -> FileEntry[]
  const [dirMap, setDirMap] = useState<Record<string, FileEntry[]>>({});
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [revealSuccess, setRevealSuccess] = useState(false);

  // Selected file & preview state
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isBinary, setIsBinary] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  // Fetch entries for a directory subpath
  const loadDirectory = useCallback(
    async (subpath: string = '') => {
      setLoadingPaths((prev) => new Set(prev).add(subpath));
      try {
        const res = await fetch(
          `/api/projects/files?projectPath=${encodeURIComponent(project.path)}&subpath=${encodeURIComponent(
            subpath
          )}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.entries)) {
          setDirMap((prev) => ({
            ...prev,
            [subpath]: data.entries
          }));
        }
      } catch (err) {
        console.error('Failed to load project directory:', err);
      } finally {
        setLoadingPaths((prev) => {
          const next = new Set(prev);
          next.delete(subpath);
          return next;
        });
      }
    },
    [project.path]
  );

  // Initial load when opened
  useEffect(() => {
    if (isOpen && project.path) {
      loadDirectory('');
    }
  }, [isOpen, project.path, loadDirectory]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setDirMap({});
    await loadDirectory('');
    if (selectedFile) {
      loadFileContent(selectedFile);
    }
    setIsRefreshing(false);
  };

  // Toggle expand folder
  const toggleExpand = async (dirPath: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return next;
    });

    if (!dirMap[dirPath]) {
      await loadDirectory(dirPath);
    }
  };

  // Load preview content of a file
  const loadFileContent = useCallback(
    async (entry: FileEntry) => {
      setSelectedFile(entry);
      setIsFileLoading(true);
      setFileContent(null);
      setIsImage(false);
      setDataUrl(null);
      setIsBinary(false);
      setTooLarge(false);

      try {
        const res = await fetch(
          `/api/projects/files?projectPath=${encodeURIComponent(
            project.path
          )}&filePath=${encodeURIComponent(entry.path)}`
        );
        const data = await res.json();
        if (data.success) {
          if (data.isImage) {
            setIsImage(true);
            setDataUrl(data.dataUrl);
          } else if (data.isBinary) {
            setIsBinary(true);
            setFileContent(data.content || 'Binary file cannot be previewed.');
          } else if (data.tooLarge) {
            setTooLarge(true);
            setFileContent(data.content);
          } else {
            setFileContent(data.content || '');
          }
        } else {
          setFileContent(data.error || 'Failed to read file.');
        }
      } catch (err) {
        setFileContent('Error loading file preview.');
      } finally {
        setIsFileLoading(false);
      }
    },
    [project.path]
  );

  // Reveal folder in Finder / OS file manager
  const handleReveal = async () => {
    try {
      await fetch('/api/projects/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: project.path })
      });
      setRevealSuccess(true);
      setTimeout(() => setRevealSuccess(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleCopyPath = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 1500);
  };

  const handleCopyContent = () => {
    if (!fileContent) return;
    navigator.clipboard.writeText(fileContent);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 1500);
  };

  // Compute file lines for line numbers
  const fileLines = useMemo(() => {
    if (!fileContent) return [];
    return fileContent.split('\n');
  }, [fileContent]);

  // Recursive tree renderer
  const renderTree = (parentPath: string = '', depth: number = 0) => {
    const entries = dirMap[parentPath] || [];

    // Filter by search if at root
    const filtered = entries.filter((e) => {
      if (!search.trim()) return true;
      return e.name.toLowerCase().includes(search.toLowerCase());
    });

    if (filtered.length === 0 && loadingPaths.has(parentPath)) {
      return (
        <div
          style={{ paddingLeft: `${(depth + 1) * 16}px` }}
          className="flex items-center gap-1.5 py-1 text-[11px] text-muted-foreground font-mono"
        >
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span>Loading...</span>
        </div>
      );
    }

    return filtered.map((entry) => {
      const isExpanded = expandedPaths.has(entry.path);
      const isSelected = selectedFile?.path === entry.path;
      const isDir = entry.isDirectory;

      return (
        <React.Fragment key={entry.path}>
          <div
            onClick={() => {
              if (isDir) {
                toggleExpand(entry.path);
              } else {
                loadFileContent(entry);
              }
            }}
            style={{ paddingLeft: `${depth * 14 + 10}px` }}
            className={cn(
              'group flex items-center justify-between pr-3 py-1 text-xs cursor-pointer select-none font-mono transition-colors rounded-md mx-1',
              isSelected
                ? 'bg-primary/15 text-primary font-semibold'
                : 'text-foreground/80 hover:bg-muted/60 hover:text-foreground'
            )}
            title={entry.path}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {isDir ? (
                <span className="p-0.5 text-muted-foreground/60 group-hover:text-foreground shrink-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </span>
              ) : (
                <span className="w-4 shrink-0" />
              )}

              {getFileIcon(entry.extension, isDir, isExpanded)}

              <span className="truncate text-[11px]">{entry.name}</span>
            </div>

            {!isDir && entry.size !== undefined && (
              <span className="text-[10px] text-muted-foreground/60 font-mono ml-2 shrink-0">
                {formatBytes(entry.size)}
              </span>
            )}
          </div>

          {/* Subtree if expanded */}
          {isDir && isExpanded && renderTree(entry.path, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-card text-card-foreground border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b px-6 py-3.5 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between gap-4 pr-7">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FolderTree className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <DialogTitle className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                  <span>File Explorer</span>
                  <span className="text-xs font-normal text-muted-foreground font-mono">
                    ({project.name})
                  </span>
                </DialogTitle>
                <DialogDescription className="font-mono text-[11px] text-muted-foreground truncate mt-0.5" title={project.path}>
                  {project.path}
                </DialogDescription>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReveal}
                className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-medium"
                title="Reveal folder in OS file manager"
              >
                {revealSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Opened</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reveal in OS</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 px-2.5 text-xs gap-1.5 cursor-pointer font-medium"
                title="Refresh project files"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-primary')} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 2-Panel Explorer Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-border">
          {/* Left Panel: File Tree */}
          <div className="w-72 sm:w-80 flex flex-col shrink-0 bg-background/50 min-h-0">
            {/* Search Filter */}
            <div className="p-3 border-b border-border/70 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter files..."
                  className="h-7 pl-8 pr-3 text-xs bg-muted/30 border-border"
                />
              </div>
            </div>

            {/* Tree Navigation Container */}
            <div className="flex-1 overflow-y-auto p-1.5 min-h-0 space-y-0.5">
              {renderTree('', 0)}
            </div>
          </div>

          {/* Right Panel: File Preview */}
          <div className="flex-1 flex flex-col min-h-0 bg-muted/10 overflow-hidden">
            {selectedFile ? (
              <>
                {/* File Preview Header */}
                <div className="flex items-center justify-between border-b px-4 py-2 shrink-0 bg-background/70 backdrop-blur-xs font-mono text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {getFileIcon(selectedFile.extension, false)}
                    <span className="font-semibold text-foreground truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({formatBytes(selectedFile.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyPath}
                      className="h-7 px-2 text-[11px] gap-1 cursor-pointer font-mono text-muted-foreground hover:text-foreground"
                      title="Copy relative file path"
                    >
                      {copiedPath ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Path</span>
                        </>
                      )}
                    </Button>

                    {!isImage && !isBinary && !tooLarge && fileContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyContent}
                        className="h-7 px-2 text-[11px] gap-1 cursor-pointer font-mono text-muted-foreground hover:text-foreground"
                        title="Copy file contents"
                      >
                        {copiedContent ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Content</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* File Preview Content */}
                <div className="flex-1 overflow-auto min-h-0 bg-background/40">
                  {isFileLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                      <span className="text-xs font-mono">Loading file preview...</span>
                    </div>
                  ) : isImage && dataUrl ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dataUrl}
                        alt={selectedFile.name}
                        className="max-h-[70vh] max-w-full rounded-lg border shadow-sm object-contain bg-background"
                      />
                    </div>
                  ) : isBinary ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                      <FileQuestion className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-foreground">Binary File</p>
                      <p className="text-[11px] mt-0.5">
                        This file format cannot be displayed as plain text.
                      </p>
                    </div>
                  ) : tooLarge ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mb-2 text-amber-500 opacity-80" />
                      <p className="text-xs font-semibold text-foreground">File Too Large</p>
                      <p className="text-[11px] mt-0.5">
                        Files over 2MB cannot be previewed in the web browser.
                      </p>
                    </div>
                  ) : fileLines.length > 0 ? (
                    <div className="font-mono text-xs p-4 flex min-w-full">
                      {/* Line Numbers */}
                      <div className="select-none text-right pr-4 text-muted-foreground/40 shrink-0 font-mono text-[11px] leading-relaxed">
                        {fileLines.map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Lines */}
                      <pre className="text-[11px] leading-relaxed text-foreground/90 font-mono flex-1 overflow-x-auto whitespace-pre">
                        {fileContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono py-16">
                      Empty file
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* No file selected placeholder */
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8 select-none">
                <FolderTree className="h-10 w-10 mb-3 opacity-30 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">No File Selected</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Select any file from the explorer tree on the left to inspect its contents and metadata.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
