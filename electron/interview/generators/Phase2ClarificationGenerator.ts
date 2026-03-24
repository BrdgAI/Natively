import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import {
  MAX_INTERVIEW_CLARIFICATION_QUESTIONS,
  MAX_INTERVIEW_MAIN_LINES,
  MAX_INTERVIEW_PINNED_FACTS,
} from '../InterviewPromptLimits';
import {
  InterviewClarificationCandidate,
  InterviewGeneratorContext,
  InterviewOverlayPayload,
} from '../types';

export class Phase2ClarificationGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p2_clarify', context);
    const clarificationQuestions = dedupeClarificationCandidates(
      payload.clarificationQuestions && payload.clarificationQuestions.length > 0
        ? payload.clarificationQuestions
        : buildFallbackClarificationCandidates(context)
    );

    payload.clarificationQuestions = clarificationQuestions.length > 0 ? clarificationQuestions : undefined;
    payload.mainLines = payload.mainLines.length > 0
      ? dedupeStrings(payload.mainLines).slice(0, MAX_INTERVIEW_MAIN_LINES)
      : buildFallbackClarifyLines(context, clarificationQuestions);
    payload.pinnedFacts = dedupeStrings([
      ...payload.pinnedFacts,
      context.snapshot.problemStatement,
      ...context.snapshot.constraints,
      ...(context.screenAnalysis?.givenConstraints || []),
    ]).slice(0, MAX_INTERVIEW_PINNED_FACTS);

    return payload;
  }
}

function buildFallbackClarificationCandidates(
  context: InterviewGeneratorContext
): InterviewClarificationCandidate[] {
  const combinedContext = collectContextText(context);
  const candidates: InterviewClarificationCandidate[] = [];

  if (!matchesAny(combinedContext, [/\b(?:10\^\d+|10\^|n\s*[<>=]|m\s*[<>=]|k\s*[<>=])\b/i, /\b(?:maximum|max|bound|bounds|limit|limits|input size|size range|length)\b/i])) {
    candidates.push({
      text: 'What is the maximum input size we should optimize for?',
      why: 'The input bound determines whether brute force is acceptable.',
    });
  }

  if (looksLikeGraphProblem(combinedContext) && !matchesAny(combinedContext, [/\bdirected\b/i, /\bundirected\b/i, /\bweighted\b/i, /\bweights?\b/i])) {
    candidates.push({
      text: 'Should I treat the graph as directed or undirected, and are the edges weighted?',
      why: 'Those graph properties change the traversal and data-structure choice.',
    });
  }

  if (looksLikeSequentialProblem(combinedContext) && !matchesAny(combinedContext, [/\bsorted\b/i, /\bunsorted\b/i, /\barbitrary order\b/i])) {
    candidates.push({
      text: 'Should I assume the input is sorted, or should I treat it as arbitrary order?',
      why: 'Sortedness changes which linear-time or binary-search strategies are available.',
    });
  }

  if (!matchesAny(combinedContext, [/\bnegative\b/i, /\bnon-negative\b/i, /\bduplicates?\b/i, /\bdistinct\b/i, /\bvalue range\b/i, /\bzero\b/i])) {
    candidates.push({
      text: 'What are the value ranges, and can values be negative, zero, or duplicated?',
      why: 'Value properties affect both edge handling and the shape of the solution.',
    });
  }

  if (!matchesAny(combinedContext, [/\breturn\b/i, /\boutput\b/i, /\bindices?\b/i, /\bvalues?\b/i, /\bcount\b/i, /\bboolean\b/i, /\btrue\b/i, /\bfalse\b/i, /\blist\b/i, /\barray\b/i, /\bnull\b/i])) {
    candidates.push({
      text: 'What exactly should be returned: an index, a value, a count, a boolean, or a collection?',
      why: 'The return contract changes both correctness and implementation details.',
    });
  }

  if (!matchesAny(combinedContext, [/\bexactly one\b/i, /\bmultiple\b/i, /\bany one\b/i, /\ball of them\b/i, /\bno solution\b/i, /\bnot found\b/i, /\b-1\b/i, /\bempty list\b/i, /\breturn null\b/i])) {
    candidates.push({
      text: 'If there are multiple valid answers or no valid answer, what should I return?',
      why: 'That fallback contract changes stopping conditions and edge handling.',
    });
  }

  if (!matchesAny(combinedContext, [/\btime\b/i, /\bspace\b/i, /\boptimi[sz]e\b/i, /\bcomplexity\b/i])) {
    candidates.push({
      text: 'Are there explicit time or space constraints, and which optimization matters more?',
      why: 'The optimization priority determines the target complexity.',
    });
  }

  if (!matchesAny(combinedContext, [/\bempty\b/i, /\bnull\b/i, /\bsingle element\b/i, /\bboundary\b/i, /\bedge case\b/i])) {
    candidates.push({
      text: 'How should I handle empty, null, or single-element inputs if they are allowed?',
      why: 'The default edge-case contract affects the guard clauses.',
    });
  }

  return candidates.slice(0, MAX_INTERVIEW_CLARIFICATION_QUESTIONS);
}

