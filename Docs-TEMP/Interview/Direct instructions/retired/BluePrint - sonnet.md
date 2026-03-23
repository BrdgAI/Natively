# Google US L3 Coding Interview — Concrete Interviewee Blueprint
> A minute-by-minute action guide with ideal behaviors, decision trees, and alternate-scenario playbooks  
> Based on deep research across LeetCode Discuss, Blind, Reddit, 1point3acres, IGotAnOffer, Glassdoor, Medium, and candidate post-mortems (2022–2025)

---

## Quick Reference: The Core Principle

> **You are not just solving a problem. You are demonstrating that you are someone a Google engineer would enjoy working with.**

The interview evaluates you on four pillars equally:
1. **Communication** — Can they follow your thinking?
2. **Problem-solving** — Do you break problems down logically?
3. **Code quality** — Does your code look production-ready?
4. **Technical knowledge** — Do you know your algorithms and complexity?

Getting the right answer while being silent, rushed, or sloppy is worth less than a partially-correct solution delivered with clarity, structure, and collaborative energy.

---

## The 45-Minute Master Blueprint

> **True usable time: ~36–38 minutes.** Intros (5 min) + closing Q&A (3–5 min) consume the edges. Plan your 6 phases to fit within that real window.

```
[ 0:00 – 0:05 ] → PHASE 1: Warm-Up & Introductions
[ 0:05 – 0:10 ] → PHASE 2: Problem Reception & Clarification  
[ 0:10 – 0:18 ] → PHASE 3: Approach Discussion & Alignment
[ 0:18 – 0:35 ] → PHASE 4: Coding (The Build)
[ 0:35 – 0:42 ] → PHASE 5: Testing, Edge Cases & Complexity Analysis
[ 0:42 – 0:45 ] → PHASE 6: Follow-ups, Closing & Q&A
```

---

## PHASE 1 — Warm-Up & Introductions (Minutes 0–5)

### What's happening:
The interviewer joins, introduces themselves briefly, and gives you a minute or two to introduce yourself. This feels casual but it matters — it sets the social tone. Google interviewers are looking for people they'd enjoy collaborating with daily.

### ✅ What you SHOULD do:

**Prepare a crisp 60–90 second intro.** Don't ramble. Mention: your current role/education, one or two relevant technical projects/experiences, and a brief forward-looking hook ("I've been deepening my work in distributed systems / backend infra / ML infra and I'm really excited about X at Google").

**Be warm, genuine, and relaxed.** Treat it like meeting a new teammate. Smile (even on video — it comes through in voice tone). Light conversational energy is ideal. Do NOT robotically jump straight to "I'm ready for the question."

**Listen carefully when they introduce themselves.** They will often casually mention the team they're on or the kind of problems they work on. This can give you a small signal about what type of question may be coming and gives you material for your closing Q&A.

**If they ask about your background, use "I" statements.** Never "we built a system that..." — always "I designed and implemented..."

### ❌ What you should NOT do:
- Over-talk and eat into the problem time — keep intro to 60–90 seconds maximum
- Be stiff, formal, or visibly nervous
- Immediately say "I'm ready, please give me the problem" before they invite it
- Lie or exaggerate about your experience — the follow-up questions will expose it

### ⚠️ Alternate scenario — Fast-moving interviewer:
Some interviewers skip pleasantries and jump directly to the question within the first 2 minutes. This is normal and not a bad sign. Don't try to force small talk. Simply match their energy, switch to professional mode, and go straight into Phase 2. Adaptability is itself a signal.

---

## PHASE 2 — Problem Reception & Clarification (Minutes 5–10)

### What's happening:
The interviewer gives you the problem statement, usually verbally and typed in the shared Google Doc. This is the most skipped and most critical phase. Rushing past it is one of the top-cited rejection reasons.

### ✅ What you SHOULD do:

**Step 1 — Read and listen fully before speaking.** Don't interrupt. Let them finish the entire problem statement. Take a breath. Now reread it silently.

**Step 2 — Restate the problem in your own words.** Out loud, say: *"Let me make sure I understand what we're doing here..."* Then paraphrase it back. This does three things: confirms your understanding, shows you can synthesize information clearly, and buys you thinking time.

