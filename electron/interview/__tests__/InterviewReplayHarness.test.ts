import test from 'node:test';
import assert from 'node:assert/strict';
import { FULL_SYNTHETIC_INTERVIEW } from '../__fixtures__/syntheticInterview';
import { replayInterviewTranscript } from '../InterviewReplayHarness';

test('replay harness walks through interview phases in order', () => {
  const result = replayInterviewTranscript(FULL_SYNTHETIC_INTERVIEW);

  assert.deepEqual(result.phases, [
    'p2_clarify',
    'p2_clarify',
    'p3_approach',
    'p3_approach',
    'p4_code',
    'p4_code',
    'p5_test',
    'p6_close',
  ]);
  assert.equal(result.snapshot.phase, 'p6_close');
  assert.equal(result.snapshot.sessionType, 'interview');
});
