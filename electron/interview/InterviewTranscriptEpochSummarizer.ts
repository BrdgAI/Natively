import { LLMHelper } from '../LLMHelper';
import {
  InterviewEpochSummaryResult,
  InterviewTranscriptEpochSummaryInput,
  InterviewTranscriptSegment,
} from './types';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const EPOCH_SUMMARY_SYSTEM_PROMPT = `You summarize earlier live interview transcript chunks for later prompt reuse.
Return JSON only with this exact shape:
{
  "summaryLines": ["one concise factual line"],
  "carryForwardFacts": ["short stable fact"],
  "openQuestions": ["question still worth remembering"]
}
Prefer stable decisions, clarified constraints, requirement changes, and unresolved questions.
Do not add markdown, numbering, or extra keys.`;

export class InterviewTranscriptEpochSummarizer {
  constructor(private readonly llmHelper: LLMHelper) {}

  public async summarize(input: InterviewTranscriptEpochSummaryInput): Promise<InterviewEpochSummaryResult> {
    try {
      const raw = await this.llmHelper.chat(
        buildEpochSummaryPrompt(input),
        undefined,
        undefined,
        EPOCH_SUMMARY_SYSTEM_PROMPT
      );
      const parsed = parseJsonObject(raw);
      const normalized = normalizeSummaryResult(parsed);
      if (normalized) {
        return {
          ...normalized,
          source: 'llm',
        };
      }
    } catch {
    }

    return this.buildFallback(input);
  }

  public buildFallback(input: InterviewTranscriptEpochSummaryInput): InterviewEpochSummaryResult {
    const normalizedSegments = input.segments
      .map((segment) => ({
        speaker: segment.speaker.trim().toLowerCase(),
        text: normalizeText(segment.text),
      }))
      .filter((segment) => segment.text.length > 0);

    const prioritizedSummaryLines = dedupeStrings(
      normalizedSegments
        .map((segment) => ({
          text: segment.text,
          score: scoreTranscriptLine(segment.speaker, segment.text),
        }))
        .sort((left, right) => right.score - left.score)
        .map((segment) => segment.text)
    ).slice(0, 4);

    const summaryLines = prioritizedSummaryLines.length > 0
      ? prioritizedSummaryLines
      : dedupeStrings(normalizedSegments.map((segment) => segment.text)).slice(0, 4);

    const carryForwardFacts = dedupeStrings([
      input.snapshot.problemStatement ? `Problem: ${normalizeText(input.snapshot.problemStatement)}` : '',
      ...input.snapshot.constraints.map((item) => normalizeText(item)),
      ...input.snapshot.clarifiedFacts.map((item) => normalizeText(item)),
      ...input.snapshot.pinnedFacts.map((item) => normalizeText(item)),
      ...input.snapshot.requirementChanges.map((item) => normalizeText(item)),
      ...normalizedSegments
        .filter((segment) => !segment.text.includes('?') && isFactCandidate(segment.text))
        .map((segment) => segment.text),
    ]).slice(0, 4);

    const openQuestions = dedupeStrings([
      ...input.snapshot.openQuestions.map((item) => normalizeText(item)),
      ...normalizedSegments
        .filter((segment) => segment.text.includes('?'))
        .map((segment) => segment.text),
    ]).slice(0, 4);

    return {
      summaryLines,
      carryForwardFacts,
      openQuestions,
      source: 'fallback',
    };
  }
}

function buildEpochSummaryPrompt(input: InterviewTranscriptEpochSummaryInput): string {
  return [
    'Current structured interview state:',
    formatGroundingState(input),
    'Compacted transcript slice:',
    formatTranscriptSlice(input.segments),
    'Summarize the earlier slice into stable memory for a later interview prompt.',
  ].join('\n\n');
}

function formatGroundingState(input: InterviewTranscriptEpochSummaryInput): string {
  const snapshot = input.snapshot;
  return [
    `Phase: ${snapshot.phase}`,
    formatList('Problem', snapshot.problemStatement ? [snapshot.problemStatement] : []),
    formatList('Constraints', snapshot.constraints),
    formatList('Clarified facts', snapshot.clarifiedFacts),
    formatList('Pinned facts', snapshot.pinnedFacts),
    formatList('Requirement changes', snapshot.requirementChanges),
    formatList('Open questions', snapshot.openQuestions),
  ].join('\n');
}

function formatTranscriptSlice(segments: InterviewTranscriptSegment[]): string {
  const lines = segments
    .map((segment) => {
      const text = normalizeText(segment.text);
      return text ? `[${segment.speaker.toUpperCase()}] ${text}` : '';
    })
    .filter(Boolean);

  return lines.length > 0 ? lines.join('\n') : '[none]';
}

function formatList(label: string, items: string[]): string {
  if (items.length === 0) {
    return `${label}: - none`;
  }

  return `${label}:\n${items.map((item) => `- ${normalizeText(item)}`).join('\n')}`;
}

function parseJsonObject(raw: string): JsonObject | null {
  const direct = safelyParseObject(raw);
  if (direct) {
    return direct;
  }

  const startIndex = raw.indexOf('{');
  const endIndex = raw.lastIndexOf('}');
  if (startIndex < 0 || endIndex <= startIndex) {
    return null;
  }

  return safelyParseObject(raw.slice(startIndex, endIndex + 1));
}

function safelyParseObject(raw: string): JsonObject | null {
  try {
    const parsed = JSON.parse(raw) as JsonValue;
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeSummaryResult(parsed: JsonObject | null): Omit<InterviewEpochSummaryResult, 'source'> | null {
  if (!parsed) {
    return null;
  }

  const summaryLines = readStringArray(parsed, 'summaryLines').slice(0, 4);
  const carryForwardFacts = readStringArray(parsed, 'carryForwardFacts').slice(0, 4);
  const openQuestions = readStringArray(parsed, 'openQuestions').slice(0, 4);

  if (summaryLines.length === 0 && carryForwardFacts.length === 0 && openQuestions.length === 0) {
    return null;
  }

  return {
    summaryLines,
    carryForwardFacts,
    openQuestions,
  };
}

function readStringArray(object: JsonObject, key: string): string[] {
  const value = object[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => typeof item === 'string' ? normalizeText(item) : '')
    .filter((item) => item.length > 0);
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scoreTranscriptLine(speaker: string, text: string): number {
  let score = 0;

  if (speaker === 'interviewer') {
    score += 2;
  }

  if (text.includes('?')) {
    score += 3;
  }

  if (/(constraint|return|indices|values|example|edge case|duplicate|sorted|time complexity|space complexity|hash map|follow[- ]up|optimi[sz]ed|test|dry run|null|none)/i.test(text)) {
    score += 4;
  }

  if (/(should|can|what if|maximum|complexity|allowed|exactly one)/i.test(text)) {
    score += 2;
  }

  return score;
}

function isFactCandidate(text: string): boolean {
  return /(constraint|return|indices|values|example|duplicate|sorted|complexity|hash map|null|none|answer exists|input|output|test)/i.test(text);
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = normalizeText(item);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}
