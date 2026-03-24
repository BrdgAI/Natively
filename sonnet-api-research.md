# API Research: LLM + STT — 1-Hour Interview Readiness

**Date:** March 23, 2026

---

## Critical Fixes (Do These Before the Interview)

| # | Issue | Severity | Where | Fix |
|---|-------|----------|-------|-----|
| 1 | Groq RateLimiter hardcoded to **6 req/min** (free tier) | 🔴 | `RateLimiter.ts` | Change to `RateLimiter(30, 0.5)` |
| 2 | `MAX_OUTPUT_TOKENS = 65536` exceeds Groq's hard cap of **32,768** | 🔴 | `LLMHelper.ts` | Cap Groq paths at `32000` |
| 3 | Gemini Flash has ongoing **503 overload** issues in prod | 🔴 | Settings | Don't use as primary |
| 4 | **Groq Llama 3.3 70B is insufficient for hard coding problems** | 🔴 | Settings | Use Claude as primary for coding phases — see below |
| 5 | `isGroqModel()` won't route `meta-llama/llama-4-*` correctly | 🟠 | `LLMHelper.ts` | Add `meta-llama/` prefix check |
| 6 | Deepgram missing `endpointing` + `utterance_end_ms` | 🟡 | `DeepgramStreamingSTT.ts` | Add both params |
| 7 | Interview transcript window is only **24 segments** | 🟡 | `InterviewMemoryLedger.ts` | Increase to 40 |

---

## Model Reasoning Capability for Hard Coding Questions

This is the most important section for the interview.

Google-style custom questions are typically medium–hard algorithmic problems: graph traversal, DP, tree manipulation, greedy with proof, two-pointer/sliding window variants. They require the model to:
- Identify the problem class and optimal strategy
- Reason about time/space complexity
- Produce working, edge-case-safe code
- Explain the approach clearly mid-conversation

### Model Comparison for Hard Coding

| Model | Speed | Hard Coding Reasoning | SWE-Bench | Verdict |
|-------|-------|----------------------|-----------|---------|
| `llama-3.3-70b-versatile` (Groq) | 280 t/s, 140ms TTFT | **Medium** — handles medium problems well, hard DP/graph hit-or-miss | Not ranked | Fast but not reliable for hard |
| `claude-sonnet-4-6` | ~80–120 t/s | **Excellent** — top-tier algorithm reasoning | **77.2%** | Best for coding phases |
| `gpt-5.4` | ~100 t/s | **Excellent** | ~74.9% | Comparable to Claude |
| `meta-llama/llama-4-maverick` (Groq) | 600 t/s | **Medium-Good** — faster MoE, better than 70B on some tasks | Not ranked | Speed option, not for hard |

**Bottom line: Llama 3.3 70B will struggle on hard problems.** It's a great model for speed and general Q&A, but it's not a frontier reasoning model. Claude Sonnet and GPT-5.4 are purpose-built for complex code generation and are objectively better on algorithmic problem-solving benchmarks.

### Recommended: Phase-Aware Model Selection

Use the fastest model where it's "good enough", and the strongest model where it counts.

| Phase | Ideal Model | Reason |
|-------|------------|--------|
| **p2 — Clarification** | Groq Llama 3.3 70B | Fast, simple reasoning, no complex code needed |
| **p3 — Approach** | **Claude Sonnet** | Needs strong algorithmic reasoning, approach correctness matters |
| **p4 — Coding** | **Claude Sonnet** | Must produce correct, optimized code — this is the critical phase |
| **p5 — Testing** | **Claude Sonnet** | Edge case reasoning, complexity analysis |
| **p6 — Follow-up** | Groq or Claude | Depends on whether it's a code change or a quick answer |

The app currently routes all interview phases through the same model. If you can set primary to Claude, it covers all phases. Groq stays as the fast-text fallback path.

**If you only do one thing: set the primary interview model to `claude-sonnet-4-6`, not Groq.**

---

## STT: Deepgram Nova-3

Already on the right model. Nova-3 is the best available.

| Metric | Value |
|--------|-------|
| WER (clean English audio) | ~3–5% |
| Latency (TTFT) | 200–300ms |
| 1-hour cost | ~$0.26 |

**Current URL missing two important params:**
```
&endpointing=300        ← detects speaker pauses (300ms good for interview speech)
&utterance_end_ms=1000  ← fires UtteranceEnd after 1s silence to confirm full sentence
```

Also reduce `RECONNECT_MAX_DELAY_MS` from 30000 → 8000. A 30s reconnect gap during an interview is unacceptable.

---

## LLM Stack: Groq

### Model Specs

