# Major UI Refactor V6

## Summary

Goal: simplify the interview overlay so the output stays as close as possible to the prompt plus live context, without weakening the existing context pipeline.

This refactor should:

- keep the current context pipeline intact: transcript, screenshot sync, phase routing, clarification memory, phase handoffs, buffering, and diffing
- reduce UI complexity to five visible objects only:
  - phase flow
  - update status
  - main feed
  - primary code pane
  - compact footer with `Last screen context saved` and `Last normal context saved`
- stop feeding rendered UI sections back into prompts
- replace multi-section document rendering with a flat numbered feed
- remove drip-feed behavior on repeated `NEXT`
- derive status, footer contexts, and code diffs deterministically in the backend
- keep prompt control in the phase instruction files, with minimal post-processing

## Implementation Checklist

- [x] Phase 1: update shared interview types and payload contract
- [x] Phase 2: rewrite prompt builder and phase instruction files for `mainLines` plus optional full code
- [x] Phase 3: add context-delta builder and refactor composer, ledger, and orchestrator to the flat feed model
- [x] Phase 4: simplify the interview overlay UI to phase flow, status, main feed, code panes, and footer
- [x] Phase 5: remove obsolete renderer-only interview panels
- [x] Phase 6: update tests and fixtures for the new model
- [x] Verification 1: run the app after backend contract work
- [x] Verification 2: run the app after UI simplification
- [x] Verification 3: run final targeted checks and app verification

Verification note:

- `npm run app:dev` now boots the Vite and Electron stacks successfully after rebuilding `better-sqlite3` for the active Electron runtime. The refactor passes both renderer and Electron TypeScript compilation and does not add new interview-mode compile errors.

## Scope

In scope:

- UI simplification for interview mode
- prompt contract simplification
- render-model simplification
- deterministic update formatting
- documentation of expected file touch points

Out of scope:

- changing transcript capture
- changing screenshot capture
- changing auto/manual phase routing strategy
- changing clarification memory model itself
- general app-wide UI changes outside interview mode

## Core Design Direction

### 1. Separate prompt inputs from UI outputs

The prompt builder should use raw pipeline context only:

- problem statement
- constraints
- examples
- clarification items
- approach summary
- requirement changes
- active follow-up
- current visible code
- latest screen context delta
- latest normal-context delta
- relevant phase handoffs

It should not feed current UI render structures such as old section cards, anchors, or quick-answer blocks back into the LLM.

### 2. Replace rich UI schema with a slim lane schema

The output contract should be reduced to the minimum needed for rendering:

- `mainLines`
- optional full code block
- internal carry-forward facts
- optional clarification questions

The backend should derive:

- update status
- main-feed line states
- footer context summaries
- diff or replacement code for the secondary code pane

### 3. Keep the context pipeline, simplify the view model

Internal state such as clarification memory, handoffs, current code snapshot, and routing state should stay.

The rendered phase document should become a simple view model:

- flat `mainFeed`
- `primaryCode`
- `secondaryCode`
- `savedContexts.screen`
- `savedContexts.normal`
- `status`
- `scrollOffset`
- `lastUpdatedAt`

## Interface Changes

### InterviewOverlayPayload

Keep:

- `phase`
- `phaseConfidence`
- `manualOverrideActive`
- `generatedAt`
- `inputRevision`
- `clarificationQuestions`
- `pinnedFacts`

Replace:

- `speakNow`
- `speakIfAsked`
- `writeNow`
- `thoughtNotes`
- `quickQuestions`
- `anchor`
- `mainSections`
- `updateSummary`

With:

- `mainLines: string[]`
- `code?: { language: string; content: string }`

Notes:

- the code payload should contain full code only when code is needed
- the model should not author secondary diffs
- the model should not author UI status text

### InterviewPhaseDocument

Replace the current section-heavy render model with:

- `mainFeed`
- `primaryCode`
- `secondaryCode`
- `savedContexts.screen`
- `savedContexts.normal`
- `status`
- `scrollOffset`
- `lastUpdatedAt`

### IPC

IPC method names should stay the same.

`interview:get-state` should still return `InterviewSessionSnapshot`, but the nested phase document shape will change.

## Main Window Formatting Rules

The main window should stay visually basic, predictable, and low-noise.

