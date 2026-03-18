export const UI_TRANSPARENCY_EVENT = 'natively:ui-transparency-changed';

export const OVERLAY_OPACITY_KEY = 'natively_overlay_opacity';

export const DEFAULT_OVERLAY_OPACITY = 0.86;

const MIN_OPACITY = 0.35;
const MAX_OPACITY = 1;

export function clampOpacity(value: number): number {
    if (!Number.isFinite(value)) return MAX_OPACITY;
    return Math.min(MAX_OPACITY, Math.max(MIN_OPACITY, value));
}

export function readOpacitySetting(key: string, fallback: number): number {
    const safeFallback = clampOpacity(fallback);
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return safeFallback;
        return clampOpacity(Number(raw));
    } catch {
        return safeFallback;
    }
}

export function writeOpacitySetting(key: string, value: number): number {
    const clamped = clampOpacity(value);
    try {
        localStorage.setItem(key, String(clamped));
        window.dispatchEvent(new CustomEvent(UI_TRANSPARENCY_EVENT, { detail: { key, value: clamped } }));
        // Keep compatibility with existing local `storage`-event sync patterns in this codebase.
        window.dispatchEvent(new Event('storage'));
    } catch {
        // No-op: caller still gets clamped value.
    }
    return clamped;
}

export function opacityToPercent(opacity: number): number {
    return Math.round(clampOpacity(opacity) * 100);
}

export function percentToOpacity(percent: number): number {
    return clampOpacity(percent / 100);
}
