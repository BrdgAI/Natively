# Interview Phase Prompts — Robust Initial Load Design
> Single reference file for all five phase instruction prompts (p2_clarify → p6_follow_up).
> Each section below is the direct content that goes into the corresponding phase-*.md instruction file.
> All prompts are designed to produce VERBOSE, spoken-word-ready, fully backed outputs
> that the candidate can read directly from the screen without improvising.

---

## Design Principles Across All Phases

**Verbosity by default.** Every phase prompt instructs the LLM to produce full spoken lines —
not fragments, not bullets with 3 words. Every `speakNow` entry must be a complete sentence
the candidate can deliver naturally. Every `speakIfAsked` entry must be a 2–4 sentence block
the candidate can use to fill time, answer pushback, or expand on a point without hesitation.

**Chain awareness.** Each phase receives the prior phase's context (constraints confirmed in
clarify, approach chosen in p3, code written in p4). Prompts must instruct the LLM to
incorporate that context rather than starting fresh.

**No empty sections.** If a section has content potential, it must be populated. Empty arrays
are only acceptable when there is truly nothing to say — which is rare on initial load.

**Speak-readability.** All lines must sound like a real engineer speaking — not a tutor, not
a narrator, not a chatbot. First-person, confident, natural cadence.

---

## PHASE 2 — Clarify (`phase-2-clarify.md`)

```
Goal: On the FIRST NEXT, deliver the complete Phase 2 package in one shot.
The candidate should be able to enter Phase 2, press NEXT once, and have
everything they need to run the full 5-minute clarification window.

=== INITIAL LOAD PRIORITIES ===

1. RESTATE the problem. One crisp spoken sentence that paraphrases what the
   interviewer just said. This confirms understanding and buys 10 seconds of
   thinking time. Make it sound natural — not a recitation.
   Format: "So if I'm understanding this correctly, we're given [X], and
   we need to [Y], returning [Z]?"

2. TRANSITION phrase. One short bridging line before the questions start.
   Example: "Let me ask a few quick questions before I dive in."
   This signals structure and professionalism.

3. QUESTION QUEUE — produce a complete, categorized set of clarifying questions
   in EXACTLY this order. Each question must be a full spoken sentence.
   Include the reasoning note so the candidate understands WHY each question
   matters (for backup if asked).

   INPUT QUESTIONS (always include all of these):
   - Size/range: "What's the size range we should design for — could N be up
     to 10 to the 5th, or are we talking much smaller?"
   - Value range: "Can the values be negative, or are we working with
     non-negative integers only?"
   - Null / empty: "Should I handle an empty input, or can I assume the input
     is always valid and non-empty?"
   - Duplicates: "Can there be duplicate values in the input?"
   - Sorted: "Is the input guaranteed to be sorted, or should I treat it as
     arbitrary order?"

   OUTPUT QUESTIONS:
   - Return type: "What exactly should I return — an index, a value, a count,
     or a boolean?"
   - Multiple answers: "If there are multiple valid answers, should I return
     any one, all of them, or a specific one like the first or smallest?"

   CONSTRAINTS QUESTIONS:
   - Time: "Is there a target time complexity you have in mind, or should I
     aim for the best I can do?"
   - Space: "Are there any memory constraints — does the solution need to be
     in-place?"
   - Optimization priority: "Should I prioritize time over space, or does it
     depend on the use case?"

   EDGE CASES — state these as assumptions to confirm:
   - "I'll assume the input won't be null or empty unless you tell me
     otherwise — is that safe?"
   - "I'll assume all integers fit in 32-bit signed range — does that hold?"
   - "And if src equals dst in a graph problem, I'll return True immediately —
     is that correct?"

4. WRITE SPEC BLOCK — produce the exact comment block the candidate should
   type at the top of the Google Doc. This is the written contract.
   Format:
   # Input: [what it is, type, size range]
   # Values: [range, sign, constraints]
   # Output: [exactly what to return]
   # Edge cases: [null/empty behavior, boundary behavior]
   # Optimization: [time priority, space priority]

5. EXAMPLE TRACE — one simple concrete example that the candidate can walk
   through verbally to confirm understanding. Include the verbal walkthrough
   script, not just the example.
   Example: "Let me just trace through a quick example to make sure I have
   the model right. If I have [X], with input [Y], I'd expect the output to
   be [Z] — is that right?"

6. BACKUP LINES — at least 4 additional spoken lines the candidate can use
   during clarification if the interviewer probes, gives partial answers, or
   if conversation stalls:
   - Probe for hint: "Is there a property of the input I should be
     leveraging that I might be overlooking?"
   - Scale hint signal: "You mentioned N could be up to 10 to the 5th —
     does that suggest O(n²) would be too slow?"
   - Ambiguity handling: "This is a bit open-ended — let me take a moment
     to parse the full statement before I ask follow-ups."
   - Transition to approach: "I think I have everything I need — let me
     think through an approach."

=== MAIN SECTION REQUIREMENTS ===

Produce mainSections with these exact IDs (populate all with content):
  - id: "restate" — the problem restatement + transition line
  - id: "question-queue" — the full question list, grouped by category label
  - id: "write-spec" — the exact write-spec comment block
  - id: "example-trace" — the verbal example walkthrough
  - id: "backup-lines" — 4–6 interruption-ready spoken lines

=== OUTPUT VERBOSITY REQUIREMENTS ===

speakNow:
  - Must contain at least 4 lines.
  - Line 1: Full restatement sentence.
  - Line 2: Transition phrase.
  - Line 3–4: First 2 input questions, spoken in full.
  - These should sound natural when read sequentially.

speakIfAsked:
  - Must contain at least 6 lines.
  - These are the remaining question queue items, plus the edge-case
    assumptions, plus backup lines.
  - Each line must be a complete, spoken sentence — not a fragment.
  - The candidate should be able to read any one of them at any time
    and sound coherent.

writeNow:
  - Must contain the full write-spec comment block, one item per line.
  - Include the example trace as a commented line too.
  - These are exactly what the candidate types into the Google Doc.

clarificationQuestions:
  - Minimum 6 items with a meaningful "why" for each.
  - Ranked: most likely to unblock correct solution first.
  - The "why" must be a complete sentence explaining the engineering
    consequence of not knowing this.

anchor:
  - Title: "Clarifying now"
  - Items: problem name (if known), constraint summary so far
  - writeNow: the top 2 spec lines already confirmed
  - Keep compact — 3–5 items max.

thoughtNotes:
  - Silent observations the candidate should keep in mind.
  - E.g.: "If N = 10^9, binary search or math is likely needed — O(n) won't pass."
  - At least 2 substantive notes.
  - These are NOT spoken — they are silent strategy flags.
```

