import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase5TestingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p5_test', context);
    payload.changes = [
      ...(payload.speakNow.length > 0
        ? [{ label: 'Dry run ready', detail: 'The active dry run and edge-case story are prepared.', severity: 'new' as const }]
        : []),
    ]
    payload.updateSummary = payload.updateSummary || {
      status: 'updated',
      updatedSections: ['Main'],
      message: 'Updated: Main',
      at: payload.generatedAt,
    }
    return payload;
  }
}
