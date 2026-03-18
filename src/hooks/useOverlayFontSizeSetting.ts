import { useCallback, useEffect, useState } from 'react';
import {
    readOverlayFontSizeSetting,
    UI_TYPOGRAPHY_EVENT,
    writeOverlayFontSizeSetting,
} from '../lib/uiTypography';

export function useOverlayFontSizeSetting(key: string, fallback: number) {
    const [value, setValue] = useState(() => readOverlayFontSizeSetting(key, fallback));

    useEffect(() => {
        const syncFromStorage = () => {
            setValue(readOverlayFontSizeSetting(key, fallback));
        };

        window.addEventListener('storage', syncFromStorage);
        window.addEventListener(UI_TYPOGRAPHY_EVENT, syncFromStorage as EventListener);

        return () => {
            window.removeEventListener('storage', syncFromStorage);
            window.removeEventListener(UI_TYPOGRAPHY_EVENT, syncFromStorage as EventListener);
        };
    }, [key, fallback]);

    const updateValue = useCallback((nextValue: number) => {
        const saved = writeOverlayFontSizeSetting(key, nextValue);
        setValue(saved);
    }, [key]);

    return [value, updateValue] as const;
}