**Step 3 — Ask structured clarifying questions.** Work through these categories systematically (not randomly):

```
INPUT:
  - What is the size/range of the input? (N = 10? 10^5? 10^9?)
  - What are the value ranges? (Can values be negative? Zero? Float?)
  - Can the input be empty or null?
  - Can there be duplicates?
  - Is the input sorted? Sorted in any particular way?

OUTPUT:
  - What exactly should be returned? (Index? Value? Count? Boolean?)
  - If multiple valid answers exist, do we return any one? Or all? Or a specific one?

CONSTRAINTS:
  - Are there memory constraints I should be aware of?
  - Is there a strict time complexity requirement?
  - Should the solution handle concurrent access? (Usually: no, for L3 coding rounds)

EDGE CASES (state your assumptions):
  - "I'll assume input won't be null/empty unless specified — is that okay?"
  - "I'll assume all integers fit in 32-bit signed integers — is that right?"
```

**Step 4 — Write down key constraints as comments in the doc.** As real candidates have advised: use multiline comments to capture everything the interviewer confirms. This serves as your written spec and helps you think of more questions as you type.

```python
# Input: list of N integers (1 ≤ N ≤ 10^5)
# Values: -10^4 ≤ arr[i] ≤ 10^4 (can be negative)
# No duplicates
# Return: index of the target, -1 if not found
# Edge cases: empty list → return -1
```

**Step 5 — Work through 1–2 concrete examples together.** Especially if the problem is ambiguous (long statement, real-world scenario). Say: *"Let me trace through a quick example to make sure I have the right mental model..."* Then write it in the doc. The interviewer will correct you if you're wrong — which is valuable.

### ❌ What you should NOT do:
- Start coding immediately — even if the problem seems obvious
- Ask questions in a scattered, disorganized way
- Ask generic questions that show you didn't read the problem
- Assume inputs are always valid without confirming
- Spend more than 5 minutes here — 3–5 meaningful clarifying questions is the target

### ⚠️ Alternate scenario — Extremely brief problem statement:
Sometimes the problem is short and seemingly simple ("Given an array, return the k-th largest element"). Don't skip clarification just because it seems easy. Even then, confirm: "Can there be duplicates? Can k exceed array size? Should I modify the array in place?" Simple problems often have follow-ups that hinge on exactly these details.

### ⚠️ Alternate scenario — Very long/convoluted problem:
Some Google problems are intentionally described in paragraphs with domain-specific language. If you feel confused: say so clearly and without embarrassment: *"This problem statement is quite detailed — let me take a moment to parse it and will ask follow-up questions as I go."* Read slowly. Trace through the example inputs given. Ask targeted questions. One candidate had a real interview where it took 5 minutes just to understand the question — and still passed because they communicated their confusion clearly and systematically worked through it.

---

## PHASE 3 — Approach Discussion & Alignment (Minutes 10–18)

### What's happening:
This is where most candidates earn or lose Hire vs. Strong Hire. You are NOT coding yet. You are demonstrating your problem-solving intelligence by thinking through multiple approaches out loud and justifying your chosen solution before writing a single line.

### ✅ What you SHOULD do:

**Step 1 — Think out loud from the very beginning.** Even if you have no idea yet, start narrating: *"My first instinct is to think about brute force here — if I try every pair, that would be O(n²). Let me think about whether we can do better..."* The goal is to make your thinking visible. Interviewers are literally grading your thought process, not just the answer.

**Step 2 — Always start with brute force.** State it, say its complexity, and say why it's suboptimal. This demonstrates baseline competence. Then optimize. Never jump directly to the optimal solution without acknowledging the brute force path — you'll have no room to show your optimization journey.

*Example phrasing:*
> "The naive approach would be to check every pair, giving us O(n²) time and O(1) space. That's too slow for n = 10^5. So I want to think about whether there's a way to trade some space for time..."

**Step 3 — Explore 1–2 alternative approaches before committing.** Ideally contrast a simpler approach with your optimal one: explain what each buys and costs in terms of time/space/code complexity. This shows engineering maturity. *"I could use a min-heap for O(n log k), or if I use Quickselect it's O(n) average. Given we don't have strict worst-case guarantees, the heap approach is safer here."*

