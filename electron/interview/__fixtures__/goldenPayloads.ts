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
      'Let me restate the problem first so I can confirm the input, output, and constraints before coding.',
    ],
    writeNow: [
      '# Problem: Two Sum',
      '# Input / Constraints: exactly one answer exists | input may be unsorted | no reuse of the same element',
      '# Output: return indices, not values',
      '# Example: nums = [2,7,11,15], target = 9 -> [0,1]',
    ],
    quickQuestions: ['If needed, I can confirm whether duplicates are allowed before I move on.'],
    pinnedFacts: ['Return indices, not values'],
    clarificationQuestions: [
      { text: 'What is the size or upper bound of the input?', why: 'Input scale determines the target complexity.' },
      { text: 'Can the input be empty or null, and can there be duplicates?', why: 'This changes edge handling.' },
      { text: 'What exactly should be returned if there are multiple valid answers?', why: 'This changes the output contract.' },
      { text: 'Are there explicit time or space constraints, and which optimization matters more?', why: 'This determines the target solution shape.' },
    ],
    anchor: {
      title: 'Clarify',
      items: ['Two Sum', 'Return indices, not values'],
      writeNow: ['# Output: return indices, not values'],
      note: '4 open questions tracked',
    },
    mainSections: [
      {
        id: 'restate',
        title: 'Restate First',
        lines: ['Let me restate the problem first so I can confirm the input, output, and constraints before coding.'],
        tone: 'primary',
      },
      {
        id: 'question-queue',
        title: 'Ask In This Order',
        lines: [
          'INPUT: Ask about input size or upper bound.',
          'INPUT: Ask about value range, whether values can be negative or zero, whether input can be empty or null, whether duplicates exist, and whether the input is sorted.',
          'OUTPUT: Ask exactly what to return and whether the answer is an index, value, count, boolean, or structure.',
          'OUTPUT: Ask what to do if multiple valid answers exist: any one, all, or a specific one.',
          'CONSTRAINTS: Ask about memory limits, time-complexity targets, and whether the priority is time or space.',
          'EDGE CASES: State the null or empty-input assumption out loud so the interviewer can correct it early.',
          'EDGE CASES: State the numeric-bounds assumption if ranges are still unspecified.',
        ],
        tone: 'primary',
      },
      {
        id: 'write-spec',
        title: 'Write This In The Doc',
        lines: [
          '# Problem: Two Sum',
          '# Input / Constraints: exactly one answer exists | input may be unsorted | no reuse of the same element',
          '# Output: return indices, not values',
          '# Example: nums = [2,7,11,15], target = 9 -> [0,1]',
        ],
        tone: 'secondary',
      },
      {
        id: 'example-starter',
        title: 'Example To Trace',
        lines: [
          'Trace this first: nums = [2,7,11,15], target = 9 -> [0,1]',
          'Say the expected output out loud before moving to approaches.',
        ],
        tone: 'secondary',
      },
      {
        id: 'backup-lines',
        title: 'Keep Ready',
        lines: ['If needed, I can confirm whether duplicates are allowed before I move on.'],
        tone: 'secondary',
      },
    ],
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
