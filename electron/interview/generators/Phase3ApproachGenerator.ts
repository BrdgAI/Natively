import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import { InterviewGeneratorContext, InterviewOverlayPayload } from '../types';

export class Phase3ApproachGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p3_approach', context);
    if (payload.mainLines.length === 0) {
      payload.mainLines = [
        'I would start with the dumb version first so we have a clean baseline to compare against.',
        'That version usually means checking every candidate directly, which works but gets expensive fast once n grows.',
        'From there I would cross off the families that need structure we do not have or that miss the target bound.',
        'The candidates I would keep are the ones that still fit both the problem shape and the runtime we want.',
        'I would go with the simplest option that hits the constraint cleanly, because that gives us fewer moving parts in code.',
        'Before I write anything, I would do one quick time and space sanity check against the biggest input we were given.',
      ];
    }
    return payload;
  }
}
