# Natively — Live Coding Interview Feature Q&A

> Context: Assigned task is to improve the live coding interview experience. The scenario assumes a LeetCode-style question presented verbally or on screen, with follow-ups, constraint changes, and dry runs.

---

## Q1 — Do we have working functionality to store the existing context of a session? Is it long enough for an hour-long coding interview?

### Short Answer

Yes, session context storage **is implemented and actively working**, but as designed today, the **active context window fed to the AI for answer generation is only 180 seconds (3 minutes)**. For an hour-long coding interview this is a meaningful limitation — the original problem statement, initial constraints, and early discussion can fall outside the active window.

---

### How it Actually Works

There are **two separate layers** of storage in `SessionTracker.ts`:

#### Layer 1 — `contextItems[]` (Rolling active window)

```37:39:electron/SessionTracker.ts
private contextItems: ContextItem[] = [];
private readonly contextWindowDuration: number = 120; // 120 seconds
private readonly maxContextItems: number = 500;
```

This is what gets passed to the AI for every answer generation call. Items are evicted by `evictOldEntries()` when they are older than **120 seconds** (2 minutes). Hard-capped at 500 items. This is the context used in `getContext(180)` (the method allows overriding up to 180 seconds via argument).

#### Layer 2 — `fullTranscript[]` (Full session record)

```55:56:electron/SessionTracker.ts
// Full Session Tracking (Persisted)
private fullTranscript: TranscriptSegment[] = [];
```

This stores every single final segment from both speakers and the AI — for the entire session, no time-based eviction. It only gets compacted when it exceeds **1,800 entries**:

```392:395:electron/SessionTracker.ts
private async compactTranscriptIfNeeded(): Promise<void> {
    if (this.fullTranscript.length <= 1800 || this.isCompacting) return;

    this.isCompacting = true;
```

When compaction runs, the oldest 500 segments are summarized into a 3-5 bullet **epoch summary** via the LLM, then removed:

```408:431:electron/SessionTracker.ts
const epochSummary = await this.recapLLM.generate(
    `Summarize this conversation segment into 3-5 concise bullet points preserving key topics, decisions, and questions:\n\n${summaryInput}`
);
if (epochSummary && epochSummary.trim().length > 0) {
    this.transcriptEpochSummaries.push(epochSummary.trim());
```

Maximum **5 epoch summaries** are kept:

```426:428:electron/SessionTracker.ts
if (this.transcriptEpochSummaries.length > SessionTracker.MAX_EPOCH_SUMMARIES) {
    this.transcriptEpochSummaries = this.transcriptEpochSummaries.slice(-SessionTracker.MAX_EPOCH_SUMMARIES);
}
```

`getFullSessionContext()` then reconstitutes the full picture as `[SESSION HISTORY – EARLIER DISCUSSION] + [RECENT TRANSCRIPT]`, and this is used for Recap (Mode 4). But for **answer generation (Mode 2 / "What should I say")**, only `getContext(180)` is used — the full session history is NOT included.

#### What `TemporalContextBuilder` sees (Mode 2)

```160:178:electron/llm/TemporalContextBuilder.ts
export function buildTemporalContext(
    contextItems: ContextItem[],
    assistantHistory: AssistantResponse[],
    windowSeconds: number = 180
): TemporalContext {
    const now = Date.now();
    const cutoff = now - (windowSeconds * 1000);

    // Filter to window
    const recentItems = contextItems.filter(item => item.timestamp >= cutoff);
    const recentResponses = assistantHistory.filter(r => r.timestamp >= cutoff);
```

The transcript fed to the LLM for `WhatShouldISay` is the **last 3 minutes** of conversation.

---

### Verdict for a 1-Hour Coding Interview

| Aspect | Current Behavior | Adequate? |
|---|---|---|
| Full session persistence (saving everything) | Yes — `fullTranscript[]` stores all segments | ✅ |
| Recap mode (Mode 4) | Yes — uses `getFullSessionContext()` including epoch summaries | ✅ |
| **Active AI context for answer generation** | **3 minutes (180 seconds)** | ❌ Not enough |
| Problem statement retention in AI context | If stated >3 min ago, it's gone from active window | ❌ Critical gap |
| Epoch compaction loss risk | After ~1800 segments, early data is summarized (lossy) | ⚠️ Risk for very long sessions |

**The critical gap**: In a LeetCode-style interview, the problem is stated once at the start. If the interviewee is deliberating, writing code, and 5+ minutes pass before hitting "What should I say?", the original problem statement is no longer in the active context window. The AI will be answering with only the recent back-and-forth, potentially missing the core constraints.

