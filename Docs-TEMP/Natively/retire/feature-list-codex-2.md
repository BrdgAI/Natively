# Natively Interview Mode Plan

## Simple Flow First

### Goal
Build a focused `Interview Mode` for Natively that helps a candidate perform well across the full 45-minute interview, especially when:

- the user does not know what to do next
- the user is reading directly from the Natively overlay
- the interview is happening in Google Meet + Google Doc / browser
- we have limited build time and must maximize impact
- we want to avoid relying on lots of keyboard shortcuts

### Important Reality Check
We should not promise a guarantee.

No honest product can guarantee interview success or 100% accuracy in live high-stakes conversation. What we can do is build the highest-confidence, lowest-friction feature set that materially improves the user’s performance with the current Natively architecture.

### Recommended User Journey

1. User opens Natively and chooses `Interview Mode`.
2. User clicks one `Start Interview` CTA.
3. Natively switches into a persistent `Focus Overlay` that is optimized for:
   - live transcript
   - what to say now
   - what to do next
   - coding help when the question becomes coding-heavy
4. During the intro, Natively shows:
   - a short intro structure
   - what tone to use
   - a ready-to-say answer when needed
5. During problem intake, Natively shows:
   - problem restatement
   - clarifying questions
   - constraints checklist
6. During coding, user captures the prompt once with an on-screen `Capture Problem` action.
7. Natively then shows:
   - recommended approach
   - top-down code skeleton
   - testing checklist
   - follow-up / optimization angles
8. Near the end, Natively switches to:
   - testing / complexity prompts
   - strong follow-up questions to ask the interviewer
   - a clean closing line
9. After the interview, Natively can reuse the existing recap + follow-up email surfaces.

### Product Principles

- `Accuracy over cleverness`: the overlay should say fewer, better things.
- `Minimal interaction`: after start, most help should be automatic.
- `Minimal shortcuts`: only keep the two safest global shortcuts by default.
- `Phase-aware, not rigid`: follow the reference flow, but degrade gracefully when the interviewer changes direction.
- `Exploit the current ecosystem`: extend the current overlay, STT, IPC, and LLM stack instead of inventing a new app inside the app.

---

## Recommended Provider Stack

### V1 Recommendation

- `Primary LLM for interview answers and coding`: `gpt-5.4`
- `Optional low-latency fallback for passive/background nudges only`: `gpt-5-mini`
- `Primary STT`: `Deepgram nova-3`

### Why This Stack

- `gpt-5.4` is currently OpenAI’s flagship model for complex reasoning, coding, and professional workflows, and the repo already has first-class OpenAI support.
- `Deepgram nova-3` is officially positioned for meetings, event captioning, multi-speaker, noisy, and far-field audio, which matches interview conditions well.
- This repo already contains working OpenAI and Deepgram integrations, so implementation risk is much lower than introducing a new provider path.

### Practical Product Decision

For this interview feature push, do not spend time migrating the whole model layer to a new provider abstraction.

Use the provider support that already exists:

- `electron/LLMHelper.ts`
- `electron/audio/DeepgramStreamingSTT.ts`
- `electron/audio/OpenAIStreamingSTT.ts`
- `electron/services/CredentialsManager.ts`
- `src/components/settings/AIProvidersSettings.tsx`

### Suggested Runtime Routing

- `Spoken answer generation`: `gpt-5.4`
- `Behavioral/story shaping`: `gpt-5.4`
- `Coding plan + code skeleton + testing`: `gpt-5.4`
- `Passive phase nudges / low-priority background coaching`: `gpt-5-mini` later, only if latency becomes a problem
- `STT`: `Deepgram nova-3`
- `Fallback chain`: keep existing Gemini / Claude / Groq fallback behavior in `LLMHelper`

---

## What We Should Not Build Now

- No browser extension or Google Docs DOM automation
- No autonomous code typing into the shared doc
- No shortcut-heavy UX with many numbered commands
- No major database redesign for v1
- No heavy long-term memory / RAG rewrite specifically for interviews
- No separate brand-new window system for interview mode if the current overlay can be extended

