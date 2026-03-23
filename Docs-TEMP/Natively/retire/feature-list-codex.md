# Natively Interview Copilot — Concentrated Feature Plan

> Author: Codex  
> Date: March 22, 2026  
> Inputs: `Docs-TEMP/Interview/Direct instructions/interview-flow-summarized.md`, mock interview transcripts, prep textbook sections, and `Docs-TEMP/Natively/research2.md`

## Goal

Turn Natively into a focused technical interview copilot that behaves like a silent teleprompter:

- it is always listening
- it keeps full interview context
- it understands which phase the interview is currently in
- it prepares the next best thing the candidate should say
- it shows that output only when the user triggers a shortcut
- it does this with minimal UI/shortcut complexity and minimal code churn to the current product

The user assumption for this plan is strict:

- the user may not know what to say at all
- the user is reading directly from the overlay
- the user should not need to explicitly ask the app what they want
- the app should infer what is needed from transcript + screenshot + phase state

## Truthful Confidence

We can be highly confident implementing this plan with relatively low integration risk because the current app already has:

- a global keybind system
- live meeting lifecycle and transcript capture
- multiple STT providers
- multiple LLM providers with streaming
- screenshot capture and image analysis
- a transparent overlay window
- session transcript tracking and context compaction

What we cannot honestly guarantee:

- a 100% interview success rate
- zero LLM mistakes
- perfect phase inference in every interviewer style

So this plan is designed around bounded failure modes, freshness indicators, deterministic state tracking, and clear fallbacks rather than fake guarantees.

## Freeze These Decisions Now

These should be treated as product constraints for v1.

### 1. Dedicated interview mode, not a lightly tweaked general meeting mode

Interview mode should be a first-class mode with its own orchestration, prompts, overlay UI, and shortcut semantics.

Reason:

- the current general intelligence modes are reactive and chat-shaped
- interview support is phase-shaped and script-shaped
- mixing both in one prompt/UI will increase errors and latency

### 2. Only 2 user-facing shortcuts in interview mode

Ship only these:

| Shortcut | Working name | Purpose |
|---|---|---|
| `K1` | `NEXT SCRIPT` | Show or refresh the best next thing to say right now |
| `K2` | `SCREEN SYNC` | Capture the current screen and refresh problem/code/changes state |

No third interview shortcut in v1.

Reason:

- stealth risk goes up with every additional keybind
- users under interview pressure will forget more than 2 actions
- nearly all value can be covered with one “give me what to say” action plus one “update screen context” action

### 3. Full-screen transparent overlay in interview mode

Interview mode overlay should use the whole monitor if needed:

- fully transparent shell
- permanently always-on-top during interview mode
- mouse passthrough forced on by default
- no clickable controls required during the round

Reason:

- the user is reading, not interacting
- full-screen space lets us separate script, notes, code, diffs, and dry-run data without crowding

### 4. The app works proactively, but reveals on demand

Background processing should run continuously, but visible updates should be shown only on shortcut trigger.

Reason:

- best latency comes from precomputation
- best stealth comes from revealing only when requested

### 5. Structured memory must be the source of truth

Do not rely on a rolling 120-second transcript window alone.

We need durable structured state for:

- interviewer intro and social cues
- problem statement
- clarifications answered
- assumptions still open
- chosen approach
- current code snapshot
- dry-run examples
- follow-up changes
- final recap/closing questions

## Recommended Runtime Stack

These are the safest current defaults for this interview-specific flow as of March 22, 2026.

### STT

- Primary: Deepgram streaming STT with `nova-3`

Why:

- already integrated in `electron/audio/DeepgramStreamingSTT.ts`
- already configured for streaming use
- supports low-latency live transcription
- strong fit for technical vocabulary

### Main text generation

- Primary: OpenAI `gpt-5.4`

Why:

- current repo already has OpenAI wired in `electron/LLMHelper.ts`
- strongest fit for coding + reasoning + long-context response composition
- good choice for “exact next script” plus “code-aware change explanation”

### Vision extraction

- Primary: Google `gemini-2.5-flash`

Why:

- strong multimodal extraction
- low-latency price/performance
- good fit for screenshot parsing, code extraction, and problem statement extraction