---

### What Needs to Change

1. **Extend the context window for Mode 2** from 180 seconds to at least `fullTranscript`-based retrieval, or implement a "pinned problem context" that gets injected into every prompt regardless of timestamp.
2. **Problem statement anchoring**: When a coding question is detected (via `IntentClassifier`), pin it permanently to the session context so it never ages out.
3. **For a 60-minute interview**, the epoch compaction (up to 5 summaries × 500 segments) should be sufficient to retain high-level history, but the summaries are lossy — specific constraints and edge cases may be dropped.

---

## Q2 — Does it have functionality to provide an answer based on the recent conversation on both sides when triggered?

### Short Answer

**Yes — this works well in principle.** When Mode 2 is triggered ("What Should I Say"), the system reads the last 180 seconds of conversation from both the interviewer and the user/interviewee. The context is labeled and weighted by speaker role. However, the same 3-minute window limitation from Q1 applies.

---

### How it Works

`IntelligenceEngine.runWhatShouldISay()` is the core function. When triggered:

**Step 1 — Gather context from both sides**

```243:261:electron/IntelligenceEngine.ts
const contextItems = this.session.getContext(180);

// Inject latest interim transcript if available
const lastInterim = this.session.getLastInterimInterviewer();
if (lastInterim && lastInterim.text.trim().length > 0) {
    ...
    contextItems.push({
        role: 'interviewer',
        text: lastInterim.text,
        timestamp: lastInterim.timestamp
    });
}
```

This even injects the **latest in-progress (non-final) interviewer speech** so the AI gets the most up-to-date context even if the interviewer hasn't finished speaking.

**Step 2 — Format transcript with role weighting**

```140:150:electron/llm/TemporalContextBuilder.ts
function formatTranscript(items: ContextItem[]): string {
    return items.map(item => {
        if (item.role === 'interviewer') {
            // Weight interviewer turns more strongly - they define intent
            return `[INTERVIEWER – IMPORTANT]: ${item.text}`;
        } else if (item.role === 'user') {
            return `[ME]: ${item.text}`;
        } else {
            return `[ASSISTANT (MY PREVIOUS RESPONSE)]: ${item.text}`;
        }
    }).join('\n');
}
```

Interviewer turns are explicitly labeled as `IMPORTANT` to bias the LLM toward answering the interviewer's question.

**Step 3 — Intent classification (local, no API)**

```278:282:electron/IntelligenceEngine.ts
const intentResult = await classifyIntent(
    lastInterviewerTurn,
    preparedTranscript,
    this.session.getAssistantResponseHistory().length
);
```

The bundled `mobilebert-uncased-mnli` ONNX model classifies whether the question is coding, behavioral, explanation, objection, etc. The prompts branch based on intent — for coding questions, brevity rules are removed and full runnable code is demanded.

**Step 4 — Anti-repetition from previous AI answers**

```42:47:electron/llm/WhatToAnswerLLM.ts
if (temporalContext && temporalContext.hasRecentResponses) {
    const history = temporalContext.previousResponses.map((r, i) => `${i + 1}. "${r}"`).join('\n');
    contextParts.push(`PREVIOUS RESPONSES (Avoid Repetition):\n${history}`);
}
```

Last 3 AI responses from the session history are injected into the prompt to prevent the AI from giving the same answer to follow-up questions or reformulations.

**Step 5 — Stream to overlay**

The full answer streams token-by-token to `NativelyInterface.tsx` via `onIntelligenceSuggestedAnswerToken` IPC events, displayed live in the chat UI.

---

### Specific to Coding Interviews

Every provider-specific prompt has explicit coding mode rules. For example, the Groq prompt:

```358:363:electron/llm/prompts.ts
CODING & PROGRAMMING MODE (Applied whenever programming or Leetcode is mentioned):
- If the question is related to implementation, algorithms, or technical design:
- IGNORE ALL BREVITY AND CONVERSATIONAL RULES for the code itself.
- ALWAYS provide the FULL, complete, working code (including necessary imports, class definitions, and boilerplate) in a clean markdown block
- SMART APPROACH: Start with 1-2 sentences explaining the "Smart approach" or logic first.
- End with 1 concise sentence on why this implementation is optimal or a key tradeoff.
```

When a follow-up like "can you optimize this?" or "now do it in O(1) space" is issued, Mode 3 (Follow-Up) kicks in:

