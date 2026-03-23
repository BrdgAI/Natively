# Natively Interview Mode Plan v3

> Author: Codex
> Date: March 23, 2026
> Inputs reviewed:
> - `Docs-TEMP/Interview/Direct instructions/interview-flow-summarized.md`
> - `Docs-TEMP/Interview/Mock Interview/Mock Interview - 45m - Sonnet4.6 .md`
> - `Docs-TEMP/Interview/Mock Interview/Mock Interview - 45m - deep research - Gemini.md`
> - `Docs-TEMP/Interview/Prep-Textbook/02-constraint-writing-and-problem-framing.md`
> - `Docs-TEMP/Interview/Prep-Textbook/03-technical-code-reference.md`
> - `Docs-TEMP/Interview/Prep-Textbook/06-safe-phrases-and-recovery-scripts.md`
> - `Docs-TEMP/Interview/Prep-Textbook/07-dry-run-and-testing-language.md`
> - `Docs-TEMP/Natively/research2.md`
> - current overlay, shortcut, window, screenshot, session, and IPC code

## Goal

Turn Natively into a dedicated interview overlay that behaves like a silent teleprompter for technical interviews:

- it keeps full interview context
- it knows the current phase
- it gives the user exact words to say
- it gives the user exact things to type
- it keeps side notes for what to think, not just what to speak
- it handles follow-up changes, bug fixes, and code explanations without forcing the user to improvise
- it does all of this with very few shortcuts and very low latency

The strict product assumption for this plan is:

- the user may know very little
- the user may read directly from the overlay
- the output must be natural enough to say aloud
- the output must be structured enough to survive pressure

## Honest Confidence

We can be highly confident implementing this inside the current ecosystem with relatively low integration risk because the repo already has:

- live meeting lifecycle
- streaming STT
- multiple LLM providers
- screenshot capture and image analysis
- global shortcuts
- a stealth overlay window
- transcript/session tracking

What we cannot honestly guarantee:

- interview success
- zero hallucinations
- perfect phase detection in every interviewer style
- perfect screenshot extraction from every screen layout

So the right promise is:

- high confidence in implementation
- high confidence in reducing user stress and improving structure
- high confidence in better coding and explanation support
- no fake guarantee on outcome

## Freeze These Decisions Now

These should be treated as the product rules for v1.

### 1. Build a real interview mode, not a prompt tweak

Interview mode should be a first-class mode with:

- its own shortcuts
- its own overlay layout
- its own prompts
- its own state model
- its own update semantics

Do not try to force this into the current generic meeting chat flow.

### 2. Keep 2 primary shortcuts, with optional advanced controls available

Use:

| Shortcut | Name | Purpose |
|---|---|---|
| `Cmd+Enter` | `NEXT` | Main key. Safe to spam. Reveal the best next script or advance the buffered flow. |
| `Cmd+Shift+Enter` | `SYNC` | Screenshot sync when screen context matters. Also opens the fallback control path. |

Keep these as the primary flow.

Also keep optional advanced interview keybinds available in the keybind system:

| Shortcut | Name | Purpose | Default state |
|---|---|---|---|
| `Cmd+Shift+Left` | `PHASE PREV` | Move to previous interview phase override | Disabled |
| `Cmd+Shift+Right` | `PHASE NEXT` | Move to next interview phase override | Disabled |
| `Cmd+Shift+Up` | `SCROLL UP` | Scroll the main interview panel upward | Enabled |
| `Cmd+Shift+Down` | `SCROLL DOWN` | Scroll the main interview panel downward | Enabled |

This keeps the default mental model simple while preserving expansion room.

### 3. `Cmd+Enter` should be the primary repeated action

This matches the user's constraint and should drive the whole interaction model.

`Cmd+Enter` should do one of 3 things depending on state:

1. reveal a pre-generated script immediately
2. regenerate the current phase if new transcript/screenshot context arrived
3. advance to the next buffered chunk if nothing material changed

