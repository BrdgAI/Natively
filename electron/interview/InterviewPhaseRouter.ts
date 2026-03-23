import { InterviewPhase, InterviewSessionSnapshot, InterviewTranscriptSegment } from './types';

const PHASE_SEQUENCE: InterviewPhase[] = [
  'p2_clarify',
  'p3_approach',
  'p4_code',
  'p5_test',
  'p6_follow_up',
];

export class InterviewPhaseRouter {
  public infer(snapshot: InterviewSessionSnapshot, recentTranscript: InterviewTranscriptSegment[]): { phase: InterviewPhase; confidence: number } {
    if (snapshot.manualOverridePhase) {
      return { phase: snapshot.manualOverridePhase, confidence: 1 };
    }

    const finalTurns = recentTranscript.filter((item) => item.final);
    const joined = finalTurns.slice(-10).map((item) => item.text.toLowerCase()).join('\n');

    if (/(change the code|modify the code|can you update|what if we also|what if i want|return none|instead of an empty list|follow up|what happens if|explain that part|walk me through that line|any questions for me|questions for me|wrap up|thanks for your time|close out|final question)/.test(joined)) {
      return { phase: 'p6_follow_up', confidence: 0.95 };
    }

    if (/(time complexity|space complexity|edge case|dry run|walk through an example|test case|complexity analysis)/.test(joined)) {
      return { phase: 'p5_test', confidence: 0.9 };
    }

    if (snapshot.currentCode?.content || /(implement|write code|start coding|let'?s code|function signature|def |class )/.test(joined)) {
      return { phase: 'p4_code', confidence: snapshot.currentCode?.content ? 0.92 : 0.82 };
    }

    if (snapshot.approachSummary.length > 0 || /(brute force|optimi[sz]e|approach|tradeoff|time complexity|space complexity|hash map|two pointers|binary search|dfs|bfs|dijkstra|dynamic programming)/.test(joined)) {
      return { phase: 'p3_approach', confidence: snapshot.approachSummary.length > 0 ? 0.86 : 0.74 };
    }

    if (snapshot.problemStatement || /(clarify|constraints|examples?|input|output|what should we return|can values be|duplicates|sorted)/.test(joined)) {
      return { phase: 'p2_clarify', confidence: snapshot.problemStatement ? 0.82 : 0.68 };
    }

    return { phase: snapshot.phase === 'p1_intro' ? 'p2_clarify' : snapshot.phase, confidence: Math.max(snapshot.phaseConfidence, 0.55) };
  }

  public shift(current: InterviewPhase | null, direction: -1 | 1): InterviewPhase {
    const normalized = current && PHASE_SEQUENCE.includes(current) ? current : 'p2_clarify';
    const index = PHASE_SEQUENCE.indexOf(normalized);
    const nextIndex = Math.min(PHASE_SEQUENCE.length - 1, Math.max(0, index + direction));
    return PHASE_SEQUENCE[nextIndex];
  }
}