**Step 4 — State your chosen approach clearly and explain WHY.** The interviewer should understand your decision before you write code. Eliminate ambiguity.

**Step 5 — Confirm alignment before coding.** Say: *"Does this approach make sense to you? Should I proceed with implementation?"* or *"I'm thinking of going with [X] — does that direction seem reasonable before I start coding?"*

This is important. It's a collaborative signal. It also ensures you don't code the wrong thing for 15 minutes.

**Step 6 — State time and space complexity of your planned approach.** Before touching code: *"This should give us O(n log n) time and O(n) space — is that acceptable?"*

### ❌ What you should NOT do:
- Jump to the optimal solution without explaining the thought process
- Silently think for more than 30 seconds without narrating anything
- Ask "is this the right approach?" in a way that sounds like you need validation — frame it as alignment, not insecurity
- Over-engineer — don't propose a segment tree when a hash map suffices
- Commit to an approach without the interviewer's implicit or explicit buy-in

### ⚠️ Alternate scenario — You have no idea where to start:
This happens. Don't panic. Use the following strategy:

1. **Narrate what you DO know:** *"Okay, the problem is asking for a shortest path — that immediately makes me think BFS or Dijkstra's depending on the weights..."*
2. **Enumerate your DS/algorithm toolkit out loud:** *"The key constraint here is N = 10^9... that rules out O(n²)... probably needs binary search or some kind of mathematical observation..."*
3. **Ask a hint-seeking question without directly asking for a hint:** *"Is there any property of the input I should be leveraging that I might be overlooking?"* — interviewers will often point you in the right direction
4. **If still stuck, go with brute force and say so:** *"I'll start with the brute force since I want to make sure I have something working, and I'll optimize from there."*

Never sit in silence. Never. Even wrong directions are better than silence.

### ⚠️ Alternate scenario — The interviewer proactively points you toward an approach:
Take the hint. Immediately. Say: *"Oh, that's a great observation — so you're suggesting I look at [X]? Let me think about how that would work..."* Candidates who resist hints or stubbornly stick to their wrong approach score very poorly. Adapting to guidance is itself a signal they are testing for.

---

## PHASE 4 — Coding (Minutes 18–35)

### What's happening:
You are writing the actual code in a plain Google Doc (no auto-complete, no syntax highlighting, no running/testing). This is where your code quality, speed, and communication under pressure are all evaluated simultaneously.

### ✅ What you SHOULD do:

**Step 1 — Write a skeleton / top-down structure first.** Especially for complex problems: define your function signatures, identify helper functions you'll need, and write comments as placeholders for what each section will do. This is the "top-down coding" approach recommended by Google engineers:

```python
def find_path(graph, start, end):
    # Step 1: BFS from start
    # Step 2: Track visited + parent map
    # Step 3: Reconstruct path from parent map
    ...
```

**Step 2 — Name everything meaningfully.** Variable names must be readable:
- ✅ `visited_nodes`, `current_distance`, `neighbor`, `result`
- ❌ `v`, `d`, `n`, `res`  

One-letter variables are fine ONLY for universally understood idioms (`i`, `j` for loop indices, `n` for length).

**Step 3 — Keep narrating as you code.** Don't go silent for long stretches. Light commentary is enough: *"I'm initializing the queue with the start node... here I'm processing each level of BFS... I'm tracking the shortest distance in this dictionary..."*

**Step 4 — Write modular code.** Extract helper functions where it makes sense. This shows production-code thinking. If you need to find neighbors of a node, write a `get_neighbors()` function instead of inlining it in the main loop.

**Step 5 — Add brief, purposeful comments.** Not every line — just non-obvious logic:
```python
# Use modulo to avoid integer overflow in large inputs
# This ensures we only process each node once
```

**Step 6 — Code the happy path first.** Get the main logic working before handling edge cases. You can add edge case handling at the top after the core logic is down. This ensures you complete something meaningful if time is tight.

**Step 7 — If you make a mistake, acknowledge it calmly and fix it.** Say: *"Wait, I think I have an off-by-one here — let me fix that..."* Don't panic. Don't apologize excessively. Just correct and move on. This shows grace under pressure.