This lets the user spam one key without needing to think about modes.

### 4. Do not capture a screenshot on every trigger

Preferred policy:

- transcript-first by default
- screenshot only on explicit `Cmd+Shift+Enter`
- force screenshot only when screen context is clearly required and stale

Examples where screenshot is required:

- fresh coding phase with no code snapshot yet
- interviewer asks for a change to code already typed
- interviewer points to a specific bug on screen
- interviewer gives a concrete dry-run input in the doc

Reason:

- lower latency
- lower cost
- fewer stale images
- less accidental capture churn

### 5. Phase 2 should use a two-step trigger pattern

This is the preferred behavior for "problem reception and clarification":

1. user presses `Cmd+Enter` as soon as the problem is visible
2. system prewarms clarification questions, constraints scaffold, and example template
3. user presses `Cmd+Enter` again after the interviewer finishes the verbal clarifications or pauses for a reply
4. system regenerates from the fuller requirement set

This is better than waiting until everything is over, because:

- it reduces first-response latency
- it lets us prepare structure immediately
- it still allows regeneration after new requirements land

So the guidance is:

- press early to prewarm
- press again after important verbal updates

### 6. Do not fully overwrite the overlay on every trigger

Each panel should follow stable replacement rules:

- `Speak Now`: replace with the newest phase script
- `Write Now`: replace only when the typed artifact changes
- `Code`: keep sticky until a newer version or diff exists
- `Thought Notes`: append and pin only the highest-signal notes
- `Quick Questions`: short-lived queue, auto-expire or get retired on next major update

This avoids the "everything moved" feeling while the user is actively reading and typing.

### 7. Keep the main panel scrollable

The main interview panel should stay scrollable so we can dump more content into one continuous reading lane when needed.

Rules:

- scrolling applies to the main content lane only
- code panel stays sticky
- top strip stays fixed
- side notes stay fixed or semi-sticky
- keyboard scrolling should work even when mouse passthrough is on

Use:

- `Cmd+Shift+Up` to scroll up
- `Cmd+Shift+Down` to scroll down

### 8. Full-screen overlay, top-centered reading lane

Interview mode should use a dedicated full-screen overlay layout:

- whole screen window
- transparent shell
- mouse passthrough on by default
- content visually anchored near top-center
- enough transparency that the doc/editor underneath remains readable

### 9. Manual phase override must exist in two forms

Form 1:

- `Cmd+Shift+Enter` fallback control path

Form 2:

- optional direct phase navigation shortcuts

This gives us both a simple default path and a faster power-user path.

### 10. Interview mode needs a kill switch

We need an explicit escape path that leaves interview mode immediately without forcing the user to end the meeting.

Kill switch behavior:

- exit interview orchestration
- hide interview-specific overlay sections
- return to standard overlay or launcher mode
- preserve the active meeting/transcript unless the user separately ends the meeting

Implementation rule:

- expose a visible `Exit Interview Mode` control in launcher/settings
- expose a bindable `kill switch` action in the keybind registry
- do not hardcode a default kill-switch shortcut yet

### 11. `Cmd+Shift+Enter` remains the fallback control path

Use `Cmd+Shift+Enter` as the fallback control path:

- single press: screen sync
- after sync, a compact control strip appears for ~2 seconds
- pressing `Cmd+Shift+Enter` again during that window cycles the phase override:
  - `Clarify`
  - `Approach`
  - `Code`
  - `Test`
  - `Close`
- next `Cmd+Enter` generates for the selected phase

This gives manual orchestration without introducing a separate "phase key".

### 12. Do not hardcode model choices in this plan

Model choice should come from the dashboard/settings the user controls at runtime.

Implementation rule:

- interview mode reads the active text, vision, and STT provider choices from settings
- interview mode may support interview-specific preferences, but should not freeze model names in the plan
- optimization should stay capability-based rather than model-name-based

