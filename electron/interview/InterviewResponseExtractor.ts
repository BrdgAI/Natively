import {
  InterviewClarificationCandidate,
  InterviewGeneratedCode,
  InterviewPhase,
} from './types';
import {
  InterviewResponseFields,
  normalizeInterviewResponse,
  salvagePlainTextLines,
} from './InterviewPresentationNormalizer';
import {
  MAX_INTERVIEW_CLARIFICATION_QUESTIONS,
  MAX_INTERVIEW_PINNED_FACTS,
  getMaxInterviewMainLines,
} from './InterviewPromptLimits';

interface JsonObject {
  [key: string]: JsonValue;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

interface FencedBlock {
  info: string;
  content: string;
}

const EMPTY_RESPONSE_FIELDS: InterviewResponseFields = {
  mainLines: [],
  pinnedFacts: [],
  clarificationQuestions: [],
  code: null,
};

export function extractInterviewResponse(raw: string, phase?: InterviewPhase): InterviewResponseFields {
  const normalizedRaw = normalizeRawText(raw);
  const mainLineLimit = getMaxInterviewMainLines(phase);
  const parsedObject = parseBestStructuredObject(normalizedRaw);
  const extracted = parsedObject
    ? extractFromObject(parsedObject, mainLineLimit)
    : extractByKnownKeys(normalizedRaw, mainLineLimit);

  const code = extracted.code || extractStandaloneCodeBlock(normalizedRaw);

  return normalizeInterviewResponse({
    mainLines: extracted.mainLines.length > 0
      ? extracted.mainLines
      : salvagePlainTextLines(normalizedRaw, phase),
    pinnedFacts: extracted.pinnedFacts,
    clarificationQuestions: extracted.clarificationQuestions,
    code,
  }, phase);
}

function parseBestStructuredObject(raw: string): JsonObject | null {
  const candidates = buildJsonCandidates(raw);

  for (const candidate of candidates) {
    const direct = safelyParseObject(candidate);
    if (direct && hasSupportedKeys(direct)) {
      return direct;
    }

    const sanitized = sanitizeJsonCandidate(candidate);
    const parsed = safelyParseObject(sanitized);
    if (parsed && hasSupportedKeys(parsed)) {
      return parsed;
    }
  }

  return null;
}

function buildJsonCandidates(raw: string): string[] {
  const candidates = [
    raw,
    ...collectFencedBlocks(raw).map((block) => block.content),
    ...findBalancedObjects(raw),
  ];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of candidates) {
    const trimmed = candidate.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    result.push(trimmed);
  }

  return result.slice(0, 24);
}

function extractFromObject(object: JsonObject, mainLineLimit: number): InterviewResponseFields {
  return {
    mainLines: normalizeStringArray(readArray(object, 'mainLines'), mainLineLimit),
    pinnedFacts: normalizeStringArray(readArray(object, 'pinnedFacts'), MAX_INTERVIEW_PINNED_FACTS),
    clarificationQuestions: parseClarificationQuestionArray(readArray(object, 'clarificationQuestions')),
    code: parseGeneratedCodeFromObject(readObject(object, 'code')),
  };
}

function extractByKnownKeys(raw: string, mainLineLimit: number): InterviewResponseFields {
  return {
    mainLines: parseStringArrayValue(firstValueForKey(raw, 'mainLines'), mainLineLimit),
    pinnedFacts: parseStringArrayValue(firstValueForKey(raw, 'pinnedFacts'), MAX_INTERVIEW_PINNED_FACTS),
    clarificationQuestions: parseClarificationQuestionsValue(firstValueForKey(raw, 'clarificationQuestions')),
    code: parseGeneratedCodeValue(firstValueForKey(raw, 'code')),
  };
}

function firstValueForKey(raw: string, key: string): string | null {
  const values = findValuesForKey(raw, key);
  return values.length > 0 ? values[0] : null;
}

