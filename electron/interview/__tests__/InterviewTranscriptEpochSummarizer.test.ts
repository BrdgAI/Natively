import test from 'node:test';
import assert from 'node:assert/strict';
import { LLMHelper } from '../../LLMHelper';
import { createLongInterviewTranscript } from '../__fixtures__/longInterview';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewTranscriptEpochSummarizer } from '../InterviewTranscriptEpochSummarizer';

class StubLLMHelper extends LLMHelper {
  constructor(private readonly response: string | Error) {
    super();
  }

  public override async chat(): Promise<string> {
    if (this.response instanceof Error) {
      throw this.response;
    }

    return this.response;
  }
}

test('epoch summarizer returns parsed llm JSON when available', async () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists']);

  const summarizer = new InterviewTranscriptEpochSummarizer(
    new StubLLMHelper(
      JSON.stringify({
        summaryLines: ['Candidate confirmed the hash map direction.'],
        carryForwardFacts: ['Return indices, not values.'],
        openQuestions: ['Whether duplicates are allowed.'],
      })
    )
  );

  const result = await summarizer.summarize({
    snapshot: ledger.getSnapshot(),
    segments: createLongInterviewTranscript(8),
  });

  assert.equal(result.source, 'llm');
  assert.deepEqual(result.summaryLines, ['Candidate confirmed the hash map direction.']);
  assert.deepEqual(result.carryForwardFacts, ['Return indices, not values.']);
  assert.deepEqual(result.openQuestions, ['Whether duplicates are allowed.']);
});

test('epoch summarizer falls back to deterministic memory when llm output fails', async () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists']);
  ledger.setOpenQuestions(['Are duplicates allowed?']);

  const summarizer = new InterviewTranscriptEpochSummarizer(
    new StubLLMHelper(new Error('offline'))
  );

  const result = await summarizer.summarize({
    snapshot: ledger.getSnapshot(),
    segments: createLongInterviewTranscript(10),
  });

  assert.equal(result.source, 'fallback');
  assert.ok(result.summaryLines.length > 0);
  assert.ok(result.carryForwardFacts.includes('Problem: Two Sum'));
  assert.ok(result.openQuestions.includes('Are duplicates allowed?'));
});
