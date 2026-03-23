import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_KEYBINDS,
  mergeAndMigrateKeybinds,
  validateKeybindMutation,
} from '../../services/KeybindManager';

test('interview defaults include dedicated next, sync, phase, scroll, and leave/resume actions', () => {
  const ids = new Map(DEFAULT_KEYBINDS.map((item) => [item.id, item]));

  assert.equal(ids.get('general:process-screenshots')?.accelerator, 'CommandOrControl+Alt+Enter');
  assert.equal(ids.get('general:capture-and-process')?.accelerator, 'CommandOrControl+Alt+Shift+Enter');
  assert.equal(ids.get('reserved:shortcut-1')?.isGlobal, true);
  assert.equal(ids.get('reserved:shortcut-1')?.accelerator, '');
  assert.equal(ids.get('reserved:shortcut-1')?.enabled, true);
  assert.equal(ids.get('reserved:shortcut-2')?.accelerator, '');
  assert.equal(ids.get('reserved:shortcut-3')?.accelerator, '');
  assert.equal(ids.get('reserved:shortcut-4')?.accelerator, '');
  assert.equal(ids.get('interview:next')?.accelerator, 'CommandOrControl+Enter');
  assert.equal(ids.get('interview:sync')?.accelerator, 'CommandOrControl+Shift+Enter');
  assert.equal(ids.get('interview:phase-prev')?.enabled, false);
  assert.equal(ids.get('interview:phase-next')?.enabled, false);
  assert.equal(ids.get('interview:scroll-up')?.accelerator, 'CommandOrControl+Shift+Up');
  assert.equal(ids.get('interview:scroll-down')?.accelerator, 'CommandOrControl+Shift+Down');
  assert.equal(ids.get('interview:exit-mode')?.accelerator, '');
  assert.equal(ids.get('interview:exit-mode')?.enabled, false);
});

test('legacy shortcut overrides migrate to the new interview and general defaults', () => {
  const { keybinds, didMigrate } = mergeAndMigrateKeybinds([
    { id: 'general:process-screenshots', accelerator: 'CommandOrControl+Enter', enabled: true },
    { id: 'general:capture-and-process', accelerator: 'CommandOrControl+Shift+Enter', enabled: true },
    { id: 'interview:phase-prev', accelerator: 'CommandOrControl+Shift+Left', enabled: false },
    { id: 'interview:phase-next', accelerator: 'CommandOrControl+Shift+Right', enabled: false },
    { id: 'interview:exit-mode', accelerator: '', enabled: false },
  ]);
  const ids = new Map(keybinds.map((item) => [item.id, item]));

  assert.equal(didMigrate, true);
  assert.equal(ids.get('general:process-screenshots')?.accelerator, 'CommandOrControl+Alt+Enter');
  assert.equal(ids.get('general:capture-and-process')?.accelerator, 'CommandOrControl+Alt+Shift+Enter');
  assert.equal(ids.get('interview:next')?.accelerator, 'CommandOrControl+Enter');
  assert.equal(ids.get('interview:sync')?.accelerator, 'CommandOrControl+Shift+Enter');
  assert.equal(ids.get('interview:phase-prev')?.enabled, false);
  assert.equal(ids.get('interview:phase-next')?.enabled, false);
  assert.equal(ids.get('interview:exit-mode')?.accelerator, '');
  assert.equal(ids.get('interview:exit-mode')?.enabled, false);
});

test('duplicate validation blocks conflicting shortcuts and preserves allowed shared pairs', () => {
  const conflicting = validateKeybindMutation(
    DEFAULT_KEYBINDS.map((item) => ({ ...item })),
    'interview:next',
    { accelerator: 'CommandOrControl+B' }
  );

  assert.equal(conflicting.success, false);
  assert.equal(conflicting.conflictWithId, 'general:toggle-visibility');

  const allowed = validateKeybindMutation(
    DEFAULT_KEYBINDS.map((item) => ({ ...item })),
    'chat:scrollUp',
    { accelerator: 'CommandOrControl+Up' }
  );

  assert.equal(allowed.success, true);

  const reservedAllowed = validateKeybindMutation(
    DEFAULT_KEYBINDS.map((item) => ({ ...item })),
    'reserved:shortcut-1',
    { accelerator: 'CommandOrControl+9' }
  );

  assert.equal(reservedAllowed.success, true);

  const reservedConflict = validateKeybindMutation(
    DEFAULT_KEYBINDS.map((item) => ({ ...item })),
    'reserved:shortcut-1',
    { accelerator: 'CommandOrControl+B' }
  );

  assert.equal(reservedConflict.success, false);
  assert.equal(reservedConflict.conflictWithId, 'general:toggle-visibility');
});