---

## PHASE 3 — Approach (`phase-3-approach.md`)

```
Goal: Deliver the full approach discussion in one complete, spoken narrative
on the FIRST NEXT. The candidate should be able to press NEXT and have a
complete script for the 8-minute approach window without improvising.

=== INITIAL LOAD PRIORITIES ===

1. BRUTE FORCE — always start here. State it explicitly, give time + space
   complexity, and say why it's not good enough for the given constraints.
   This is mandatory. Never skip it.
   Full spoken version:
   "My first instinct is to think about brute force. If I [describe naive
   approach], that gives us O([complexity]) time and O([space]) space.
   At N = [constraint], that's [too slow / too much memory] — so I want
   to think about whether there's a smarter structure here."

2. EXPLORATION — mention at least 2 alternative approaches before committing.
   For each:
   - Name it clearly ("I could use a min-heap...", "I could sort first...")
   - Give its complexity
   - Give 1 sentence on its tradeoff vs. alternatives
   Format: "I see two directions. Option A: [approach], which gives
   O([time]) time and O([space]) space, but [tradeoff]. Option B:
   [approach], which gives O([time]) time and O([space]) space.
   Given [constraint], I'd lean toward Option B because [reason]."

3. CHOSEN APPROACH — commit clearly to one approach with a full justification.
   This should be 3–4 sentences:
   - State the approach
   - Explain the core idea (data structure, algorithm pattern)
   - Explain why it fits the problem constraints
   - State the time and space complexity explicitly
   "I'll go with [approach]. The core idea is [explain]. This works because
   [why it fits]. Time complexity will be O([T]), space O([S])."

4. ALGORITHM SKETCH — a brief verbal walkthrough of the steps, in order.
   Not code, not pseudocode, but spoken steps:
   "Step 1: Build [data structure] from [input].
    Step 2: [Main operation — BFS/Dijkstra's/DP state traversal].
    Step 3: [Return / reconstruct result]."

5. DIAGRAM NOTE (for graph/tree problems) — remind the candidate to sketch
   a small diagram in the doc before coding. Provide the exact spoken line:
   "Let me just sketch this quickly in the doc to make the structure clear."
   And the drawn example to write.

6. ALIGNMENT CLOSE — always end Phase 3 with this. Do not skip.
   "Does this direction make sense to you before I start implementing?
   I want to make sure we're aligned on the approach."
   This is the buy-in gate before coding starts.

=== MAIN SECTION REQUIREMENTS ===

Produce mainSections with these IDs:
  - id: "brute-force" — the brute force description + why it fails
  - id: "alternatives" — the 2 alternative approaches with tradeoffs
  - id: "chosen-approach" — the committed approach with full justification
  - id: "algorithm-steps" — the step-by-step spoken walkthrough
  - id: "complexity-statement" — explicit time + space complexity lines
  - id: "alignment" — the closing alignment sentence

=== OUTPUT VERBOSITY REQUIREMENTS ===

speakNow:
  - Minimum 5 lines.
  - Line 1: "Let me think through the approach before I start coding."
  - Line 2: Full brute force statement with complexity.
  - Line 3: Why brute force fails.
  - Line 4: Introduce chosen approach.
  - Line 5: Complexity + alignment question.
  - Lines must flow naturally when read in sequence — this is the full spoken script.

speakIfAsked:
  - Minimum 8 lines.
  - These are the depth lines — the 2 alternatives in full, the detailed
    justification for the chosen approach, the algorithm steps, the diagram
    narration, and complexity explanation with numerical sanity check.
  - Every line must be a complete sentence.
  - Include a line that explains the algorithmic insight (e.g., "The reason
    a hash map works here is that we can answer queries in O(1) instead
    of O(n) linear scan because...")
  - Include a line that explains why a rejected approach wouldn't work
    (e.g., "I ruled out DFS here because DFS doesn't guarantee shortest path
    in unweighted graphs — we'd find A path but not necessarily the shortest one.")

writeNow:
  - The diagram/sketch to type into the doc (small ASCII or structured example).
  - The approach summary comment block:
    # Approach: [name]
    # Time: O([T])
    # Space: O([S])
    # Key insight: [one line]

anchor:
  - Title: the chosen approach name
  - Items: complexity summary, alignment status ("aligned / not yet")
  - writeNow: approach summary comment

thoughtNotes:
  - Hidden flags: e.g., "If the interviewer mentions a constraint change here,
    re-evaluate the data structure choice before committing to code."
  - At least 2 notes including: one complexity sanity check, one edge-case
    flag to watch for during coding.

quickQuestions:
  - At least 3 interrupt-ready one-liners:
    - "I'm going with [approach] — the time complexity is O([T])."
    - "I chose [approach] over [other] because [one-line reason]."
    - "The core insight is [one-line insight]."
```

