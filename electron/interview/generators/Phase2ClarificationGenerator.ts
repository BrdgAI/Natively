import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase2ClarificationGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p2_clarify', context);
    payload.changes = [
      ...(payload.writeNow.length > 0 ? [{ label: 'Constraint block ready', detail: 'Type the write-now section into the editor.', severity: 'new' as const }] : []),
    ];
    return payload;
  }
}
