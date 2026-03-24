import {
  buildVisionPrompt,
  formatVisionEarlierMemory,
  INTERVIEW_VISION_SYSTEM_PROMPT,
} from './InterviewPrompts';
import {
  InterviewChatProvider,
  InterviewPhase,
  InterviewScreenAnalysis,
  InterviewTranscriptEpoch,
  InterviewTranscriptSegment,
} from './types';

type JsonObject = Record<string, unknown>;

export class InterviewVisionSync {
  constructor(private readonly llmHelper: InterviewChatProvider) {}

  public async analyze(
    phase: InterviewPhase,
    screenshotPath: string,
    screenshotPreview: string | undefined,
    recentTranscript: InterviewTranscriptSegment[],
    earlierMemory: InterviewTranscriptEpoch[]
  ): Promise<InterviewScreenAnalysis> {
    const prompt = buildVisionPrompt(
      phase,
      recentTranscript
        .slice(-10)
        .map((item) => `[${item.speaker.toUpperCase()}] ${item.text}`)
        .join('\n'),
      formatVisionEarlierMemory(earlierMemory)
    );

    const raw = await this.llmHelper.chat(prompt, [screenshotPath], undefined, INTERVIEW_VISION_SYSTEM_PROMPT);
    const parsed = parseJson(raw);

    return {
      screenshotPath,
      screenshotPreview,
      capturedAt: Date.now(),
      problemStatement: typeof parsed.problemStatement === 'string' ? parsed.problemStatement.trim() : undefined,
      givenConstraints: normalizeStringArray(readArray(parsed, 'givenConstraints')),
      examples: normalizeStringArray(readArray(parsed, 'examples')),
      visibleQuestions: normalizeStringArray(readArray(parsed, 'visibleQuestions')),
      currentCode: typeof parsed.currentCode === 'string' ? parsed.currentCode : undefined,
      dryRunInput: typeof parsed.dryRunInput === 'string' ? parsed.dryRunInput : undefined,
      hints: normalizeStringArray(readArray(parsed, 'hints')),
      likelyMistakes: normalizeStringArray(readArray(parsed, 'likelyMistakes')),
      extractedTests: normalizeStringArray(readArray(parsed, 'extractedTests')),
    };
  }
}

function parseJson(raw: string): JsonObject {
  const direct = safelyParseObject(raw);
  if (direct) {
    return direct;
  }

  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    const nested = safelyParseObject(match[0]);
    if (nested) {
      return nested;
    }
  }

  return {};
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

function normalizeStringArray(value: unknown[]): string[] {
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
