# Audio Capture Log

Branch: `codex/work-ahead`

## Scope

This log covers the microphone and speaker capture work done to make the macOS meeting path testable and reliable with separate mic vs system-audio STT.

## Problems Observed

1. Preferred microphone selection was not actually honored by the native capture path.
2. The settings mic meter used browser media APIs with native device IDs, which made device testing unreliable.
3. Invalid saved mic IDs could fail quietly instead of falling back cleanly.
4. macOS speaker capture was unreliable when the app took the CoreAudio path first.
5. During temporary testing, a global `Cmd+5` shortcut and an always-on debug panel were added, but those were only for validation.

## Root Causes

1. `native-module/src/microphone.rs` accepted a device ID but still opened the default input device.
2. `src/components/SettingsOverlay.tsx` mixed native audio-device IDs with renderer/browser device-selection APIs.
3. `electron/audio/MicrophoneCapture.ts` swallowed native initialization errors, so fallback logic did not run.
4. For the current macOS requirement, `ScreenCaptureKit` is the more reliable backend for "current system mix" capture, especially when using headphones.

## Changes Made

### PR-safe / globally useful

1. Implemented native mic device lookup and selection in `native-module/src/microphone.rs`.
2. Made `MicrophoneCapture` surface native initialization failures so the app can recover instead of failing silently.
3. Moved the settings mic meter onto the native mic-test path and fixed its event wiring.
4. Improved audio-test fallback behavior when a preferred input device is invalid.
5. Restored the default macOS speaker path to `ScreenCaptureKit` while leaving CoreAudio behind the legacy toggle.
6. Updated start flows so both normal meeting start and prepared-calendar meeting start use the same macOS backend selection rule.
7. Clarified the settings copy so output-preview behavior matches the actual backend behavior.

### Temporary testing changes that were removed

1. Global `Cmd+5` trigger for answer/record during meetings.
2. Always-on session debug panel showing mic STT, speaker STT, and answer-flow state.

## Verification Performed

1. `npx tsc -p electron/tsconfig.json --noEmit`
2. `npx tsc -p tsconfig.json --noEmit`
3. `npm run app:dev` smoke boot
4. Manual macOS validation confirmed:
   - separate mic vs speaker capture while using headphones
   - speaker STT works through system audio instead of acoustic mic bleed
   - transcript output shows the separation clearly post-session

## System-specific Notes

These points should be reviewed before upstreaming:

1. Forcing `outputDeviceId = "sck"` by default is a macOS backend policy choice, not a machine-specific hardcode.
   - It is intended for general macOS use in this app.
   - It is not a per-user path or host-specific value.
2. The CoreAudio path remains available behind `useLegacyAudioBackend`.
   - This is intentionally treated as beta/legacy because it was less reliable for the tested macOS scenario.
3. No host-specific paths, usernames, local device names, or local-only IDs were added as product behavior.

## Upstream PR Guidance

Safe to upstream:
- native mic device selection
- native mic test path in settings
- mic error surfacing / fallback improvements
- clearer macOS backend selection semantics
- settings copy updates describing SCK vs CoreAudio behavior

Do not upstream blindly without product review:
- any future temporary debug UI
- any future global shortcut overrides added only for testing