### Phase detection

- Primary: deterministic rules + state machine
- Secondary: LLM tie-breaker only when ambiguity is high

Reason:

- phase detection should be fast, cheap, and explainable
- we should not pay a frontier-model tax on every transcript chunk
- rules are more reliable than LLM guesses for many transitions

## Product Output Contract

Every K1 response should return structured sections, not a raw paragraph blob.

Suggested payload contract:

```ts
type InterviewOverlayPayload = {
  phase: "p1" | "p2" | "p3" | "p4" | "p5" | "p6";
  phaseConfidence: number;
  speakNow: string[];
  writeNow: string[];
  currentNotes: string[];
  upcomingPoints: string[];
  rescueLine?: string;
  codePanel?: {
    language: string;
    content: string;
    mode: "full" | "diff" | "trace";
  };
  changes?: Array<{
    kind: "new" | "updated" | "removed";
    label: string;
    detail: string;
  }>;
  freshness: {
    transcriptUpdatedMsAgo: number;
    screenshotUpdatedMsAgo: number | null;
    generatedMsAgo: number;
  };
};
```

This matters because the UI must consistently show:

- exact words to speak
- exact things to type
- what changed
- what comes next

## Architecture Strategy

Do not rewrite the current intelligence system from scratch.

Instead:

1. add a new `electron/interview/` module
2. keep `SessionTracker` and existing meeting lifecycle as the transcript backbone
3. keep current overlay window infrastructure
4. add interview-specific IPC/events and a new overlay renderer component
5. keep general meeting mode intact

This is the safest path with the least traction.

## Implementation Order

This order is optimized for limited time and usable stop-points.

| Order | Feature | Why it comes now | Usable after this? |
|---|---|---|---|
| 1 | Interview mode shell + fixed shortcuts | Establishes the lane and removes product ambiguity | Partially |
| 2 | Structured interview memory ledger | Everything depends on retained context | No |
| 3 | Phase detector + event extraction | Needed before proactive scripts are trustworthy | No |
| 4 | K1/K2 interview orchestrator + prefetch buffer | Gives us the main user loop and latency model | Yes |
| 5 | Vision sync + problem/code diff pipeline | Unlocks screenshot-aware help and change tracking | Yes |
| 6 | Phase 1 + 2 + 3 generators | Completes the opening and early interview loop | Yes |
| 7 | Phase 4 coding copilot | Highest total interview value | Yes |
| 8 | Phase 5 + 6 generators | Completes testing, follow-up, and closing loop | Yes |
| 9 | Interview overlay UI | Makes the flow actually readable under pressure | Yes |
| 10 | Reliability harness + replay tests | Needed before rollout confidence | Yes |

---

## Feature 1 — Interview Mode Shell And Fixed Presets

### Objective

Create a dedicated interview mode that swaps the app into a constrained configuration instead of reusing the general chat behavior.

### User-facing behavior

When interview mode is active:

- only 2 interview shortcuts are shown and used
- the overlay opens in full-screen transparent mode
- mouse passthrough is forced on
- the app uses interview-specific prompts and UI
- non-essential meeting features are hidden from the overlay

### Backend implementation

Add an interview mode configuration layer with:

- `mode: "general" | "interview"`
- model preset
- STT preset
- overlay preset
- shortcut preset

This should be read at meeting start and should switch orchestration paths.

### File touchpoints

Existing files to modify:

- `electron/main.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `electron/services/SettingsManager.ts`
- `electron/services/KeybindManager.ts`
- `electron/WindowHelper.ts`
- `src/App.tsx`
- `src/components/SettingsOverlay.tsx`
- `src/types/electron.d.ts`

New files:

- `electron/interview/types.ts`
- `electron/interview/InterviewModeConfig.ts`

### Notes

- Do not delete existing keybinds globally. Keep them for general mode.
- In interview mode, only register or honor the 2 interview actions in the overlay path.

### Acceptance criteria

- interview mode can be enabled from settings or a hardcoded flag
- K1 and K2 are the only visible/active overlay actions in interview mode
- overlay opens in full-screen transparent passthrough mode
- general meeting mode still works unchanged

---

## Feature 2 — Structured Interview Memory Ledger

### Objective

Retain the complete interview context in a structured form that survives transcript compaction and phase changes.

### Why this is critical

This is the single most important backend feature.

Without it:

- the model will forget earlier constraints
- mid-interview requirement changes will cause rewrites instead of diffs
- phase 5 and 6 answers will lose the original reasoning trail

### Data model

Add an interview-specific session state object that stores:

```ts
type InterviewState = {
  startedAt: number;
  currentPhase: "p1" | "p2" | "p3" | "p4" | "p5" | "p6";
  phaseConfidence: number;
  interviewerProfile: {
    name?: string;
    teamHint?: string;
    style?: "warm" | "neutral" | "fast" | "poker-face";
  };
  problem: {
    title?: string;
    statement?: string;
    examples: string[];
    constraints: string[];
    detectedCategory?: string;
  };
  clarifications: Array<{ question: string; answer: string }>;
  assumptions: string[];
  chosenApproach?: string;
  rejectedApproaches: string[];
  currentCode?: {
    language?: string;
    content: string;
    hash: string;
    updatedAt: number;
  };
  previousCode?: {
    content: string;
    hash: string;
    updatedAt: number;
  };
  dryRuns: string[];
  followUpChanges: string[];
  transcriptSummaryByPhase: Partial<Record<"p1" | "p2" | "p3" | "p4" | "p5" | "p6", string>>;
  latestScreenshot?: {
    path: string;
    capturedAt: number;
    kind: "problem" | "code" | "mixed" | "unknown";
  };
};
```

### Implementation strategy

- keep `SessionTracker` as raw transcript memory
- build a new `InterviewStateStore` on top of it
- update the store from transcript events, phase transitions, and screenshot extraction results
- summarize each completed phase into a durable short summary
- always build prompts from:
  - structured interview state
  - recent transcript slice
  - latest visual extraction

### File touchpoints

Existing files to modify:

- `electron/IntelligenceManager.ts`
- `electron/SessionTracker.ts`
- `electron/IntelligenceEngine.ts`

New files:

- `electron/interview/InterviewStateStore.ts`
- `electron/interview/InterviewContextBuilder.ts`
- `electron/interview/InterviewStateReducer.ts`
- `electron/interview/hash.ts`

### Acceptance criteria

- earlier clarifications remain available after 30+ minutes
- current prompts can include original problem, chosen approach, and latest code state together
- phase transitions generate compact durable summaries

---

## Feature 3 — Phase Detector And Event Extractor

### Objective

Infer the interview phase and important sub-events without needing the user to explicitly ask for help.

### Core design

Use a hybrid detector:

1. deterministic rules first
2. LLM tie-breaker only if confidence is low

### Inputs

- elapsed interview time
- transcript speaker turns
- cue phrases
- screenshot extraction results
- K1/K2 usage pattern

### Sub-events to detect

- `interviewer_intro_started`
- `problem_received`
- `clarification_answered`
- `constraint_written`
- `approach_started`
- `bruteforce_stated`
- `alignment_needed`
- `coding_started`
- `bug_or_change_request`
- `dry_run_requested`
- `complexity_requested`
- `follow_up_requested`
- `closing_started`
- `silence_risk`

### Example deterministic cues

- if transcript contains “tell me about yourself” or interviewer self-intro, bias to Phase 1
- if a screenshot extract contains a fresh problem statement and there is no chosen approach yet, bias to Phase 2
- if user speech includes “brute force”, “optimize”, “heap”, “bfs”, “two pointers”, bias to Phase 3
- if latest screenshot looks like code and current phase is 3 or 4, bias to Phase 4
- if interviewer says “test”, “dry run”, “walk me through”, “complexity”, bias to Phase 5
- if interviewer says “what if”, “follow-up”, “how would this change”, “any questions for me”, bias to Phase 6

### File touchpoints

Existing files to modify:

- `electron/main.ts`
- `electron/IntelligenceManager.ts`

New files:

- `electron/interview/InterviewPhaseDetector.ts`
- `electron/interview/InterviewSignalExtractor.ts`
- `electron/interview/InterviewCueRules.ts`

### Acceptance criteria

- phase updates correctly on the supplied mock interviews most of the time
- sub-events are exposed for generator logic
- detector can explain which rules caused its current phase confidence

---

## Feature 4 — Interview Orchestrator, K1/K2 Semantics, And Prefetch Buffer

### Objective

Make the interview loop feel instant by continuously preparing outputs and revealing them on demand.

### K1 behavior

`NEXT SCRIPT` should:

- return the best phase-aware script to speak right now
- prefer cached prefetched content if state is still fresh
- fall back to streaming generation if needed
- never return an empty state

### K2 behavior

`SCREEN SYNC` should:

- capture the current screen
- run phase-aware extraction
- update visual state
- invalidate stale prefetched content that depends on old screen context

### Background prefetch policy

Prefetch should run when:

- an interviewer final transcript lands
- the candidate pauses after a spoken turn
- phase changes
- K2 finishes
- a follow-up/change request is detected

Prefetch should be cancelled when:

- a newer transcript or screenshot arrives
- phase changes before generation completes

### Output priority

When K1 is pressed, the orchestrator should choose in this order:

1. fresh prefetched payload for current phase
2. stale payload plus streaming delta
3. rescue script only

### File touchpoints

Existing files to modify:

- `electron/main.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `electron/services/KeybindManager.ts`
- `src/types/electron.d.ts`

