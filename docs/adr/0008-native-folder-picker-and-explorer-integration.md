# Native Folder Picker and File Explorer Integration

To streamline importing codebases and inspecting project workspaces, the console integrates with host operating system file managers (macOS Finder, Windows File Explorer, Linux file managers).

### Implementation

1. **Native Directory Picker (`POST /api/projects/picker`)**:
   - Triggers the host's native folder dialog:
     - macOS: `osascript -e 'POSIX path of (choose folder with prompt "Select Project Folder")'`
     - Windows: PowerShell `FolderBrowserDialog`
     - Linux: `zenity --file-selection --directory` / `kdialog --getexistingdirectory`
   - Returns the absolute path on disk to the frontend, bypassing web browser sandbox restrictions that redact absolute filesystem paths.
   - Retains a manual path entry fallback.

2. **Reveal in Finder / Explorer (`POST /api/projects/reveal`)**:
   - Opens the directory directly in the host OS desktop file manager (`open <path>` on macOS, `explorer.exe <path>` on Windows, `xdg-open <path>` on Linux).
   - Available on project detail pages, cards, and session workspaces.

**Consequences**

- Users can browse and select codebases with one click via their native OS folder selector.
- The console can seamlessly bridge web interactions with local desktop directory inspection.
