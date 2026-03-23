import { InterviewMemoryLedger } from './InterviewMemoryLedger';
import { InterviewPhaseRouter } from './InterviewPhaseRouter';
import { InterviewModeConfig, InterviewPhase, InterviewScreenAnalysis, InterviewSessionSnapshot, InterviewTranscriptSegment } from './types';

export interface InterviewReplayResult {
  phases: InterviewPhase[];
  snapshot: InterviewSessionSnapshot;
}

export function replayInterviewTranscript(
  transcript: InterviewTranscriptSegment[],
  screenAnalyses: InterviewScreenAnalysis[] = [],
  config?: Partial<InterviewModeConfig>
): InterviewReplayResult {
  const ledger = new InterviewMemoryLedger();
  const router = new InterviewPhaseRouter();
  const phases: InterviewPhase[] = [];

  ledger.startSession('interview', config);

  for (const segment of transcript) {
    ledger.addTranscript(segment);
    if (!segment.final) {
      continue;
    }
    const result = router.infer(ledger.getSnapshot(), ledger.getRecentTranscript());
    ledger.setPhase(result.phase, result.confidence);
    phases.push(result.phase);
  }

  for (const analysis of screenAnalyses) {
    ledger.applyScreenAnalysis(analysis);
    const result = router.infer(ledger.getSnapshot(), ledger.getRecentTranscript());
    ledger.setPhase(result.phase, result.confidence);
    phases.push(result.phase);
  }

  return {
    phases,
    snapshot: ledger.getSnapshot(),
  };
}
