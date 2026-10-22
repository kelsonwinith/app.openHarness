#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

const CLIENT_DIR = path.resolve(__dirname, '..', 'client');
const DEFAULT_PORT = 9480;

// Parse flags
const args = process.argv.slice(2);
let port = DEFAULT_PORT;
let isDev = false;
let shouldOpen = true;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--port' || arg === '-p') {
    const val = parseInt(args[++i], 10);
    if (!isNaN(val)) port = val;
  } else if (arg === '--dev') {
    isDev = true;
  } else if (arg === '--no-open') {
    shouldOpen = false;
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
OpenHarness Console Launcher

Usage:
  openharness [options]

Options:
  -p, --port <number>   Custom port to listen on (default: 9480)
      --dev             Launch in Next.js development mode with hot-reloading
      --no-open         Do not automatically open default browser
  -h, --help            Show this help message
`);
    process.exit(0);
  }
}

// Find available port starting from requested port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

// Open URL in default browser
function openBrowser(url) {
  const platform = process.platform;
  let cmd = '';

  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd, () => {});
}

// Poll until HTTP server is responding
function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timed out waiting for server to respond'));
        } else {
          setTimeout(check, 200);
        }
      });
    };
    check();
  });
}

// Renders the fancy terminal banner & status dashboard
function renderDashboard({ port, url, isDev, autoOpened }) {
  const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
    white: '\x1b[37m'
  };

  const banner = [
    `${c.cyan}${c.bold}   ____  ____  ______ _   __ __  __ ___     ____  _   __ ______ _____ _____${c.reset}`,
    `${c.cyan}${c.bold}  / __ \\/ __ \\/ ____// | / // / / //   |   / __ \\/ | / // ____// ___// ___/${c.reset}`,
    `${c.cyan} / / / / /_/ / __/  /  |/ // /_/ // /| |  / /_/ /  |/ // __/   \\__ \\ \\__ \\ ${c.reset}`,
    `${c.cyan}/ /_/ / ____/ /___ / /|  // __  // ___ | / _, _/ /|  // /___  ___/ /___/ / ${c.reset}`,
    `${c.cyan}\\____/_/   /_____//_/ |_//_/ /_//_/  |_|/_/ |_|/_/ |_//_____/ /____//____/  ${c.reset}`
  ].join('\n');

  console.log('\n' + banner + '\n');

  console.log(`${c.gray} ┌─────────────────────────────────────────────────────────────────┐${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.bold}${c.white}Relay — Agent Harness Console${c.reset}                          ${c.gray}│${c.reset}`);
  console.log(`${c.gray} ├─────────────────────────────────────────────────────────────────┤${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.green}●${c.reset} Status:     ${c.green}${c.bold}Ready & Listening${c.reset}                                 ${c.gray}│${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.cyan}➜${c.reset} Console:    ${c.bold}${c.white}${url}${c.reset}${url.length < 24 ? ' '.repeat(24 - url.length) : ''}                     ${c.gray}│${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.magenta}⚙${c.reset} Mode:       ${isDev ? `${c.yellow}Development (Hot Reload)${c.reset}         ` : `${c.white}Production (Optimized)${c.reset}           `}${c.gray}│${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.yellow}⚡${c.reset} Harness:    ${c.dim}OpenCode v2.1.2 (Production CLI)${c.reset}            ${c.gray}│${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.cyan}📁${c.reset} Storage:    ${c.dim}~/.openharness/ (Machine Filesystem)${c.reset}        ${c.gray}│${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.gray}⇲${c.reset} Browser:    ${autoOpened ? `${c.dim}Opened default browser${c.reset}                      ` : `${c.dim}Running headlessly (--no-open)${c.reset}             `}${c.gray}│${c.reset}`);
  console.log(`${c.gray} ├─────────────────────────────────────────────────────────────────┤${c.reset}`);
  console.log(`${c.gray} │${c.reset}  ${c.dim}Press ${c.reset}${c.bold}Ctrl+C${c.reset}${c.dim} to stop the server peacefully.${c.reset}                   ${c.gray}│${c.reset}`);
  console.log(`${c.gray} └─────────────────────────────────────────────────────────────────┘${c.reset}\n`);
}

async function main() {
  const chosenPort = await findAvailablePort(port);
  const targetUrl = `http://localhost:${chosenPort}`;

  // If in production mode, check if pre-built assets exist
  const nextBuildDir = path.join(CLIENT_DIR, '.next');
  if (!isDev && !fs.existsSync(nextBuildDir)) {
    process.stdout.write('\x1b[36m⏳ Initial launch: compiling console assets...\x1b[0m ');
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: CLIENT_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          process.stdout.write('\x1b[32mDone.\x1b[0m\n');
          resolve();
        } else {
          process.stdout.write('\x1b[31mFailed.\x1b[0m\n');
          reject(new Error(`Next.js build failed with code ${code}`));
        }
      });
    });
  }

  // Next.js server command
  const serverArgs = isDev
    ? ['run', 'dev', '--', '-p', String(chosenPort)]
    : ['run', 'start', '--', '-p', String(chosenPort)];

  // Suppress Next.js launching message by piping stdout/stderr
  const serverProcess = spawn('npm', serverArgs, {
    cwd: CLIENT_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
  });

  let fatalError = '';
  serverProcess.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    // Only capture fatal unhandled exceptions or crashes
    if (text.includes('Error:') || text.includes('FATAL') || text.includes('EADDRINUSE')) {
      fatalError += text;
    }
  });

  serverProcess.on('close', (code) => {
    if (code !== 0 && fatalError && !isShuttingDown) {
      console.error('\n\x1b[31mFatal Server Error:\x1b[0m\n', fatalError);
    }
  });

  // Graceful shutdown on Ctrl+C (SIGINT / SIGTERM)
  let isShuttingDown = false;
  const handleShutdown = () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    process.stdout.write('\n\x1b[33m⏳ Stopping OpenHarness server...\x1b[0m ');

    // Send graceful shutdown to process
    serverProcess.kill('SIGINT');

    const forceKillTimer = setTimeout(() => {
      serverProcess.kill('SIGKILL');
      process.stdout.write('\x1b[32mDone.\x1b[0m\n');
      console.log('\x1b[36m👋 Goodbye!\x1b[0m\n');
      process.exit(0);
    }, 2000);

    serverProcess.on('exit', () => {
      clearTimeout(forceKillTimer);
      process.stdout.write('\x1b[32mDone.\x1b[0m\n');
      console.log('\x1b[36m👋 Goodbye!\x1b[0m\n');
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  // Wait for server to become reachable
  try {
    await waitForServer(targetUrl, 25000);

    // Open browser if requested
    if (shouldOpen) {
      openBrowser(targetUrl);
    }

    // Render fancy dashboard
    renderDashboard({
      port: chosenPort,
      url: targetUrl,
      isDev,
      autoOpened: shouldOpen
    });
  } catch (err) {
    if (!isShuttingDown) {
      console.error('\n\x1b[31mFailed to connect to local server:\x1b[0m', err.message);
      if (fatalError) {
        console.error('\x1b[31mServer output:\x1b[0m', fatalError);
      }
      handleShutdown();
    }
  }
}

main().catch((err) => {
  console.error('\x1b[31mFailed to start OpenHarness:\x1b[0m', err);
  process.exit(1);
});
