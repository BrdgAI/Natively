import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase4CodingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p4_code', context);
    payload.changes = [
      ...(payload.codePanel?.content ? [{ label: payload.codePanel.mode === 'diff' ? 'Code patch ready' : 'Code ready', detail: 'Use the code panel and narration together while typing.', severity: 'updated' as const }] : []),
    ];
    return payload;
  }
}