So for this feature set:

- no hardcoded primary text model
- no hardcoded vision model
- no hardcoded STT model
- only capability requirements:
  - low latency
  - strong coding quality
  - reliable screenshot understanding
  - strong transcription quality

## Product Output Contract

Interview mode should not return a generic chat blob. It should return a structured payload the renderer can place into stable sections.

Suggested shape:

```ts
type InterviewOverlayPayload = {
  phase: "p2" | "p3" | "p4" | "p5" | "p6";
  phaseConfidence: number;
  manualOverrideActive: boolean;
  speakNow: string[];
  speakIfAsked: string[];
  writeNow: string[];
  thoughtNotes: string[];
  quickQuestions: string[];
  codePanel?: {
    language: "python" | "unknown";
    mode: "skeleton" | "full" | "diff" | "trace" | "debug";
    content: string;
    narration: string[];
    suspectedMistakes?: string[];
  };
  pinnedFacts: string[];
  changes: Array<{
    label: string;
    detail: string;
    severity: "new" | "updated" | "warning";
  }>;
  freshness: {
    transcriptUpdatedMsAgo: number;
    screenshotUpdatedMsAgo: number | null;
    generatedMsAgo: number;
  };
};
```

This matters because the user needs 4 distinct kinds of help:

- what to say now
- what to type now
- what to think silently
- what changed since last time

## Detailed User Flow

## Pre-interview

1. User opens Natively and selects `Interview Mode`.
2. Launcher shows an interview-specific start surface, not the generic meeting controls.
3. User confirms:
   - coding language default: Python
   - text model from dashboard
   - vision model from dashboard
   - STT provider from dashboard
4. App applies the interview preset:
   - full-screen overlay
   - mouse passthrough on
   - only interview shortcuts enabled
   - optional advanced phase-navigation shortcuts available in keybind settings
   - main-panel scroll shortcuts active
   - transcript capture on
   - prefetch enabled

## Phase 1: Introduction

Per the user's request, we do not need to build a new intro generation feature for v1.

What we still do:

- track elapsed time
- capture interviewer intro/team hints into memory
- stay ready for the jump into Phase 2

## Phase 2: Problem reception and clarification

1. Problem appears on screen or starts being spoken.
2. User presses `Cmd+Enter`.
3. App prewarms:
   - restatement scaffold
   - top clarification questions in priority order
   - constraint block template
   - one example trace template
4. Interviewer continues explaining verbally.
5. User presses `Cmd+Enter` again when the interviewer pauses.
6. App updates only the dynamic parts:
   - confirmed facts
   - open questions
   - better questions to ask next
   - written constraints and example
   - longer content stays in the same scrollable main lane
7. If the user missed something on screen, they press `Cmd+Shift+Enter`.
8. App extracts the problem statement from screenshot and reconciles it with transcript.

What the user sees:

- main center: exact clarification lines to say
- write panel: exact constraint comments to type
- thought notes: what they are still missing
- quick questions: short one-shot follow-up prompts

## Phase 3: Approach discussion

1. Phase router moves from `Clarify` to `Approach` automatically, or user forces it through the control strip.
2. On `Cmd+Enter`, the app generates:
   - short restatement of the chosen pattern
   - brute-force baseline
   - optimized approach
   - why this is the right tradeoff
   - time and space complexity lines
   - "alignment ask" line before coding
3. If interviewer adds a hint or changes a definition, next `Cmd+Enter` regenerates the approach pack instead of moving forward blindly.

What the user sees:

- `Speak Now`: exact natural narration
- `Write Now`: optional bullets or complexity notes to type
- `Thought Notes`: pattern recognition cues and rescue lines

## Phase 4: Coding

1. User enters coding mode.
2. If there is no recent code screenshot, the app asks for `Cmd+Shift+Enter` in a subtle banner.
3. Vision sync extracts the current code or blank editor state.
4. `Cmd+Enter` gives:
   - function skeleton
   - narrated code blocks
   - comment-guided implementation
   - top-down structure first
