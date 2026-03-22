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

export const DEFAULT_KEYBINDS: KeybindConfig[] = [
    // General
    { id: 'general:toggle-visibility', label: 'Toggle Visibility', accelerator: 'CommandOrControl+B', isGlobal: true, defaultAccelerator: 'CommandOrControl+B', enabled: true, defaultEnabled: true },
    { id: 'general:toggle-mouse-passthrough', label: 'Toggle Mouse Passthrough', accelerator: 'CommandOrControl+Shift+B', isGlobal: true, defaultAccelerator: 'CommandOrControl+Shift+B', enabled: true, defaultEnabled: true },
    { id: 'general:process-screenshots', label: 'Process Screenshots', accelerator: 'CommandOrControl+Enter', isGlobal: true, defaultAccelerator: 'CommandOrControl+Enter', enabled: true, defaultEnabled: true },
    { id: 'general:capture-and-process', label: 'Capture Screen & Ask AI (Global)', accelerator: 'CommandOrControl+Shift+Enter', isGlobal: true, defaultAccelerator: 'CommandOrControl+Shift+Enter', enabled: true, defaultEnabled: true },
    { id: 'general:reset-cancel', label: 'Reset / Cancel', accelerator: 'CommandOrControl+R', isGlobal: true, defaultAccelerator: 'CommandOrControl+R', enabled: true, defaultEnabled: true },
    { id: 'general:take-screenshot', label: 'Take Screenshot', accelerator: 'CommandOrControl+H', isGlobal: true, defaultAccelerator: 'CommandOrControl+H', enabled: true, defaultEnabled: true },
    { id: 'general:selective-screenshot', label: 'Selective Screenshot', accelerator: 'CommandOrControl+Shift+H', isGlobal: true, defaultAccelerator: 'CommandOrControl+Shift+H', enabled: true, defaultEnabled: true },

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
        // 1. Load Defaults
        DEFAULT_KEYBINDS.forEach(kb => this.keybinds.set(kb.id, { ...kb }));

        // 2. Load Overrides
        try {
            if (fs.existsSync(this.filePath)) {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
                // Validate and merge
                for (const fileKb of data) {
                    if (this.keybinds.has(fileKb.id)) {
                        const current = this.keybinds.get(fileKb.id)!;
                        if (typeof fileKb.accelerator === 'string') {
                            current.accelerator = fileKb.accelerator;
                        }
                        if (typeof fileKb.enabled === 'boolean') {
                            current.enabled = fileKb.enabled;
                        }
                        this.keybinds.set(fileKb.id, current);
                    }
                }
            }
        } catch (error) {
            console.error('[KeybindManager] Failed to load keybinds:', error);
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

    public setKeybind(id: string, accelerator: string) {
        if (!this.keybinds.has(id)) return;

        const kb = this.keybinds.get(id)!;
        kb.accelerator = accelerator;
        this.keybinds.set(id, kb);

        this.save();
        this.registerGlobalShortcuts(); // Re-register if it was a global one
        this.broadcastUpdate();
    }

    public setKeybindEnabled(id: string, enabled: boolean) {
        if (!this.keybinds.has(id)) return;

        const kb = this.keybinds.get(id)!;
        kb.enabled = enabled;
        this.keybinds.set(id, kb);

        this.save();
        this.registerGlobalShortcuts();
        this.broadcastUpdate();
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
            this.setKeybind(id, accelerator);
            return true;
        });

        ipcMain.handle('keybinds:set-enabled', (_, id: string, enabled: boolean) => {
            console.log(`[KeybindManager] Set enabled ${id} -> ${enabled}`);
            this.setKeybindEnabled(id, enabled);
            return true;
        });

        ipcMain.handle('keybinds:reset', () => {
            console.log('[KeybindManager] Reset defaults');
            this.resetKeybinds();
            return this.getAllKeybinds();
        });
    }
}