New files:

- `electron/interview/InterviewOrchestrator.ts`
- `electron/interview/InterviewPrefetchBuffer.ts`
- `electron/interview/InterviewFreshness.ts`
- `electron/interview/InterviewEvents.ts`

### Acceptance criteria

- K1 always yields something usable
- K1 is instant when nothing meaningful changed
- stale generations are cancelled cleanly
- K2 forces the next K1 to use the new visual context

---

## Feature 5 — Vision Sync, Problem Extraction, Code Extraction, And Diff Engine

### Objective

Turn screenshots into structured problem/code state and show changes instead of replacing everything blindly.

### Phase-specific extraction behavior

#### Phase 2

Extract:

- full problem statement
- examples
- explicit constraints
- implied data structure hints
- missing clarification candidates

#### Phase 4

Extract:

- current code visible on screen
- language guess
- current cursor/progress area if possible
- missing sections versus intended solution
- diff against previous code snapshot

#### Phase 5

Extract:

- interviewer-provided dry-run input
- explicit edge cases
- any complexity question or prompt shown on screen

#### Phase 6

Extract:

- changed requirement text
- exact areas of code affected
- delta between original requirement and new requirement

### Diff strategy

Use the existing `diff` package already in the repo to compute:

- line-level diffs
- compact “what changed” bullets
- highlighted old vs new code segments

The overlay should prefer diffs when the requirement changed midstream.

### File touchpoints

Existing files to modify:

- `electron/ProcessingHelper.ts`
- `electron/ScreenshotHelper.ts`
- `electron/LLMHelper.ts`

New files:

- `electron/interview/InterviewVisionService.ts`
- `electron/interview/InterviewExtractionPrompts.ts`
- `electron/interview/InterviewCodeDiffService.ts`
- `electron/interview/InterviewVisualState.ts`

### Acceptance criteria

- K2 can extract a usable problem statement from a shared doc screenshot
- K2 can extract visible code and diff it against the prior code state
- follow-up requirement changes show as a delta, not a full unrelated rewrite

---

## Feature 6 — Phase 1 Intro And Warm-Up Generator

### Objective

Help the user start strong in the first 2 to 5 minutes even if they are nervous and under-prepared.

### What K1 should show in Phase 1

`Speak Now`

- a 60 to 90 second intro script adapted to the user profile
- a one-line reaction to the interviewer’s team intro
- a short confirmation line for the shared doc

`Current Notes`

- interviewer name
- team hint
- one or two likely topics inferred from the intro

`Upcoming`

- the best bridge sentence into the problem handoff

### Important behavior

- only use `I` statements
- keep the intro concrete and quantified
- keep this generator short and lightweight because Phase 1 is valuable but not the highest technical risk

### File touchpoints

New files:

- `electron/interview/generators/Phase1IntroGenerator.ts`