5. Repeated `Cmd+Enter` advances through buffered coding chunks if no new delta exists.
6. The main content lane stays scrollable so earlier reasoning and narration remain available without paging.
7. If the interviewer changes the requirement:
   - user presses `Cmd+Shift+Enter`
   - app extracts current on-screen code
   - diff engine compares old plan vs new requirement
   - next `Cmd+Enter` gives:
     - code diff
     - narration of what changed
     - the exact line-level talking points
8. If the interviewer asks "explain this part":
   - screenshot sync + code region extraction
   - next `Cmd+Enter` gives localized explanation
9. If the user typed something wrong:
   - screenshot sync extracts code
   - static checker heuristics + LLM bug finder identify likely mistake
   - code panel highlights "likely issue here"

What the user sees:

- main center: code narration the user can read aloud
- code panel: sticky code or diff
- thought notes: silent reasoning and bug reminders
- quick questions: short answers for interviewer interruptions

## Phase 5: Testing, edge cases, and complexity

1. User presses `Cmd+Enter` after code is mostly done.
2. App produces:
   - dry run script
   - edge case checklist
   - complexity explanation
   - bug-risk checklist
3. If interviewer gives a fresh test input, user presses `Cmd+Shift+Enter`.
4. Screenshot sync extracts the new input and updates only the dry-run panel.
5. If the testing content is long, the user scrolls the main lane with `Cmd+Shift+Up` and `Cmd+Shift+Down`.

## Phase 6: Closing and follow-up

1. App keeps the final context of:
   - chosen approach
   - final code state
   - unresolved follow-up changes
   - interviewer/team details from earlier
2. On `Cmd+Enter`, app produces:
   - short answer to a final change request
   - closing explanation line
   - quick question to ask the interviewer if there is time
3. If the user wants out of interview mode, they use the kill switch and fall back to standard mode without losing the active meeting.

## Feature List In Implementation Order

## Feature 1 - Interview Mode Shell And Safe Presets

### Objective

Create a dedicated interview session type that swaps the app into interview-specific behavior from the moment the meeting starts.

### User-facing behavior

- launcher gets `Interview Mode`
- interview mode uses full-screen overlay
- interview mode reduces shortcuts to 2 public actions
- interview mode exposes optional phase-navigation shortcuts in keybind settings
- interview mode exposes main-panel scroll shortcuts
- interview mode defaults to Python for coding
- interview mode includes a kill switch out of the mode
- interview mode reads active model/provider choices from dashboard settings

### Technical implementation

- extend meeting/session metadata with:
  - `sessionType: "general" | "interview"`
  - `interviewLanguage: "python"`
  - `preferredInterviewProfileId` or equivalent settings reference
- store interview defaults in settings
- branch overlay rendering by `sessionType`
- branch shortcut registration/preset by `sessionType`
- add a kill-switch action to leave interview mode safely
- add optional phase-nav keybind entries
- add main-panel scroll keybind entries
- read active provider/model choices from settings instead of freezing them here

### Files likely touched

