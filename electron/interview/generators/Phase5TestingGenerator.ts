import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase5TestingGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p5_test', context);
    payload.changes = [
      ...(payload.quickQuestions.length > 0 ? [{ label: 'Dry run ready', detail: 'Testing and complexity notes are prepared.', severity: 'new' as const }] : []),
    ];
    return payload;
  }
}