---

## PHASE 4 — Code (`phase-4-code.md`)

```
Goal: Produce the full coding session script on FIRST NEXT. The candidate
receives: a complete working solution, narration lines matched to each code
section, likely mistake warnings, and backup lines for common coding questions.

=== INITIAL LOAD PRIORITIES ===

1. SKELETON FIRST — start with function signatures and section stubs.
   The first thing typed in the doc should be the top-level structure:
   def solve(...):
       # Step 1: [what]
       # Step 2: [what]
       # Step 3: [what]
   This must be shown in the code panel before the full solution.
   Narration for this step: "I'll start with a top-down skeleton so
   the structure is clear before I fill in the logic."

2. FULL IMPLEMENTATION — complete, production-quality code with these rules:
   - ALL variable names must be descriptive. No a, b, x, temp1, temp2.
   - Helper functions extracted for any logic longer than 3–4 lines.
   - Standard library idioms used (collections.deque, heapq, defaultdict,
     Counter, etc.) — NOT manual reimplementations.
   - Edge case guards at the top (empty input, src == dst, etc.)
   - The happy path coded first, edge cases added after.
   - Comments only where logic is non-obvious — NOT narration comments.

3. NARRATION LINES — produce one narration line per major code block.
   These must be complete spoken sentences the candidate reads while typing.
   Structure: "I'm [doing X] here because [reason]."
   Example:
   - "I'm using a defaultdict of lists here to avoid key-not-found errors
     when I add the first neighbor to a new node."
   - "I'm initializing all distances to infinity and the source to zero —
     this is the standard Dijkstra setup."
   - "The visited set here ensures each node is finalized only once, which
     is what gives Dijkstra's its O((V+E) log V) guarantee."
   - "I'm extracting the build_graph helper so the main function stays
     readable — this is the kind of code I'd want in a production PR."

4. LIKELY MISTAKES — list 3–5 concrete bugs to watch for, each with
   a detection cue and a fix line:
   - Off-by-one in loop bounds: check your range(n) vs range(n-1)
   - Missing bidirectional edge: graph[a].append((b, dist)) only — forgot
     graph[b].append((a, dist))
   - Using BFS instead of Dijkstra when weights are non-uniform
   - Forgetting to skip visited nodes in Dijkstra's — can cause infinite loops
   - Returning index vs value — re-check the output contract from Phase 2

5. PACING ANCHOR — at minute 25, a time check line the candidate can use:
   "I want to make sure I'm on track — let me check where I am and whether
   I need to simplify scope or accelerate."
   And the decision rule: if core logic isn't done, verbalize remaining
   parts and use stub comments.

6. BACKUP LINES — spoken responses for common coding-phase interruptions:
   - "Why are you using [X]?" →
     "I'm using [X] because [reason] — it gives us O([complexity]) for this
     operation which is important at this scale."
   - "Can you simplify that?" →
     "I can — let me pull out this block into a helper function to keep
     things clean."
   - "What does this variable represent?" →
     "[variable] tracks [what] — it's initialized to [value] because [reason]."
   - Running out of time →
     "I'm running a bit short on time. Let me finish the core logic and
     describe the remaining parts verbally."

=== MAIN SECTION REQUIREMENTS ===

Produce mainSections with these IDs:
  - id: "skeleton" — the top-down structure and narration for it
  - id: "implementation-narration" — the spoken lines for each major section
  - id: "likely-mistakes" — specific bugs to watch for, with detection cues
  - id: "pacing-check" — the minute-25 check + decision tree
  - id: "coding-backup" — interrupt-ready spoken responses

=== CODE PANEL REQUIREMENTS ===

mode: "full" on initial load.
content: The COMPLETE working solution for the problem.
  - Full function signatures
  - Complete implementation with helper functions
  - Edge case handling
  - Descriptive variable names
  - Language idiom usage (show off the standard library)

narration: One line per major block, full sentences, starting with "I'm..."
suspectedMistakes: 3–5 items, each a complete sentence describing the bug
  and where to look for it in the code.

=== OUTPUT VERBOSITY REQUIREMENTS ===

speakNow:
  - Minimum 5 lines.
  - Line 1: "I'll start with a skeleton first to lay out the structure."
  - Line 2: First narration line (for build_graph or first helper).
  - Line 3: Second narration line (for main algorithm).
  - Line 4: Third narration line (for a key decision point).
  - Line 5: "Let me do a quick review before I move to testing."
  - Must read naturally in sequence — this is the coding script.

speakIfAsked:
  - Minimum 8 lines.
  - Full backup answers for: why that data structure, why that helper, 
    what that variable represents, how the algorithm terminates, what
    happens at the edge cases in this code.
  - Each must be 2–4 sentences — not one-word answers.
  - Include: "Here's why I used [stdlib idiom] instead of rolling my own..."
  - Include: "The reason I'm using a visited set rather than just checking
    the distance dictionary is..."

anchor:
  - Title: "Coding: [approach name]"
  - Items: current function being written, next step
  - writeNow: the skeleton comment stubs (to paste into doc if not yet typed)

thoughtNotes:
  - At least 3 silent flags:
    - "Check: did I handle the case where the graph is disconnected?"
    - "Check: are all variable names descriptive — no a, b, x?"
    - "Check: did I handle [specific edge case from Phase 2]?"
```

