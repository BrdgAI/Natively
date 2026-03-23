# Interview Mode Report v3

## What Was Added

### Core architecture

- interview phase naming is now `p2_clarify -> p3_approach -> p4_code -> p5_test -> p6_follow_up`
- prompt ownership moved out of hardcoded TypeScript strings and into editable Markdown instruction files
- interview state now keeps per-phase documents instead of only one live payload
- each phase now preserves:
  - anchor block
  - main lane content
  - quick answers
  - code panel state
  - extracted screen text
  - update summary
  - scroll offset

### Prompt and generation system

- added `electron/interview/instructions/` with:
  - `index-interview.md`
  - `global-output-rules.md`
  - one phase file per interview phase
  - vision instruction files
- added `InterviewInstructionLoader.ts`
- rebuilt `InterviewPrompts.ts` into an instruction assembler
- added `InterviewClarifyPlanner.ts`
- added `InterviewMainDocComposer.ts`
- replaced closing behavior with `Phase6FollowUpGenerator.ts`

### Interview behavior

- clarification now uses a tracked question queue with statuses
- first `NEXT` in a phase now aims to load the majority of that phase’s content
- later `NEXT` calls patch the phase document instead of treating the screen like a one-shot response
- `No updates` is now a first-class visible state
- `SYNC` updates extracted text, code observations, requirement deltas, and top update status
- follow-up phase now handles:
  - code change requests
  - explain-this-part requests
  - requirement adjustments
  - diff-driven responses

### UI

- rebuilt the interview overlay into:
  - thin top phase bar
  - centered main lane
  - fixed anchor block inside the main lane
  - right-side code panel
  - quick answers panel
  - compact notes and pinned facts
  - bottom extracted-text strip
- removed the old hero/card-heavy interview styling
- added line-numbered main rows with alternating backgrounds
- switched the interview UI to a flatter, denser visual system with thin borders and better readability
- removed stale `Cmd+Shift+I` interview copy from the overlay

### Shortcut system

- `Cmd+Enter` stays the main `NEXT`
- `Cmd+Shift+Enter` stays the main `SYNC`
- `Cmd+Shift+Left/Right` remain available as phase controls but are disabled by default
- `Cmd+Shift+Up/Down` stay enabled for main-lane scroll
- interview kill switch still exists, but no longer ships with a default hard-bound shortcut

### Tests and fixtures

- updated fixtures to the follow-up phase
- added:
  - `InterviewInstructionLoader.test.ts`
  - `InterviewClarifyPlanner.test.ts`
  - `InterviewMainDocComposer.test.ts`
- updated replay, memory-ledger, keybind, and payload fixtures/tests

---

## Simple Interview Flow

### 1. Start interview mode

- start a meeting in `Interview Mode`
- overlay opens into the interview layout
- phase begins in `Clarify`

### 2. Clarify

- user presses `Cmd+Enter`
- main lane loads:
  - restatement
  - ranked missing questions
  - note-writing format
- anchor block stays visible while the user scrolls
- if new answers arrive, next `Cmd+Enter` updates only the future questions that changed

### 3. Approach

- phase auto-routes or is manually stepped
- first `Cmd+Enter` loads the full approach pack
- main lane shows the full verbal story from brute force to chosen solution

### 4. Code

- first `Cmd+Enter` loads the code plan and code panel
- code panel shows the solution
- main lane shows what to say while typing

### 5. Test

- next `Cmd+Enter` loads dry run and edge-case language
- if the interviewer gives a new input later, the active dry run is replaced cleanly

### 6. Follow-up

- if the interviewer asks for a change or explanation, the phase routes to `Follow-up`
- `Cmd+Enter` gives the fast follow-up answer
- if code changes are required, the code panel switches to a diff-style update

### 7. Screen sync

- whenever screen context matters, user presses `Cmd+Shift+Enter`
- bottom strip shows what the screenshot analysis extracted
- top update indicator shows what changed

---

## Simple Test Checklist