Supporting prompt file updates:

- `electron/interview/InterviewPromptLibrary.ts`

### Acceptance criteria

- the user always has a usable intro script in Phase 1
- the app captures the interviewer name/team and carries that into Phase 6 closing questions

---

## Feature 7 — Phase 2 Clarification Engine

### Objective

Help the user survive the most skipped but most important part of the interview: understanding the question correctly before coding.

### What K1 should show in Phase 2

`Speak Now`

- one restatement of the problem
- 3 to 5 clarifying questions in the correct order
- one short transition line before writing constraints

`Write Now`

- a ready-to-type constraints block in comment form
- one example trace to write in the doc

`Current Notes`

- extracted constraints
- still-unanswered assumptions

`Upcoming`

- probable algorithm families suggested by the constraints

### Important behavior

- do not wait for the user to ask “what are good clarifying questions?”
- if the screenshot already shows explicit constraints, do not ask them again
- if a clarification has already been answered in transcript, mark it resolved and stop repeating it

### File touchpoints

New files:

- `electron/interview/generators/Phase2ClarificationGenerator.ts`
- `electron/interview/templates/constraintBlock.ts`

Supporting prompt file updates:

- `electron/interview/InterviewPromptLibrary.ts`

### Acceptance criteria

- Phase 2 output is structured and not generic
- questions adapt as answers arrive
- top-of-doc constraint comments are always available

---

## Feature 8 — Phase 3 Approach Generator

### Objective

Make the candidate sound like they are naturally reasoning out loud, comparing ideas, and aligning before coding.

### What K1 should show in Phase 3

`Speak Now`

- brute-force framing
- why it is too slow
- best candidate optimized approach
- alignment close: “does this direction seem reasonable before I start coding?”

`Current Notes`

- chosen approach
- rejected alternatives
- key DS/algorithm names the user may need to say

`Upcoming`

- helper functions likely needed
- edge cases to keep in mind during implementation

`Rescue Line`

- if stuck, provide a safe indirect hint-seeking question

### Important behavior

- do not jump directly to the optimal solution without showing the reasoning ladder
- if the interviewer gave a hint, the script should explicitly incorporate it
- if the user seems stuck, switch from “answer” mode to “reasoning recovery” mode

### File touchpoints

New files:

- `electron/interview/generators/Phase3ApproachGenerator.ts`
- `electron/interview/templates/approachScaffold.ts`

### Acceptance criteria

- output sounds collaborative, not robotic
- brute force always appears before the optimized choice
- hint handling works as a first-class path

---

## Feature 9 — Phase 4 Live Coding Copilot

### Objective

Guide the user through coding while tracking what is already on screen and telling them exactly what to say next as they type.

### This is the highest-impact feature in the whole plan

If time is tight, this is the feature to protect.

### What K1 should show in Phase 4

`Speak Now`

- 1 to 3 natural narration sentences tied to the current code progress
- what the user should say while writing the next block

`Write Now`

- next code chunk or helper skeleton
- purposeful comments only where narration value exists

`Code Panel`

- current intended code
- or diff patch if requirement changed

`Current Notes`

- what has already been implemented
- what still remains

`Upcoming`

- next helper
- next edge case guard
- next likely interviewer checkpoint

### Smart behavior required

- compare the visible code from K2 to the intended solution state
- if the user already wrote part of the solution, continue from there instead of regenerating from scratch
- if the user made a mistake, point to the local diff and explain the correction calmly
- if the interviewer changes requirements, produce a minimal delta patch and the exact narration for the change

### File touchpoints

New files:

- `electron/interview/generators/Phase4CodingGenerator.ts`
- `electron/interview/InterviewProgressTracker.ts`
- `electron/interview/InterviewCodePlan.ts`

Existing files to modify:

- `electron/LLMHelper.ts`

### Acceptance criteria

- output is progress-aware
- the system stops rewriting the whole solution on every refresh
- mid-interview requirement changes produce code deltas and narration deltas

---

## Feature 10 — Phase 5 Testing, Dry Run, Complexity, And Follow-up Changes

### Objective

Help the user finish the interview like a strong candidate instead of stopping at “here is the solution”.

### What K1 should show in Phase 5

