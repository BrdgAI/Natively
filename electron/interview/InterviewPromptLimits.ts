import { InterviewPhase, RenderableInterviewPhase } from './types';

export const INTERVIEW_MAIN_LINE_LIMITS: Record<RenderableInterviewPhase, number> = {
  p2_clarify: 24,
  p3_approach: 40,
  p4_code: 24,
  p5_test: 42,
  p6_follow_up: 24,
};

export function getMaxInterviewMainLines(phase?: InterviewPhase | RenderableInterviewPhase | null): number {
  const normalizedPhase = !phase || phase === 'p1_intro' ? 'p2_clarify' : phase;
  return INTERVIEW_MAIN_LINE_LIMITS[normalizedPhase];
}

export const MAX_INTERVIEW_PINNED_FACTS = 10;
export const MAX_INTERVIEW_CLARIFICATION_QUESTIONS = 10;
