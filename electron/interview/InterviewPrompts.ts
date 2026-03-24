import { loadGeneratorInstructions, loadVisionInstructions } from './InterviewInstructionLoader';
import {
  InterviewClarificationItem,
  InterviewGeneratorContext,
  InterviewPhase,
  InterviewPhaseHandoff,
  InterviewSessionSnapshot,
  RenderableInterviewPhase,
} from './types';

const OUTPUT_SCHEMA = `Return JSON only with this exact shape:
{
  "mainLines": ["one spoken line per entry"],
  "pinnedFacts": ["short stable fact"],
  "clarificationQuestions": [
    {
      "text": "question to ask",
      "why": "why this matters"
    }
  ],
  "code": {
    "language": "python",
    "content": "full code only when code is needed"
  }
}
Use empty arrays when a section has no content. Use null for code when no code is needed. Do not add numbering, headers, or separators inside mainLines.`;

export const INTERVIEW_GENERATOR_SYSTEM_PROMPT = `You are writing interview overlay guidance for a live software engineering candidate.
The user may read directly from the screen.
Produce output the candidate can read out loud with confidence.
Everything must sound natural, calm, and professional.
Never produce chatbot framing.
Never explain the JSON format.
Prefer exact spoken lines over essays.
${OUTPUT_SCHEMA}`;

export const INTERVIEW_VISION_SYSTEM_PROMPT = `You analyze screenshots from live technical interviews.
Return JSON only.
Be precise, literal, and concise.
If text is unclear, leave the field empty instead of inventing details.`;

