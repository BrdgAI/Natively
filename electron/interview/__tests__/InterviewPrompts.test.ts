import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhasePrompt } from '../InterviewPrompts';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewOverlayPayload } from '../types';

test('clarify phase prompt includes the simplified one-shot clarify guidance and the slim JSON contract', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);

  const prompt = buildPhasePrompt('p2_clarify', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [
      {
        speaker: 'interviewer',
        text: 'Please clarify the return contract before you code.',
        timestamp: 1700000000000,
        final: true,
      },
    ],
    earlierMemory: [
      {
        id: 'epoch-1',
        createdAt: 1700000000500,
        fromTimestamp: 1700000000000,
        toTimestamp: 1700000000400,
        compactedSegmentCount: 300,
        dominantPhases: ['p2_clarify'],
        summaryLines: ['Candidate already discussed hash maps.'],
        carryForwardFacts: ['Return indices, not values.'],
        openQuestions: ['Whether duplicates are allowed.'],
        source: 'llm',
      },
    ],
    screenAnalysis: {
      screenshotPath: '/tmp/interview-clarify.png',
      capturedAt: 1700000000600,
      problemStatement: 'Two Sum from the prompt',
      givenConstraints: ['Exactly one answer exists', 'Do better than O n squared'],
      examples: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
      visibleQuestions: ['Should the answer return indices?'],
      hints: ['The interviewer wants the assumptions stated out loud.'],
    },
    previousPayload: null,
  });

  assert.ok(prompt.includes('Produce 2 to 4 short spoken lines before the first question.'));
  assert.ok(prompt.includes('Do not include note-style lines such as `Write in notes:`'));
  assert.ok(prompt.includes('Ask the question directly in one line.'));
  assert.ok(prompt.includes('Problem statement:'));
  assert.ok(prompt.includes('Two Sum from the prompt'));
  assert.ok(prompt.includes('Visible constraints:'));
  assert.ok(prompt.includes('Do better than O n squared'));
  assert.ok(prompt.includes('Visible hints:'));
  assert.ok(prompt.includes('The interviewer wants the assumptions stated out loud.'));
  assert.ok(prompt.includes('Recent transcript:'));
  assert.ok(prompt.includes('[INTERVIEWER] Please clarify the return contract before you code.'));
  assert.equal(prompt.includes('Earlier interview memory:'), false);
  assert.equal(prompt.includes('Relevant phase handoffs:'), false);
  assert.equal(prompt.includes('Current code:'), false);
  assert.equal(prompt.includes('Pinned facts:'), false);
  assert.equal(prompt.includes('Open clarification questions:'), false);
  assert.equal(prompt.includes('Approach summary:'), false);
  assert.ok(prompt.includes('`mainLines`'));
  assert.ok(prompt.includes('`clarificationQuestions`'));
  assert.ok(prompt.includes('`code`'));
});

test('approach prompt receives confirmed clarify handoff context', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);
  const snapshot = ledger.getSnapshot();

  const clarifyPayload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Let me restate the problem first.',
      'The output should be the two indices, not the values themselves.',
    ],
    pinnedFacts: ['Return indices, not values.'],
    clarificationQuestions: [
      {
        text: 'Should I assume the input is unsorted?',
        why: 'Sortedness changes the approach.',
      },
    ],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
  };

  const phaseDocument = composer.compose(snapshot, clarifyPayload, {
    savedContexts: snapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  ledger.applyGeneratedPayload(clarifyPayload, phaseDocument, undefined, {
    summaryLines: ['Let me restate the problem first.'],
    confirmedSpecLines: ['Return indices, not values.'],
    openQuestions: ['Should I assume the input is unsorted?'],
    updatedAt: clarifyPayload.generatedAt,
  });

  const prompt = buildPhasePrompt('p3_approach', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    earlierMemory: [],
    previousPayload: clarifyPayload,
  });

  assert.ok(prompt.includes('Clarify handoff'));
  assert.ok(prompt.includes('Return indices, not values.'));
  assert.ok(prompt.includes('Should I assume the input is unsorted?'));
});

test('coding prompt includes earlier interview memory ahead of recent transcript', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists']);

  const prompt = buildPhasePrompt('p4_code', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [
      {
        speaker: 'interviewer',
        text: 'Please start coding.',
        timestamp: 1700000000000,
        final: true,
      },
    ],
    earlierMemory: [
      {
        id: 'epoch-1',
        createdAt: 1700000000500,
        fromTimestamp: 1700000000000,
        toTimestamp: 1700000000400,
        compactedSegmentCount: 300,
        dominantPhases: ['p2_clarify', 'p3_approach'],
        summaryLines: ['Candidate confirmed a hash map approach.'],
        carryForwardFacts: ['Return indices, not values.'],
        openQuestions: ['Whether duplicates are allowed.'],
        source: 'llm',
      },
    ],
    previousPayload: null,
  });

  const earlierMemoryIndex = prompt.indexOf('Earlier interview memory:');
  const recentTranscriptIndex = prompt.indexOf('Recent transcript:');

  assert.ok(earlierMemoryIndex >= 0);
  assert.ok(recentTranscriptIndex > earlierMemoryIndex);
  assert.ok(prompt.includes('Candidate confirmed a hash map approach.'));
  assert.ok(prompt.includes('Return indices, not values.'));
});