function findValuesForKey(raw: string, key: string): string[] {
  const pattern = new RegExp(`(?:["'])?${escapeRegExp(key)}(?:["'])?\\s*:\\s*`, 'g');
  const values: string[] = [];
  let match = pattern.exec(raw);

  while (match) {
    const captured = captureValue(raw, pattern.lastIndex);
    if (captured) {
      values.push(captured.valueText);
      pattern.lastIndex = captured.nextIndex;
    }
    match = pattern.exec(raw);
  }

  return values;
}

function captureValue(raw: string, startIndex: number): { valueText: string; nextIndex: number } | null {
  let index = skipWhitespace(raw, startIndex);
  if (index >= raw.length) {
    return null;
  }

  const current = raw[index];
  if (current === '[') {
    const captured = captureBalancedSegment(raw, index, '[', ']');
    return captured ? { valueText: captured, nextIndex: index + captured.length } : null;
  }

  if (current === '{') {
    const captured = captureBalancedSegment(raw, index, '{', '}');
    return captured ? { valueText: captured, nextIndex: index + captured.length } : null;
  }

  if (current === '"' || current === "'") {
    const captured = captureQuotedText(raw, index);
    return captured ? { valueText: captured.raw, nextIndex: captured.nextIndex } : null;
  }

  let endIndex = index;
  while (endIndex < raw.length && !/[,\n\r}\]]/.test(raw[endIndex])) {
    endIndex += 1;
  }

  return {
    valueText: raw.slice(index, endIndex).trim(),
    nextIndex: endIndex,
  };
}

function parseStringArrayValue(valueText: string | null, limit: number): string[] {
  if (!valueText) {
    return [];
  }

  const sanitized = sanitizeJsonCandidate(valueText);
  const parsed = safelyParseValue(sanitized);
  if (Array.isArray(parsed)) {
    return normalizeStringArray(parsed, limit);
  }

  if (isQuotedValue(valueText)) {
    const quoted = captureQuotedText(valueText.trim(), 0);
    return quoted ? [quoted.value] : [];
  }

  const trimmed = trimArrayWrapper(valueText);
  const quotedValues = collectQuotedValues(trimmed);
  if (quotedValues.length > 0) {
    return normalizeStringArray(quotedValues, limit);
  }

  return trimmed
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function parseClarificationQuestionsValue(valueText: string | null): InterviewClarificationCandidate[] {
  if (!valueText) {
    return [];
  }

  const sanitized = sanitizeJsonCandidate(valueText);
  const parsed = safelyParseValue(sanitized);
  if (Array.isArray(parsed)) {
    return parseClarificationQuestionArray(parsed);
  }

  const texts = findValuesForKey(valueText, 'text')
    .map(parseStringValue)
    .filter((value): value is string => Boolean(value));
  const whys = findValuesForKey(valueText, 'why')
    .map(parseStringValue)
    .filter((value): value is string => Boolean(value));

  const result: InterviewClarificationCandidate[] = [];
  for (let index = 0; index < texts.length; index += 1) {
    result.push({
      text: texts[index],
      why: whys[index] || '',
    });
  }

  return result.slice(0, MAX_INTERVIEW_CLARIFICATION_QUESTIONS);
}

function parseGeneratedCodeValue(valueText: string | null): InterviewGeneratedCode | null {
  if (!valueText) {
    return null;
  }

  const sanitized = sanitizeJsonCandidate(valueText);
  const parsed = safelyParseValue(sanitized);
  if (isObject(parsed)) {
    return parseGeneratedCodeFromObject(parsed);
  }

  const stringValue = parseStringValue(valueText);
  if (!stringValue) {
    return null;
  }

  return {
    language: detectLanguage('', stringValue),
    content: stringValue,
  };
}

function extractStandaloneCodeBlock(raw: string): InterviewGeneratedCode | null {
  const blocks = collectFencedBlocks(raw);
  for (const block of blocks) {
    const content = block.content.trim();
    if (!content || looksLikeJsonObject(content) || !isLikelyCode(content)) {
      continue;
    }

    return {
      language: detectLanguage(block.info, content),
      content,
    };
  }

  return null;
}

function collectFencedBlocks(raw: string): FencedBlock[] {
  const regex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
  const blocks: FencedBlock[] = [];
  let match = regex.exec(raw);

  while (match) {
    blocks.push({
      info: match[1] || '',
      content: match[2] || '',
    });
    match = regex.exec(raw);
  }

  return blocks;
}

function findBalancedObjects(raw: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let startIndex = -1;
  let quote: string | null = null;
  let escaped = false;

  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quote) {
      if (current === '\\') {
        escaped = true;
      } else if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === '"' || current === "'") {
      quote = current;
      continue;
    }

    if (current === '{') {
      if (depth === 0) {
        startIndex = index;
      }
      depth += 1;
      continue;
    }

    if (current === '}') {
      depth -= 1;
      if (depth === 0 && startIndex >= 0) {
        const candidate = raw.slice(startIndex, index + 1);
        if (looksLikeJsonObject(candidate)) {
          results.push(candidate);
        }
        startIndex = -1;
      }
    }
  }

  return results;
}

