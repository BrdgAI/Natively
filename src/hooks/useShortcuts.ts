import { useState, useEffect, useCallback } from 'react';
import { acceleratorToKeys, keysToAccelerator } from '../utils/keyboardUtils';

export interface ShortcutConfig {
    whatToAnswer: string[];
    shorten: string[];
    followUp: string[];
    recap: string[];
    answer: string[];
    scrollUp: string[];
    scrollDown: string[];
    reservedShortcut1: string[];
    reservedShortcut2: string[];
    reservedShortcut3: string[];
    reservedShortcut4: string[];
    interviewNext: string[];
    interviewSync: string[];
    interviewPhasePrev: string[];
    interviewPhaseNext: string[];
    interviewScrollUp: string[];
    interviewScrollDown: string[];
    interviewExitMode: string[];
    moveWindowUp: string[];
    moveWindowDown: string[];
    moveWindowLeft: string[];
    moveWindowRight: string[];
    toggleVisibility: string[];
    toggleMousePassthrough: string[];
    processScreenshots: string[];
    captureAndProcess: string[];
    resetCancel: string[];
    takeScreenshot: string[];
    selectiveScreenshot: string[];
}

export type ShortcutActionId = keyof ShortcutConfig;
export type ShortcutEnabledConfig = Record<ShortcutActionId, boolean>;
export type ShortcutMutationResult = {
    success: boolean;
    error?: string;
    conflictWithId?: string;
    conflictWithLabel?: string;
};

type BackendKeybind = {
    id: string;
    label: string;
    accelerator: string;
    isGlobal: boolean;
    defaultAccelerator: string;
    enabled: boolean;
    defaultEnabled: boolean;
};

const BACKEND_ID_BY_ACTION: Record<ShortcutActionId, string> = {
    whatToAnswer: 'chat:whatToAnswer',
    shorten: 'chat:shorten',
    followUp: 'chat:followUp',
    recap: 'chat:recap',
    answer: 'chat:answer',
    scrollUp: 'chat:scrollUp',
    scrollDown: 'chat:scrollDown',
    reservedShortcut1: 'reserved:shortcut-1',
    reservedShortcut2: 'reserved:shortcut-2',
    reservedShortcut3: 'reserved:shortcut-3',
    reservedShortcut4: 'reserved:shortcut-4',
    interviewNext: 'interview:next',
    interviewSync: 'interview:sync',
    interviewPhasePrev: 'interview:phase-prev',
    interviewPhaseNext: 'interview:phase-next',
    interviewScrollUp: 'interview:scroll-up',
    interviewScrollDown: 'interview:scroll-down',
    interviewExitMode: 'interview:exit-mode',
    moveWindowUp: 'window:move-up',
    moveWindowDown: 'window:move-down',
    moveWindowLeft: 'window:move-left',
    moveWindowRight: 'window:move-right',
    toggleVisibility: 'general:toggle-visibility',
    toggleMousePassthrough: 'general:toggle-mouse-passthrough',
    processScreenshots: 'general:process-screenshots',
    captureAndProcess: 'general:capture-and-process',
    resetCancel: 'general:reset-cancel',
    takeScreenshot: 'general:take-screenshot',
    selectiveScreenshot: 'general:selective-screenshot'
};

const ACTION_BY_BACKEND_ID = Object.fromEntries(
    Object.entries(BACKEND_ID_BY_ACTION).map(([actionId, backendId]) => [backendId, actionId])
) as Record<string, ShortcutActionId>;

export const DEFAULT_SHORTCUTS: ShortcutConfig = {
    whatToAnswer: ['⌘', '1'],
    shorten: ['⌘', '2'],
    followUp: ['⌘', '3'],
    recap: ['⌘', '4'],
    answer: ['⌘', '5'],
    scrollUp: ['⌘', '↑'],
    scrollDown: ['⌘', '↓'],
    reservedShortcut1: [],
    reservedShortcut2: [],
    reservedShortcut3: [],
    reservedShortcut4: [],
    interviewNext: ['⌘', 'Enter'],
    interviewSync: ['⌘', '⇧', 'Enter'],
    interviewPhasePrev: ['⌘', '⇧', '←'],
    interviewPhaseNext: ['⌘', '⇧', '→'],
    interviewScrollUp: ['⌘', '⇧', '↑'],
    interviewScrollDown: ['⌘', '⇧', '↓'],
    interviewExitMode: [],
    moveWindowUp: ['⌘', '↑'],
    moveWindowDown: ['⌘', '↓'],
    moveWindowLeft: ['⌘', '←'],
    moveWindowRight: ['⌘', '→'],
    toggleVisibility: ['⌘', 'B'],
    toggleMousePassthrough: ['⌘', '⇧', 'B'],
    processScreenshots: ['⌘', '⌥', 'Enter'],
    captureAndProcess: ['⌘', '⌥', '⇧', 'Enter'],
    resetCancel: ['⌘', 'R'],
    takeScreenshot: ['⌘', 'H'],
    selectiveScreenshot: ['⌘', '⇧', 'H']
};

