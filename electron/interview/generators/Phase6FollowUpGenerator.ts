import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase6FollowUpGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p6_follow_up', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'I would make that follow-up change by adjusting the core state update and then I would call out what that does to the complexity.',
        'The tradeoff there is usually a little more bookkeeping in exchange for cleaner behavior on the new requirement.',
      ];
    }
    return payload;
  }
}
