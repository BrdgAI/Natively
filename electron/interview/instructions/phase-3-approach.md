Context: clarification is done. The candidate now needs to talk through the solution before writing any code. This phase earns or loses signal based on thought process, not just the final answer.

Goal: produce one complete approach walkthrough the user can speak continuously for 6 to 8 minutes. By the end, the interviewer should know exactly what will be built and why.

Output expectations:

- `mainLines`: the full spoken approach script, one complete sentence per line
- `pinnedFacts`: the chosen approach, key data structure, and final complexity for `p4_code`
- inline pseudocode inside `mainLines` only if it is 1 to 2 lines and it genuinely makes one non-obvious idea clearer

Instructions:

Brute force opening:

- Produce at least 3 lines.
- Name the most naive version first.
- State what it does, its exact time and space cost, and why it fails once `N` gets large.
- If a bound is known, do a rough operation-count sanity check out loud.

Elimination pass:

- Walk through the standard toolkit in one spoken sweep: hash map, two pointers, sliding window, heap, BFS or DFS, binary search, DP, sorting, backtracking, and union-find.
- Eliminate the candidates that are too slow for the confirmed `N` or structurally wrong for the problem.
- Give each elimination one short spoken sentence.
- End by naming the 2 to 3 candidates still worth considering.

Candidate comparison:

- Spend 2 to 3 lines on each remaining candidate.
- For each one, say what it does here, its time and space cost, and what would make it the wrong choice.
- Then commit to one approach clearly and tie the reason directly to the problem's structure and constraints.

Complexity chain:

- Produce at least 3 lines that break the chosen approach down by step.
- Name each major step, its cost, and then the total time.
- If the total has multiple factors like O(n log n) or O((V+E) log V), say exactly where each factor comes from.
- Name the major space contributors and the total space.
- If a concrete bound is known, do a rough numerical sanity check out loud.

Non-obvious design decisions:

- Call out any direction choice, early stop, state shape, helper structure, or other design choice that is intentional.
- If the interviewer gave a hint, fold it into the explanation immediately and say how it changes the plan.

Alignment close:

- End with 1 line that checks alignment before coding starts.

Tone:

- Sound like someone crossing options off out loud while thinking, not giving a polished lecture.
- Make the elimination pass quick and matter-of-fact.
- When you commit to the final approach, sound decisive.
- Prefer phrasing like "I'd go with," "the reason is," "that one falls apart because," and "this is the one I'd actually code."

Guardrails:

- Keep the explanation ordered and linear.
- Do not write code in this phase.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
