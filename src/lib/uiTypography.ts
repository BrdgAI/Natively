export const UI_TYPOGRAPHY_EVENT = 'natively:ui-typography-changed';

export const OVERLAY_FONT_SIZE_KEY = 'natively_overlay_font_size';
export const DEFAULT_OVERLAY_FONT_SIZE = 14;

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 20;

export function clampOverlayFontSize(value: number): number {
    if (!Number.isFinite(value)) return DEFAULT_OVERLAY_FONT_SIZE;
    const rounded = Math.round(value);
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, rounded));
}

export function readOverlayFontSizeSetting(key: string, fallback: number): number {
    const safeFallback = clampOverlayFontSize(fallback);
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return safeFallback;
        return clampOverlayFontSize(Number(raw));
    } catch {
        return safeFallback;
    }
}

export function writeOverlayFontSizeSetting(key: string, value: number): number {
    const clamped = clampOverlayFontSize(value);
    try {
        localStorage.setItem(key, String(clamped));
        window.dispatchEvent(new CustomEvent(UI_TYPOGRAPHY_EVENT, { detail: { key, value: clamped } }));
        window.dispatchEvent(new Event('storage'));
    } catch {
        // No-op: caller still gets clamped value.
    }
    return clamped;
}
