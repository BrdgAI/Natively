# Interview Mode UI Refactor Plan

## Context & Goal

The current overlay sits atop a light-theme Google Doc + coding environment (Chrome, Docs, Meet camera). We need a transparent overlay that is:
- Readable without fighting the document underneath
- Dense — maximum useful content per pixel, no decorative waste
- Keyboard/shortcut-only friendly (mouse clicks disabled, no unnecessary buttons)
- Eye-anchored near the camera zone (top of screen)

**Primary screen profile:** Light Google Docs (white bg, black text), Chrome browser bar at top, Meet camera floating (bottom-left or top-left typically).

---

## Problem Diagnosis (Current State)

| Component | Issue |
|---|---|
| `InterviewOverlay` | Backdrop `rgba(26,23,20,0.14)` is too light → panels don't contrast against white doc; the `interview-surface` warm cream (`rgba(248,244,238,0.68)`) blends with Google Docs |
| `InterviewTopStrip` | Takes ~30% of vertical height with meta pills, transcript box, shortcut hints, buttons. Most of this is rarely read mid-interview |
| Font (`--font-interview`) | Just SF Pro at small sizes with regular weight → hard to scan quickly |
| `InterviewMainPanel` | Alternating rows exist but contrast is too subtle against the light cream surface |
| Code panel | `min-h-[280px]` with fixed height — long code scrolls internally, no way to see full file. Padding is reasonable but line wrapping can break at 430px column width |
| `InterviewNotesRail` | Two full sections take right column space that could go to code |
| `InterviewExtractedTextPanel` | Always rendered even when empty, adding bottom noise |
| No second code panel | p6 follow-up diff has nowhere dedicated to show |
| Update indicator | Buried in top-right of the top strip — not near the eye focus zone |

---

## Design Decisions

### Background / Backdrop
**Current:** `rgba(26, 23, 20, 0.14)` — nearly invisible tint.

**Target:** A subtle cool-dark scrim `rgba(8, 6, 4, 0.26)` — just enough to slightly dim the white doc so the cream/dark panels pop, while still letting you read Google Docs text through it.

The `interview-surface` class needs a dual-purpose change: Keep the cream glass for auxiliary panels (notes, quick answers, extracted text) but give the **main panel and code panel a slightly cooler, darker glass** so text on them reads more like "overlay" rather than "document continuation".

**New CSS classes:**
- `interview-surface` — keep as warm cream for secondary panels (quick answers, notes)
- `interview-surface-primary` — slightly darker, cooler: `rgba(22, 18, 14, 0.76)` with light text, stronger backdrop-filter. Used for main panel and code panel.
- `interview-surface-strip` — ultra-thin for top bar: `rgba(14, 11, 8, 0.62)` with light text.

### Font
**Current:** System SF Pro, mixed weights.

**Target:**  
- **UI font:** `"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif` — Inter gives better screen readability at small sizes. Add as a Google Font or local import.
- **Code font:** `"JetBrains Mono", "SF Mono", "Fira Code", Menlo, monospace`
- **Weight:** Force `font-weight: 600` (semibold) minimum for all line content, `700` for section headers. This makes content scannable without changing font size.
- **CSS variable:** `--font-interview: "Inter", -apple-system, ...` and `--font-interview-code: "JetBrains Mono", ...`
- Since network access may not be available during interviews, fall back gracefully to system fonts. Add Inter via `@import` at the top of index.css, but the stack degrades cleanly.

