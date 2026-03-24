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

test('response extractor preserves longer main line lists needed for deeper testing scripts', () => {
  const extracted = extractInterviewResponse(JSON.stringify({
    mainLines: Array.from({ length: 24 }, (_, index) => `Line ${index + 1}.`),
    pinnedFacts: [],
    clarificationQuestions: [],
    code: null,
  }));

  assert.equal(extracted.mainLines.length, 24);
  assert.equal(extracted.mainLines[23], 'Line 24.');
});
