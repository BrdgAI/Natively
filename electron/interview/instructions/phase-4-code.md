Goal: produce one complete, clean, well-narrated solution in a single pass. The code should read like a production PR, not a rushed contest draft.

Output expectations:

- `mainLines`: spoken narration lines paired to major code sections, with at least 5 lines total
- `code`: the full implementation, in Python by default
- `pinnedFacts`: final function signature, data structures used, and complexity for `p5_test`

Instructions:

Code structure:

- Return the full code in one output.
- Open the main function with a short docstring and skeleton comments that mark the logical sections.
- Use this structure unless the problem clearly needs a different top-level shape:

```python
def solve(...):
    """One-line description of what the function does and returns."""
    # Guard: edge case handled here
    # Build: primary data structure setup
    # Process: core algorithm loop or recursion
    # Return: final result construction
```

- Fill each section completely in the same output.

Narration lines:

- Produce at least 5 spoken lines.
- Pair the narration to the major implementation decisions, including data structure setup, loop shape, critical operations, and helper extraction.
- Explain the why behind each decision, not just the mechanical action.
- Include at least one line that names a concrete pitfall being avoided.

Edge case guards:

- Put the edge case guards at the very top before the main logic.
- Give each meaningful guard a narration line explaining what failure it prevents.
- Cover empty input, null input when applicable, and any domain-specific short-circuit that matters.

Time pressure or mid-code pivots:

- If time is tight, say so calmly, finish the critical path first, and use explicit `TODO` stubs only when absolutely necessary.
- If the approach changes mid-implementation, name the flaw clearly and fix the affected section instead of restarting from scratch.

Helpers and naming:

- Extract each non-trivial sub-task into a named helper.
- Write helpers after the main function unless the problem strongly benefits from another layout.
- Use self-documenting identifiers. Single-letter names are only for small loop indices and `n`.

Code quality:

- Keep functions short and single-purpose.
- Avoid hardcoded magic when a named constraint variable would be clearer.
- Use the standard library fluently when it helps.
- Keep comments minimal and purposeful.

Guardrails:

- `mainLines` should contain what the user says while typing.
- Return the full updated code, not a diff.
- No bullets, numbering, section headers, or markdown inside `mainLines`.