### Feed structure

- Each content line must appear on its own numbered line.
- Numbering should be deterministic and visible in the UI, not authored by the model.
- A new generation for the same phase should append a new block at the bottom unless the block is explicitly marked as a replacement event by backend rules.
- Use a thin horizontal divider between update blocks.
- Each block should have a small plain header such as:
  - `Clarify - Initial`
  - `Clarify - Update 2`
  - `Test - New dry run`

### Line behavior

- Default line state: active
- Allowed backend-rendered state prefixes:
  - `[open]`
  - `[answered]`
  - `[replaced]`
  - `[update]`
  - `[note]`
- These prefixes should be lightweight text markers only, not separate UI cards.

### Expected formatting example

```text
Clarify - Initial
----------------------------------------
1. [note] Let me restate the problem first so I confirm the input and output.
2. [open] What is the maximum input size we should optimize for?
3. [open] Can the input contain duplicates?
4. [open] What exactly should be returned: index, value, count, or boolean?

Clarify - Update 2
----------------------------------------
5. [answered] Duplicates are allowed.
6. [replaced] Ignore the sorted-input question; the interviewer already clarified the array is unsorted.
7. [update] Return indices, not values.
```

### Formatting rules by phase

- `p2_clarify`: one sentence per line, ordered questions first, then note-taking lines, then later answers or replacements appended
- `p3_approach`: one reasoning sentence per line, ordered as brute force, alternatives, chosen approach, complexity, transition
- `p4_code`: main feed contains narration only; code stays in the code pane
- `p5_test`: one dry-run or testing sentence per line; if a new dry run arrives, old lines become `[replaced]` and the new run is appended
- `p6_follow_up`: explanation and impact lines in the feed; code change lives in the secondary pane if needed

### Visual rules

- basic separators only
- thin borders only
- no nested cards inside the main feed
- no pinned sub-sections inside the main window
- alternate row backgrounds are acceptable if subtle and readable
- keep line wrapping readable, but prefer enough width that lines do not break unnecessarily

## Robust Output Presentation Plan

Current issue:

- if the model returns imperfect JSON, wrapped JSON, or partially structured output, raw JSON-looking text can still leak into the main feed
- once that happens, the UI renders each line literally, which creates noisy braces, keys, quotes, and extra vertical spacing
- this makes the output feel farther from the actual prompt intent, even when the useful content is present inside the response

Goal:

- never present raw JSON to the user in normal interview mode
- always convert model output into a compact display model before it reaches the renderer
- keep spacing dense and readable, without large blank gaps between lines

### Recommended design

Add a presentation-normalization layer between generator parsing and document composition.

Recommended flow:

1. LLM raw response
2. structured extraction
3. key-based normalization
4. compact display shaping
5. renderer feed and code panes

This should be treated as a backend responsibility, not a renderer responsibility.

### Parsing strategy

Use a multi-step parse pipeline instead of a single strict `JSON.parse` plus raw-text fallback.

Step 1: strict JSON parse

- parse the full response directly if possible

Step 2: fenced or embedded JSON extraction

- extract JSON from:
  - fenced code blocks
  - leading commentary plus trailing object
  - nested object region in an otherwise mixed response

Step 3: tolerant key extraction

- if full-object parsing fails, extract known fields individually:
  - `mainLines`
  - `clarificationQuestions`
  - `pinnedFacts`
  - `code.language`
  - `code.content`
- support common broken cases:
  - trailing commas
  - single extra commentary line before or after the object
  - array values rendered as newline-separated strings
  - code returned as a plain string instead of nested object

Step 4: plain-text salvage

- if the output is not parseable JSON, do not show it raw
- salvage only meaningful content:
  - strip braces, quotes, and key labels
  - split into compact sentences
  - ignore blank lines
  - map likely code blocks into the code pane if present

### Key-to-UI mapping rules

Do not render keys directly.

- `mainLines`:
  - render into numbered main-feed rows
  - each entry becomes one compact row
- `clarificationQuestions`:
  - do not show as nested JSON objects
  - convert each question into a normal feed line or internal clarify item
  - if shown in the feed, display only the question text, not the `why` text unless we intentionally map `why` into a note line
- `pinnedFacts`:
  - keep primarily as backend memory
  - optionally surface only as a concise `[update]` line when new and user-visible
