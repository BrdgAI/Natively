import { BaseInterviewGenerator } from './BaseInterviewGenerator';
import {
  InterviewAnchorBlock,
  InterviewClarificationCandidate,
  InterviewGeneratorContext,
  InterviewMainSection,
  InterviewOverlayPayload,
  InterviewSessionSnapshot,
} from '../types';

const REQUIRED_SECTION_ORDER = ['restate', 'question-queue', 'write-spec', 'example-starter', 'backup-lines'] as const;

export class Phase2ClarificationGenerator extends BaseInterviewGenerator {
  public async generate(context: InterviewGeneratorContext): Promise<InterviewOverlayPayload> {
    const payload = await this.generatePhasePayload('p2_clarify', context);
    const firstPass = context.snapshot.phaseDocuments.p2_clarify.mainSections.length === 0;

    ensureClarifyPayload(payload, context.snapshot);

    payload.changes = [
      ...(payload.writeNow.length > 0
        ? [{ label: 'Write block ready', detail: 'The notes format is ready for the document.', severity: 'new' as const }]
        : []),
      ...(payload.clarificationQuestions && payload.clarificationQuestions.length > 0
        ? [{
            label: firstPass ? 'Full clarify pack ready' : 'Clarify queue refreshed',
            detail: firstPass
              ? 'The first-pass clarify script includes the full ordered question queue.'
              : 'The clarify queue reflects the latest transcript and screen context.',
            severity: 'new' as const,
          }]
        : []),
    ];
    payload.updateSummary = payload.updateSummary || {
      status: 'updated',
      updatedSections: ['Main'],
      message: 'Updated: Main',
      at: payload.generatedAt,
    };
    return payload;
  }
}

function ensureClarifyPayload(payload: InterviewOverlayPayload, snapshot: InterviewSessionSnapshot): void {
  const clarificationQuestions = dedupeClarificationCandidates([
    ...(payload.clarificationQuestions || []),
    ...payload.quickQuestions.map((text) => ({ text, why: 'Useful quick ask if the interviewer interrupts.' })),
    ...buildCanonicalClarificationCandidates(),
  ]);

  const writeSpecLines = buildWriteSpecLines(payload.writeNow, snapshot);
  const questionQueueLines = buildQuestionQueueLines();
  const exampleStarterLines = buildExampleStarterLines(snapshot);
  const backupLines = dedupeStrings([
    ...payload.speakIfAsked,
    ...payload.quickQuestions,
  ]).slice(0, 4);
  const restatement = payload.speakNow[0] || buildRestatement(snapshot);

  payload.clarificationQuestions = clarificationQuestions;
  payload.speakNow = dedupeStrings([restatement, ...payload.speakNow]).slice(0, 6);
  payload.writeNow = writeSpecLines;
  payload.anchor = buildClarifyAnchor(snapshot, writeSpecLines, payload.anchor);
  payload.mainSections = buildClarifySections(payload.mainSections || [], {
    restatement,
    questionQueueLines,
    writeSpecLines,
    exampleStarterLines,
    backupLines,
  });
  payload.quickQuestions = dedupeStrings(payload.quickQuestions).slice(0, 8);
  payload.pinnedFacts = dedupeStrings([
    ...payload.pinnedFacts,
    snapshot.problemStatement,
    ...snapshot.constraints,
  ]).slice(0, 10);
}

function buildClarifySections(
  existing: InterviewMainSection[],
  content: {
    restatement: string;
    questionQueueLines: string[];
    writeSpecLines: string[];
    exampleStarterLines: string[];
    backupLines: string[];
  }
): InterviewMainSection[] {
  const extras = existing.filter((section) => !REQUIRED_SECTION_ORDER.includes(section.id as (typeof REQUIRED_SECTION_ORDER)[number]));
  const required: InterviewMainSection[] = [
    {
      id: 'restate',
      title: 'Restate First',
      lines: [content.restatement],
      tone: 'primary',
    },
    {
      id: 'question-queue',
      title: 'Ask In This Order',
      lines: content.questionQueueLines,
      tone: 'primary',
    },
    {
      id: 'write-spec',
      title: 'Write This In The Doc',
      lines: content.writeSpecLines,
      tone: 'secondary',
    },
    {
      id: 'example-starter',
      title: 'Example To Trace',
      lines: content.exampleStarterLines,
      tone: 'secondary',
    },
    ...(content.backupLines.length > 0
      ? [{
          id: 'backup-lines',
          title: 'Keep Ready',
          lines: content.backupLines,
          tone: 'secondary' as const,
        }]
      : []),
  ];

  return [...required, ...extras].filter((section) => section.lines.length > 0);
}

function buildClarifyAnchor(
  snapshot: InterviewSessionSnapshot,
  writeSpecLines: string[],
  existing?: InterviewAnchorBlock
): InterviewAnchorBlock {
  return {
    title: existing?.title?.trim() || 'Clarify',
    items: dedupeStrings([
      snapshot.problemStatement,
      ...snapshot.constraints.slice(0, 2),
      ...(existing?.items || []),
    ]).slice(0, 4),
    writeNow: dedupeStrings([
      ...writeSpecLines.slice(0, 2),
      ...(existing?.writeNow || []),
    ]).slice(0, 3),
    note: snapshot.openQuestions.length > 0
      ? `${snapshot.openQuestions.length} open questions tracked`
      : existing?.note || 'Full clarify pack shown in one pass',
  };
}