**Step 8 — Manage your own pacing.** At the ~25 minute mark (roughly 7 minutes into coding), do a quick self-check: *"Am I on track to finish the main logic in the next 5–7 minutes?"* If not, consider cutting scope (go to a simpler correct approach vs. an incomplete optimal one) or speed up.

### Code Quality Checklist (internalize this):
```
□ Meaningful variable and function names
□ Functions are short and single-purpose  
□ No hardcoded magic numbers (use named constants)
□ Edge cases handled (empty input, null, single element)
□ No unnecessary nested loops if avoidable
□ Consistent indentation and spacing
□ Comments only where logic isn't self-evident
```

### ❌ What you should NOT do:
- Code silently for more than 60 seconds without narrating anything
- Use shorthand variable names throughout
- Write everything in a single massive function
- Implement things you haven't discussed — if you change direction mid-coding, say so
- Panic-delete large chunks and start over — instead, comment out and annotate
- Try to be clever at the cost of clarity (no one-liner hacks)

### ⚠️ Alternate scenario — Running out of time:
If you're at minute 32 and not done: **do not rush silently**. Say: *"I'm noticing I'm running a bit short on time. Let me prioritize finishing the core logic and I can describe the remaining parts verbally."* Then write the critical code path and use English comment-stubs for remaining helper functions. Explaining what you would write is better than running out of time with broken code.

### ⚠️ Alternate scenario — Completely stuck mid-code:
If you hit a wall during implementation (e.g., you realize your approach has a flaw):
1. Stop coding
2. State the issue clearly: *"I'm realizing this approach has a problem — I'm not handling the case where..."*
3. Ask: *"Do you want me to patch this specific issue, or should I reconsider the approach?"*
4. The interviewer will guide you. Take the guidance.

### ⚠️ Alternate scenario — Question seems to require two separate coding problems:
Rarely, an interviewer will give a shorter first problem and follow up with a second distinct problem once you finish (not just a variant follow-up). If this happens: pace yourself even more aggressively. Aim to finish the first problem in 18–20 minutes. Signal readiness for the follow-up when done.

---

## PHASE 5 — Testing, Edge Cases & Complexity Analysis (Minutes 35–42)

### What's happening:
This phase is where many candidates lose points by treating it as optional. Proactively testing and analyzing your solution is one of the strongest signals you can send — it demonstrates engineering maturity and saves the interviewer the awkward job of finding your bugs.

### ✅ What you SHOULD do:

**Step 1 — Announce that you're going to test before doing so.** Say: *"Let me trace through this with a concrete example to verify correctness."* This signals intentionality.

**Step 2 — Trace through the happy path first.** Pick a simple, clear example and manually walk through your code line by line in the doc:
```
Input: [3, 1, 4, 1, 5, 9], target = 5
→ Initialize queue = [0], visited = {0}
→ Process node 0: neighbors [1, 2]...
→ ...
→ Output: 4 ✓
```

**Step 3 — Then test edge cases. Explicitly.** Call these out one by one:
- Empty input: *"If the list is empty, my function returns -1 immediately on line 3 — that handles it."*
- Single element: *"If n = 1 and the target is that element, we return 0 — let me trace that..."*
- All duplicates: *"If all values are the same..."*
- Minimum/maximum values (boundary inputs)
- Negative values (if applicable)
- The target not existing in the input

**Step 4 — Fix any bugs you find calmly.** If you spot an error: *"Ah — I see a problem here. If the array has only one element, my loop condition on line X would fail. Let me fix that..."* Then fix it. This is excellent signal. Finding and fixing your own bugs > having the interviewer point them out > leaving bugs in.

**Step 5 — State time and space complexity.** Even if you did it earlier, re-confirm it now with your actual implemented code in view:
- *"The time complexity is O(n log n) due to the sorting step. The rest is O(n)."*
- *"Space complexity is O(n) for the hash map."*

If you can optimize, offer it: *"I could reduce space to O(1) if we modify the input array in place — should I do that?"*

**Step 6 — Offer to discuss tradeoffs if you chose one approach over another.** This is a bonus signal: *"I chose BFS over DFS here because BFS guarantees shortest path in unweighted graphs — DFS would give A path but not necessarily the shortest."*

