import { LLMHelper } from '../../LLMHelper';
import { buildPhasePrompt, INTERVIEW_GENERATOR_SYSTEM_PROMPT } from '../InterviewPrompts';
import { InterviewGeneratorContext, InterviewOverlayPayload, InterviewPhase } from '../types';

const EMPTY_PHASE_PAYLOAD: {
  speakNow: string[];
  speakIfAsked: string[];
  writeNow: string[];
  thoughtNotes: string[];
  quickQuestions: string[];
  pinnedFacts: string[];
  codePanel: null;
} = {
  speakNow: [],
  speakIfAsked: [],
  writeNow: [],
  thoughtNotes: [],
  quickQuestions: [],
  pinnedFacts: [],
  codePanel: null,
};

export abstract class BaseInterviewGenerator {
  constructor(protected readonly llmHelper: LLMHelper) {}

  protected async generatePhasePayload(phase: InterviewPhase, context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const raw = await this.llmHelper.chat(
      buildPhasePrompt(phase, context),
      undefined,
      undefined,
      INTERVIEW_GENERATOR_SYSTEM_PROMPT
    );

    const parsed = this.parseJson(raw);
    const generatedAt = Date.now();

    return {
      phase: phase === 'p1_intro' ? 'p2_clarify' : phase,
      phaseConfidence: context.snapshot.phaseConfidence,
      manualOverrideActive: !!context.snapshot.manualOverridePhase,
      speakNow: normalizeStringArray(parsed.speakNow),
      speakIfAsked: normalizeStringArray(parsed.speakIfAsked),
      writeNow: normalizeStringArray(parsed.writeNow),
      thoughtNotes: normalizeStringArray(parsed.thoughtNotes),
      quickQuestions: normalizeStringArray(parsed.quickQuestions),
      pinnedFacts: normalizeStringArray(parsed.pinnedFacts),
      changes: [],
      codePanel: parsed.codePanel && typeof parsed.codePanel === 'object'
        ? {
            language: parsed.codePanel.language === 'python' ? 'python' : 'unknown',
            mode: normalizeCodeMode(parsed.codePanel.mode),
            content: typeof parsed.codePanel.content === 'string' ? parsed.codePanel.content : '',
            narration: normalizeStringArray(parsed.codePanel.narration),
            suspectedMistakes: normalizeStringArray(parsed.codePanel.suspectedMistakes),
          }
        : undefined,
      freshness: {
        transcriptUpdatedMsAgo: context.snapshot.lastTranscriptAt ? Math.max(0, generatedAt - context.snapshot.lastTranscriptAt) : Number.MAX_SAFE_INTEGER,
        screenshotUpdatedMsAgo: context.snapshot.lastScreenshotAt ? Math.max(0, generatedAt - context.snapshot.lastScreenshotAt) : null,
        generatedMsAgo: 0,
      },
      generatedAt,
      inputRevision: context.snapshot.inputRevision,
    };
  }

  private parseJson(raw: string): any {
    const trimmed = raw.trim();
    if (!trimmed) {
      return EMPTY_PHASE_PAYLOAD;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return {
            ...EMPTY_PHASE_PAYLOAD,
            speakNow: [trimmed],
          };
        }
      }
      return {
        ...EMPTY_PHASE_PAYLOAD,
        speakNow: [trimmed],
      };
    }
  }
}

function normalizeStringArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeCodeMode(mode: any): 'skeleton' | 'full' | 'diff' | 'trace' | 'debug' {
  if (mode === 'skeleton' || mode === 'full' || mode === 'diff' || mode === 'trace' || mode === 'debug') {
    return mode;
  }
  return 'full';
}
