import { LLMHelper } from '../LLMHelper';
import { buildVisionPrompt, INTERVIEW_VISION_SYSTEM_PROMPT } from './InterviewPrompts';
import { InterviewPhase, InterviewScreenAnalysis, InterviewTranscriptSegment } from './types';

export class InterviewVisionSync {
  constructor(private readonly llmHelper: LLMHelper) {}

  public async analyze(
    phase: InterviewPhase,
    screenshotPath: string,
    screenshotPreview: string | undefined,
    recentTranscript: InterviewTranscriptSegment[]
  ): Promise<InterviewScreenAnalysis> {
    const prompt = buildVisionPrompt(
      phase,
      recentTranscript
        .slice(-10)
        .map((item) => `[${item.speaker.toUpperCase()}] ${item.text}`)
        .join('\n')
    );

    const raw = await this.llmHelper.chat(prompt, [screenshotPath], undefined, INTERVIEW_VISION_SYSTEM_PROMPT);
    const parsed = parseJson(raw);

    return {
      screenshotPath,
      screenshotPreview,
      capturedAt: Date.now(),
      problemStatement: typeof parsed.problemStatement === 'string' ? parsed.problemStatement.trim() : undefined,
      givenConstraints: normalizeStringArray(parsed.givenConstraints),
      examples: normalizeStringArray(parsed.examples),
      visibleQuestions: normalizeStringArray(parsed.visibleQuestions),
      currentCode: typeof parsed.currentCode === 'string' ? parsed.currentCode : undefined,
      dryRunInput: typeof parsed.dryRunInput === 'string' ? parsed.dryRunInput : undefined,
      hints: normalizeStringArray(parsed.hints),
      likelyMistakes: normalizeStringArray(parsed.likelyMistakes),
      extractedTests: normalizeStringArray(parsed.extractedTests),
    };
  }
}

function parseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return {};
    }
    try {
      return JSON.parse(match[0]);
    } catch {
      return {};
    }
  }
}

function normalizeStringArray(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 10);
}