### Text Colors on Dark Surfaces
For `interview-surface-primary` (dark glass):
- Section headers: `#f0ebe4` (warm white)
- Line content: `#e8e0d6` (slightly warm white)
- Line numbers: `#7a7068` (muted)
- Alternating line bg: row A `rgba(255,255,255,0.04)`, row B `rgba(255,255,255,0.08)`
- Tone warning: `#fbbf6a` (amber)

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ [Clarify●][Approach][Code][Test][Follow-up]    [● Updated: xyz] │  ← Top Strip (28-32px height)
├────────────────────────────────┬───────────────┬────────────────┤
│                                │               │                │
│   MAIN PANEL                   │  CODE PANEL 1 │  CODE PANEL 2  │
│   ─────────────                │  (primary)    │  (diff/p6 only)│
│   [Anchor sticky]              │               │                │
│   1 │ line one                 │  line numbers │  diff lines    │
│   2 │ line two                 │  monospace    │  highlighted   │
│   3 │ …                        │               │                │
│                                │               │                │
│   [Quick Answers sub-block]    ├───────────────┤                │
│   ── pinned, compact ──        │  NOTES RAIL   │                │
│                                │  (collapsed   │                │
│                                │   by default) │                │
├────────────────────────────────┴───────────────┴────────────────┤
│  [Screen Text · Δ Requirements · Dry Run]  only when non-empty  │
└─────────────────────────────────────────────────────────────────┘
```

**Column widths:**  
- Main: `minmax(0, 1fr)` — takes all available
- Code panel 1: `340px` fixed (enough for ~80 char lines at 11px mono)
- Code panel 2: `300px` fixed, only rendered in `p4_code` (diff mode) and `p6_follow_up`

In `InterviewOverlay.tsx`, change the grid:
```
// Currently:
"xl:grid-cols-[minmax(0,1.35fr)_430px]"

// New (when second code panel visible):
"xl:grid-cols-[minmax(0,1fr)_340px_300px]"

// New (when second code panel hidden):
"xl:grid-cols-[minmax(0,1fr)_340px]"
```

---

## Component-by-Component Changes

### 1. `src/index.css` — Styling Foundation

**Add:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap');

:root {
  --font-interview: "Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  --font-interview-code: "JetBrains Mono", "SF Mono", "Fira Code", Menlo, monospace;
}

/* Primary dark-glass surface for main + code panels */
.interview-surface-primary {
  font-family: var(--font-interview);
  background: rgba(20, 16, 12, 0.76);
  border: 1px solid rgba(255, 230, 190, 0.10);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px) saturate(130%);
  -webkit-backdrop-filter: blur(12px) saturate(130%);
}

/* Strip variant for top bar */
.interview-surface-strip {
  font-family: var(--font-interview);
  background: rgba(14, 11, 8, 0.64);
  border: 1px solid rgba(255, 230, 190, 0.08);
  backdrop-filter: blur(10px) saturate(120%);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
}

/* Keep interview-surface (warm cream) for secondary panels */
/* Update: slightly more opaque and stronger blur for better readability */
.interview-surface {
  font-family: var(--font-interview);
  background: rgba(245, 238, 228, 0.72);    /* was 0.68 */
  border: 1px solid rgba(71, 58, 48, 0.18);  /* slightly more visible */
  box-shadow: 0 4px 14px rgba(34, 25, 19, 0.10);
  backdrop-filter: blur(10px) saturate(122%);
  -webkit-backdrop-filter: blur(10px) saturate(122%);
}

/* Diff line classes - update for better dark-bg contrast */
.interview-code-line-add {
  background: rgba(86, 160, 98, 0.22);
  color: #a8e6b2;
}
.interview-code-line-remove {
  background: rgba(185, 80, 70, 0.22);
  color: #f0a89a;
}
.interview-code-line-neutral {
  background: transparent;
}
```

**Modify backdrop in InterviewOverlay:**
```
// in InterviewOverlay.tsx, change the backdrop div style:
// from: background: 'rgba(26, 23, 20, 0.14)'
// to:   background: 'rgba(8, 6, 4, 0.26)'
```

---

### 2. `InterviewTopStrip.tsx` — Radical Slimming

**Goal:** Single-row, ≤ 32px height. Phase chips + update indicator on one line. No transcript box. No meta pills by default.

**Remove:**
- The transcript/status message box (`lastTranscriptSnippet` display)
- All `MetaPill` instances (confidence, routing, transcript freshness, screen freshness, model label, STT label)
- Shortcut hint text in top strip (relocate to a once-visible tooltip or help panel)
- Buttons row (keep only when `!mousePassthrough`, but move to a collapsible)

