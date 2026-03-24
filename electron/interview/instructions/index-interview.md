# Interview Flow Index

This folder controls the live interview generator prompts for:

1. `p2_clarify`
2. `p3_approach`
3. `p4_code`
4. `p5_test`
5. `p6_follow_up`

Shared response contract:

- `mainLines`: the direct spoken script the candidate can read out loud
- `pinnedFacts`: short stable facts worth carrying into later phases
- `clarificationQuestions`: only the remaining high-value open questions, each with a concise `why`
- `code`: full code only when code is actually needed

Do not return UI sections, side lanes, summaries about the JSON, or assistant framing.

Phase intent:

- `p2_clarify` should complete the clarification pass in one shot, using only plain spoken clarify lines and a clean handoff.
- `p3_approach` should walk brute force, elimination, chosen approach, and complexity before any code is written.
- `p4_code` should produce one complete readable implementation while the narration explains the key decisions.
- `p5_test` should trace with real values, cover edge cases, and restate complexity, returning corrected full code only if a bug is found.
- `p6_follow_up` should answer the follow-up directly, recap the final solution, and close with strong interview-style questions.

Handoff discipline:

- Clarify should store only confirmed facts and unresolved questions that genuinely matter downstream.
- Approach should land one chosen path clearly enough that coding can start without re-explaining the whole solution.
- Code should return the full current solution, not a partial fragment.
- Test should keep the newest dry run active and replace stale traces when a better test appears.
- Follow-up should stay tightly scoped to the latest ask while preserving the current solution context.
