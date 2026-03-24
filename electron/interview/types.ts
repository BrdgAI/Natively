export type SessionType = 'general' | 'interview';

export type InterviewPhase =
  | 'p1_intro'
  | 'p2_clarify'
  | 'p3_approach'
  | 'p4_code'
  | 'p5_test'
  | 'p6_follow_up';

export type RenderableInterviewPhase = Exclude<InterviewPhase, 'p1_intro'>;

export type InterviewRoutingMode = 'manual' | 'auto';

export type InterviewCodePanelMode =
  | 'skeleton'
  | 'full'
  | 'diff'
  | 'trace'
  | 'debug';

export type InterviewUpdateStatus = 'updated' | 'unchanged' | 'partial';

export type InterviewClarificationStatus =
  | 'pending'
  | 'asked'
  | 'answered'
  | 'retired'
  | 'replaced';

export type InterviewFeedEntryType = 'header' | 'divider' | 'line';

export type InterviewFeedLineState =
  | 'active'
  | 'open'
  | 'answered'
  | 'replaced'
  | 'update'
  | 'note';

export type InterviewCodePaneKind = 'full' | 'diff' | 'replacement';

export interface InterviewGeneratedCode {
  language: 'python' | 'unknown';
  content: string;
}

export interface InterviewFeedEntry {
  id: string;
  blockId: string;
  type: InterviewFeedEntryType;
  blockLabel: string | null;
  text: string | null;
  state: InterviewFeedLineState | null;
  clarificationId: string | null;
}

export interface InterviewCodePane {
  language: 'python' | 'unknown';
  kind: InterviewCodePaneKind;
  title: string;
  content: string;
  notes: string[];
}

export interface InterviewSavedContext {
  title: string;
  lines: string[];
  updatedAt: number | null;
}

export interface InterviewSavedContexts {
  screen: InterviewSavedContext;
  normal: InterviewSavedContext;
}

export type InterviewFetchIndicatorState = 'idle' | 'running' | 'updated' | 'unchanged';

export interface InterviewFetchIndicator {
  state: InterviewFetchIndicatorState;
  message: string;
  triggeredAt: number | null;
}

export interface InterviewFetchIndicators {
  next: InterviewFetchIndicator;
  sync: InterviewFetchIndicator;
}

export interface InterviewRenderStatus {
  status: InterviewUpdateStatus;
  updatedSections: string[];
  message: string;
  at: number;
}

export interface InterviewClarificationCandidate {
  text: string;
  why: string;
}

export interface InterviewClarificationItem {
  id: string;
  text: string;
  why: string;
  status: InterviewClarificationStatus;
  answer: string;
  revision: number;
  replacementReason: string;
}

export interface InterviewFollowUpState {
  request: string;
  impactedArea: string;
  diffRequired: boolean;
  derivedFrom: 'transcript' | 'screen' | 'manual';
}

export interface InterviewPhaseHandoff {
  summaryLines: string[];
  confirmedSpecLines: string[];
  openQuestions: string[];
  updatedAt: number | null;
}

export interface InterviewPhaseDocument {
  phase: RenderableInterviewPhase;
  mainFeed: InterviewFeedEntry[];
  primaryCode: InterviewCodePane | null;
  secondaryCode: InterviewCodePane | null;
  savedContexts: InterviewSavedContexts;
  status: InterviewRenderStatus;
  scrollOffset: number;
  lastUpdatedAt: number | null;
}

export type InterviewPhaseDocumentMap = Record<RenderableInterviewPhase, InterviewPhaseDocument>;
export type InterviewPhaseHandoffMap = Record<RenderableInterviewPhase, InterviewPhaseHandoff>;

export interface InterviewOverlayPayload {
  phase: RenderableInterviewPhase;
  phaseConfidence: number;
  manualOverrideActive: boolean;
  mainLines: string[];
  code?: InterviewGeneratedCode;
  pinnedFacts: string[];
  clarificationQuestions?: InterviewClarificationCandidate[];
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

export interface InterviewLiveTranscriptState {
  interviewerInterim: InterviewTranscriptSegment | null;
  userInterim: InterviewTranscriptSegment | null;
}

export interface InterviewTranscriptEpoch {
  id: string;
  createdAt: number;
  fromTimestamp: number;
  toTimestamp: number;
  compactedSegmentCount: number;
  dominantPhases: RenderableInterviewPhase[];
  summaryLines: string[];
  carryForwardFacts: string[];
  openQuestions: string[];
  source: 'llm' | 'fallback';
}

export interface InterviewTranscriptCompactionPlan {
  id: string;
  createdAt: number;
  startIndex: number;
  endIndexExclusive: number;
  compactedSegments: InterviewTranscriptSegment[];
  fromTimestamp: number;
  toTimestamp: number;
}

export interface InterviewEpochSummaryResult {
  summaryLines: string[];
  carryForwardFacts: string[];
  openQuestions: string[];
  source: 'llm' | 'fallback';
}

export interface InterviewTranscriptEpochSummaryInput {
  snapshot: InterviewSessionSnapshot;
  segments: InterviewTranscriptSegment[];
}

export interface InterviewTranscriptMemoryStats {
  finalSegmentCount: number;
  epochCount: number;
  compactedSegmentCount: number;
  lastCompactedAt: number | null;
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
  phase: RenderableInterviewPhase;
  inputRevision: number;
  payload: InterviewOverlayPayload;
  createdAt: number;
}

export interface InterviewSessionSnapshot {
  active: boolean;
  sessionType: SessionType;
  routingMode: InterviewRoutingMode;
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
  clarificationItems: InterviewClarificationItem[];
  constraints: string[];
  examples: string[];
  approachSummary: string[];
  pinnedFacts: string[];
  requirementChanges: string[];
  activeFollowUp: InterviewFollowUpState | null;
  phaseHandoffs: InterviewPhaseHandoffMap;
  phaseDocuments: InterviewPhaseDocumentMap;
  lastTranscriptAt: number | null;
  lastScreenshotAt: number | null;
  lastTranscriptSnippet: string;
  currentCode: InterviewCodeSnapshot | null;
  latestPayload: InterviewOverlayPayload | null;
  mainScrollOffset: number;
  lastScreenshotPath: string | null;
  lastScreenshotPreview: string | null;
  fetchIndicators: InterviewFetchIndicators;
  transcriptMemory: InterviewTranscriptMemoryStats;
}

export interface InterviewGeneratorContext {
  snapshot: InterviewSessionSnapshot;
  recentTranscript: InterviewTranscriptSegment[];
  earlierMemory: InterviewTranscriptEpoch[];
  screenAnalysis?: InterviewScreenAnalysis | null;
  previousPayload?: InterviewOverlayPayload | null;
}

export interface InterviewModeConfig {
  codingLanguage: 'python';
}