function captureBalancedSegment(raw: string, startIndex: number, openChar: string, closeChar: string): string | null {
  let depth = 0;
  let quote: string | null = null;
  let escaped = false;

  for (let index = startIndex; index < raw.length; index += 1) {
    const current = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (quote) {
      if (current === '\\') {
        escaped = true;
      } else if (current === quote) {
        quote = null;
      }
      continue;
    }

    if (current === '"' || current === "'") {
      quote = current;
      continue;
    }

    if (current === openChar) {
      depth += 1;
    } else if (current === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(startIndex, index + 1);
      }
    }
  }

  return null;
}

function captureQuotedText(raw: string, startIndex: number): { raw: string; value: string; nextIndex: number } | null {
  const quote = raw[startIndex];
  if (quote !== '"' && quote !== "'") {
    return null;
  }

  let value = '';
  let index = startIndex + 1;

  while (index < raw.length) {
    const current = raw[index];
    if (current === '\\' && index + 1 < raw.length) {
      value += decodeEscapedCharacter(raw[index + 1], raw.slice(index + 1, index + 6));
      index += raw[index + 1] === 'u' ? 6 : 2;
      continue;
    }

    if (current === quote) {
      return {
        raw: raw.slice(startIndex, index + 1),
        value,
        nextIndex: index + 1,
      };
    }

    value += current;
    index += 1;
  }

  return null;
}

function parseClarificationQuestionArray(items: JsonValue[]): InterviewClarificationCandidate[] {
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

function parseGeneratedCodeFromObject(object: JsonObject | null): InterviewGeneratedCode | null {
  if (!object) {
    return null;
  }

  const rawContent = typeof object.content === 'string' ? object.content : '';
  const content = rawContent.trim();
  if (!content) {
    return null;
  }

  return {
    language: detectLanguage(typeof object.language === 'string' ? object.language : '', content),
    content,
  };
}

function parseStringValue(valueText: string): string | null {
  const trimmed = valueText.trim();
  if (!trimmed || /^null$/i.test(trimmed)) {
    return null;
  }

  const parsed = safelyParseValue(sanitizeJsonCandidate(trimmed));
  if (typeof parsed === 'string') {
    return parsed.trim();
  }

  if (isQuotedValue(trimmed)) {
    const quoted = captureQuotedText(trimmed, 0);
    return quoted ? quoted.value.trim() : null;
  }

  return trimmed.replace(/,\s*$/, '').trim();
}

function normalizeStringArray(items: JsonValue[] | string[], limit: number): string[] {
  const values = Array.isArray(items) ? items : [];
  return values
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, limit);
}

