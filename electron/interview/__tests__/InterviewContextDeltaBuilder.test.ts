import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewContextDeltaBuilder } from '../InterviewContextDeltaBuilder';
import { InterviewSavedContext, InterviewSessionSnapshot } from '../types';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';

function createEmptyContext(title: string): InterviewSavedContext {
  return {
    title,
    lines: [],
    updatedAt: null,
  };
}

function createSnapshot(): InterviewSessionSnapshot {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  return ledger.getSnapshot();
}

test('screen context builder keeps the latest visible screen summary', () => {
  const builder = new InterviewContextDeltaBuilder();
  const screenContext = builder.buildSavedScreenContext(
    createEmptyContext('Last screen context saved'),
    {
      screenshotPath: '/tmp/interview-screen.png',
      capturedAt: 1700000000000,
      problemStatement: 'Two Sum',
      givenConstraints: ['Exactly one answer exists'],
      hints: ['The interviewer wants the optimal solution'],
      extractedTests: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
      likelyMistakes: ['Do not return the values'],
    }
  );

  assert.equal(screenContext.title, 'Last screen context saved');
  assert.deepEqual(screenContext.lines, [
    'Problem: Two Sum',
    'Constraints: Exactly one answer exists',
    'Hints: The interviewer wants the optimal solution',
    'Tests: nums = [2,7,11,15], target = 9 -> [0,1]',
  ]);
  assert.equal(screenContext.updatedAt, 1700000000000);
});

test('normal context builder uses recent transcript and active follow-up details', () => {
  const builder = new InterviewContextDeltaBuilder();
  const snapshot = createSnapshot();
  const nextSnapshot: InterviewSessionSnapshot = {
    ...snapshot,
    activeFollowUp: {
      request: 'Return None instead of an empty list.',
      impactedArea: 'Final return line',
      diffRequired: true,
      derivedFrom: 'transcript',
    },
    lastTranscriptAt: 1700000001000,
  };
  const normalContext = builder.buildSavedNormalContext(
    createEmptyContext('Last normal context saved'),
    nextSnapshot,
    [
      {
        speaker: 'interviewer',
        text: 'Can you return None instead of an empty list?',
        timestamp: 1700000000000,
        final: true,
      },
      {
        speaker: 'user',
        text: 'Yes, I would only update the final return path.',
        timestamp: 1700000001000,
        final: true,
      },
    ]
  );

  assert.equal(normalContext.title, 'Last normal context saved');
  assert.deepEqual(normalContext.lines, [
    '[INTERVIEWER] Can you return None instead of an empty list?',
    '[USER] Yes, I would only update the final return path.',
    'Follow-up: Return None instead of an empty list.',
    'Impact: Final return line',
  ]);
  assert.equal(normalContext.updatedAt, 1700000001000);
});
