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

function resolveDevContext(baseDir = process.cwd()) {
  const worktreeName = getWorktreeName(baseDir);
  const explicitPort = parseExplicitPort(process.env.NATIVELY_DEV_PORT);
  const port = explicitPort ?? PORT_BY_WORKTREE[worktreeName] ?? DEFAULT_DEV_PORT;

  return {
    worktreeName,
    port,
    url: `http://localhost:${port}`,
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
  resolveDevContext,
};
