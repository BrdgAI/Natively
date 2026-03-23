export type SessionType = 'general' | 'interview';

export type InterviewPhase =
  | 'p1_intro'
  | 'p2_clarify'
  | 'p3_approach'
  | 'p4_code'
  | 'p5_test'
  | 'p6_close';

export type InterviewCodePanelMode =
  | 'skeleton'
  | 'full'
  | 'diff'
  | 'trace'
  | 'debug';

export type InterviewChangeSeverity = 'new' | 'updated' | 'warning';

export interface InterviewChangeItem {
  label: string;
  detail: string;
  severity: InterviewChangeSeverity;
}

export interface InterviewCodePanel {
  language: 'python' | 'unknown';
  mode: InterviewCodePanelMode;
  content: string;
  narration: string[];
  suspectedMistakes?: string[];
}

export interface InterviewOverlayPayload {
  phase: Exclude<InterviewPhase, 'p1_intro'>;
  phaseConfidence: number;
  manualOverrideActive: boolean;
  speakNow: string[];
  speakIfAsked: string[];
  writeNow: string[];
  thoughtNotes: string[];
  quickQuestions: string[];
  codePanel?: InterviewCodePanel;
  pinnedFacts: string[];
  changes: InterviewChangeItem[];
  freshness: {
    transcriptUpdatedMsAgo: number;
    screenshotUpdatedMsAgo: number | null;
    generatedMsAgo: number;
  };
  generatedAt: number;
  inputRevision: number;
}

export interface InterviewTranscriptSegment {
  speaker: string;
  text: string;
  timestamp: number;
  final: boolean;
  confidence?: number;
}

export interface InterviewCodeSnapshot {
  content: string;
  narration: string[];
  mode: InterviewCodePanelMode;
  capturedAt: number;
  suspectedMistakes: string[];
  source: 'vision' | 'generator' | 'diff';
}

export interface InterviewScreenAnalysis {
  screenshotPath: string;
  screenshotPreview?: string;
  capturedAt: number;
  problemStatement?: string;
  givenConstraints?: string[];
  examples?: string[];
  visibleQuestions?: string[];
  currentCode?: string;
  dryRunInput?: string;
  hints?: string[];
  likelyMistakes?: string[];
  extractedTests?: string[];
}

export interface InterviewBufferEntry {
  phase: InterviewPhase;
  inputRevision: number;
  payload: InterviewOverlayPayload;
  createdAt: number;
}

export interface InterviewSessionSnapshot {
  active: boolean;
  sessionType: SessionType;
  phase: InterviewPhase;
  phaseConfidence: number;
  manualOverridePhase: InterviewPhase | null;
  controlStripVisibleUntil: number | null;
  controlStripHint: string | null;
  meetingStartedAt: number | null;
  inputRevision: number;
  lastGeneratedRevision: number;
  isGenerating: boolean;
  isSyncing: boolean;
  statusMessage: string | null;
  problemStatement: string;
  clarifiedFacts: string[];
  openQuestions: string[];
  constraints: string[];
  examples: string[];
  approachSummary: string[];
  pinnedFacts: string[];
  thoughtNotes: string[];
  quickQuestions: string[];
  requirementChanges: string[];
  lastTranscriptAt: number | null;
  lastScreenshotAt: number | null;
  lastTranscriptSnippet: string;
  currentCode: InterviewCodeSnapshot | null;
  latestPayload: InterviewOverlayPayload | null;
  mainScrollOffset: number;
  lastScreenshotPath: string | null;
  lastScreenshotPreview: string | null;
}

export interface InterviewGeneratorContext {
  snapshot: InterviewSessionSnapshot;
  recentTranscript: InterviewTranscriptSegment[];
  screenAnalysis?: InterviewScreenAnalysis | null;
  previousPayload?: InterviewOverlayPayload | null;
}

export interface InterviewModeConfig {
  codingLanguage: 'python';
}