`Speak Now`

- a dry-run opener
- state-by-state trace narration
- named edge cases
- time and space complexity with derivation

`Write Now`

- compact test case block
- dry-run notes
- complexity notes

`Code Panel`

- dry-run trace or complexity breakdown instead of main code

### What K1 should show in Phase 6

`Speak Now`

- response to follow-up constraint changes
- exact change summary to the code
- 1 to 2 good closing questions for the interviewer
- warm closing line by name

### Important behavior

- do not answer complexity with only a single line like `O(n log n)`
- include where each term comes from
- if the interviewer gives an input aloud, the app should produce the dry-run steps upon trigger
- if the follow-up requires code changes, show precise changed lines, not full replacement

### File touchpoints

New files:

- `electron/interview/generators/Phase5TestingGenerator.ts`
- `electron/interview/generators/Phase6FollowupGenerator.ts`
- `electron/interview/templates/dryRunTemplates.ts`
- `electron/interview/templates/complexityTemplates.ts`

### Acceptance criteria

- dry-run output is step-by-step, not vague
- complexity output explains the derivation
- follow-up changes show as targeted code deltas
- closing questions are always ready

---

## Feature 11 — Interview Overlay UI

### Objective

Replace the chat-centric overlay experience with a reading-centric interview surface.

### Layout

Use a full-screen transparent overlay with these stable sections:

1. `Top Ribbon`
   - phase
   - timer bucket
   - transcript freshness
   - screenshot freshness
   - phase confidence

2. `Center Speak Now`
   - largest text on the screen
   - exact script to speak next

3. `Left Rail`
   - current notes
   - confirmed constraints
   - assumptions
   - rescue line

4. `Right Rail`
   - code block, diff block, or dry-run trace depending on phase

5. `Bottom Upcoming`
   - next 2 or 3 points
   - what to do if interrupted

### UI behavior rules

- `Speak Now` always has highest priority
- if the right rail becomes stale, it should visually show `stale` instead of pretending freshness
- when requirement changes happen, show old vs new clearly
- when a section becomes irrelevant, clear it aggressively

### Visual language

- transparent but readable surfaces
- larger type for `Speak Now`
- monospaced code/diff area
- color-coded change states:
  - neutral for original
  - green for additions
  - amber for changed assumptions
  - red only for likely bug or removal

### File touchpoints

Existing files to modify:

- `src/App.tsx`
- `src/index.css`
- `src/lib/overlayAppearance.ts`

New files:

- `src/components/interview/InterviewOverlay.tsx`
- `src/components/interview/InterviewTopRibbon.tsx`
- `src/components/interview/InterviewSpeakNow.tsx`
- `src/components/interview/InterviewNotesRail.tsx`
- `src/components/interview/InterviewCodeRail.tsx`
- `src/components/interview/InterviewUpcomingBar.tsx`
- `src/hooks/useInterviewOverlay.ts`
- `src/types/interview.ts`

### Acceptance criteria

- the overlay is readable from a distance
- the user never needs to click the overlay
- phase-specific sections update without layout thrash

---

## Feature 12 — Reliability, Fallbacks, Replay Harness, And Release Guardrails

### Objective

Make the feature safe to ship instead of hoping the live interview is the first real test.

### Reliability requirements

- all LLM generations use `AbortController` and cancel stale work
- every payload carries freshness metadata
- if screenshot is stale in a screenshot-dependent phase, K1 should warn and still provide a safe fallback script
- if a phase generator fails, show a rescue-line fallback instead of blank content

### Replay harness

Use the existing mock interview docs as deterministic replay fixtures.

Create a replay tool that:

- feeds transcript turns in order
- injects screenshot extraction snapshots at chosen times
- records phase decisions and K1 payloads

Use it to validate:

- phase transitions
- clarification behavior
- approach behavior
- coding narration continuity
- dry-run completeness

### File touchpoints

New files:

- `electron/interview/__tests__/phaseDetector.test.ts`
- `electron/interview/__tests__/generatorReplay.test.ts`
- `electron/interview/__tests__/fixtures/`
- `scripts/replay-interview-session.ts`

Optional existing files to modify:

- `package.json`

