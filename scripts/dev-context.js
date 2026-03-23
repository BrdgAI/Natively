const os = require('os');
const fs = require('fs');
const path = require('path');

const DEFAULT_DEV_PORT = 5181;

const PORT_BY_WORKTREE = {
  'natively-cluely-ai-assistant': 5181,
  'natively-codex': 5182,
  'natively-sonnet': 5183,
  'natively-upstream-clean': 5184,
};

function parseExplicitPort(value) {
  if (!value) return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getWorktreeName(baseDir = process.cwd()) {
  const explicitName = process.env.NATIVELY_WORKTREE_NAME;
  if (explicitName) return explicitName;

  try {
    return path.basename(fs.realpathSync(baseDir));
  } catch {
    return path.basename(baseDir);
  }
}

function sanitizeWorktreeName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
}

function getDefaultAppDataDir() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support');
  }

  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  }

  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
}

function getDevUserDataDir(baseDir = process.cwd()) {
  const explicitDir = process.env.NATIVELY_DEV_USER_DATA;
  if (explicitDir) return explicitDir;

  const worktreeName = getWorktreeName(baseDir);
  const safeWorktreeName = sanitizeWorktreeName(worktreeName);
  return path.join(getDefaultAppDataDir(), `natively-dev-${safeWorktreeName}`);
}

function resolveDevContext(baseDir = process.cwd()) {
  const worktreeName = getWorktreeName(baseDir);
  const explicitPort = parseExplicitPort(process.env.NATIVELY_DEV_PORT);
  const port = explicitPort ?? PORT_BY_WORKTREE[worktreeName] ?? DEFAULT_DEV_PORT;
  const userDataDir = getDevUserDataDir(baseDir);

  return {
    worktreeName,
    port,
    url: `http://localhost:${port}`,
    userDataDir,
  };
}

if (require.main === module) {
  const context = resolveDevContext();
  const mode = process.argv[2] || 'json';

  if (mode === 'port') {
    console.log(String(context.port));
  } else if (mode === 'url') {
    console.log(context.url);
  } else if (mode === 'name') {
    console.log(context.worktreeName);
  } else {
    console.log(JSON.stringify(context));
  }
}

module.exports = {
  DEFAULT_DEV_PORT,
  PORT_BY_WORKTREE,
  getDevUserDataDir,
  resolveDevContext,
};
