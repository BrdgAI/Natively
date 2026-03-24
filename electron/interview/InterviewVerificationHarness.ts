import { InterviewOrchestrator } from './InterviewOrchestrator';
import {
  InterviewCaptureProvider,
  InterviewChatProvider,
  InterviewPhase,
  InterviewTranscriptMemoryStats,
  InterviewTranscriptSegment,
} from './types';

const LONG_SESSION_FINAL_SEGMENT_COUNT = 1050;
const EXPECTED_FINAL_SEGMENT_COUNT_AFTER_COMPACTION = 650;
const EXPECTED_COMPACTED_SEGMENT_COUNT = 400;
const EXPECTED_EPOCH_COUNT = 2;
const WAIT_TIMEOUT_MS = 5000;
const WAIT_INTERVAL_MS = 20;
const EARLY_MEMORY_FACT = 'Return indices, not values.';

type SummaryMode = 'success' | 'throw';

export interface InterviewVerificationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export interface InterviewVerificationScenarioResult {
  name: string;
  passed: boolean;
  checks: InterviewVerificationCheck[];
  transcriptMemory: InterviewTranscriptMemoryStats;
}

export interface InterviewVerificationReport {
  passed: boolean;
  scenarios: InterviewVerificationScenarioResult[];
}

export async function runInterviewMemoryVerification(): Promise<InterviewVerificationReport> {
  const scenarios = [
    await runScenario('llm-summary-success', 'success'),
    await runScenario('llm-summary-fallback', 'throw'),
  ];

  return {
    passed: scenarios.every((scenario) => scenario.passed),
    scenarios,
  };
}

class VerificationLLMHelper implements InterviewChatProvider {
  private readonly generatorPrompts: string[] = [];
  private readonly visionPrompts: string[] = [];
  private readonly summaryPrompts: string[] = [];

  constructor(private readonly summaryMode: SummaryMode) {}

  public async chat(
    message: string,
    imagePaths?: string[],
    _context?: string,
    systemPromptOverride?: string
  ): Promise<string> {
    if (systemPromptOverride?.includes('You summarize earlier live interview transcript chunks')) {
      this.summaryPrompts.push(message);
      if (this.summaryMode === 'throw') {
        throw new Error('Simulated epoch summarizer outage');
      }

      return JSON.stringify({
        summaryLines: [
          'Earlier discussion confirmed the return contract.',
          'The candidate committed to a hash map approach.',
        ],
        carryForwardFacts: [
          EARLY_MEMORY_FACT,
          'Exactly one answer exists.',
        ],
        openQuestions: [
          'Whether duplicates are allowed.',
        ],
      });
    }

    if (imagePaths && imagePaths.length > 0) {
      this.visionPrompts.push(message);
      return JSON.stringify({
        problemStatement: 'Two Sum',
        givenConstraints: ['Exactly one answer exists.'],
        examples: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
        visibleQuestions: ['What is the time complexity?'],
        hints: ['Keep the solution O n time.'],
        currentCode: 'def two_sum(nums, target):\n    seen = {}\n    for index, value in enumerate(nums):\n        complement = target - value\n        if complement in seen:\n            return [seen[complement], index]\n        seen[value] = index\n    return []',
        dryRunInput: 'nums = [2,7,11,15], target = 9',
        likelyMistakes: [],
        extractedTests: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
      });
    }

    this.generatorPrompts.push(message);
    return JSON.stringify(buildGeneratorResponse(readPhase(message)));
  }

  public getLatestGeneratorPrompt(): string {
    return this.generatorPrompts.length > 0
      ? this.generatorPrompts[this.generatorPrompts.length - 1]
      : '';
  }

  public getLatestVisionPrompt(): string {
    return this.visionPrompts.length > 0
      ? this.visionPrompts[this.visionPrompts.length - 1]
      : '';
  }

  public getSummaryPromptCount(): number {
    return this.summaryPrompts.length;
  }
}