The best use of time is a strong guided overlay, not a large platform rewrite.

---

## Feature List In Implementation Order

## 1. Interview Mode Foundation and Safe Defaults

### What It Does
Adds a real `Interview Mode` session preset that changes the product from generic meeting assistant behavior into interview-specific behavior.

### Why It Comes First
Everything else depends on session intent. Without an explicit interview mode, all prompts, overlay decisions, and shortcut reductions stay ambiguous.

### User Experience

- Launcher gets a dedicated `Start Interview` CTA or mode selector
- Settings gets an `Interview Preset`
- On interview start, Natively automatically applies:
  - preferred LLM
  - preferred STT
  - interview-safe overlay layout
  - reduced shortcut preset
  - transcript visibility on
  - mouse passthrough preference

### Technical Implementation

- Extend meeting start metadata with:
  - `sessionType: 'interview'`
  - `interviewPresetId`
  - `preferredInterviewModel`
  - `preferredCodingModel`
  - `preferredInterviewStt`
- Persist interview defaults in settings/credentials
- Update the current default model list to include the models we actually want to expose for interview mode
- Add a safe shortcut preset that disables most global actions in interview mode

### Implementation Notes

- This should be configuration-first, not LLM-first
- No DB migration required for v1
- Use existing `startMeeting(metadata)` shape instead of inventing a new session lifecycle

### Files To Touch

- `src/components/Launcher.tsx`
- `src/components/SettingsOverlay.tsx`
- `src/components/settings/AIProvidersSettings.tsx`
- `src/utils/modelUtils.ts`
- `electron/main.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`
- `electron/services/SettingsManager.ts`
- `electron/services/CredentialsManager.ts`
- `electron/services/KeybindManager.ts`
- `src/hooks/useShortcuts.ts`
- `electron/LLMHelper.ts`
- `electron/services/ModelVersionManager.ts`

### Confidence
Very high. This fits the current launcher/settings/start-meeting architecture cleanly.

---

## 2. Interview Session State and Phase Engine

### What It Does
Creates a lightweight engine that decides what phase the user is currently in and what help should be visible.

### Why It Matters
The interview references are not asking for one generic answer box. They describe distinct phases:

- intro
- clarification
- approach discussion
- coding
- testing / complexity
- closing / Q&A

If Natively understands phase, it can show the right guidance without needing lots of user clicks.

### User Experience

The overlay should always know the current state:

- `Intro`
- `Clarify`
- `Approach`
- `Code`
- `Test`
- `Close`

And it should update the main guidance card automatically.

### Technical Implementation

Use a heuristic-first phase engine:

- `time since meeting start`
- `last interviewer turn`
- `intent classification`
- `presence of screenshots / captured problem`
- `manual user override when needed`

Recommended logic:

- `Intro`: first few minutes or intro-like prompts
- `Clarify`: problem is being explained, no code started yet
- `Approach`: question understood, discussing tradeoffs
- `Code`: screenshot attached or coding intent strongly detected
- `Test`: later stage, code already generated / user indicates done
- `Close`: interviewer asks for questions / time is ending

This should be hint-based, not deterministic. If the interviewer jumps straight into coding, phase should skip naturally.

### Best Architecture Fit

Create a small interview domain in main process instead of bloating `IntelligenceEngine.ts` with even more ad hoc branches.

Suggested new files:

- `electron/interview/types.ts`
- `electron/interview/InterviewSessionState.ts`
- `electron/interview/InterviewPhaseEngine.ts`

The phase engine should consume:

- `SessionTracker` transcript context
- current meeting metadata
- screenshot/coding state
- elapsed time

### IPC Surface

Add read-only state events like:

- `interview:state-updated`
- `interview:phase-changed`
- `interview:set-phase-override`
- `interview:get-session-state`

### Files To Touch

- `electron/main.ts`
- `electron/IntelligenceManager.ts`
- `electron/IntelligenceEngine.ts`
- `electron/SessionTracker.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`
- `electron/interview/types.ts` new
- `electron/interview/InterviewSessionState.ts` new
- `electron/interview/InterviewPhaseEngine.ts` new