- `src/components/Launcher.tsx`
- `src/components/SettingsOverlay.tsx`
- `src/components/settings/AIProvidersSettings.tsx`
- `src/utils/modelUtils.ts`
- `src/hooks/useShortcuts.ts`
- `electron/main.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `electron/services/SettingsManager.ts`
- `electron/services/CredentialsManager.ts`
- `electron/services/KeybindManager.ts`
- `electron/LLMHelper.ts`
- `src/types/electron.d.ts`

### Confidence

Very high.

---

## Feature 2 - Structured Interview Memory Ledger

### Objective

Add a structured state store for interview facts so we stop depending on a short rolling transcript alone.

### Why it matters

The user needs continuity across all phases:

- problem statement
- clarifications asked and answered
- constraints
- examples
- chosen approach
- code versions
- follow-up changes
- final dry run and complexity story

### Technical implementation

Create a new main-process interview domain:

- `electron/interview/types.ts`
- `electron/interview/InterviewMemoryLedger.ts`

Ledger fields should include:

- phase and phase confidence
- manual phase override
- confirmed problem statement
- open questions
- answered clarifications
- constraints block
- example traces
- chosen approach
- complexity notes
- latest code snapshot
- latest code narration pack
- screenshot freshness
- main-panel scroll position
- quick-question queue
- pinned thought notes
- change history

The ledger should be updated by:

- transcript events from `SessionTracker`
- screenshot extraction results
- manual phase override events
- generator outputs

### Files likely touched

- `electron/SessionTracker.ts`
- `electron/IntelligenceManager.ts`
- `electron/main.ts`
- `electron/interview/types.ts` new
- `electron/interview/InterviewMemoryLedger.ts` new

### Confidence

High.

---

## Feature 3 - Phase Router And Event Extractor

### Objective

Determine where the interview is right now without paying frontier-model latency on every transcript chunk.

### Technical strategy

Use:

- deterministic phase rules first
- manual override second
- LLM tie-break only when confidence is low

Signals:

- elapsed time
- transcript keywords
- whether a problem is confirmed
- whether an approach is confirmed
- whether code exists
- whether dry-run language starts appearing
- whether closing language starts appearing
- whether the user manually forced a phase

Suggested phase set:

- `p2_clarify`
- `p3_approach`
- `p4_code`
- `p5_test`
- `p6_close`

Phase 1 does not need a generator, but the router should still understand it internally.

### Manual override behavior

The `SYNC` control strip can temporarily force a phase. That override should:

- expire automatically after a successful generation in the forced phase
- remain visible so the user knows the app is in manual mode

Also support optional direct phase movement:

- `Cmd+Shift+Left` -> previous phase
- `Cmd+Shift+Right` -> next phase

These should be keybind-managed and disabled by default until enabled by the user.

### Files likely touched

- `electron/interview/InterviewPhaseRouter.ts` new
- `electron/interview/InterviewMemoryLedger.ts`
- `electron/main.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`

### Confidence

High.

---

## Feature 4 - Interview Orchestrator, Prefetch Buffer, And `NEXT` / `SYNC` Semantics

### Objective

Make the keyboard flow feel instant, stable, and predictable.

### `Cmd+Enter` semantics

`NEXT` should:

- serve buffered content instantly if valid
- regenerate if new transcript/screenshot deltas matter
- advance to the next buffered chunk if nothing new happened

### `Cmd+Shift+Enter` semantics

`SYNC` should:

- capture screen
- extract problem/code/test-input state depending on phase
- update freshness state
- open the compact control strip for optional manual phase cycling

### Buffer policy

Prefetch should maintain:

- current phase card set
- next likely card set
- follow-up rescue line set

The buffer should invalidate only when relevant deltas arrive, not on every transcript token.

### Spam behavior rule

If the user presses `NEXT` repeatedly and no meaningful delta exists:

- do not call the model again immediately
- move from `primary script` -> `expanded script` -> `rescue lines` -> `write-now checklist`

This gives the user more material without wasting latency.

Also support:

- direct main-lane scroll with `Cmd+Shift+Up/Down`
- direct phase stepping with `Cmd+Shift+Left/Right` when enabled
- a kill-switch action that routes back to standard mode

### Files likely touched

- `electron/interview/InterviewOrchestrator.ts` new
- `electron/interview/InterviewPrefetchBuffer.ts` new
- `electron/main.ts`
- `electron/services/KeybindManager.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`

### Confidence

High.

---

## Feature 5 - Vision Sync, Code Extraction, And Diff Engine

### Objective

Handle the moments where transcript is not enough:

- pasted problem statements
- existing code on screen
- requirement changes
- interviewer points to a specific bug
- dry-run inputs provided in the doc

### Technical implementation

Create a vision pipeline that can run phase-specific extraction prompts:

- `extractProblemFromScreenshot`
- `extractCodeFromScreenshot`
- `extractDryRunInputFromScreenshot`
- `extractVisibleInterviewerHintFromScreenshot`

Then add a small line-based diff utility:

- compare current extracted code vs previous extracted code
- compare current requirement set vs previous requirement set
- label changed regions

This unlocks:

- "what changed"
- "say this while you patch it"
- "this is probably where your bug is"

### Important implementation note

Do not replace the existing screenshot subsystem.

Reuse:

- `electron/ScreenshotHelper.ts`
- `electron/ProcessingHelper.ts`
- `electron/LLMHelper.ts`

Add interview-specific structured extraction methods on top.

### Files likely touched

- `electron/ScreenshotHelper.ts`
- `electron/ProcessingHelper.ts`
- `electron/LLMHelper.ts`
- `electron/interview/InterviewVisionSync.ts` new
- `electron/interview/InterviewDiffEngine.ts` new
- `electron/interview/InterviewPrompts.ts` new

### Confidence

Medium-high.

Main risks:

- OCR/vision ambiguity on some fonts/layouts
- screenshot freshness mistakes if user forgets to sync

Both are manageable with freshness indicators and explicit `SYNC`.

---

## Feature 6 - Phase 2 Clarification Engine

### Objective

Help the user sound structured during the most skipped and most important phase.

### Output behavior

The engine should produce, in order:

1. short problem restatement
2. highest-priority missing clarification questions
3. verbose natural versions of those same questions
4. exact constraint block to type
5. one example trace template
6. rescue lines if the user gets confused

### Important product rule

Questions must be ordered by:

- importance
- clarity
- relevance to the likely solution path

Do not dump 10 random questions.

### Files likely touched

- `electron/interview/generators/Phase2ClarificationGenerator.ts` new
- `electron/interview/InterviewPrompts.ts`
- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/InterviewMemoryLedger.ts`