**Keep:**
- `InterviewPhaseFlow` (phase chips)
- `InterviewUpdateIndicator` (move to right side of same row, after phase chips)
- A minimal generating indicator (spinner or dot when `isGenerating`)
- Status message as a brief label only when generating (e.g. small text `Generating…`)

**New structure:**
```tsx
<div className="interview-surface-strip pointer-events-auto rounded-[8px] px-3 py-1.5">
  <div className="flex items-center justify-between gap-4">
    
    {/* Left: Phase flow chips */}
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold text-[#8a7860] mr-1">●</span>
      <InterviewPhaseFlow activePhase={activePhase} manualOverridePhase={manualOverridePhase} />
    </div>
    
    {/* Right: generating indicator + update summary */}
    <div className="flex items-center gap-2">
      {isGenerating && (
        <span className="text-[10px] font-semibold text-[#c4a87a] animate-pulse">Generating…</span>
      )}
      <InterviewUpdateIndicator summary={updateSummary} compact />
    </div>
    
    {/* Fallback buttons when mouse passthrough is off */}
    {!mousePassthrough && (
      <div className="flex items-center gap-1.5">
        ...buttons...
      </div>
    )}
  </div>
</div>
```

**Props change:** Add `isGenerating: boolean` to `InterviewTopStripProps`. This is already available from `snapshot.isGenerating` in `InterviewOverlay`.

**No IPC changes.** Props interface is extended, not broken.

---

### 3. `InterviewPhaseFlow.tsx` — Visual Refresh

**Changes:**
- Dark strip context: Active phase gets a bright warm highlight `bg-[#c97b2e] text-white border-[#c97b2e]`
- Inactive phases: `text-[#8a7860] border-[rgba(255,220,160,0.15)] bg-transparent`
- Add separator dots `·` between chips to save space
- Font: 600 weight, 10px

```tsx
// Active chip:
'border-[#c4873a] bg-[rgba(196,135,58,0.22)] text-[#f5d9a8] font-semibold'

// Inactive chip:
'border-[rgba(255,220,160,0.12)] bg-transparent text-[#7a6850] font-medium'
```

---

### 4. `InterviewUpdateIndicator.tsx` — Add Compact Mode

Add a `compact?: boolean` prop. When compact:
- Show only a colored dot + short message (no updated-sections list)
- Updated: green dot `●`
- Unchanged: grey dot `●` 
- Partial/generating: amber dot `●`

No change to the existing non-compact behavior (backwards compatible).

---

### 5. `InterviewMainPanel.tsx` — Readability Overhaul

**CSS class change:** `interview-surface` → `interview-surface-primary`

**Text changes for dark surface:**
- Section header: `text-[#f0ebe4] font-bold text-[12px]` 
- Line content: `text-[#e0d8ce] font-semibold text-[13px] leading-[1.55]`
- Line numbers: `text-[#6e6258] text-[11px] font-mono`
- Alternating rows: even → `bg-[rgba(255,255,255,0.03)]`, odd → `bg-[rgba(255,255,255,0.07)]`
- Tone warning: `text-[#fbbf6a]`

**Section title bar:** Keep border but slim it: `border-b border-[rgba(255,220,170,0.10)] px-3 py-1.5`

**Section container:** `rounded-[8px] border border-[rgba(255,220,170,0.08)] overflow-hidden`

**Anchor changes:** Keep sticky top, switch to `interview-surface-primary`. Make it more compact: reduce padding, keep title bold white, items as smaller pills.

**Quick Answers integration:**  
Move `InterviewQuickAnswersPanel` OUT of the right column and INTO the main panel as a sticky sub-block below the anchor. This keeps them "near the eye" while the user reads the main content.

