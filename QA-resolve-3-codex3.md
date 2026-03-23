# Interview Mode QA Resolve Plan v3

## Purpose

This document is the final implementation plan for the remaining interview-mode work after reviewing:

- [feature-presentation-codex3.md](./feature-presentation-codex3.md)
- [Docs-TEMP/QA - Needs.md](./Docs-TEMP/QA%20-%20Needs.md)
- [Docs-TEMP/Uncodixfy.md](./Docs-TEMP/Uncodixfy.md)
- the current interview-mode codebase

The goal here is not to restate the old build. The goal is to define the final correction pass that closes every issue raised in QA, in implementation order, with expected architecture, file ownership, new files, and a full checklist.

This plan intentionally covers every highlighted issue from QA, including naming corrections, prompt management, UI restructuring, phase behavior, shortcut corrections, state changes, and testing coverage.

---

## Final Product Decisions

These are the final decisions this plan is built around.

### 1. Phase naming is corrected

- `p6_close` will be renamed to `p6_follow_up`
- all UI labels, generators, routing, tests, fixtures, and docs will use `Follow-up`
- this phase will no longer spend screen space on polite closing help like "thanks" or "questions for the interviewer"
- this phase will focus on:
  - code changes
  - requirement follow-ups
  - instant answers based on already gathered context
  - fast explanation of an existing code section

### 2. Prompt instructions become editable Markdown files

The current prompt content is too centralized inside `InterviewPrompts.ts`. We will move the real instruction text into explicit Markdown files so you can directly edit output behavior without touching logic code.

Instruction structure:

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

`InterviewPrompts.ts` will become a thin assembler/loader, not the primary place where output style is authored.

### 3. The overlay becomes denser, flatter, and less boxy

The current UI is too rounded, too card-heavy, too decorative, and too dependent on sections that visually compete with each other. The redesign will follow the `Uncodixfy` rules:

- no hero section
- no giant rounded shells
- no glass-heavy visual language
- no uppercase decorative eyebrow labels
- no button-heavy top strip as a primary interaction model
- no large dead padding
- no blue-accent AI-dashboard aesthetic

The target feel is compact, readable, neutral, and calm.

### 4. The main lane is phase-scoped, not one giant mixed stream

Within a phase:

- `NEXT` will append or replace only the specific parts that need updating
- the user keeps a scrollable phase document
- the top of the main lane includes a fixed anchor subsection that stays visible while the user scrolls

Across phases:

- each phase gets its own saved screen document
- switching phases restores that phase's saved content and scroll position
- the user does not need to scroll through old clarify content to see the approach content

This resolves both goals:

- dense content within the active phase
- clean separation between phases

### 5. `NEXT` is optimized to reduce presses

The system will assume the user only presses `NEXT` when new context exists or when they need the next block. That means:

- first `NEXT` in a phase should deliver the majority of the usable content for that phase
- later `NEXT` calls should patch or extend only what changed
- if nothing materially changed, the top indicator must explicitly say `No updates`

### 6. Clarification uses a managed question queue

Clarification cannot be a static list that goes stale. We will implement question planning with statuses:

- `pending`
- `asked`
- `answered`
- `retired`
- `replaced`

When the interviewer answers 3 out of 8 questions, the system will retire or replace only the future questions affected by that answer, instead of regenerating the whole clarify document blindly.

### 7. Code should stay visible with minimal or no internal scrolling

The code panel will be redesigned for interview-length Python solutions:

- minimal padding
- dense line-height
- wide enough to preserve indentation visibility
- no wrapped lines when avoidable
- adaptive fit mode for standard interview solutions
- diff mode for midstream changes

If the full solution becomes unusually long, the fallback will not be an uncontrolled scroll. The fallback will be a fit-first layout that collapses unchanged blocks around the active diff or active function region.

### 8. Quick answers become a dedicated fast-response lane

There will be a dedicated `Quick Answers` box for interruption handling. This is separate from the main lane so the user can answer an unexpected interviewer question, then return to the main script without losing their place.

### 9. Screen extraction gets its own bottom bar

The user explicitly wants to see what the screenshot sync actually extracted. We will add a bottom extraction strip that shows:

- extracted problem text
- extracted requirement change text
- extracted dry-run input
- extracted code issue signals

This also serves as trust feedback after `SYNC`.

### 10. Shortcuts are corrected to match the intended behavior

Final shortcut behavior:

- `Cmd+Enter` = `NEXT`
- `Cmd+Shift+Enter` = `SYNC`
- `Cmd+Shift+Left` = optional phase previous, disabled by default
- `Cmd+Shift+Right` = optional phase next, disabled by default
- `Cmd+Shift+Up` = main scroll up, enabled by default
- `Cmd+Shift+Down` = main scroll down, enabled by default
- kill switch exists, but has no default hard-bound accelerator

Important current mismatch that must be fixed:

- the current implementation still exposes `Cmd+Shift+I` as a default leave/resume shortcut in code and UI copy
- phase previous/next are currently enabled by default in code, but should be disabled by default

### 11. Mouse-passthrough is the default mental model

The overlay must not rely on clickable controls during normal use. That means:

- buttons cannot be the primary affordance
- routine interactions must be readable as shortcut-driven
- optional clickable controls may exist only when mouse passthrough is off, but they should not dominate layout or consume important space

---

## QA Coverage Matrix

This section maps the QA notes directly to planned fixes so no request is missed.

### A. Follow-up phase correction

QA request:

- repurpose Step 7 as follow-ups only
- remove generic closing help
- keep code changes and instant answers

Resolution:

- rename `p6_close` to `p6_follow_up`
- replace closing generator with follow-up generator behavior
- keep main output focused on:
  - requirement changes
  - code diffs
  - explain-this-line answers
  - quick adjustments based on earlier context

### B. Phase instruction management

QA request:

- create `index-interview.md`
- show each file where phase-specific instructions live
- create global instructions file editable from one place

Resolution:

- introduce the `electron/interview/instructions/` folder
- define one global file plus one phase file per phase
- document exact ownership in this plan and in `index-interview.md`
- `InterviewInstructionLoader.ts` will assemble:
  - index flow guidance
  - global output rules
  - phase-specific output rules
  - vision rules when `SYNC` is used

### C. UI correction

QA request:

- follow `Uncodixfy`
- fit more content
- avoid too many boxes
- optimize for Chrome + light Google Doc + floating Meet camera
- include:
  - main section centered
  - fixed subsection inside main
  - code section on right
  - dynamic quick answers box
  - top phase flow
  - update indicator
  - bottom extracted-text box
- preserve precious top-center eye area
- avoid buttons when mouse is disabled
- dim the background differently
- use a better bold font
- numbered main lines with alternating colors
- thin borders

Resolution:

- rebuild the interview shell around a flatter layout:
  - thin top phase bar
  - centered main lane
  - right support column
  - bottom extraction strip
- use compact neutral surfaces with thin borders
- replace decorative cards with simple panels
- remove hero panel and big rounded sections
- use a readable mac-native/system-first font stack and denser typography
- render line-numbered script rows with alternating background shades
- keep the top area thin so the eye remains close to the document/camera zone
- move clickable controls behind passthrough-off conditions or settings only

### D. Main flow architecture

QA request:

- `NEXT` only when user needs updated info
- minimize `NEXT` count
- keep majority of content in main section
- save each phase's main screen

Resolution:

- add phase document persistence
- first `NEXT` in phase generates the full pack
- later `NEXT` calls apply targeted patch operations
- top bar explicitly shows updated sections vs no updates
- phase switching restores:
  - phase content
  - phase anchor block
  - scroll position

### E. Clarify behavior

QA request:

- use main section for all questions
- keep writing format in permanent subsection
- update future questions after new answers
- ask only highly relevant missing questions
- store answers for future phases

Resolution:

- add a `ClarificationPlanner`
- add a fixed anchor subsection in the main lane for:
  - problem restatement
  - what to write
  - confirmed facts
- keep question queue with statuses and replacement rules
- store clarified answers into the memory ledger for approach/code/test/follow-up

### F. Approach behavior

QA request:

- load everything into main section in one shot
- update only when needed

Resolution:

- approach generator produces a full phase pack on first run
- later updates patch only:
  - chosen approach
  - complexity explanation
  - interviewer hint response
  - alignment line before coding

### G. Code behavior

QA request:

- load the whole code into code section
- include blueprint comments
- minimize spacing/padding
- keep narration in main section
- use diffs for code changes

Resolution:

- code panel becomes dense and fit-first
- main lane contains section-by-section narration for what to say while typing
- code changes are patch-based, not full rewrite by default
- diff mode highlights:
  - added lines
  - removed lines
  - changed sections

### H. Test behavior

QA request:

- dry run directly in main section
- handle new test inputs later

Resolution:

- testing phase keeps the active dry run in the main lane
- if the interviewer gives a new input:
  - replace the active dry run block with the newest one
  - archive the older run into a compact `previous test` note if still useful

This keeps the main lane clean and current.

### I. Follow-up behavior

QA request:

- if code changes, use code diff
- keep main information in the main section

Resolution:

- follow-up phase reuses the code diff pipeline
- main lane handles:
  - spoken change explanation
  - impact explanation
  - any fast answer tied to earlier context

---

## Target Feature Set

This is the feature list we will implement to resolve the QA set.

### 1. Editable interview instruction system

What it adds:

- one place to edit global output behavior
- one file per phase to edit phase-specific behavior
- one index file that explains the flow order and how phases should hand off
- editable vision instruction files for screenshot extraction behavior

Why it matters:

- you can tune output behavior without editing TypeScript
- prompt ownership becomes explicit and traceable

### 2. Phase document persistence

What it adds:

- each phase keeps its own main document
- each phase keeps its own scroll position
- user can return to a phase and see what was there before

Why it matters:

- prevents clarify, approach, code, and test content from becoming one long mixed page
- supports optional manual phase stepping cleanly

### 3. Main-lane anchor block

What it adds:

- a small fixed subsection inside the main panel that remains visible during scroll

Expected contents by phase:

- `p2_clarify`
  - short restatement
  - write format
  - confirmed facts
- `p3_approach`
  - chosen approach
  - complexity
  - alignment sentence
