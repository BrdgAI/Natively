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

test('main doc composer repairs a truncated clarify line and appends only the truly new lines', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const initialSnapshot = ledger.getSnapshot();

  const clarificationItems = [
    {
      id: 'max-input-size',
      text: 'What is the maximum input size we should optimize for?',
      why: 'Input scale changes the target complexity.',
      status: 'pending' as const,
      answer: '',
      revision: initialSnapshot.inputRevision,
      replacementReason: '',
    },
  ];

  const firstPayload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Let me restate the problem first: Two Sum.',
      'What exactly should be returned: indices or values?',
      'What is the maximum input size we should',
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
    clarificationItems,
    savedContexts: initialSnapshot.phaseDocuments.p2_clarify.savedContexts,
  });

  ledger.applyGeneratedPayload(firstPayload, firstDocument, clarificationItems);
  const secondSnapshot = ledger.getSnapshot();

  const secondPayload: InterviewOverlayPayload = {
    ...firstPayload,
    generatedAt: Date.now() + 1,
    mainLines: [
      'Let me restate the problem first: Two Sum.',
      'What exactly should be returned: indices or values?',
      'What is the maximum input size we should optimize for?',
      'Write in notes: return indices, not values.',
    ],
  };

  const repairedDocument = composer.compose(secondSnapshot, secondPayload, {
    clarificationItems,
    savedContexts: secondSnapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  const repairedLines = repairedDocument.mainFeed
    .filter((entry) => entry.type === 'line')
    .map((entry) => entry.text);

  assert.deepEqual(repairedLines, [
    'Let me restate the problem first: Two Sum.',
    'What exactly should be returned: indices or values?',
    'What is the maximum input size we should optimize for?',
    'Write in notes: return indices, not values.',
  ]);
  assert.equal(
    repairedLines.includes('What is the maximum input size we should'),
    false
  );
  assert.equal(repairedDocument.status.status, 'updated');
});

test('main doc composer treats clarify doc-comment lines as note entries', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  const snapshot = ledger.getSnapshot();

  const payload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Input: array of integers and a target value.',
      'Values: duplicates are allowed and negatives are possible.',
      'Return: indices of one valid pair.',
    ],
    pinnedFacts: ['Return indices of one valid pair.'],
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

  assert.deepEqual(feedLines.map((entry) => entry.state), ['note', 'note', 'note']);
});
