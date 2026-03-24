import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase6FollowUpGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p6_follow_up', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'I can make that follow-up change and then summarize the impact clearly.',
      ];
    }
    return payload;
  }
}