### Acceptance criteria

- replay of the provided mock interviews produces stable phase transitions
- major regressions are catchable before shipping
- generator errors never blank the overlay

---

## Files Most Likely To Be Touched

### New backend modules

```text
electron/interview/types.ts
electron/interview/InterviewModeConfig.ts
electron/interview/InterviewOrchestrator.ts
electron/interview/InterviewStateStore.ts
electron/interview/InterviewStateReducer.ts
electron/interview/InterviewContextBuilder.ts
electron/interview/InterviewPhaseDetector.ts
electron/interview/InterviewSignalExtractor.ts
electron/interview/InterviewCueRules.ts
electron/interview/InterviewPrefetchBuffer.ts
electron/interview/InterviewFreshness.ts
electron/interview/InterviewEvents.ts
electron/interview/InterviewVisionService.ts
electron/interview/InterviewExtractionPrompts.ts
electron/interview/InterviewCodeDiffService.ts
electron/interview/InterviewVisualState.ts
electron/interview/InterviewProgressTracker.ts
electron/interview/InterviewCodePlan.ts
electron/interview/InterviewPromptLibrary.ts
electron/interview/generators/Phase1IntroGenerator.ts
electron/interview/generators/Phase2ClarificationGenerator.ts
electron/interview/generators/Phase3ApproachGenerator.ts
electron/interview/generators/Phase4CodingGenerator.ts
electron/interview/generators/Phase5TestingGenerator.ts
electron/interview/generators/Phase6FollowupGenerator.ts
electron/interview/templates/constraintBlock.ts
electron/interview/templates/approachScaffold.ts
electron/interview/templates/dryRunTemplates.ts
electron/interview/templates/complexityTemplates.ts
```

### Existing backend files

```text
electron/main.ts
electron/ipcHandlers.ts
electron/preload.ts
electron/IntelligenceManager.ts
electron/IntelligenceEngine.ts
electron/SessionTracker.ts
electron/LLMHelper.ts
electron/ProcessingHelper.ts
electron/ScreenshotHelper.ts
electron/WindowHelper.ts
electron/services/KeybindManager.ts
electron/services/SettingsManager.ts
```

### New renderer files

```text
src/components/interview/InterviewOverlay.tsx
src/components/interview/InterviewTopRibbon.tsx
src/components/interview/InterviewSpeakNow.tsx
src/components/interview/InterviewNotesRail.tsx
src/components/interview/InterviewCodeRail.tsx
src/components/interview/InterviewUpcomingBar.tsx
src/hooks/useInterviewOverlay.ts
src/types/interview.ts
```

### Existing renderer files

```text
src/App.tsx
src/index.css
src/lib/overlayAppearance.ts
src/components/SettingsOverlay.tsx
src/types/electron.d.ts
```

## What Not To Build In V1

To stay concentrated, explicitly defer these:

- more than 2 interview shortcuts
- automatic screenshot capture every few seconds
- separate per-platform interview UIs
- a brand new database schema for interview sessions
- voice playback / TTS of the answer
- auto-answering without a user trigger
- multi-provider fan-out on every request
- historical RAG over old meetings for live coding rounds
- support for every interview type before SWE coding is solid

## Recommended Delivery Sequence

If we need the shortest path to a usable product, implement in this exact order:

1. Interview mode shell and settings preset
2. Structured interview state ledger
3. Phase detector
4. K1/K2 orchestrator with prefetch
5. Vision sync and diff engine
6. Phase 1 intro generator
7. Phase 2 clarification generator
8. Phase 3 approach generator
9. Phase 4 coding copilot
10. Phase 5 testing/complexity generator
11. Phase 6 follow-up/closing generator
12. Interview overlay UI
13. Replay harness and release guardrails

## Bottom Line

The concentrated, highest-impact version of this product is:

- 2 shortcuts only
- one dedicated interview mode
- one structured interview memory ledger
- one phase detector
- one orchestrator that always prepares the next script
- one screenshot sync path for problem/code/diff awareness
- one overlay optimized for reading, not chatting

If we implement only that slice well, it will fit the current Natively ecosystem with limited traction and deliver the maximum interview impact for the time invested.
