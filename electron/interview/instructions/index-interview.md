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
The spoken lines are read directly from the screen, so they need to sound like normal human conversation, not polished office writing.

Phase intent:

- `p2_clarify` should complete the clarification pass in one shot, sound conversational, and leave a clean handoff of confirmed facts plus open questions.
- `p3_approach` should feel like real brainstorming out loud: brute force, elimination, candidate comparison, decision, and complexity before any code is written.
- `p4_code` should produce one complete readable implementation while the narration mirrors what is being typed and explains why the code is shaped that way.
- `p5_test` should feel like a real self-check: trace one concrete example, walk edge cases in a consistent spoken rhythm, and restate complexity clearly.
- `p6_follow_up` should answer the latest follow-up directly, recap the final solution, and close with thoughtful, human questions.

Handoff discipline:

- Clarify should store only confirmed facts and unresolved questions that genuinely matter downstream.
- Approach should land one chosen path clearly enough that coding can start without re-explaining the whole solution.
- Code should return the full current solution, not a partial fragment.
- Test should keep the newest dry run active and replace stale traces when a better test appears.
- Follow-up should stay tightly scoped to the latest ask while preserving the current solution context.
