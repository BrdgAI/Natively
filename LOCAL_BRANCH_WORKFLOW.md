# Local Branch Workflow

This repo should be operated with 2 checkouts total:

1. Working repo
   Path: `/Users/pritchakalasiya/Development/natively-cluely-ai-assistant`
2. Clean upstream repo
   Path: `/Users/pritchakalasiya/Development/natively-upstream-clean`

## Branch Roles

- `upstream-main`
  Clean mirror of `upstream/main`. Never commit here.
- `local/audio-reliability-base`
  Minimal local carry branch for upstream-missing fixes.
- `local/product-main`
  Real local product trunk. New local features build on this.
- `topic/<name>`
  Preserved local feature branches.
- `feature/<name>`
  New active work branches.
- `publish/<name>`
  Clean upstream PR branches stripped of local-only carry work.

## Normal Flow

### Pull latest upstream

In the clean upstream repo:

```bash
cd /Users/pritchakalasiya/Development/natively-upstream-clean
git fetch upstream --prune
git rebase upstream/main
```

In the working repo:

```bash
cd /Users/pritchakalasiya/Development/natively-cluely-ai-assistant
git fetch upstream --prune
git switch local/audio-reliability-base
git rebase upstream/main
git switch local/product-main
git merge local/audio-reliability-base
```

### Start a new feature

```bash
git switch local/product-main
git switch -c feature/<feature-name>
```

### Publish a clean upstream PR

```bash
git switch feature/<feature-name>
git switch -c publish/<feature-name>
git rebase --onto upstream/main local/product-main
```

## Build Sanity Checks

Run these after rebasing `local/audio-reliability-base` or merging into `local/product-main`:

```bash
npm run build:electron
npm run build:native
cargo check
```

Helpful local commands:

```bash
npm run sync:local-product
npm run feature:new -- <feature-name>
npm run check:electron-entrypoint
```

## Critical Electron Entrypoint Check

This repo is sensitive to stale Electron build output.

The safe configuration is:

- `package.json` main: `dist-electron/electron/main.js`
- `electron/tsconfig.json` outDir: `../dist-electron/electron`

These two must stay aligned.

### Rule

Do not change `package.json` main away from `dist-electron/electron/main.js` unless `electron/tsconfig.json` is changed with it.

### Why this matters

This repo can contain both of these files at the same time:

- `dist-electron/main.js`
- `dist-electron/electron/main.js`

If `package.json` points at `dist-electron/main.js`, the app can boot an older main-process bundle even when the current source branch contains the right fix. That is exactly how `local/product-main` temporarily lost the macOS multi-monitor screenshot behavior after the screenshot branch had already fixed it in source.

### Fast check

```bash
cat package.json | sed -n '1,8p'
cat electron/tsconfig.json
```

Expected values:

- `package.json` -> `"main": "dist-electron/electron/main.js"`
- `electron/tsconfig.json` -> `"outDir": "../dist-electron/electron"`

## If Screenshot Or Multi-Monitor Behavior Regresses

Check this in order:

1. Confirm the branch is really `local/product-main` or the intended feature branch.
2. Run:

```bash
npm run build:electron
```

3. Verify the Electron entrypoint alignment:

```bash
cat package.json | sed -n '1,8p'
cat electron/tsconfig.json
```

4. If needed, compare with the known-good screenshot topic branch:

```bash
git show topic/rebuild-screenshot-macos:package.json | sed -n '1,8p'
```

5. If the source looks correct but behavior is still wrong, compare the two built entry files:

```bash
diff -u dist-electron/main.js dist-electron/electron/main.js | sed -n '1,120p'
```

If those differ, `package.json` must point to `dist-electron/electron/main.js`.

## Local Product Rules

- Do not commit feature work directly to `local/product-main`.
- Keep `local/audio-reliability-base` as small as possible.
- Merge accepted local features into `local/product-main`.
- Rebase feature branches onto `local/product-main`, not directly onto `upstream-main`.
- Use the clean upstream repo when you want to answer: "is this broken in upstream, or only in our local line?"
