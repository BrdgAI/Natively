import test from 'node:test';
import assert from 'node:assert/strict';
import { InterviewDiffEngine } from '../InterviewDiffEngine';

test('diff engine highlights added and removed code regions', () => {
  const engine = new InterviewDiffEngine();
  const before = [
    'def two_sum(nums, target):',
    '    seen = {}',
    '    return []',
  ].join('\n');
  const after = [
    'def two_sum(nums, target):',
    '    seen = {}',
    '    for index, value in enumerate(nums):',
    '        complement = target - value',
    '        if complement in seen:',
    '            return [seen[complement], index]',
    '        seen[value] = index',
    '    return []',
  ].join('\n');

  const result = engine.diffText(before, after);

  assert.match(result.diffText, /^\s*def two_sum/m);
  assert.match(result.diffText, /^\+    for index, value in enumerate\(nums\):/m);
  assert.ok(result.summary.some((item) => item.includes('Added logic around')));
});