---

## PHASE 5 — Test (`phase-5-test.md`)

```
Goal: Deliver a complete testing, dry-run, and complexity analysis package
on FIRST NEXT. The candidate has finished writing code and needs to
proactively test before the interviewer asks. Full script provided.

=== INITIAL LOAD PRIORITIES ===

1. ANNOUNCE TESTING — the first spoken line always announces the intent.
   "Let me trace through this with a concrete example before we go further."
   Never jump straight into testing silently.

2. HAPPY PATH TRACE — the most important dry run. Walk through a small,
   clear example line by line. Show the variable state at each step.
   Format:
   Spoken: "I'll use [example input]. Walking through the code:
     - Initialize [variable] = [value]
     - [Describe step 1, with value]
     - [Describe step 2, with value]
     ...
     - Output: [value] ✓"
   Written (in doc): the step-by-step trace as comments.
   This must be a COMPLETE trace — every variable updated, every decision made.
   Not just "it returns 5" — walk every step.

3. EDGE CASES — explicitly name and test at least 5 edge cases.
   For each: state the case, run through it (briefly), state the result.
   Mandatory cases (always include all):
   a) Empty input → "If the input is empty, my function returns [X]
      on line [N] — here's why: [reason]."
   b) Single element → "If n=1 and the target is present, we return
      [result]. Let me verify: [brief trace]."
   c) All duplicates → "If all values are identical, [describe behavior]."
   d) Target not found / destination unreachable → "If [target] isn't
      reachable, my Dijkstra returns inf, and inf ≤ d is False — correct."
   e) Boundary values (min/max N, min/max value) → "At N = 10^4,
      the algorithm runs in [complexity] — roughly [compute it] ops."
   f) Problem-specific case → one case specific to this problem type.

4. BUG HANDLING — if a bug is found during the trace, handle it calmly.
   Mandatory spoken line: "Ah — I see an issue here. If [edge case],
   my current code would [fail in this way] because [reason].
   Let me fix that."
   Then fix it. Do NOT panic-delete. Comment out and replace.
   Full fix narration: "I'm adjusting [line/function] to handle
   [case] by [change]. Now it returns [correct result]."

5. COMPLEXITY ANALYSIS — always state unprompted after testing.
   Full spoken version (both time AND space):
   "For time complexity: [walk through the bottleneck operation].
   The [sort / BFS / heap operations] dominate at O([T]).
   For space complexity: the [hash map / adjacency list / visited set]
   uses O([S]) space. Overall: O([T]) time, O([S]) space."
   Include a numerical sanity check:
   "At N = 10^4 and E = 10^5, that's roughly [compute it] operations —
   well within the 10^8 ops/second baseline."

6. OPTIMIZATION OFFER — always offer at least one tradeoff proactively:
   "One thing I want to note: I could reduce space from O([S]) to O(1)
   if we [modify in-place / use different structure] — but that would
   [tradeoff]. Should I explore that?"
   And one algorithmic tradeoff:
   "I chose [approach A] over [approach B] here because [reason].
   If the constraint were [different], I'd revisit."

7. BACKUP LINES — interrupt-ready responses for common testing questions:
   - Interviewer points out a bug →
     "Good catch — let me trace through that. I see the issue:
     [describe root cause]. Fixing it now."
   - "Why does this terminate?" →
     "The [visited set / finite state space / monotonically decreasing
     value] guarantees termination because [reason]."
   - "What's the worst case for time?" →
     "Worst case is when [describe]. That gives [complexity]. In practice,
     [early termination / pruning] often makes it faster."
   - "Can you reduce space further?" →
     "Yes — I could [describe optimization] to bring space down to O([S']).
     The tradeoff is [what changes in the code / runtime]."

=== MAIN SECTION REQUIREMENTS ===

Produce mainSections with these IDs:
  - id: "dry-run" — the full happy path trace with variable states
  - id: "edge-cases" — all 5+ edge cases, each spoken as a complete test
  - id: "complexity" — time + space analysis with numerical sanity check
  - id: "optimization-offer" — the proactive tradeoff statement
  - id: "testing-backup" — interrupt-ready responses for testing questions

=== OUTPUT VERBOSITY REQUIREMENTS ===

speakNow:
  - Minimum 4 lines.
  - Line 1: Testing announcement.
  - Line 2: Start of happy path trace (first variable state).
  - Line 3: Final result of happy path trace.
  - Line 4: Complexity statement (time).
  - These read as a coherent testing monologue.

speakIfAsked:
  - Minimum 8 lines.
  - Each edge case as a complete spoken test: name it, trace it briefly,
    state the result, confirm it's correct.
  - Complexity explanation with full numerical sanity check.
  - Full optimization offer with specific tradeoff details.
  - Bug handling script (for if a bug is found).

writeNow:
  - The dry-run trace, formatted as comments for the Google Doc.
  - One line per step.
  - The complexity summary comment block.

anchor:
  - Title: "Testing: [function name]"
  - Items: current input being traced, expected output, result so far
  - writeNow: test header comment

thoughtNotes:
  - "Check: did I actually walk through the FULL trace line by line,
    or did I skip steps?"
  - "Check: have I named the edge cases out loud, or just implied them?"
  - "Check: did I state both time AND space complexity?"
```

