import { InterviewBufferEntry, InterviewOverlayPayload, RenderableInterviewPhase } from './types';

export class InterviewPrefetchBuffer {
  private entries = new Map<RenderableInterviewPhase, InterviewBufferEntry>();

  public set(phase: RenderableInterviewPhase, inputRevision: number, payload: InterviewOverlayPayload): void {
    this.entries.set(phase, {
      phase,
      inputRevision,
      payload,
      createdAt: Date.now(),
    });
  }

  public get(phase: RenderableInterviewPhase, inputRevision: number): InterviewBufferEntry | null {
    const entry = this.entries.get(phase);
    if (!entry) return null;
    if (entry.inputRevision !== inputRevision) return null;
    return entry;
  }

  public invalidatePhase(phase: RenderableInterviewPhase): void {
    this.entries.delete(phase);
  }

  public invalidateAll(): void {
    this.entries.clear();
  }
}
