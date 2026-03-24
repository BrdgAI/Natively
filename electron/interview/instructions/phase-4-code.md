Context: the approach is locked. The candidate is coding in a plain Google Doc with no syntax highlighting, no auto-complete, and no execution.

Goal: produce the full solution in one complete block with useful in-code comments already in place. `mainLines` should carry the narration the user says while typing each major part.

Output expectations:

- `mainLines`: spoken narration lines paired to major code sections, with at least 5 lines total
- each `mainLines` entry should start with the exact code line or a tiny code snippet being typed, then continue with the plain-English reason in the same sentence
- `code`: the full implementation, in Python by default
- `pinnedFacts`: final function signature, data structures used, and complexity for `p5_test`

Instructions:

Code structure:

- Return the full code in one output.
- Put edge-case guards at the top, then the main logic, then helpers after the main function unless the problem clearly needs another layout.
- Use short section comments when they help the user stay oriented in the doc.
- Number those structure comments in the order the user should write the sections or functions.
- Do not force a docstring unless it genuinely helps this problem.
- Fill the whole solution in the same output.

Narration lines:

- Produce at least 5 spoken lines.
- Pair the narration to the major implementation decisions, including data structure setup, loop shape, critical operations, and helper extraction.
- Every narration line should start with the exact code line or a tiny code snippet being typed, then explain why it is being written that way.
- Example shape: `seen_by_value = {} because I want O(1) lookups while I scan once through the array.`
- Explain the why behind each decision, not just the mechanical action.
- Include at least one line that names a concrete pitfall being avoided.

Edge case guards:

- Put the edge case guards at the very top before the main logic.
- Give each meaningful guard a narration line explaining what failure it prevents.
- Cover empty input, null input when applicable, and any domain-specific short-circuit that matters.

Comments inside code:

- Keep comments short and useful.
- Use comments for why a choice was made, why a nearby alternative was not used, or what pitfall is being avoided.
- Let the structure comments double as a write-order guide, such as `# 1. edge-case guards`, `# 2. main scan`, or `# 3. helper for ...`.
- Do not waste comments on lines that are already obvious from the code itself.

Helpers and naming:

- Extract each non-trivial sub-task into a named helper.
- Write helpers after the main function unless the problem strongly benefits from another layout.
- Use self-documenting identifiers. Single-letter names are only for small loop indices and `n`.
- No copy-pasted logic blocks and no magic numbers when a named variable would be clearer.

Code quality:

- Implement the main happy path fully before secondary edge cases.
- Say that intention once in `mainLines` if it helps the user keep moving.
- Use the standard library fluently when it helps.
- If a loop boundary, sentinel value, or helper shape is non-obvious, narrate it explicitly.

Pacing check:

- Include one narration line that calmly checks whether the core logic is already down and whether there is still enough time left to test.

Tone:

- Sound like someone thinking out loud to a colleague while typing.
- Keep it casual, direct, and purposeful.
- Use contractions when they help.
- If you spot an issue mid-code, name it calmly and fix it without sounding rattled.

Guardrails:

- `mainLines` should contain what the user says while typing.
- Return the full updated code, not a diff.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
