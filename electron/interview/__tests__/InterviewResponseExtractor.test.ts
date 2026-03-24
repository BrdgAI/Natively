import test from 'node:test';
import assert from 'node:assert/strict';
import { extractInterviewResponse } from '../InterviewResponseExtractor';

test('response extractor parses wrapped JSON fences into display fields', () => {
  const extracted = extractInterviewResponse(`
Here is the response:

\`\`\`json
{
  "mainLines": [
    "Let me restate the problem first.",
    "What is the maximum input size?"
  ],
  "pinnedFacts": [
    "Return indices, not values."
  ],
  "clarificationQuestions": [
    {
      "text": "Can there be duplicates?",
      "why": "This changes edge handling."
    }
  ],
  "code": {
    "language": "python",
    "content": "def solve(nums, target):\\n    return None"
  }
}
\`\`\`
`);

  assert.deepEqual(extracted.mainLines, [
    'Let me restate the problem first.',
    'What is the maximum input size?',
  ]);
  assert.deepEqual(extracted.pinnedFacts, ['Return indices, not values.']);
  assert.deepEqual(extracted.clarificationQuestions, [
    {
      text: 'Can there be duplicates?',
      why: 'This changes edge handling.',
    },
  ]);
  assert.equal(extracted.code?.language, 'python');
  assert.equal(extracted.code?.content, 'def solve(nums, target):\n    return None');
});

test('response extractor recovers known keys from malformed JSON without leaking raw keys', () => {
  const extracted = extractInterviewResponse(`
{
  "mainLines": [
    "Let me restate the problem first.",
    "What is the maximum input size?",
  ],
  "clarificationQuestions": [
    { "text": "Can there be duplicates?", "why": "This changes edge handling.", },
  ],
  "pinnedFacts": [
    "Return indices, not values.",
  ],
  "code": {
    "language": "python",
    "content": "def solve(nums, target):\\n    return None",
  },
}
`);

  assert.deepEqual(extracted.mainLines, [
    'Let me restate the problem first.',
    'What is the maximum input size?',
  ]);
  assert.equal(extracted.mainLines.some((line) => line.includes('mainLines')), false);
  assert.equal(extracted.mainLines.some((line) => line.includes('{')), false);
  assert.deepEqual(extracted.clarificationQuestions, [
    {
      text: 'Can there be duplicates?',
      why: 'This changes edge handling.',
    },
  ]);
  assert.equal(extracted.code?.content, 'def solve(nums, target):\n    return None');
});

test('response extractor salvages plain text lines and standalone code blocks cleanly', () => {
  const extracted = extractInterviewResponse(`
Let me restate the problem first.
I would ask about input size before choosing an approach.

\`\`\`python
def solve(nums, target):
    return None
\`\`\`
`);

  assert.deepEqual(extracted.mainLines, [
    'Let me restate the problem first.',
    'I would ask about input size before choosing an approach.',
  ]);
  assert.equal(extracted.code?.language, 'python');
  assert.equal(extracted.code?.content, 'def solve(nums, target):\n    return None');
});

test('response extractor preserves structured json main lines entry-by-entry instead of re-splitting them', () => {
  const extracted = extractInterviewResponse(JSON.stringify({
    mainLines: [
      'I would keep hash map alive for now because it matches the input shape. Two pointers only works if I sort first, which changes the story.',
    ],
    pinnedFacts: [],
    clarificationQuestions: [],
    code: null,
  }), 'p3_approach');

  assert.deepEqual(extracted.mainLines, [
    'I would keep hash map alive for now because it matches the input shape. Two pointers only works if I sort first, which changes the story.',
  ]);
});

test('response extractor keeps code-line-prefixed narration intact in plain-text fallback', () => {
  const extracted = extractInterviewResponse(`
if complement in seen_by_value: because I can return the answer as soon as I find the pair. It also keeps this loop single-pass.
return [seen_by_value[complement], index] because the output contract wants indices, not values.
`, 'p4_code');

  assert.deepEqual(extracted.mainLines, [
    'if complement in seen_by_value: because I can return the answer as soon as I find the pair. It also keeps this loop single-pass.',
    'return [seen_by_value[complement], index] because the output contract wants indices, not values.',
  ]);
});

test('response extractor preserves longer phase-specific main line lists for approach and testing scripts', () => {
  const extracted = extractInterviewResponse(JSON.stringify({
    mainLines: Array.from({ length: 40 }, (_, index) => `Approach line ${index + 1}.`),
    pinnedFacts: [],
    clarificationQuestions: [],
    code: null,
  }), 'p3_approach');

  assert.equal(extracted.mainLines.length, 40);
  assert.equal(extracted.mainLines[39], 'Approach line 40.');

  const testingExtracted = extractInterviewResponse(JSON.stringify({
    mainLines: Array.from({ length: 42 }, (_, index) => `Testing line ${index + 1}.`),
    pinnedFacts: [],
    clarificationQuestions: [],
    code: null,
  }), 'p5_test');

  assert.equal(testingExtracted.mainLines.length, 42);
  assert.equal(testingExtracted.mainLines[41], 'Testing line 42.');
});
