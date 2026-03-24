import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase5TestingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p5_test', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'Let me dry run the solution with one concrete example first.',
        'After that I will cover the important edge cases and state the time and space complexity.',
      ];
    }
    return payload;
  }
}