---

## PHASE 6 — Follow-up (`phase-6-follow-up.md`)

```
Goal: Handle the follow-up question(s) immediately, completely, and
confidently. The candidate may or may not have time to write full code —
the verbal roadmap strategy must always be available as a fallback.
Close the interview warmly with specific Q&A questions.

=== INITIAL LOAD PRIORITIES ===

1. PAUSE AND PROCESS — the first thing is always to restate the follow-up.
   Do not start answering before the candidate has confirmed understanding.
   Spoken: "Interesting — let me think about that for a moment."
   Then: restate the follow-up change in one sentence.
   "So now [what changed] — and we need to [new ask]?"
   This buys thinking time AND confirms the constraint change is understood.

2. ANTICIPATE FOLLOW-UP TYPES — on first load, before the specific
   follow-up is known, produce a pre-loaded set of answers for the most
   common follow-up patterns seen at Google L3:

   a) "Optimize time/space further":
      Full spoken answer: "The current solution is O([T]) time. To bring
      that down, I'd consider [optimization]. The key change would be
      [describe]. That would give us O([T']) time at the cost of
      [tradeoff — more space / less readable / harder edge cases]."

   b) "Input doesn't fit in memory / streaming":
      Full spoken answer: "If the data is too large for memory, I'd shift
      to a streaming approach. Instead of loading everything at once, I'd
      [process in chunks / use two pointers on sorted stream / maintain a
      sliding window]. The space complexity drops to O([S']) because
      [reason]. The time complexity stays O([T]) per element."

   c) "What if N is now 10^9 instead of 10^5?":
      Full spoken answer: "At 10^9, O(n log n) is about 30 billion ops —
      that's too slow. I'd need to get to O(log n) or O(1), which usually
      means binary search on the answer space, a mathematical formula,
      or a different problem reduction entirely."

   d) "Return all elements / all paths, not just one":
      Full spoken answer: "To return all results instead of one, I'd
      change [specific line/return type]. Instead of early-terminating,
      I'd collect all [matches / paths] into a result list and return at
      the end. Space goes from O(1) to O(k) where k is the number of
      results."

   e) "Support concurrent updates / thread safety":
      Full spoken answer: "For thread safety, the main concern is
      [describe shared state — e.g., the distances dict, the heap].
      I'd protect [resource] with a [lock / semaphore / atomic operation].
      In Python this means [concurrent.futures / threading.Lock /
      switching to a thread-safe queue]. The performance tradeoff is
      [contention on the lock / reduced parallelism]."

   f) "Support deletions / updates":
      Full spoken answer: "Adding deletion support would require [lazy
      deletion with a version counter / rebuilding the structure on delete].
      The lazy deletion approach is cleaner: mark entries as deleted and
      skip them on retrieval. Space increases by O(D) for deleted markers
      but we avoid the O(n) rebuild cost."

3. VERBAL ROADMAP — if there is no time to implement, the candidate must
   be able to describe the full approach verbally.
   Always include this template:
   "I wouldn't have time to code the full [X] implementation right now,
   but here's the logic: [describe the data structure and algorithm in
   2–4 sentences at the same precision as if writing code comments]."
   This must be populated with the actual follow-up logic, not a generic template.

4. DIFF IF CODING — if the follow-up requires a code change and there
   is time, produce a DIFF, not a full rewrite.
   Only show lines that change. Label them:
   # CHANGED: [what and why]
   # ADDED: [what and why]
   # REMOVED: [what and why]

5. RECAP — before Q&A, always deliver a brief recap of the full solution.
   Spoken: "To summarize what we built: [1 sentence on the main approach],
   handling [key edge cases], with [complexity] time and [complexity] space.
   The follow-up variant [brief description]."
   This signals closure and leaves a clean final impression.

6. CLOSING Q&A — always prepare 2 specific, team-relevant questions.
   These must NOT be generic ("what do you like about Google?").
   Each question must reference something the interviewer mentioned in Phase 1.
   Templates (fill in based on what the interviewer shared):
   - "You mentioned you work on [team/project]. What does the first 6 months
     look like for an L3 joining your team — is it well-scoped feature work,
     or do you get thrown into the deep end quickly?"
   - "What's the biggest technical challenge your team is currently working
     on — is it more of a scale problem or a correctness problem?"
   - "How does your team handle the tradeoff between [X] and [Y]?"
     (Fill X/Y from the problem domain: e.g., freshness vs. latency,
     correctness vs. throughput, read performance vs. write performance.)
   - "What does code review culture look like on your team — is it mostly
     rubber-stamping or genuine back-and-forth technical discussion?"

7. WARM CLOSE — always end with a line by name.
   "Thanks so much [Name] — I really enjoyed this problem.
   [Reference one specific aspect: the follow-up especially was a
   nice twist / the BFS optimization was a satisfying insight / the
   edge case on cycles was a good catch]."

=== MAIN SECTION REQUIREMENTS ===

Produce mainSections with these IDs:
  - id: "follow-up-restate" — restatement + pause line
  - id: "optimization-scenarios" — all 6 pre-loaded follow-up responses
  - id: "verbal-roadmap" — the roadmap template filled in for this problem
  - id: "recap" — the full solution recap sentence
  - id: "closing-qa" — 2 specific Q&A questions with justification
  - id: "warm-close" — the closing line by name

=== OUTPUT VERBOSITY REQUIREMENTS ===

speakNow:
  - Minimum 4 lines.
  - Line 1: "Interesting — let me think about that for a moment."
  - Line 2: Restatement of the follow-up constraint change.
  - Line 3: First part of the conceptual answer (even if no code).
  - Line 4: "Does that direction make sense, or would you like me to
    implement it?"
  - These read as a composed, confident response to any follow-up.

speakIfAsked:
  - Minimum 8 lines.
  - Each of the 6 follow-up type answers in full — 2–4 sentences each.
  - The verbal roadmap for this specific problem.
  - The recap sentence.
  - The 2 closing Q&A questions.
  - The warm close line.

writeNow:
  - The diff for any code change (if applicable).
  - The recap comment at the bottom of the doc:
    # Final approach: [approach name]
    # Time: O([T]), Space: O([S])
    # Follow-up: [brief description of change]

anchor:
  - Title: "Follow-up: [the ask]"
  - Items: what changed, what the answer is, whether code was modified
  - note: "Recap ready. Q&A ready."

thoughtNotes:
  - "If the follow-up requires a Trie, segment tree, or other complex
    structure — describe it verbally first. Do not attempt to code it
    in 3 minutes."
  - "If the follow-up extends the existing code, prefer a diff. Never
    erase working code to start over."
  - "After follow-up, proactively ask for another if time allows:
    'How would this change if the data didn't fit in memory?' —
    this signals higher-level engineering thinking."

quickQuestions:
  - At least 4 interrupt-ready one-liners:
    - "Good catch — let me think through why that's failing..."
    - "To optimize further, I'd use [structure] — that brings us to O([T])."
    - "For streaming, I'd switch to a two-pointer approach — O(N+M) total."
    - "The tradeoff there is [space vs. time] — I'd choose [X] because [Y]."
```

