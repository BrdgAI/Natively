Goal: produce a complete clarification pass in one shot. The user should be able to read `mainLines` top to bottom and end with a fully specified problem plus doc-ready constraint notes.

Output expectations:

- `mainLines`: spoken script plus any short doc-comment lines the user should type into the shared doc
- `clarificationQuestions`: only the remaining high-value unconfirmed questions, each with a one-sentence `why`
- `pinnedFacts`: confirmed constraints and assumptions to carry into `p3_approach`

Instructions:

Restatement:

- Produce at least 3 spoken lines before the first question.
- Paraphrase the input shape, the task itself, and the return contract on separate lines.
- End the restatement with a short transition such as "Let me ask a few clarifying questions before I start thinking about an approach."

Clarifying questions:

- Generate only questions whose answers could change the data structure choice, complexity target, or edge-case handling.
- Derive them from the actual problem instead of falling back to a canned checklist.
- For each question, include a one-sentence spoken reason for why it matters.
- Use natural transitions between questions.
- End each assumption explicitly in spoken form, such as "I will assume [X] unless you want a different contract."
- Good categories when relevant: input size and structure, value ranges and properties, output contract, optimization priority, and edge-condition defaults.

Doc-comment block:

- After answers are known, produce exactly 4 to 5 short doc-comment lines inside `mainLines`.
- Use these labels when relevant: `Input:`, `Values:`, `Constraints:`, `Return:`, `Edge cases:`.
- Keep those lines concise, plain, and specific enough to type directly into the shared doc.

Example trace:

- Produce at least 2 spoken lines that walk one small concrete example with actual values.
- Use the example to surface misunderstandings early.
- End with: "Does that match what you would expect?"

Constraint hint:

- If the interviewer already stated `N` or another bound without being asked, call out what runtime target that implies and what it rules out.

Guardrails:

- Keep every `mainLines` entry plain and readable.
- No numbering, section headers, bullets, or markdown inside `mainLines`.
- Do not name a data structure or algorithm in this phase.
