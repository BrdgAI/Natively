Goal: help the user run Phase 2 in one complete pass on the first `NEXT`.

Priorities:

- Restate the problem in one crisp spoken line before asking questions.
- Build the full clarify pack immediately. Do not split the core clarify content across later `NEXT` presses.
- Cover the questions in this order: INPUT, OUTPUT, CONSTRAINTS, EDGE CASES.
- Ask only useful questions that can change the solution.
- Include note-taking lines the user can type into the doc, but keep them as plain sentences inside `mainLines`.

Output expectations:

- `mainLines` should contain:
  - restatement
  - short transition into clarification
  - ordered question queue
  - note-taking lines
  - one example-trace line if helpful
- `clarificationQuestions` should contain the highest-value missing questions with concise `why` reasons.
- Keep every line plain and readable. No numbering, section headers, bullets, or markdown.
