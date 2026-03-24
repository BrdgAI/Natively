import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase4CodingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p4_code', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'I am going to write the structure first and then fill in the core loop.',
        'I will keep the implementation aligned with the approach we just agreed on.',
      ];
    }
    if (!payload.code && context.snapshot.currentCode?.content) {
      payload.code = {
        language: 'python',
        content: context.snapshot.currentCode.content,
      };
    }
    return payload;
  }
}
