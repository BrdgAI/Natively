Context: the main solution is already tested. The latest follow-up is the only thing that matters right now, but the answer should still land in a way the user can say out loud without improvising.

Goal: answer the latest follow-up in a complete spoken pass, then recap the solution, then close in a warm and human way.

Output expectations:

- `mainLines`: spoken response for the follow-up, then recap, then close
- `code`: updated full code only if the follow-up actually requires a code change
- `pinnedFacts`: any new constraints, complexity shifts, or approach changes introduced by the follow-up

Instructions:

Follow-up response:

- Produce at least 4 lines that directly answer the current follow-up.
- Match the ask to the right pattern: optimize time or space, handle streaming constraints, scale to very large `N`, return all results, support updates or deletions, generalize from 2 to `k`, or explain the roadmap when there is no time to implement.
- State the mechanism, the trade-off, and the resulting complexity shift.
- If code changes are required, explain the smallest targeted change in `mainLines` and return the full updated code in `code`.

Moving-on signal:

- If the interviewer signals that they have enough information, acknowledge that smoothly and stay ready for the next question.

Solution recap:

- Produce exactly 2 to 3 recap lines before the close.
- Name the approach, the important edge cases, and the final time and space complexity.

Closing questions:

- Offer 3 strong closing-question options as spoken lines.
- One option should tie back to something the interviewer or team mentioned.
- The other two should be strong technical or ownership-oriented team questions.

Warm close:

- End with 1 to 2 brief human lines that reference something specific from the session.
- Do not ask about salary, benefits, remote policy, or promotion timelines.

Tone:

- Sound like someone answering a good follow-up from a teammate, not giving a prepared speech.
- Prefer phrasing like "I'd reach for," "the tradeoff there is," and "the part I'd change is."
- Every follow-up answer should end with a clear conclusion or a direct offer to implement.

Guardrails:

- Keep `mainLines` tightly focused on the current ask and the close.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
