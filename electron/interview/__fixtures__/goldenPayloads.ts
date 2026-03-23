import { InterviewOverlayPayload } from '../types';

const BASE_TIME = Date.UTC(2026, 2, 23, 18, 2, 0);

function createPayload(phase: InterviewOverlayPayload['phase'], offset: number, inputRevision: number, overrides: Partial<InterviewOverlayPayload>): InterviewOverlayPayload {
  return {
    phase,
    phaseConfidence: 0.92,
    manualOverrideActive: false,
    speakNow: [],
    speakIfAsked: [],
    writeNow: [],
    thoughtNotes: [],
    quickQuestions: [],
    pinnedFacts: [],
    changes: [],
    freshness: {
      transcriptUpdatedMsAgo: 1200,
      screenshotUpdatedMsAgo: 2400,
      generatedMsAgo: 0,
    },
    generatedAt: BASE_TIME + offset,
    inputRevision,
    ...overrides,
  };
}

export const GOLDEN_PHASE_PAYLOADS: Record<InterviewOverlayPayload['phase'], InterviewOverlayPayload> = {
  p2_clarify: createPayload('p2_clarify', 0, 2, {
    speakNow: [
      'Let me restate the problem so I know I have the input and output right.',
      'Before I jump in, I want to confirm whether there is exactly one answer and whether duplicates are allowed.',
    ],
    writeNow: ['Constraints: exactly one answer, return indices, no reuse of the same element'],
    quickQuestions: ['Should I assume the input is unsorted?'],
    pinnedFacts: ['Return indices, not values'],
  }),
  p3_approach: createPayload('p3_approach', 1, 3, {
    speakNow: [
      'The brute-force option is checking every pair, but that would be O n squared.',
      'A hash map lets me find complements in one pass, so the time becomes O n.',
    ],
    speakIfAsked: ['Space would be O n because the map can store each value once.'],
    pinnedFacts: ['One-pass hash map solution'],
  }),
  p4_code: createPayload('p4_code', 2, 4, {
    speakNow: ['I am going to write the function signature first, then fill in the one-pass loop.'],
    writeNow: ['Define function', 'Create seen map', 'Loop through nums and check complement first'],
    codePanel: {
      language: 'python',
      mode: 'skeleton',
      content: 'def two_sum(nums, target):\n    seen = {}\n    for index, value in enumerate(nums):\n        pass',
      narration: ['I initialize a map so I can store prior values and their indices.'],
      suspectedMistakes: [],
    },
  }),
  p5_test: createPayload('p5_test', 3, 5, {
    speakNow: ['Let me dry run nums equals three, two, four with target six.'],
    speakIfAsked: ['Then I would mention the duplicate case like three and three.'],
    quickQuestions: ['Edge case: duplicate values that form the answer'],
  }),
  p6_follow_up: createPayload('p6_follow_up', 4, 6, {
    speakNow: ['I can make that follow-up change, and it only affects the final return line.'],
    speakIfAsked: ['The lookup logic stays the same because only the no-solution behavior changed.'],
    codePanel: {
      language: 'python',
      mode: 'diff',
      content: '@@\n-    return []\n+    return None',
      narration: ['I am only changing the no-match return path, so the main loop stays untouched.'],
      suspectedMistakes: [],
    },
  }),
};
