import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPhasePrompt, INTERVIEW_GENERATOR_SYSTEM_PROMPT } from '../InterviewPrompts';
import { InterviewMainDocComposer } from '../InterviewMainDocComposer';
import { InterviewMemoryLedger } from '../InterviewMemoryLedger';
import { InterviewOverlayPayload } from '../types';

test('shared interview system prompt now pushes casual spoken english instead of professional polish', () => {
  assert.ok(INTERVIEW_GENERATOR_SYSTEM_PROMPT.includes('casual, clear, and easy to say out loud'));
  assert.ok(INTERVIEW_GENERATOR_SYSTEM_PROMPT.includes('thinking through the problem with a teammate'));
  assert.equal(INTERVIEW_GENERATOR_SYSTEM_PROMPT.includes('professional'), false);
});

test('clarify phase prompt includes the v2-style clarification guidance and the slim JSON contract', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);

  const prompt = buildPhasePrompt('p2_clarify', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [
      {
        speaker: 'interviewer',
        text: 'Please clarify the return contract before you code.',
        timestamp: 1700000000000,
        final: true,
      },
    ],
    earlierMemory: [
      {
        id: 'epoch-1',
        createdAt: 1700000000500,
        fromTimestamp: 1700000000000,
        toTimestamp: 1700000000400,
        compactedSegmentCount: 300,
        dominantPhases: ['p2_clarify'],
        summaryLines: ['Candidate already discussed hash maps.'],
        carryForwardFacts: ['Return indices, not values.'],
        openQuestions: ['Whether duplicates are allowed.'],
        source: 'llm',
      },
    ],
    screenAnalysis: {
      screenshotPath: '/tmp/interview-clarify.png',
      capturedAt: 1700000000600,
      problemStatement: 'Two Sum from the prompt',
      givenConstraints: ['Exactly one answer exists', 'Do better than O n squared'],
      examples: ['nums = [2,7,11,15], target = 9 -> [0,1]'],
      visibleQuestions: ['Should the answer return indices?'],
      hints: ['The interviewer wants the assumptions stated out loud.'],
    },
    previousPayload: null,
  });

  assert.equal(prompt.includes('professional'), false);
  assert.ok(prompt.includes('Ask exactly 3 to 5 questions.'));
  assert.ok(prompt.includes('If the context already contains confirmed answers or hard constraints, end with 3 to 5 short plain comment lines'));
  assert.ok(prompt.includes('Use natural transitions such as "one more thing I want to nail down," "and related to that," or "just to be safe."'));
  assert.ok(prompt.includes('Do not jump straight to the result; say how the input moves step by step until you reach that output.'));
  assert.ok(prompt.includes('Problem statement:'));
  assert.ok(prompt.includes('Two Sum from the prompt'));
  assert.ok(prompt.includes('Visible constraints:'));
  assert.ok(prompt.includes('Do better than O n squared'));
  assert.ok(prompt.includes('Visible hints:'));
  assert.ok(prompt.includes('The interviewer wants the assumptions stated out loud.'));
  assert.ok(prompt.includes('Recent transcript:'));
  assert.ok(prompt.includes('[INTERVIEWER] Please clarify the return contract before you code.'));
  assert.equal(prompt.includes('Earlier interview memory:'), false);
  assert.equal(prompt.includes('Relevant phase handoffs:'), false);
  assert.equal(prompt.includes('Current code:'), false);
  assert.equal(prompt.includes('Pinned facts:'), false);
  assert.equal(prompt.includes('Open clarification questions:'), false);
  assert.equal(prompt.includes('Approach summary:'), false);
  assert.ok(prompt.includes('`mainLines`'));
  assert.ok(prompt.includes('`clarificationQuestions`'));
  assert.ok(prompt.includes('`code`'));
});

test('approach prompt carries the longer brainstorming-style walkthrough instructions', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);

  const prompt = buildPhasePrompt('p3_approach', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    earlierMemory: [],
    previousPayload: null,
  });

  assert.ok(prompt.includes('6 to 8 minutes'));
  assert.ok(prompt.includes('Walk through the standard toolkit in one spoken sweep'));
  assert.ok(prompt.includes('Spend 2 to 3 lines on each remaining candidate.'));
  assert.ok(prompt.includes('If the total has multiple factors like O(n log n) or O((V+E) log V), say exactly where each factor comes from.'));
  assert.ok(prompt.includes('Sound like someone crossing options off out loud while thinking'));
});

test('coding prompt now asks for code-line-first narration and why-comments instead of production-pr polish', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists']);

  const prompt = buildPhasePrompt('p4_code', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    earlierMemory: [],
    previousPayload: null,
  });

  assert.ok(prompt.includes('each `mainLines` entry should start with the exact code line or a tiny code snippet being typed'));
  assert.ok(prompt.includes('Example shape: `seen_by_value = {} because I want O(1) lookups while I scan once through the array.`'));
  assert.ok(prompt.includes('Use comments for why a choice was made'));
  assert.ok(prompt.includes('Number those structure comments in the order the user should write the sections or functions.'));
  assert.ok(prompt.includes('`# 1. edge-case guards`'));
  assert.equal(prompt.includes('production PR'), false);
  assert.equal(prompt.includes('Do not force a docstring unless it genuinely helps this problem.'), true);
});

