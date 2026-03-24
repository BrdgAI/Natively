import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhasePrompt } from '../InterviewPrompts';
import { InterviewOrchestrator } from '../InterviewOrchestrator';

class FakeLLMHelper {
  private readonly generatorResponses: string[];
  private readonly visionResponses: string[];

  constructor(generatorResponses: string[], visionResponses: string[] = []) {
    this.generatorResponses = [...generatorResponses];
    this.visionResponses = [...visionResponses];
  }

  public async chat(_prompt: string, imagePaths?: string[]): Promise<string> {
    if (imagePaths && imagePaths.length > 0) {
      return this.visionResponses.shift() || '{}';
    }
    return this.generatorResponses.shift() || '{}';
  }
}

function createAppStateStub() {
  return {
    takeScreenshot: async () => '/tmp/interview-sync.png',
    getImagePreview: async () => 'preview',
  };
}

test('clarify first NEXT produces a full pack and repeated NEXT does not drip-feed more clarify content', async () => {
  const llm = new FakeLLMHelper([
    JSON.stringify({
      mainLines: [
        'Let me restate the problem first.',
        'Should I assume the input is unsorted?',
        'Write in notes: return indices, not values.',
      ],
      pinnedFacts: ['Return indices, not values'],
      clarificationQuestions: [
        {
          text: 'Should I assume the input is unsorted?',
          why: 'Sortedness changes the solution shape.',
        },
      ],
      code: null,
    }),
  ]);
  const orchestrator = new InterviewOrchestrator(llm as never, createAppStateStub() as never);

  orchestrator.startSession('interview', { codingLanguage: 'python' });

  const first = await orchestrator.handleNext();
  const clarifyDocument = first.phaseDocuments.p2_clarify;
  const feedLines = clarifyDocument.mainFeed
    .filter((entry) => entry.type === 'line')
    .map((entry) => entry.text);

  assert.ok(feedLines.includes('Let me restate the problem first.'));
  assert.ok(feedLines.includes('Should I assume the input is unsorted?'));
  assert.ok(feedLines.includes('Write in notes: return indices, not values.'));
  assert.equal(first.latestPayload?.mainLines[0], 'Let me restate the problem first.');

  const second = await orchestrator.handleNext();

  assert.equal(second.phaseDocuments.p2_clarify.status.status, 'unchanged');
  assert.equal(second.phaseDocuments.p2_clarify.status.message, 'No updates');
  assert.deepEqual(second.latestPayload?.mainLines, first.latestPayload?.mainLines);

  orchestrator.endSession();
});

test('manual routing keeps transcript and sync from auto-switching phases while preserving scroll offsets and clarify handoff context', async () => {
  const llm = new FakeLLMHelper(
    [
      JSON.stringify({
        mainLines: [
          'Let me restate the prompt before I code.',
          'Output: return indices, not values.',
          'Should I assume the input is unsorted?',
        ],
        pinnedFacts: ['Return indices, not values'],
        clarificationQuestions: [
          {
            text: 'Should I assume the input is unsorted?',
            why: 'Sortedness changes the approach.',
          },
        ],
        code: null,
      }),
      JSON.stringify({
        mainLines: ['I will start with brute force, then move to a hash map.'],
        pinnedFacts: ['Use a hash map for O n time'],
        code: null,
      }),
    ],
    [
      JSON.stringify({
        problemStatement: 'Two Sum',
        givenConstraints: ['n can be large'],
        examples: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
        visibleQuestions: ['Are duplicates allowed?'],
        hints: ['The interviewer wants the optimal approach next.'],
        currentCode: 'def two_sum(nums, target):\n    pass',
        dryRunInput: '',
        likelyMistakes: [],
        extractedTests: [],
      }),
    ]
  );
  const orchestrator = new InterviewOrchestrator(llm as never, createAppStateStub() as never);

  orchestrator.startSession('interview', { codingLanguage: 'python' });
  await orchestrator.handleNext();
  orchestrator.setMainScrollOffset(120);

  orchestrator.handleTranscript({
    speaker: 'user',
    text: 'A hash map should get us to O n time.',
    timestamp: Date.now(),
    final: true,
  });

  assert.equal(orchestrator.getState().phase, 'p2_clarify');

  orchestrator.shiftManualPhase(1);
  await orchestrator.handleNext();
  orchestrator.setMainScrollOffset(480);

  const afterSync = await orchestrator.handleSync();
  assert.equal(afterSync.phase, 'p3_approach');
  assert.equal(afterSync.manualOverridePhase, 'p3_approach');

  const backToClarify = orchestrator.shiftManualPhase(-1);
  assert.equal(backToClarify.mainScrollOffset, 120);

  const forwardToApproach = orchestrator.shiftManualPhase(1);
  assert.equal(forwardToApproach.mainScrollOffset, 480);

  const approachPrompt = buildPhasePrompt('p3_approach', {
    snapshot: orchestrator.getState(),
    recentTranscript: [],
    previousPayload: orchestrator.getState().latestPayload,
  });

  assert.ok(approachPrompt.includes('Clarify handoff'));
  assert.ok(approachPrompt.includes('Output: return indices, not values.'));
  assert.ok(approachPrompt.includes('Should I assume the input is unsorted?'));

  orchestrator.endSession();
});