### Confidence

Very high.

---

## Feature 7 - Phase 3 Approach Pack Generator

### Objective

Give the user a complete natural narration path from brute force to chosen solution.

### Output behavior

The generator should produce:

- what pattern this looks like
- brute-force line
- why brute force is too slow
- optimized approach
- key data structures
- time/space complexity
- alignment ask before coding
- rescue line if interviewer challenges the plan

This should be delivered in one shot unless a new requirement lands.

### Files likely touched

- `electron/interview/generators/Phase3ApproachGenerator.ts` new
- `electron/interview/InterviewPrompts.ts`
- `electron/interview/InterviewOrchestrator.ts`

### Confidence

Very high.

---

## Feature 8 - Phase 4 Coding Narrator And Change Copilot

### Objective

Make the coding phase usable for someone who is actively typing from the overlay.

### Output behavior

The coding generator should produce:

- Python-first skeleton unless language says otherwise
- top-down structure first
- comments that are helpful to say aloud
- narration lines paired to code chunks
- sticky code panel with versioning

It also needs 3 specialized follow-up modes:

1. `requirement change mode`
   - deliver diff + narration of the change
2. `explain this code mode`
   - explain the specific on-screen region
3. `debug my typed code mode`
   - compare extracted code vs intended solution and call out likely mistakes

### Strong recommendation

Keep the code comments intentionally speakable.

The user should be able to read the comments as their narrative, not just use them as internal notes.

### Files likely touched

- `electron/interview/generators/Phase4CodingGenerator.ts` new
- `electron/interview/InterviewDiffEngine.ts`
- `electron/interview/InterviewVisionSync.ts`
- `electron/LLMHelper.ts`

### Confidence

Medium-high.

Main risk is screenshot quality during live coding, not basic architecture.

---

