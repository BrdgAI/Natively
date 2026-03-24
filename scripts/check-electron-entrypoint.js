const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const electronDir = path.join(repoRoot, 'electron');
const packageJsonPath = path.join(repoRoot, 'package.json');
const electronTsconfigPath = path.join(electronDir, 'tsconfig.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/^\.?\//, '');
}

function fail(message) {
  console.error(`[check:electron-entrypoint] ${message}`);
  process.exit(1);
}

const packageJson = readJson(packageJsonPath);
const electronTsconfig = readJson(electronTsconfigPath);
const requiredInstructionFiles = [
  'index-interview.md',
  'global-output-rules.md',
  'phase-2-clarify.md',
  'phase-3-approach.md',
  'phase-4-code.md',
  'phase-5-test.md',
  'phase-6-follow-up.md',
  'vision-clarify.md',
  'vision-code.md',
  'vision-global.md',
  'vision-test.md',
];

const configuredMain = normalizeRelativePath(packageJson.main || '');
const outDir = electronTsconfig?.compilerOptions?.outDir;

if (!configuredMain) {
  fail('package.json is missing a "main" entry.');
}

if (!outDir) {
  fail('electron/tsconfig.json is missing compilerOptions.outDir.');
}

const resolvedOutDir = path.resolve(electronDir, outDir);
const expectedMain = normalizeRelativePath(path.relative(repoRoot, path.join(resolvedOutDir, 'main.js')));

if (configuredMain !== expectedMain) {
  fail(
    `package.json main (${configuredMain}) does not match electron outDir main (${expectedMain}).`
  );
}

const expectedMainPath = path.join(repoRoot, expectedMain);
if (!fs.existsSync(expectedMainPath)) {
  fail(`Expected Electron entrypoint does not exist yet: ${expectedMain}`);
}

const builtInstructionDir = path.join(repoRoot, 'dist-electron', 'electron', 'interview', 'instructions');
if (!fs.existsSync(builtInstructionDir)) {
  fail('Built interview instruction directory does not exist: dist-electron/electron/interview/instructions');
}

for (const fileName of requiredInstructionFiles) {
  const builtInstructionPath = path.join(builtInstructionDir, fileName);
  if (!fs.existsSync(builtInstructionPath)) {
    fail(`Missing built interview instruction file: dist-electron/electron/interview/instructions/${fileName}`);
  }
}

const legacyEntryPath = path.join(repoRoot, 'dist-electron', 'main.js');
if (expectedMain !== 'dist-electron/main.js' && fs.existsSync(legacyEntryPath)) {
  console.warn(
    '[check:electron-entrypoint] Warning: dist-electron/main.js also exists. ' +
      'This repo can contain stale Electron output, so keep package.json main aligned with electron/tsconfig.json.'
  );
}

console.log(
  `[check:electron-entrypoint] OK: ${configuredMain} and ${requiredInstructionFiles.length} interview instruction assets`
);