| Model | Context | Max Output | Speed | Notes |
|-------|---------|-----------|-------|-------|
| `llama-3.3-70b-versatile` | 131K | 32,768 | 280 t/s | Current default — good for fast phases |
| `meta-llama/llama-4-scout-17b-16e-instruct` | 128K | 8,192 | 413 t/s | Vision baseline in app |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | 128K | ~8,192 | 600 t/s | Fastest on Groq — add as option |

**Note:** Llama 4 Scout/Maverick have only 8K max output tokens — too low if generating full solutions to hard problems. Keep Llama 3.3 70B as the Groq option for interview.

### Groq Rate Limits (Developer Plan)

| Model | RPM | TPM |
|-------|-----|-----|
| Llama 3.3 70B | 1,000 | 300K |
| Llama 4 Scout | 30 | 30K |

The app's rate limiter is set to 6 req/min (free tier). Fix before the interview.

---

## LLM: Gemini Flash — Known Issues

Gemini Flash (2.5 and 3.x) has documented 503 overload errors since September 2025, still ongoing. Affects free and paid Tier 1 users. Recovery time: 30–120 minutes per incident. **Do not use as primary.** The fallback/retry in the app helps but doesn't eliminate downtime.

---

## Interview Context & Memory

| Setting | Current | Recommended |
|---------|---------|------------|
| Recent transcript fed to LLM | 24 segments | **40 segments** |
| Total transcript buffer | 300 | **500** |
| Vision context | 10 segments | Fine as-is |

At ~130 words/minute, a 1-hour interview produces 200–400 segments. The 300-segment buffer will start cycling around the 45-minute mark. Bump to 500.

The 24-segment transcript (~640–1280 tokens) fed into generation prompts is manageable but thin for coding phases where earlier clarifications matter. Phase handoffs compensate partially, but bumping to 40 costs nothing — Groq has 131K context, Claude has 200K.

**Estimated prompt size per generation:** ~1600–2800 tokens total. No risk of hitting any context limit.

---

## Recommended Stack

| Layer | Model | Why |
|-------|-------|-----|
| **STT** | Deepgram `nova-3` | Best accuracy + lowest latency |
| **Interview LLM (primary)** | `claude-sonnet-4-6` | Best hard coding reasoning — 77.2% SWE-bench |
| **Interview LLM (fast path)** | `llama-3.3-70b-versatile` (Groq) | Clarification phase, quick answers |
| **Fallback** | `gpt-5.4` | If Claude is unavailable |
| **Tertiary** | Gemini Flash | Last resort only |

---

## Code Changes

### 1. Deepgram — add endpointing + reduce reconnect cap
**`electron/audio/DeepgramStreamingSTT.ts`**
```typescript
// Add to URL:
`&endpointing=300` +
`&utterance_end_ms=1000` +

// Change:
const RECONNECT_MAX_DELAY_MS = 8000;  // was 30000
```

### 2. Groq Rate Limiter
**`electron/services/RateLimiter.ts`**
```typescript
groq: new RateLimiter(30, 0.5),  // was RateLimiter(6, 0.1)
```

### 3. Groq Output Token Cap
**`electron/LLMHelper.ts`**
```typescript
const GROQ_MAX_OUTPUT_TOKENS = 32000;
// In all Groq call paths: Math.min(MAX_OUTPUT_TOKENS, GROQ_MAX_OUTPUT_TOKENS)
```

### 4. Fix `isGroqModel()` for Llama 4
**`electron/LLMHelper.ts`**
```typescript
private isGroqModel(modelId: string): boolean {
  return modelId.startsWith("llama-") || 
         modelId.startsWith("mixtral-") || 
         modelId.startsWith("gemma-") ||
         modelId.startsWith("meta-llama/");  // ← add this
}
```

### 5. Increase Transcript Window
**`electron/interview/InterviewMemoryLedger.ts`**
```typescript
public getRecentTranscript(limit: number = 40): ...  // was 24
if (this.transcript.length > 500) { ... slice(-500) }  // was 300
```

---

## Pre-Interview Checklist

- [ ] Set primary model to **Claude Sonnet** (not Groq, not Gemini)
- [ ] Verify Deepgram API key — test a live 30s recording
- [ ] Verify Groq API key responds (for fast-path use)
- [ ] Verify Anthropic API key responds
- [ ] Check Groq account tier (developer = 1000 RPM)
- [ ] Enable Groq Fast Text Mode for clarification phase
- [ ] Apply the 5 code changes above
- [ ] Run a mock question end-to-end before the interview
- [ ] Use a directional mic or wired headset (reduces STT WER meaningfully)
