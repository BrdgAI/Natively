import test from 'node:test';
import assert from 'node:assert/strict';
import { createLongInterviewTranscript } from '../__fixtures__/longInterview';
import { InterviewTranscriptMemoryManager } from '../InterviewTranscriptMemoryManager';
import { InterviewTranscriptEpoch } from '../types';

test('memory manager compacts once the final transcript crosses the trigger', () => {
  const manager = new InterviewTranscriptMemoryManager();
  const transcript = createLongInterviewTranscript(1000);

  const plan = manager.planCompaction(transcript, []);

  assert.ok(plan);
  assert.equal(plan?.compactedSegments.length, 300);
  assert.equal(plan?.startIndex, 0);
  assert.equal(plan?.endIndexExclusive, 300);
});

test('memory manager continues compacting below the trigger when epochs already exist', () => {
  const manager = new InterviewTranscriptMemoryManager();
  const transcript = createLongInterviewTranscript(700);
  const epochs: InterviewTranscriptEpoch[] = [
    {
      id: 'epoch-1',
      createdAt: 1700000100000,
      fromTimestamp: 1700000000000,
      toTimestamp: 1700000050000,
      compactedSegmentCount: 300,
      dominantPhases: ['p2_clarify'],
      summaryLines: ['Clarified the return contract.'],
      carryForwardFacts: ['Return indices, not values.'],
      openQuestions: [],
      source: 'fallback',
    },
  ];

  const plan = manager.planCompaction(transcript, epochs);

  assert.ok(plan);
  assert.equal(plan?.compactedSegments.length, 50);
  assert.equal(plan?.fromTimestamp, transcript[0].timestamp);
});

test('memory manager reports bounded prompt and vision epoch slices', () => {
  const manager = new InterviewTranscriptMemoryManager();
  const epochs: InterviewTranscriptEpoch[] = Array.from({ length: 5 }, (_, index) => ({
    id: `epoch-${index + 1}`,
    createdAt: 1700000000000 + index,
    fromTimestamp: 1700000000000 + index * 1000,
    toTimestamp: 1700000000999 + index * 1000,
    compactedSegmentCount: 300,
    dominantPhases: ['p3_approach'],
    summaryLines: [`Summary ${index + 1}`],
    carryForwardFacts: [`Fact ${index + 1}`],
    openQuestions: [] as string[],
    source: 'llm',
  }));

  assert.equal(manager.getPromptEpochs(epochs).length, 3);
  assert.equal(manager.getVisionEpochs(epochs, 'p4_code', 'Two Sum').length, 2);
  assert.equal(manager.getVisionEpochs(epochs, 'p2_clarify', 'Two Sum').length, 0);
});