test('testing prompt includes the hybrid spoken structure for trace and edge cases', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists']);
  const snapshot = ledger.getSnapshot();
  const codingPayload: InterviewOverlayPayload = {
    phase: 'p4_code',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [],
    pinnedFacts: [],
    clarificationQuestions: [],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
    code: {
      language: 'python',
      content: ['def solve(nums, target):', '    seen = {}', '    return []'].join('\n'),
    },
  };
  const phaseDocument = composer.compose(snapshot, codingPayload, {
    savedContexts: snapshot.phaseDocuments.p4_code.savedContexts,
  });
  ledger.applyGeneratedPayload(codingPayload, phaseDocument);

  const prompt = buildPhasePrompt('p5_test', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    earlierMemory: [],
    previousPayload: null,
  });

  assert.ok(prompt.includes('Produce 6 to 10 lines.'));
  assert.ok(prompt.includes('Use a consistent spoken mini-template'));
  assert.ok(prompt.includes('Use natural transitions like "next I want to check," "one case I do not want to skip," or "just to make sure this branch is safe."'));
  assert.ok(prompt.includes('every `mainLines` entry should begin with the relevant code line number in brackets like `[3]`'));
  assert.ok(prompt.includes('Start each trace step with the code line it maps to in brackets, like `[3]`, before the spoken sentence.'));
  assert.ok(prompt.includes('1: def solve(nums, target):'));
  assert.ok(prompt.includes('2:     seen = {}'));
  assert.ok(prompt.includes('Sound like someone carefully reading back through their own code'));
});

test('approach prompt receives confirmed clarify handoff context', () => {
  const ledger = new InterviewMemoryLedger();
  const composer = new InterviewMainDocComposer();

  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists'], ['nums = [2,7,11,15], target = 9']);
  const snapshot = ledger.getSnapshot();

  const clarifyPayload: InterviewOverlayPayload = {
    phase: 'p2_clarify',
    phaseConfidence: 0.9,
    manualOverrideActive: false,
    mainLines: [
      'Let me restate the problem first.',
      'The output should be the two indices, not the values themselves.',
    ],
    pinnedFacts: ['Return indices, not values.'],
    clarificationQuestions: [
      {
        text: 'Should I assume the input is unsorted?',
        why: 'Sortedness changes the approach.',
      },
    ],
    freshness: {
      transcriptUpdatedMsAgo: 0,
      screenshotUpdatedMsAgo: null,
      generatedMsAgo: 0,
    },
    generatedAt: Date.now(),
    inputRevision: snapshot.inputRevision,
  };

  const phaseDocument = composer.compose(snapshot, clarifyPayload, {
    savedContexts: snapshot.phaseDocuments.p2_clarify.savedContexts,
  });
  ledger.applyGeneratedPayload(clarifyPayload, phaseDocument, undefined, {
    summaryLines: ['Let me restate the problem first.'],
    confirmedSpecLines: ['Return indices, not values.'],
    openQuestions: ['Should I assume the input is unsorted?'],
    updatedAt: clarifyPayload.generatedAt,
  });

  const prompt = buildPhasePrompt('p3_approach', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [],
    earlierMemory: [],
    previousPayload: clarifyPayload,
  });

  assert.ok(prompt.includes('Clarify handoff'));
  assert.ok(prompt.includes('Return indices, not values.'));
  assert.ok(prompt.includes('Should I assume the input is unsorted?'));
});

test('coding prompt includes earlier interview memory ahead of recent transcript', () => {
  const ledger = new InterviewMemoryLedger();
  ledger.startSession('interview', { codingLanguage: 'python' });
  ledger.setProblemStatement('Two Sum', ['Exactly one answer exists']);

  const prompt = buildPhasePrompt('p4_code', {
    snapshot: ledger.getSnapshot(),
    recentTranscript: [
      {
        speaker: 'interviewer',
        text: 'Please start coding.',
        timestamp: 1700000000000,
        final: true,
      },
    ],
    earlierMemory: [
      {
        id: 'epoch-1',
        createdAt: 1700000000500,
        fromTimestamp: 1700000000000,
        toTimestamp: 1700000000400,
        compactedSegmentCount: 300,
        dominantPhases: ['p2_clarify', 'p3_approach'],
        summaryLines: ['Candidate confirmed a hash map approach.'],
        carryForwardFacts: ['Return indices, not values.'],
        openQuestions: ['Whether duplicates are allowed.'],
        source: 'llm',
      },
    ],
    previousPayload: null,
  });

  const earlierMemoryIndex = prompt.indexOf('Earlier interview memory:');
  const recentTranscriptIndex = prompt.indexOf('Recent transcript:');

  assert.ok(earlierMemoryIndex >= 0);
  assert.ok(recentTranscriptIndex > earlierMemoryIndex);
  assert.ok(prompt.includes('Candidate confirmed a hash map approach.'));
  assert.ok(prompt.includes('Return indices, not values.'));
});
