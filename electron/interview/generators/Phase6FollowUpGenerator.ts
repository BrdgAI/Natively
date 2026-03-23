import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase6FollowUpGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p6_follow_up', context);
    payload.changes = [
      ...(payload.codePanel?.content
        ? [{ label: 'Follow-up patch ready', detail: 'A focused code diff is ready for the change request.', severity: 'updated' as const }]
        : payload.speakNow.length > 0
          ? [{ label: 'Follow-up response ready', detail: 'The current follow-up answer is ready in the main lane.', severity: 'new' as const }]
          : []),
    ]
    payload.updateSummary = payload.updateSummary || {
      status: payload.codePanel?.content ? 'updated' : 'partial',
      updatedSections: payload.codePanel?.content ? ['Main', 'Code'] : ['Main'],
      message: payload.codePanel?.content ? 'Updated: Main, Code' : 'Updated: Main',
      at: payload.generatedAt,
    }
    return payload;
  }
}
