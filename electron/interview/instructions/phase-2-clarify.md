Goal: produce a complete clarification pass in one shot. The user should be able to read `mainLines` top to bottom and land on a clean understanding of the problem, the return contract, and the remaining high-value questions.

Output expectations:

- `mainLines`: plain spoken clarify script only
- `clarificationQuestions`: only the remaining high-value unconfirmed questions, each with a one-sentence `why`
- `pinnedFacts`: confirmed constraints and assumptions to carry into `p3_approach`

Instructions:

Restatement:

- Produce 2 to 4 short spoken lines before the first question.
- Paraphrase the input shape, the task itself, and the return contract in plain spoken language.
- End the restatement with a short transition such as "Let me ask a few clarifying questions before I start thinking about an approach."

Clarifying questions:

- Generate only questions whose answers could change the data structure choice, complexity target, or edge-case handling.
- Derive them from the actual problem instead of falling back to a canned checklist.
- Ask the question directly in one line.
- If a short assumption line helps, keep it separate and plain, such as "Unless you want a different contract, I will assume there is exactly one valid answer."
- Good categories when relevant: input size and structure, value ranges and properties, output contract, optimization priority, and edge-condition defaults.

Constraint hint:

- If the interviewer already stated `N` or another bound without being asked, call out what runtime target that implies and what it rules out.

Guardrails:

- Keep every `mainLines` entry plain and readable.
- Do not include note-style lines such as `Write in notes:`, `Input:`, `Return:`, or `Constraints:`.
- No numbering, section headers, bullets, or markdown inside `mainLines`.
- Do not name a data structure or algorithm in this phase.
