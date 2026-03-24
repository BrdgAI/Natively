import {
  InterviewClarificationCandidate,
  InterviewGeneratedCode,
} from './types';
import {
  MAX_INTERVIEW_CLARIFICATION_QUESTIONS,
  MAX_INTERVIEW_MAIN_LINES,
  MAX_INTERVIEW_PINNED_FACTS,
} from './InterviewPromptLimits';

export interface InterviewResponseFields {
  mainLines: string[];
  pinnedFacts: string[];
  clarificationQuestions: InterviewClarificationCandidate[];
  code: InterviewGeneratedCode | null;
}

const KNOWN_RESPONSE_KEYS = [
  'mainLines',
  'pinnedFacts',
  'clarificationQuestions',
  'code',
  'language',
  'content',
  'text',
  'why',
] as const;

export function normalizeInterviewResponse(fields: InterviewResponseFields): InterviewResponseFields {
  return {
    mainLines: normalizeDisplayLines(fields.mainLines, MAX_INTERVIEW_MAIN_LINES),
    pinnedFacts: normalizeDisplayLines(fields.pinnedFacts, MAX_INTERVIEW_PINNED_FACTS),
    clarificationQuestions: normalizeClarificationQuestions(fields.clarificationQuestions),
    code: normalizeGeneratedCode(fields.code),
  };
}

export function salvagePlainTextLines(raw: string): string[] {
  const withoutCodeBlocks = removeFencedCodeBlocks(raw);
  const lines = withoutCodeBlocks
    .split('\n')
    .flatMap(splitLineIntoSentences)
    .map(sanitizeDisplayLine)
    .filter((line) => isMeaningfulDisplayLine(line) && !isJsonNoiseLine(line));

  return dedupe(lines).slice(0, MAX_INTERVIEW_MAIN_LINES);
}

export function sanitizeDisplayLine(value: string): string {
  let line = value.replace(/\r\n/g, '\n').trim();
  line = stripFenceMarker(line);
  line = stripKnownKeyPrefix(line);
  line = stripWrappingQuotes(line);
  line = line.replace(/^[*-]\s+/, '');
  line = line.replace(/^\d+\.\s+/, '');
  line = line.replace(/,\s*$/, '');
  line = line.replace(/\s+/g, ' ').trim();
  return stripWrappingQuotes(line).replace(/,\s*$/, '').trim();
}

function normalizeDisplayLines(lines: string[], limit: number): string[] {
  return dedupe(
    lines
      .flatMap(splitLineIntoSentences)
      .map(sanitizeDisplayLine)
      .filter((line) => isMeaningfulDisplayLine(line) && !isJsonNoiseLine(line))
  ).slice(0, limit);
}

function normalizeClarificationQuestions(items: InterviewClarificationCandidate[]): InterviewClarificationCandidate[] {
  const seen = new Set<string>();
  const result: InterviewClarificationCandidate[] = [];

  for (const item of items) {
    const text = sanitizeDisplayLine(item.text);
    if (!isMeaningfulDisplayLine(text) || isJsonNoiseLine(text)) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({
      text,
      why: sanitizeDisplayLine(item.why),
    });
  }

  return result.slice(0, MAX_INTERVIEW_CLARIFICATION_QUESTIONS);
}

function normalizeGeneratedCode(code: InterviewGeneratedCode | null): InterviewGeneratedCode | null {
  if (!code) {
    return null;
  }

  let content = stripFenceWrapper(code.content).trim();
  if (!content) {
    return null;
  }

  if (!content.includes('\n') && content.includes('\\n')) {
    content = decodeCommonEscapes(content);
  }

  return {
    language: code.language,
    content,
  };
}

function splitLineIntoSentences(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  const matches = trimmed.match(/[^.!?]+(?:[.!?]+|$)/g);
  if (!matches) {
    return [trimmed];
  }

  return matches.map((item) => item.trim()).filter(Boolean);
}

function stripKnownKeyPrefix(value: string): string {
  return value.replace(
    new RegExp(`^(?:"|')?(?:${KNOWN_RESPONSE_KEYS.join('|')})(?:"|')?\\s*:\\s*`, 'i'),
    ''
  );
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function stripFenceMarker(value: string): string {
  return value
    .replace(/^```[a-zA-Z0-9_-]*\s*$/g, '')
    .replace(/^```/g, '')
    .replace(/```$/g, '')
    .trim();
}

function stripFenceWrapper(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```$/);
  return match ? match[2].trim() : trimmed;
}

function removeFencedCodeBlocks(value: string): string {
  return value.replace(/```[a-zA-Z0-9_-]*\n?[\s\S]*?```/g, '\n');
}

function isMeaningfulDisplayLine(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (!/[A-Za-z0-9]/.test(trimmed)) {
    return false;
  }

  return !looksLikeStandaloneKey(trimmed);
}

function isJsonNoiseLine(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  if (/^[\[\]{}:,]+$/.test(trimmed)) {
    return true;
  }

  if (/^(?:null|true|false)$/i.test(trimmed)) {
    return true;
  }

  if (looksLikeStandaloneKey(trimmed)) {
    return true;
  }

  return /^(?:"|')?(?:mainLines|pinnedFacts|clarificationQuestions|code|language|content|text|why)(?:"|')?\s*:/i.test(trimmed);
}

function looksLikeStandaloneKey(value: string): boolean {
  return new RegExp(`^(?:"|')?(?:${KNOWN_RESPONSE_KEYS.join('|')})(?:"|')?$`, 'i').test(value);
}

function decodeCommonEscapes(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
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