- `code`:
  - render only in the code pane
  - never show `language` or `content` keys in the main feed
- unknown keys:
  - ignore silently in normal mode
  - log for debugging only

### Compact spacing rules

The renderer should use compact feed spacing by default.

- no blank spacer rows between ordinary lines
- no card-like padding around every single line
- block header:
  - one compact header row
  - one thin divider
- feed rows:
  - tight vertical padding
  - consistent line-height
  - no extra top and bottom margin per item
- footer context:
  - render as small stacked lines, not padded chips, if space gets tight
- code pane:
  - keep one code row per source line
  - no extra empty line rendering beyond actual code lines

### Failure handling rules

If parsing is incomplete:

- prefer partial structured rendering over raw dump
- example:
  - if `mainLines` parses but `clarificationQuestions` fails, still render `mainLines`
  - if `code.content` parses but nothing else does, still show code pane plus a minimal fallback line such as `Generated code update ready.`

If nothing useful parses:

- show a minimal fallback line like:
  - `Response received but formatting needs recovery. Press NEXT again or SYNC if context changed.`
- store the raw response only in debug logs, not in the visible interview UI

### Suggested implementation shape

Recommended backend additions:

- `electron/interview/InterviewResponseExtractor.ts`
  - tolerant extraction from raw LLM output
- `electron/interview/InterviewPresentationNormalizer.ts`
  - converts extracted fields into a safe compact display payload

Likely touched files:

- `electron/interview/generators/BaseInterviewGenerator.ts`
- `electron/interview/InterviewMainDocComposer.ts`
- `electron/interview/types.ts`
- `src/components/interview/InterviewMainPanel.tsx`
- `src/components/interview/InterviewContextFooter.tsx`
- `src/components/interview/InterviewCodePanel.tsx`
- `src/index.css`

### Acceptance criteria

- raw JSON never appears in the main interview UI during normal operation
- broken-but-recoverable JSON still produces a clean feed
- extra blank lines in model output do not create extra visual rows
- `code.content` always lands in the code pane, not the main feed
- unknown keys do not leak into the user-visible interface
- spacing remains compact on both desktop and smaller widths

## UI Layout

### Visible objects only

1. Phase flow
2. Update status
3. Main feed
4. Primary code pane
5. Footer with:
   - `Last screen context saved`
   - `Last normal context saved`

### Layout zones

- Top strip:
  - phase flow
  - update status
- Body:
  - main feed
  - primary code pane
  - optional secondary code pane only when diff or replacement exists
- Footer:
  - last screen context saved
  - last normal context saved

### Elements to remove from the visible UI

- anchor block
- quick-answer block
- notes rail
- extracted-text panel
- dedicated diff panel as a separate concept

## Phase-Specific Behavior

### p2_clarify

- Initial `NEXT` should populate the full clarify pack in one shot.
- Main feed should include:
  - restatement
  - ordered clarification questions
  - note/spec lines the user should write
- Later answers should append as new lines.
- Old questions should become `[answered]` or `[replaced]` when backend logic determines they are no longer active.
- Clarification memory must still feed later phases.

### p3_approach

- Initial `NEXT` should populate the full approach narrative in one shot.
- Main feed should include:
  - brute-force statement
  - alternatives
  - chosen approach
  - complexity
  - transition into coding
- Later `NEXT` should append only true context-driven updates.

### p4_code

- Main feed contains narration lines only.
- Primary code pane contains the full code.
- If the context changes mid-coding, append new narration lines and show the deterministic patch in the secondary code pane.

### p5_test

- Main feed contains:
  - dry run
  - edge cases
  - time complexity
  - space complexity
- If a new dry-run input arrives, the previous dry-run block should be marked `[replaced]` and the new one appended.

### p6_follow_up

- Main feed contains:
  - answer
  - impact summary
  - explanation
- Primary code pane should show the last full code snapshot.
- Secondary code pane should show:
  - diff, when a focused change is enough
  - full replacement, when the change is broad
- If no code change is required, the secondary pane stays hidden.

## Backend Flow Changes

### Prompt/Input Contract Simplification

