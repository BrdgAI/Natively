import { loadGeneratorInstructions, loadVisionInstructions } from './InterviewInstructionLoader';
import {
  InterviewClarificationItem,
  InterviewGeneratorContext,
  InterviewPhase,
  InterviewSessionSnapshot,
  RenderableInterviewPhase,
} from './types';

const OUTPUT_SCHEMA = `Return JSON only with this exact shape:
{
  "speakNow": ["short natural line"],
  "speakIfAsked": ["backup line"],
  "writeNow": ["what to type"],
  "thoughtNotes": ["silent thinking note"],
  "quickQuestions": ["fast answer or interruption line"],
  "pinnedFacts": ["fact that should stay visible"],
  "anchor": {
    "title": "short anchor title",
    "items": ["short orientation item"],
    "writeNow": ["small persistent write item"],
    "note": "optional short note"
  },
  "mainSections": [
    {
      "id": "stable-section-id",
      "title": "section title",
      "lines": ["line to show in the main lane"],
      "tone": "primary"
    }
  ],
  "clarificationQuestions": [
    {
      "text": "question to ask",
      "why": "why this matters"
    }
  ],
  "codePanel": {
    "language": "python",
    "mode": "full",
    "content": "full code or diff text",
    "narration": ["what to say while typing"],
    "suspectedMistakes": ["bug note"]
  }
}
Use empty arrays when a section has no content. Use null for codePanel only when no code is needed.`;

export const INTERVIEW_GENERATOR_SYSTEM_PROMPT = `You are writing interview overlay guidance for a live software engineering candidate.
The user may read directly from the screen.
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
  const activeDocument = snapshot.phaseDocuments[normalizedPhase];

  return [
    instructions.index,
    instructions.global,
    instructions.phase,
    `Current phase: ${normalizedPhase}.`,
    buildRuntimeContext(snapshot, context, activeDocument ? normalizedPhase : null),
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildVisionPrompt(phase: InterviewPhase, transcriptContext: string): string {
  const instructions = loadVisionInstructions(phase);

  return [
    instructions.global,
    instructions.phase,
    buildVisionSchema(normalizePhase(phase)),
    `Transcript context:
${transcriptContext || '[none]'}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildRuntimeContext(
  snapshot: InterviewSessionSnapshot,
  context: InterviewGeneratorContext,
  phase: RenderableInterviewPhase | null
): string {
  const phaseDocument = phase ? snapshot.phaseDocuments[phase] : null;
  const screenAnalysis = context.screenAnalysis;

  return `Current known problem:
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

Thought notes:
${formatList(snapshot.thoughtNotes)}

Quick answers already visible:
${formatList(snapshot.quickQuestions)}

Current code:
${snapshot.currentCode?.content || '[no code snapshot yet]'}

Current phase anchor:
${phaseDocument ? formatAnchor(phaseDocument.anchor) : '[no phase anchor yet]'}

Current phase main sections:
${phaseDocument ? formatMainSections(phaseDocument.mainSections) : '- none'}

Latest screen analysis:
${formatScreenAnalysis(screenAnalysis)}

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

function formatAnchor(anchor: InterviewSessionSnapshot['phaseDocuments'][RenderableInterviewPhase]['anchor']): string {
  const lines = [
    anchor.title,
    ...anchor.items,
    ...anchor.writeNow.map((item) => `write: ${item}`),
  ];
  if (anchor.note) {
    lines.push(`note: ${anchor.note}`);
  }
  return lines.length > 0 ? lines.map((line) => `- ${line}`).join('\n') : '- none';
}

function formatMainSections(sections: InterviewSessionSnapshot['phaseDocuments'][RenderableInterviewPhase]['mainSections']): string {
  if (sections.length === 0) {
    return '- none';
  }
  return sections
    .map((section) => [`- ${section.title} (${section.tone})`, ...section.lines.map((line) => `  - ${line}`)].join('\n'))
    .join('\n');
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

function formatTranscript(context: InterviewGeneratorContext): string {
  const transcript = context.recentTranscript.slice(-12);
  if (transcript.length === 0) {
    return '- none';
  }
  return transcript.map((item) => `[${item.speaker.toUpperCase()}] ${item.text}`).join('\n');
}

function normalizePhase(phase: InterviewPhase): RenderableInterviewPhase {
  return phase === 'p1_intro' ? 'p2_clarify' : phase;
}
