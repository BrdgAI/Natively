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
      speakNow: ['Let me restate the problem first.'],
      speakIfAsked: ['If helpful, I can also confirm duplicates before I move on.'],
      writeNow: ['# Output: return indices, not values'],
      quickQuestions: ['Should I assume the input is unsorted?'],
      pinnedFacts: ['Return indices, not values'],
    }),
  ]);
  const orchestrator = new InterviewOrchestrator(llm as never, createAppStateStub() as never);

  orchestrator.startSession('interview', { codingLanguage: 'python' });

  const first = await orchestrator.handleNext();
  const clarifyDocument = first.phaseDocuments.p2_clarify;
  const sectionIds = clarifyDocument.mainSections.map((section) => section.id);

  assert.ok(sectionIds.includes('restate'));
  assert.ok(sectionIds.includes('question-queue'));
  assert.ok(sectionIds.includes('write-spec'));
  assert.ok(sectionIds.includes('example-starter'));
  assert.equal(first.latestPayload?.speakNow[0], 'Let me restate the problem first.');

  const second = await orchestrator.handleNext();

  assert.equal(second.phaseDocuments.p2_clarify.updateSummary.status, 'unchanged');
  assert.equal(second.phaseDocuments.p2_clarify.updateSummary.message, 'No updates');
  assert.deepEqual(second.latestPayload?.speakNow, first.latestPayload?.speakNow);

  orchestrator.endSession();
});

test('manual routing keeps transcript and sync from auto-switching phases while preserving scroll offsets and clarify handoff context', async () => {
  const llm = new FakeLLMHelper(
    [
      JSON.stringify({
        speakNow: ['Let me restate the prompt before I code.'],
        writeNow: ['# Output: return indices, not values'],
        quickQuestions: ['Should I assume the input is unsorted?'],
        pinnedFacts: ['Return indices, not values'],
      }),
      JSON.stringify({
        speakNow: ['I will start with brute force, then move to a hash map.'],
        pinnedFacts: ['Use a hash map for O n time'],
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

  await orchestrator.shiftManualPhase(1);
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
  assert.ok(approachPrompt.includes('# Output: return indices, not values'));
  assert.ok(approachPrompt.includes('Should I assume the input is unsorted?'));

  orchestrator.endSession();
});