async function runScenario(
  name: string,
  summaryMode: SummaryMode
): Promise<InterviewVerificationScenarioResult> {
  const llmHelper = new VerificationLLMHelper(summaryMode);
  const orchestrator = new InterviewOrchestrator(llmHelper, createCaptureProvider());

  orchestrator.startSession('interview', { codingLanguage: 'python' });

  for (const segment of buildLongInterviewTranscript()) {
    orchestrator.handleTranscript(segment);
  }

  const compactionSettled = await waitFor(() => {
    const stats = orchestrator.getState().transcriptMemory;
    return stats.epochCount >= EXPECTED_EPOCH_COUNT
      && stats.compactedSegmentCount >= EXPECTED_COMPACTED_SEGMENT_COUNT
      && stats.finalSegmentCount <= EXPECTED_FINAL_SEGMENT_COUNT_AFTER_COMPACTION;
  }, WAIT_TIMEOUT_MS);

  orchestrator.shiftManualPhase(1);
  orchestrator.shiftManualPhase(1);

  const nextSnapshot = await orchestrator.handleNext();
  const syncSnapshot = await orchestrator.handleSync();
  const transcriptMemory = orchestrator.getState().transcriptMemory;
  const latestGeneratorPrompt = llmHelper.getLatestGeneratorPrompt();
  const latestVisionPrompt = llmHelper.getLatestVisionPrompt();
  const checks = [
    buildCheck(
      'Compaction reached steady state',
      compactionSettled,
      `finals=${transcriptMemory.finalSegmentCount}, epochs=${transcriptMemory.epochCount}, compacted=${transcriptMemory.compactedSegmentCount}`
    ),
    buildCheck(
      'Epoch summarization ran',
      llmHelper.getSummaryPromptCount() > 0,
      `summaryPrompts=${llmHelper.getSummaryPromptCount()}`
    ),
    buildCheck(
      'Generator prompt includes earlier memory',
      latestGeneratorPrompt.includes('Earlier interview memory:')
        && includesNormalizedText(latestGeneratorPrompt, EARLY_MEMORY_FACT),
      latestGeneratorPrompt.includes('Earlier interview memory:')
        ? 'Earlier memory block present in generator prompt.'
        : 'Generator prompt did not include earlier memory block.'
    ),
    buildCheck(
      'Vision prompt includes earlier memory',
      latestVisionPrompt.includes('Earlier interview memory:')
        && includesNormalizedText(latestVisionPrompt, EARLY_MEMORY_FACT),
      latestVisionPrompt.includes('Earlier interview memory:')
        ? 'Earlier memory block present in vision prompt.'
        : 'Vision prompt did not include earlier memory block.'
    ),
    buildCheck(
      'Next succeeds after compaction',
      nextSnapshot.latestPayload?.phase === 'p4_code'
        && nextSnapshot.fetchIndicators.next.message !== 'Fetch failed',
      nextSnapshot.latestPayload?.phase
        ? `phase=${nextSnapshot.latestPayload.phase}`
        : 'No payload generated.'
    ),
    buildCheck(
      'Sync succeeds after compaction',
      syncSnapshot.fetchIndicators.sync.message !== 'Sync failed'
        && syncSnapshot.lastScreenshotPath === '/tmp/interview-verification.png',
      syncSnapshot.fetchIndicators.sync.message
    ),
  ];

  orchestrator.endSession();

  return {
    name,
    passed: checks.every((check) => check.passed),
    checks,
    transcriptMemory,
  };
}

