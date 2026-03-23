import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase3ApproachGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p3_approach', context);
    payload.changes = [
      ...(payload.speakNow.length > 0
        ? [{ label: 'Approach pack ready', detail: 'The end-to-end explanation is ready in one pass.', severity: 'new' as const }]
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
