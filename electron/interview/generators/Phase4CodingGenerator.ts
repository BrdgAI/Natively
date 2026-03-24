import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase4CodingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p4_code', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'def solve(...): because I want to lock the outer shape first and then fill it in top to bottom.',
        'if not items: return ... because I want the empty or trivial case handled before the real work starts.',
        'state = ... because the main loop is easier to reason about when the running state lives in one place.',
        'for item in items: because I want one clean pass through the input instead of scattering the logic.',
        'return result because I want the output construction to stay separate from the state updates in the middle.',
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