function buildGeneratorResponse(phase: InterviewPhase): {
  mainLines: string[];
  pinnedFacts: string[];
  clarificationQuestions: Array<{ text: string; why: string }>;
  code: { language: 'python'; content: string } | null;
} {
  switch (phase) {
    case 'p2_clarify':
      return {
        mainLines: [
          'Let me restate the problem first.',
          'What exactly should be returned: indices or values?',
          'Write in notes: return indices, not values.',
        ],
        pinnedFacts: [EARLY_MEMORY_FACT],
        clarificationQuestions: [
          {
            text: 'What exactly should be returned: indices or values?',
            why: 'The return contract changes the implementation.',
          },
        ],
        code: null,
      };
    case 'p3_approach':
      return {
        mainLines: [
          'I will start with brute force and then move to a hash map.',
          'The optimized solution should stay O n time.',
        ],
        pinnedFacts: ['Use a hash map for O n time.'],
        clarificationQuestions: [],
        code: null,
      };
    case 'p4_code':
      return {
        mainLines: [
          'I am going to code the hash map solution now.',
          'I will return indices, not values.',
        ],
        pinnedFacts: [EARLY_MEMORY_FACT, 'Use a hash map for O n time.'],
        clarificationQuestions: [],
        code: {
          language: 'python',
          content: 'def two_sum(nums, target):\n    seen = {}\n    for index, value in enumerate(nums):\n        complement = target - value\n        if complement in seen:\n            return [seen[complement], index]\n        seen[value] = index\n    return []',
        },
      };
    case 'p5_test':
      return {
        mainLines: [
          'Let me dry run the example and confirm the complexity.',
        ],
        pinnedFacts: ['Exactly one answer exists.'],
        clarificationQuestions: [],
        code: null,
      };
    case 'p6_follow_up':
      return {
        mainLines: [
          'I can make that follow-up change and explain the impact.',
        ],
        pinnedFacts: ['The return contract stays consistent.'],
        clarificationQuestions: [],
        code: null,
      };
    case 'p1_intro':
      return {
        mainLines: [
          'Let me restate the problem first.',
        ],
        pinnedFacts: [EARLY_MEMORY_FACT],
        clarificationQuestions: [],
        code: null,
      };
  }
}

function readPhase(prompt: string): InterviewPhase {
  const match = prompt.match(/Current phase: ([a-z0-9_]+)\./i);
  const phase = match?.[1];
  switch (phase) {
    case 'p2_clarify':
    case 'p3_approach':
    case 'p4_code':
    case 'p5_test':
    case 'p6_follow_up':
      return phase;
    default:
      return 'p2_clarify';
  }
}

function buildLongInterviewTranscript(): InterviewTranscriptSegment[] {
  const transcript: InterviewTranscriptSegment[] = [];

  for (let index = 0; index < LONG_SESSION_FINAL_SEGMENT_COUNT; index += 1) {
    const speaker = index % 2 === 0 ? 'interviewer' : 'user';
    const timestamp = 1700000000000 + index * 1000;

    transcript.push({
      speaker,
      text: buildInterimText(index, speaker),
      timestamp,
      final: false,
    });
    transcript.push({
      speaker,
      text: buildFinalText(index, speaker),
      timestamp: timestamp + 1,
      final: true,
    });
  }

  return transcript;
}

function buildInterimText(index: number, speaker: string): string {
  if (index < 120) {
    return speaker === 'interviewer'
      ? 'What exactly should you'
      : 'I would return';
  }

  if (index < 700) {
    return speaker === 'interviewer'
      ? 'Walk me through the'
      : 'I would use a';
  }

  return speaker === 'interviewer'
    ? 'Can you dry run'
    : 'I would test';
}

function buildFinalText(index: number, speaker: string): string {
  if (index < 120) {
    return speaker === 'interviewer'
      ? 'What exactly should be returned: indices or values, and should I assume exactly one answer exists?'
      : 'I will return indices, not values. I will assume exactly one answer exists.';
  }

  if (index < 700) {
    return speaker === 'interviewer'
      ? 'Talk through the optimized approach and keep the solution O n time with a hash map.'
      : 'I would use a hash map to keep the solution O n time and O n space.';
  }

  return speaker === 'interviewer'
    ? 'Can you dry run the example, test edge cases, and explain the follow-up if duplicates appear?'
    : 'I would dry run the example, test edge cases, and keep the return contract stable if duplicates appear.';
}

function createCaptureProvider(): InterviewCaptureProvider {
  return {
    takeScreenshot: async () => '/tmp/interview-verification.png',
    getImagePreview: async () => 'preview',
  };
}

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<boolean> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate()) {
      return true;
    }
    await sleep(WAIT_INTERVAL_MS);
  }
  return predicate();
}

function sleep(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

function buildCheck(name: string, passed: boolean, details: string): InterviewVerificationCheck {
  return {
    name,
    passed,
    details,
  };
}

function includesNormalizedText(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle));
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
