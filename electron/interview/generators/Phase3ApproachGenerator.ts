import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase3ApproachGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p3_approach', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'Let me start with the brute-force idea first and then move to the optimized approach.',
        'The optimized direction should match the constraints we just confirmed.',
        'I will state the final time and space complexity clearly before I code.',
      ];
    }
    return payload;
  }
}