- start a meeting in `Interview Mode` and confirm the interview overlay appears instead of the generic overlay
- press `Cmd+Enter` in clarify and confirm the main lane loads ranked clarify content plus a fixed anchor block
- press `Cmd+Enter` again without new context and confirm the top strip can show `No updates`
- use `Cmd+Shift+Enter` and confirm the bottom extraction strip updates with visible screen text
- enable manual phase stepping in settings and confirm `Cmd+Shift+Left/Right` changes the phase
- confirm `Cmd+Shift+Up/Down` scroll only the main lane
- confirm the right column shows:
  - code
  - quick answers
  - thought notes / pinned facts
- reach code phase and confirm the code panel loads a full solution
- move to test phase and confirm the main lane shows the dry run instead of pushing it into a separate hidden area
- simulate a follow-up code change and confirm the code panel shows a diff-style update
- open shortcut settings and confirm:
  - phase prev/next are disabled by default
  - kill switch is unbound by default
  - scroll shortcuts are enabled

---

## Main Files To Customize

### Output wording and phase behavior

- `electron/interview/instructions/index-interview.md`
- `electron/interview/instructions/global-output-rules.md`
- `electron/interview/instructions/phase-2-clarify.md`
- `electron/interview/instructions/phase-3-approach.md`
- `electron/interview/instructions/phase-4-code.md`
- `electron/interview/instructions/phase-5-test.md`
- `electron/interview/instructions/phase-6-follow-up.md`
- `electron/interview/instructions/vision-global.md`
- `electron/interview/instructions/vision-clarify.md`
- `electron/interview/instructions/vision-code.md`
- `electron/interview/instructions/vision-test.md`

### Flow logic and orchestration

- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/InterviewPhaseRouter.ts`
- `electron/interview/InterviewMemoryLedger.ts`
- `electron/interview/InterviewClarifyPlanner.ts`
- `electron/interview/InterviewMainDocComposer.ts`
- `electron/interview/InterviewDiffEngine.ts`

### UI and layout

- `src/components/interview/InterviewOverlay.tsx`
- `src/components/interview/InterviewTopStrip.tsx`
- `src/components/interview/InterviewMainPanel.tsx`
- `src/components/interview/InterviewCodePanel.tsx`
- `src/components/interview/InterviewQuickAnswersPanel.tsx`
- `src/components/interview/InterviewNotesRail.tsx`
- `src/components/interview/InterviewExtractedTextPanel.tsx`
- `src/components/interview/InterviewPhaseFlow.tsx`
- `src/components/interview/InterviewMainAnchor.tsx`
- `src/components/interview/InterviewUpdateIndicator.tsx`
- `src/index.css`

### Shortcuts and settings

- `electron/services/KeybindManager.ts`
- `src/hooks/useShortcuts.ts`
- `src/components/SettingsOverlay.tsx`

---

## Recommended Next Features

These are the strongest next gaps after this pass.

### Highly recommended

1. Real phase confidence controls in the UI
   - Show why the router chose the phase and let the user clear manual override in one key-safe way.

2. Better clarify answer detection
   - The current clarify planner is heuristic-driven. It should eventually understand interviewer answers more deeply and mark question states with better confidence.

3. Visual code-region linking
   - The narration should point to exact code regions or line groups, especially during follow-up diffs.

4. Screen-sync diff preview
   - Show a small “what changed since last sync” summary so the user immediately sees whether the screenshot produced a meaningful update.

5. User-editable layout density controls
   - Add a settings profile for font size, code density, and panel ratios because different monitors and doc zoom levels will need different tuning.

### Required if you want this to feel production-complete

1. Live manual smoke QA across real monitor setups
   - Especially Chrome + Google Doc + Meet combinations at common laptop resolutions.

2. Better screenshot extraction reliability around light docs and floating camera windows
   - Real-world sync accuracy is one of the biggest practical risks.

3. Stronger follow-up diff precision
   - For requirement tweaks, the system should more reliably isolate only the changed code region instead of over-updating nearby code.

4. More synthetic interview fixtures
   - Add array, graph, string, tree, and object-design style interviews so replay coverage is not too narrow.

5. Prompt versioning / presets
   - Once you start manually tuning the Markdown instruction files, you will want a safe way to keep multiple prompt presets without losing a working version.

---

## Verification Summary

Automated verification completed in this pass:

- `npm run build`
- `npm run build:electron`
- `npx tsc -p electron/tsconfig.json --noEmit`
- `node --test dist-electron/electron/interview/__tests__/*.test.js`

Manual visual QA is still recommended on your real interview screen setup.
