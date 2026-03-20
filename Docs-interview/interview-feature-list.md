# Interview Copilot — End-to-End Feature List

> Priority: Very-High and High only  
> Design principle: Minimum keybinds — the system should auto-detect, auto-switch, and auto-assist based on conversation context. The user should rarely need to press anything.  
> Date: March 19, 2026

---

## Table of Contents

1. [Interview Phase Auto-Detection Engine](#1-interview-phase-auto-detection-engine)
2. [Pre-Interview Preparation Suite](#2-pre-interview-preparation-suite)
3. [Problem Detection & Clarification Assistant](#3-problem-detection--clarification-assistant)
4. [Approach Advisor](#4-approach-advisor)
5. [Live Coding Copilot](#5-live-coding-copilot)
6. [Testing & Dry-Run Assistant](#6-testing--dry-run-assistant)
7. [Follow-Up Adaptation Engine](#7-follow-up-adaptation-engine)
8. [Wrap-Up & Q&A Generator](#8-wrap-up--qa-generator)
9. [Communication Coach (Passive)](#9-communication-coach-passive)
10. [Post-Interview Debrief & Growth](#10-post-interview-debrief--growth)
11. [Overlay UX Enhancements for Interviews](#11-overlay-ux-enhancements-for-interviews)
12. [Keybind Summary](#12-keybind-summary)

---

## 1. Interview Phase Auto-Detection Engine

**Priority: Very-High**  
**Type: New core system — foundational for all other interview features**

The platform already transcribes both sides of the conversation. This engine analyzes the live transcript to automatically detect which phase of the interview is happening and switches the AI mode accordingly — eliminating the need for the user to manually trigger different modes.

### 1.1 Phase Classifier

- Use the existing `IntentClassifier` infrastructure (local ONNX NLI model) extended with interview-phase labels to detect transitions in real-time.
- Recognized phases and their triggers:

| Phase | Detection Signals |
|---|---|
| **Intro / Icebreaker** | Interviewer introductions, "tell me about yourself", "how are you", team/role descriptions |
| **Behavioral / Googliness** | "Tell me about a time when...", "describe a situation where...", STAR-format questions |
| **Problem Statement** | "Here's the problem", "I'm going to paste...", "imagine a scenario", problem keywords (array, string, graph, tree, etc.) |
| **Clarification** | Candidate asking questions, "can I assume?", "what about edge cases?", interviewer confirming constraints |
| **Approach Discussion** | "brute force", "optimize", "complexity", "data structure", "my approach would be" |
| **Coding** | Sustained silence + screen shows code editor, "let me code this", "I'll write the function" |
| **Testing / Dry Run** | "let me trace through", "dry run", "test case", "walk through the example" |
| **Follow-Up** | "what if", "now suppose", "how would you modify", "can you optimize", "scale this" |
| **Q&A / Wrap-Up** | "do you have questions for me", "we're at time", "any questions about the team" |

- On each phase transition, the overlay UI updates its header to show the current phase (subtle, non-distracting).
- The active AI intelligence mode auto-switches to the appropriate handler for that phase.

### 1.2 Auto-Mode Routing

- Each detected phase maps to a specific AI mode or a new specialized sub-mode:

| Phase | AI Mode Activated |
|---|---|
| Intro / Icebreaker | Muted — no AI output (avoid distraction during rapport building) |
| Behavioral | New: **Behavioral Answer Mode** — generates STAR-structured responses |
| Problem Statement | New: **Problem Analyzer Mode** — identifies pattern, category, generates clarifying questions |
| Clarification | Continues Problem Analyzer — suggests additional questions to ask |
| Approach Discussion | New: **Approach Advisor Mode** — suggests brute-force + optimal strategies |
| Coding | New: **Code Copilot Mode** — provides solution code, detects bugs via screenshot |
| Testing | New: **Test Case Generator Mode** — suggests edge cases, provides dry-run walkthrough |
| Follow-Up | New: **Follow-Up Adapter Mode** — adapts existing solution to new constraints |
| Q&A / Wrap-Up | New: **Q&A Generator Mode** — generates thoughtful questions based on interviewer's team/role/topics mentioned |

### 1.3 Manual Phase Override

- Single keybind: **Cmd+Shift+P** — cycles through phases manually if auto-detection gets it wrong.
- This is the only keybind needed for the entire phase system.

---

## 2. Pre-Interview Preparation Suite

**Priority: Very-High**  
**Type: Enhancement of existing Premium features + new features**

### 2.1 Interview Prep Dashboard (Launcher Screen)

- When a Google Calendar event tagged as "interview" is upcoming, the Launcher shows a dedicated **Interview Prep Card** with:
  - Company name, role, interviewer name (extracted from calendar event)
  - Time remaining until interview
  - Checklist of prep items completed (resume uploaded, JD analyzed, company researched, practice problems done)
  - One-click "Enter Interview Mode" that starts the meeting session with all interview-specific AI modes pre-activated

### 2.2 Company-Specific Intelligence Package

**Priority: High**  
**Enhancement of existing Premium company research feature**

- Before the interview, auto-generate a focused intelligence package:
  - **Interview style analysis**: What format does this company use? (e.g., Google = evolutionary follow-ups, whiteboard/doc coding, Googliness round)
  - **High-frequency problem patterns**: Based on aggregated data from the JD and role level, identify the most likely topic areas (e.g., "L3 Google SWE → arrays/strings 30%, trees/graphs 30%, DP 15%, heaps 10%, backtracking 15%")
  - **Interviewer context**: If interviewer name is in the calendar invite, search for their team/product area to help generate relevant Q&A questions later
- This data is injected into the RAG context for all AI modes during the interview so responses are company-aware.

### 2.3 Resume-JD Gap Analyzer

**Priority: High**  
**Enhancement of existing Premium resume/JD upload**

- After both resume and JD are uploaded, generate a **gap analysis**:
  - Skills mentioned in JD but missing from resume → suggest talking points to bridge the gap
  - Behavioral question predictions based on JD keywords (e.g., JD says "fast-paced" → predict "Tell me about a time you worked under a tight deadline")
  - Technical depth areas where the candidate should brush up
- This becomes available as a RAG-queryable document during the live interview for instant recall.

---

## 3. Problem Detection & Clarification Assistant

**Priority: Very-High**  
**Type: New AI mode**

### 3.1 Auto Problem Capture

- **Screen capture trigger**: When the phase classifier detects "Problem Statement" phase, automatically take a screenshot of the shared screen (using existing `ScreenshotHelper`) to capture the problem text.
- **OCR extraction**: Use existing `tesseract.js` to extract problem text from the screenshot.
- **Audio extraction**: Simultaneously capture the problem statement from the interviewer's audio transcript.
- **Fusion**: Merge screen-captured text and audio transcript to build a complete problem statement, resolving any gaps between what was spoken and what was pasted.
- The captured problem statement is pinned at the top of the overlay for reference throughout the interview.

### 3.2 Problem Pattern Identifier

- Once the problem is captured, instantly classify it into one or more algorithmic patterns:
  - Two Pointers / Sliding Window
  - Hash Map / Hash Set
  - Binary Search (on array or on answer)
  - Stack / Monotonic Stack
  - Tree/Graph traversal (BFS/DFS)
  - Dynamic Programming (1D/2D/state)
  - Backtracking
  - Heap / Priority Queue
  - Trie
  - Union-Find
  - Prefix Sum
  - Topological Sort
  - Divide and Conquer
- Display the identified pattern(s) as a subtle badge on the overlay (e.g., `[Two Pointers] [Binary Search]`).
- Confidence score shown — if uncertain, show top 2-3 candidates.

### 3.3 Clarifying Questions Generator

- Auto-generate a prioritized list of clarifying questions the candidate should ask, based on the detected problem:

| Category | Example Questions Generated |
|---|---|
| **Input constraints** | "What's the size of the input? Can it be up to 10^5 or larger?" |
| **Data types** | "Can values be negative? Are they integers or floats?" |
| **Edge cases** | "What if the input is empty? What about a single element?" |
| **Duplicates** | "Can there be duplicate values? Do they matter?" |
| **Sorted/Unsorted** | "Can I assume the input is sorted?" |
| **Output format** | "Should I return the indices or the values?" |
| **Problem-specific** | Context-dependent questions based on the identified pattern |

- Questions are displayed as a scrollable checklist — user can glance at them and check off as they ask each one.
- As the interviewer answers each question, the platform captures the constraints and updates the pinned problem statement automatically.

---

## 4. Approach Advisor

**Priority: Very-High**  
**Type: New AI mode**

### 4.1 Brute Force Scaffold

- As soon as the problem is understood (clarification phase ends, approach phase begins), auto-generate:
  - A concise brute-force approach description
  - Time and space complexity of the brute force
  - A brief "script" the user can say aloud: e.g., *"The brute force would be O(n²) using nested loops. For each element, I scan the rest of the array..."*
- This ensures the candidate always has a baseline to articulate, preventing the common failure of jumping straight to optimal and ending with nothing.

### 4.2 Optimal Approach Suggestion

- After the brute force is shown, auto-generate:
  - The optimal approach with the specific data structure/technique (e.g., "Use a monotonic stack to track unresolved elements")
  - Clear explanation of WHY this optimization works (the "key insight")
  - Time and space complexity comparison vs. brute force
  - A natural "transition script": *"But since n can be 10^5, O(n²) is too slow. I notice the LIFO pattern here suggests a stack. Let me walk through how a monotonic stack would work..."*
- If multiple viable approaches exist, rank them by optimality and show the top 2.

### 4.3 Complexity Reference Card

- Display a small, always-visible complexity card on the overlay during the approach/coding phases:
  - Current approach's time/space complexity
  - Whether it meets the constraint requirements (green checkmark if O(n) and n ≤ 10^5, red X if O(n²) and n ≤ 10^5)
  - Common complexity thresholds: 10^5 → O(n log n) or better, 10^6 → O(n) or better, etc.

---

## 5. Live Coding Copilot

**Priority: Very-High**  
**Type: New AI mode (significant new feature)**

### 5.1 Solution Code Generation

- Based on the agreed-upon approach (from Phase 4), generate a complete, clean solution in the candidate's preferred language (auto-detected from transcript or pre-configured).
- Code is displayed in the overlay with syntax highlighting (existing `react-syntax-highlighter`).
- Code follows interview-quality standards:
  - Clean variable names
  - Concise but readable
  - Edge cases handled at function boundaries
  - No unnecessary imports or boilerplate
  - Comments only at critical decision points (not every line — interviewers find over-commenting suspicious)

### 5.2 Periodic Screen Capture & Code Diff

**Priority: High**

- During the coding phase, periodically capture screenshots of the shared coding environment (every 10-15 seconds when screen content changes).
- OCR-extract the candidate's code from the screen.
- Compare what the candidate has typed vs. the suggested solution to:
  - **Detect bugs**: Highlight potential off-by-one errors, missing edge cases, incorrect loop bounds
  - **Detect missing pieces**: Show what the candidate hasn't written yet
  - **Show gentle nudges**: e.g., "You may be missing the boundary check for `left > right`"
- Nudges appear as subtle inline annotations on the overlay — not intrusive.

### 5.3 "Think Aloud" Script Generator

**Priority: High**

- As the candidate codes, generate contextual narration prompts that the candidate can say aloud:
  - When writing a function signature: *"I'm defining a function that takes [params] and returns [type]"*
  - When writing a loop: *"I'm iterating through the array. For each element, I'm checking..."*
  - When handling edge cases: *"Let me handle the edge case where the input is empty — I'll return [default] immediately"*
  - When choosing a data structure: *"I'm using a hash map here because we need O(1) lookup for..."*
- This addresses the #1 interview failure pattern: **silent coding**.
- The narration is contextual — it reads from the actual code being written (via screen capture), not generic templates.

### 5.4 Copy Code Block

- One-click (or keybind) to copy any displayed code block to clipboard for pasting into the shared editor.
- Existing keybind can be reused: **Cmd+C** on focused code block in overlay.

---

## 6. Testing & Dry-Run Assistant

**Priority: High**  
**Type: New AI mode**

### 6.1 Auto Test Case Generator

- Once the coding phase ends (detected by phase classifier or manually triggered), generate:
  - **Basic test case**: The example given by the interviewer
  - **Edge cases**: Empty input, single element, all same values, maximum/minimum values, sorted/reverse sorted
  - **Adversarial case**: Worst-case input for the candidate's approach (e.g., strictly decreasing for a stack-based solution)
- Each test case shows the expected output.

### 6.2 Dry-Run Walkthrough

- For the basic test case, generate a step-by-step variable trace that the candidate can narrate:
  - Show the state of key variables at each iteration
  - Highlight when the answer is updated
  - Confirm the final output matches the expected result
- Format matches what interview simulations show as ideal: a line-by-line trace with state annotations.

### 6.3 Bug Alert

- If the dry-run walkthrough reveals a discrepancy between expected and actual output, raise a gentle alert:
  - "The trace shows the output would be X, but expected Y. Check the condition at the `while` loop — it may need `<=` instead of `<`."
- This catches the bugs before the interviewer does, allowing the candidate to self-correct (a strong positive signal).

---

## 7. Follow-Up Adaptation Engine

**Priority: Very-High**  
**Type: New AI mode**

### 7.1 Follow-Up Detection

- Interviews (especially Google) are built on evolutionary follow-ups. The engine auto-detects when a follow-up is posed:
  - "What if we add a constraint..."
  - "How would you handle streaming data?"
  - "Can you optimize this further?"
  - "Now suppose the input is too large for memory"
  - "What if we need the top K results instead of just one?"

### 7.2 Adapted Solution Generation

- When a follow-up is detected:
  1. Identify what changed (new constraint, scaling requirement, generalization)
  2. Determine if the existing solution can be modified or if a fundamentally new approach is needed
  3. Generate the adapted solution with:
     - What to say about the modification: *"The core logic of the monotonic stack still applies. The key change is..."*
     - The code delta — what to add/change in the existing code
     - New complexity analysis
  4. If the follow-up is a common pattern (static → streaming, single → top-K, 1D → 2D), use pattern-specific templates for faster, more accurate suggestions

### 7.3 "I Don't Know" Graceful Recovery

**Priority: High**

- If the follow-up is extremely hard and the AI determines the candidate may not be able to fully solve it:
  - Generate a "partial credit" response: *"I can see this relates to [concept]. The high-level approach would be [X], which would give us [complexity]. I'd need to think more carefully about the implementation details of [specific tricky part], but the key insight is..."*
  - This ensures the candidate still demonstrates analytical thinking even when they can't complete the solution — a known strong-hire signal.

---

## 8. Wrap-Up & Q&A Generator

**Priority: High**  
**Type: New AI mode**

### 8.1 Contextual Question Generator

- During the entire interview, the platform tracks:
  - Interviewer's name, team, product area, years at company (from intro)
  - Technical topics discussed
  - Company/team-specific mentions
- At the Q&A phase, generate 3-5 thoughtful questions tailored to the conversation:
  - Team-specific: *"You mentioned you work on [X]. How does [recent industry trend] affect your team's roadmap?"*
  - Role-specific: *"As an L3 joining [team], what does the onboarding ramp look like?"*
  - Technical curiosity: *"We discussed [algorithm/concept]. Does your team encounter similar optimization challenges in production?"*
- These are pre-generated and ready the instant the interviewer says "any questions for me?" — no lag.

### 8.2 Closing Statement Helper

- Generate a brief, professional closing: *"Thank you for your time, [Interviewer Name]. I really enjoyed working through the [problem topic] problem. Looking forward to hearing next steps."*
- Uses the interviewer's actual name captured from the transcript.

---

## 9. Communication Coach (Passive)

**Priority: High**  
**Type: Enhancement of existing intelligence engine — runs as background process**

### 9.1 Silence Detector

- Monitor the candidate's audio stream. If the candidate is silent for more than 60 seconds during a coding/approach phase:
  - Flash a subtle, non-distracting reminder on the overlay: **"Narrate your thinking"**
  - Optionally suggest what to say based on the current context: *"You could say: 'I'm considering whether a hash map would give me O(1) lookup here...'"*
- This directly addresses the #1 interview failure: silent coding.

### 9.2 Pace Monitor

- Track the elapsed time within each interview phase and compare against ideal time budgets:
  - Clarification: 3-5 min (warn if >7 min)
  - Approach discussion: 5-10 min (warn if >12 min)
  - Coding: 15-20 min (warn if >25 min)
  - Testing: 3-5 min
- Show a subtle progress bar or time indicator on the overlay.
- If a phase is running long, nudge: **"Consider wrapping up clarification and moving to approach"**

### 9.3 Filler Word & Hedging Detector

**Priority: High**

- Detect excessive use of hedging language ("I think maybe", "I'm not sure but", "this might work") and excessive filler words ("um", "uh", "like").
- When detected at high frequency, show a brief coaching nudge: **"Speak with confidence — state your reasoning assertively"**
- This runs as a background analysis on the candidate's transcript only, never interrupting flow.

---

## 10. Post-Interview Debrief & Growth

**Priority: High**  
**Type: New feature built on existing meeting persistence**

### 10.1 Interview Performance Scorecard

- After the meeting ends, auto-generate a detailed scorecard based on the transcript:

| Dimension | Analysis |
|---|---|
| **Clarification Quality** | Did the candidate ask about constraints, edge cases, input format? Count and quality of questions. |
| **Communication** | Ratio of speaking vs. silence during coding. Narration quality. |
| **Approach** | Did the candidate discuss brute force before optimal? Was complexity analysis provided? |
| **Code Quality** | Were edge cases handled? Variable naming quality. Code structure. |
| **Testing** | Did the candidate dry-run? Did they generate their own test cases? |
| **Follow-Up Handling** | How well were follow-up questions adapted? Did the candidate stay calm? |
| **Q&A** | Were questions asked at the end? Were they thoughtful and specific? |
| **Time Management** | Time spent in each phase vs. ideal distribution. |

- Each dimension gets a rating (Needs Work / Good / Strong / Exceptional) with specific evidence from the transcript.

### 10.2 Topic Gap Identification

- Based on what problems were asked and how the candidate performed, identify:
  - Topics the candidate was strong on
  - Topics where the candidate struggled
  - Specific patterns to practice (e.g., "Monotonic stack follow-ups", "Binary search on answer space")
- Persist this data across interviews to build a longitudinal skill profile.

### 10.3 Improved Answer Generator

- For every question the candidate struggled with, generate:
  - The ideal answer (what they should have said)
  - A side-by-side comparison of their actual response vs. the ideal
  - Key concepts to study for next time
- This becomes a personalized study guide stored in the RAG system for future interview prep.

---

## 11. Overlay UX Enhancements for Interviews

**Priority: High**  
**Type: Enhancement of existing Overlay window**

### 11.1 Interview Mode Layout

- When "Interview Mode" is activated (auto-detected or manual), the overlay reorganizes:
  - **Top bar**: Current phase indicator + timer (e.g., `[Coding] 12:34 elapsed`)
  - **Main panel**: AI suggestions (contextual to current phase)
  - **Pinned section**: Problem statement + constraints (always visible, collapsible)
  - **Bottom bar**: Pattern badge + complexity card
- All sections are collapsible with a single click to maximize the main AI panel when needed.

### 11.2 Smart Auto-Scroll & Content Prioritization

- In the current overlay, AI responses stream in and old content scrolls away. For interviews, this needs to be smarter:
  - **Pin important content**: Problem statement, clarifying questions checklist, and current code suggestion are always accessible.
  - **Phase-aware content**: When phase changes, old phase content gracefully collapses and new phase content takes priority.
  - **History scrubbing**: Cmd+Up/Down (existing) to scroll through past suggestions within the current interview.

### 11.3 Minimal Distraction Mode

- During the coding phase, auto-minimize the overlay to just a thin bar showing:
  - Current phase + timer
  - A one-line summary of the current suggestion (e.g., "Use monotonic stack → O(n)")
  - Expand on hover or keybind to see full suggestion
- This prevents the candidate from being caught staring at the overlay instead of the coding editor.

---

## 12. Keybind Summary

The entire interview feature set operates with a maximum of 3 new keybinds on top of existing ones:

| Keybind | Action | Context |
|---|---|---|
| **Cmd+B** (existing) | Toggle overlay visibility | Global — hide/show the assistant |
| **Cmd+1** (existing) | "What to Answer" — now context-aware per phase | During interview — triggers phase-appropriate AI |
| **Cmd+H** (existing) | Take screenshot | Capture problem statement or code from screen |
| **Cmd+Shift+P** (new) | Cycle interview phase manually | Override auto-detected phase if wrong |
| **Cmd+Shift+I** (new) | Toggle Interview Mode on/off | Activates all interview-specific features |
| **Cmd+4** (existing) | Recap | Still works — generates meeting recap |

**Design philosophy**: Everything else is auto-triggered. The phase detection engine, problem analyzer, approach advisor, code copilot, test generator, follow-up adapter, and Q&A generator all activate based on conversation context. The user focuses on the interview — the platform adapts silently behind them.

---

## Implementation Priority Matrix

| Feature | Priority | Depends On | Effort |
|---|---|---|---|
| 1.1 Phase Classifier | Very-High | Existing IntentClassifier | Medium — extend NLI labels |
| 1.2 Auto-Mode Routing | Very-High | Phase Classifier | Medium — wiring + new mode handlers |
| 3.1 Auto Problem Capture | Very-High | Existing Screenshot + OCR | Low — orchestration of existing tools |
| 3.2 Problem Pattern Identifier | Very-High | Problem Capture | Medium — LLM prompt engineering |
| 3.3 Clarifying Questions Generator | Very-High | Problem Pattern Identifier | Low — LLM prompt |
| 4.1 Brute Force Scaffold | Very-High | Problem understanding | Low — LLM prompt |
| 4.2 Optimal Approach Suggestion | Very-High | Brute Force Scaffold | Medium — requires pattern-specific prompts |
| 7.1 Follow-Up Detection | Very-High | Phase Classifier | Low — transcript pattern matching |
| 7.2 Adapted Solution Generation | Very-High | Follow-Up Detection + existing code context | Medium |
| 5.1 Solution Code Generation | Very-High | Approach Advisor | Medium — language-aware code gen |
| 5.2 Periodic Screen Capture & Code Diff | High | Existing Screenshot + OCR | High — diff engine + periodic capture loop |
| 5.3 Think Aloud Script | High | Screen capture of code | Medium |
| 6.1 Test Case Generator | High | Solution code context | Low — LLM prompt |
| 6.2 Dry-Run Walkthrough | High | Test cases + solution code | Medium |
| 9.1 Silence Detector | High | Existing audio pipeline | Low — VAD analysis |
| 9.2 Pace Monitor | High | Phase Classifier + timer | Low |
| 2.1 Interview Prep Dashboard | Very-High | Existing Calendar integration | Medium — new UI component |
| 2.2 Company Intelligence Package | High | Existing Premium company research | Medium — enhanced prompts |
| 8.1 Q&A Generator | High | Transcript context during interview | Low — LLM prompt |
| 10.1 Performance Scorecard | High | Existing meeting persistence | Medium — post-processing pipeline |
| 10.2 Topic Gap Identification | High | Performance Scorecard | Low |
| 11.1 Interview Mode Layout | High | Phase Classifier | High — UI rework |
| 11.3 Minimal Distraction Mode | High | Interview Mode Layout | Medium |
| 4.3 Complexity Reference Card | High | Approach Advisor | Low — static UI + dynamic values |
| 7.3 Graceful Recovery | High | Follow-Up Adapter | Low — LLM prompt |
| 9.3 Filler Word Detector | High | Existing transcript | Low — pattern matching |

---

## Architecture Notes

### How This Fits Into the Existing System

1. **Phase Classifier** → Extends `IntentClassifier.ts` with a new classification task: `classifyInterviewPhase(transcript)`. Can use the same bundled ONNX model with new candidate labels or a lightweight LLM call.

2. **New AI Modes** → Each new mode (Problem Analyzer, Approach Advisor, Code Copilot, Test Generator, Follow-Up Adapter, Q&A Generator) follows the same pattern as existing modes in `electron/llm/`. Each gets:
   - A new prompt in `prompts.ts`
   - A new LLM class in `electron/llm/` (e.g., `ProblemAnalyzerLLM.ts`, `ApproachAdvisorLLM.ts`)
   - Registration in `IntelligenceEngine.ts` as new modes alongside the existing 6

3. **Auto-Mode Routing** → `IntelligenceEngine.ts` gains an `InterviewModeRouter` that listens to phase transitions from the Phase Classifier and auto-triggers the appropriate mode, bypassing the manual keybind trigger.

4. **Problem Capture** → Orchestrates existing `ScreenshotHelper` + `tesseract.js` OCR + live transcript fusion. Result stored in `SessionTracker` as a pinned context item.

5. **Pre-Interview Dashboard** → New React component in `src/components/` that queries `CalendarManager` for upcoming interview events and renders the prep checklist. Links to existing Premium features (resume/JD upload, company research).

6. **Post-Interview Scorecard** → Extends `MeetingPersistence.ts` to run a specialized LLM analysis pass after the interview ends, generating the scorecard JSON stored alongside the meeting in SQLite.

7. **Communication Coach** → Runs as a background analysis loop in `SessionTracker`, monitoring the candidate's transcript stream for silence, pacing, and filler word patterns. Emits events to the overlay for subtle nudges.