- `FollowUpLLM` receives the **previous answer** as explicit context
- The refinement request (e.g., "shorten", "optimize", "add edge cases") is appended
- The LLM rewrites the answer maintaining the same voice

---

### Gaps for a Dynamic Coding Interview

| Scenario | Current Behavior | Gap |
|---|---|---|
| Interviewer states problem verbally | ✅ Captured by STT, stored in contextItems | Works if triggered within 3 min |
| Constraint change ("now do it in O(1) space") | ✅ In active window if recent | Works if within 3 min |
| Dry run walkthrough ("walk me through line 3") | ✅ Captures recent back-and-forth | Works if within 3 min |
| Problem screen-shared (on display, not spoken) | ❌ NOT captured by audio — needs screenshot | Must manually screenshot |
| Problem stated 10+ minutes ago | ❌ Outside 180s active window | Critical gap |
| Interviewee asks clarifying questions | ✅ User mic turn captured as `[ME]:` | Works |

---

## Q3 — How does a screenshot get processed? Is there in-house OCR, or does the image go directly to the LLM?

### Short Answer

**There is no OCR in the live interview flow. The image goes directly to vision-capable LLM models as base64-encoded data.** Tesseract.js is listed as a package dependency but has zero usage in the main Electron process — it appears to be a leftover from an earlier version or future plan.

---

### The Actual Pipeline

#### Step 1 — Capture

`ScreenshotHelper.takeScreenshot()` runs a platform-native command:

```53:66:electron/ScreenshotHelper.ts
if (platform === 'darwin') {
    return interactive
        ? `screencapture -i -x "${safePath}"`
        : `screencapture -x -C "${safePath}"`;
} else if (platform === 'win32') {
    const psScript = `Add-Type -AssemblyName System.Windows.Forms; ...CopyFromScreen...`;
    return `powershell -NoProfile -Command "${psScript}"`;
}
```

Output: a `.png` file saved to `userData/screenshots/`.

The overlay window is **hidden for 50ms** before the screenshot, then shown again, so the copilot UI doesn't appear in the capture.

There is also `takeSelectiveScreenshot()` (interactive mode) which lets the user drag-select a region of the screen — useful for capturing only the problem panel in a LeetCode split-screen.

#### Step 2 — Preprocessing (`sharp`)

Before sending to the LLM, every image is resized and compressed:

```571:598:electron/LLMHelper.ts
private async processImage(path: string): Promise<{ mimeType: string, data: string }> {
    ...
    const processedBuffer = await sharp(imageBuffer)
        .resize({
            width: 1536,
            height: 1536,
            fit: 'inside',       // Maintain aspect ratio
            withoutEnlargement: true
        })
        .jpeg({ quality: 80 }) // Much smaller than PNG, still readable by LLMs
        .toBuffer();
    return {
        mimeType: "image/jpeg",
        data: processedBuffer.toString("base64")
    };
}
```

This is critical for cost control — LLMs charge per image token, and a raw 4K screenshot can be expensive. The resize caps it at 1536×1536px and compresses to JPEG 80%.

#### Step 3 — Direct Vision LLM Call

The base64 image is embedded in the LLM request payload. This happens across all four providers:

**OpenAI** (`image_url` with base64 data URL):
```1021:1027:electron/LLMHelper.ts
if (imagePaths?.length) {
    for (const p of imagePaths) {
        const imageData = await fs.promises.readFile(p);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/png;base64,${imageData.toString("base64")}` } });