### Confidence
High. This is mostly orchestration and heuristics, not risky model work.

---

## 3. Focus Overlay Layout for Interviews

### What It Does
Turns the current generic overlay into a stable interview dashboard that the user can read without keyboard gymnastics.

### Why It Matters
Right now the overlay is a flexible general chat surface with many quick actions and shortcut hooks. That is not ideal for a stressed candidate who wants one clear pane showing:

- what is being asked
- what to say
- what to do next

### User Experience

Default interview layout should be a `Focus Overlay`:

- fixed-width, full-height or near-full-height side panel
- persistent transcript strip
- current phase badge
- `Do Now` card
- `Say This` card
- `Why` / `Watch For` card
- small action row:
  - `Capture Problem`
  - `Refresh Answer`
  - `Show Testing`
  - `Show Closing Qs`

### Keyboard Strategy

In interview mode, default to only two safe global shortcuts:

1. `Toggle Visibility`
2. `Toggle Mouse Passthrough`

Optional third shortcut later:

3. `Capture Problem`

Everything else should be clickable or automatic.

### Technical Implementation

- Add a dedicated interview overlay layout inside `NativelyInterface`
- Keep the existing general overlay path intact for non-interview meetings
- Add a `layoutMode: 'default' | 'interview-focus'` in main/renderer state
- Add a right-docked or fixed-position bounds mode in `WindowHelper`
- Reuse the existing overlay window instead of creating a new interview-specific window

### Good V1 Tradeoff

Do not build a brand-new renderer route.

Instead:

- keep `?window=overlay`
- branch inside `NativelyInterface.tsx`
- extract smaller interview UI subcomponents

Suggested new renderer components:

- `src/components/interview/InterviewOverlayShell.tsx`
- `src/components/interview/InterviewPhaseHeader.tsx`
- `src/components/interview/InterviewDoNowCard.tsx`
- `src/components/interview/InterviewSayCard.tsx`
- `src/components/interview/InterviewSignalsCard.tsx`

### Files To Touch

- `src/components/NativelyInterface.tsx`
- `src/components/ui/RollingTranscript.tsx`
- `src/App.tsx`
- `src/index.css`
- `src/lib/overlayAppearance.ts`
- `electron/WindowHelper.ts`
- `electron/main.ts`
- `src/components/interview/InterviewOverlayShell.tsx` new
- `src/components/interview/InterviewPhaseHeader.tsx` new
- `src/components/interview/InterviewDoNowCard.tsx` new
- `src/components/interview/InterviewSayCard.tsx` new
- `src/components/interview/InterviewSignalsCard.tsx` new

### Confidence
High. This is a renderer/UI reshaping task built on an existing overlay window.

---

## 4. Spoken Answer Coach

### What It Does
Generates the exact spoken guidance the user needs for non-coding parts of the interview.

### This Is The Highest-Impact Live Feature
The strongest immediate value is helping the user say the right thing at the right time in:

- intro
- behavioral questions
- conceptual questions
- clarification questions
- follow-up questions from the interviewer
- closing questions to ask the interviewer

### User Experience

The overlay should not dump one long answer.

It should show three tightly-scoped outputs:

- `Say This`
  - exact response
- `Do Now`
  - action like “restate the problem first”
- `Watch For`
  - what the interviewer is evaluating

Examples:

- Intro phase:
  - 60-90 second structure
  - one polished version
- Clarification phase:
  - 3 best clarifying questions
  - top comments to type in the doc
- Behavioral phase:
  - STAR-shaped answer, but natural
- Follow-up phase:
  - shorter follow-on answer
  - stronger example
  - deeper detail
- Closing phase:
  - 3 tailored questions to ask the interviewer
  - one warm close sentence

### Technical Implementation

Do not keep overloading the current universal prompt with every interview behavior.

Add dedicated interview prompt builders with small focused outputs:

- `intro coach`
- `clarification coach`
- `behavioral/story coach`
- `concept answer coach`
- `closing question coach`

Prefer structured output internally:

- `phase`
- `say_this`
- `do_now`
- `watch_for`
- `backup_short_version`

