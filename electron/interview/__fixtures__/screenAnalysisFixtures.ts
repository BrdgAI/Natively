import { InterviewScreenAnalysis } from '../types';

const BASE_TIMESTAMP = Date.UTC(2026, 2, 23, 18, 1, 0);

export const CLARIFY_SCREEN_ANALYSIS: InterviewScreenAnalysis = {
  screenshotPath: '/tmp/interview-clarify.png',
  capturedAt: BASE_TIMESTAMP,
  problemStatement: 'Return the indices of two numbers that add up to the target.',
  givenConstraints: ['Exactly one answer exists', 'Do not reuse the same element twice'],
  examples: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
  visibleQuestions: ['Should I return indices or values?'],
  hints: ['The interviewer is waiting for clarification questions first'],
};

export const CODING_SCREEN_ANALYSIS: InterviewScreenAnalysis = {
  screenshotPath: '/tmp/interview-code.png',
  capturedAt: BASE_TIMESTAMP + 30_000,
  currentCode: [
    'def two_sum(nums, target):',
    '    seen = {}',
    '    for index, value in enumerate(nums):',
    '        complement = target - value',
    '        if complement in seen:',
    '            return [seen[complement], index]',
    '        seen[value] = index',
    '    return []',
  ].join('\n'),
  hints: ['The interviewer asked for a quick explanation of the hash map lookup'],
  likelyMistakes: ['Make sure the complement check happens before storing the current value'],
};

export const TESTING_SCREEN_ANALYSIS: InterviewScreenAnalysis = {
  screenshotPath: '/tmp/interview-test.png',
  capturedAt: BASE_TIMESTAMP + 60_000,
  dryRunInput: 'nums = [3,2,4], target = 6',
  extractedTests: ['nums = [3,2,4], target = 6 -> [1,2]', 'nums = [3,3], target = 6 -> [0,1]'],
  hints: ['The interviewer wants a dry run and edge cases'],
};