export function buildPhasePrompt(phase: InterviewPhase, context: InterviewGeneratorContext): string {
  const instructions = loadGeneratorInstructions(phase);
  const snapshot = context.snapshot;
  const normalizedPhase = normalizePhase(phase);

  return [
    instructions.index,
    instructions.global,
    instructions.phase,
    `Current phase: ${normalizedPhase}.`,
    buildRuntimeContext(snapshot, context, normalizedPhase),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildVisionPrompt(
  phase: InterviewPhase,
  transcriptContext: string,
  earlierMemoryContext?: string
): string {
  const instructions = loadVisionInstructions(phase);

  return [
    instructions.global,
    instructions.phase,
    buildVisionSchema(normalizePhase(phase)),
    `Transcript context:
${transcriptContext || '[none]'}`,
    earlierMemoryContext
      ? `Earlier interview memory:
${earlierMemoryContext}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildRuntimeContext(
  snapshot: InterviewSessionSnapshot,
  context: InterviewGeneratorContext,
  phase: RenderableInterviewPhase
): string {
  return `Routing mode:
${snapshot.routingMode}

Current known problem:
${snapshot.problemStatement || '[not confirmed yet]'}

Known constraints:
${formatList(snapshot.constraints)}

Known examples:
${formatList(snapshot.examples)}

Clarified facts:
${formatList(snapshot.clarifiedFacts)}

Open clarification questions:
${formatClarificationItems(snapshot.clarificationItems)}

Approach summary:
${formatList(snapshot.approachSummary)}

Requirement changes:
${formatList(snapshot.requirementChanges)}

Pinned facts:
${formatList(snapshot.pinnedFacts)}

Active follow-up:
${formatFollowUp(snapshot)}

Current code:
${snapshot.currentCode?.content || '[no code snapshot yet]'}

Latest screen context delta:
${formatScreenAnalysis(context.screenAnalysis)}

Latest normal context delta:
${formatNormalContext(context.recentTranscript)}

Earlier interview memory:
${formatEarlierMemory(context.earlierMemory)}

Relevant phase handoffs:
${formatRelevantPhaseHandoffs(snapshot, phase)}

Recent transcript:
${formatTranscript(context)}`;
}

function buildVisionSchema(phase: RenderableInterviewPhase): string {
  if (phase === 'p2_clarify') {
    return `Return JSON with:
{
  "problemStatement": "visible problem statement",
  "givenConstraints": ["constraint"],
  "examples": ["example"],
  "visibleQuestions": ["clarification question implied by the screenshot"],
  "hints": ["visible interviewer hint or requirement change"],
  "currentCode": "",
  "dryRunInput": "",
  "likelyMistakes": [],
  "extractedTests": []
}`;
  }

  if (phase === 'p5_test') {
    return `Return JSON with:
{
  "problemStatement": "",
  "givenConstraints": [],
  "examples": [],
  "visibleQuestions": [],
  "hints": ["visible interviewer hint or requirement change"],
  "currentCode": "visible code only",
  "dryRunInput": "visible dry run input",
  "likelyMistakes": ["possible mistake visible on screen"],
  "extractedTests": ["visible test case or sample run"]
}`;
  }

  return `Return JSON with:
{
  "problemStatement": "",
  "givenConstraints": [],
  "examples": [],
  "visibleQuestions": [],
  "hints": ["visible interviewer hint or requirement change"],
  "currentCode": "visible code only",
  "dryRunInput": "",
  "likelyMistakes": ["possible mistake visible on screen"],
  "extractedTests": ["visible test case if relevant"]
}`;
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return '- none';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

function formatClarificationItems(items: InterviewClarificationItem[]): string {
  if (items.length === 0) {
    return '- none';
  }

  return items
    .map((item) => `- [${item.status}] ${item.text}${item.why ? ` | why: ${item.why}` : ''}${item.answer ? ` | answer: ${item.answer}` : ''}`)
    .join('\n');
}

function formatFollowUp(snapshot: InterviewSessionSnapshot): string {
  if (!snapshot.activeFollowUp) {
    return '- none';
  }

  return [
    `- request: ${snapshot.activeFollowUp.request}`,
    `- impacted area: ${snapshot.activeFollowUp.impactedArea}`,
    `- diff required: ${snapshot.activeFollowUp.diffRequired ? 'yes' : 'no'}`,
  ].join('\n');
}

function formatScreenAnalysis(screenAnalysis: InterviewGeneratorContext['screenAnalysis']): string {
  if (!screenAnalysis) {
    return '- none';
  }

  const lines = [
    screenAnalysis.problemStatement ? `problem: ${screenAnalysis.problemStatement}` : '',
    screenAnalysis.givenConstraints && screenAnalysis.givenConstraints.length > 0 ? `constraints: ${screenAnalysis.givenConstraints.join(' | ')}` : '',
    screenAnalysis.examples && screenAnalysis.examples.length > 0 ? `examples: ${screenAnalysis.examples.join(' | ')}` : '',
    screenAnalysis.visibleQuestions && screenAnalysis.visibleQuestions.length > 0 ? `visible questions: ${screenAnalysis.visibleQuestions.join(' | ')}` : '',
    screenAnalysis.hints && screenAnalysis.hints.length > 0 ? `hints: ${screenAnalysis.hints.join(' | ')}` : '',
    screenAnalysis.dryRunInput ? `dry run: ${screenAnalysis.dryRunInput}` : '',
    screenAnalysis.likelyMistakes && screenAnalysis.likelyMistakes.length > 0 ? `likely mistakes: ${screenAnalysis.likelyMistakes.join(' | ')}` : '',
  ].filter(Boolean);

  return lines.length > 0 ? lines.map((line) => `- ${line}`).join('\n') : '- none';
}

function formatNormalContext(recentTranscript: InterviewGeneratorContext['recentTranscript']): string {
  const finalTranscript = recentTranscript
    .filter((item) => item.final && item.text.trim())
    .slice(-4);

  if (finalTranscript.length === 0) {
    return '- none';
  }

  return finalTranscript
    .map((item) => `- [${item.speaker.toUpperCase()}] ${item.text.trim()}`)
    .join('\n');
}

function formatEarlierMemory(earlierMemory: InterviewGeneratorContext['earlierMemory']): string {
  if (earlierMemory.length === 0) {
    return '- none';
  }

  return earlierMemory
    .map((epoch) => {
      const parts = [`phase: ${epoch.dominantPhases.map((phase) => formatPhaseLabel(phase)).join('/')}`];
      if (epoch.summaryLines.length > 0) {
        parts.push(`summary: ${epoch.summaryLines.join(' | ')}`);
      }
      if (epoch.carryForwardFacts.length > 0) {
        parts.push(`facts: ${epoch.carryForwardFacts.join(' | ')}`);
      }
      if (epoch.openQuestions.length > 0) {
        parts.push(`open: ${epoch.openQuestions.join(' | ')}`);
      }
      return `- ${parts.join(' | ')}`;
    })
    .join('\n');
}

function formatRelevantPhaseHandoffs(
  snapshot: InterviewSessionSnapshot,
  phase: RenderableInterviewPhase
): string {
  const relevantPhases = getRelevantHandoffPhases(phase);
  const blocks = relevantPhases
    .map((item) => {
      const handoff = snapshot.phaseHandoffs[item];
      return formatPhaseHandoff(item, handoff);
    })
    .filter(Boolean);

  return blocks.length > 0 ? blocks.join('\n') : '- none';
}

function getRelevantHandoffPhases(phase: RenderableInterviewPhase): RenderableInterviewPhase[] {
  switch (phase) {
    case 'p2_clarify':
      return ['p2_clarify'];
    case 'p3_approach':
      return ['p2_clarify', 'p3_approach'];
    case 'p4_code':
      return ['p2_clarify', 'p3_approach', 'p4_code'];
    case 'p5_test':
      return ['p2_clarify', 'p3_approach', 'p4_code', 'p5_test'];
    case 'p6_follow_up':
      return ['p2_clarify', 'p3_approach', 'p4_code', 'p5_test', 'p6_follow_up'];
  }
}

function formatPhaseHandoff(phase: RenderableInterviewPhase, handoff: InterviewPhaseHandoff): string {
  const hasContent = handoff.summaryLines.length > 0 || handoff.confirmedSpecLines.length > 0 || handoff.openQuestions.length > 0;
  if (!hasContent) {
    return '';
  }

  const lines = [`- ${formatPhaseLabel(phase)} handoff:`];
  if (handoff.summaryLines.length > 0) {
    lines.push(...handoff.summaryLines.map((item) => `  - summary: ${item}`));
  }
  if (handoff.confirmedSpecLines.length > 0) {
    lines.push(...handoff.confirmedSpecLines.map((item) => `  - spec: ${item}`));
  }
  if (handoff.openQuestions.length > 0) {
    lines.push(...handoff.openQuestions.map((item) => `  - open: ${item}`));
  }
  return lines.join('\n');
}

function formatTranscript(context: InterviewGeneratorContext): string {
  const transcript = context.recentTranscript.slice(-12);
  if (transcript.length === 0) {
    return '- none';
  }

  return transcript.map((item) => `[${item.speaker.toUpperCase()}] ${item.text}`).join('\n');
}

export function formatVisionEarlierMemory(
  earlierMemory: InterviewGeneratorContext['earlierMemory']
): string {
  if (earlierMemory.length === 0) {
    return '';
  }

  return earlierMemory
    .map((epoch) => {
      const parts = [...epoch.summaryLines];
      if (epoch.carryForwardFacts.length > 0) {
        parts.push(`facts: ${epoch.carryForwardFacts.join(' | ')}`);
      }
      if (epoch.openQuestions.length > 0) {
        parts.push(`open: ${epoch.openQuestions.join(' | ')}`);
      }
      return `- ${parts.join(' | ')}`;
    })
    .join('\n');
}

function normalizePhase(phase: InterviewPhase): RenderableInterviewPhase {
  return phase === 'p1_intro' ? 'p2_clarify' : phase;
}

function formatPhaseLabel(phase: RenderableInterviewPhase): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Clarify';
    case 'p3_approach':
      return 'Approach';
    case 'p4_code':
      return 'Code';
    case 'p5_test':
      return 'Test';
    case 'p6_follow_up':
      return 'Follow-up';
  }
}
