import { EventEmitter } from 'events';
import {
  InterviewCodeSnapshot,
  InterviewModeConfig,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewScreenAnalysis,
  InterviewSessionSnapshot,
  InterviewTranscriptSegment,
  SessionType,
} from './types';

const DEFAULT_CONFIG: InterviewModeConfig = {
  codingLanguage: 'python',
};

export class InterviewMemoryLedger extends EventEmitter {
  private transcript: InterviewTranscriptSegment[] = [];
  private pausedInterviewSession = false;

  private state: InterviewSessionSnapshot = {
    active: false,
    sessionType: 'general',
    phase: 'p1_intro',
    phaseConfidence: 0,
    manualOverridePhase: null,
    controlStripVisibleUntil: null,
    controlStripHint: null,
    meetingStartedAt: null,
    inputRevision: 0,
    lastGeneratedRevision: 0,
    isGenerating: false,
    isSyncing: false,
    statusMessage: null,
    problemStatement: '',
    clarifiedFacts: [],
    openQuestions: [],
    constraints: [],
    examples: [],
    approachSummary: [],
    pinnedFacts: [],
    thoughtNotes: [],
    quickQuestions: [],
    requirementChanges: [],
    lastTranscriptAt: null,
    lastScreenshotAt: null,
    lastTranscriptSnippet: '',
    currentCode: null,
    latestPayload: null,
    mainScrollOffset: 0,
    lastScreenshotPath: null,
    lastScreenshotPreview: null,
  };

  private config: InterviewModeConfig = DEFAULT_CONFIG;

  public startSession(sessionType: SessionType, config?: Partial<InterviewModeConfig>): void {
    this.transcript = [];
    this.pausedInterviewSession = false;
    this.config = { ...DEFAULT_CONFIG, ...(config || {}) };
    this.state = {
      ...this.state,
      active: sessionType === 'interview',
      sessionType,
      phase: sessionType === 'interview' ? 'p2_clarify' : 'p1_intro',
      phaseConfidence: sessionType === 'interview' ? 0.4 : 0,
      manualOverridePhase: null,
      controlStripVisibleUntil: null,
      controlStripHint: null,
      meetingStartedAt: Date.now(),
      inputRevision: 1,
      lastGeneratedRevision: 0,
      isGenerating: false,
      isSyncing: false,
      statusMessage: sessionType === 'interview' ? 'Interview mode active' : null,
      problemStatement: '',
      clarifiedFacts: [],
      openQuestions: [],
      constraints: [],
      examples: [],
      approachSummary: [],
      pinnedFacts: [],
      thoughtNotes: [],
      quickQuestions: [],
      requirementChanges: [],
      lastTranscriptAt: null,
      lastScreenshotAt: null,
      lastTranscriptSnippet: '',
      currentCode: null,
      latestPayload: null,
      mainScrollOffset: 0,
      lastScreenshotPath: null,
      lastScreenshotPreview: null,
    };
    this.emitUpdate();
  }

  public exitInterviewMode(): void {
    this.pauseInterviewMode();
  }

  public pauseInterviewMode(): void {
    if (this.state.sessionType !== 'interview') {
      return;
    }

    this.pausedInterviewSession = true;
    this.state = {
      ...this.state,
      active: false,
      sessionType: 'general',
      controlStripVisibleUntil: null,
      controlStripHint: null,
      isGenerating: false,
      isSyncing: false,
      statusMessage: 'Interview mode paused',
    };
    this.emitUpdate();
  }

  public resumeInterviewMode(): void {
    if (!this.pausedInterviewSession) {
      return;
    }

    this.pausedInterviewSession = false;
    this.state = {
      ...this.state,
      active: true,
      sessionType: 'interview',
      statusMessage: this.state.latestPayload ? 'Interview mode resumed' : 'Interview mode active',
    };
    this.emitUpdate();
  }

  public endSession(): void {
    this.transcript = [];
    this.pausedInterviewSession = false;
    this.state = {
      ...this.state,
      active: false,
      sessionType: 'general',
      phase: 'p1_intro',
      phaseConfidence: 0,
      manualOverridePhase: null,
      controlStripVisibleUntil: null,
      controlStripHint: null,
      isGenerating: false,
      isSyncing: false,
      latestPayload: null,
      statusMessage: null,
      currentCode: null,
      lastScreenshotPath: null,
      lastScreenshotPreview: null,
      lastScreenshotAt: null,
      mainScrollOffset: 0,
    };
    this.emitUpdate();
  }

  public getConfig(): InterviewModeConfig {
    return { ...this.config };
  }

  public hasPausedInterviewSession(): boolean {
    return this.pausedInterviewSession;
  }