- `p4_code`
  - coding blueprint
  - active function / region
  - current change request if any
- `p5_test`
  - active input
  - target function
  - expected result
- `p6_follow_up`
  - latest follow-up ask
  - impacted code region
  - response goal

Why it matters:

- the user keeps one always-visible orientation point while scrolling through verbose content

### 4. Clarification question queue with patching

What it adds:

- stable clarification items with statuses
- targeted retirement and replacement of stale questions
- structured handoff into later phases

Data shape:

- question id
- question text
- why it matters
- status
- source revision
- answer summary
- replacement reason if retired

Why it matters:

- solves the "8 questions, 3 answered, now future questions must change" problem

### 5. Approach pack generator

What it adds:

- full spoken flow in one first pass
- brute-force to optimized transition
- complexity explanation
- alignment ask before coding

Why it matters:

- minimizes `NEXT` during the explanation stage
- avoids fragmented approach output

### 6. Fit-first code panel with diff mode

What it adds:

- dense full-code panel
- blueprint comments
- section markers
- diff rendering for follow-up changes
- likely-mistake highlighting

Why it matters:

- lets the user type while reading
- makes incremental change requests safer

### 7. Narration-to-code mapping

What it adds:

- every major code block has matching narration in the main lane
- narration references the code region by name

Why it matters:

- the user can speak and type without mentally translating between the right panel and the center panel

### 8. Quick Answers panel

What it adds:

- a separate lane for interruption handling
- fast answers that should not disturb the main reading flow

Examples:

- "Why did you choose a hash map here?"
- "What happens with duplicates?"
- "Can we reduce space further?"

Why it matters:

- protects the main flow while still supporting mid-interview interrupts

### 9. Extracted Screen Text strip

What it adds:

- visible proof of what `SYNC` extracted
- bottom strip showing:
  - raw problem text summary
  - requirement changes
  - test input
  - visible code issue notes

Why it matters:

- gives the user confidence that `SYNC` worked
- reduces stress when a trigger produces no large visible change

### 10. Update indicator

What it adds:

- explicit feedback after `NEXT` and `SYNC`

States:

- `Updated: Main, Quick Answers`
- `Updated: Code, Extracted Text`
- `No updates`
- `Partial update: waiting on more context`

Why it matters:

- reassures the user the system is alive even when the visible content does not change much

### 11. Follow-up phase pack

What it adds:

- fast requirement-change handling
- code diff reuse
- explain-an-existing-block answers

Why it matters:

- turns the final phase into a practical response engine instead of a polite closing coach

### 12. Shortcut and control cleanup

What it adds:

- correct default shortcut states
- no fake shortcut references
- kill switch as an option, not a hard dependency
- UI that works when mouse passthrough is on

Why it matters:

- removes user confusion and aligns the app with the actual interview operating model

---

## Target UI Architecture

### Layout

Final screen layout:

1. Thin top flow bar
2. Main center lane
3. Right support column
4. Bottom extraction strip

### 1. Thin top flow bar

Contents:

- all phases in order
- current phase highlight
- update status
- freshness summary
- manual phase override indicator
- compact shortcut reminder text

Design rules:

- single-row or compact two-row structure
- no oversized pills
- no heavy buttons as the default state
- no large headline text

### 2. Main center lane

Contents:

- fixed anchor subsection at the top
- scrollable numbered line list below
- current phase document only

Design rules:

- centered and dominant
- highest readability priority
- numbered lines
- alternating row fills
- dense vertical rhythm
- thin borders
- almost all narrative content lives here

### 3. Right support column

Contents:

- top: code panel
- middle: quick answers
- bottom: thought notes + pinned facts

Design rules:

- compact stacked sections
- keep the code panel visually dominant within the support column
- avoid internal decorative layers
- when no code exists, preserve the slot with a simple placeholder

### 4. Bottom extraction strip

Contents:

- latest extracted problem text
- latest extracted code/test hints
- latest screenshot-derived updates

Design rules:

- thin strip, not a large panel
- text-first
- clear timestamps
- visible immediately after `SYNC`

### Visual system

Recommended visual direction:

- dark neutral scrim behind the overlay, low opacity
- warm off-white translucent surfaces for readable black text
- no saturated blue accents
- text emphasis through weight and spacing, not glow or color noise
- font stack:
  - primary: mac/system-first sans
  - code: `SFMono-Regular`, `Menlo`, `Monaco`, monospace

### Explicit removals from the current UI

- remove hero block styling
- remove large 22px to 30px corner radii
- remove excessive uppercase eyebrow labels
- remove button-first top strip layout
- remove references to `Cmd+Shift+I` unless the user explicitly binds it
- remove chatty filler copy that does not help the interview

---

## State and Data Model Changes

The current state model is a good start, but it is still too payload-centric for the QA goals. We need phase documents, section patching, and extracted-text visibility.

### Existing models to evolve

- `InterviewPhase`
- `InterviewOverlayPayload`
- `InterviewSessionSnapshot`
- memory ledger state

### New or expanded state structures

#### 1. Phase document cache

Purpose:

- preserve each phase's main lane independently

Suggested shape:

- `phaseDocuments: Record<InterviewPhase, InterviewPhaseDocument>`

