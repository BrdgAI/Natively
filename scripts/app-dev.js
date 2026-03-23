const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawn } = require('child_process');
const waitOn = require('wait-on');
const treeKill = require('tree-kill');
const { resolveDevContext } = require('./dev-context');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage:
  npm run app:dev

This script automatically chooses a dev port based on the worktree:
  natively-cluely-ai-assistant -> 5181
  natively-codex              -> 5182
  natively-sonnet             -> 5183
  natively-upstream-clean     -> 5184

Override manually with:
  NATIVELY_DEV_PORT=5190 npm run app:dev
`);
  process.exit(0);
}

const context = resolveDevContext();
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
const RUN_STATE_DIR = path.join(os.tmpdir(), 'natively-dev-runners');
const RUN_STATE_PATH = path.join(
  RUN_STATE_DIR,
  `${sanitizeLabel(context.worktreeName)}.json`
);

const childEnv = {
  ...process.env,
  NATIVELY_DEV_PORT: String(context.port),
  NATIVELY_WORKTREE_NAME: context.worktreeName,
  NATIVELY_GIT_BRANCH: branch,
  NATIVELY_DEV_USER_DATA: context.userDataDir,
};

let viteProcess = null;
let electronProcess = null;
let shuttingDown = false;

function sanitizeLabel(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
}

function ensureRunStateDir() {
  fs.mkdirSync(RUN_STATE_DIR, { recursive: true });
}

function readRunState() {
  try {
    return JSON.parse(fs.readFileSync(RUN_STATE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeRunState() {
  ensureRunStateDir();
  fs.writeFileSync(
    RUN_STATE_PATH,
    JSON.stringify({
      pid: process.pid,
      branch,
      port: context.port,
      worktreeName: context.worktreeName,
      cwd: process.cwd(),
      userDataDir: context.userDataDir,
    })
  );
}

function clearRunState() {
  try {
    const state = readRunState();
    if (state?.pid === process.pid && fs.existsSync(RUN_STATE_PATH)) {
      fs.unlinkSync(RUN_STATE_PATH);
    }
  } catch {
    // Ignore cleanup failures during shutdown.
  }
}

function isPidAlive(pid) {
  if (!pid || pid === process.pid) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function treeKillAsync(pid, signal = 'SIGTERM') {
  return new Promise((resolve) => {
    treeKill(pid, signal, () => resolve());
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getListeningPid(port) {
  try {
    const output = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!output) return null;
    const pid = Number.parseInt(output.split('\n')[0], 10);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

async function killPreviousRunner() {
  const previous = readRunState();
  if (!previous?.pid || previous.pid === process.pid || !isPidAlive(previous.pid)) {
    return;
  }

  console.log(
    `[app:dev] Killing previous ${context.worktreeName} runner pid=${previous.pid}`
  );
  await treeKillAsync(previous.pid);
  await sleep(750);
}

async function freeAssignedPort() {
  const listeningPid = getListeningPid(context.port);
  if (!listeningPid || listeningPid === process.pid) {
    return;
  }

  console.log(
    `[app:dev] Releasing stale listener on port ${context.port} pid=${listeningPid}`
  );
  await treeKillAsync(listeningPid);
  await sleep(750);
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  const pids = [electronProcess?.pid, viteProcess?.pid].filter(Boolean);
  if (pids.length === 0) {
    clearRunState();
    process.exit(code);
    return;
  }

  let remaining = pids.length;
  pids.forEach((pid) => {
    treeKill(pid, 'SIGTERM', () => {
      remaining -= 1;
      if (remaining === 0) {
        clearRunState();
        process.exit(code);
      }
    });
  });
}

function spawnLogged(command, args, extraEnv = {}) {
  return spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...childEnv,
      ...extraEnv,
    },
  });
}

console.log(
  `[app:dev] worktree=${context.worktreeName} branch=${branch} url=${context.url} userData=${context.userDataDir}`
);

async function main() {
  await killPreviousRunner();
  await freeAssignedPort();
  writeRunState();

  viteProcess = spawnLogged(npmCmd, ['run', 'dev', '--', '--port', String(context.port), '--strictPort']);

  viteProcess.on('exit', (code) => {
    if (shuttingDown) return;
    if (!electronProcess) {
      clearRunState();
      process.exit(code ?? 1);
      return;
    }
    shutdown(code ?? 0);
  });

  waitOn({
    resources: [context.url],
    timeout: 120000,
    validateStatus: (status) => status >= 200 && status < 500,
  })
    .then(() => {
      if (shuttingDown) return;
      electronProcess = spawnLogged(npmCmd, ['run', 'electron:dev']);
      electronProcess.on('exit', (code) => shutdown(code ?? 0));
    })
    .catch((error) => {
      console.error(`[app:dev] Timed out waiting for ${context.url}`, error);
      shutdown(1);
    });
}

main().catch((error) => {
  console.error('[app:dev] Failed to start cleanly', error);
  clearRunState();
  process.exit(1);
});

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));
process.on('exit', () => clearRunState());
