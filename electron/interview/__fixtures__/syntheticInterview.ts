import { InterviewTranscriptSegment } from '../types';

const BASE_TIMESTAMP = Date.UTC(2026, 2, 23, 18, 0, 0);

function turn(offsetSeconds: number, speaker: string, text: string): InterviewTranscriptSegment {
  return {
    speaker,
    text,
    timestamp: BASE_TIMESTAMP + offsetSeconds * 1000,
    final: true,
    confidence: 0.98,
  };
}

export const CLARIFY_TURNS: InterviewTranscriptSegment[] = [
  turn(0, 'interviewer', 'Given an array of integers, return the indices of the two numbers that add up to a target.'),
  turn(6, 'user', 'Let me restate the problem and clarify whether there is exactly one valid answer and whether I can assume the input is not sorted.'),
];

export const APPROACH_TURNS: InterviewTranscriptSegment[] = [
  turn(18, 'user', 'The brute force approach is checking every pair, which works but is O n squared, so I would optimize with a hash map.'),
  turn(30, 'interviewer', 'That sounds good. Walk me through the optimized approach before you code it.'),
];

export const CODING_TURNS: InterviewTranscriptSegment[] = [
  turn(42, 'user', 'I will start coding now and write the function signature first, then fill in the hash map lookup.'),
  turn(55, 'interviewer', 'Go ahead and implement it in Python.'),
];

export const TESTING_TURNS: InterviewTranscriptSegment[] = [
  turn(72, 'user', 'Let me dry run this on a small example, then I will cover edge cases and the time complexity.'),
];

export const FOLLOW_UP_TURNS: InterviewTranscriptSegment[] = [
  turn(90, 'interviewer', 'Looks good. What if I want you to return None when no pair exists instead of an empty list?'),
];

export const FULL_SYNTHETIC_INTERVIEW: InterviewTranscriptSegment[] = [
  ...CLARIFY_TURNS,
  ...APPROACH_TURNS,
  ...CODING_TURNS,
  ...TESTING_TURNS,
  ...FOLLOW_UP_TURNS,
];
