import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase2ClarificationGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p2_clarify', context);
    payload.changes = [
      ...(payload.writeNow.length > 0
        ? [{ label: 'Write block ready', detail: 'The notes format is ready for the document.', severity: 'new' as const }]
        : []),
      ...(payload.clarificationQuestions && payload.clarificationQuestions.length > 0
        ? [{ label: 'Clarify queue ready', detail: 'High-value missing questions are ranked for the next ask.', severity: 'new' as const }]
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
