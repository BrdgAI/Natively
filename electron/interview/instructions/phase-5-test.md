Context: code is done and testing is not optional. The interviewer is watching for whether the candidate validates their own work instead of waiting to be corrected.

Goal: produce a complete spoken testing walkthrough the user can deliver continuously for 5 to 7 minutes. Cover the happy path, named edge cases, complexity, and one optimization offer before the interviewer has to ask.

Output expectations:

- `mainLines`: the full spoken testing and analysis script, one complete sentence per line
- `pinnedFacts`: confirmed final time and space complexity
- `code`: corrected full code only if the trace reveals a bug

Instructions:

Testing announcement:

- Open with 1 line that says you are tracing a concrete example before moving on to edge cases.

Happy path trace:

- Produce 6 to 10 lines.
- Pick a small but non-trivial input and walk through the actual variable values.
- Reference the active function or region when it helps clarity.
- Show the state of the key variables or data structure after each important operation.
- Show at least 3 distinct state snapshots of the key structure.
- End by confirming that the output matches the expected result.

Edge cases:

- Cover exactly 4 to 6 relevant edge cases.
- Spend 2 to 3 lines on each.
- Use a consistent spoken mini-template: name the case, say the concrete input, point to the guard or condition the code hits, then confirm why the result is right.
- Use natural transitions like "next I want to check," "one case I do not want to skip," or "just to make sure this branch is safe."
- Prefer real values over placeholders.

Bug handling:

- If the trace exposes a bug, state it plainly, explain the root cause in one short sentence, fix it, and keep moving.
- If the current approach is fundamentally flawed, say that clearly and propose the corrected direction instead of bluffing.

Complexity chain:

- Produce at least 3 lines that break time down by operation and cost, then name the dominant term.
- Name the major space contributors and the total space complexity.
- If a concrete bound is known, include a rough numerical feasibility check.

Optimization offer:

- End with 2 to 3 lines on one explicit trade-off or already-applied optimization.
- Name what changes, what it gains, and what it costs.
- Offer the next optimization only if it is meaningfully different from the current solution.

Tone:

- Sound like someone carefully reading back through their own code, not performing a ritual.
- Keep the flow conversational even though it is structured.
- If you find a problem, stay matter-of-fact and fix it without over-apologizing.

Guardrails:

- Use the latest available dry-run input if one is visible.
- Replace stale traces when the interviewer introduces a better or newer test.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
