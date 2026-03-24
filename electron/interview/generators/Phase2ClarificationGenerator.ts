import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import {
  InterviewClarificationCandidate,
  InterviewGeneratorContext,
  InterviewOverlayPayload,
  InterviewSessionSnapshot,
} from '../types';

export class Phase2ClarificationGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p2_clarify', context);
    const clarificationQuestions = dedupeClarificationCandidates([
      ...(payload.clarificationQuestions || []),
      ...buildCanonicalClarificationCandidates(),
    ]);

    payload.clarificationQuestions = clarificationQuestions;
    payload.mainLines = payload.mainLines.length > 0
      ? dedupeStrings(payload.mainLines).slice(0, 18)
      : buildFallbackClarifyLines(context.snapshot, clarificationQuestions);
    payload.pinnedFacts = dedupeStrings([
      ...payload.pinnedFacts,
      context.snapshot.problemStatement,
      ...context.snapshot.constraints,
    ]).slice(0, 10);

    return payload;
  }
}

function buildCanonicalClarificationCandidates(): InterviewClarificationCandidate[] {
  return [
    {
      text: 'What is the maximum input size we should optimize for?',
      why: 'Input size determines whether brute force is acceptable.',
    },
    {
      text: 'What are the value ranges, and can values be negative or zero?',
      why: 'Value ranges affect edge handling and data-structure choice.',
    },
    {
      text: 'Can the input be empty or null, and can there be duplicates?',
      why: 'Those assumptions change guard clauses and correctness cases.',
    },
    {
      text: 'Is the input guaranteed to be sorted, or should I treat it as arbitrary order?',
      why: 'Sortedness changes the shape of the solution.',
    },
    {
      text: 'What exactly should be returned: index, value, count, boolean, or some other structure?',
      why: 'The return contract changes the implementation.',
    },
    {
      text: 'If multiple valid answers exist, should I return any one, all of them, or a specific one?',
      why: 'Multiple-answer behavior changes correctness.',
    },
    {
      text: 'Are there explicit time or space constraints, and which optimization matters more?',
      why: 'Constraint pressure determines the target complexity.',
    },
    {
      text: 'Should I assume null or empty input is not allowed unless specified otherwise?',
      why: 'Explicit edge assumptions prevent solving the wrong variant.',
    },
  ];
}

function buildFallbackClarifyLines(
  snapshot: InterviewSessionSnapshot,
  clarificationQuestions: InterviewClarificationCandidate[]
): string[] {
  const restatement = snapshot.problemStatement
    ? `Let me restate the problem first to make sure I have it right: ${snapshot.problemStatement}`
    : 'Let me restate the problem first so I can confirm the input, output, and constraints before coding.';

  const noteLines = [
    'Write in notes: input shape, value range, duplicates, sortedness, and null or empty behavior.',
    'Write in notes: exact return contract, edge cases, and optimization target.',
  ];

  return dedupeStrings([
    restatement,
    'I want to ask a few quick clarification questions before I choose an approach.',
    ...clarificationQuestions.slice(0, 6).map((item) => item.text),
    ...noteLines,
    snapshot.examples[0] ? `I can trace this small example first: ${snapshot.examples[0]}` : 'I can trace one small example out loud before I move on.',
  ]).slice(0, 18);
}

function dedupeClarificationCandidates(items: InterviewClarificationCandidate[]): InterviewClarificationCandidate[] {
  const seen = new Set<string>();
  const result: InterviewClarificationCandidate[] = [];

  for (const item of items) {
    const text = normalize(item.text);
    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({
      text,
      why: normalize(item.why),
    });
  }

  return result.slice(0, 10);
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = normalize(item);
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

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
