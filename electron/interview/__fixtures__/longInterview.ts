import { InterviewTranscriptSegment } from '../types';

export function createLongInterviewTranscript(count: number): InterviewTranscriptSegment[] {
  const transcript: InterviewTranscriptSegment[] = [];

  for (let index = 0; index < count; index += 1) {
    const speaker = index % 2 === 0 ? 'interviewer' : 'user';
    transcript.push({
      speaker,
      text: speaker === 'interviewer'
        ? `Constraint check ${index}: should we return indices and optimize for O n time?`
        : `Answer ${index}: I would use a hash map and keep the return contract stable.`,
      timestamp: 1700000000000 + index * 1000,
      final: true,
    });
  }

  return transcript;
}
