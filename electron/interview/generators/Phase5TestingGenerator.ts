import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase5TestingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p5_test', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        '[1] Let me walk one real example first so I can make sure the state changes the way I expect.',
        '[2] As I trace it, I will call out the key variables and how the main structure changes after each important step.',
        '[3] Next I want to check the edge cases that usually break this kind of solution, like empty input, tiny input, and the boundary values.',
        '[4] If I spot anything off while I am tracing it, I will fix it right away and rerun the same path.',
        '[5] Once the behavior looks good, I will close by restating the time and space costs and one tradeoff we could talk through next.',
      ];
    }
    return payload;
  }
}