```tsx
// In InterviewMainPanel.tsx, after the anchor:
<div className="sticky top-[anchor-height] z-9 pb-1">
  {document.quickAnswers.length > 0 && (
    <InterviewQuickAnswersPanel items={document.quickAnswers} embedded />
  )}
</div>
```

Add `embedded?: boolean` prop to `InterviewQuickAnswersPanel` — when embedded, it uses a more compact style (no box header, just pills in a row).

**Props:** No breaking changes. `snapshot` and `document` and `scrollRef` and `onScroll` remain identical.

---

### 6. `InterviewCodePanel.tsx` — Code Density

**CSS class change:** `interview-surface` → `interview-surface-primary`

**Spacing:**
- Outer container: `px-2 py-2` (from `px-3 py-3`)
- Code lines: `py-[1px]` stays, `px-0` (no extra left indent)
- Line number column: `28px` (from `32px`)
- Font: `var(--font-interview-code)` at `11.5px` / `line-height: 1.42`

**Header:** Slimmer: `py-1` (from none). Language/mode badges move to be very small `text-[9px]`.

**Height:** Remove `min-h-[280px]`. Let it fill the grid row (`flex-1` in the column). Code scrolls within its panel.

**Width consideration:** At `340px` column, 11.5px monospace ≈ 52 chars per visible line without overflow. This is tight for Python. Consider allowing the column to expand to `380px` or allow horizontal scroll with `overflow-x-auto` and `whitespace-pre` (already present).

**Color of code text on dark surface:** `text-[#ddd4c4]` (warm light)

---

### 7. New `InterviewDiffPanel.tsx` — Second Code View

Create a new component `src/components/interview/InterviewDiffPanel.tsx`.

**When to render:** Only when:
- `activePhase === 'p4_code'` AND `codePanel?.mode === 'diff'`
- OR `activePhase === 'p6_follow_up'` AND `codePanel` exists

**Data source:** Same `document.codePanel` as the primary panel — but rendered differently:
- Primary panel shows the full current code (all lines)
- Diff panel shows only changed blocks (lines starting with `+` or `-` or their immediate context)

**Interface:**
```tsx
interface InterviewDiffPanelProps {
  codePanel: InterviewCodePanel | null
  phase: RenderableInterviewPhase
}
```

**No new IPC, no new types, no new backend changes.** Pure UI.

**Header:** "Changes" with diff icon. Shows only diff lines with add/remove highlighting.

---

### 8. `InterviewNotesRail.tsx` — Collapse to Save Space

**Change:** Merge Thought Notes + Pinned Facts into a single collapsed accordion-style section. Show max 3 items by default (no expand needed — just truncate). This frees vertical space for the code panel.

Since the notes rail moves below the primary code panel in the right column, and the second code panel takes the third column, the right column becomes:
- Code Panel (flex-1, takes most height)  
- Notes Rail (auto height, max 3 items each section, compact)

When both sections are empty, don't render the rail at all (already handled by item counts).

---

### 9. `InterviewExtractedTextPanel.tsx` — Conditional + Compact

**Change:** Only render when `hasContent` is true (it already checks this but still renders the container). Add a check in the parent `InterviewOverlay` to conditionally render:

```tsx
// In InterviewOverlay.tsx:
{activeDocument.extractedText && hasExtractedContent(activeDocument.extractedText) && (
  <InterviewExtractedTextPanel extractedText={activeDocument.extractedText} />
)}
```

Add helper: `function hasExtractedContent(e: InterviewExtractedTextSummary): boolean`

Also slim down padding: `px-2.5 py-1.5` (from `px-3 py-2.5`). Text size `11px`.

---

### 10. `InterviewOverlay.tsx` — Layout Wiring

**Backdrop change:**
```tsx
// from:
style={{ background: 'rgba(26, 23, 20, 0.14)' }}
// to:
style={{ background: 'rgba(8, 6, 4, 0.26)' }}
```