  public hasRetainedInterviewSession(): boolean {
    return this.state.active || this.pausedInterviewSession;
  }

  public getTranscript(): InterviewTranscriptSegment[] {
    return [...this.transcript];
  }

  public getRecentTranscript(limit: number = 24): InterviewTranscriptSegment[] {
    return this.transcript.slice(-limit);
  }

  public addTranscript(segment: InterviewTranscriptSegment): void {
    this.transcript.push(segment);
    if (this.transcript.length > 300) {
      this.transcript = this.transcript.slice(-300);
    }

    this.state = {
      ...this.state,
      lastTranscriptAt: segment.timestamp,
      lastTranscriptSnippet: segment.text.trim(),
    };

    if (segment.final && segment.text.trim()) {
      this.bumpRevision();
    } else {
      this.emitUpdate();
    }
  }

  public setSessionType(sessionType: SessionType): void {
    this.pausedInterviewSession = sessionType === 'interview' ? false : this.pausedInterviewSession;
    this.state = {
      ...this.state,
      sessionType,
      active: sessionType === 'interview',
      phase: sessionType === 'interview' ? this.state.phase : 'p1_intro',
      phaseConfidence: sessionType === 'interview' ? this.state.phaseConfidence : 0,
      manualOverridePhase: sessionType === 'interview' ? this.state.manualOverridePhase : null,
      controlStripVisibleUntil: sessionType === 'interview' ? this.state.controlStripVisibleUntil : null,
      controlStripHint: sessionType === 'interview' ? this.state.controlStripHint : null,
      latestPayload: sessionType === 'interview' ? this.state.latestPayload : null,
    };
    this.emitUpdate();
  }

  public setPhase(phase: InterviewPhase, confidence: number): void {
    this.state = {
      ...this.state,
      phase,
      phaseConfidence: confidence,
    };
    this.emitUpdate();
  }

  public setManualOverridePhase(phase: InterviewPhase | null): void {
    this.state = {
      ...this.state,
      manualOverridePhase: phase,
      statusMessage: phase ? `Manual phase: ${phase}` : this.state.statusMessage,
    };
    this.bumpRevision();
  }

  public clearManualOverridePhase(): void {
    this.state = {
      ...this.state,
      manualOverridePhase: null,
    };
    this.emitUpdate();
  }

  public showControlStrip(hint: string, durationMs: number = 2200): void {
    this.state = {
      ...this.state,
      controlStripVisibleUntil: Date.now() + durationMs,
      controlStripHint: hint,
    };
    this.emitUpdate();
  }

  public hideControlStrip(): void {
    this.state = {
      ...this.state,
      controlStripVisibleUntil: null,
      controlStripHint: null,
    };
    this.emitUpdate();
  }

  public setGenerating(isGenerating: boolean, statusMessage?: string | null): void {
    this.state = {
      ...this.state,
      isGenerating,
      statusMessage: statusMessage === undefined ? this.state.statusMessage : statusMessage,
    };
    this.emitUpdate();
  }

  public setSyncing(isSyncing: boolean, statusMessage?: string | null): void {
    this.state = {
      ...this.state,
      isSyncing,
      statusMessage: statusMessage === undefined ? this.state.statusMessage : statusMessage,
    };
    this.emitUpdate();
  }

  public setMainScrollOffset(offset: number): void {
    this.state = {
      ...this.state,
      mainScrollOffset: offset,
    };
    this.emitUpdate();
  }

  public applyScreenAnalysis(analysis: InterviewScreenAnalysis): void {
    const nextCode: InterviewCodeSnapshot | null = analysis.currentCode
      ? {
          content: analysis.currentCode,
          narration: this.state.currentCode?.narration || [],
          mode: this.state.currentCode?.mode || 'full',
          capturedAt: analysis.capturedAt,
          suspectedMistakes: analysis.likelyMistakes || [],
          source: 'vision',
        }
      : this.state.currentCode;

    this.state = {
      ...this.state,
      problemStatement: analysis.problemStatement || this.state.problemStatement,
      constraints: analysis.givenConstraints && analysis.givenConstraints.length > 0 ? analysis.givenConstraints : this.state.constraints,
      examples: analysis.examples && analysis.examples.length > 0 ? analysis.examples : this.state.examples,
      openQuestions: analysis.visibleQuestions && analysis.visibleQuestions.length > 0 ? analysis.visibleQuestions : this.state.openQuestions,
      requirementChanges: analysis.hints && analysis.hints.length > 0 ? analysis.hints : this.state.requirementChanges,
      thoughtNotes: analysis.likelyMistakes && analysis.likelyMistakes.length > 0
        ? dedupe([...this.state.thoughtNotes, ...analysis.likelyMistakes]).slice(-8)
        : this.state.thoughtNotes,
      quickQuestions: analysis.extractedTests && analysis.extractedTests.length > 0
        ? dedupe([...this.state.quickQuestions, ...analysis.extractedTests]).slice(-6)
        : this.state.quickQuestions,
      currentCode: nextCode,
      lastScreenshotAt: analysis.capturedAt,
      lastScreenshotPath: analysis.screenshotPath,
      lastScreenshotPreview: analysis.screenshotPreview || this.state.lastScreenshotPreview,
    };
    this.bumpRevision();
  }

