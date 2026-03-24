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
    mainLines: [
      'Let me restate the problem first.',
      'What exactly should be returned: indices or values?',
    ],
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

test('main doc composer appends only net-new lines and reports no updates when nothing changed', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const initialSnapshot = ledger.getSnapshot();

  const firstPayload: InterviewOverlayPayload = {
    phase: 'p3_approach',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'I would start with brute force.',
      'Then I would move to a hash map.',
    ],
    pinnedFacts: ['Use a hash map'],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: initialSnapshot.inputRevision,
  };

  const firstDocument = composer.compose(initialSnapshot, firstPayload, {
    savedContexts: initialSnapshot.phaseDocuments.p3_approach.savedContexts,
  });

  ledger.applyGeneratedPayload(firstPayload, firstDocument);
  const secondSnapshot = ledger.getSnapshot();

  const repeatedPayload: InterviewOverlayPayload = {
    ...firstPayload,
    generatedAt: Date.now() + 1,
    inputRevision: secondSnapshot.inputRevision,
  };
  const unchangedDocument = composer.compose(secondSnapshot, repeatedPayload, {
    savedContexts: secondSnapshot.phaseDocuments.p3_approach.savedContexts,
  });

  assert.equal(
    unchangedDocument.mainFeed.filter((entry) => entry.type === 'line').length,
    2
  );
  assert.equal(unchangedDocument.status.status, 'unchanged');
  assert.equal(unchangedDocument.status.message, 'No updates found');

  const partialPayload: InterviewOverlayPayload = {
    ...repeatedPayload,
    generatedAt: Date.now() + 2,
    mainLines: [
      ...repeatedPayload.mainLines,
      'The hash map gives O n time and O n space.',
    ],
  };
  const partialDocument = composer.compose(secondSnapshot, partialPayload, {
    savedContexts: secondSnapshot.phaseDocuments.p3_approach.savedContexts,
  });
  const partialLines = partialDocument.mainFeed
    .filter((entry) => entry.type === 'line')
    .map((entry) => entry.text);

  assert.deepEqual(partialLines, [
    'I would start with brute force.',
    'Then I would move to a hash map.',
    'The hash map gives O n time and O n space.',
  ]);
  assert.equal(partialDocument.status.status, 'updated');
});

test('main doc composer replaces clarify lines in place and keeps the feed flat', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const initialSnapshot = ledger.getSnapshot();

  const firstPayload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Let me restate the problem first.',
      'What exactly should be returned: indices or values?',
    ],
    pinnedFacts: [],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: initialSnapshot.inputRevision,
  };

  const firstDocument = composer.compose(initialSnapshot, firstPayload, {
    savedContexts: initialSnapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  ledger.applyGeneratedPayload(firstPayload, firstDocument);

  const secondSnapshot = ledger.getSnapshot();
  const secondPayload: InterviewOverlayPayload = {
    ...firstPayload,
    generatedAt: Date.now() + 1,
    inputRevision: secondSnapshot.inputRevision,
    mainLines: [
      'Let me restate the problem first: Two Sum.',
      'What exactly should be returned: indices or values?',
      'What is the maximum input size we should optimize for?',
    ],
  };

  const appendedDocument = composer.compose(secondSnapshot, secondPayload, {
    savedContexts: secondSnapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  const feedLines = appendedDocument.mainFeed.filter((entry) => entry.type === 'line');

  assert.deepEqual(feedLines.map((entry) => entry.text), [
    'Let me restate the problem first: Two Sum.',
    'What exactly should be returned: indices or values?',
    'What is the maximum input size we should optimize for?',
  ]);
  assert.equal(appendedDocument.mainFeed.every((entry) => entry.type === 'line'), true);
  assert.equal(appendedDocument.status.status, 'updated');
});

test('main doc composer reports clarify as unchanged when the latest flat lines are text-identical', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const initialSnapshot = ledger.getSnapshot();

  const payload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Let me restate the problem first.',
      'Return: the two indices, not the values.',
      'Should I assume the input is unsorted?',
    ],
    pinnedFacts: ['Return indices, not values.'],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: initialSnapshot.inputRevision,
  };

  const firstDocument = composer.compose(initialSnapshot, payload, {
    savedContexts: initialSnapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  ledger.applyGeneratedPayload(payload, firstDocument);

  const nextSnapshot = ledger.getSnapshot();
  const unchangedDocument = composer.compose(nextSnapshot, {
    ...payload,
    generatedAt: Date.now() + 1,
    inputRevision: nextSnapshot.inputRevision,
  }, {
    savedContexts: nextSnapshot.phaseDocuments.p2_clarify.savedContexts,
  });

  assert.equal(unchangedDocument.status.status, 'unchanged');
  assert.equal(unchangedDocument.mainFeed.every((entry) => entry.type === 'line'), true);
  assert.deepEqual(
    unchangedDocument.mainFeed.filter((entry) => entry.type === 'line').map((entry) => entry.text),
    payload.mainLines
  );
});

test('main doc composer keeps clarify entries state-free for rendering', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const snapshot = ledger.getSnapshot();

  const payload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Let me restate the problem first.',
      'What exactly should be returned: indices or values?',
      'What is the maximum input size we should optimize for?',
    ],
    pinnedFacts: ['Return indices, not values.'],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
  };

  const document = composer.compose(snapshot, payload, {
    clarificationItems: [],
    savedContexts: snapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  const feedLines = document.mainFeed.filter((entry) => entry.type === 'line');

  assert.deepEqual(feedLines.map((entry) => entry.state), [null, null, null]);
});
