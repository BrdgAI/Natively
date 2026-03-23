import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClarificationId, InterviewClarifyPlanner } from '../InterviewClarifyPlanner';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';

test('clarify planner keeps matching questions, marks answered items, and replaces stale ones', () => {
  const ledger = new InterviewMemoryLedger();
  const planner = new InterviewClarifyPlanner();

  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], []);
  ledger.setClarificationItems([
    {
      id: buildClarificationId('Can I assume exactly one answer exists?'),
      text: 'Can I assume exactly one answer exists?',
      why: 'This affects whether I need fallback handling.',
      status: 'pending',
      answer: '',
      revision: 2,
      replacementReason: '',
    },
    {
      id: buildClarificationId('Is the input sorted?'),
      text: 'Is the input sorted?',
      why: 'This affects whether two pointers is available.',
      status: 'pending',
      answer: '',
      revision: 2,
      replacementReason: '',
    },
  ]);

  const items = planner.plan(
    ledger.getSnapshot(),
    [
      {
        text: 'Can I assume exactly one answer exists?',
        why: 'This affects fallback handling.',
      },
      {
        text: 'Should I return indices or values?',
        why: 'This changes the output contract.',
      },
    ],
    [
      {
        speaker: 'user',
        text: 'Let me confirm whether there is exactly one answer.',
        timestamp: Date.now(),
        final: true,
      },
    ]
  );

  const byId = new Map(items.map((item) => [item.id, item]));

  assert.equal(byId.get(buildClarificationId('Can I assume exactly one answer exists?'))?.status, 'answered');
  assert.equal(byId.get(buildClarificationId('Is the input sorted?'))?.status, 'replaced');
  assert.equal(byId.get('should-i-return-indices-or-values')?.status, 'pending');
});
