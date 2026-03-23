import { InterviewBufferEntry, InterviewOverlayPayload, InterviewPhase } from './types';

export class InterviewPrefetchBuffer {
  private entries = new Map<InterviewPhase, InterviewBufferEntry>();

  public set(phase: InterviewPhase, inputRevision: number, payload: InterviewOverlayPayload): void {
    this.entries.set(phase, {
      phase,
      inputRevision,
      payload,
      createdAt: Date.now(),
    });
  }

  public get(phase: InterviewPhase, inputRevision: number): InterviewBufferEntry | null {
    const entry = this.entries.get(phase);
    if (!entry) return null;
    if (entry.inputRevision !== inputRevision) return null;
    return entry;
  }

  public invalidatePhase(phase: InterviewPhase): void {
    this.entries.delete(phase);
  }

  public invalidateAll(): void {
    this.entries.clear();
  }
}
