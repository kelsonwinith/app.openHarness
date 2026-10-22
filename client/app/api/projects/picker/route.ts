import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function POST() {
  const platform = process.platform;

  try {
    let selectedPath = '';

    if (platform === 'darwin') {
      // macOS AppleScript folder picker
      const script = `osascript -e 'POSIX path of (choose folder with prompt "Select Project Folder")'`;
      const { stdout } = await execAsync(script);
      selectedPath = stdout.trim();
    } else if (platform === 'win32') {
      // Windows PowerShell FolderBrowserDialog
      const psCommand = `powershell -NoProfile -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Select Project Folder'; if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.SelectedPath }"`;
      const { stdout } = await execAsync(psCommand);
      selectedPath = stdout.trim();
    } else {
      // Linux zenity or kdialog
      try {
        const { stdout } = await execAsync('zenity --file-selection --directory --title="Select Project Folder"');
        selectedPath = stdout.trim();
      } catch {
        const { stdout } = await execAsync('kdialog --getexistingdirectory .');
        selectedPath = stdout.trim();
      }
    }

    if (!selectedPath) {
      return NextResponse.json({ canceled: true });
    }

    // Remove trailing slash if present
    const cleanPath = selectedPath.replace(/[/\\]+$/, '');
    return NextResponse.json({ success: true, path: cleanPath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    // User pressed Cancel in the native dialog
    if (message.includes('User canceled') || message.includes('cancelled') || message.includes('code 1')) {
      return NextResponse.json({ canceled: true });
    }
    return NextResponse.json({ error: message || 'Failed to open native folder dialog' }, { status: 500 });
  }
}
