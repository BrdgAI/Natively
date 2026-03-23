# Google L3 Interview Prep Textbook — Master Index

> Your complete end-to-end preparation guide. Read this file first. Come back to it the morning of the interview.

---

## How to Use This Textbook

This book has 7 sections. Each section covers a specific skill you need. Every section is broken into the 6 phases of the actual 45-minute interview so you know exactly *when* to use each tool.

**Reading order for someone starting fresh:**
1. This file (00) — understand the full picture
2. Section 08 — DS & algorithms guide (what every structure IS and when to use it)
3. Section 01 — personality and warmth (most underrated, read early)
4. Section 05 — pronunciation (practice out loud from day 1)
5. Section 04 — vocabulary (read before practicing code)
6. Section 02 — constraint writing (practice this every session)
7. Section 03 — technical code reference (your main coding study material)
8. Section 06 — recovery phrases (memorize before the interview week)
9. Section 07 — dry run language (practice this alongside coding)

**Day before the interview:** Re-read sections 01, 06, and the pocket cheat card at the bottom of this file.

---

## The 8 Sections at a Glance

| File | What it is | When to use it |
|------|-----------|----------------|
| `01-personality-and-social-language.md` | Warmth, friendliness, likeable phrases | Read early. Practice daily. |
| `02-constraint-writing-and-problem-framing.md` | What to write in the doc and in what order | Use every practice session |
| `03-technical-code-reference.md` | Python idioms for every data structure | Your main coding study reference |
| `04-competitive-programming-vocabulary.md` | All the technical words programmers use | Read once, review weekly |
| `05-pronunciation-and-speaking-guide.md` | How to say O(n), Dijkstra, 10^5, etc. | Practice out loud daily |
| `06-safe-phrases-and-recovery-scripts.md` | What to say when stuck, blank, or wrong | Memorize before interview week |
| `07-dry-run-and-testing-language.md` | How to trace code out loud step-by-step | Use every practice session |
| `08-data-structures-and-algorithms-guide.md` | Theory, types, when to use, skeletons for all DS/algos | Study one chapter per day |

---

## The 45-Minute Phase Map

```
PHASE 1  [Min 00–05]   Warm-Up & Introductions
PHASE 2  [Min 05–10]   Problem Reception & Clarification
PHASE 3  [Min 10–18]   Approach Discussion & Alignment
PHASE 4  [Min 18–35]   Coding
PHASE 5  [Min 35–42]   Testing, Edge Cases & Complexity
PHASE 6  [Min 42–45]   Follow-ups, Closing & Q&A
```

---

## Phase-by-Phase: What to Do + Which File Helps

### PHASE 1 — Warm-Up & Introductions `[Min 00–05]`

**Your job:** Be warm. Give a 60–90 second introduction. Listen to the interviewer. Confirm you can see the shared doc.

| Do this | Avoid this |
|---------|-----------|
| Use a prepared 90-second intro | Rambling past 2 minutes |
| Say "I" not "we" in your intro | Over-explaining every project |
| Comment briefly on *their* work | Saying "I'm nervous" |
| Confirm the shared doc is open | Jumping straight to "give me the problem" |

**Reference:** `01-personality-and-social-language.md` → Phase 1 section

---

### PHASE 2 — Problem Reception & Clarification `[Min 05–10]`

**Your job:** Read the problem fully. Restate it. Ask structured questions. Write constraints as comments. Trace one example.

| Do this | Avoid this |
|---------|-----------|
| Read silently in full before speaking | Interrupting mid-problem |
| Restate in your own words | Asking random scattered questions |
| Ask in this order: Input → Output → Constraints → Edge Cases | Assuming input is always valid |
| Write constraints as `# comments` at top of doc | Starting to code without writing constraints |
| Trace 1–2 examples out loud | Spending more than 5 minutes here |

**References:**
- `02-constraint-writing-and-problem-framing.md` → constraint block templates, question checklists
- `06-safe-phrases-and-recovery-scripts.md` → Phase 2 clarification phrases

---

### PHASE 3 — Approach Discussion & Alignment `[Min 10–18]`

**Your job:** Think out loud. State brute force first. Compare 2 approaches. Choose one and justify it. Get interviewer alignment before coding.

| Do this | Avoid this |
|---------|-----------|
| Start with brute force + its complexity | Jumping straight to the optimal |
| Compare 2 approaches explicitly | Staying silent for more than 20–30 seconds |
| Draw a diagram in the doc for graphs/trees | Over-engineering (segment tree when hash map works) |
| End with: "Does this direction seem reasonable?" | Coding without alignment |
| State expected time + space complexity | Committing before interviewer's buy-in |

**References:**
- `04-competitive-programming-vocabulary.md` → how to name and discuss algorithms
- `06-safe-phrases-and-recovery-scripts.md` → when you have no idea where to start

---

### PHASE 4 — Coding `[Min 18–35]`

**Your job:** Write clean, readable, modular code. Narrate as you go. Never go silent for more than 60 seconds. At minute 32, self-check pace.

| Do this | Avoid this |
|---------|-----------|
| Write skeleton/function signature first | Starting with full implementation immediately |
| Use meaningful variable names | Using `a`, `b`, `x`, `temp1` |
| Extract helper functions | Writing one massive 50-line function |
| Narrate decisions while typing | Going silent for more than 60 seconds |
| Code the happy path first, edge cases after | Trying to handle everything simultaneously |
| At min 32: check if you're on pace | Rushing silently at the end |

