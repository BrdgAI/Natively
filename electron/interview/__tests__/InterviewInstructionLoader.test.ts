import test from 'node:test';
import assert from 'node:assert/strict';
import { getInterviewInstructionFiles, loadGeneratorInstructions, loadVisionInstructions } from '../InterviewInstructionLoader';

test('instruction loader exposes the editable interview instruction files', () => {
  const files = getInterviewInstructionFiles();

  assert.ok(files.includes('index-interview.md'));
  assert.ok(files.includes('global-output-rules.md'));
  assert.ok(files.includes('phase-6-follow-up.md'));
  assert.ok(files.includes('vision-code.md'));
});

test('instruction loader reads generator and vision packs from markdown files', () => {
  const generatorPack = loadGeneratorInstructions('p2_clarify');
  const visionPack = loadVisionInstructions('p4_code');

  assert.ok(generatorPack.index.length > 0);
  assert.ok(generatorPack.global.length > 0);
  assert.ok(generatorPack.phase.includes('Goal:'));
  assert.ok(visionPack.global.length > 0);
  assert.ok(visionPack.phase.includes('prioritize'));
});