export const DEFAULT_SHORTCUT_ENABLED: ShortcutEnabledConfig = {
    whatToAnswer: true,
    shorten: true,
    followUp: true,
    recap: true,
    answer: true,
    scrollUp: true,
    scrollDown: true,
    reservedShortcut1: true,
    reservedShortcut2: true,
    reservedShortcut3: true,
    reservedShortcut4: true,
    interviewNext: true,
    interviewSync: true,
    interviewPhasePrev: false,
    interviewPhaseNext: false,
    interviewScrollUp: true,
    interviewScrollDown: true,
    interviewExitMode: false,
    moveWindowUp: true,
    moveWindowDown: true,
    moveWindowLeft: true,
    moveWindowRight: true,
    toggleVisibility: true,
    toggleMousePassthrough: true,
    processScreenshots: true,
    captureAndProcess: true,
    resetCancel: true,
    takeScreenshot: true,
    selectiveScreenshot: true
};

export const useShortcuts = () => {
    const [shortcuts, setShortcuts] = useState<ShortcutConfig>(DEFAULT_SHORTCUTS);
    const [shortcutEnabled, setShortcutEnabledState] = useState<ShortcutEnabledConfig>(DEFAULT_SHORTCUT_ENABLED);

    const mapBackendToFrontend = useCallback((backendKeybinds: BackendKeybind[]) => {
        const nextShortcuts: ShortcutConfig = { ...DEFAULT_SHORTCUTS };
        const nextEnabled: ShortcutEnabledConfig = { ...DEFAULT_SHORTCUT_ENABLED };

        backendKeybinds.forEach((keybind) => {
            const actionId = ACTION_BY_BACKEND_ID[keybind.id];
            if (!actionId) return;

            nextShortcuts[actionId] = acceleratorToKeys(keybind.accelerator);
            nextEnabled[actionId] = keybind.enabled !== false;
        });

        setShortcuts(nextShortcuts);
        setShortcutEnabledState(nextEnabled);
    }, []);

    useEffect(() => {
        const fetchKeybinds = async () => {
            try {
                const keybinds = await window.electronAPI.getKeybinds();
                mapBackendToFrontend(keybinds);
            } catch (error) {
                console.error('Failed to fetch keybinds:', error);
            }
        };

        fetchKeybinds();

        const unsubscribe = window.electronAPI.onKeybindsUpdate((keybinds) => {
            mapBackendToFrontend(keybinds);
        });

        return unsubscribe;
    }, [mapBackendToFrontend]);

    const updateShortcut = useCallback(async (actionId: ShortcutActionId, keys: string[]): Promise<ShortcutMutationResult> => {
        const backendId = BACKEND_ID_BY_ACTION[actionId];
        if (!backendId) {
            return { success: false, error: 'Shortcut not found.' };
        }

        try {
            const result = await window.electronAPI.setKeybind(backendId, keysToAccelerator(keys));
            if (result?.success) {
                setShortcuts((prev) => ({ ...prev, [actionId]: keys }));
                return { success: true };
            }
            return result || { success: false, error: `Failed to set keybind for ${actionId}.` };
        } catch (error) {
            console.error(`Failed to set keybind for ${actionId}:`, error);
            return { success: false, error: `Failed to set keybind for ${actionId}.` };
        }
    }, []);

    const setShortcutEnabled = useCallback(async (actionId: ShortcutActionId, enabled: boolean): Promise<ShortcutMutationResult> => {
        const backendId = BACKEND_ID_BY_ACTION[actionId];
        if (!backendId) {
            return { success: false, error: 'Shortcut not found.' };
        }

        try {
            const result = await window.electronAPI.setKeybindEnabled(backendId, enabled);
            if (result?.success) {
                setShortcutEnabledState((prev) => ({ ...prev, [actionId]: enabled }));
                return { success: true };
            }
            return result || { success: false, error: `Failed to update ${actionId}.` };
        } catch (error) {
            console.error(`Failed to set keybind enabled for ${actionId}:`, error);
            return { success: false, error: `Failed to update ${actionId}.` };
        }
    }, []);

    const resetShortcuts = useCallback(async () => {
        try {
            const defaults = await window.electronAPI.resetKeybinds();
            mapBackendToFrontend(defaults);
        } catch (error) {
            console.error('Failed to reset keybinds:', error);
        }
    }, [mapBackendToFrontend]);

    const isShortcutPressed = useCallback((event: KeyboardEvent | React.KeyboardEvent, actionId: ShortcutActionId): boolean => {
        if (!shortcutEnabled[actionId]) return false;

        const keys = shortcuts[actionId];
        if (!keys || keys.length === 0) return false;

        const hasMeta = keys.some((key) => ['⌘', 'Command', 'Meta'].includes(key));
        const hasCtrl = keys.some((key) => ['⌃', 'Control', 'Ctrl'].includes(key));
        const hasAlt = keys.some((key) => ['⌥', 'Alt', 'Option'].includes(key));
        const hasShift = keys.some((key) => ['⇧', 'Shift'].includes(key));

        if (event.metaKey !== hasMeta) return false;
        if (event.ctrlKey !== hasCtrl) return false;
        if (event.altKey !== hasAlt) return false;
        if (event.shiftKey !== hasShift) return false;

        const mainKey = keys.find((key) =>
            !['⌘', 'Command', 'Meta', '⇧', 'Shift', '⌥', 'Alt', 'Option', '⌃', 'Control', 'Ctrl'].includes(key)
        );

        if (!mainKey) return false;

        const eventKey = event.key.toLowerCase();
        const configKey = mainKey.toLowerCase();

        if (configKey === 'space') {
            return event.code === 'Space';
        }

        return eventKey === configKey;
    }, [shortcutEnabled, shortcuts]);

    return {
        shortcuts,
        shortcutEnabled,
        updateShortcut,
        setShortcutEnabled,
        resetShortcuts,
        isShortcutPressed
    };
};