## Feature 9 - Phase 5 And 6 Testing, Complexity, Follow-up Change, And Closing Engine

### Objective

Complete the second half of the interview so the user is not abandoned after the first draft of the code.

### Output behavior

The generator should produce:

- dry-run script
- step-by-step state changes
- edge case checklist
- complexity explanation
- "I found this bug" repair narration
- quick answer to follow-up changes
- closing question if time remains

### Files likely touched

- `electron/interview/generators/Phase5TestingGenerator.ts` new
- `electron/interview/generators/Phase6ClosingGenerator.ts` new
- `electron/interview/InterviewPrompts.ts`
- `electron/interview/InterviewOrchestrator.ts`

### Confidence

High.

---

## Feature 10 - Dedicated Interview Overlay UI

### Objective

Replace the current chat-shaped overlay behavior with a phase-shaped interview reading surface.

### Layout

Use 4 stable regions:

1. `Top Strip`
   - phase
   - confidence
   - freshness
   - manual override state
   - model badges

2. `Main Center`
   - the current phase script
   - biggest text
   - top-centered
   - no unnecessary chrome
   - vertically scrollable

3. `Code Panel`
   - sticky
   - compact but readable
   - syntax highlighting optional, readability first

4. `Side Notes Rail`
   - thought notes
   - pinned facts
   - quick interviewer interruptions

### UI rules

- transparent enough to keep the underlying doc visible
- dark/black text priority as requested
- massive content without large empty decorative blocks
- do not feel like a generic chatbot
- stable sections, not jumpy cards
- highlight only the changed region when content updates
- main lane must support keyboard scrolling
- kill-switch state should be available in the interview UI model

### Implementation approach

Do not stuff this into the existing `NativelyInterface.tsx` logic.

Safer path:

- keep current overlay for general mode
- add a dedicated interview renderer tree under `src/components/interview/`
- branch in `src/App.tsx` based on session type

### Files likely touched

- `src/App.tsx`
- `src/index.css`
- `src/components/NativelyInterface.tsx`
- `src/components/interview/InterviewOverlay.tsx` new
- `src/components/interview/InterviewTopStrip.tsx` new
- `src/components/interview/InterviewMainPanel.tsx` new
- `src/components/interview/InterviewCodePanel.tsx` new
- `src/components/interview/InterviewNotesRail.tsx` new
- `src/components/interview/InterviewControlStrip.tsx` new
- `src/lib/overlayAppearance.ts`
- `electron/WindowHelper.ts`

### Confidence

High.

---

## Feature 11 - Reliability, Latency, Replay Harness, And Release Guardrails

### Objective

Ship with confidence instead of assuming live interviews are the test environment.

### What to build

- transcript replay harness
- screenshot replay fixtures
- golden payload snapshots for each phase
- latency instrumentation for:
  - trigger to first token
  - screenshot to extraction result
  - regeneration after delta
- stale-content detection
- "freshness" badges in UI
- keybind regression checks for:
  - `Cmd+Enter`
  - `Cmd+Shift+Enter`
  - `Cmd+Shift+Left`
  - `Cmd+Shift+Right`
  - `Cmd+Shift+Up`
  - `Cmd+Shift+Down`
  - kill-switch routing

### Test fixtures to use immediately

- the two mock interviews already in `Docs-TEMP/Interview/Mock Interview/`
- synthetic phase transition transcripts
- screenshots from shared-doc coding scenarios

### Files likely touched

- `electron/interview/__fixtures__/` new
- `electron/interview/__tests__/` new
- `electron/verboseLog.ts`
- `src/lib/analytics/analytics.service.ts`
- `electron/interview/InterviewOrchestrator.ts`

### Confidence

High.

## Not Too Technical Implementation Plan

This is the simplest sane way to build it.

### Pass 1 - Put the app into interview mode

Add the mode toggle, add the kill switch, and make the overlay full-screen with the 2 primary interview shortcuts plus the optional advanced navigation bindings.

