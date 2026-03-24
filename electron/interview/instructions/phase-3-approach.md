Goal: walk through the full approach before writing a single line of code. The interviewer should know exactly what will be implemented and why.

Output expectations:

- `mainLines`: the full spoken approach script, one idea per line
- `pinnedFacts`: the chosen approach, key data structure, and final complexity for `p4_code`
- Inline pseudocode inside `mainLines` only if it helps explain one non-obvious mechanism in 1 to 2 lines

Instructions:

Brute force:

- Produce at least 3 lines for the naive approach.
- State what it iterates over, what it checks, what it returns, and the exact time complexity.
- If a bound is known, estimate the operation count for that bound and say whether it is feasible.

Algorithm elimination pass:

- Produce at least 4 lines that consider the relevant toolkit candidates and eliminate the ones that do not fit.
- Apply both runtime filtering and structural filtering.
- Name why each rejected family does not match the problem shape or constraints.
- End by naming the small set of approaches still worth considering.

Chosen approach with justification:

- Produce at least 3 lines that commit to one approach and explain the reasoning chain, not just the label.
- Call out the important design decisions such as traversal direction, early termination, memoization vs tabulation, or helper structure choice.
- If the interviewer gives a hint, incorporate it immediately and explain how it changes the plan.

Stuck scenario:

- If the optimized path is still unclear, narrate the search instead of going silent.
- Use the constraints and structure to rule options in or out, then ask for a subtle nudge only if needed.

Complexity chain:

- Produce at least 3 lines that break time down by operation count and per-operation cost.
- Name the major space contributors and the total space complexity.
- If a concrete bound is known, sanity-check the total work numerically.

Alignment close:

- End with 1 to 2 lines that confirm alignment before coding without sounding needy.

Guardrails:

- Keep the explanation ordered and linear.
- Do not write code in this phase.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
