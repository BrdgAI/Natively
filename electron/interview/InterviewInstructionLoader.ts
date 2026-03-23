import fs from 'fs';
import path from 'path';
import { InterviewPhase, RenderableInterviewPhase } from './types';

const INSTRUCTION_FILES: Record<'index' | 'global' | 'visionGlobal', string> = {
  index: 'index-interview.md',
  global: 'global-output-rules.md',
  visionGlobal: 'vision-global.md',
};

const PHASE_FILES: Record<RenderableInterviewPhase, string> = {
  p2_clarify: 'phase-2-clarify.md',
  p3_approach: 'phase-3-approach.md',
  p4_code: 'phase-4-code.md',
  p5_test: 'phase-5-test.md',
  p6_follow_up: 'phase-6-follow-up.md',
};

const VISION_FILES: Record<RenderableInterviewPhase, string> = {
  p2_clarify: 'vision-clarify.md',
  p3_approach: 'vision-clarify.md',
  p4_code: 'vision-code.md',
  p5_test: 'vision-test.md',
  p6_follow_up: 'vision-code.md',
};

const INSTRUCTION_DIR_CANDIDATES = [
  path.resolve(process.cwd(), 'electron', 'interview', 'instructions'),
  path.resolve(__dirname, 'instructions'),
];

function resolveInstructionDirectory(): string {
  for (const candidate of INSTRUCTION_DIR_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return INSTRUCTION_DIR_CANDIDATES[0];
}

function readInstructionFile(fileName: string): string {
  const instructionDirectory = resolveInstructionDirectory();
  const targetPath = path.join(instructionDirectory, fileName);
  try {
    return fs.readFileSync(targetPath, 'utf8').trim();
  } catch {
    return '';
  }
}

function normalizePhase(phase: InterviewPhase): RenderableInterviewPhase {
  return phase === 'p1_intro' ? 'p2_clarify' : phase;
}

export interface InterviewInstructionPack {
  index: string;
  global: string;
  phase: string;
}

export interface InterviewVisionInstructionPack {
  global: string;
  phase: string;
}

export function loadGeneratorInstructions(phase: InterviewPhase): InterviewInstructionPack {
  const normalizedPhase = normalizePhase(phase);
  return {
    index: readInstructionFile(INSTRUCTION_FILES.index),
    global: readInstructionFile(INSTRUCTION_FILES.global),
    phase: readInstructionFile(PHASE_FILES[normalizedPhase]),
  };
}

export function loadVisionInstructions(phase: InterviewPhase): InterviewVisionInstructionPack {
  const normalizedPhase = normalizePhase(phase);
  return {
    global: readInstructionFile(INSTRUCTION_FILES.visionGlobal),
    phase: readInstructionFile(VISION_FILES[normalizedPhase]),
  };
}

export function getInterviewInstructionFiles(): string[] {
  return [
    INSTRUCTION_FILES.index,
    INSTRUCTION_FILES.global,
    ...Object.values(PHASE_FILES),
    INSTRUCTION_FILES.visionGlobal,
    ...new Set(Object.values(VISION_FILES)),
  ];
}
