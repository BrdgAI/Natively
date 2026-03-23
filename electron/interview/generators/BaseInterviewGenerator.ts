import { LLMHelper } from '../../LLMHelper';
import { buildPhasePrompt, INTERVIEW_GENERATOR_SYSTEM_PROMPT } from '../InterviewPrompts';
import {
  InterviewAnchorBlock,
  InterviewClarificationCandidate,
  InterviewCodePanel,
  InterviewGeneratorContext,
  InterviewMainSection,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewUpdateSummary,
} from '../types';

type JsonObject = Record<string, unknown>;

const EMPTY_PHASE_PAYLOAD = {
  speakNow: [] as string[],
  speakIfAsked: [] as string[],
  writeNow: [] as string[],
  thoughtNotes: [] as string[],
  quickQuestions: [] as string[],
  pinnedFacts: [] as string[],
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
    const codePanel = parseCodePanel(readObject(parsed, 'codePanel'));
    const anchor = parseAnchor(readObject(parsed, 'anchor'));
    const mainSections = parseMainSections(readArray(parsed, 'mainSections'));
    const clarificationQuestions = parseClarificationQuestions(readArray(parsed, 'clarificationQuestions'));
    const updateSummary = parseUpdateSummary(readObject(parsed, 'updateSummary'), generatedAt);

    return {
      phase: phase === 'p1_intro' ? 'p2_clarify' : phase,
      phaseConfidence: context.snapshot.phaseConfidence,
      manualOverrideActive: Boolean(context.snapshot.manualOverridePhase),
      speakNow: normalizeStringArray(readArray(parsed, 'speakNow')),
      speakIfAsked: normalizeStringArray(readArray(parsed, 'speakIfAsked')),
      writeNow: normalizeStringArray(readArray(parsed, 'writeNow')),
      thoughtNotes: normalizeStringArray(readArray(parsed, 'thoughtNotes')),
      quickQuestions: normalizeStringArray(readArray(parsed, 'quickQuestions')),
      pinnedFacts: normalizeStringArray(readArray(parsed, 'pinnedFacts')),
      changes: [],
      codePanel: codePanel || undefined,
      anchor: anchor || undefined,
      mainSections: mainSections.length > 0 ? mainSections : undefined,
      clarificationQuestions: clarificationQuestions.length > 0 ? clarificationQuestions : undefined,
      updateSummary: updateSummary || undefined,
      freshness: {
        transcriptUpdatedMsAgo: context.snapshot.lastTranscriptAt
          ? Math.max(0, generatedAt - context.snapshot.lastTranscriptAt)
          : Number.MAX_SAFE_INTEGER,
        screenshotUpdatedMsAgo: context.snapshot.lastScreenshotAt
          ? Math.max(0, generatedAt - context.snapshot.lastScreenshotAt)
          : null,
        generatedMsAgo: 0,
      },
      generatedAt,
      inputRevision: context.snapshot.inputRevision,
    };
  }

  private parseJson(raw: string): JsonObject {
    const trimmed = raw.trim();
    if (!trimmed) {
      return EMPTY_PHASE_PAYLOAD;
    }

    const direct = safelyParseObject(trimmed);
    if (direct) {
      return direct;
    }

    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      const nested = safelyParseObject(match[0]);
      if (nested) {
        return nested;
      }
    }

    return {
      ...EMPTY_PHASE_PAYLOAD,
      speakNow: [trimmed],
    };
  }
}

function safelyParseObject(raw: string): JsonObject | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readArray(object: JsonObject, key: string): unknown[] {
  const value = object[key];
  return Array.isArray(value) ? value : [];
}

function readObject(object: JsonObject, key: string): JsonObject | null {
  const value = object[key];
  return isObject(value) ? value : null;
}

function normalizeStringArray(value: unknown[]): string[] {
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
}

function parseCodePanel(object: JsonObject | null): InterviewCodePanel | null {
  if (!object) {
    return null;
  }

  return {
    language: object.language === 'python' ? 'python' : 'unknown',
    mode: normalizeCodeMode(object.mode),
    content: typeof object.content === 'string' ? object.content : '',
    narration: normalizeStringArray(Array.isArray(object.narration) ? object.narration : []),
    suspectedMistakes: normalizeStringArray(Array.isArray(object.suspectedMistakes) ? object.suspectedMistakes : []),
  };
}

function parseAnchor(object: JsonObject | null): InterviewAnchorBlock | null {
  if (!object) {
    return null;
  }

  const title = typeof object.title === 'string' ? object.title.trim() : '';
  const items = normalizeStringArray(Array.isArray(object.items) ? object.items : []);
  const writeNow = normalizeStringArray(Array.isArray(object.writeNow) ? object.writeNow : []);
  const note = typeof object.note === 'string' && object.note.trim() ? object.note.trim() : null;

  if (!title && items.length === 0 && writeNow.length === 0 && !note) {
    return null;
  }

  return {
    title: title || 'Current focus',
    items,
    writeNow,
    note,
  };
}

function parseMainSections(items: unknown[]): InterviewMainSection[] {
  const sections: InterviewMainSection[] = [];

  for (const item of items) {
    if (!isObject(item)) {
      continue;
    }

    const title = typeof item.title === 'string' ? item.title.trim() : '';
    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const lines = normalizeStringArray(Array.isArray(item.lines) ? item.lines : []);
    const tone = item.tone === 'secondary' || item.tone === 'warning' ? item.tone : 'primary';

    if (!title || !id || lines.length === 0) {
      continue;
    }

    sections.push({
      id,
      title,
      lines,
      tone,
    });
  }

  return sections.slice(0, 8);
}

function parseClarificationQuestions(items: unknown[]): InterviewClarificationCandidate[] {
  const questions: InterviewClarificationCandidate[] = [];

  for (const item of items) {
    if (!isObject(item)) {
      continue;
    }

    const text = typeof item.text === 'string' ? item.text.trim() : '';
    const why = typeof item.why === 'string' ? item.why.trim() : '';
    if (!text) {
      continue;
    }
    questions.push({ text, why });
  }

  return questions.slice(0, 10);
}

function parseUpdateSummary(object: JsonObject | null, generatedAt: number): InterviewUpdateSummary | null {
  if (!object) {
    return null;
  }

  const status = object.status === 'unchanged' || object.status === 'partial' ? object.status : 'updated';
  const updatedSections = normalizeStringArray(Array.isArray(object.updatedSections) ? object.updatedSections : []);
  const message = typeof object.message === 'string' ? object.message.trim() : '';

  if (!message && updatedSections.length === 0) {
    return null;
  }

  return {
    status,
    updatedSections,
    message: message || (updatedSections.length > 0 ? `Updated: ${updatedSections.join(', ')}` : 'No updates'),
    at: generatedAt,
  };
}

function normalizeCodeMode(mode: unknown): InterviewCodePanel['mode'] {
  if (mode === 'skeleton' || mode === 'full' || mode === 'diff' || mode === 'trace' || mode === 'debug') {
    return mode;
  }
  return 'full';
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
