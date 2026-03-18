import { useCallback, useEffect, useState } from 'react';
import { readOpacitySetting, UI_TRANSPARENCY_EVENT, writeOpacitySetting } from '../lib/uiTransparency';

export function useUiOpacitySetting(key: string, fallback: number) {
    const [value, setValue] = useState(() => readOpacitySetting(key, fallback));

    useEffect(() => {
        const syncFromStorage = () => {
            setValue(readOpacitySetting(key, fallback));
        };

        window.addEventListener('storage', syncFromStorage);
        window.addEventListener(UI_TRANSPARENCY_EVENT, syncFromStorage as EventListener);

        return () => {
            window.removeEventListener('storage', syncFromStorage);
            window.removeEventListener(UI_TRANSPARENCY_EVENT, syncFromStorage as EventListener);
        };
    }, [key, fallback]);

    const updateValue = useCallback((nextValue: number) => {
        const saved = writeOpacitySetting(key, nextValue);
        setValue(saved);
    }, [key]);

    return [value, updateValue] as const;
}
