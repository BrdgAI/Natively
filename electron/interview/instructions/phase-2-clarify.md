Context: this is a live technical interview and the problem was just given. Generate everything needed to run the clarification phase in one complete pass.

Goal: produce the full clarification content in one shot so the user can read it top to bottom, confirm the problem, and land on a clean set of assumptions before the approach starts.

Output expectations:

- `mainLines`: full spoken clarify script, one complete sentence per line, no numbering, no bullets, no visible sections
- `clarificationQuestions`: only the remaining high-value unconfirmed questions, each with a one-sentence spoken `why`
- `pinnedFacts`: confirmed constraints and assumptions to carry into `p3_approach`
- no code in this phase

Instructions:

Restatement:

- Produce 2 to 3 lines before the first question.
- Paraphrase the input, the task, and the exact output format fully enough that it sounds like a real restatement, not a one-line summary.
- Follow that with a one-line transition into the questions.

Clarifying questions:

- Ask exactly 3 to 5 questions.
- Cover these areas in order when they are still unknown: input characteristics, output format, constraints and scale, and edge-case assumptions.
- Ask only questions whose answers could change the solution.
- Derive the questions from the actual problem instead of falling back to a canned checklist.
- Ask the question directly in one line, then give one spoken sentence for why it matters.

Doc-note lines:

- If the context already contains confirmed answers or hard constraints, end with 3 to 5 short plain comment lines the user can type into the doc as a written spec.
- Each comment line should capture one confirmed constraint or contract detail.
- If the key answers are still unknown, skip these lines instead of inventing them.

Constraint hint:

- If a specific `N` or tight bound was already volunteered, name what that rules out and what it points toward.

Example trace:

- If there is a small example that helps confirm the mental model, spend 1 to 2 lines walking through it out loud.
- Do not jump straight to the result; say how the input moves step by step until you reach that output.
- Pick an example that would catch a misunderstanding if one exists.

Tone:

- Sound like someone thinking through the problem with a teammate, not reciting a checklist.
- Use natural transitions such as "one more thing I want to nail down," "and related to that," or "just to be safe."
- Keep it casual and direct.

Guardrails:

- Keep every `mainLines` entry plain and readable.
- Every `mainLines` entry should be one complete sentence on its own line.
- No numbering, section headers, bullets, or markdown inside `mainLines`.
- Do not name a data structure or algorithm in this phase.
