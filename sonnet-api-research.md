# API Research: LLM + STT — 1-Hour Interview Readiness

**Updated:** March 23, 2026

---

## Critical Fixes (Do These Before the Interview)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Groq RateLimiter at 6 req/min — PAYG dev plan is actually **30 RPM / 12K TPM** | 🔴 | Change to `RateLimiter(15, 0.4)` |
| 2 | `MAX_OUTPUT_TOKENS = 65536` exceeds Groq's hard cap of **32,768** | 🔴 | Cap Groq paths at `32000` |
| 3 | Gemini Flash 503 overloads affect **Tier 1 paid users too** — confirmed March 2026 | 🔴 | Keep as tertiary only |
| 4 | **Llama 3.3 70B is insufficient for hard coding problems** | 🔴 | Use Claude as primary for p3/p4/p5 |
| 5 | `isGroqModel()` won't route `meta-llama/llama-4-*` correctly | 🟠 | Add `meta-llama/` prefix check |
| 6 | Deepgram missing `endpointing` + `utterance_end_ms` | 🟡 | Add both params |
| 7 | Interview transcript window only **24 segments** | 🟡 | Increase to 40 |

---

## New: Groq Developer PAYG — What Changed

You're now on Groq developer pay-as-you-go. **The actual limits are lower than previously documented:**

| Metric | Llama 3.3 70B (PAYG Dev) |
|--------|--------------------------|
| RPM | **30** |
| RPD | 1,000 |
| TPM | **12,000** |
| TPD | 100,000 |

This is quite different from what I stated before (1000 RPM was for a higher tier). The good news: for an interview, you'll fire roughly 1–2 LLM requests per minute. At ~3000 tokens per request, that's ~6000 tokens/min — well within the 12K TPM limit. You have real headroom.

**Rate limiter update** — current setting is `RateLimiter(6, 0.1)` = 6 burst, 6/min. With 30 RPM actual cap, you can increase to:
```typescript
groq: new RateLimiter(15, 0.4),  // 15 burst, ~24/min — safe under 30 RPM
```

---

## New: Gemini Tier 1 Paid — Does It Help?

**No.** The 503 overload issues are server-capacity problems, not rate limit problems. Paying for Tier 1 does not protect you from them. A developer forum thread from this week confirms Tier 1 paid users are still hitting persistent 503s on Gemini 3.1 Flash as of March 2026.

Your Gemini Tier 1 does give better rate limits (higher RPM/TPM), which is useful for general app usage. But for the interview specifically, **don't set Gemini as your primary**. Use it as tertiary fallback where the app already has retry logic.

Gemini Pro (not Flash) is more stable and recommended for vision use specifically — see below.

---

## New: Soniox vs Deepgram — Should You Switch?

Soniox is already implemented in the app (`SonioxStreamingSTT.ts`, model `stt-rt-v4`). The question is whether it's worth switching from Deepgram.

| Metric | Deepgram Nova-3 | Soniox stt-rt-v4 |
|--------|----------------|-----------------|
| WER (independent benchmark) | ~5.26% | **1.29%** (Daily.co benchmark) |
| Latency (final transcript) | 200–300ms | **249ms** |
| Semantic endpointing | No (silence-based) | **Yes** (understands sentence completion) |
| Languages | 36+ | 60+ |
| End-of-turn detection | Manual config | Built-in semantic |
| Model release | Feb 2025 | **Feb 2026** |
| Cost | ~$0.0043/min | Pay-as-you-go |

**1.29% vs 5.26% WER is a massive difference.** For a coding interview where technical terms, variable names, and algorithm names must be transcribed correctly, that accuracy gap matters.

Semantic endpointing is also valuable: rather than detecting silence, Soniox understands when a sentence is grammatically complete. This means fewer mid-sentence interruptions when the interviewer pauses to think.

**Recommendation: Switch to Soniox for the interview.** The app already supports it — you just need the API key and to set it as the STT provider in settings. If you want to be safe, keep Deepgram as fallback.

---

## New: API Tier Sufficiency for Claude + GPT

**If you sign up today, here's what you get immediately:**

### Anthropic (Claude)
- Requires a **$5 deposit** to reach Tier 1
- Tier 1 limits: **50 RPM, 30K input tokens/min, 8–10K output tokens/min**
- For the interview: you'll do ~1–2 requests/minute. 50 RPM is more than enough.
- The binding constraint is OTPM (8K). At ~1500 tokens output per request, you can do ~5 requests/minute max. Still fine.
- **Tier 1 is sufficient for the interview.** Deposit $5, you're good.

### OpenAI (GPT)
- Similar tier structure — Tier 1 activates with a small credit purchase
- GPT-5.4 at Tier 1: enough for interview cadence (1–2 req/min)
- **Tier 1 is sufficient as a fallback.** Don't need it as primary given Claude is better for coding.

**Bottom line:** Add $5–$10 credit to Anthropic today and you have a fully functional Claude Tier 1 account ready for the interview. Same for OpenAI if you want GPT as a secondary fallback.

---

## New: Vision Model Recommendation

The app uses vision for reading the coding environment / shared screen. Best options ranked:

| Model | Screenshot Analysis | Chart/Diagram | Speed | Cost |
|-------|-------------------|---------------|-------|------|
| **Claude Sonnet 4** | **Best** (93.1% chart/diagram) | Excellent | Moderate | Medium |
| GPT-5.4 vision | Very good | 91.5% | Moderate | High |
| **Gemini Pro** | Strong (92.8% DocVQA) | Excellent | Moderate | Medium |
| Gemini Flash | Good | Fast | **Fastest** | Low |

For interview vision (reading the problem statement, code on screen, shared diagrams):
- **Use Claude Sonnet as vision primary** — you're already setting it as LLM primary, and it's the best at reading structured UI/code screenshots
- **Gemini Flash as vision fallback** — you're already Tier 1 paid, and vision calls are infrequent enough that 503 risk is low for occasional snapshots
- Avoid using Gemini Pro as vision primary since it's also affected by 503 issues (though less so than Flash)

---

## Model Reasoning for Hard Coding Problems

Google-style custom problems require: problem classification, optimal complexity reasoning, correct working code, edge cases. Here's the honest assessment:

| Model | Hard Algo Reasoning | SWE-Bench | Speed | Max Output |
|-------|-------------------|-----------|-------|-----------|
| `llama-3.3-70b-versatile` | Medium — fine for medium, unreliable on hard DP/graphs | Not ranked | 280 t/s, 140ms TTFT | 32K |
| **`claude-sonnet-4-6`** | **Excellent** | **77.2%** | ~80–120 t/s | 200K context |
| `gpt-5.4` | Excellent | ~74.9% | ~100 t/s | 128K context |

**Use Claude as primary. Groq as fast path for clarification only.**

### Phase-Aware Model Selection

| Phase | Model | Why |
|-------|-------|-----|
| p2 — Clarification | Groq Llama 3.3 70B | Fast, simple reasoning |
| p3 — Approach | **Claude Sonnet** | Needs real algorithmic reasoning |
| p4 — Coding | **Claude Sonnet** | Must produce correct, optimized code |
| p5 — Testing | **Claude Sonnet** | Edge cases, complexity analysis |
| p6 — Follow-up | Groq or Claude | Depends on complexity |

---

## STT: Deepgram → Soniox

If switching to Soniox:
- Set STT provider to `soniox` in settings
- Configure `max_endpoint_delay_ms: 500` (default is 2000ms which is too slow for interview)
- Soniox's semantic endpointing handles turn detection automatically — you won't need the manual `endpointing`/`utterance_end_ms` params

If staying on Deepgram (Nova-3 is still excellent):
```typescript
// Add to URL in DeepgramStreamingSTT.ts:
`&endpointing=300` +
`&utterance_end_ms=1000` +

// Reduce reconnect cap:
const RECONNECT_MAX_DELAY_MS = 8000;  // was 30000
```

---

## Interview Context: Transcript Window

**Yes, increase it.** For a 1-hour interview:
- ~130 words/min × 60 min = ~7800 words
- At ~30 words/segment: ~260 segments total
- Current buffer cap: 300 — will cycle near the end
- Current feed to LLM: 24 segments (~640–1280 tokens)

Claude's 200K context window can absorb far more. Increasing to 40 segments costs nothing and ensures earlier clarifications don't get dropped when you're deep in the coding phase.

```typescript
// InterviewMemoryLedger.ts line 214:
public getRecentTranscript(limit: number = 40): ...  // was 24

// Line 220, increase buffer:
if (this.transcript.length > 500) { ... slice(-500) }  // was 300
```

---

## Recommended Final Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **STT** | **Soniox stt-rt-v4** | 1.29% WER, semantic endpointing — already in app |
| **STT fallback** | Deepgram Nova-3 | Already in app, still excellent |
| **Interview LLM primary** | `claude-sonnet-4-6` | Best hard coding reasoning |
| **Interview LLM fast path** | `llama-3.3-70b-versatile` (Groq) | Clarification phase only |
| **LLM fallback** | `gpt-5.4` | If Claude is down |
| **Vision** | Claude Sonnet (primary) | Best screenshot/code reading |
| **Vision fallback** | Gemini Flash | Already Tier 1 paid, fine for infrequent vision |

---

## Code Changes (Summary)

| File | Change |
|------|--------|
| `RateLimiter.ts` | `groq: new RateLimiter(15, 0.4)` |
| `LLMHelper.ts` | Add `GROQ_MAX_OUTPUT_TOKENS = 32000`, cap Groq paths |
| `LLMHelper.ts` | Add `modelId.startsWith("meta-llama/")` to `isGroqModel()` |
| `DeepgramStreamingSTT.ts` | Add `&endpointing=300&utterance_end_ms=1000`, reduce `RECONNECT_MAX_DELAY_MS` to 8000 |
| `InterviewMemoryLedger.ts` | `getRecentTranscript(limit = 40)`, buffer 500 |

---

## Pre-Interview Checklist

- [ ] Set primary model → **Claude Sonnet** in settings
- [ ] Set STT provider → **Soniox** (get API key) with `max_endpoint_delay_ms: 500`
- [ ] Add $5 credit to Anthropic console → unlocks Tier 1 immediately
- [ ] Add small credit to OpenAI console → unlock Tier 1 as backup
- [ ] Verify Groq PAYG is active, test `llama-3.3-70b-versatile` responds
- [ ] Apply the 5 code changes above
- [ ] Run a mock question end-to-end before the real interview
- [ ] Use directional mic / wired headset (reduces WER significantly)