  public applyGeneratedPayload(payload: InterviewOverlayPayload): void {
    const nextCode: InterviewCodeSnapshot | null = payload.codePanel
      ? {
          content: payload.codePanel.content,
          narration: payload.codePanel.narration,
          mode: payload.codePanel.mode,
          capturedAt: payload.generatedAt,
          suspectedMistakes: payload.codePanel.suspectedMistakes || [],
          source: payload.codePanel.mode === 'diff' ? 'diff' : 'generator',
        }
      : this.state.currentCode;

    this.state = {
      ...this.state,
      latestPayload: payload,
      lastGeneratedRevision: payload.inputRevision,
      clarifiedFacts: payload.pinnedFacts,
      pinnedFacts: payload.pinnedFacts,
      thoughtNotes: payload.thoughtNotes,
      quickQuestions: payload.quickQuestions,
      currentCode: nextCode,
      statusMessage: 'Interview guidance ready',
      isGenerating: false,
      isSyncing: false,
    };
    this.emitUpdate();
  }

  public setProblemStatement(problemStatement: string, constraints: string[] = [], examples: string[] = []): void {
    this.state = {
      ...this.state,
      problemStatement: problemStatement || this.state.problemStatement,
      constraints: constraints.length > 0 ? constraints : this.state.constraints,
      examples: examples.length > 0 ? examples : this.state.examples,
    };
    this.bumpRevision();
  }

  public setOpenQuestions(items: string[]): void {
    this.state = {
      ...this.state,
      openQuestions: dedupe(items).slice(0, 8),
    };
    this.bumpRevision();
  }

  public setApproachSummary(items: string[]): void {
    this.state = {
      ...this.state,
      approachSummary: dedupe(items).slice(0, 8),
    };
    this.bumpRevision();
  }

  public setStatusMessage(message: string | null): void {
    this.state = {
      ...this.state,
      statusMessage: message,
    };
    this.emitUpdate();
  }

  public getSnapshot(): InterviewSessionSnapshot {
    return {
      ...this.state,
      clarifiedFacts: [...this.state.clarifiedFacts],
      openQuestions: [...this.state.openQuestions],
      constraints: [...this.state.constraints],
      examples: [...this.state.examples],
      approachSummary: [...this.state.approachSummary],
      pinnedFacts: [...this.state.pinnedFacts],
      thoughtNotes: [...this.state.thoughtNotes],
      quickQuestions: [...this.state.quickQuestions],
      requirementChanges: [...this.state.requirementChanges],
      controlStripVisibleUntil: this.state.controlStripVisibleUntil,
      controlStripHint: this.state.controlStripHint,
      currentCode: this.state.currentCode ? { ...this.state.currentCode } : null,
      latestPayload: this.state.latestPayload
        ? {
            ...this.state.latestPayload,
            speakNow: [...this.state.latestPayload.speakNow],
            speakIfAsked: [...this.state.latestPayload.speakIfAsked],
            writeNow: [...this.state.latestPayload.writeNow],
            thoughtNotes: [...this.state.latestPayload.thoughtNotes],
            quickQuestions: [...this.state.latestPayload.quickQuestions],
            pinnedFacts: [...this.state.latestPayload.pinnedFacts],
            changes: this.state.latestPayload.changes.map((item) => ({ ...item })),
            codePanel: this.state.latestPayload.codePanel
              ? {
                  ...this.state.latestPayload.codePanel,
                  narration: [...this.state.latestPayload.codePanel.narration],
                  suspectedMistakes: [...(this.state.latestPayload.codePanel.suspectedMistakes || [])],
                }
              : undefined,
          }
        : null,
    };
  }

  private bumpRevision(): void {
    this.state = {
      ...this.state,
      inputRevision: this.state.inputRevision + 1,
    };
    this.emitUpdate();
  }

  private emitUpdate(): void {
    this.emit('state-updated', this.getSnapshot());
  }
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const normalized = item.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}
