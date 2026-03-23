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