function buildCanonicalClarificationCandidates(): InterviewClarificationCandidate[] {
  return [
    {
      text: 'What is the size or upper bound of the input?',
      why: 'Input scale determines whether brute force is acceptable.',
    },
    {
      text: 'What are the value ranges, and can values be negative or zero?',
      why: 'Value ranges affect edge handling and data-structure choices.',
    },
    {
      text: 'Can the input be empty or null, and can there be duplicates?',
      why: 'This changes guard clauses and correctness cases.',
    },
    {
      text: 'Should I assume the input is already sorted?',
      why: 'Sortedness changes which solution shapes are available.',
    },
    {
      text: 'What exactly should be returned: an index, value, count, boolean, or structure?',
      why: 'The output contract changes the implementation and final code shape.',
    },
    {
      text: 'If multiple valid answers exist, should I return any one, all of them, or a specific one?',
      why: 'Multiple-answer behavior changes correctness and output handling.',
    },
    {
      text: 'Are there explicit time or space constraints, and which optimization matters more?',
      why: 'Constraint pressure determines the target complexity.',
    },
    {
      text: 'I will assume null or empty input is not allowed unless specified. Is that okay?',
      why: 'Explicit edge-case assumptions prevent solving the wrong variant.',
    },
    {
      text: 'I will assume normal integer bounds unless told otherwise. Is that right?',
      why: 'Numeric-bound assumptions affect overflow handling and edge cases.',
    },
  ];
}

function buildRestatement(snapshot: InterviewSessionSnapshot): string {
  if (snapshot.problemStatement) {
    return `Let me restate it to make sure I have it right: ${snapshot.problemStatement}`;
  }
  return 'Let me restate the problem first so I can confirm the input, output, and constraints before coding.';
}

function buildQuestionQueueLines(): string[] {
  return [
    'INPUT: Ask about input size or upper bound.',
    'INPUT: Ask about value range, whether values can be negative or zero, whether input can be empty or null, whether duplicates exist, and whether the input is sorted.',
    'OUTPUT: Ask exactly what to return and whether the answer is an index, value, count, boolean, or structure.',
    'OUTPUT: Ask what to do if multiple valid answers exist: any one, all, or a specific one.',
    'CONSTRAINTS: Ask about memory limits, time-complexity targets, and whether the priority is time or space.',
    'EDGE CASES: State the null or empty-input assumption out loud so the interviewer can correct it early.',
    'EDGE CASES: State the numeric-bounds assumption if ranges are still unspecified.',
  ];
}

function buildWriteSpecLines(existingLines: string[], snapshot: InterviewSessionSnapshot): string[] {
  const problemLine = snapshot.problemStatement
    ? `# Problem: ${snapshot.problemStatement}`
    : '# Problem: restate the prompt in one clean line';
  const inputLine = snapshot.constraints.length > 0
    ? `# Input / Constraints: ${snapshot.constraints.join(' | ')}`
    : '# Input / Constraints: capture size, value range, duplicates, sortedness, and null or empty behavior';
  const outputLine = inferOutputLine(snapshot);
  const edgeLine = snapshot.examples.length > 0
    ? `# Example: ${snapshot.examples[0]}`
    : '# Edge cases / Examples: write one small example and note the expected result';

  return dedupeStrings([
    ...existingLines,
    problemLine,
    inputLine,
    outputLine,
    edgeLine,
  ]).slice(0, 8);
}

function inferOutputLine(snapshot: InterviewSessionSnapshot): string {
  const outputHint = dedupeStrings([
    ...snapshot.clarifiedFacts,
    ...snapshot.pinnedFacts,
  ]).find((item) => /(return|index|indices|value|values|count|boolean|true|false)/i.test(item));

  return outputHint
    ? `# Output: ${outputHint}`
    : '# Output: write the exact return contract and the rule for multiple valid answers';
}

function buildExampleStarterLines(snapshot: InterviewSessionSnapshot): string[] {
  if (snapshot.examples.length > 0) {
    return [
      `Trace this first: ${snapshot.examples[0]}`,
      'Say the expected output out loud before moving to approaches.',
    ];
  }

  return [
    'Pick one tiny concrete example and trace it end to end before coding.',
    'Use the example to confirm the output contract and one edge case early.',
  ];
}

function dedupeClarificationCandidates(items: InterviewClarificationCandidate[]): InterviewClarificationCandidate[] {
  const seen = new Set<string>();
  const result: InterviewClarificationCandidate[] = [];

  for (const item of items) {
    const text = item.text.trim();
    if (!text) {
      continue;
    }

    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({
      text,
      why: item.why.trim(),
    });
  }

  return result.slice(0, 10);
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return result;
}
