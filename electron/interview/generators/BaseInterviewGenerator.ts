import { buildPhasePrompt, INTERVIEW_GENERATOR_SYSTEM_PROMPT } from '../InterviewPrompts';
import { extractInterviewResponse } from '../InterviewResponseExtractor';
import {
  InterviewChatProvider,
  InterviewGeneratorContext,
  InterviewOverlayPayload,
  InterviewPhase,
} from '../types';

export abstract class BaseInterviewGenerator {
  constructor(protected readonly llmHelper: InterviewChatProvider) {}

  protected async generatePhasePayload(phase: InterviewPhase, context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const raw = await this.llmHelper.chat(
      buildPhasePrompt(phase, context),
      undefined,
      undefined,
      INTERVIEW_GENERATOR_SYSTEM_PROMPT
    );
    const generatedAt = Date.now();
    const extracted = extractInterviewResponse(raw);

    return {
      phase: phase === 'p1_intro' ? 'p2_clarify' : phase,
      phaseConfidence: context.snapshot.phaseConfidence,
      manualOverrideActive: Boolean(context.snapshot.manualOverridePhase),
      mainLines: extracted.mainLines,
      code: extracted.code || undefined,
      pinnedFacts: extracted.pinnedFacts,
      clarificationQuestions: extracted.clarificationQuestions.length > 0 ? extracted.clarificationQuestions : undefined,
      freshness: {
        transcriptUpdatedMsAgo: context.snapshot.lastTranscriptAt
          ? Math.max(0, generatedAt - context.snapshot.lastTranscriptAt)
          : Number.MAX_SAFE_INTEGER,
        screenshotUpdatedMsAgo: context.snapshot.lastScreenshotAt
          ? Math.max(0, generatedAt - context.snapshot.lastScreenshotAt)
          : null,
        generatedMsAgo: 0,
      },
      generatedAt,
      inputRevision: context.snapshot.inputRevision,
    };
  }
}
