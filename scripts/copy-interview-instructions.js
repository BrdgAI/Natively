const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(repoRoot, 'electron', 'interview', 'instructions');
const targetDir = path.join(repoRoot, 'dist-electron', 'electron', 'interview', 'instructions');

function fail(message) {
  console.error(`[copy-interview-instructions] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  fail(`Source directory does not exist: ${sourceDir}`);
}

fs.mkdirSync(targetDir, { recursive: true });

const instructionFiles = fs
  .readdirSync(sourceDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name)
  .sort();

if (instructionFiles.length === 0) {
  fail(`No markdown instruction files found in ${sourceDir}`);
}

for (const fileName of instructionFiles) {
  fs.copyFileSync(path.join(sourceDir, fileName), path.join(targetDir, fileName));
}

console.log(
  `[copy-interview-instructions] Copied ${instructionFiles.length} interview instruction files to ${path.relative(
    repoRoot,
    targetDir
  )}`
);
