import {
  InterviewClarificationCandidate,
  InterviewClarificationItem,
  InterviewSessionSnapshot,
  InterviewTranscriptSegment,
} from './types';

export class InterviewClarifyPlanner {
  public plan(
    snapshot: InterviewSessionSnapshot,
    candidates: InterviewClarificationCandidate[],
    recentTranscript: InterviewTranscriptSegment[]
  ): InterviewClarificationItem[] {
    const existingById = new Map(snapshot.clarificationItems.map((item) => [item.id, item]));
    const nextItems: InterviewClarificationItem[] = [];
    const seenIds = new Set<string>();

    for (const candidate of candidates) {
      const normalizedText = normalizeText(candidate.text);
      if (!normalizedText) {
        continue;
      }

      const id = buildClarificationId(normalizedText);
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);

      const existing = existingById.get(id);
      const asked = isLikelyAsked(normalizedText, recentTranscript);
      const answered = isLikelyAnswered(normalizedText, snapshot);
      const status = answered ? 'answered' : asked ? 'asked' : 'pending';

      nextItems.push({
        id,
        text: normalizedText,
        why: normalizeText(candidate.why),
        status,
        answer: existing?.answer || (answered ? findBestAnswer(normalizedText, snapshot) : ''),
        revision: snapshot.inputRevision,
        replacementReason: '',
      });
    }

    for (const existing of snapshot.clarificationItems) {
      if (seenIds.has(existing.id)) {
        continue;
      }

      const nextStatus = existing.status === 'answered' ? 'retired' : 'replaced';
      nextItems.push({
        ...existing,
        status: nextStatus,
        replacementReason: 'New context made this question lower priority.',
      });
    }

    return nextItems;
  }
}

export function buildClarificationId(text: string): string {
  const collapsed = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return collapsed || 'clarify-item';
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function isLikelyAsked(text: string, recentTranscript: InterviewTranscriptSegment[]): boolean {
  const userTurns = recentTranscript.filter((segment) => segment.final && segment.speaker.toLowerCase() === 'user');
  return userTurns.some((segment) => tokenOverlap(text, segment.text) >= 0.45);
}

function isLikelyAnswered(text: string, snapshot: InterviewSessionSnapshot): boolean {
  const haystacks = [
    snapshot.problemStatement,
    ...snapshot.constraints,
    ...snapshot.examples,
    ...snapshot.clarifiedFacts,
    ...snapshot.pinnedFacts,
  ];
  return haystacks.some((item) => tokenOverlap(text, item) >= 0.45);
}

function findBestAnswer(text: string, snapshot: InterviewSessionSnapshot): string {
  const haystacks = [
    ...snapshot.clarifiedFacts,
    ...snapshot.constraints,
    ...snapshot.examples,
    ...snapshot.pinnedFacts,
  ];

  let best = '';
  let bestScore = 0;

  for (const candidate of haystacks) {
    const score = tokenOverlap(text, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return bestScore >= 0.4 ? best : '';
}

function tokenOverlap(left: string, right: string): number {
  const leftTokens = extractTokens(left);
  const rightTokens = extractTokens(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let matches = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      matches += 1;
    }
  }

  return matches / leftTokens.size;
}

function extractTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  );
}