function safelyParseObject(raw: string): JsonObject | null {
  const parsed = safelyParseValue(raw);
  return isObject(parsed) ? parsed : null;
}

function safelyParseValue(raw: string): JsonValue | null {
  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    return null;
  }
}

function sanitizeJsonCandidate(raw: string): string {
  const normalized = normalizeRawText(raw).trim();
  const withoutFence = stripFenceWrapper(normalized);
  const sliced = sliceToLikelyJson(withoutFence);
  return sliced.replace(/,\s*([}\]])/g, '$1').trim();
}

function normalizeRawText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2018|\u2019/g, "'");
}

function stripFenceWrapper(raw: string): string {
  const match = raw.match(/^```[a-zA-Z0-9_-]*\n?([\s\S]*?)```$/);
  return match ? match[1].trim() : raw;
}

function sliceToLikelyJson(raw: string): string {
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1);
  }

  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return raw.slice(firstBracket, lastBracket + 1);
  }

  return raw;
}

function hasSupportedKeys(object: JsonObject): boolean {
  return Object.prototype.hasOwnProperty.call(object, 'mainLines')
    || Object.prototype.hasOwnProperty.call(object, 'pinnedFacts')
    || Object.prototype.hasOwnProperty.call(object, 'clarificationQuestions')
    || Object.prototype.hasOwnProperty.call(object, 'code');
}

function looksLikeJsonObject(value: string): boolean {
  return /(?:["'])?(?:mainLines|pinnedFacts|clarificationQuestions|code)(?:["'])?\s*:/.test(value);
}

function isLikelyCode(value: string): boolean {
  return /(^|\n)\s*(def |class |return |for |while |if |elif |else:|from |import )/.test(value)
    || /(^|\n)\s*[A-Za-z0-9_]+\s*=\s*.+/.test(value);
}

function detectLanguage(hint: string, content: string): InterviewGeneratedCode['language'] {
  const normalizedHint = hint.trim().toLowerCase();
  if (normalizedHint === 'python') {
    return 'python';
  }

  return /(^|\n)\s*(def |class |return |for |while |if |elif |else:|from |import )/.test(content)
    ? 'python'
    : 'unknown';
}

function collectQuotedValues(value: string): string[] {
  const results: string[] = [];
  let index = 0;

  while (index < value.length) {
    if (value[index] !== '"' && value[index] !== "'") {
      index += 1;
      continue;
    }

    const captured = captureQuotedText(value, index);
    if (!captured) {
      index += 1;
      continue;
    }

    results.push(captured.value);
    index = captured.nextIndex;
  }

  return results;
}

function trimArrayWrapper(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function isQuotedValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2
    && ((trimmed.startsWith('"') && trimmed.endsWith('"'))
      || (trimmed.startsWith("'") && trimmed.endsWith("'")));
}

function decodeEscapedCharacter(character: string, unicodeSlice: string): string {
  switch (character) {
    case 'n':
      return '\n';
    case 'r':
      return '\r';
    case 't':
      return '\t';
    case '"':
      return '"';
    case "'":
      return "'";
    case '\\':
      return '\\';
    case 'u': {
      const hex = unicodeSlice.slice(1, 5);
      return /^[0-9a-fA-F]{4}$/.test(hex)
        ? String.fromCharCode(Number.parseInt(hex, 16))
        : `\\${unicodeSlice}`;
    }
    default:
      return character;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function skipWhitespace(value: string, startIndex: number): number {
  let index = startIndex;
  while (index < value.length && /\s/.test(value[index])) {
    index += 1;
  }
  return index;
}

function readArray(object: JsonObject, key: string): JsonValue[] {
  const value = object[key];
  return Array.isArray(value) ? value : [];
}

function readObject(object: JsonObject, key: string): JsonObject | null {
  const value = object[key];
  return isObject(value) ? value : null;
}

function isObject(value: JsonValue | null): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