Document contents:

- anchor block
- main line items
- quick answers
- code panel snapshot
- extracted text summary
- update summary
- scroll offset

#### 2. Clarification queue

Purpose:

- manage question replacement cleanly

Suggested shape:

- `clarificationItems: InterviewClarificationItem[]`

Fields:

- `id`
- `text`
- `why`
- `status`
- `answer`
- `revision`
- `replacedBy`

#### 3. Extracted text summary

Purpose:

- support the bottom `SYNC` strip

Suggested shape:

- `extractedTextSummary`
  - `problemText`
  - `requirementDelta`
  - `dryRunInput`
  - `codeObservations`
  - `capturedAt`

#### 4. Section update summary

Purpose:

- show exactly what changed after `NEXT` or `SYNC`

Suggested shape:

- `updateSummary`
  - `status`
  - `updatedSections`
  - `message`

#### 5. Follow-up request state

Purpose:

- make follow-up changes explicit instead of burying them in quick questions

Suggested shape:

- `activeFollowUp`
  - `request`
  - `impactedArea`
  - `diffRequired`
  - `derivedFrom`

---

## Prompt and Generation Architecture

### Current issue

`InterviewPrompts.ts` currently hardcodes almost all instructional behavior. That makes output tuning harder and makes phase ownership harder to understand.

### Target architecture

#### Prompt assembly flow

1. `index-interview.md`
   - defines the phase order and handoff rules
2. `global-output-rules.md`
   - rules applied to every generated output
3. phase-specific file
   - phase objectives and formatting needs
4. runtime context block
   - problem, clarified facts, code, hints, recent transcript
5. output schema contract

#### Vision prompt assembly flow

1. `vision-global.md`
2. phase-specific vision file
3. transcript context
4. screenshot extraction schema

### Generator contract changes

The generator output should become richer than the current plain arrays.

Suggested additions:

- `anchorBlock`
- `mainSections`
- `questionOperations`
- `quickAnswerItems`
- `updateSummary`
- `extractedTextNote`

This lets the orchestrator patch sections precisely instead of rebuilding everything on every `NEXT`.

### Phase-specific generation rules

#### `p2_clarify`

First generation:

- full clarify pack
- restatement
- writing format
- ranked question queue
- example trace starter if enough info exists

Later generations:

- retire answered questions
- insert replacement questions only when needed
- update the permanent writing block if new constraints land

#### `p3_approach`

First generation:

- full end-to-end spoken approach
- complexity
- tradeoff note
- alignment ask

Later generations:

- patch only the changed blocks
- preserve previously confirmed approach if no contradiction exists

#### `p4_code`

First generation:

- full code
- blueprint comments
- main-lane narration aligned to code sections

Later generations:

- prefer diffs
- update only the impacted code region
- keep suspicion notes if screenshot reveals likely mistakes

#### `p5_test`

First generation:

- active dry run
- edge cases
- final complexity statement

Later generations:

- replace active dry run when interviewer gives a new input
- keep a compact prior-run note only if it remains useful

#### `p6_follow_up`

First generation:

- answer the latest follow-up ask using current context
- generate diff if code changes are needed
- generate explanation if verbal answer is enough

Later generations:

- keep using follow-up as a fast patch-response phase
- no generic closing advice unless explicitly requested elsewhere

---

## Wiring Pipeline

This section describes how the final system should be wired so future requests can be routed to the right area quickly.

### 1. Session start pipeline

Flow:

1. launcher starts interview session
2. memory ledger starts an interview state
3. phase defaults to `p2_clarify`
4. empty per-phase documents are created
5. overlay opens in interview layout
6. top flow bar shows `Clarify`
7. main lane shows ready state and fixed anchor scaffold

Primary owners:

- `src/components/Launcher.tsx`
- `src/App.tsx`
- `electron/interview/InterviewMemoryLedger.ts`
- `electron/interview/types.ts`
- `src/components/interview/InterviewOverlay.tsx`

### 2. `NEXT` pipeline

Flow:

1. user presses `Cmd+Enter`
2. orchestrator checks current phase and input revision
3. if a valid prefetched phase pack exists, use it
4. otherwise gather:
   - recent transcript
   - current snapshot
   - current phase document
   - clarification queue / follow-up state if relevant
5. generator produces patch-oriented payload
6. main document composer updates:
   - anchor block
   - main line items
   - quick answers
   - code panel if phase needs it
   - update summary
7. ledger stores the patched phase document
8. renderer updates only the changed panels

Primary owners:

- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/InterviewPrefetchBuffer.ts`
- `electron/interview/generators/*`
- `electron/interview/InterviewMainDocComposer.ts`
- `electron/interview/InterviewMemoryLedger.ts`

### 3. `SYNC` pipeline

Flow:

1. user presses `Cmd+Shift+Enter`
2. screenshot capture runs
3. vision prompt is assembled from:
   - global vision rules
   - current phase vision rules
   - transcript context
4. screen analysis result is stored
5. extracted text summary is updated
6. memory ledger updates:
   - problem statement
   - hints
   - visible code
   - likely mistakes
   - dry-run inputs
7. update summary marks which sections changed
8. bottom extraction strip refreshes
9. control strip window may appear for phase correction fallback

Primary owners:

- `electron/interview/InterviewVisionSync.ts`
- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/InterviewMemoryLedger.ts`
- `src/components/interview/InterviewExtractedTextPanel.tsx`

### 4. Manual phase switch pipeline

Flow:

1. user uses optional left/right phase shortcut or the temporary phase chooser
2. router sets manual override phase
3. overlay restores that phase's saved document and scroll position
4. top flow bar updates highlight state
5. next generation uses that phase as the target until cleared

Primary owners:

- `electron/interview/InterviewPhaseRouter.ts`
- `electron/interview/InterviewMemoryLedger.ts`
- `electron/interview/InterviewOrchestrator.ts`
- `src/components/interview/InterviewTopStrip.tsx`

### 5. Code change follow-up pipeline

Flow:

1. interviewer requests a code change
2. transcript or screen analysis marks requirement delta
3. phase routes or overrides to `p6_follow_up`
4. follow-up generator creates:
   - main-lane explanation
   - diff-oriented code payload
   - quick answer if interviewer asks why
5. diff engine highlights the patch
6. code panel shows only the change emphasis, not a full reset

Primary owners:

- `electron/interview/InterviewDiffEngine.ts`
- `electron/interview/generators/Phase6FollowUpGenerator.ts`
- `src/components/interview/InterviewCodePanel.tsx`

---

## Expected Existing Files To Touch

These are the files expected to change as part of this QA completion pass.

### Backend / Electron

- `electron/interview/types.ts`
  - rename phase, add phase document state, add extracted text summary, add update summary, add clarification queue structures
- `electron/interview/InterviewMemoryLedger.ts`
  - persist phase documents, clarification queue, follow-up state, extracted text, scroll offsets by phase
- `electron/interview/InterviewOrchestrator.ts`
  - patch-oriented `NEXT`, improved `SYNC`, phase document restore, no-update logic
- `electron/interview/InterviewPhaseRouter.ts`
  - rename follow-up phase and refine final-stage routing
- `electron/interview/InterviewPrompts.ts`
  - convert into prompt assembly shim or remove heavy hardcoding from it
- `electron/interview/InterviewVisionSync.ts`
  - update vision extraction to populate bottom extraction strip data
- `electron/interview/InterviewDiffEngine.ts`
  - tighten diff behavior for follow-up changes and compact code presentation
- `electron/interview/generators/BaseInterviewGenerator.ts`
  - support richer payload sections
- `electron/interview/generators/Phase2ClarificationGenerator.ts`
  - integrate clarification queue and replacement rules
- `electron/interview/generators/Phase3ApproachGenerator.ts`
  - one-shot approach pack plus patch updates
- `electron/interview/generators/Phase4CodingGenerator.ts`
  - full code pack plus diff-mode updates
- `electron/interview/generators/Phase5TestingGenerator.ts`
  - active dry run replacement policy
- `electron/interview/generators/Phase6ClosingGenerator.ts`
  - replace or rename into follow-up generator behavior
- `electron/services/KeybindManager.ts`
  - disable phase left/right by default, remove default kill-switch accelerator, keep scroll enabled
- `electron/ipcHandlers.ts`
  - surface any new phase-document state or extracted-text state to renderer

### Frontend / Renderer

- `src/types/interview.ts`
  - mirror backend type changes
- `src/components/interview/InterviewOverlay.tsx`
  - new shell layout and phase document restore behavior
- `src/components/interview/InterviewTopStrip.tsx`
  - convert to thin phase flow plus update indicator
- `src/components/interview/InterviewMainPanel.tsx`
  - fixed anchor subsection, line-numbered main document, per-phase rendering
- `src/components/interview/InterviewCodePanel.tsx`
  - dense fit-first code view and compact diff mode
- `src/components/interview/InterviewNotesRail.tsx`
  - simplify and rebalance into support content instead of a decorative rail
- `src/components/interview/InterviewControlStrip.tsx`
  - make it a compact fallback phase chooser, not button-heavy primary UI
- `src/hooks/useShortcuts.ts`
  - correct shortcut defaults and displayed labels
- `src/components/SettingsOverlay.tsx`
  - reflect proper interview shortcut defaults and kill-switch behavior
- `src/index.css`
  - visual redesign, font stack, spacing, line alternating colors, thin borders

### Tests / Fixtures

- `electron/interview/__fixtures__/syntheticInterview.ts`
  - rename final phase and add follow-up scenarios
- `electron/interview/__fixtures__/screenAnalysisFixtures.ts`
  - add extraction-strip and follow-up delta cases
- `electron/interview/__fixtures__/goldenPayloads.ts`
  - update payload shape and expected section patches
- `electron/interview/__tests__/InterviewReplayHarness.test.ts`
  - validate full phase sequence including `p6_follow_up`
- `electron/interview/__tests__/InterviewDiffEngine.test.ts`
  - validate compact diff behavior
- `electron/interview/__tests__/InterviewMemoryLedger.test.ts`
  - validate phase document persistence and clarification queue
- `electron/interview/__tests__/InterviewKeybinds.test.ts`
  - validate corrected default states

---

## Expected New Files

These files are worth creating to keep the implementation clean and editable.

### Prompt / instruction files

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

### Backend support files

- `electron/interview/InterviewInstructionLoader.ts`
  - loads and assembles Markdown prompt files
- `electron/interview/InterviewMainDocComposer.ts`
  - applies patch operations to phase documents
- `electron/interview/InterviewClarifyPlanner.ts`
  - manages clarification queue replacement/retirement logic
- `electron/interview/InterviewPhaseDocumentStore.ts`
  - optional helper to isolate per-phase document persistence
- `electron/interview/generators/Phase6FollowUpGenerator.ts`
  - replaces closing behavior with follow-up behavior

### Frontend support files

- `src/components/interview/InterviewPhaseFlow.tsx`
  - top phase tracker
- `src/components/interview/InterviewMainAnchor.tsx`
  - fixed anchor subsection inside the main lane
- `src/components/interview/InterviewQuickAnswersPanel.tsx`
  - dedicated fast-response box
- `src/components/interview/InterviewExtractedTextPanel.tsx`
  - bottom screenshot-text strip
- `src/components/interview/InterviewUpdateIndicator.tsx`
  - updated/no-update status renderer

### Tests

- `electron/interview/__tests__/InterviewClarifyPlanner.test.ts`
- `electron/interview/__tests__/InterviewInstructionLoader.test.ts`
- `electron/interview/__tests__/InterviewMainDocComposer.test.ts`

---

## Implementation Phases

This is the recommended implementation order. Each phase is scoped to reduce breakage and keep testing straightforward.

## Phase 1. Naming, Prompt Ownership, and Flow Skeleton

Goal:

- correct the phase naming
- move prompt ownership into editable files
- establish the new final phase semantics

Checklist:

- [ ] Rename `p6_close` to `p6_follow_up` in backend and frontend type definitions
- [ ] Rename UI labels from `Close` / `Closing` to `Follow-up`
- [ ] Replace closing-generator semantics with follow-up semantics
- [ ] Create `electron/interview/instructions/`
- [ ] Add `index-interview.md`
- [ ] Add `global-output-rules.md`
- [ ] Add one phase file per active phase
- [ ] Add vision instruction files
- [ ] Build `InterviewInstructionLoader.ts`
- [ ] Reduce `InterviewPrompts.ts` to assembly logic
- [ ] Document instruction ownership inside `index-interview.md`

Subchecklist:

- [ ] Every phase has exactly one editable Markdown file
- [ ] There is exactly one global output rules file
- [ ] There is exactly one index file describing phase flow
- [ ] No hardcoded phase guidance remains as the primary authoring path

Test gates:

- [ ] Type-check prompt loading
- [ ] Verify each instruction file can be loaded without runtime failure
- [ ] Verify `p6_follow_up` is recognized everywhere `p6_close` used to be

## Phase 2. State Model and Document Persistence

Goal:

- make the system phase-document aware
- support fixed anchor blocks
- support extracted-text and update summaries

Checklist:

- [ ] Expand session snapshot types to include per-phase documents
- [ ] Add phase scroll persistence by phase, not just one global value
- [ ] Add extracted text summary structure
- [ ] Add update summary structure
- [ ] Add clarification queue structure
- [ ] Add active follow-up state
- [ ] Update ledger serialization and patch behavior
- [ ] Add `InterviewMainDocComposer.ts`

Subchecklist:

- [ ] Each phase can preserve its own main content
- [ ] Each phase can preserve its own scroll position
- [ ] A phase switch restores the prior phase document without regeneration
- [ ] `SYNC` can update extracted text without wiping the phase document

Test gates:

- [ ] Memory ledger tests cover multi-phase restore
- [ ] Composer tests cover append, replace, and no-update operations
- [ ] Snapshot shape stays in sync between backend and renderer

## Phase 3. Shortcut and Control Corrections

Goal:

- align controls with the intended operational model

Checklist:

- [ ] Disable `phase previous` by default
- [ ] Disable `phase next` by default
- [ ] Remove default accelerator from interview kill switch
- [ ] Keep scroll shortcuts enabled by default
- [ ] Remove `Cmd+Shift+I` from UI copy unless rebound by the user
- [ ] Update settings labels and descriptions
- [ ] Keep kill switch available in settings and UI state, but optional

Subchecklist:

- [ ] Default shortcuts match the intended product behavior
- [ ] Displayed labels match actual registered bindings
- [ ] Mouse-passthrough mode does not depend on clickable controls

Test gates:

- [ ] Keybind tests assert final default states
- [ ] Manual inspection confirms no stale `Cmd+Shift+I` hints remain

## Phase 4. UI Shell Redesign

Goal:

- redesign the overlay around the QA layout and `Uncodixfy` constraints

Checklist:

- [ ] Rebuild the top strip into a thin phase flow bar
- [ ] Add a dedicated update indicator
- [ ] Rebuild the main panel around:
  - [ ] fixed anchor block
  - [ ] scrollable numbered line list
  - [ ] alternating row styling
- [ ] Rebuild the right column around:
  - [ ] code panel
  - [ ] quick answers
  - [ ] compact notes/pins
- [ ] Add bottom extracted-text strip
- [ ] Remove hero panel styling
- [ ] Reduce border radii
- [ ] Reduce padding waste
- [ ] Update font stack and weights
- [ ] Adjust background scrim for light Google Doc readability
- [ ] Keep borders thin

Subchecklist:

- [ ] Main lane is visually dominant
- [ ] Code panel fits typical interview code without scroll in standard cases
- [ ] Quick answers are separate from the main lane
- [ ] Top-center area is not consumed by tall decorative UI
- [ ] No panel feels decorative-only

Test gates:

- [ ] Overlay renders at common laptop resolutions without overlap
- [ ] Overlay remains readable above a light document background
- [ ] Mouse-passthrough-on view still communicates controls clearly

## Phase 5. Clarify and Approach Intelligence

Goal:

- make the first two active phases stable, smart, and low-friction

Checklist:

- [ ] Build `InterviewClarifyPlanner.ts`
- [ ] Track clarification items with statuses
- [ ] Store write-template content in the fixed anchor block
- [ ] Generate full clarify pack on first `NEXT`
- [ ] Patch only future questions after new answers
- [ ] Promote clarified facts into memory ledger
- [ ] Generate full approach pack on first `NEXT`
- [ ] Patch only approach deltas on later `NEXT`

Subchecklist:

- [ ] Clarify asks only missing high-value questions
- [ ] Clarify avoids random filler questions
- [ ] Already answered questions are not re-suggested as active asks
- [ ] Approach does not fragment into multiple small chunks unless context changes

Test gates:

- [ ] Clarify planner test covers retire/replace behavior
- [ ] Replay harness verifies smooth handoff from clarify to approach

## Phase 6. Code, Test, and Follow-up Intelligence

Goal:

- complete the execution-heavy phases with the exact behaviors requested in QA

Checklist:

- [ ] Upgrade coding generator to emit full-code first packs
- [ ] Add blueprint comments for initial code scaffold
- [ ] Map narration lines to code regions
- [ ] Prefer diff payloads when changes happen midstream
- [ ] Tighten likely-mistake handling from screenshot analysis
- [ ] Upgrade testing generator to keep active dry run in main lane
- [ ] Replace active dry run when interviewer gives a new input
- [ ] Add `Phase6FollowUpGenerator.ts`
- [ ] Route code-change follow-ups through diff mode
- [ ] Route explain-this-part requests through fast answer + impacted region

Subchecklist:

- [ ] Entire standard Python solution is visible in the code area in normal interview cases
- [ ] Narration and code stay aligned
- [ ] Follow-up changes do not wipe the whole code panel unnecessarily
- [ ] Dry-run behavior is replace-current, not pile-up clutter

Test gates:

- [ ] Diff engine tests cover incremental change requests
- [ ] Replay harness covers code -> test -> follow-up
- [ ] Manual run verifies follow-up phase produces a diff instead of a closing script

## Phase 7. `SYNC`, Extraction Feedback, and Trust Signals

Goal:

- make screenshot analysis visibly useful and trustworthy

Checklist:

- [ ] Expand vision outputs to populate extracted-text summary
- [ ] Render extracted-text strip in the overlay
- [ ] Surface likely mistakes and new inputs cleanly
- [ ] Improve top update summary after `SYNC`
- [ ] Preserve old main content unless the screen context truly changes it
- [ ] Keep temporary phase control as fallback, not primary interaction

Subchecklist:

- [ ] User can tell what the screenshot produced
- [ ] User can tell whether `SYNC` changed anything
- [ ] Requirement changes become visible without rereading the whole screen

Test gates:

- [ ] Screen-analysis fixtures cover clarify, code, test, and follow-up cases
- [ ] `SYNC` updates extracted text without breaking the rest of the overlay

## Phase 8. QA, Replay, and Final Polish

Goal:

- lock the feature set with repeatable verification

Checklist:

- [ ] Update all fixtures for the final phase naming
- [ ] Add tests for instruction loading
- [ ] Add tests for clarify planning
- [ ] Add tests for main document composition
- [ ] Update replay harness expectations
- [ ] Add one end-to-end synthetic interview that exercises:
  - [ ] clarify
  - [ ] approach
  - [ ] code
  - [ ] test
  - [ ] follow-up diff
- [ ] Update docs to point to editable instruction files

Subchecklist:

- [ ] Tests cover the corrected shortcut defaults
- [ ] Tests cover phase restoration
- [ ] Tests cover no-update responses
- [ ] Tests cover extracted-text updates

Test gates:

- [ ] TypeScript type-check passes
- [ ] frontend build passes
- [ ] electron build passes
- [ ] interview tests pass
- [ ] manual smoke test passes on the real overlay

---

## Detailed QA Checklist

Use this as the final acceptance list for the whole correction pass.

### Phase naming and prompt ownership

- [ ] `Follow-up` is used everywhere instead of `Close`
- [ ] `index-interview.md` exists
- [ ] `global-output-rules.md` exists
- [ ] each phase instruction file exists
- [ ] vision instruction files exist
- [ ] the primary editable prompt text is no longer buried in TypeScript

### UI

- [ ] UI follows `Uncodixfy`
- [ ] no hero block remains
- [ ] no oversized rounded shells remain
- [ ] no decorative eyebrow labels remain
- [ ] main section is centered
- [ ] fixed anchor subsection exists inside main panel
- [ ] code section is on the right
- [ ] quick answers box exists
- [ ] top phase flow exists
- [ ] update indicator exists
- [ ] bottom extracted-text box exists
- [ ] line numbering exists in the main section
- [ ] alternating row colors exist in the main section
- [ ] thin borders are used
- [ ] font readability is improved
- [ ] overlay does not overly block the underlying light document

### Flow behavior

- [ ] first `NEXT` in a phase gives the majority of useful content
- [ ] later `NEXT` calls patch only what changed
- [ ] `No updates` feedback exists
- [ ] phase screens are stored independently
- [ ] switching phases restores saved content

### Clarify

- [ ] clarify uses a ranked question queue
- [ ] clarify can retire answered questions
- [ ] clarify can replace future stale questions
- [ ] write format stays visible in the fixed anchor block
- [ ] clarified answers are stored for later phases

### Approach

- [ ] approach loads in one strong first pass
- [ ] approach updates are targeted, not full rewrites

### Code

- [ ] full code loads into the code panel
- [ ] blueprint comments are present when needed
- [ ] narration is kept in the main section
- [ ] midstream code changes use diffs
- [ ] code panel spacing is compact

### Test

- [ ] dry run lives in the main section
- [ ] a new interviewer input replaces the active dry run cleanly

### Follow-up

- [ ] follow-up uses diffs when code changes are required
- [ ] follow-up main information stays in the main lane
- [ ] follow-up does not waste space on generic polite closing help

### Shortcuts and controls

- [ ] `Cmd+Enter` is the primary action
- [ ] `Cmd+Shift+Enter` is the sync action
- [ ] left/right phase stepping exists but is disabled by default
- [ ] up/down main scroll exists and is enabled by default
- [ ] kill switch exists but has no default hard-bound accelerator
- [ ] no stale `Cmd+Shift+I` copy remains unless user binds it

### Screen extraction

- [ ] extracted screenshot text is visible in a bottom strip
- [ ] requirement changes from screen analysis become visible
- [ ] dry-run input from screen analysis becomes visible
- [ ] likely mistakes from screen analysis become visible

### Reliability

- [ ] tests cover phase naming changes
- [ ] tests cover prompt loading
- [ ] tests cover clarify queue logic
- [ ] tests cover phase document persistence
- [ ] tests cover shortcut defaults
- [ ] replay harness covers the final phase sequence

---

## Change Request Routing Guide

Use this section later to decide which part of the system should be changed for a given request.

### If the request is about output wording or phase behavior

Start here:

- `electron/interview/instructions/global-output-rules.md`
- `electron/interview/instructions/phase-*.md`
- `electron/interview/instructions/index-interview.md`

### If the request is about when the phase changes or what phase is selected

Start here:

- `electron/interview/InterviewPhaseRouter.ts`
- `electron/interview/InterviewOrchestrator.ts`

### If the request is about content being appended, replaced, or preserved

Start here:

- `electron/interview/InterviewMainDocComposer.ts`
- `electron/interview/InterviewMemoryLedger.ts`

### If the request is about question replacement in clarify

Start here:

- `electron/interview/InterviewClarifyPlanner.ts`
- `electron/interview/generators/Phase2ClarificationGenerator.ts`

### If the request is about code view, diffs, or visible typing help

Start here:

- `src/components/interview/InterviewCodePanel.tsx`
- `electron/interview/InterviewDiffEngine.ts`
- `electron/interview/generators/Phase4CodingGenerator.ts`
- `electron/interview/generators/Phase6FollowUpGenerator.ts`

### If the request is about top status, phase flow, or update/no-update feedback

Start here:

- `src/components/interview/InterviewTopStrip.tsx`
- `src/components/interview/InterviewPhaseFlow.tsx`
- `src/components/interview/InterviewUpdateIndicator.tsx`

### If the request is about quick answers, notes, or pinned facts

Start here:

- `src/components/interview/InterviewQuickAnswersPanel.tsx`
- `src/components/interview/InterviewNotesRail.tsx`

### If the request is about screenshot extraction

Start here:

- `electron/interview/InterviewVisionSync.ts`
- `electron/interview/instructions/vision-*.md`
- `src/components/interview/InterviewExtractedTextPanel.tsx`

### If the request is about shortcuts or kill switch behavior

Start here:

- `electron/services/KeybindManager.ts`
- `src/hooks/useShortcuts.ts`
- `src/components/SettingsOverlay.tsx`

---

## Final Outcome We Are Aiming For

When this plan is completed, interview mode should behave like this:

- the user mostly presses `Cmd+Enter`
- the first generation in each phase gives them nearly everything they need
- updates patch only the parts that actually changed
- the main lane stays readable and phase-specific
- the right side helps without stealing attention
- `SYNC` visibly proves what it extracted
- follow-ups behave like rapid practical help, not like a generic wrap-up assistant
- the user can edit output behavior from Markdown instruction files instead of hunting through code

That is the final target for this correction pass.
