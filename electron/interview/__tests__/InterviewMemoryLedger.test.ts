import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';

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
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['n can be large'], ['nums = [2,7,11,15], target = 9']);
  ledger.setMainScrollOffset(320);
  ledger.applyGeneratedPayload({
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
  });

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
