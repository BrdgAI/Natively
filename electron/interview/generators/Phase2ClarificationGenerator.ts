import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import {
  InterviewGeneratorContext,
  InterviewOverlayPayload,
} from '../types';

export class Phase2ClarificationGenerator extends BaseInterviewGenerator {
  public generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    return this.generatePhasePayload('p2_clarify', context);
  }
}
