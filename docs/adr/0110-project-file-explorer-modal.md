# ADR 0110: Project File Explorer Modal and Files API

## Context
When inspecting projects in the canvas execution view, developers needed a quick way to browse, view, and inspect project files without needing to switch to an external IDE or terminal.

## Decision
1. **Project Files API Endpoint**:
   - Implemented `GET /api/projects/files` in [route.ts](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/app/api/projects/files/route.ts).
   - Supports directory listing (sorted with directories first, file extensions, sizes, and modification timestamps) while filtering out internal system artifacts (`.git`, `.DS_Store`, `Thumbs.db`).
   - Supports file content inspection for text files, syntax/code files, and image data URLs with size limits (up to 2MB) and binary detection to prevent browser memory bloat.
   - Enforces directory boundary checks to prevent path traversal outside `projectPath`.
2. **File Explorer Modal Dialog**:
   - Created [project-file-explorer-dialog.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/dialogs/project-file-explorer-dialog.tsx).
   - **Left Panel (File Tree)**:
     - Search filter to instantly find files.
     - Expandable directory tree with directory and file icons (`Folder`, `FolderOpen`, `FileCode`, `FileText`, `File`).
     - File size badges.
   - **Right Panel (File Preview)**:
     - Header displaying file name, relative path, file size.
     - One-click "Copy Path" and "Copy Content" buttons with checkmark feedback.
     - Monospaced code viewer with line numbers and horizontal scrolling.
     - Image preview support for image files.
   - **Top Header Actions**:
     - "Reveal in OS" button triggering `/api/projects/reveal` to reveal the project in Finder/Explorer.
     - "Refresh" button to re-fetch the latest filesystem state from disk.
3. **Canvas Header Integration**:
   - Added a "Files" (`<FolderTree />`) button to the top action bar in [playable-execution-canvas.tsx](file:///Users/sinthonwilke/On%20My%20Mac/GitHub/app.openHarness/client/components/flow/playable-execution-canvas.tsx) next to the Terminal button.

## Status
Accepted and verified through TypeScript compilation and Next.js production build.
