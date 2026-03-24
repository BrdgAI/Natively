import { InterviewOverlayPayload } from '../types';

const BASE_TIME = Date.UTC(2026, 2, 23, 18, 2, 0);

function createPayload(
  phase: InterviewOverlayPayload['phase'],
  offset: number,
  inputRevision: number,
  overrides: Partial<InterviewOverlayPayload>
): InterviewOverlayPayload {
  return {
    phase,
    phaseConfidence: 0.92,
    manualOverrideActive: false,
    mainLines: [],
    pinnedFacts: [],
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
    mainLines: [
      'Let me restate the problem first so I can confirm the input, output, and constraints before coding.',
      'What is the size or upper bound of the input?',
      'Can the input be empty or null, and can there be duplicates?',
      'What exactly should be returned if there are multiple valid answers?',
      'Are there explicit time or space constraints, and which optimization matters more?',
      'Write in notes: return indices, not values.',
      'Write in notes: nums = [2,7,11,15], target = 9 -> [0,1].',
    ],
    pinnedFacts: ['Return indices, not values'],
    clarificationQuestions: [
      { text: 'What is the size or upper bound of the input?', why: 'Input scale determines the target complexity.' },
      { text: 'Can the input be empty or null, and can there be duplicates?', why: 'This changes edge handling.' },
      { text: 'What exactly should be returned if there are multiple valid answers?', why: 'This changes the output contract.' },
      { text: 'Are there explicit time or space constraints, and which optimization matters more?', why: 'This determines the target solution shape.' },
    ],
  }),
  p3_approach: createPayload('p3_approach', 1, 3, {
    mainLines: [
      'The brute-force option is checking every pair, but that would be O n squared.',
      'A hash map lets me find complements in one pass, so the time becomes O n.',
    ],
    pinnedFacts: ['One-pass hash map solution'],
  }),
  p4_code: createPayload('p4_code', 2, 4, {
    mainLines: ['I am going to write the function signature first, then fill in the one-pass loop.'],
    code: {
      language: 'python',
      content: 'def two_sum(nums, target):\n    seen = {}\n    for index, value in enumerate(nums):\n        pass',
    },
  }),
  p5_test: createPayload('p5_test', 3, 5, {
    mainLines: [
      'Let me dry run nums equals three, two, four with target six.',
      'Then I would mention the duplicate case like three and three.',
    ],
  }),
  p6_follow_up: createPayload('p6_follow_up', 4, 6, {
    mainLines: [
      'I can make that follow-up change, and it only affects the final return line.',
      'The lookup logic stays the same because only the no-solution behavior changed.',
    ],
    code: {
      language: 'python',
      content: 'def two_sum(nums, target):\n    return None',
    },
  }),
};
