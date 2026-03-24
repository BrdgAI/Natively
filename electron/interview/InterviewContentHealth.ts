import {
  InterviewClarificationItem,
  InterviewPhaseDocument,
} from './types';

const TERMINAL_PUNCTUATION_RE = /[.?!:;"')\]]$/;
const QUESTION_START_RE = /^(what|why|how|when|where|who|which|can|could|should|would|do|does|did|is|are|am|will|may)\b/i;
const LABEL_LINE_RE = /^(input|output|values|return|constraint|constraints|edge case|edge cases|example|examples|trace|note|notes|write in notes)\s*:/i;
const HANGING_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'by',
  'can',
  'could',
  'for',
  'from',
  'if',
  'in',
  'into',
  'is',
  'of',
  'on',
  'or',
  'should',
  'so',
  'that',
  'the',
  'then',
  'to',
  'using',
  'we',
  'when',
  'where',
  'which',
  'while',
  'with',
  'without',
  'would',
]);

const HANGING_PAIRS = new Set([
  'such as',
  'so that',
  'to the',
  'to be',
  'of the',
  'for the',
  'with the',
  'from the',
  'in the',
  'on the',
]);

export function normalizeInterviewLine(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isLikelyIncompleteLine(value: string): boolean {
  const normalized = normalizeInterviewLine(value);
  if (!normalized) {
    return false;
  }

  if (TERMINAL_PUNCTUATION_RE.test(normalized) || LABEL_LINE_RE.test(normalized)) {
    return false;
  }

  if (hasUnclosedDelimiter(normalized)) {
    return true;
  }

  const words = extractWords(normalized);
  if (words.length < 4) {
    return false;
  }

  const lastWord = words[words.length - 1];
  const trailingPair = words.slice(-2).join(' ');

  return QUESTION_START_RE.test(normalized)
    || HANGING_WORDS.has(lastWord)
    || HANGING_PAIRS.has(trailingPair);
}

export function isLikelyIncompleteMainLines(lines: string[]): boolean {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const normalized = normalizeInterviewLine(lines[index] || '');
    if (!normalized) {
      continue;
    }

    return isLikelyIncompleteLine(normalized);
  }

  return false;
}

export function isRepairableLinePair(left: string, right: string): boolean {
  const normalizedLeft = normalizeInterviewLine(left);
  const normalizedRight = normalizeInterviewLine(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()) {
    return false;
  }

  const [shorter, longer] = normalizedLeft.length <= normalizedRight.length
    ? [normalizedLeft, normalizedRight]
    : [normalizedRight, normalizedLeft];

  if (shorter.length < 16 || longer.length - shorter.length < 6) {
    return false;
  }

  if (!longer.toLowerCase().startsWith(shorter.toLowerCase())) {
    return false;
  }

  return isLikelyIncompleteLine(shorter)
    || QUESTION_START_RE.test(shorter)
    || hasUnclosedDelimiter(shorter);
}

export function isLikelyIncompletePhaseDocument(
  document: InterviewPhaseDocument,
  _clarificationItems: InterviewClarificationItem[] = []
): boolean {
  const lineTexts = document.mainFeed
    .filter((entry) => entry.type === 'line' && entry.text)
    .map((entry) => normalizeInterviewLine(entry.text || ''))
    .filter(Boolean);

  if (lineTexts.length === 0) {
    return false;
  }

  if (isLikelyIncompleteLine(lineTexts[lineTexts.length - 1])) {
    return true;
  }

  return false;
}

function hasUnclosedDelimiter(value: string): boolean {
  return hasMoreOpensThanCloses(value, '(', ')')
    || hasMoreOpensThanCloses(value, '[', ']')
    || hasMoreOpensThanCloses(value, '{', '}')
    || hasOddQuoteCount(value, '"')
    || hasOddQuoteCount(value, '\'');
}

function hasMoreOpensThanCloses(value: string, openChar: string, closeChar: string): boolean {
  let balance = 0;
  for (const character of value) {
    if (character === openChar) {
      balance += 1;
    } else if (character === closeChar) {
      balance -= 1;
    }
  }
  return balance > 0;
}

function hasOddQuoteCount(value: string, quoteChar: string): boolean {
  let count = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === quoteChar && value[index - 1] !== '\\') {
      count += 1;
    }
  }
  return count % 2 === 1;
}

function extractWords(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}
