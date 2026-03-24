# Interview Mode Context Facts

Verified against the current codebase.

## Short answer

Yes. Interview mode is actively using live audio conversation context.

But it is **not** using the old general meeting "rolling X seconds" context system to generate interview guidance.

Interview mode uses its **own interview-specific memory system**:

- a live interview transcript buffer
- phase routing based on recent transcript
- screen-sync context
- structured phase handoffs
- tracked facts, open questions, and follow-up state

## The simplest possible summary

- Audio transcripts still matter in interview mode.
- Interview mode keeps listening to both interviewer audio and user mic audio.
- The interview guidance system does **not** run on a "last 100s / 120s / 180s" time window.
- Instead, it runs on a **segment-based transcript buffer plus structured interview memory**.

## What is actively happening in interview mode

- Every STT transcript segment is still sent into the normal intelligence system.
- When the session type is `interview`, the same transcript stream is also sent into `InterviewOrchestrator`.
- That means interview mode is actively receiving live conversation updates from audio.
- Even if interview mode is paused, the app still keeps feeding transcripts into the interview orchestrator so the interview state can be resumed with context intact.
- Interview sessions start in phase `p2_clarify`.
- Interview sessions also start in `manual` routing mode, not `auto`.

## Interview-mode context buckets and limits

- Full interview transcript buffer:
  Up to **500 transcript segments** are retained inside `InterviewMemoryLedger`.
  This is the closest thing interview mode has to its "overall conversation context".
  It is **not seconds-based**.

- Generator recent transcript:
  `getRecentTranscript()` returns the last **40 transcript segments** by default.
  This is the main "recent interview transcript" passed into generation and routing.

- Prompt transcript section:
  The generator prompt includes the last **12 transcript segments** as `Recent transcript`.

- Phase router transcript view:
  Auto phase detection looks at the last **10 final transcript turns** to decide whether the user is in clarify, approach, code, test, or follow-up.

- Vision sync transcript view:
  Screenshot analysis gets the last **10 transcript segments** as transcript context.

- Saved normal context:
  Each phase document stores a small "normal context" snapshot of up to **4 lines**.
  It is built from the last **3 final transcript lines** plus follow-up info, then trimmed to 4 lines.

- Saved screen context:
  Each phase document stores a small "screen context" snapshot of up to **4 lines**.
  It is built from visible problem details like problem statement, constraints, hints, dry run, tests, and observations.

- Phase handoff memory:
  Each phase keeps:
  **up to 8 summary lines**
  **up to 10 confirmed spec lines**
  **up to 10 open questions**
  This is how earlier interview phases keep influencing later phases.

- Clarification tracking:
  Clarification questions are tracked as `pending`, `asked`, `answered`, `retired`, or `replaced`.
  The planner decides this from transcript overlap plus known facts already captured in the ledger.

- Stable fact buckets:
  `clarifiedFacts` keeps up to **10**
  `pinnedFacts` keeps up to **10**
  `openQuestions` keeps up to **10**
  `requirementChanges` keeps up to **10**
  `approachSummary` keeps up to **10**

- Clarify phase fallback pack:
  Clarify output can contain up to **18 main lines** and up to **10 clarification questions** after dedupe.

- Prefetch buffer:
  Interview mode prefetches one payload per phase for the current input revision.
  Prefetch is scheduled about **450 ms** after start, resume, transcript update, sync, or manual phase change.

- Freshness tracking:
  Each generated interview payload also stores:
  time since last transcript update
  time since last screenshot update
  time since generation
  These are freshness numbers, not context windows.

## What interview mode does not do

- It does **not** use a dedicated interview-only rolling window like "last 60 seconds" or "last 120 seconds".
- It does **not** have an interview-only "overall context of X seconds".
- Its memory model is mostly **segment-count based** and **state-based**, not time-based.

## Important nuance: stored context vs prompt context vs UI

- `savedContexts.screen` and `savedContexts.normal` are stored in each phase document.
- Those saved contexts help preserve small deltas in interview state.
- But the current interview prompt builder does **not** directly inject those saved context objects into the LLM prompt.
- The prompt builder currently uses:
  recent transcript
  latest screen analysis
  phase handoffs
  tracked facts and questions
  current code snapshot

- The interview UI is also separate from the general chat overlay.
- When the app is in interview mode, it switches to `InterviewOverlay`.
- That overlay does **not** show the normal rolling transcript bar or the general chat message thread.
- The current footer only shows:
  last normal fetch
  last screen sync

## Phase context, in plain English

- `p2_clarify`:
  focuses on problem statement, constraints, examples, clarification questions, and early facts

- `p3_approach`:
  carries forward clarify handoff details and adds approach summary

- `p4_code`:
  carries clarify plus approach context and uses current code snapshot if available

- `p5_test`:
  carries earlier phase context and adds dry-run / test reasoning

- `p6_follow_up`:
  carries all earlier phase context and tracks active follow-up changes, including whether a code diff is needed

## If you want the exact "seconds" answer

Inside **interview mode itself**:

- rolling transcript context in seconds: **none**
- overall interview context in seconds: **none**
- phase context in seconds: **none**

Inside the **general non-interview intelligence system**:

- base rolling context window: **120 seconds**
- Answer button auto-injection: **100 seconds**
- Assist mode: **60 seconds**
- Follow-up refinement: **60 seconds**
- What Should I Say: **180 seconds**
- Recap: **120 seconds**
- Follow-up Questions: **120 seconds**
- Manual Answer: **120 seconds**

Those general-mode numbers still exist in the repo, but they are **not the context model used to generate interview-mode guidance**.

## Final conclusion

Interview mode **is** actively using audio conversation context.

The key detail is this:

- audio is still feeding interview mode live
- interview mode does **not** depend on the old rolling-seconds context window
- interview mode depends on an interview-local transcript buffer plus structured state like phase handoffs, facts, screen analysis, and follow-up memory
