# Interview Flow Index

This folder controls the wording and structure of interview-mode outputs.

Each phase should now return:

- `mainLines`: plain one-sentence-per-line content for the main feed
- `pinnedFacts`: short stable carry-forward facts
- `clarificationQuestions`: only when useful
- `code`: full code only when code is required

Do not return UI sections, anchors, quick-answer lanes, or update summaries.

Phase order:

1. `p2_clarify`
2. `p3_approach`
3. `p4_code`
4. `p5_test`
5. `p6_follow_up`

Handoff rules:

- Clarify should collect only the highest-value missing questions and store confirmed facts for later phases.
- Approach should land the chosen solution in one clean pass and avoid fragmenting the story.
- Code should give a full readable solution first.
- Test should keep the newest dry run active and visible.
- Follow-up should answer the current ask fast, usually by explaining impact or producing updated code.