**Grid change for conditional second panel:**
```tsx
const showDiffPanel = (activePhase === 'p4_code' && activeDocument.codePanel?.mode === 'diff')
  || activePhase === 'p6_follow_up'

// Grid:
<div className={[
  'grid min-h-0 flex-1 gap-2',
  showDiffPanel
    ? 'xl:grid-cols-[minmax(0,1fr)_340px_300px]'
    : 'xl:grid-cols-[minmax(0,1fr)_340px]'
].join(' ')}>
```

**Pass `isGenerating` to `InterviewTopStrip`:**
```tsx
<InterviewTopStrip
  ...existing props...
  isGenerating={snapshot.isGenerating}
/>
```

**Gap reduction:** `gap-3` → `gap-2` throughout (saves ~4-6px between each row).

**Padding reduction:** `pt-3 pb-4 px-4` → `pt-2 pb-2 px-3` (saves ~8-10px total vertical).

---

## Phase-Specific UI Behaviors

### P2 Clarify — Question Management

**Current problem:** 8 questions listed, user asks 3, some future questions become irrelevant. No UI to track/replace this dynamically.

**Plan:**
The `InterviewClarificationItem` type already has `status: 'pending' | 'asked' | 'answered' | 'retired' | 'replaced'`. The backend generator already tracks this. We just need the UI to render it.

In `InterviewMainPanel.tsx`, detect when phase is `p2_clarify` and use a specialized clarification rendering mode:

```
Section: Questions
┌─────────────────────────────────────────────────────────┐
│  ✓  1 │ [asked + answered] "What's the input size?"    │  ← green tint
│  →  2 │ [pending]          "Can there be duplicates?"  │  ← normal
│  ✗  3 │ [retired]          "Strikethrough text…"       │  ← muted strike
│  ↺  4 │ [replaced]         "New: Is output sorted?"    │  ← amber/new
└─────────────────────────────────────────────────────────┘
```

**How to do this without breaking:** The main sections already carry line-by-line text. The `Phase2ClarificationGenerator` populates `mainSections` with the questions. We need the generator to either:
a) Embed status prefixes in the line text (e.g. `[✓] What is the input size?`)
b) Or use the `tone` field on sections to convey state

Option (a) is safest — add a simple prefix parser in `InterviewMainPanel` that strips known prefixes `[✓]`, `[✗]`, `[→]`, `[↺]` and applies appropriate styling. No schema change needed.

**For now in the plan:** The UI will add a prefix-aware renderer for p2 lines. Generator changes are a separate task.

**Format sub-panel:** The anchor block's `writeNow` array is used for "write now" hints. In p2, this should show the "format to write answers" (e.g. "TC: O(n), SC: O(1) | Assume sorted input"). The anchor block already supports `writeNow[]` — generator just needs to populate it. No UI change needed here.

### P3 Approach
Load everything at once into main sections. Same rendering as now. On next trigger, sections update in place. No special UI needed beyond the global changes above.

### P4 Code
- Primary code panel: Full code with blueprint comments (`mode: 'skeleton'` or `'full'`)
- Code narration (what to say): Lives in `codePanel.narration[]` — render these in the main section's anchor `writeNow` area so user can read them while coding. The anchor already supports `writeNow: string[]`.
- Diff panel (second code panel): When `mode === 'diff'`, the diff panel shows changes
- The code panel should have `overflow-x: auto` and not wrap — user explicitly needs to see indent without line breaks

### P5 Test
- Main section shows dry run content
- Quick answers panel can hold "function references" (short names like "dfs() → line 14")
- If user provides new test variable via transcript, backend sends new dry run as `mainSections` update. UI handles this naturally.

### P6 Follow-up
- Second code panel renders diff of the changed code
- Main section holds follow-up explanations
- Notes rail can hold the follow-up request context

---

## Files to Change (Implementation Order)