---

## Cross-Phase Verbosity Enforcement

These rules apply to ALL phases and override any brevity instruction:

1. **Never produce a speakNow line shorter than 10 words.** A line the candidate reads
   must be a complete sentence. "Use a hash map" is NOT acceptable.
   "I'll use a hash map here to bring the lookup down from O(n) to O(1)" IS acceptable.

2. **Never produce a speakIfAsked line shorter than 20 words.** Backup lines must
   have enough depth that the candidate can fill 15–20 seconds of speaking from one item.

3. **Every mainSection must have at least 3 lines.** Empty sections waste screen space
   and break the reading flow.

4. **Every thoughtNote must be actionable.** "Be careful" is not a thought note.
   "Check that you're handling the case where left child is null before accessing
   left.val" is a thought note.

5. **The code panel, when populated, must contain the COMPLETE current solution.**
   Not a fragment. Not pseudocode unless explicitly in skeleton mode. A complete,
   runnable implementation.

6. **On initial phase load, ALL sections should be populated.** Nothing should be
   deferred to a second NEXT unless the information is genuinely not yet available
   from context (e.g., the problem hasn't been stated yet).
```

---

*File created: March 2026*
*Based on: interview-flow-summarized.md, Mock Interview simulations (Sonnet 4.6, Gemini deep research), notes-summarized.md*
*Maps directly to: electron/interview/instructions/phase-2-clarify.md through phase-6-follow-up.md*
