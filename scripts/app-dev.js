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

const childEnv = {
  ...process.env,
  NATIVELY_DEV_PORT: String(context.port),
  NATIVELY_WORKTREE_NAME: context.worktreeName,
  NATIVELY_GIT_BRANCH: branch,
};

let viteProcess = null;
let electronProcess = null;
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  const pids = [electronProcess?.pid, viteProcess?.pid].filter(Boolean);
  if (pids.length === 0) {
    process.exit(code);
    return;
  }

  let remaining = pids.length;
  pids.forEach((pid) => {
    treeKill(pid, 'SIGTERM', () => {
      remaining -= 1;
      if (remaining === 0) {
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
  `[app:dev] worktree=${context.worktreeName} branch=${branch} url=${context.url}`
);

viteProcess = spawnLogged(npmCmd, ['run', 'dev', '--', '--port', String(context.port), '--strictPort']);

viteProcess.on('exit', (code) => {
  if (shuttingDown) return;
  if (!electronProcess) {
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

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));