| Order | File | Type | Safe? |
|---|---|---|---|
| 1 | `src/index.css` | Add new CSS classes, update existing | ✅ Pure CSS, no logic |
| 2 | `InterviewUpdateIndicator.tsx` | Add `compact` prop | ✅ Backwards compatible |
| 3 | `InterviewPhaseFlow.tsx` | Visual style changes only | ✅ No prop/interface change |
| 4 | `InterviewTopStrip.tsx` | Add `isGenerating` prop, slim layout | ✅ Additive prop |
| 5 | `InterviewMainAnchor.tsx` | Dark surface styling | ✅ No prop change |
| 6 | `InterviewMainPanel.tsx` | Dark surface, embed QuickAnswers | ✅ No prop change |
| 7 | `InterviewQuickAnswersPanel.tsx` | Add `embedded` prop | ✅ Backwards compatible |
| 8 | `InterviewCodePanel.tsx` | Dark surface, density, font | ✅ No prop change |
| 9 | `InterviewNotesRail.tsx` | Compact, truncate to 3 | ✅ No prop change |
| 10 | `InterviewExtractedTextPanel.tsx` | Slim padding | ✅ No prop change |
| 11 | `InterviewDiffPanel.tsx` | **NEW component** | ✅ New file, no existing code touched |
| 12 | `InterviewOverlay.tsx` | Backdrop, grid, pass isGenerating, add diff panel | ✅ No IPC/handler changes |

---

## What We Explicitly Do NOT Change

- `src/types/interview.ts` — No type changes
- `electron/` — No backend changes  
- `electron/preload.ts` — No IPC channel changes
- `electron/ipcHandlers.ts` — No handler changes
- `src/App.tsx` — No mounting logic changes
- `useShortcuts` — No keyboard shortcut changes
- All `handleNext`, `handleSync`, `handlePhaseShift` handlers remain identical
- `InterviewControlStrip.tsx` — Leave as-is (it's a transient strip, rarely seen)

---

## Visual Summary: Before vs After

| Aspect | Before | After |
|---|---|---|
| Backdrop | `rgba(26,23,20,0.14)` warm near-transparent | `rgba(8,6,4,0.26)` cool-dark subtle scrim |
| Main panel | Warm cream `rgba(248,244,238,0.68)`, dark text | Dark glass `rgba(20,16,12,0.76)`, light text |
| Code panel | Warm cream, dark text, `min-h-280` | Dark glass, warm-light text, flex-fill height |
| Top strip | ~80px tall: phase + transcript + pills + shortcuts + buttons | ~30px: phase chips + update dot in single row |
| Font | SF Pro, mixed weights | Inter 600/700, JetBrains Mono for code |
| Second code panel | None | Renders only for p4 diff / p6 follow-up |
| Quick answers | Right column, always separate box | Embedded pinned block inside main panel |
| Notes rail | Always 2 full sections visible | Compact, max 3 items per section, hidden when empty |
| Extracted text | Always rendered even when empty | Only rendered when has content |
| Update indicator | Top-right of fat top strip | Right side of thin top strip (near eye zone) |
| Line spacing | `gap-3` throughout | `gap-2` throughout |
| Screen padding | `px-4 pt-3 pb-4` | `px-3 pt-2 pb-2` |

---

## Open Questions / Decisions Needed Before Implementation

1. **Font loading:** Should Inter be loaded via `@import` (requires network at first load) or bundled locally? Local is safer for offline interview scenarios. Recommendation: bundle Inter in `src/font/` alongside CelebMF.

2. **Dark vs cream for ALL panels:** The warm cream still works well for the notes rail and extracted text (auxiliary info). Only main+code need the dark glass. Is this right, or should everything be dark?

3. **P2 clarification prefix format:** The `[✓]`, `[✗]`, `[→]`, `[↺]` prefix parser requires generator cooperation. Should the generator be updated in the same pass, or is this a future ticket? The UI can render it as plain text without prefixes for now and pick up the enhancement later.

4. **Camera position:** Where exactly is the camera typically docked? This affects where the update indicator should be positioned most prominently. Current plan: right side of top strip. If camera is bottom-left, the current position is already far from it — fine. If camera is top-center, we might want the indicator centered or more prominent.