**References:**
- `03-technical-code-reference.md` → exact Python syntax for every data structure
- `07-dry-run-and-testing-language.md` → narration language while coding
- `06-safe-phrases-and-recovery-scripts.md` → when stuck mid-code, running out of time

---

### PHASE 5 — Testing, Edge Cases & Complexity `[Min 35–42]`

**Your job:** Proactively test before the interviewer asks. Trace a happy path. Test 3–5 edge cases. State time + space complexity. Offer tradeoffs.

| Do this | Avoid this |
|---------|-----------|
| Announce "Let me trace through this with a concrete example..." | Saying "I think it works" without checking |
| Manually trace the happy path in the doc | Testing only the happy path |
| Name and test 3–5 specific edge cases | Waiting for interviewer to find bugs |
| State complexity unprompted | Skipping complexity analysis |
| Offer optimizations and tradeoffs | Overclaiming O(1) for something that is O(n) |

**References:**
- `07-dry-run-and-testing-language.md` → full dry run templates, edge case list
- `06-safe-phrases-and-recovery-scripts.md` → if interviewer finds a bug first

---

### PHASE 6 — Follow-ups, Closing & Q&A `[Min 42–45]`

**Your job:** Engage with follow-up questions. Recap your solution briefly. Ask 1–2 specific, thoughtful questions. Close warmly by name.

| Do this | Avoid this |
|---------|-----------|
| Engage with follow-up: "Interesting — let me think about that..." | Shutting down at "I don't know" |
| Use verbal roadmap if no time to code follow-up | Trailing off without finishing thought |
| Brief recap: "We solved X with Y approach, O(n log n)" | Asking about salary, benefits, remote policy |
| Ask 1–2 specific team questions | Asking generic "what do you like about Google?" |
| Close by name: "Thanks so much, Jordan — I really enjoyed this" | Visibly relaxing before it's over |

**References:**
- `01-personality-and-social-language.md` → 5 ready-to-use closing questions, warm close scripts

---

## Constraint → Algorithm Hint Table

> When the interviewer gives you a constraint, this tells you what complexity they expect.

| Constraint (N = ...) | Max complexity allowed | Likely algorithms |
|---------------------|----------------------|-------------------|
| N ≤ 10 | O(n!) or O(2^n) | Brute force, backtracking, permutations |
| N ≤ 20 | O(2^n) | Bitmask DP, backtracking |
| N ≤ 100 | O(n³) | Triple nested loops, Floyd-Warshall |
| N ≤ 1,000 | O(n²) | Nested loops, simple DP |
| N ≤ 10,000 | O(n log n) to O(n√n) | Sort, binary search, BFS/DFS |
| N ≤ 100,000 | O(n log n) | Merge sort, heap, Dijkstra's, segment tree |
| N ≤ 1,000,000 | O(n) or O(n log n) | Sliding window, two pointers, hash map |
| N ≤ 10^9 | O(log n) or O(1) | Binary search, math, direct formula |

---

## Red Flags to Never Do (The Fatal List)

From all three reference sources — these behaviors are the most cited reasons for rejection:

1. **Silent for 2+ minutes** — always narrate, even if uncertain
2. **Starting to code before clarifying** — always restate and write constraints first
3. **Skipping brute force** — always state it, even if you know the optimal
4. **Ignoring a hint** — always take hints immediately and acknowledge them
5. **Messy variable names** — `a`, `b`, `x` throughout signals no production experience
6. **One giant function** — always modularize with helpers
7. **Not testing your solution** — always trace through before the interviewer asks
8. **Getting defensive when bug is found** — always say "Good catch — let me trace through that..."
9. **Overclaiming complexity** — if unsure, reason out loud rather than guessing wrong
10. **Asking no questions in closing** — always have 1–2 specific questions ready

---

## Pocket Cheat Card (Read the Morning of the Interview)

```
PHASE 1  [00–05]  → Warm intro (90 sec, "I" not "we"). Comment on their work. Confirm doc.

PHASE 2  [05–10]  → Read fully → Restate → Ask Input/Output/Constraints/Edges/Priority
                    Write constraints as #comments → Trace 1 example. Full 5 min = worth it.

PHASE 3  [10–18]  → Brute force + complexity FIRST. Then optimize.
                    Compare 2 approaches → Choose + justify → Draw diagram if graph/tree
                    End with: "Does this direction seem reasonable before I start?"

PHASE 4  [18–35]  → Skeleton first → Meaningful names → Helpers/modular → Narrate why
                    At min 32: self-check pace. Stubs + verbal > broken code.

PHASE 5  [35–42]  → "Let me trace through a concrete example..."
                    Happy path → 3–5 named edge cases → State complexity unprompted.
                    Find your own bugs. Fix calmly.

PHASE 6  [42–45]  → Engage follow-up. Verbal roadmap if no time.
                    Recap solution briefly. Ask 1–2 specific team questions.
                    Close by name: "Thanks so much, [Name] — I really enjoyed this."
```

---

## Mental Reminders for Interview Day

- **The interviewer wants to hire you.** They are not your enemy. Treat it like pair programming with a new colleague.
- **Nervousness is normal. Silence is not.** Turn nerves into narration.
- **A partial solution with great communication beats a perfect solution delivered silently.**
- **Every hint is a gift.** Taking a hint gracefully and adapting scores *higher* than stubbornly solving alone.
- **Never compare rounds.** Each round is independent. Reset after every one.
- **You do not need to be perfect.** Multiple candidates who received Google L3 offers struggled on at least one round. Attitude and communication under pressure are what made the difference.

---

*References: interview-flow-summarized.md, notes-summarized.md, Mock Interview - 45m - Sonnet4.6.md*
