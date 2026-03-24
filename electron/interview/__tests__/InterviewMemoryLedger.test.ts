import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewOverlayPayload } from '../types';

test('manual override clear does not create a fresh input revision', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });

  const initialRevision = ledger.getSnapshot().inputRevision;
  ledger.setManualOverridePhase('p4_code');
  const overridden = ledger.getSnapshot();

  assert.ok(overridden.inputRevision > initialRevision);

  const beforeClearRevision = overridden.inputRevision;
  ledger.clearManualOverridePhase();
  const cleared = ledger.getSnapshot();

  assert.equal(cleared.manualOverridePhase, null);
  assert.equal(cleared.inputRevision, beforeClearRevision);
});

test('control strip visibility can be toggled from the ledger', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });

  ledger.showControlStrip('SYNC again to cycle phase.', 1500);
  const visible = ledger.getSnapshot();
  assert.ok(visible.controlStripVisibleUntil);
  assert.equal(visible.controlStripHint, 'SYNC again to cycle phase.');

  ledger.hideControlStrip();
  const hidden = ledger.getSnapshot();
  assert.equal(hidden.controlStripVisibleUntil, null);
  assert.equal(hidden.controlStripHint, null);
});

test('pause and resume preserve interview state during an active meeting', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['n can be large'], ['nums = [2,7,11,15], target = 9']);
  ledger.setMainScrollOffset(320);
  const payload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    speakNow: ['I want to confirm whether duplicate values are allowed.'],
    speakIfAsked: ['If needed, I can also walk through the hash-map tradeoff.'],
    writeNow: ['List constraints before coding.'],
    thoughtNotes: ['Stay concise before the interviewer gives the green light.'],
    quickQuestions: ['Can I assume exactly one valid pair exists?'],
    pinnedFacts: ['Need indices, not values.'],
    changes: [],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: ledger.getSnapshot().inputRevision,
  };
  const phaseDocument = composer.compose(ledger.getSnapshot(), payload);
  ledger.applyGeneratedPayload(payload, phaseDocument);

  ledger.pauseInterviewMode();
  const paused = ledger.getSnapshot();
  assert.equal(ledger.hasPausedInterviewSession(), true);
  assert.equal(ledger.hasRetainedInterviewSession(), true);
  assert.equal(paused.active, false);
  assert.equal(paused.sessionType, 'general');
  assert.equal(paused.problemStatement, 'Two Sum');
  assert.equal(paused.mainScrollOffset, 320);
  assert.deepEqual(paused.latestPayload?.speakNow, ['I want to confirm whether duplicate values are allowed.']);

  ledger.resumeInterviewMode();
  const resumed = ledger.getSnapshot();
  assert.equal(ledger.hasPausedInterviewSession(), false);
  assert.equal(resumed.active, true);
  assert.equal(resumed.sessionType, 'interview');
  assert.equal(resumed.problemStatement, 'Two Sum');
  assert.equal(resumed.mainScrollOffset, 320);
  assert.deepEqual(resumed.latestPayload?.speakNow, ['I want to confirm whether duplicate values are allowed.']);
});

test('diff payloads keep the full code snapshot available for the primary code panel', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();
  ledger.startSession('interview', { codingLanguage: 'python' });

  ledger.applyScreenAnalysis({
    screenshotPath: '/tmp/interview-code.png',
    capturedAt: Date.now(),
    currentCode: 'def two_sum(nums, target):\n    return []',
    likelyMistakes: [],
  });

  const snapshot = ledger.getSnapshot();
  const payload: InterviewOverlayPayload = {
    phase: 'p6_follow_up',
    phaseConfidence: 0.95,
    manualOverrideActive: false,
    speakNow: ['I can make that change in the return path.'],
    speakIfAsked: [],
    writeNow: [],
    thoughtNotes: [],
    quickQuestions: [],
    pinnedFacts: ['Only the return logic changes'],
    changes: [],
    codePanel: {
      language: 'python',
      mode: 'diff',
      content: ' def two_sum(nums, target):\n-    return []\n+    return None',
      narration: [],
      suspectedMistakes: ['Change the return contract only'],
    },
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: 0,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
  };

  const phaseDocument = composer.compose(snapshot, payload);
  ledger.applyGeneratedPayload(payload, phaseDocument);

  const after = ledger.getSnapshot();
  assert.equal(after.currentCode?.content, 'def two_sum(nums, target):\n    return []');
  assert.equal(after.phaseDocuments.p6_follow_up.codePanel?.mode, 'diff');
  assert.equal(after.phaseDocuments.p6_follow_up.codePanel?.content, ' def two_sum(nums, target):\n-    return []\n+    return None');
});