- Update `InterviewPrompts.ts` so prompts are built from raw pipeline data only.
- Stop injecting current UI presentation data into prompts.
- Rewrite `BaseInterviewGenerator.ts` to parse only the slim JSON contract.
- Update the phase instruction files so each phase emits:
  - one-sentence-per-line `mainLines`
  - full code only when relevant
- Keep `pinnedFacts` and `clarificationQuestions` as internal memory fields only.

### State and Composer Simplification

- Rewrite `InterviewMainDocComposer.ts` to build a flat phase feed instead of section cards, anchors, quick answers, extracted text, and notes rails.
- Keep `InterviewClarifyPlanner.ts` only for Phase 2 question lifecycle.
- Add `InterviewContextDeltaBuilder.ts` to derive:
  - `savedContexts.screen` from latest screen analysis
  - `savedContexts.normal` from recent transcript/manual deltas since the last published revision
- Update `InterviewMemoryLedger.ts` to persist:
  - per-phase flat feeds
  - primary and secondary code panes
  - saved context cards
- Update `InterviewOrchestrator.ts` so repeated `NEXT` with unchanged `inputRevision` returns `No updates` instead of promoting backup lines.
- Keep `InterviewDiffEngine.ts`, but use it only to populate the secondary code pane deterministically.

## Frontend Flow Changes

- Simplify `InterviewOverlay.tsx` into top strip, body, and footer.
- Rewrite `InterviewMainPanel.tsx` as a continuous numbered feed with separators per update block.
- Generalize `InterviewCodePanel.tsx` so it can render the primary full-code pane and the optional secondary diff/replacement pane.
- Slim `InterviewTopStrip.tsx` and `InterviewPhaseFlow.tsx` into keyboard-first, low-noise UI.
- Add `InterviewContextFooter.tsx` for the two saved-context cards.

## Expected File Surface

### Core backend files

- `electron/interview/types.ts`
- `electron/interview/InterviewPrompts.ts`
- `electron/interview/InterviewMainDocComposer.ts`
- `electron/interview/InterviewMemoryLedger.ts`
- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/generators/BaseInterviewGenerator.ts`

### Frontend files

- `src/types/interview.ts`
- `src/components/interview/InterviewOverlay.tsx`
- `src/components/interview/InterviewMainPanel.tsx`
- `src/components/interview/InterviewCodePanel.tsx`
- `src/components/interview/InterviewTopStrip.tsx`
- `src/components/interview/InterviewPhaseFlow.tsx`
- `src/index.css`

### New files expected

- `electron/interview/InterviewContextDeltaBuilder.ts`
- `src/components/interview/InterviewContextFooter.tsx`

### Obsolete renderer-only files expected to be removed after migration

- `src/components/interview/InterviewDiffPanel.tsx`
- `src/components/interview/InterviewNotesRail.tsx`
- `src/components/interview/InterviewExtractedTextPanel.tsx`
- `src/components/interview/InterviewMainAnchor.tsx`
- `src/components/interview/InterviewQuickAnswersPanel.tsx`

## Test Plan

Update existing tests:

- `electron/interview/__tests__/InterviewPrompts.test.ts`
- `electron/interview/__tests__/InterviewMainDocComposer.test.ts`
- `electron/interview/__tests__/InterviewMemoryLedger.test.ts`
- `electron/interview/__tests__/InterviewOrchestrator.test.ts`

Add:

- `electron/interview/__tests__/InterviewContextDeltaBuilder.test.ts`

Acceptance scenarios:

- first `NEXT` in each phase loads the phase in one shot
- repeated `NEXT` with no new context returns `No updates`
- clarify answers mark old questions answered or replaced without losing history
- prompts still include phase handoffs but no longer include rendered UI docs
- p4 and p6 show full code in the primary pane and deterministic diff or replacement in the secondary pane when code changes
- footer cards update independently from screen sync and transcript/manual deltas
- manual phase changes, pause/resume, and per-phase scroll offsets still work

## Assumptions and Defaults

- `Slim JSON` is the chosen contract
- `Mark + append` is the chosen main-feed behavior
- `Last normal context saved` means recent transcript/manual delta, not a handoff summary dump
- secondary code pane stays collapsed unless there is a real diff or full replacement to show
- current routing, buffering, vision sync, clarification memory, and handoff logic should be preserved unless simplification requires a render-contract update