### ❌ What you should NOT do:
- Skip testing because you feel confident — overconfidence without verification is a red flag
- Test only the happy path and nothing else
- Wait for the interviewer to find bugs without first trying to find them yourself
- State incorrect complexity — if you're unsure, say so and reason through it out loud

### ⚠️ Alternate scenario — The interviewer finds a bug before you:
This happens. Don't panic. Don't be defensive. Say: *"Good catch — let me think about why that's failing..."* Then trace through it, understand the root cause, and fix it. Composure + correctness of fix matters more than having had zero bugs.

### ⚠️ Alternate scenario — You realize your entire approach is flawed during testing:
This is rare but happens. If it does:
1. State it honestly: *"I'm realizing there's a fundamental issue with this approach — it won't handle [case X]."*
2. Take a breath.
3. Pivot: propose a corrected approach, even if you can only describe it at this stage.
4. If time allows, implement it or at least pseudocode it.
Getting to the realization + proposing a correct fix is a salvageable position.

---

## PHASE 6 — Follow-ups, Closing & Q&A (Minutes 42–45)

### What's happening:
Almost every Google round ends with one or more follow-up questions. These can be optimization challenges, constraint changes, or scale/generalization extensions. The Q&A at the end is your chance to leave a strong final impression.

### ✅ What you SHOULD do:

**Step 1 — Anticipate and be ready for follow-ups.** Common follow-up patterns:
- *"Can you optimize the time/space complexity further?"*
- *"What if the input is a stream (doesn't fit in memory)?"*
- *"What if N is now 10^9 instead of 10^5 — how does your solution scale?"*
- *"Now also return all the elements that satisfy condition Y."*
- *"What if there are concurrent updates to the data?"*
- *"What if we need to support deletions as well?"*

For each: stop, think briefly (say *"interesting — let me think about that..."*), then reason out loud. You don't need to implement every follow-up — often the interviewer is probing for conceptual depth.

**Step 2 — When time is called, wrap up gracefully.** If a follow-up is in progress and time runs out, don't just stop awkwardly. Say: *"I know time is up — I'd sketch the optimization as [X] and the main tradeoff would be [Y]. Happy to discuss further if there's a moment."* This shows you know the direction even if you didn't finish.

**Step 3 — Ask your interviewer 1–2 questions.** You have prepared these in advance. Good questions:
- *"What does the first 6 months look like for an L3 joining your team?"*
- *"What's the biggest technical challenge your team is currently working on?"*
- *"What does code review culture look like on your team? How do you handle technical disagreement?"*
- *"What's the balance between greenfield projects and maintenance work on your team?"*

DO NOT ask about salary, benefits, remote policy, or promotion timelines with the technical interviewer. Save those for the recruiter.

**Step 4 — Close warmly.** Thank them sincerely. *"Thanks so much — I really enjoyed this problem. I found the [X aspect] particularly interesting."* Genuine, brief, and human.

