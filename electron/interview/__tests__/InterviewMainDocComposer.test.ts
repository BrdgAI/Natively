import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewOverlayPayload } from '../types';

test('main doc composer creates phase documents with sections, quick answers, and updates', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });

  const payload: InterviewOverlayPayload = {
    phase: 'p3_approach',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    speakNow: ['I would start with brute force, then move to a hash map for O n time.'],
    speakIfAsked: ['Space would be O n because the map stores prior values.'],
    writeNow: [],
    thoughtNotes: [],
    quickQuestions: ['Why not sort the array first?'],
    pinnedFacts: ['One-pass hash map solution'],
    changes: [],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: ledger.getSnapshot().inputRevision,
  };

  const document = composer.compose(ledger.getSnapshot(), payload);

  assert.equal(document.phase, 'p3_approach');
  assert.equal(document.mainSections.length > 0, true);
  assert.equal(document.quickAnswers.length, 1);
  assert.equal(document.updateSummary.status, 'updated');
});

test('main doc composer can mark an existing phase document as unchanged', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });

  const payload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    speakNow: ['Let me restate the problem first.'],
    speakIfAsked: [],
    writeNow: ['Write down the input and output contract.'],
    thoughtNotes: [],
    quickQuestions: [],
    pinnedFacts: ['Return indices'],
    changes: [],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: ledger.getSnapshot().inputRevision,
  };

  const document = composer.compose(ledger.getSnapshot(), payload);
  const unchanged = composer.withNoUpdate(document, 'No updates');

  assert.equal(unchanged.mainSections.length, document.mainSections.length);
  assert.equal(unchanged.updateSummary.status, 'unchanged');
  assert.equal(unchanged.updateSummary.message, 'No updates');
});
