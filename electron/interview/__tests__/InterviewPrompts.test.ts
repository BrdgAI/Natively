import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhasePrompt } from '../InterviewPrompts';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewOverlayPayload } from '../types';

test('clarify phase prompt includes the ordered clarify categories and the slim JSON contract', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);

  const prompt = buildPhasePrompt('p2_clarify', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    earlierMemory: [],
    previousPayload: null,
  });

  const inputIndex = prompt.indexOf('INPUT');
  const outputIndex = prompt.indexOf('OUTPUT');
  const constraintsIndex = prompt.indexOf('CONSTRAINTS');
  const edgeCasesIndex = prompt.indexOf('EDGE CASES');

  assert.ok(inputIndex >= 0);
  assert.ok(outputIndex > inputIndex);
  assert.ok(constraintsIndex > outputIndex);
  assert.ok(edgeCasesIndex > constraintsIndex);
  assert.ok(prompt.includes('"mainLines"'));
  assert.ok(prompt.includes('"clarificationQuestions"'));
  assert.ok(prompt.includes('"code"'));
  assert.equal(prompt.includes('`restate`'), false);
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
      'Output: return indices, not values.',
    ],
    pinnedFacts: ['Return indices, not values'],
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
    confirmedSpecLines: ['Output: return indices, not values.'],
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
  assert.ok(prompt.includes('Output: return indices, not values.'));
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