Then render those sections explicitly in the overlay.

### Architecture Fit

This can sit on top of the current `IntelligenceEngine`, but I would keep interview planning logic in a separate layer:

- `electron/interview/InterviewCoachService.ts`
- `electron/interview/promptBuilders.ts`

Reuse existing assets where possible:

- `IntentClassifier.ts`
- `WhatToAnswerLLM.ts`
- `FollowUpQuestionsLLM.ts`
- `llm/prompts.ts`

### Files To Touch

- `electron/IntelligenceEngine.ts`
- `electron/llm/prompts.ts`
- `electron/llm/IntentClassifier.ts`
- `electron/llm/WhatToAnswerLLM.ts`
- `electron/llm/FollowUpQuestionsLLM.ts`
- `electron/LLMHelper.ts`
- `electron/interview/InterviewCoachService.ts` new
- `electron/interview/promptBuilders.ts` new
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`
- `src/components/NativelyInterface.tsx`
- `src/components/interview/InterviewSayCard.tsx`
- `src/components/interview/InterviewDoNowCard.tsx`
- `src/components/interview/InterviewSignalsCard.tsx`

### Confidence
High. This is a natural extension of the current intelligence flow.

---

## 5. Coding Question Copilot

### What It Does
Provides coding-round help that is optimized for the actual reference flow, not generic “solve the problem” output.

### Why This Is Critical
The coding references consistently emphasize that the candidate must do more than produce code:

- restate problem
- ask clarifying questions
- compare brute force vs optimal
- write a skeleton first
- test with edge cases
- discuss complexity

This means the product should generate a coding workflow, not just code.

### User Experience

When the interview becomes coding-heavy, the user hits one visible `Capture Problem` action.

Then the overlay switches to a coding panel with:

- `Problem Summary`
- `Clarifying Questions`
- `Approach`
- `Skeleton To Type`
- `Test Cases`
- `Complexity`
- `Likely Follow-Ups`

Optionally:

- `Debug This` when interviewer points out an issue

### Key Product Decision

Use screenshots as the coding question intake mechanism.

Why:

- browser / Google Doc text cannot be trusted to arrive through transcript alone
- Natively already has screenshot capture and image analysis plumbing
- this avoids browser-specific integration work

### Technical Implementation

Reuse the current screenshot system, but make the interview UX much more direct:

- avoid queue-first mental model
- in interview mode, `Capture Problem` should feed an interview coding extractor path immediately

Suggested components:

- `InterviewProblemExtractor`
- `InterviewCodingPlanner`
- `InterviewTestingPlanner`

Generated output should be structured, not plain markdown only.

Suggested shape:

- `problem_summary`
- `restatement`
- `clarifying_questions`
- `brute_force`
- `recommended_approach`
- `why_this_approach`
- `typed_skeleton`
- `edge_cases`
- `dry_run`
- `complexity`
- `follow_ups`

### Lowest-Risk Implementation Path

- Keep using the existing screenshot capture APIs
- Add a dedicated interview-mode path in `ipcHandlers.ts`
- Reuse `LLMHelper` with the coding model override
- Render structured sections in the overlay rather than one monolithic answer blob

### Files To Touch

- `electron/ScreenshotHelper.ts`
- `electron/CropperWindowHelper.ts`
- `electron/ipcHandlers.ts`
- `electron/preload.ts`
- `src/types/electron.d.ts`
- `electron/LLMHelper.ts`
- `electron/IntelligenceEngine.ts`
- `electron/ProcessingHelper.ts`
- `electron/interview/InterviewProblemExtractor.ts` new
- `electron/interview/InterviewCodingPlanner.ts` new
- `electron/interview/InterviewTestingPlanner.ts` new
- `src/components/NativelyInterface.tsx`
- `src/components/interview/InterviewCodingPanel.tsx` new

### Confidence
Medium-high. This is the most valuable technical feature, but it touches vision, structured outputs, and richer UI.

---

## 6. Testing, Complexity, and Closing Coach

### What It Does
Helps the candidate finish strong after the core solution is written.

### Why This Belongs In V1
The references repeatedly call out that many candidates fail here:

- they stop after code
- they forget edge cases
- they do not state complexity clearly
- they waste the final minutes

This feature is comparatively cheap because much of the needed data already exists once the coding plan is built.

### User Experience

When phase becomes `Test` or `Close`, overlay should show:

- `Dry Run This Example`
- `Edge Cases To Say Out Loud`
- `Time / Space Complexity`
- `Possible Optimizations`
- `3 Questions To Ask The Interviewer`
- `Closing Line`

### Technical Implementation

This is mostly a planner/prompt layer on top of data we already have:

- transcript
- coding plan
- generated answer
- elapsed time

No heavy new ingestion is required.

### Reuse Existing System

- `FollowUpQuestionsLLM.ts`
- `RecapLLM.ts`
- `MeetingPersistence.ts`
- existing post-meeting recap / follow-up email surfaces

### Files To Touch

- `electron/llm/FollowUpQuestionsLLM.ts`
- `electron/llm/RecapLLM.ts`
- `electron/llm/prompts.ts`
- `electron/IntelligenceEngine.ts`
- `electron/interview/InterviewTestingPlanner.ts` new or shared
- `electron/interview/InterviewClosingPlanner.ts` new
- `src/components/NativelyInterface.tsx`
- `src/components/interview/InterviewClosingPanel.tsx` new

### Confidence
High. This is mostly structured prompting and UI rendering.

---

## 7. Optional Stretch: Post-Interview Debrief Reuse

### What It Does
Uses the existing recap and follow-up email system, but with interview framing.

### Why It Is Stretch, Not Core
Useful, but not as high-leverage as live interview support.

### Good V1 Scope

- generate interview recap
- generate thank-you email draft
- summarize mistakes / missed moments from transcript

### Files To Touch

- `src/components/FollowUpEmailModal.tsx`
- `electron/utils/emailUtils.ts`
- `electron/MeetingPersistence.ts`
- `electron/llm/prompts.ts`

### Confidence
High, but lower priority.

---

## Best Final Scope For Limited Time

If time is tight, I would implement only these five in order:

1. `Interview Mode Foundation and Safe Defaults`
2. `Interview Session State and Phase Engine`
3. `Focus Overlay Layout for Interviews`
4. `Spoken Answer Coach`
5. `Coding Question Copilot`

Then add `Testing, Complexity, and Closing Coach` immediately after if time remains.

---

## Concrete Shipping Order

### Phase 1

- Add interview mode metadata and settings
- Add interview shortcut preset
- Add interview model / STT preset

### Phase 2

- Add interview session state + phase engine
- Broadcast interview state over IPC

### Phase 3

- Add focus overlay layout
- Add `Do Now`, `Say This`, `Watch For` cards

### Phase 4

- Add spoken answer coach prompts + rendering
- Add intro / clarification / behavioral / closing generation

### Phase 5

- Add `Capture Problem`
- Add coding plan extraction
- Add structured coding panel

### Phase 6

- Add testing / complexity / follow-up question panel
- Integrate closing flow

---

## Highest-Confidence Technical Strategy

### Strategy Summary

- keep the current Electron multi-window architecture
- keep the current `startMeeting` lifecycle
- keep the current overlay window
- keep the current STT providers and choose one best default
- keep the current LLM helper and fallback chain
- add a thin interview domain, not a rewrite

### Why This Is The Right Move

This repo already has the hard parts:

- live audio capture
- transcript streaming
- overlay window
- stealth mode
- screenshot capture
- provider selection
- session tracking
- prompt-based intelligence

So the best plan is not new infrastructure.

The best plan is better orchestration, better UI, and better prompt specialization around interview phases.

---

## Final Recommendation

Build Natively Interview Mode as a `phase-aware overlay copilot`, not a generic chat assistant.

The product should do three things exceptionally well:

1. tell the user what to say right now
2. tell the user what to do next
3. turn coding questions into a guided flow: clarify, approach, code, test, close

That is the highest-impact, lowest-friction, most realistic path to shipping something strong quickly inside the existing Natively ecosystem.
