# Natively — Deep Research Report

> Authored: March 17, 2026  
> Branch: `research/init`  
> Version analyzed: 2.0.6

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder & File Structure](#2-folder--file-structure)
3. [Technical Architecture](#3-technical-architecture)
4. [Dependencies](#4-dependencies)
5. [Data Flow — Meeting Lifecycle](#5-data-flow--meeting-lifecycle)
6. [Intelligence Engine (6 AI Modes)](#6-intelligence-engine-6-ai-modes)
7. [RAG Pipeline](#7-rag-pipeline)
8. [LLM Routing](#8-llm-routing)
9. [Speech-to-Text Providers](#9-speech-to-text-providers)
10. [Native Rust Audio Module](#10-native-rust-audio-module)
11. [Database Schema](#11-database-schema)
12. [Key Managers & Services](#12-key-managers--services)
13. [Stealth / Undetectable Mode](#13-stealth--undetectable-mode)
14. [Premium / Pro System](#14-premium--pro-system)
15. [Google Calendar Integration](#15-google-calendar-integration)
16. [Analytics](#16-analytics)
17. [Build & Distribution](#17-build--distribution)
18. [Notable Patterns & Design Decisions](#18-notable-patterns--design-decisions)
19. [Current State — What's Done](#19-current-state--whats-done)
20. [Roadmap — Planned Features](#20-roadmap--planned-features)
21. [Quirks & Observations](#21-quirks--observations)

---

## 1. Project Overview

**Natively** is an AI-powered, cross-platform desktop meeting and interview copilot application (v2.0.6) built on Electron. It is developed by **Evin John** and published at `evinjohnn/natively-cluely-ai-assistant` on GitHub.

### What it does

At its core, Natively listens to both sides of a conversation — your microphone input and the system speaker output (i.e., both you and the person you're speaking with) — during meetings or technical interviews. It then:

- Performs real-time speech-to-text transcription using one of 8 pluggable STT providers.
- Feeds the live transcript into a multi-mode AI intelligence layer that generates contextual answers, suggestions, recaps, and follow-up questions on the fly.
- Persists transcripts, AI summaries, and action items to a local SQLite database.
- Indexes all meeting transcripts into a vector store for semantic RAG search across past meetings.
- Optionally disguises itself as a system utility (Terminal, Activity Monitor, etc.) to remain undetectable during screen sharing.

---

## 2. Folder & File Structure

```
c:\Development\Natively\
│
├── electron/                         ← Electron main-process TypeScript
│   ├── main.ts                       ← App entry point, AppState singleton, lifecycle
│   ├── ipcHandlers.ts                ← All IPC handlers (300+ channels), bridge to renderer
│   ├── preload.ts                    ← contextBridge API (window.electronAPI), 750+ lines
│   ├── WindowHelper.ts               ← Launcher/Overlay BrowserWindow management
│   ├── SettingsWindowHelper.ts       ← Settings popup window management
│   ├── ModelSelectorWindowHelper.ts  ← Model selector popup window
│   ├── ScreenshotHelper.ts           ← Screenshot capture utilities
│   ├── LLMHelper.ts                  ← Core LLM router: Gemini, Groq, OpenAI, Claude, Ollama, cURL
│   ├── ProcessingHelper.ts           ← Wraps LLMHelper for the processing pipeline
│   ├── IntelligenceManager.ts        ← Facade: delegates to Engine/Session/Persistence
│   ├── IntelligenceEngine.ts         ← 6 AI intelligence modes, LLM routing
│   ├── SessionTracker.ts             ← Real-time transcript state, context, epoch compaction
│   ├── MeetingPersistence.ts         ← Persist meeting to DB, background title/summary gen
│   ├── ThemeManager.ts               ← System/light/dark theme detection & broadcast
│   ├── DonationManager.ts            ← Controls donation toaster display logic
│   ├── natively-audio.d.ts           ← TypeScript types for native Rust addon
│   │
│   ├── audio/
│   │   ├── SystemAudioCapture.ts     ← Wraps Rust native module for speaker capture
│   │   ├── MicrophoneCapture.ts      ← Wraps Rust native module for mic capture
│   │   ├── AudioDevices.ts           ← Enumerate input/output audio devices
│   │   ├── GoogleSTT.ts              ← Google Cloud Speech-to-Text (gRPC streaming)
│   │   ├── RestSTT.ts                ← REST-based STT (Groq / Azure / IBM Watson)
│   │   ├── DeepgramStreamingSTT.ts   ← Deepgram WebSocket streaming
│   │   ├── SonioxStreamingSTT.ts     ← Soniox WebSocket streaming
│   │   ├── ElevenLabsStreamingSTT.ts ← ElevenLabs WebSocket streaming
│   │   └── OpenAIStreamingSTT.ts     ← OpenAI Realtime API (gpt-4o-transcribe + whisper fallback)
│   │
│   ├── db/
│   │   ├── DatabaseManager.ts        ← SQLite via better-sqlite3 + sqlite-vec extension
│   │   ├── seedDemo.ts               ← Demo meeting data seeding
│   │   └── test-db.ts                ← DB test utility
│   │
│   ├── llm/
│   │   ├── prompts.ts                ← All LLM system prompts (Assist, Answer, Recap, …)
│   │   ├── types.ts                  ← GeminiContent and LLM type definitions
│   │   ├── index.ts                  ← Exports + warmupIntentClassifier
│   │   ├── WhatToAnswerLLM.ts        ← Mode 2: infer question from transcript + answer
│   │   ├── AssistLLM.ts              ← Mode 1: passive observation analysis
│   │   ├── RecapLLM.ts               ← Mode 4: meeting summary
│   │   ├── FollowUpLLM.ts            ← Mode 3: refine/follow-up on last answer
│   │   ├── FollowUpQuestionsLLM.ts   ← Mode 6: suggest follow-up questions
│   │   ├── AnswerLLM.ts              ← Mode 5: manual question answering
│   │   ├── IntentClassifier.ts       ← Zero-shot intent classification (local Xenova ONNX)
│   │   ├── TemporalContextBuilder.ts ← Context window management for prompts
│   │   ├── transcriptCleaner.ts      ← Clean/normalize raw transcripts
│   │   └── postProcessor.ts          ← Post-process LLM output
│   │
│   ├── rag/
│   │   ├── RAGManager.ts             ← Central RAG orchestrator
│   │   ├── VectorStore.ts            ← SQLite + sqlite-vec vector storage/retrieval
│   │   ├── EmbeddingPipeline.ts      ← Async embedding queue + retry logic
│   │   ├── EmbeddingProviderResolver.ts ← Pick best available embedding provider (cascade)
│   │   ├── RAGRetriever.ts           ← Similarity search + context building
│   │   ├── LiveRAGIndexer.ts         ← JIT indexing during live meetings
│   │   ├── SemanticChunker.ts        ← Chunk transcripts by topic/speaker transition
│   │   ├── TranscriptPreprocessor.ts ← Normalize/clean raw transcript for RAG
│   │   ├── OllamaBootstrap.ts        ← Auto-pull Ollama embedding model (nomic-embed-text)
│   │   ├── prompts.ts                ← RAG-specific prompts
│   │   └── providers/
│   │       ├── IEmbeddingProvider.ts      ← Interface for all embedding providers
│   │       ├── OpenAIEmbeddingProvider.ts ← OpenAI text-embedding-3-* (1536d / 3072d)
│   │       ├── GeminiEmbeddingProvider.ts ← Google Gemini embeddings (768d)
│   │       ├── OllamaEmbeddingProvider.ts ← Ollama local (nomic-embed-text, 768d)
│   │       └── LocalEmbeddingProvider.ts  ← Bundled ONNX (all-MiniLM-L6-v2, 384d)
│   │
│   ├── services/
│   │   ├── CredentialsManager.ts     ← Encrypted API key storage (Electron safeStorage)
│   │   ├── SettingsManager.ts        ← Boot-critical settings (stealth mode, disguise)
│   │   ├── KeybindManager.ts         ← Global/local keyboard shortcut management
│   │   ├── OllamaManager.ts          ← Start/stop local Ollama process if not running
│   │   ├── CalendarManager.ts        ← Google Calendar OAuth + event fetching
│   │   ├── RateLimiter.ts            ← Per-provider API rate limiting (429 prevention)
│   │   ├── ModelVersionManager.ts    ← Dynamic model version discovery + fallback tiers
│   │   └── InstallPingManager.ts     ← One-time anonymous install analytics ping
│   │
│   ├── update/
│   │   └── ReleaseNotesManager.ts    ← Fetch GitHub release notes for update UI
│   │
│   ├── utils/
│   │   ├── modelFetcher.ts           ← Dynamically fetch available models from provider APIs
│   │   ├── emailUtils.ts             ← Follow-up email building / mailto link helpers
│   │   └── curlUtils.ts              ← Parse cURL commands into provider configs
│   │
│   ├── premium/
│   │   └── featureGate.ts            ← Backend premium gate utilities
│   │
│   └── config/
│       └── languages.ts              ← STT + AI response language lists
│
├── src/                              ← React renderer-process TypeScript (Vite)
│   ├── App.tsx                       ← Root: multi-window router (launcher/overlay/settings/model-selector)
│   ├── main.tsx                      ← ReactDOM entry, theme initialization
│   ├── index.css                     ← Global styles (Tailwind + custom)
│   │
│   ├── components/
│   │   ├── NativelyInterface.tsx     ← OVERLAY window: live assistant UI during meetings
│   │   ├── Launcher.tsx              ← LAUNCHER window: meeting list, start, search
│   │   ├── MeetingDetails.tsx        ← Past meeting detail view (transcript, summary, actions)
│   │   ├── MeetingChatOverlay.tsx    ← Chat interface embedded in meeting details
│   │   ├── GlobalChatOverlay.tsx     ← Cross-meeting RAG chat ("Ask across all meetings")
│   │   ├── SettingsPopup.tsx         ← Legacy settings popup
│   │   ├── SettingsOverlay.tsx       ← New settings overlay inside launcher
│   │   ├── ModelSelectorWindow.tsx   ← Floating model picker popup
│   │   ├── TopSearchPill.tsx         ← Search bar for meeting history
│   │   ├── SuggestionOverlay.tsx     ← In-meeting suggestion display
│   │   ├── StartupSequence.tsx       ← Animated app boot screen
│   │   ├── UpdateBanner.tsx          ← In-app update notification
│   │   ├── UpdateModal.tsx           ← Update install confirmation
│   │   ├── FollowUpEmailModal.tsx    ← Generate and send follow-up email
│   │   ├── FeatureSpotlight.tsx      ← Contextual feature discovery tooltips
│   │   ├── SupportToaster.tsx        ← Donation/support nudge
│   │   ├── AboutSection.tsx          ← About page
│   │   ├── ErrorBoundary.tsx         ← React error boundary
│   │   ├── EditableTextBlock.tsx     ← In-place editable text UI
│   │   │
│   │   ├── ui/
│   │   │   ├── TopPill.tsx           ← Status pill at top of overlay
│   │   │   ├── RollingTranscript.tsx ← Animated live transcript display
│   │   │   ├── ModelSelector.tsx     ← Model picker dropdown
│   │   │   ├── KeyRecorder.tsx       ← Keyboard shortcut recorder widget
│   │   │   ├── ConnectCalendarButton.tsx ← Google Calendar connect button
│   │   │   ├── dialog.tsx            ← Radix UI dialog wrapper
│   │   │   └── toast.tsx             ← Radix UI toast wrapper
│   │   │
│   │   ├── settings/
│   │   │   ├── GeneralSettings.tsx   ← General preferences tab
│   │   │   ├── AIProvidersSettings.tsx ← API key management + provider config
│   │   │   ├── ProviderCard.tsx      ← Per-provider config card
│   │   │   └── Sidebar.tsx           ← Settings sidebar navigation
│   │   │
│   │   ├── Queue/                    ← Screenshot queue UI (legacy coding copilot)
│   │   └── Solutions/                ← Solution panel (legacy coding copilot)
│   │
│   ├── _pages/
│   │   ├── Solutions.tsx             ← Legacy coding problem solutions page
│   │   ├── Queue.tsx                 ← Legacy screenshot queue page
│   │   └── Debug.tsx                 ← Debug tools page
│   │
│   ├── hooks/
│   │   ├── useShortcuts.ts           ← Listen to electron keybind IPC events
│   │   └── useStreamBuffer.ts        ← Buffer streaming LLM tokens
│   │
│   ├── lib/
│   │   ├── utils.ts                  ← cn() tailwind class merger
│   │   ├── featureFlags.ts           ← PREMIUM_ENABLED compile-time flag
│   │   ├── curl-validator.ts         ← Validate cURL command syntax
│   │   └── analytics/
│   │       └── analytics.service.ts  ← GA4 analytics (gtag.js injected in renderer)
│   │
│   ├── utils/
│   │   ├── pdfGenerator.ts           ← jsPDF-based meeting PDF export
│   │   ├── modelUtils.ts             ← Model ID parsing/labeling utilities
│   │   └── keyboardUtils.ts          ← Keyboard event helpers
│   │
│   └── premium/
│       └── index.tsx                 ← Premium component loader (import.meta.glob with fallbacks)
│
├── native-module/                    ← Rust NAPI addon (natively-audio)
│   ├── Cargo.toml                    ← Rust dependencies
│   ├── src/
│   │   ├── lib.rs                    ← Exported NAPI structs: SystemAudioCapture, MicrophoneCapture
│   │   ├── speaker/                  ← Platform-specific system audio capture
│   │   │   ├── mod.rs                ← SpeakerInput abstraction
│   │   │   ├── macos.rs              ← CoreAudio tap
│   │   │   ├── macos_sck.rs          ← ScreenCaptureKit (experimental)
│   │   │   ├── windows.rs            ← WASAPI loopback capture
│   │   │   └── core_audio.rs         ← macOS CoreAudio implementation
│   │   ├── microphone.rs             ← CPAL microphone input
│   │   ├── silence_suppression.rs    ← Two-stage VAD gate (energy + WebRTC VAD)
│   │   ├── resampler.rs              ← Rubato resampler (native rate → 16kHz)
│   │   ├── vad.rs                    ← WebRTC VAD wrapper
│   │   ├── audio_config.rs           ← DSP constants (poll rate, chunk sizes)
│   │   └── license.rs                ← Hardware ID + license check utilities
│   └── index.js / index.d.ts         ← NAPI JS bindings
│
├── resources/models/                 ← Bundled ONNX models for offline inference
│   └── Xenova/
│       ├── all-MiniLM-L6-v2/         ← 384-dim sentence embedding model (RAG fallback)
│       └── mobilebert-uncased-mnli/  ← Zero-shot intent classifier (NLI)
│
├── scripts/
│   ├── build-native.js               ← Build the Rust NAPI module for target platform
│   ├── download-models.js            ← Download Xenova models at postinstall
│   ├── ensure-sqlite-vec.js          ← Verify sqlite-vec extension is present
│   ├── VectorStoreRebuild.js         ← CLI: rebuild vector index from scratch
│   ├── raw-to-wav.js                 ← Convert raw PCM to WAV (debug)
│   └── ad-hoc-sign.js                ← Post-pack macOS ad-hoc code signing
│
├── worker-script/node/index.js       ← Node.js worker for off-thread vector search
├── renderer/                         ← Legacy CRA renderer (unused stub)
├── index.html                        ← Vite HTML entry point
├── package.json                      ← Root package manifest
├── pnpm-lock.yaml
├── vite.config.mts                   ← Vite config (React plugin, port 5180)
├── tailwind.config.js
├── tsconfig.json                     ← Root TS config (renderer)
├── tsconfig.node.json                ← Vite/Node TS config
├── electron/tsconfig.json            ← Electron main-process TS config
├── ROADMAP.md
├── release-notes-2.0.6.md
├── test-worker.js                    ← Ad-hoc worker thread test
├── test-vec.js                       ← Ad-hoc sqlite-vec test
├── fix_profile.py                    ← One-off Python DB repair script
└── generate_icon.js                  ← Icon generation utility
```

---

## 3. Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron 33 |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend (main process) | TypeScript (compiled to `dist-electron/`) |
| Native audio addon | Rust (NAPI-RS), compiled to platform `.node` binary |
| Database | SQLite via `better-sqlite3` + `sqlite-vec` extension |
| UI animations | Framer Motion |
| Markdown + math | react-markdown, remark-gfm, remark-math, rehype-katex, KaTeX |
| Syntax highlighting | react-syntax-highlighter (Prism) |
| Package manager | npm (pnpm lock file) |
| Build / distribution | electron-builder (Mac dmg/zip, Win nsis/portable, Linux AppImage/deb) |

### Window Architecture

There are **4 distinct Electron `BrowserWindow` instances**, all serving the same React bundle (routed by URL query params):

| Window | URL param | Purpose |
|---|---|---|
| **Launcher** | `?window=launcher` (default) | Meeting list, start session, search, settings |
| **Overlay** | `?window=overlay` | Live assistant UI during an active meeting |
| **Settings** | `?window=settings` | Full settings popup |
| **Model Selector** | `?window=model-selector` | Floating model picker popup |

`App.tsx` reads `window.location.search` and renders the corresponding component tree. All windows communicate bidirectionally through the Electron IPC bridge.

### IPC Bridge

The `preload.ts` script (750+ lines) exposes a rich `window.electronAPI` object via `contextBridge`. It wraps 100+ IPC channels covering:

- Meeting lifecycle (`start-meeting`, `end-meeting`)
- LLM/AI operations (`gemini-chat-stream`, `generate-what-to-say`, `generate-recap`, etc.)
- STT configuration (8 providers)
- RAG operations (`rag:query-meeting`, `rag:query-global`, etc.)
- Settings, credentials, keybinds, window management
- Calendar integration (Google OAuth)
- Premium / license management

---

## 4. Dependencies

### Key Runtime Dependencies

| Package | Purpose |
|---|---|
| `@anthropic-ai/sdk` | Claude (Anthropic) LLM |
| `@google/genai` | Gemini LLM + embeddings |
| `groq-sdk` | Groq LLM (Llama 3.3 70B) |
| `openai` | OpenAI GPT + Whisper |
| `@google-cloud/speech` | Google Cloud Speech-to-Text streaming (gRPC) |
| `@elevenlabs/client` | ElevenLabs STT WebSocket streaming |
| `@xenova/transformers` | Local ONNX inference (sentence embeddings, intent classification) |
| `better-sqlite3` | SQLite database (synchronous) |
| `sqlite-vec` | SQLite vector search extension for RAG |
| `electron-store` | Electron KV store (settings) |
| `electron-updater` | Auto-update via GitHub releases |
| `keytar` | OS keychain for secure credential storage |
| `framer-motion` | UI animations |
| `react-markdown` + remark/rehype | Markdown + LaTeX rendering |
| `react-syntax-highlighter` | Code block syntax highlighting |
| `screenshot-desktop` | System-level screenshot capture |
| `sharp` | Image processing/resizing for screenshots |
| `tesseract.js` | OCR (text extraction from screenshots) |
| `jspdf` | PDF export of meeting notes |
| `mammoth` | DOCX file parsing (resume upload) |
| `pdf-parse` | PDF file parsing (resume/JD upload) |
| `three` + `@types/three` | 3D graphics (system design visualization, upcoming) |
| `ws` | WebSocket client (Deepgram/Soniox/ElevenLabs STT) |
| `axios` | HTTP client |
| `uuid` | UUID generation for meeting IDs |
| `diff` | Text diffing utility |
| `@bany/curl-to-json` | Parse cURL commands into JSON for custom LLM providers |
| `react-query` | Server state management |
| `@radix-ui/react-dialog` + `@radix-ui/react-toast` | Accessible UI primitives |
| `tree-kill` | Kill Ollama process tree on quit |
| `natively-audio` (file: `./native-module`) | Custom Rust NAPI addon for audio capture |

### Rust Dependencies (native-module)

| Crate | Purpose |
|---|---|
| `napi` + `napi-derive` | Node.js native addon bindings |
| `cpal` | Cross-platform audio I/O (microphone) |
| `ringbuf` | Lock-free ring buffer for audio streaming |
| `rubato` | Audio resampling (device rate → 16kHz for STT) |
| `webrtc-vad` | WebRTC Voice Activity Detection |
| `cidre` (macOS only) | CoreAudio + ScreenCaptureKit bindings |
| `wasapi` + `windows` (Windows only) | WASAPI loopback capture |
| `sha2` + `machine-uid` | Hardware fingerprinting for license validation |
| `reqwest` | HTTP client for license API calls |

---

## 5. Data Flow — Meeting Lifecycle

```
User clicks "Start Meeting"
  → App.tsx: handleStartMeeting()
    → window.electronAPI.startMeeting({ audio: { inputDeviceId, outputDeviceId } })
    → IPC: "start-meeting" → AppState.startMeeting()
      → reconfigureAudio()
          Creates SystemAudioCapture + MicrophoneCapture (Rust NAPI wrappers)
      → setupSystemAudioPipeline()
          Instantiates STT providers for each speaker role (system + mic)
      → systemAudioCapture.start()   ← Rust DSP thread starts, capturing speaker output
      → microphoneCapture.start()    ← Rust DSP thread starts, capturing mic input
      → googleSTT.start() (or other provider) ← STT streaming opens
      → ragManager.startLiveIndexing('live-meeting-current') ← JIT RAG starts
    → window.electronAPI.setWindowMode('overlay') → Overlay window shown

Audio flow (continuous, per-frame at ~20ms intervals):
  Rust (SystemAudioCapture) → PCM f32 → silence gate → VAD → i16 buffer → JS via NAPI TSFN
  Rust (MicrophoneCapture)  → PCM f32 → silence gate → VAD → i16 buffer → JS via NAPI TSFN
  
  STT provider receives PCM → emits 'transcript' events → AppState listener
    → intelligenceManager.handleTranscript({ speaker, text, final, … })
        → SessionTracker: stores segments, manages rolling context window
        → IntelligenceEngine: triggers AI mode based on timing/content/intent
    → If final: ragManager.feedLiveTranscript() ← chunk + embed JIT
    → Broadcast 'native-audio-transcript' IPC → Overlay + Launcher windows

  Overlay: RollingTranscript UI component animates the incoming text

User clicks "End Meeting"
  → window.electronAPI.endMeeting()
  → IPC: "end-meeting" → AppState.endMeeting()
    → systemAudioCapture.stop(), googleSTT.stop(), etc.
    → ragManager.stopLiveIndexing() ← flush remaining JIT index
    → intelligenceManager.stopMeeting()
        → MeetingPersistence.stopMeeting()
            → Snapshot transcript + token usage
            → SessionTracker.reset()
            → Background LLM call: generate title + detailed JSON summary
            → DatabaseManager.saveMeeting() ← persist to SQLite
            → Broadcast 'meetings-updated' to all windows
    → processCompletedMeetingForRAG()
        → Full reprocessing: preprocess → chunk → embed → store in vec tables
    → ragManager.deleteMeetingData('live-meeting-current') ← clean JIT bucket
    → Revert LLM model to default
  → window.electronAPI.setWindowMode('launcher') → Back to launcher
```

---

## 6. Intelligence Engine (6 AI Modes)

`IntelligenceEngine` routes to a dedicated LLM class for each mode. All modes stream tokens back to the Overlay window.

| # | Mode | Trigger | What it does |
|---|---|---|---|
| 1 | **Assist** (passive) | Manual or auto when context accumulates | Passive observation; generates contextual insight without a direct question |
| 2 | **What Should I Say** | Manual (Cmd+1) or auto-detected question | Infers the question from transcript; generates the best answer |
| 3 | **Follow-Up** | After mode 2, based on intent classifier | Refines the last answer: shorten, elaborate, rephrase, etc. |
| 4 | **Recap** | Manual (Cmd+4) | Summarizes the meeting so far in structured form |
| 5 | **Manual Answer** | Cmd+5 or mic button | User speaks a question; AI answers it directly |
| 6 | **Follow-Up Questions** | Manual | Suggests good follow-up questions to ask the interviewer |

`SessionTracker` manages the context window with **epoch compaction**: for long meetings, past transcript segments are summarized into epoch summaries to avoid LLM context overflow.

`IntentClassifier.ts` uses the bundled `mobilebert-uncased-mnli` ONNX model (via `@xenova/transformers`) to perform zero-shot NLI intent classification locally — no API calls. This classifier is pre-warmed at app startup.

---

## 7. RAG Pipeline

### Post-Meeting Indexing

```
Meeting ends → processCompletedMeetingForRAG()
  → TranscriptPreprocessor: normalize segments (fill speaker, clean text)
  → SemanticChunker: split into semantic chunks by topic/speaker transitions
  → VectorStore: store chunk text + metadata in SQLite
  → EmbeddingPipeline: async queue
      → Provider cascade: OpenAI → Gemini → Ollama → LocalEmbeddingProvider
      → sqlite-vec virtual tables store vectors per chunk
```

### Live JIT Indexing (during a meeting)

```
Final transcript segment → LiveRAGIndexer.feed()
  → Accumulate segments → chunk → embed → store in 'live-meeting-current' bucket
  → Available for semantic search immediately (real-time)
```

### Query Flow

```
User query in MeetingChatOverlay or GlobalChatOverlay
  → IPC: "rag:query-meeting" or "rag:query-global"
  → RAGRetriever.retrieve(query)
      → EmbeddingPipeline.getEmbeddingForQuery(query)
      → VectorStore.search() ← cosine similarity via sqlite-vec (or JS fallback)
      → Return top-K relevant chunks
  → buildRAGPrompt(query, chunks, transcript) ← grounded prompt
  → LLMHelper.streamChat() ← stream response
  → IPC events: "rag:stream-chunk", "rag:stream-complete" → UI
```

### Embedding Provider Cascade

| Priority | Provider | Model | Dimensions |
|---|---|---|---|
| 1 | OpenAI | `text-embedding-3-small` / `text-embedding-3-large` | 1536d / 3072d |
| 2 | Gemini | embedding model | 768d |
| 3 | Ollama | `nomic-embed-text` (auto-pulled via OllamaBootstrap) | 768d |
| 4 | Local (always available) | `all-MiniLM-L6-v2` ONNX | 384d |

Because providers produce different dimensions, `VectorStore` maintains **four separate virtual vector tables** (`vec_chunks_384`, `vec_chunks_768`, `vec_chunks_1536`, `vec_chunks_3072`). This allows switching embedding providers without invalidating existing embeddings.

---

## 8. LLM Routing

`LLMHelper` is the central LLM router. It supports 6 providers with tiered fallback via `ModelVersionManager`:

| Provider | Default Models | Notes |
|---|---|---|
| **Gemini** | `gemini-3.1-flash-lite-preview`, `gemini-3.1-pro-preview` | Default provider at startup |
| **Groq** | `llama-3.3-70b-versatile`, `meta-llama/llama-4-scout-17b-16e-instruct` (vision) | Very fast inference |
| **OpenAI** | `gpt-5.4-chat`, `gpt-5.3-chat-latest` | Latest frontier models |
| **Claude** | `claude-sonnet-4-6` | Anthropic SDK |
| **Ollama** | User-selected from local instance | Local inference, no API key |
| **cURL Custom** | Any OpenAI-compatible endpoint | Defined by pasting a cURL command |

`RateLimiter` per provider prevents 429 errors on free-tier APIs. If a model API returns a deprecation or availability error, `ModelVersionManager` automatically falls back to the next tier in the priority list.

---

## 9. Speech-to-Text Providers

| Provider | Protocol | Notes |
|---|---|---|
| **Google** | gRPC streaming | Service account JSON key required |
| **Deepgram** | WebSocket (`nova-3` model) | API key required |
| **Soniox** | WebSocket (`stt-rt-v4`) | API key required |
| **ElevenLabs** | WebSocket | API key required |
| **OpenAI** | WebSocket Realtime API | Cascade: `gpt-4o-transcribe` → `gpt-4o-mini-transcribe` → `whisper-1` REST; includes ring-buffer, zombie-session timeout, dark-drop timeout |
| **Groq** | REST | `whisper-large-v3-turbo`; batched chunks |
| **Azure** | REST | Cognitive Services; API key + region |
| **IBM Watson** | REST | API key + region |

All providers share a common EventEmitter interface with `'transcript'` and `'error'` events, and implement `setSampleRate()`, `setRecognitionLanguage()`, `start()`, `stop()`. The `createSTTProvider()` factory in `main.ts` instantiates the correct class based on `CredentialsManager.getSttProvider()`.

---

## 10. Native Rust Audio Module

`native-module/` is a Rust NAPI addon (`natively-audio`) that exports two structs to JavaScript:

### `SystemAudioCapture`
Captures system speaker output (what plays through headphones/speakers):
- **macOS**: CoreAudio tap (`macos.rs`) or ScreenCaptureKit experimental (`macos_sck.rs`)
- **Windows**: WASAPI loopback capture (`windows.rs`)

### `MicrophoneCapture`
Captures microphone input via CPAL (`microphone.rs`), which works cross-platform.

### DSP Pipeline (runs in a dedicated Rust background thread)
1. Drain lock-free ring buffer of raw `f32` samples
2. Convert `f32 → i16` (PCM linear 16)
3. Process 20ms frames through a **two-stage silence gate**:
   - **Stage 1**: RMS energy gate (suppress frames below energy threshold)
   - **Stage 2**: WebRTC VAD (`webrtc-vad` crate, mode 3 for aggressive suppression)
4. Emit `FrameAction::Send(data)` to JS via NAPI Thread-Safe Function (zero-copy `napi::Buffer`)
5. On speech-end, fire optional `on_speech_ended` callback

Also exported: `get_input_devices()`, `get_output_devices()` for device enumeration.

Audio is delivered at the **native device sample rate** — no resampling in Rust. Each TypeScript STT wrapper configures its streaming with the actual device rate.

---

## 11. Database Schema

SQLite database at `userData/natively.db`:

| Table | Description |
|---|---|
| `meetings` | `id`, `title`, `date`, `duration`, `summary`, `detailedSummary` (JSON), `transcript` (JSON), `usage` (JSON), `calendarEventId`, `source`, `isProcessed` |
| `vec_chunks_384` | sqlite-vec virtual table: text chunks + 384-dim vectors (local ONNX provider) |
| `vec_chunks_768` | sqlite-vec virtual table: 768-dim vectors (Gemini / Ollama providers) |
| `vec_chunks_1536` | sqlite-vec virtual table: 1536-dim vectors (OpenAI text-embedding-3-small) |
| `vec_chunks_3072` | sqlite-vec virtual table: 3072-dim vectors (OpenAI text-embedding-3-large) |
| `embedding_queue` | Async embedding queue with retry support and provider tracking |
| `app_state` | KV store (e.g., `last_embedding_provider` for detecting provider switches) |

---

## 12. Key Managers & Services

| Manager | Pattern | Responsibility |
|---|---|---|
| `AppState` | Singleton | Central coordinator for all subsystems |
| `DatabaseManager` | Singleton | SQLite operations (meetings, transcripts, embeddings) |
| `CredentialsManager` | Singleton | Encrypted API key storage via `electron.safeStorage` |
| `SettingsManager` | Singleton | Boot-critical settings (stealth mode, disguise) via JSON file |
| `KeybindManager` | Singleton | Global + local keyboard shortcuts, persisted to `keybinds.json` |
| `OllamaManager` | Singleton | Auto-start Ollama if not running; kill on app quit via `tree-kill` |
| `CalendarManager` | Singleton (EventEmitter) | Google OAuth 2.0, calendar event monitoring, auto-start meeting |
| `ThemeManager` | Singleton | System/light/dark theme detection; broadcasts on change |
| `ReleaseNotesManager` | Singleton | Fetch + parse GitHub release notes for update modal |
| `DonationManager` | Singleton | Frequency-capped donation toaster with persistent state |
| `InstallPingManager` | One-shot | Anonymous first-install ping to analytics |
| `RateLimiter` | Per-provider | Prevent 429s on free-tier LLM APIs |
| `ModelVersionManager` | Singleton | Tiered fallback for model versions; auto-discovers available models |

---

## 13. Stealth / Undetectable Mode

When enabled via settings, the app:

- `app.dock.hide()` on macOS — removes Dock icon
- `app.setContentProtection(true)` — prevents window from appearing in screen recordings / screenshots
- Hides system tray icon
- Changes app name and icon to disguise as a system utility:

| Platform | Disguise Options |
|---|---|
| macOS | Terminal, System Settings, Activity Monitor |
| Windows | Command Prompt, Settings, Task Manager |

- All state persists across reboots via `SettingsManager` (written to `userData/settings.json`)
- A `_disguiseTimers` array tracks all `setTimeout` handles for the disguise name refresh, cleared when toggled — fixing a prior timer-leak bug documented in v2.0.6 release notes

---

## 14. Premium / Pro System

A two-tier freemium model:

**Free tier**: Core meeting transcription, basic AI assistance, meeting history, RAG semantic search.

**Pro tier** (license key via `LicenseManager`):
- **Profile Intelligence**: Upload a resume (PDF/DOCX/TXT) for personalized interview answers
- **Job Description (JD) upload and analysis**
- **Company research dossier generation** (Google Custom Search + LLM synthesis)
- **Negotiation script generation**
- **Ad campaign targeting** based on profile/JD

The premium module is conditionally loaded as a separate directory:
- **Backend**: `KnowledgeOrchestratorClass` and `KnowledgeDatabaseManagerClass` are `require()`d inside `try/catch` in `main.ts`. If the `premium/` folder is absent, they are `null` and the features silently disable.
- **Frontend**: `src/premium/index.tsx` uses Vite's `import.meta.glob()` to optionally load premium React components. Absent components fall back to null stubs.

This architecture allows the project to be published open-source without exposing premium logic.

A **token/blockchain-based Pro access** system is also planned (hold a token = free Pro access) — currently in the research phase (see Roadmap).

---

## 15. Google Calendar Integration

OAuth 2.0 loopback flow:
1. App opens a system browser pointing to Google OAuth consent screen
2. Google redirects to `localhost:11111` with auth code
3. `CalendarManager` exchanges code for access + refresh tokens
4. Tokens stored encrypted at `userData/calendar_tokens.enc` via `electron.safeStorage`
5. Polls upcoming calendar events every N minutes (read-only scope)
6. When an upcoming event starts → native notification fires → offers to auto-start a meeting session with the event's metadata

**Note**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `CalendarManager.ts` default to `"YOUR_CLIENT_ID_HERE"`. Calendar features require valid OAuth credentials passed via environment variables.

---

## 16. Analytics

Uses **Google Analytics 4 (GA4)** via `gtag.js` dynamically injected into the Electron renderer DOM. Measurement ID: `G-494RMJ2G6E`.

Events tracked include:
- `app_opened`, `app_closed`, `session_duration`
- `meeting_started`, `meeting_ended`
- `assistant_started`, `assistant_stopped`
- `mode_selected`, `copy_answer_clicked`, `pdf_exported`
- `calendar_connected`
- `model_used` (model name, provider, latency)
- `command_executed`, `conversation_started`

---

## 17. Build & Distribution

### Development

```bash
npm run start
# Runs Vite dev server on port 5180 + Electron in dev mode concurrently
```

### Production Build

```bash
npm run dist
# 1. Vite builds React to dist/
# 2. TypeScript compiles Electron to dist-electron/
# 3. electron-builder packages everything
```

### Targets

| Platform | Format |
|---|---|
| macOS (Intel x64) | `.dmg` + `.zip` |
| macOS (Apple Silicon arm64) | `.dmg` + `.zip` |
| Windows x64 | `.nsis` installer + `.portable` |
| Windows ia32 | `.nsis` installer + `.portable` |
| Linux x64 | `.AppImage` + `.deb` |

### Distribution

Auto-update via `electron-updater` pointing to GitHub releases (`evinjohnn/natively-cluely-ai-assistant`). The app is currently **unsigned** on both macOS and Windows, requiring users to bypass OS security warnings (macOS: `xattr -cr`, Windows: "Run anyway").

---

## 18. Notable Patterns & Design Decisions

1. **Lazy audio initialization**: The audio pipeline starts only when a meeting begins — not at boot. This prevents a 5–7 second audio quality drop at launch caused by ScreenCaptureKit initialization latency.

2. **Async meeting start**: `startMeeting()` returns immediately to the renderer (so the UI switches to overlay instantly), then performs audio initialization in a `setTimeout(0)` deferred tick.

3. **Zero-copy audio streaming**: The Rust addon sends PCM as `napi::Buffer` (zero-copy `Uint8Array`) through NAPI Thread-Safe Functions to avoid V8 heap allocation overhead in the audio hot path.

4. **Credential scrubbing on quit**: On `before-quit`, all API keys are zeroed out in memory via `CredentialsManager.scrubMemory()` and `LLMHelper.scrubKeys()`.

5. **Atomic file writes**: Settings and credential files use atomic write patterns to prevent corruption on sudden exit (a fix documented in v2.0.6 release notes).

6. **JIT RAG indexing**: Transcripts are embedded in real time during a meeting (stored in the `live-meeting-current` bucket) so users can query the ongoing meeting before it ends. Post-meeting, a full-quality reprocessing replaces the JIT data.

7. **Multi-dimension vector tables**: Because different embedding providers produce different vector dimensions (384 / 768 / 1536 / 3072), four separate sqlite-vec virtual tables exist. Switching providers never invalidates old embeddings.

8. **Premium as optional module**: The premium subsystem is a separate directory loaded via `try/catch` (backend) and `import.meta.glob` (frontend), making the core codebase publishable open-source without premium logic.

9. **Local intent classification**: `IntentClassifier.ts` uses the bundled `mobilebert-uncased-mnli` ONNX model via `@xenova/transformers` for zero-shot NLI classification — no API call needed. Pre-warmed at startup to avoid cold-start latency during the first triggered mode.

10. **Epoch compaction in SessionTracker**: For long meetings, past transcript segments are periodically compacted into epoch summaries. These summaries replace raw segments in the LLM context window, preventing overflow while preserving semantic continuity.

11. **Disguise timer leak prevention**: `_disguiseTimers` tracks all scheduled `setTimeout` handles for the disguise name refresh cycle. They are explicitly cleared when stealth mode is toggled or when a new disguise target is selected, preventing a timer accumulation bug that was present before v2.0.6.

---

## 19. Current State — What's Done

**Fully implemented and shipped in v2.0.6:**

- Complete meeting recording lifecycle (start → transcribe → end → save → AI summary)
- 6 intelligence modes (Assist, WhatToSay, FollowUp, Recap, ManualAnswer, FollowUpQuestions)
- 8 STT providers (Google, Deepgram, Soniox, ElevenLabs, OpenAI Realtime, Groq, Azure, IBM Watson)
- 4 LLM providers (Gemini, Groq, OpenAI, Claude) + Ollama local + cURL custom
- Full RAG pipeline (post-meeting + live JIT indexing; per-meeting and global cross-meeting chat)
- Premium Profile Intelligence (resume upload, JD upload, company research, negotiation scripts)
- Stealth / undetectable mode with app disguise
- Google Calendar integration (OAuth, event monitoring, auto-start meeting)
- Follow-up email generation
- Meeting PDF export
- Screenshot capture + multimodal analysis (Groq Llama 4 Scout vision model)
- Customizable global keyboard shortcuts
- Auto-updater (GitHub releases via electron-updater)
- Dark / light / system theme
- Analytics (GA4)
- Dynamic model discovery (fetch available models live from each provider's API)
- Bundled local ONNX models for offline fallback (embeddings + intent classification)

---

## 20. Roadmap — Planned Features

From `ROADMAP.md` (last updated March 2026):

### System Design Visualization Engine (High Priority)
- AI-powered diagram generation from meeting discussions
- Architecture diagrams, flowcharts, sequence diagrams, state machines
- Export: SVG, PNG, Mermaid
- Libraries considered: D3.js, Mermaid, custom renderer
- The presence of `three` + `@types/three` as runtime dependencies suggests 3D visualization work has been explored

### Persona System (Medium Priority)
- Switchable AI personas: Software Engineer, HR Professional, PM, Sales Rep, Executive, Designer, Data Analyst
- Persona-specific question suggestions, summary formats, domain terminology
- Custom RAG retrieval strategies per persona

### Natively Token & Pro Access (Medium-High Priority)
- Blockchain token-based Pro access (hold token = free Pro)
- Wallet connection flow, token balance monitoring
- Currently in research / proof-of-concept phase

### Short-term (1–3 months)
- [ ] System design visualization MVP
- [ ] Basic persona system (3–5 personas)
- [ ] Token integration research and PoC

### Medium-term (3–6 months)
- [ ] Full persona library
- [ ] Advanced diagram types
- [ ] Token holder community features
- [ ] Mobile app development

### Long-term (6+ months)
- [ ] Collaborative features
- [ ] Plugin ecosystem
- [ ] Multi-language support

---

## 21. Quirks & Observations

- **Legacy `renderer/` directory**: Contains an unused Create React App stub (`renderer/src/App.tsx`, `renderer/package.json` with `react-scripts`). The project appears to have been migrated from CRA to Vite at some point, but the CRA directory was left in place.

- **`fix_profile.py`**: A one-off Python script in the root, suggesting a manual database or profile repair was needed at some point during development.

- **`test-worker.js` and `test-vec.js`**: Ad-hoc test scripts left in the root directory. No formal test framework is configured — no Jest, no Vitest. The `tap` package is listed as a dependency but no `.test.` files are visible.

- **Cutting-edge model IDs**: The IPC handlers reference `gpt-5.4-chat`, `gpt-5.3-chat-latest`, `gemini-3.1-flash-lite-preview`, `gemini-3.1-pro-preview`, `meta-llama/llama-4-scout-17b-16e-instruct` — indicating the project actively tracks the latest frontier models as they release.

- **`window.electronAPI` size**: At 750+ lines, the preload script has grown organically into a large, feature-rich bridge. It would benefit from modular organization if the project scales further.

- **No automated tests**: Given the complexity of the audio pipeline, LLM routing, and RAG system, the absence of unit or integration tests is a risk. The ad-hoc scripts (`test-worker.js`, `test-vec.js`) partially compensate but are not part of a CI pipeline.

- **Calendar OAuth credentials**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are placeholder strings in the source. Out-of-the-box Calendar integration requires the developer or user to supply real OAuth credentials via environment variables.

- **`DonationManager`**: The app includes a first-party donation nudge system for non-Pro users, with frequency capping and persistent state. This coexists with the Pro license system as an alternative monetization path.

- **`SessionTracker` → `MeetingPersistence` boundary**: The `IntelligenceManager` acts as a facade that coordinates `SessionTracker` (live state), `IntelligenceEngine` (AI modes), and `MeetingPersistence` (durability). This separation of concerns is well-thought-out but adds indirection that can make tracing a single event across all three layers non-trivial.

- **`three.js` as a runtime dep**: Three.js is listed as a runtime dependency (not devDependency), yet there is no current usage of it in the codebase. This is almost certainly an early placeholder for the System Design Visualization Engine on the roadmap.