### Pass 2 - Teach the app what the interview currently knows

Build the memory ledger so the app can remember:

- the problem
- the clarifications
- the current plan
- the current code
- the current phase

### Pass 3 - Make the shortcuts smart

Implement `NEXT` and `SYNC` so:

- `NEXT` is fast and repeatable
- `SYNC` refreshes screen context and doubles as fallback control
- optional phase-nav shortcuts can be enabled
- main-panel scroll shortcuts work reliably

### Pass 4 - Build the generators in interview order

Start with:

1. clarification
2. approach
3. coding
4. testing and closing

This gives usable value early and keeps the project shippable even if later polish takes longer.

### Pass 5 - Replace the overlay UI

Move from a chat panel to a stable interview layout with:

- speak now
- write now
- code
- thought notes
- quick questions

### Pass 6 - Harden it

Run replay tests against the mock interview scripts and screenshot fixtures until the output feels stable and predictable.

## Files Most Likely To Be Touched

## Existing files

- `electron/main.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `electron/WindowHelper.ts`
- `electron/LLMHelper.ts`
- `electron/ProcessingHelper.ts`
- `electron/ScreenshotHelper.ts`
- `electron/IntelligenceManager.ts`
- `electron/SessionTracker.ts`
- `electron/services/KeybindManager.ts`
- `electron/services/SettingsManager.ts`
- `electron/services/CredentialsManager.ts`
- `src/App.tsx`
- `src/index.css`
- `src/components/Launcher.tsx`
- `src/components/SettingsOverlay.tsx`
- `src/components/settings/AIProvidersSettings.tsx`
- `src/components/NativelyInterface.tsx`
- `src/hooks/useShortcuts.ts`
- `src/utils/modelUtils.ts`
- `src/lib/overlayAppearance.ts`
- `src/types/electron.d.ts`

## New files

- `electron/interview/types.ts`
- `electron/interview/InterviewMemoryLedger.ts`
- `electron/interview/InterviewPhaseRouter.ts`
- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/InterviewPrefetchBuffer.ts`
- `electron/interview/InterviewVisionSync.ts`
- `electron/interview/InterviewDiffEngine.ts`
- `electron/interview/InterviewPrompts.ts`
- `electron/interview/generators/Phase2ClarificationGenerator.ts`
- `electron/interview/generators/Phase3ApproachGenerator.ts`
- `electron/interview/generators/Phase4CodingGenerator.ts`
- `electron/interview/generators/Phase5TestingGenerator.ts`
- `electron/interview/generators/Phase6ClosingGenerator.ts`
- `src/components/interview/InterviewOverlay.tsx`
- `src/components/interview/InterviewTopStrip.tsx`
- `src/components/interview/InterviewMainPanel.tsx`
- `src/components/interview/InterviewCodePanel.tsx`
- `src/components/interview/InterviewNotesRail.tsx`
- `src/components/interview/InterviewControlStrip.tsx`

## What Not To Build In V1

- no automatic typing into the interview doc
- no browser extension
- no sprawling shortcut matrix beyond the primary flow plus a few navigation helpers
- no always-on screenshot capture
- no unbounded freeform UI that makes the user hunt for content
- no major DB migration
- no attempt to solve Phase 1 with complex behavioral coaching

Clarification:

- we are allowing a few additional navigation shortcuts now
- but the primary interaction model still centers on `NEXT` and `SYNC`

## Bottom Line

The best version of this product is not "AI gives an answer."

It is:

- the app knows the interview phase
- the app keeps the right context alive
- the app gives exact speakable lines
- the app gives exact writable scaffolds
- the app keeps code, changes, and side-thoughts separated
- the app stays fast because `NEXT` is buffered and `SYNC` is explicit

If we implement the features above in this exact order, we get a concentrated interview system that fits the current Natively architecture without a ground-up rewrite, while still being robust enough for real coding interviews.