function buildFallbackClarifyLines(
  context: InterviewGeneratorContext,
  clarificationQuestions: InterviewClarificationCandidate[]
): string[] {
  const snapshot = context.snapshot;
  const restatement = snapshot.problemStatement
    ? `Let me restate the problem first to make sure I have it right: ${snapshot.problemStatement}`
    : 'Let me restate the problem first so I can confirm the input, output, and constraints before coding.';

  const noteLines = buildFallbackDocCommentLines(context);

  return dedupeStrings([
    restatement,
    'The main thing I want to confirm is what the input looks like, what exact result we need, and which constraints matter most.',
    'Let me ask a few clarifying questions before I start thinking about an approach.',
    ...clarificationQuestions.slice(0, 6).flatMap((item) => [item.text, item.why]),
    ...noteLines,
    snapshot.examples[0]
      ? `For example, if we use ${snapshot.examples[0]}, I want to make sure my expected output matches the intended behavior.`
      : 'I also want to walk one small concrete example to make sure my mental model matches the prompt.',
    'Does that match what you would expect?',
  ]).slice(0, MAX_INTERVIEW_MAIN_LINES);
}

function buildFallbackDocCommentLines(context: InterviewGeneratorContext): string[] {
  const snapshot = context.snapshot;
  const constraints = dedupeStrings([
    ...snapshot.constraints,
    ...(context.screenAnalysis?.givenConstraints || []),
  ]);

  return [
    `Input: ${snapshot.problemStatement || 'confirm the structure and size range of the input.'}`,
    `Values: ${constraints[0] || 'confirm value ranges, duplicates, and whether negatives or zero are allowed.'}`,
    `Constraints: ${constraints[1] || 'confirm the target complexity and which optimization matters more.'}`,
    'Return: confirm the exact output format and what to do if there is no valid answer.',
    'Edge cases: confirm empty, null, single-element, and boundary-condition behavior.',
  ];
}

function collectContextText(context: InterviewGeneratorContext): string {
  return [
    context.snapshot.problemStatement,
    ...context.snapshot.constraints,
    ...context.snapshot.examples,
    ...context.snapshot.clarifiedFacts,
    ...context.snapshot.pinnedFacts,
    ...(context.screenAnalysis?.givenConstraints || []),
    ...(context.screenAnalysis?.examples || []),
    ...(context.screenAnalysis?.visibleQuestions || []),
    ...(context.screenAnalysis?.hints || []),
  ]
    .filter(Boolean)
    .join(' ');
}

function looksLikeGraphProblem(value: string): boolean {
  return matchesAny(value, [/\bgraph\b/i, /\bedges?\b/i, /\bnodes?\b/i, /\bvertices\b/i, /\badjacency\b/i, /\bneighbors?\b/i]);
}

function looksLikeSequentialProblem(value: string): boolean {
  return matchesAny(value, [/\barray\b/i, /\blist\b/i, /\bnums\b/i, /\bsequence\b/i, /\bstring\b/i, /\bsubstring\b/i, /\bsubarray\b/i]);
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
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

  return result.slice(0, MAX_INTERVIEW_CLARIFICATION_QUESTIONS);
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
