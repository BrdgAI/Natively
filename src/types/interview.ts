export type SessionType = 'general' | 'interview'

export type InterviewPhase =
  | 'p1_intro'
  | 'p2_clarify'
  | 'p3_approach'
  | 'p4_code'
  | 'p5_test'
  | 'p6_follow_up'

export type RenderableInterviewPhase = Exclude<InterviewPhase, 'p1_intro'>

export type InterviewRoutingMode = 'manual' | 'auto'

export type InterviewCodePanelMode =
  | 'skeleton'
  | 'full'
  | 'diff'
  | 'trace'
  | 'debug'

export type InterviewUpdateStatus = 'updated' | 'unchanged' | 'partial'

export type InterviewMainSectionTone = 'primary' | 'secondary' | 'warning'

export type InterviewClarificationStatus =
  | 'pending'
  | 'asked'
  | 'answered'
  | 'retired'
  | 'replaced'

export interface InterviewChangeItem {
  label: string
  detail: string
  severity: 'new' | 'updated' | 'warning'
}

export interface InterviewCodePanel {
  language: 'python' | 'unknown'
  mode: InterviewCodePanelMode
  content: string
  narration: string[]
  suspectedMistakes: string[]
}

export interface InterviewAnchorBlock {
  title: string
  items: string[]
  writeNow: string[]
  note: string | null
}

export interface InterviewMainSection {
  id: string
  title: string
  lines: string[]
  tone: InterviewMainSectionTone
}

export interface InterviewQuickAnswerItem {
  id: string
  line: string
}

export interface InterviewUpdateSummary {
  status: InterviewUpdateStatus
  updatedSections: string[]
  message: string
  at: number
}

export interface InterviewExtractedTextSummary {
  problemText: string
  requirementDelta: string[]
  dryRunInput: string
  codeObservations: string[]
  capturedAt: number | null
}

export interface InterviewClarificationCandidate {
  text: string
  why: string
}

export interface InterviewClarificationItem {
  id: string
  text: string
  why: string
  status: InterviewClarificationStatus
  answer: string
  revision: number
  replacementReason: string
}

export interface InterviewFollowUpState {
  request: string
  impactedArea: string
  diffRequired: boolean
  derivedFrom: 'transcript' | 'screen' | 'manual'
}

export interface InterviewPhaseHandoff {
  summaryLines: string[]
  confirmedSpecLines: string[]
  openQuestions: string[]
  updatedAt: number | null
}

export interface InterviewPhaseDocument {
  phase: RenderableInterviewPhase
  anchor: InterviewAnchorBlock
  mainSections: InterviewMainSection[]
  quickAnswers: InterviewQuickAnswerItem[]
  codePanel: InterviewCodePanel | null
  extractedText: InterviewExtractedTextSummary
  updateSummary: InterviewUpdateSummary
  scrollOffset: number
  lastUpdatedAt: number | null
}

export type InterviewPhaseDocumentMap = Record<RenderableInterviewPhase, InterviewPhaseDocument>
export type InterviewPhaseHandoffMap = Record<RenderableInterviewPhase, InterviewPhaseHandoff>

export interface InterviewOverlayPayload {
  phase: RenderableInterviewPhase
  phaseConfidence: number
  manualOverrideActive: boolean
  speakNow: string[]
  speakIfAsked: string[]
  writeNow: string[]
  thoughtNotes: string[]
  quickQuestions: string[]
  codePanel?: InterviewCodePanel
  pinnedFacts: string[]
  changes: InterviewChangeItem[]
  anchor?: InterviewAnchorBlock
  mainSections?: InterviewMainSection[]
  clarificationQuestions?: InterviewClarificationCandidate[]
  updateSummary?: InterviewUpdateSummary
  freshness: {
    transcriptUpdatedMsAgo: number
    screenshotUpdatedMsAgo: number | null
    generatedMsAgo: number
  }
  generatedAt: number
  inputRevision: number
}

export interface InterviewCodeSnapshot {
  content: string
  narration: string[]
  mode: InterviewCodePanelMode
  capturedAt: number
  suspectedMistakes: string[]
  source: 'vision' | 'generator' | 'diff'
}

export interface InterviewSessionSnapshot {
  active: boolean
  sessionType: SessionType
  routingMode: InterviewRoutingMode
  phase: InterviewPhase
  phaseConfidence: number
  manualOverridePhase: InterviewPhase | null
  controlStripVisibleUntil: number | null
  controlStripHint: string | null
  meetingStartedAt: number | null
  inputRevision: number
  lastGeneratedRevision: number
  isGenerating: boolean
  isSyncing: boolean
  statusMessage: string | null
  problemStatement: string
  clarifiedFacts: string[]
  openQuestions: string[]
  clarificationItems: InterviewClarificationItem[]
  constraints: string[]
  examples: string[]
  approachSummary: string[]
  pinnedFacts: string[]
  thoughtNotes: string[]
  quickQuestions: string[]
  requirementChanges: string[]
  activeFollowUp: InterviewFollowUpState | null
  phaseHandoffs: InterviewPhaseHandoffMap
  phaseDocuments: InterviewPhaseDocumentMap
  lastTranscriptAt: number | null
  lastScreenshotAt: number | null
  lastTranscriptSnippet: string
  currentCode: InterviewCodeSnapshot | null
  latestPayload: InterviewOverlayPayload | null
  mainScrollOffset: number
  lastScreenshotPath: string | null
  lastScreenshotPreview: string | null
}
