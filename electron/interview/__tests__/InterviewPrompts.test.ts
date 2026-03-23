import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhasePrompt } from '../InterviewPrompts';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewOverlayPayload } from '../types';

test('clarify phase prompt includes the full ordered Phase 2 categories and required section ids', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);

  const prompt = buildPhasePrompt('p2_clarify', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
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
  assert.ok(prompt.includes('`restate`'));
  assert.ok(prompt.includes('`question-queue`'));
  assert.ok(prompt.includes('`write-spec`'));
  assert.ok(prompt.includes('`example-starter`'));
});

test('approach prompt receives confirmed clarify handoff context', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);

  const clarifyPayload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    speakNow: ['Let me restate the problem first.'],
    speakIfAsked: [],
    writeNow: [
      '# Problem: Two Sum',
      '# Output: return indices, not values',
    ],
    thoughtNotes: [],
    quickQuestions: ['Should I assume the input is unsorted?'],
    pinnedFacts: ['Return indices, not values'],
    changes: [],
    mainSections: [
      {
        id: 'restate',
        title: 'Restate First',
        lines: ['Let me restate the problem first.'],
        tone: 'primary',
      },
      {
        id: 'write-spec',
        title: 'Write This In The Doc',
        lines: ['# Output: return indices, not values'],
        tone: 'secondary',
      },
    ],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: ledger.getSnapshot().inputRevision,
  };

  const phaseDocument = composer.compose(ledger.getSnapshot(), clarifyPayload);
  ledger.applyGeneratedPayload(clarifyPayload, phaseDocument, undefined, {
    summaryLines: ['Let me restate the problem first.'],
    confirmedSpecLines: ['# Output: return indices, not values'],
    openQuestions: ['Should I assume the input is unsorted?'],
    updatedAt: clarifyPayload.generatedAt,
  });

  const prompt = buildPhasePrompt('p3_approach', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    previousPayload: clarifyPayload,
  });

  assert.ok(prompt.includes('Clarify handoff'));
  assert.ok(prompt.includes('# Output: return indices, not values'));
  assert.ok(prompt.includes('Should I assume the input is unsorted?'));
});