```

**Claude** (Anthropic `base64` source type):
```1100:1109:electron/LLMHelper.ts
for (const p of imagePaths) {
    const imageData = await fs.promises.readFile(p);
    ...
    type: "base64",
    data: imageData.toString("base64")
```

**Gemini** (inline parts with mimeType):
```1347:1350:electron/LLMHelper.ts
for (const p of imagePaths) {
    const { mimeType, data } = await this.processImage(p);
```

**Groq Llama 4 Scout** (vision model specifically chosen for this):
```1285:1297:electron/LLMHelper.ts
private async generateWithGroqMultimodal(userMessage: string, imagePaths: string[], systemPrompt?: string): Promise<string> {
    ...
    for (const p of imagePaths) {
        const imageData = await fs.promises.readFile(p);
        contentParts.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,...` } });
```

#### Step 4 — Fallback Cascade (`generateWithVisionFallback`)

```1326:1328:electron/LLMHelper.ts
private async generateWithVisionFallback(systemPrompt: string, userPrompt: string, imagePaths: string[] = []): Promise<string> {
    const isMultimodal = imagePaths.length > 0;
```

If the primary provider fails (API error, rate limit, unavailable), it automatically cascades: OpenAI → Gemini Flash → Claude → Gemini Pro → Groq Llama 4 Scout.

---

### Note on Tesseract

`tesseract.js` is in `package.json` as a dependency but is not imported or used anywhere in `electron/`. It is likely a leftover from the legacy CRA/screenshot-queue era. For LeetCode-style problem parsing, this is actually a missed opportunity — OCR would allow the app to extract structured text from the problem statement for cheaper, more reliable context injection (without consuming vision tokens on every trigger).

---

### Summary Table

| Step | What Happens |
|---|---|
| Capture | Native OS command (screencapture / PowerShell) → PNG file |
| Preprocessing | `sharp`: resize to ≤1536px, JPEG 80% compression |
| Text extraction | None — no OCR |
| LLM delivery | Base64 inline in request to vision-capable model |
| Provider priority | OpenAI vision → Gemini → Claude → Groq Llama 4 Scout |
| Queue size | Max 5 screenshots in memory at a time |

---

## Q4 — Is there functionality that sends the image alongside the verbal context?

### Short Answer

**Yes — this is fully implemented and is the most powerful feature for coding interviews.** When a screenshot is attached and Mode 2 is triggered, the LLM receives both the base64 image AND the recent verbal transcript in a single multimodal request.

---

### The Full Combined-Context Flow

#### 1. Screenshot attach

When a screenshot is taken or manually attached, it goes into `attachedContext` state in the overlay UI:

```102:102:src/components/NativelyInterface.tsx
const [attachedContext, setAttachedContext] = useState<Array<{ path: string, preview: string }>>([]);
```

A thumbnail preview appears in the overlay input bar. Multiple screenshots can be attached simultaneously.

#### 2. Trigger ("What should I say?")

`handleWhatToSay` is the entry point:

```631:662:src/components/NativelyInterface.tsx
const handleWhatToSay = async () => {
    ...
    const currentAttachments = attachedContext;
    if (currentAttachments.length > 0) {
        setAttachedContext([]);
        // Show the attached image in chat
        setMessages(prev => [...prev, {
            ...
            hasScreenshot: true,
            screenshotPreview: currentAttachments[0].preview
        }]);
    }

    try {
        // Pass imagePath if attached
        await window.electronAPI.generateWhatToSay(
            undefined,
            currentAttachments.length > 0 ? currentAttachments.map(s => s.path) : undefined
        );
```

The `imagePaths` array of disk paths is passed through IPC to `ipcHandlers.ts`:

```1456:1460:electron/ipcHandlers.ts
safeHandle("generate-what-to-say", async (_, question?: string, imagePaths?: string[]) => {
    // Question and imagePaths are now optional - IntelligenceManager infers from transcript
    const answer = await intelligenceManager.runWhatShouldISay(question, 0.8, imagePaths);
```

#### 3. Merging transcript + image in the LLM call

In `WhatToAnswerLLM.generateStream()`:

```27:58:electron/llm/WhatToAnswerLLM.ts
async *generateStream(
    cleanedTranscript: string,
    temporalContext?: TemporalContext,
    intentResult?: IntentResult,
    imagePaths?: string[]
): AsyncGenerator<string> {
    ...
    const fullMessage = extraContext
        ? `${extraContext}\n\nCONVERSATION:\n${cleanedTranscript}`
        : cleanedTranscript;

    yield* this.llmHelper.streamChat(fullMessage, imagePaths, undefined, UNIVERSAL_WHAT_TO_ANSWER_PROMPT);
}
```

`streamChat()` then routes to the appropriate multimodal provider. When images are present, text-only providers (like standard Groq Llama 3.3) are excluded:

```1588:1621:electron/LLMHelper.ts
// Multimodal requests EXCLUDE Groq (no vision support)
...
if (isMultimodal && imagePaths) {
    providers.push({ name: `OpenAI`, execute: () => this.streamWithOpenaiMultimodal(userContent, imagePaths!, ...) });
    providers.push({ name: `Gemini Flash`, execute: () => this.streamWithGeminiModel(combinedMessages.gemini, ..., imagePaths) });
    providers.push({ name: `Claude`, execute: () => this.streamWithClaudeMultimodal(userContent, imagePaths!, ...) });
    providers.push({ name: `Gemini Pro`, execute: () => this.streamWithGeminiModel(... imagePaths) });
    providers.push({ name: `Groq (llama-4-scout)`, execute: () => this.streamWithGroqMultimodal(...imagePaths!, ...) });
}
```

---

### What the LLM Sees — Combined Payload Example

For a coding interview, the LLM receives something like this in a single request:

```
[System prompt: "You are Natively, a real-time interview copilot..."]

DETECTED INTENT: coding
ANSWER SHAPE: full_code

PREVIOUS RESPONSES (Avoid Repetition):
1. "I'd approach this with a sliding window..."

CONVERSATION:
[INTERVIEWER – IMPORTANT]: Can you walk me through how you'd solve two sum with O(n) time?
[ME]: Sure, I'd use a hash map approach
[INTERVIEWER – IMPORTANT]: And what about space complexity?

[Inline base64 image: LeetCode problem statement screenshot]
```

The LLM can see the exact problem statement from the screenshot AND the conversational context simultaneously.

---

### Supported Modes for Combined Context

| Mode | Verbal Context | Screenshot | Both Together |
|---|---|---|---|
| Mode 2 — What Should I Say | ✅ | ✅ | ✅ Full multimodal |
| Mode 1 — Assist (passive) | ✅ | ✅ (via `analyzeImageFiles`) | ✅ |
| Mode 5 — Manual Answer (mic) | ✅ | ✅ | ✅ |
| Direct chat input + screenshot | ✅ | ✅ | ✅ |
| Mode 4 — Recap | ✅ | ❌ Not applicable | — |
| Mode 3 — Follow-Up refinement | ✅ (last answer) | ❌ Not applicable | — |

---

### Key Gap

Screenshots are **one-shot** — they are consumed and cleared from `attachedContext` when the trigger fires. If the problem statement is on screen for the entire interview, the user must re-attach the screenshot before each AI trigger if they want image context. There is no "pinned" or persistent image context for the duration of the session.

---

## Q5 — If we need to improve the UI/UX of the hidden overlay, do we have options to make dedicated boxes for code, inputs, answers, etc.?

### Short Answer

**The architectural foundation exists to do this, but it is not implemented today.** The current overlay is a single unified chat list. The `Message` interface has metadata fields (`isCode`, `intent`, `hasScreenshot`) that are partially used, and the rendering already uses `react-syntax-highlighter` for code blocks, but there are no visually separated, purpose-specific panels.

---

### Current Overlay Structure

The overlay is a single `600px` wide floating panel with these sections top-to-bottom:

```1501:1526:src/components/NativelyInterface.tsx
<div className="relative w-[600px] ...
    bg-[#1E1E1E]/95 backdrop-blur-2xl
    border border-white/10 shadow-2xl ...
    rounded-[24px] overflow-hidden flex flex-col">

    {/* Rolling Transcript Bar - Single-line interviewer speech */}
    {(rollingTranscript || isInterviewerSpeaking) && showTranscript && (
        <RollingTranscript text={rollingTranscript} isActive={isInterviewerSpeaking} />
    )}

    {/* Chat History - Only show if there are messages OR active states */}
    {(messages.length > 0 || isManualRecording || isProcessing) && (
        <div ... className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[clamp(300px,35vh,450px)]">
```

1. **Rolling Transcript Bar** — Single scrolling line showing the interviewer's live speech (interim, not final)
2. **Chat History area** — All messages (user questions, AI answers, screenshots) in a single list, max 35vh / 450px height
3. **Screenshot thumbnail row** — When screenshots are attached, a thumbnail strip appears above the input
4. **Input bar** — Text input + buttons (What to Say, Mic, Screenshot, Send)

---

### What Exists vs. What's Missing

| UI Element | Exists? | Details |
|---|---|---|
| Rolling live transcript | ✅ | `RollingTranscript.tsx` — single-line animated bar |
| Markdown + code rendering | ✅ | `react-markdown` + `react-syntax-highlighter` (Prism, `vscDarkPlus` theme) |
| Copy button per message | ✅ | Individual copy button on each message bubble |
| Screenshot preview in chat | ✅ | `hasScreenshot` + `screenshotPreview` on `Message` type |
| Intent label on message | ✅ | `intent` field on `Message` type (e.g. `'what_to_answer'`, `'recap'`) |
| Dedicated code panel | ❌ | No separate panel — code is inline in the chat |
| Pinned problem statement panel | ❌ | No fixed area for problem context |
| Inputs/constraints panel | ❌ | Not implemented |
| Separate answer panel (speakable vs. code) | ❌ | Everything is in the same message list |
| Side-by-side layout | ❌ | Always vertical/stacked |
| Auto-resize window | ✅ | `ResizeObserver` → `updateContentDimensions` IPC |
| Expand/collapse toggle | ✅ | `isExpanded` state, TopPill toggle |

---

### Architectural Changes Needed for Dedicated Panels

The overlay is a React component (`NativelyInterface.tsx`) inside an Electron `BrowserWindow` configured to resize dynamically via `ResizeObserver`. Because window sizing is driven by the content's `getBoundingClientRect()`, any layout redesign will automatically be reflected in the window size — this is a significant advantage.

Here is the conceptual layout redesign for a coding-interview-specific overlay:

```
┌──────────────────────────────────────────────────┐
│ TopPill  (drag handle, end meeting, collapse)    │
├──────────────────────────────────────────────────┤
│  PROBLEM CONTEXT  [pinned / collapsible]         │
│  ┌────────────────────────────────────────────┐  │
│  │ 📌 Two Sum — given array nums and int...   │  │
│  │ [from screenshot + STT, auto-extracted]    │  │
│  └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│  LIVE TRANSCRIPT  (rolling, single-line)         │
│  > Interviewer: "can you walk me through..."    │
├──────────────────────────────────────────────────┤
│  AI ANSWER  [streamed, intent-aware]             │
│  ┌────────────────────────────────────────────┐  │
│  │ VERBAL  "I'd use a HashMap to store..."    │  │
│  ├────────────────────────────────────────────┤  │
│  │ CODE                                        │  │
│  │ ```python                                   │  │
│  │ def twoSum(nums, target): ...              │  │
│  │ ```                                         │  │
│  └────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│  FOLLOW-UP ACTIONS                               │
│  [Shorten] [More detail] [Optimize] [Edge cases]│
├──────────────────────────────────────────────────┤
│  INPUT BAR  [text] [mic] [📷] [What to Say]     │
└──────────────────────────────────────────────────┘
```

---

### What Makes This Feasible

1. **The `Message.intent` field already distinguishes message types** — `'what_to_answer'`, `'recap'`, `'follow_up'`, `'assist'`. The renderer can render different `intent` values into different panel areas instead of a linear list.

2. **The `Message.isCode` flag** exists but is not fully utilized for visual separation. It could be used to route code blocks to a dedicated panel.

3. **`react-syntax-highlighter` is already bundled** with `vscDarkPlus` theme — the code rendering quality is already production-grade.

4. **The window auto-resize system** means rearranging the layout won't require changes to Electron window management — the window just follows the content.

5. **`react-markdown` with `remarkGfm` + `remarkMath` + `rehypeKatex`** is already in place for math-heavy algorithm explanations (big-O notation, recurrences, etc.).

6. **The `attachedContext` state** (screenshot queue) already has the infrastructure for a persistent image context panel — it just needs to be surfaced as a "pinned problem statement" panel rather than a transient thumbnail row.

---

### Specific Improvements Recommended

| Improvement | Effort | Impact |
|---|---|---|
| **Split AI answer into verbal + code panels** | Medium | High — interviewee can see what to say vs. what to type separately |
| **Pinned problem statement panel** (auto-extracted from screenshot/STT) | High | High — fixes Q1 context gap; always visible |
| **Constraint tracker** (live-updated list of constraints as they change) | High | High — handles "now do it without extra space" dynamically |
| **Follow-up quick-actions row** (Shorten / Optimize / Add edge cases) | Low | High — already Mode 3 exists, just needs dedicated buttons |
| **Wider overlay option** (e.g., 800px or resizable) | Low | Medium — more space for code without horizontal scroll |
| **Syntax theme picker** (light/dark Prism themes) | Low | Low — cosmetic |
| **Copy code button** (separate from copy full answer) | Low | Medium — useful during coding round |
| **Overlay opacity slider** | Low | Medium — helps with stealth positioning over IDE |

---

### Summary

The overlay today is a generic chat UI adapted to an interview context. All the technical infrastructure (multimodal LLM, streaming, intent classification, code rendering, auto-resize) is solid. What's missing is the **information architecture** — organizing the output into spatially distinct areas that match the interviewee's cognitive workflow: see the problem → see the approach → see the code → see what to say. This is purely a frontend redesign of `NativelyInterface.tsx` and requires no backend changes.
