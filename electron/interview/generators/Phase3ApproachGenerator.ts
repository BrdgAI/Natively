import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase3ApproachGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p3_approach', context);
    payload.changes = [
      ...(payload.speakNow.length > 0 ? [{ label: 'Approach pack ready', detail: 'Brute force, optimized path, and complexity are prepared.', severity: 'new' as const }] : []),
    ];
    return payload;
  }
}
