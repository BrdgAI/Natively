import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewOverlayPayload } from '../types';

test('main doc composer creates a flat feed with deterministic status updates', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const snapshot = ledger.getSnapshot();

  const payload: InterviewOverlayPayload = {
    phase: 'p3_approach',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'I would start with brute force, then move to a hash map for O n time.',
      'Space would be O n because the map stores prior values.',
    ],
    pinnedFacts: ['One-pass hash map solution'],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
  };

  const document = composer.compose(snapshot, payload, {
    savedContexts: snapshot.phaseDocuments.p3_approach.savedContexts,
  });
  const feedLines = document.mainFeed.filter((entry) => entry.type === 'line');

  assert.equal(document.phase, 'p3_approach');
  assert.equal(document.mainFeed[0]?.type, 'header');
  assert.equal(document.mainFeed[1]?.type, 'divider');
  assert.deepEqual(feedLines.map((entry) => entry.text), payload.mainLines);
  assert.deepEqual(feedLines.map((entry) => entry.state), ['active', 'active']);
  assert.equal(document.status.status, 'updated');
  assert.deepEqual(document.status.updatedSections, ['Main']);
});

test('main doc composer can mark an existing phase document as unchanged', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const snapshot = ledger.getSnapshot();

  const payload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: ['Let me restate the problem first.', 'Write down the input and output contract.'],
    pinnedFacts: ['Return indices'],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
  };

  const document = composer.compose(snapshot, payload, {
    savedContexts: snapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  const unchanged = composer.withNoUpdate(document, 'No updates');

  assert.equal(unchanged.mainFeed.length, document.mainFeed.length);
  assert.equal(unchanged.status.status, 'unchanged');
  assert.equal(unchanged.status.message, 'No updates');
});
