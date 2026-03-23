import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase6ClosingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p6_close', context);
    payload.changes = [
      ...(payload.speakNow.length > 0 ? [{ label: 'Closing pack ready', detail: 'Final response and closing question are prepared.', severity: 'new' as const }] : []),
    ];
    return payload;
  }
}
