import { InterviewGeneratorContext, InterviewPhase } from './types';

const OUTPUT_SCHEMA = `Return JSON only with this exact shape:
{
  "speakNow": ["short natural line"],
  "speakIfAsked": ["backup line"],
  "writeNow": ["what to type"],
  "thoughtNotes": ["silent thinking note"],
  "quickQuestions": ["short question or answer to keep ready"],
  "pinnedFacts": ["fact that should stay visible"],
  "codePanel": {
    "language": "python",
    "mode": "skeleton",
    "content": "full code or diff text",
    "narration": ["what to say while typing"],
    "suspectedMistakes": ["bug note"]
  }
}
Use empty arrays when a section has no content. Use null for codePanel when no code is needed.`;

export const INTERVIEW_GENERATOR_SYSTEM_PROMPT = `You are writing interview overlay guidance for a live software engineering candidate.
The user may read directly from the screen.
Everything must sound natural, calm, and professional.
Never produce chatbot framing.
Never explain the JSON format.
Prefer short direct lines over essays.
If code is needed, use Python unless the context clearly says otherwise.
${OUTPUT_SCHEMA}`;

export const INTERVIEW_VISION_SYSTEM_PROMPT = `You analyze screenshots from live technical interviews.
Return JSON only.
Be precise, literal, and concise.
If text is unclear, leave the field empty instead of inventing details.`;

export function buildPhasePrompt(phase: InterviewPhase, context: InterviewGeneratorContext): string {
  switch (phase) {
    case 'p2_clarify':
      return buildClarifyPrompt(context);
    case 'p3_approach':
      return buildApproachPrompt(context);
    case 'p4_code':
      return buildCodingPrompt(context);
    case 'p5_test':
      return buildTestingPrompt(context);
    case 'p6_close':
      return buildClosingPrompt(context);
    default:
      return buildClarifyPrompt(context);
  }
}

export function buildVisionPrompt(phase: InterviewPhase, transcriptContext: string): string {
  if (phase === 'p2_clarify') {
    return `Extract the coding problem from the screenshot.
Return JSON with:
{
  "problemStatement": "visible problem statement",
  "givenConstraints": ["constraint"],
  "examples": ["example"],
  "visibleQuestions": ["clarification question implied by the screenshot"],
  "hints": ["visible interviewer hint or requirement change"]
}
Transcript context:
${transcriptContext}`;
  }

  if (phase === 'p4_code' || phase === 'p5_test') {
    return `Extract the current code and any visible requirement changes or test data from the screenshot.
Return JSON with:
{
  "currentCode": "visible code only",
  "dryRunInput": "visible test input or sample run",
  "hints": ["visible requirement changes or interviewer hints"],
  "likelyMistakes": ["possible typo or bug visible on screen"],
  "extractedTests": ["visible test case or edge case"]
}
Transcript context:
${transcriptContext}`;
  }

  return `Analyze the screenshot for live interview context.
Return JSON with:
{
  "problemStatement": "",
  "givenConstraints": [],
  "examples": [],
  "visibleQuestions": [],
  "currentCode": "",
  "dryRunInput": "",
  "hints": [],
  "likelyMistakes": [],
  "extractedTests": []
}
Transcript context:
${transcriptContext}`;
}

function buildClarifyPrompt(context: InterviewGeneratorContext): string {
  return `Current phase: clarification.
User needs exact lines to restate the problem, ask the next best questions, and type a constraint block.
Order questions by importance, clarity, and relevance.
Keep enough verbosity on screen that the user can fill time naturally.

Problem statement:
${context.snapshot.problemStatement || '[not confirmed yet]'}

Known constraints:
${formatList(context.snapshot.constraints)}

Known examples:
${formatList(context.snapshot.examples)}

Open questions:
${formatList(context.snapshot.openQuestions)}

Recent transcript:
${formatTranscript(context)}
`;
}

function buildApproachPrompt(context: InterviewGeneratorContext): string {
  return `Current phase: approach discussion.
Generate a natural spoken flow from brute force to optimized solution.
Include the alignment ask before coding.
Mention time and space complexity clearly.

Problem statement:
${context.snapshot.problemStatement || '[not confirmed yet]'}

Constraints:
${formatList(context.snapshot.constraints)}

Recent transcript:
${formatTranscript(context)}
`;
}

function buildCodingPrompt(context: InterviewGeneratorContext): string {
  return `Current phase: coding.
Generate a Python-first skeleton or patch.
The main narration should be something the user can read aloud while typing.
If there is a requirement change, show the change as a diff-oriented patch.
If there are likely mistakes, mention them in suspectedMistakes.

Problem statement:
${context.snapshot.problemStatement || '[not confirmed yet]'}

Constraints:
${formatList(context.snapshot.constraints)}

Approach summary:
${formatList(context.snapshot.approachSummary)}

Requirement changes:
${formatList(context.snapshot.requirementChanges)}

Current code:
${context.snapshot.currentCode?.content || '[no code snapshot yet]'}

Recent transcript:
${formatTranscript(context)}
`;
}

function buildTestingPrompt(context: InterviewGeneratorContext): string {
  return `Current phase: testing and complexity.
Generate a dry run, edge cases, and concise complexity language.
If a visible test input exists, use it.

Current code:
${context.snapshot.currentCode?.content || '[no code snapshot yet]'}

Visible tests or quick questions:
${formatList(context.snapshot.quickQuestions)}

Recent transcript:
${formatTranscript(context)}
`;
}

function buildClosingPrompt(context: InterviewGeneratorContext): string {
  return `Current phase: closing or follow-up.
Generate a short change response, a closing explanation line, and one smart interviewer question if helpful.

Recent transcript:
${formatTranscript(context)}

Requirement changes:
${formatList(context.snapshot.requirementChanges)}
`;
}

function formatList(items: string[]): string {
  if (!items || items.length === 0) return '- none';
  return items.map((item) => `- ${item}`).join('\n');
}

function formatTranscript(context: InterviewGeneratorContext): string {
  const transcript = context.recentTranscript.slice(-12);
  if (transcript.length === 0) return '- none';
  return transcript
    .map((item) => `[${item.speaker.toUpperCase()}] ${item.text}`)
    .join('\n');
}
