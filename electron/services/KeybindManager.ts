import { app, globalShortcut, Menu, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

export interface KeybindConfig {
    id: string;
    label: string;
    accelerator: string; // Electron Accelerator string
    isGlobal: boolean;   // Registered with globalShortcut
    defaultAccelerator: string;
    enabled: boolean;
    defaultEnabled: boolean;
}

export interface KeybindMutationResult {
    success: boolean;
    error?: string;
    conflictWithId?: string;
    conflictWithLabel?: string;
}

type PersistedKeybindOverride = {
    id: string;
    accelerator?: string;
    enabled?: boolean;
};

const GENERAL_PROCESS_ACCELERATOR = 'CommandOrControl+Alt+Enter';
const GENERAL_CAPTURE_ACCELERATOR = 'CommandOrControl+Alt+Shift+Enter';
const INTERVIEW_NEXT_ACCELERATOR = 'CommandOrControl+Enter';
const INTERVIEW_SYNC_ACCELERATOR = 'CommandOrControl+Shift+Enter';
const INTERVIEW_PHASE_PREV_ACCELERATOR = 'CommandOrControl+Shift+Left';
const INTERVIEW_PHASE_NEXT_ACCELERATOR = 'CommandOrControl+Shift+Right';
const INTERVIEW_SCROLL_UP_ACCELERATOR = 'CommandOrControl+Shift+Up';
const INTERVIEW_SCROLL_DOWN_ACCELERATOR = 'CommandOrControl+Shift+Down';
const INTERVIEW_TOGGLE_ACCELERATOR = 'CommandOrControl+Shift+I';

const LEGACY_GENERAL_PROCESS_ACCELERATOR = 'CommandOrControl+Enter';
const LEGACY_GENERAL_CAPTURE_ACCELERATOR = 'CommandOrControl+Shift+Enter';
const LEGACY_INTERVIEW_TOGGLE_ACCELERATOR = '';

const ALLOWED_DUPLICATE_KEYBIND_SETS = new Set([
    buildDuplicateKey('chat:scrollUp', 'window:move-up'),
    buildDuplicateKey('chat:scrollDown', 'window:move-down'),
]);

export const DEFAULT_KEYBINDS: KeybindConfig[] = [
    // General
    { id: 'general:toggle-visibility', label: 'Toggle Visibility', accelerator: 'CommandOrControl+B', isGlobal: true, defaultAccelerator: 'CommandOrControl+B', enabled: true, defaultEnabled: true },
    { id: 'general:toggle-mouse-passthrough', label: 'Toggle Mouse Passthrough', accelerator: 'CommandOrControl+Shift+B', isGlobal: true, defaultAccelerator: 'CommandOrControl+Shift+B', enabled: true, defaultEnabled: true },
    { id: 'general:process-screenshots', label: 'Process Screenshots', accelerator: GENERAL_PROCESS_ACCELERATOR, isGlobal: true, defaultAccelerator: GENERAL_PROCESS_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'general:capture-and-process', label: 'Capture Screen & Ask AI (Global)', accelerator: GENERAL_CAPTURE_ACCELERATOR, isGlobal: true, defaultAccelerator: GENERAL_CAPTURE_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'general:reset-cancel', label: 'Reset / Cancel', accelerator: 'CommandOrControl+R', isGlobal: true, defaultAccelerator: 'CommandOrControl+R', enabled: true, defaultEnabled: true },
    { id: 'general:take-screenshot', label: 'Take Screenshot', accelerator: 'CommandOrControl+H', isGlobal: true, defaultAccelerator: 'CommandOrControl+H', enabled: true, defaultEnabled: true },
    { id: 'general:selective-screenshot', label: 'Selective Screenshot', accelerator: 'CommandOrControl+Shift+H', isGlobal: true, defaultAccelerator: 'CommandOrControl+Shift+H', enabled: true, defaultEnabled: true },

    // Interview
    { id: 'interview:next', label: 'Interview Next', accelerator: INTERVIEW_NEXT_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_NEXT_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'interview:sync', label: 'Interview Sync', accelerator: INTERVIEW_SYNC_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_SYNC_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'interview:phase-prev', label: 'Interview Phase Previous', accelerator: INTERVIEW_PHASE_PREV_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_PHASE_PREV_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'interview:phase-next', label: 'Interview Phase Next', accelerator: INTERVIEW_PHASE_NEXT_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_PHASE_NEXT_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'interview:scroll-up', label: 'Interview Scroll Up', accelerator: INTERVIEW_SCROLL_UP_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_SCROLL_UP_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'interview:scroll-down', label: 'Interview Scroll Down', accelerator: INTERVIEW_SCROLL_DOWN_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_SCROLL_DOWN_ACCELERATOR, enabled: true, defaultEnabled: true },
    { id: 'interview:exit-mode', label: 'Leave / Resume Interview', accelerator: INTERVIEW_TOGGLE_ACCELERATOR, isGlobal: true, defaultAccelerator: INTERVIEW_TOGGLE_ACCELERATOR, enabled: true, defaultEnabled: true },

    // Chat - Global shortcuts (work even when app is not focused - stealth mode)
    { id: 'chat:whatToAnswer', label: 'What to Answer', accelerator: 'CommandOrControl+1', isGlobal: true, defaultAccelerator: 'CommandOrControl+1', enabled: true, defaultEnabled: true },
    { id: 'chat:shorten', label: 'Shorten', accelerator: 'CommandOrControl+2', isGlobal: true, defaultAccelerator: 'CommandOrControl+2', enabled: true, defaultEnabled: true },
    { id: 'chat:followUp', label: 'Follow Up', accelerator: 'CommandOrControl+3', isGlobal: true, defaultAccelerator: 'CommandOrControl+3', enabled: true, defaultEnabled: true },
    { id: 'chat:recap', label: 'Recap', accelerator: 'CommandOrControl+4', isGlobal: true, defaultAccelerator: 'CommandOrControl+4', enabled: true, defaultEnabled: true },
    { id: 'chat:answer', label: 'Answer / Record', accelerator: 'CommandOrControl+5', isGlobal: true, defaultAccelerator: 'CommandOrControl+5', enabled: true, defaultEnabled: true },
    { id: 'chat:scrollUp', label: 'Scroll Up', accelerator: 'CommandOrControl+Up', isGlobal: true, defaultAccelerator: 'CommandOrControl+Up', enabled: true, defaultEnabled: true },
    { id: 'chat:scrollDown', label: 'Scroll Down', accelerator: 'CommandOrControl+Down', isGlobal: true, defaultAccelerator: 'CommandOrControl+Down', enabled: true, defaultEnabled: true },

    // Window Movement - Global shortcuts (stealth window positioning)
    { id: 'window:move-up', label: 'Move Window Up', accelerator: 'CommandOrControl+Up', isGlobal: true, defaultAccelerator: 'CommandOrControl+Up', enabled: true, defaultEnabled: true },
    { id: 'window:move-down', label: 'Move Window Down', accelerator: 'CommandOrControl+Down', isGlobal: true, defaultAccelerator: 'CommandOrControl+Down', enabled: true, defaultEnabled: true },
    { id: 'window:move-left', label: 'Move Window Left', accelerator: 'CommandOrControl+Left', isGlobal: true, defaultAccelerator: 'CommandOrControl+Left', enabled: true, defaultEnabled: true },
    { id: 'window:move-right', label: 'Move Window Right', accelerator: 'CommandOrControl+Right', isGlobal: true, defaultAccelerator: 'CommandOrControl+Right', enabled: true, defaultEnabled: true },
];

export class KeybindManager {
    private static instance: KeybindManager;
    private keybinds: Map<string, KeybindConfig> = new Map();
    private filePath: string;
    private windowHelper: any; // Type avoided for circular dep, passed in init
    private onUpdateCallbacks: (() => void)[] = [];
    private onShortcutTriggeredCallbacks: ((actionId: string) => void)[] = [];

    private constructor() {
        this.filePath = path.join(app.getPath('userData'), 'keybinds.json');
        this.load();
    }

    public onUpdate(callback: () => void) {
        this.onUpdateCallbacks.push(callback);
    }

    public onShortcutTriggered(callback: (actionId: string) => void) {
        this.onShortcutTriggeredCallbacks.push(callback);
    }

    public static getInstance(): KeybindManager {
        if (!KeybindManager.instance) {
            KeybindManager.instance = new KeybindManager();
        }
        return KeybindManager.instance;
    }

    public setWindowHelper(windowHelper: any) {
        this.windowHelper = windowHelper;
        // Re-register globals now that we have the helper
        this.registerGlobalShortcuts();
    }

    private load() {
        let overrides: PersistedKeybindOverride[] = [];
        let didMigrate = false;

        try {
            if (fs.existsSync(this.filePath)) {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
                if (Array.isArray(data)) {
                    overrides = data;
                }
            }
        } catch (error) {
            console.error('[KeybindManager] Failed to load keybinds:', error);
        }

        const merged = mergeAndMigrateKeybinds(overrides);
        didMigrate = merged.didMigrate;
        this.keybinds.clear();
        merged.keybinds.forEach((kb) => this.keybinds.set(kb.id, kb));

        if (didMigrate) {
            this.save();
        }
    }

    private save() {
        try {
            const data = Array.from(this.keybinds.values()).map(kb => ({
                id: kb.id,
                accelerator: kb.accelerator,
                enabled: kb.enabled
            }));
            const tmpPath = this.filePath + '.tmp';
            fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
            fs.renameSync(tmpPath, this.filePath);
        } catch (error) {
            console.error('[KeybindManager] Failed to save keybinds:', error);
        }
    }

    public getKeybind(id: string): string | undefined {
        return this.keybinds.get(id)?.accelerator;
    }

    public getKeybindConfig(id: string): KeybindConfig | undefined {
        return this.keybinds.get(id);
    }

    public isKeybindEnabled(id: string): boolean {
        return this.keybinds.get(id)?.enabled ?? false;
    }

    public getAllKeybinds(): KeybindConfig[] {
        return Array.from(this.keybinds.values());
    }

    public setKeybind(id: string, accelerator: string): KeybindMutationResult {
        if (!this.keybinds.has(id)) {
            return { success: false, error: 'Shortcut not found.' };
        }

        const validation = validateKeybindMutation(this.getAllKeybinds(), id, { accelerator });
        if (!validation.success) {
            return validation;
        }

        const kb = this.keybinds.get(id)!;
        kb.accelerator = accelerator;
        this.keybinds.set(id, kb);

        this.save();
        this.registerGlobalShortcuts(); // Re-register if it was a global one
        this.broadcastUpdate();
        return { success: true };
    }

    public setKeybindEnabled(id: string, enabled: boolean): KeybindMutationResult {
        if (!this.keybinds.has(id)) {
            return { success: false, error: 'Shortcut not found.' };
        }

        const validation = validateKeybindMutation(this.getAllKeybinds(), id, { enabled });
        if (!validation.success) {
            return validation;
        }

        const kb = this.keybinds.get(id)!;
        kb.enabled = enabled;
        this.keybinds.set(id, kb);

        this.save();
        this.registerGlobalShortcuts();
        this.broadcastUpdate();
        return { success: true };
    }

    public resetKeybinds() {
        this.keybinds.clear();
        DEFAULT_KEYBINDS.forEach(kb => this.keybinds.set(kb.id, { ...kb }));
        this.save();
        this.registerGlobalShortcuts();
        this.broadcastUpdate();
    }

    public registerGlobalShortcuts() {
        globalShortcut.unregisterAll();

        // Group global keybinds by accelerator so that multiple actions sharing
        // the same key combo (e.g. chat:scrollUp and window:move-up both use
        // CommandOrControl+Up) are fired from a single OS-level registration.
        const acceleratorMap = new Map<string, string[]>(); // accelerator -> [actionId]
        this.keybinds.forEach(kb => {
            if (kb.enabled && kb.isGlobal && kb.accelerator && kb.accelerator.trim() !== '') {
                const acc = kb.accelerator.trim();
                if (!acceleratorMap.has(acc)) {
                    acceleratorMap.set(acc, []);
                }
                acceleratorMap.get(acc)!.push(kb.id);
            }
        });

        // Register one OS handler per unique accelerator
        acceleratorMap.forEach((actionIds, accelerator) => {
            try {
                globalShortcut.register(accelerator, () => {
                    actionIds.forEach(actionId => {
                        this.onShortcutTriggeredCallbacks.forEach(cb => cb(actionId));
                    });
                });
                console.log(`[KeybindManager] Registered global shortcut: ${accelerator} -> [${actionIds.join(', ')}]`);
            } catch (e) {
                console.error(`[KeybindManager] Failed to register global shortcut ${accelerator}:`, e);
            }
        });

        this.updateMenu();
    }

    public updateMenu() {
        const getMenuAccelerator = (id: string, fallback: string): string | undefined => {
            const keybind = this.keybinds.get(id);
            if (!keybind?.enabled) return undefined;
            return keybind.accelerator || fallback;
        };

        const toggleAccelerator = getMenuAccelerator('general:toggle-visibility', 'CommandOrControl+B');

        const template: any[] = [
            {
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide', accelerator: 'CommandOrControl+Option+H' },
                    { role: 'hideOthers', accelerator: 'CommandOrControl+Option+Shift+H' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                role: 'editMenu'
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Toggle Visibility',
                        accelerator: toggleAccelerator,
                        click: () => {
                            // Require AppState dynamically to avoid circular dependencies
                            const { AppState } = require('../main');
                            AppState.getInstance().toggleMainWindow();
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Move Window Up',
                        accelerator: getMenuAccelerator('window:move-up', 'CommandOrControl+Up'),
                        click: () => this.windowHelper?.moveWindowUp()
                    },
                    {
                        label: 'Move Window Down',
                        accelerator: getMenuAccelerator('window:move-down', 'CommandOrControl+Down'),
                        click: () => this.windowHelper?.moveWindowDown()
                    },
                    {
                        label: 'Move Window Left',
                        accelerator: getMenuAccelerator('window:move-left', 'CommandOrControl+Left'),
                        click: () => this.windowHelper?.moveWindowLeft()
                    },
                    {
                        label: 'Move Window Right',
                        accelerator: getMenuAccelerator('window:move-right', 'CommandOrControl+Right'),
                        click: () => this.windowHelper?.moveWindowRight()
                    },
                    { type: 'separator' },
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                role: 'windowMenu'
            },
            {
                role: 'help',
                submenu: [
                    {
                        label: 'Learn More',
                        click: async () => {
                            const { shell } = require('electron');
                            await shell.openExternal('https://electronjs.org');
                        }
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
        console.log('[KeybindManager] Application menu updated');
    }

    private broadcastUpdate() {
        // Notify main process listeners
        this.onUpdateCallbacks.forEach(cb => cb());

        const windows = BrowserWindow.getAllWindows();
        const allKeybinds = this.getAllKeybinds();
        windows.forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('keybinds:update', allKeybinds);
            }
        });
    }

    public setupIpcHandlers() {
        ipcMain.handle('keybinds:get-all', () => {
            return this.getAllKeybinds();
        });

        ipcMain.handle('keybinds:set', (_, id: string, accelerator: string) => {
            console.log(`[KeybindManager] Set ${id} -> ${accelerator}`);
            return this.setKeybind(id, accelerator);
        });

        ipcMain.handle('keybinds:set-enabled', (_, id: string, enabled: boolean) => {
            console.log(`[KeybindManager] Set enabled ${id} -> ${enabled}`);
            return this.setKeybindEnabled(id, enabled);
        });

        ipcMain.handle('keybinds:reset', () => {
            console.log('[KeybindManager] Reset defaults');
            this.resetKeybinds();
            return this.getAllKeybinds();
        });
    }
}

export function mergeAndMigrateKeybinds(overrides: PersistedKeybindOverride[]): { keybinds: KeybindConfig[]; didMigrate: boolean } {
    const keybinds = DEFAULT_KEYBINDS.map((kb) => ({ ...kb }));
    const byId = new Map(keybinds.map((kb) => [kb.id, kb]));
    let didMigrate = false;

    for (const override of overrides) {
        const current = byId.get(override.id);
        if (!current) {
            continue;
        }

        if (typeof override.accelerator === 'string') {
            current.accelerator = override.accelerator;
        }
        if (typeof override.enabled === 'boolean') {
            current.enabled = override.enabled;
        }
    }

    didMigrate = migrateGeneralReservedPairs(byId) || didMigrate;
    didMigrate = migrateInterviewDefaults(byId) || didMigrate;

    return {
        keybinds: keybinds.map((kb) => ({ ...kb })),
        didMigrate,
    };
}

export function validateKeybindMutation(
    keybinds: KeybindConfig[],
    id: string,
    nextValues: Partial<Pick<KeybindConfig, 'accelerator' | 'enabled'>>
): KeybindMutationResult {
    const nextKeybinds = keybinds.map((kb) => ({ ...kb }));
    const target = nextKeybinds.find((kb) => kb.id === id);

    if (!target) {
        return { success: false, error: 'Shortcut not found.' };
    }

    if (nextValues.accelerator !== undefined) {
        target.accelerator = nextValues.accelerator;
    }
    if (nextValues.enabled !== undefined) {
        target.enabled = nextValues.enabled;
    }

    const targetAccelerator = normalizeAccelerator(target.accelerator);
    if (!target.enabled || !targetAccelerator) {
        return { success: true };
    }

    const conflict = nextKeybinds.find((candidate) => {
        if (candidate.id === id || !candidate.enabled) {
            return false;
        }

        if (normalizeAccelerator(candidate.accelerator) !== targetAccelerator) {
            return false;
        }

        return !ALLOWED_DUPLICATE_KEYBIND_SETS.has(buildDuplicateKey(id, candidate.id));
    });

    if (!conflict) {
        return { success: true };
    }

    return {
        success: false,
        error: `${target.label} conflicts with ${conflict.label}. Choose a different shortcut or disable one of them.`,
        conflictWithId: conflict.id,
        conflictWithLabel: conflict.label,
    };
}

function migrateGeneralReservedPairs(byId: Map<string, KeybindConfig>): boolean {
    let didMigrate = false;

    const processKeybind = byId.get('general:process-screenshots');
    if (processKeybind && normalizeAccelerator(processKeybind.accelerator) === normalizeAccelerator(LEGACY_GENERAL_PROCESS_ACCELERATOR)) {
        processKeybind.accelerator = GENERAL_PROCESS_ACCELERATOR;
        didMigrate = true;
    }

    const captureKeybind = byId.get('general:capture-and-process');
    if (captureKeybind && normalizeAccelerator(captureKeybind.accelerator) === normalizeAccelerator(LEGACY_GENERAL_CAPTURE_ACCELERATOR)) {
        captureKeybind.accelerator = GENERAL_CAPTURE_ACCELERATOR;
        didMigrate = true;
    }

    return didMigrate;
}

function migrateInterviewDefaults(byId: Map<string, KeybindConfig>): boolean {
    let didMigrate = false;

    const phasePrev = byId.get('interview:phase-prev');
    if (phasePrev && normalizeAccelerator(phasePrev.accelerator) === normalizeAccelerator(INTERVIEW_PHASE_PREV_ACCELERATOR) && phasePrev.enabled === false) {
        phasePrev.enabled = true;
        didMigrate = true;
    }

    const phaseNext = byId.get('interview:phase-next');
    if (phaseNext && normalizeAccelerator(phaseNext.accelerator) === normalizeAccelerator(INTERVIEW_PHASE_NEXT_ACCELERATOR) && phaseNext.enabled === false) {
        phaseNext.enabled = true;
        didMigrate = true;
    }

    const toggle = byId.get('interview:exit-mode');
    if (toggle && normalizeAccelerator(toggle.accelerator) === normalizeAccelerator(LEGACY_INTERVIEW_TOGGLE_ACCELERATOR) && toggle.enabled === false) {
        toggle.accelerator = INTERVIEW_TOGGLE_ACCELERATOR;
        toggle.enabled = true;
        didMigrate = true;
    }

    return didMigrate;
}

function normalizeAccelerator(accelerator: string): string {
    return accelerator.trim().toLowerCase();
}

function buildDuplicateKey(a: string, b: string): string {
    return [a, b].sort().join('::');
}
