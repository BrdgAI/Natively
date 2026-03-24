import {
  InterviewFollowUpState,
  InterviewSavedContext,
  InterviewScreenAnalysis,
  InterviewSessionSnapshot,
  InterviewTranscriptSegment,
} from './types';

export class InterviewContextDeltaBuilder {
  public buildSavedScreenContext(
    previous: InterviewSavedContext,
    analysis: InterviewScreenAnalysis | null
  ): InterviewSavedContext {
    if (!analysis) {
      return cloneSavedContext(previous);
    }

    const lines = dedupeLines([
      analysis.problemStatement ? `Problem: ${analysis.problemStatement}` : '',
      analysis.givenConstraints && analysis.givenConstraints.length > 0 ? `Constraints: ${analysis.givenConstraints.join(' | ')}` : '',
      analysis.hints && analysis.hints.length > 0 ? `Hints: ${analysis.hints.join(' | ')}` : '',
      analysis.dryRunInput ? `Dry run: ${analysis.dryRunInput}` : '',
      analysis.extractedTests && analysis.extractedTests.length > 0 ? `Tests: ${analysis.extractedTests.join(' | ')}` : '',
      analysis.likelyMistakes && analysis.likelyMistakes.length > 0 ? `Observations: ${analysis.likelyMistakes.join(' | ')}` : '',
    ]).slice(0, 4);

    if (lines.length === 0) {
      return cloneSavedContext(previous);
    }

    return {
      title: 'Last screen context saved',
      lines,
      updatedAt: analysis.capturedAt,
    };
  }

  public buildSavedNormalContext(
    previous: InterviewSavedContext,
    snapshot: InterviewSessionSnapshot,
    recentTranscript: InterviewTranscriptSegment[]
  ): InterviewSavedContext {
    const transcriptLines = recentTranscript
      .filter((item) => item.final && item.text.trim())
      .slice(-3)
      .map((item) => `[${item.speaker.toUpperCase()}] ${item.text.trim()}`);

    const followUpLines = formatFollowUp(snapshot.activeFollowUp);
    const lines = dedupeLines([...transcriptLines, ...followUpLines]).slice(0, 4);

    if (lines.length === 0) {
      return cloneSavedContext(previous);
    }

    return {
      title: 'Last normal context saved',
      lines,
      updatedAt: snapshot.lastTranscriptAt || previous.updatedAt,
    };
  }
}

function formatFollowUp(followUp: InterviewFollowUpState | null): string[] {
  if (!followUp || !followUp.request.trim()) {
    return [];
  }

  return [
    `Follow-up: ${followUp.request}`,
    followUp.impactedArea ? `Impact: ${followUp.impactedArea}` : '',
  ].filter(Boolean);
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const normalized = line.trim().replace(/\s+/g, ' ');
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

function cloneSavedContext(savedContext: InterviewSavedContext): InterviewSavedContext {
  return {
    title: savedContext.title,
    lines: [...savedContext.lines],
    updatedAt: savedContext.updatedAt,
  };
}