### ❌ What you should NOT do:
- Act relieved that it's over and visibly relax before the Q&A
- Ask no questions — it signals disinterest in the team/role
- Ask generic, Google-size questions like "What do you like about working at Google?" (Too broad; hard to give a good answer and doesn't show curiosity about their specific team)
- Argue with the interviewer about whether your approach was correct after they've given feedback

---

## Decision Trees for Key Situations

### 🌲 When You're Stuck on the Approach

```
Are you stuck? 
│
├─ Yes: Have you tried brute force?
│    │
│    ├─ No → State brute force approach, even if slow
│    │
│    └─ Yes → Try these unlocking moves IN ORDER:
│         1. Re-read constraints — what's special about the input?
│            (Sorted? Bounded range? Graph structure? Powers of 2?)
│         2. Work backwards — what does the ideal output tell you?
│         3. Enumerate DS patterns: Hash map? BFS? DP? Two pointers? Binary search?
│         4. Ask a non-direct hint: "Is there a property of the input I should be using?"
│         5. If still stuck after 2+ minutes: directly ask for a hint
│              Say: "I'm a bit stuck here — could you give me a small nudge?"
│
└─ No → Keep going. State your approach and proceed to Phase 4.
```

### 🌲 When the Interviewer Gives a Hint

```
Did the interviewer give a hint or correction?
│
├─ Take it IMMEDIATELY — never resist or ignore
├─ Acknowledge it: "That's a good point / That's helpful — let me incorporate that..."
├─ Rethink out loud with the hint in mind
└─ Thank them briefly and proceed — don't over-explain the pivot
```

### 🌲 When You Realize Mid-Code That Your Approach Is Wrong

```
Did you find a flaw in your approach?
│
├─ Is it a small bug? → Fix it calmly, announce what you're fixing
│
└─ Is it a fundamental flaw?
     │
     ├─ Yes → STOP coding immediately
     ├─ State the flaw clearly and without panic
     ├─ Say: "I think I need to reconsider the approach because [reason]"
     ├─ Propose the corrected direction
     └─ Ask: "Do you want me to restart with [new approach] or patch [specific issue]?"
```

### 🌲 When You're Running Out of Time

```
Are you past minute 32 and not finished?
│
├─ Announce it: "I want to make sure I finish the key logic, so I'll prioritize the core."
├─ Write/finish the critical path first
├─ Use English comment-stubs for remaining parts:
│    # TODO: handle edge case where left child is null
│    # TODO: return result set sorted
├─ Verbally describe what those stubs would do
└─ If asked about optimization: describe it conceptually — "I would use a min-heap here instead..."
```

### 🌲 When the Interviewer Says "Got Enough Signal" Early

```
Did the interviewer say "I've seen enough — let's move on"?
│
├─ This is NEUTRAL — do NOT interpret as negative
├─ It often means they're satisfied and want to discuss complexity or a follow-up
├─ Respond: "Sure — happy to discuss complexity or take on a follow-up"
└─ Transition smoothly without seeking reassurance
```

---

## Behavior Cheat Sheet: Ideal vs. Common Mistake

| Moment | Ideal Behavior | Common Mistake |
|--------|---------------|----------------|
| Problem received | Restate it, ask structured clarifying questions | Jump straight to coding |
| Clarifying | Ask about constraints, edge cases, output format | Ask nothing, assume everything |
| Planning | Brute force → optimize → align with interviewer before coding | Skip to optimal, start coding without discussion |
| Thinking silently | Max 20–30 seconds, then narrate even partial thoughts | 2–5 minutes of total silence |
| Coding | Clean names, modular, narrate while writing | One-letter vars, monolith function, silence |
| Error found by interviewer | "Good catch — let me trace through that..." → fix calmly | Panic, apologize excessively, argue |
| Getting a hint | Take it immediately, incorporate it, acknowledge it | Ignore it, resist it, seem annoyed |
| Testing | Proactively test happy path + edge cases before asked | Wait for interviewer to find bugs |
| Complexity | State unprompted after implementation | Skip or only state when directly asked |
| Time running out | Announce, prioritize, use stubs + verbal description | Rush silently, leave broken code |
| Follow-up question | Engage, think out loud, reason conceptually even if no time to code | Shut down, say "I don't know" |
| Closing Q&A | Ask 1–2 specific, thoughtful questions about their team | Ask no questions, or ask about salary |

---

## Communication Phrases That Signal "Strong Hire"

Use these naturally — not robotically. They show you think like a senior engineer:

**During clarification:**
- *"Let me make sure I'm understanding the problem correctly..."*
- *"Before I start, I want to confirm — is it safe to assume...?"*
- *"What should happen in the edge case where the input is empty?"*
- *"Is there a memory constraint I should be designing around?"*

**During approach discussion:**
- *"The naive approach would be [X], giving O(n²). I think we can do better by..."*
- *"I see two ways to approach this — [A] trades time for space, [B] does the opposite. Given [constraint], I'll go with [B]..."*
- *"Does this approach make sense before I start coding?"*
- *"I want to make sure we're aligned on the direction before I start implementing."*

**During coding:**
- *"I'm creating a hash map here to avoid the O(n) lookup in the inner loop..."*
- *"I'll extract this into a helper function to keep things readable..."*
- *"This is intentional — I'm [doing X] because [reason]..."*

**During testing:**
- *"Let me trace through this with a concrete example..."*
- *"I should also check what happens when the input is empty..."*
- *"Ah — I see an issue here. If [edge case], my current code would [fail in this way]. Let me fix that..."*

**During complexity analysis:**
- *"The time complexity is O(n log n) — the sort dominates. Space is O(n) for the auxiliary structure."*
- *"I could reduce space to O(1) by modifying the input in place — want me to explore that?"*

**When stuck:**
- *"Let me think out loud here..."*
- *"I'm considering [X] but I'm not sure it handles [Y] correctly..."*
- *"I think I might need a hint here — could you point me in a direction?"*

**When receiving feedback:**
- *"That's a great point — let me rethink this part..."*
- *"I see — so the issue is [restate the issue]. Let me fix that."*

---

## Pre-Interview Day Checklist

### 24 hours before:
- [ ] Test your camera, microphone, and internet connection
- [ ] Prepare your Google Doc with a blank template (you can have a tab open)
- [ ] Practice typing code in Google Docs — it FEELS different than an IDE
- [ ] Review your 6–8 STAR behavioral stories (even for coding rounds, intro matters)
- [ ] Review BFS/DFS, binary search, tree traversal — your core building blocks
- [ ] Prepare 2 thoughtful questions for EACH interviewer slot
- [ ] Get good sleep — cognitive performance under pressure degrades significantly without rest

### 30 minutes before:
- [ ] Close unnecessary tabs and apps — reduce system load, avoid notifications
- [ ] Have a glass of water nearby
- [ ] Brief review of your most-recently-solved problem types
- [ ] Do a short physical activity (walk, stretch) to reduce cortisol
- [ ] Set a visible timer on your second screen or phone to track phases

### At interview start:
- [ ] Have a blank Google Doc tab ready
- [ ] Have a scratch pad tab ready for notes/rough work (some candidates use a second doc)
- [ ] Camera on (strongly recommended — visual presence builds rapport)
- [ ] Silence phone notifications

---

## The Inner Game: Mental Framework for the 45 Minutes

**The interviewer is not your adversary.** They were once a candidate. They want to hire you. Rejection costs them time too. Approach the interview as a collaborative problem-solving session with a new colleague.

**Nervousness is normal. Silence is not.** Turn nerves into narration. When you don't know what to do next, say *"Let me think through this..."* and keep going out loud. Silence reads as disengagement; narrated uncertainty reads as honesty and confidence.

**A partially-solved problem with clear communication beats a perfect solution delivered silently.** Multiple candidates who got Google L3 offers report struggling on at least one round. What made the difference was attitude, recovery, and how they communicated under pressure.

**Every hint is a gift, not a punishment.** Google interviewers give hints intentionally. Taking a hint smoothly — without defensiveness — and adapting your solution demonstrates the collaborative engineering mindset they specifically look for.

**Never compare performance across rounds.** You cannot know how you did in Round 1 when you're in Round 3. Each round is independent. Candidates who mentally spiral after a hard round often sabotage subsequent rounds. Reset between every interview.

---

## The 45-Minute Phase Summary (Pocket Version)

```
MIN 00–05   → Intro: warm, 60-90 sec self-intro. "I" statements.

MIN 05–10   → Clarify: Restate problem. Ask constraints, edges, output format.
              Write constraints as comments in the doc. Work through 1 example.

MIN 10–18   → Approach: Brute force first + complexity. Then optimize.
              Discuss 2 alternatives. Align with interviewer before coding.

MIN 18–35   → Code: Top-down structure. Meaningful names. Modular. Narrate.
              At min 32: self-check on pace. Stubs > incomplete code.

MIN 35–42   → Test: Happy path trace. Edge cases (empty, null, duplicates, bounds).
              Fix bugs found. State time + space complexity. Offer optimizations.

MIN 42–45   → Follow-ups: Engage conceptually. Close warm. Ask 1-2 team questions.
```

---

*Compiled from LeetCode Discuss, Blind (Teamblind), Reddit r/cscareerquestions, 1point3acres, IGotAnOffer, Glassdoor, Medium interview experience posts, Carrus.io, Interviewing.io, DEV.to, and candidate post-mortems — primarily from L3/L4 Google interview experiences in 2022–2025.*