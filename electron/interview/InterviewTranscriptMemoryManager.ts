import {
  InterviewPhase,
  InterviewTranscriptCompactionPlan,
  InterviewTranscriptEpoch,
  InterviewTranscriptMemoryStats,
  InterviewTranscriptSegment,
} from './types';

export interface InterviewTranscriptMemoryConfig {
  finalTranscriptCap: number;
  compactionTrigger: number;
  compactionTarget: number;
  compactionChunkSize: number;
  promptEpochLimit: number;
  visionEpochLimit: number;
  storedEpochLimit: number;
}

const DEFAULT_CONFIG: InterviewTranscriptMemoryConfig = {
  finalTranscriptCap: 1200,
  compactionTrigger: 1000,
  compactionTarget: 650,
  compactionChunkSize: 300,
  promptEpochLimit: 3,
  visionEpochLimit: 2,
  storedEpochLimit: 12,
};

export class InterviewTranscriptMemoryManager {
  constructor(private readonly config: InterviewTranscriptMemoryConfig = DEFAULT_CONFIG) {}

  public getConfig(): InterviewTranscriptMemoryConfig {
    return { ...this.config };
  }

  public trimFinalTranscript(finalTranscript: InterviewTranscriptSegment[]): InterviewTranscriptSegment[] {
    return finalTranscript.slice(-this.config.finalTranscriptCap).map(cloneTranscriptSegment);
  }

  public needsCompaction(
    finalTranscript: InterviewTranscriptSegment[],
    epochs: InterviewTranscriptEpoch[]
  ): boolean {
    if (finalTranscript.length <= this.config.compactionTarget) {
      return false;
    }

    return finalTranscript.length >= this.config.compactionTrigger || epochs.length > 0;
  }

  public planCompaction(
    finalTranscript: InterviewTranscriptSegment[],
    epochs: InterviewTranscriptEpoch[]
  ): InterviewTranscriptCompactionPlan | null {
    if (!this.needsCompaction(finalTranscript, epochs)) {
      return null;
    }

    const removableCount = finalTranscript.length - this.config.compactionTarget;
    if (removableCount <= 0) {
      return null;
    }

    const compactCount = removableCount > this.config.compactionChunkSize
      ? this.config.compactionChunkSize
      : removableCount;
    const compactedSegments = finalTranscript
      .slice(0, compactCount)
      .map(cloneTranscriptSegment);

    if (compactedSegments.length === 0) {
      return null;
    }

    const firstSegment = compactedSegments[0];
    const lastSegment = compactedSegments[compactedSegments.length - 1];

    return {
      id: createPlanId(compactedSegments),
      createdAt: Date.now(),
      startIndex: 0,
      endIndexExclusive: compactedSegments.length,
      compactedSegments,
      fromTimestamp: firstSegment.timestamp,
      toTimestamp: lastSegment.timestamp,
    };
  }

  public appendEpoch(
    epochs: InterviewTranscriptEpoch[],
    epoch: InterviewTranscriptEpoch
  ): InterviewTranscriptEpoch[] {
    const nextEpochs = [...epochs.map(cloneTranscriptEpoch), cloneTranscriptEpoch(epoch)];
    return nextEpochs.length > this.config.storedEpochLimit
      ? nextEpochs.slice(-this.config.storedEpochLimit)
      : nextEpochs;
  }

  public buildStats(
    finalTranscript: InterviewTranscriptSegment[],
    epochs: InterviewTranscriptEpoch[]
  ): InterviewTranscriptMemoryStats {
    return {
      finalSegmentCount: finalTranscript.length,
      epochCount: epochs.length,
      compactedSegmentCount: epochs.reduce((total, epoch) => total + epoch.compactedSegmentCount, 0),
      lastCompactedAt: epochs.length > 0 ? epochs[epochs.length - 1].createdAt : null,
    };
  }

  public getPromptEpochs(epochs: InterviewTranscriptEpoch[]): InterviewTranscriptEpoch[] {
    return epochs.slice(-this.config.promptEpochLimit).map(cloneTranscriptEpoch);
  }

  public getVisionEpochs(
    epochs: InterviewTranscriptEpoch[],
    phase: InterviewPhase,
    problemStatement: string
  ): InterviewTranscriptEpoch[] {
    if (epochs.length === 0) {
      return [];
    }

    const normalizedPhase = phase === 'p1_intro' ? 'p2_clarify' : phase;
    const thinProblemStatement = !problemStatement.trim();
    const shouldInclude = thinProblemStatement
      || normalizedPhase === 'p4_code'
      || normalizedPhase === 'p5_test'
      || normalizedPhase === 'p6_follow_up';

    return shouldInclude
      ? epochs.slice(-this.config.visionEpochLimit).map(cloneTranscriptEpoch)
      : [];
  }
}

function createPlanId(compactedSegments: InterviewTranscriptSegment[]): string {
  const firstSegment = compactedSegments[0];
  const lastSegment = compactedSegments[compactedSegments.length - 1];
  return [
    firstSegment.timestamp,
    lastSegment.timestamp,
    compactedSegments.length,
    Date.now(),
  ].join(':');
}

function cloneTranscriptSegment(segment: InterviewTranscriptSegment): InterviewTranscriptSegment {
  return {
    speaker: segment.speaker,
    text: segment.text,
    timestamp: segment.timestamp,
    final: segment.final,
    confidence: segment.confidence,
  };
}

function cloneTranscriptEpoch(epoch: InterviewTranscriptEpoch): InterviewTranscriptEpoch {
  return {
    id: epoch.id,
    createdAt: epoch.createdAt,
    fromTimestamp: epoch.fromTimestamp,
    toTimestamp: epoch.toTimestamp,
    compactedSegmentCount: epoch.compactedSegmentCount,
    dominantPhases: [...epoch.dominantPhases],
    summaryLines: [...epoch.summaryLines],
    carryForwardFacts: [...epoch.carryForwardFacts],
    openQuestions: [...epoch.openQuestions],
    source: epoch.source,
  };
}
