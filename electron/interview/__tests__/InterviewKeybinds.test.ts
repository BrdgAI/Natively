import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KEYBINDS } from '../../services/KeybindManager';

test('interview defaults include phase, scroll, and kill switch actions', () => {
  const ids = new Map(DEFAULT_KEYBINDS.map((item) => [item.id, item]));

  assert.equal(ids.get('interview:phase-prev')?.enabled, false);
  assert.equal(ids.get('interview:phase-next')?.enabled, false);
  assert.equal(ids.get('interview:scroll-up')?.accelerator, 'CommandOrControl+Shift+Up');
  assert.equal(ids.get('interview:scroll-down')?.accelerator, 'CommandOrControl+Shift+Down');
  assert.equal(ids.get('interview:exit-mode')?.accelerator, '');
});
