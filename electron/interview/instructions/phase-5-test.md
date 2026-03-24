Goal: produce a thorough self-driven test walkthrough and a complete complexity analysis. Finding and fixing your own bug before the interviewer does is a positive signal.

Output expectations:

- `mainLines`: the full spoken testing and analysis script
- `pinnedFacts`: confirmed final time and space complexity
- `code`: corrected full code only if the trace reveals a bug

Instructions:

Testing announcement:

- Open the phase explicitly with one line that says you are tracing a concrete example before moving on.

Happy path trace:

- Produce at least 6 lines.
- Pick a small but non-trivial input and walk through the actual variable values.
- Reference the active function or region when it helps clarity.
- Show at least 3 distinct state snapshots of the key structure.
- End by confirming that the output matches the expected result.

Edge cases:

- Cover at least 4 relevant edge cases.
- Spend 2 to 3 lines on each: name the case, describe the input, point to the guard or condition that handles it, and explain why the result is correct.
- Prefer real values over placeholders.

Bug handling:

- If the trace exposes a bug, acknowledge it calmly, explain the root cause briefly, and return the corrected full code.
- If the current approach is fundamentally flawed, state that clearly and propose the corrected direction instead of bluffing.

Complexity chain:

- Produce at least 3 lines that break time down by operation and cost, then name the dominant term.
- Name the major space contributors and the total space complexity.
- If a concrete bound is known, include a numerical feasibility check.

Optimization offer:

- End with 2 to 3 lines on one explicit trade-off or already-applied optimization.
- Offer the next optimization only if it is meaningfully different from the current solution.

Guardrails:

- Use the latest available dry-run input if one is visible.
- Replace stale traces when the interviewer introduces a better or newer test.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
