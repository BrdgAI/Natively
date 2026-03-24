import { EventEmitter } from 'events';
import {
  InterviewClarificationItem,
  InterviewCodeSnapshot,
  InterviewFollowUpState,
  InterviewModeConfig,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewPhaseHandoff,
  InterviewPhaseHandoffMap,
  InterviewPhaseDocument,
  InterviewPhaseDocumentMap,
  InterviewRoutingMode,
  InterviewScreenAnalysis,
  InterviewSessionSnapshot,
  InterviewTranscriptSegment,
  RenderableInterviewPhase,
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
    routingMode: 'manual',
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
    clarificationItems: [],
    constraints: [],
    examples: [],
    approachSummary: [],
    pinnedFacts: [],
    thoughtNotes: [],
    quickQuestions: [],
    requirementChanges: [],
    activeFollowUp: null,
    phaseHandoffs: createEmptyPhaseHandoffs(),
    phaseDocuments: createEmptyPhaseDocuments(),
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

    const phaseDocuments = createEmptyPhaseDocuments();
    const phaseHandoffs = createEmptyPhaseHandoffs();

    this.state = {
      ...this.state,
      active: sessionType === 'interview',
      sessionType,
      routingMode: 'manual',
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
      clarificationItems: [],
      constraints: [],
      examples: [],
      approachSummary: [],
      pinnedFacts: [],
      thoughtNotes: [],
      quickQuestions: [],
      requirementChanges: [],
      activeFollowUp: null,
      phaseHandoffs,
      phaseDocuments,
      lastTranscriptAt: null,
      lastScreenshotAt: null,
      lastTranscriptSnippet: '',
      currentCode: null,
      latestPayload: null,
      mainScrollOffset: phaseDocuments.p2_clarify.scrollOffset,
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
      mainScrollOffset: getActivePhaseDocument(this.state).scrollOffset,
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
      routingMode: 'manual',
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
      clarifiedFacts: [],
      openQuestions: [],
      clarificationItems: [],
      constraints: [],
      examples: [],
      approachSummary: [],
      pinnedFacts: [],
      thoughtNotes: [],
      quickQuestions: [],
      requirementChanges: [],
      activeFollowUp: null,
      phaseHandoffs: createEmptyPhaseHandoffs(),
      phaseDocuments: createEmptyPhaseDocuments(),
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
    const nextState: InterviewSessionSnapshot = {
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
    this.state = withMainScrollOffset(nextState);
    this.emitUpdate();
  }

  public setPhase(phase: InterviewPhase, confidence: number): void {
    this.state = withMainScrollOffset({
      ...this.state,
      phase,
      phaseConfidence: confidence,
    });
    this.emitUpdate();
  }

  public setRoutingMode(routingMode: InterviewRoutingMode): void {
    this.state = {
      ...this.state,
      routingMode,
    };
    this.emitUpdate();
  }

  public setManualOverridePhase(phase: InterviewPhase | null): void {
    this.state = withMainScrollOffset({
      ...this.state,
      manualOverridePhase: phase,
      statusMessage: phase ? `Manual phase: ${phase}` : this.state.statusMessage,
    });
    this.bumpRevision();
  }

  public clearManualOverridePhase(): void {
    this.state = withMainScrollOffset({
      ...this.state,
      manualOverridePhase: null,
    });
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
    const activePhase = resolveRenderablePhase(this.state);
    const phaseDocuments = {
      ...this.state.phaseDocuments,
      [activePhase]: {
        ...this.state.phaseDocuments[activePhase],
        scrollOffset: offset,
      },
    };

    this.state = {
      ...this.state,
      phaseDocuments,
      mainScrollOffset: offset,
    };
    this.emitUpdate();
  }

  public setClarificationItems(items: InterviewClarificationItem[]): void {
    this.state = {
      ...this.state,
      clarificationItems: items.map(cloneClarificationItem),
      openQuestions: items
        .filter((item) => item.status === 'pending' || item.status === 'asked')
        .map((item) => item.text),
    };
    this.bumpRevision();
  }

  public setActiveFollowUp(followUp: InterviewFollowUpState | null): void {
    this.state = {
      ...this.state,
      activeFollowUp: followUp ? { ...followUp } : null,
    };
    this.bumpRevision();
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

    const activePhase = resolveRenderablePhase(this.state);
    const previousDocument = this.state.phaseDocuments[activePhase];
    const nextExtractedText = {
      problemText: analysis.problemStatement || previousDocument.extractedText.problemText,
      requirementDelta: analysis.hints && analysis.hints.length > 0
        ? dedupe([...previousDocument.extractedText.requirementDelta, ...analysis.hints])
        : previousDocument.extractedText.requirementDelta,
      dryRunInput: analysis.dryRunInput || previousDocument.extractedText.dryRunInput,
      codeObservations: dedupe([
        ...previousDocument.extractedText.codeObservations,
        ...(analysis.likelyMistakes || []),
        ...(analysis.extractedTests || []),
      ]).slice(-8),
      capturedAt: analysis.capturedAt,
    };

    const phaseDocuments = {
      ...this.state.phaseDocuments,
      [activePhase]: {
        ...previousDocument,
        extractedText: nextExtractedText,
        updateSummary: {
          status: 'updated',
          updatedSections: ['Extracted Text'],
          message: 'Updated: Extracted Text',
          at: Date.now(),
        },
        lastUpdatedAt: Date.now(),
      },
    };

    this.state = withMainScrollOffset({
      ...this.state,
      problemStatement: analysis.problemStatement || this.state.problemStatement,
      constraints: analysis.givenConstraints && analysis.givenConstraints.length > 0
        ? dedupe([...this.state.constraints, ...analysis.givenConstraints])
        : this.state.constraints,
      examples: analysis.examples && analysis.examples.length > 0
        ? dedupe([...this.state.examples, ...analysis.examples])
        : this.state.examples,
      openQuestions: analysis.visibleQuestions && analysis.visibleQuestions.length > 0
        ? dedupe([...this.state.openQuestions, ...analysis.visibleQuestions]).slice(0, 10)
        : this.state.openQuestions,
      requirementChanges: analysis.hints && analysis.hints.length > 0
        ? dedupe([...this.state.requirementChanges, ...analysis.hints]).slice(0, 10)
        : this.state.requirementChanges,
      clarifiedFacts: dedupe([
        ...this.state.clarifiedFacts,
        ...(analysis.givenConstraints || []),
      ]).slice(0, 10),
      thoughtNotes: analysis.likelyMistakes && analysis.likelyMistakes.length > 0
        ? dedupe([...this.state.thoughtNotes, ...analysis.likelyMistakes]).slice(-8)
        : this.state.thoughtNotes,
      quickQuestions: analysis.extractedTests && analysis.extractedTests.length > 0
        ? dedupe([...this.state.quickQuestions, ...analysis.extractedTests]).slice(-8)
        : this.state.quickQuestions,
      activeFollowUp: buildFollowUpFromAnalysis(analysis, this.state.activeFollowUp),
      phaseDocuments,
      currentCode: nextCode,
      lastScreenshotAt: analysis.capturedAt,
      lastScreenshotPath: analysis.screenshotPath,
      lastScreenshotPreview: analysis.screenshotPreview || this.state.lastScreenshotPreview,
    });
    this.bumpRevision();
  }

  public applyGeneratedPayload(
    payload: InterviewOverlayPayload,
    phaseDocument: InterviewPhaseDocument,
    clarificationItems?: InterviewClarificationItem[],
    phaseHandoff?: InterviewPhaseHandoff
  ): void {
    const nextCode: InterviewCodeSnapshot | null = payload.codePanel
      ? payload.codePanel.mode === 'diff' && this.state.currentCode
        ? {
            ...this.state.currentCode,
            capturedAt: payload.generatedAt,
            suspectedMistakes: payload.codePanel.suspectedMistakes.length > 0
              ? payload.codePanel.suspectedMistakes
              : this.state.currentCode.suspectedMistakes,
          }
        : {
            content: payload.codePanel.content,
            narration: payload.codePanel.narration,
            mode: payload.codePanel.mode,
            capturedAt: payload.generatedAt,
            suspectedMistakes: payload.codePanel.suspectedMistakes,
            source: payload.codePanel.mode === 'diff' ? 'diff' : 'generator',
          }
      : this.state.currentCode;

    const phaseDocuments = {
      ...this.state.phaseDocuments,
      [payload.phase]: clonePhaseDocument(phaseDocument),
    };
    const phaseHandoffs = {
      ...this.state.phaseHandoffs,
      [payload.phase]: phaseHandoff
        ? clonePhaseHandoff(phaseHandoff)
        : this.state.phaseHandoffs[payload.phase],
    };

    const nextClarificationItems = clarificationItems
      ? clarificationItems.map(cloneClarificationItem)
      : this.state.clarificationItems;

    this.state = withMainScrollOffset({
      ...this.state,
      latestPayload: clonePayload(payload),
      lastGeneratedRevision: payload.inputRevision,
      clarifiedFacts: dedupe([...this.state.clarifiedFacts, ...payload.pinnedFacts]).slice(0, 10),
      openQuestions: nextClarificationItems
        .filter((item) => item.status === 'pending' || item.status === 'asked')
        .map((item) => item.text),
      clarificationItems: nextClarificationItems,
      pinnedFacts: dedupe(payload.pinnedFacts).slice(0, 10),
      approachSummary: payload.phase === 'p3_approach'
        ? dedupe(payload.speakNow.slice(0, 6))
        : this.state.approachSummary,
      thoughtNotes: dedupe(payload.thoughtNotes).slice(0, 10),
      quickQuestions: dedupe(payload.quickQuestions).slice(0, 10),
      activeFollowUp: payload.phase === 'p6_follow_up'
        ? {
            request: payload.speakNow[0] || this.state.activeFollowUp?.request || '',
            impactedArea: payload.codePanel?.mode === 'diff' ? 'Code diff' : this.state.activeFollowUp?.impactedArea || 'Current solution',
            diffRequired: payload.codePanel?.mode === 'diff',
            derivedFrom: this.state.activeFollowUp?.derivedFrom || 'transcript',
          }
        : this.state.activeFollowUp,
      phaseHandoffs,
      currentCode: nextCode,
      phaseDocuments,
      statusMessage: 'Interview guidance ready',
      isGenerating: false,
      isSyncing: false,
    });
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
      openQuestions: dedupe(items).slice(0, 10),
    };
    this.bumpRevision();
  }

  public setApproachSummary(items: string[]): void {
    this.state = {
      ...this.state,
      approachSummary: dedupe(items).slice(0, 10),
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
      clarificationItems: this.state.clarificationItems.map(cloneClarificationItem),
      constraints: [...this.state.constraints],
      examples: [...this.state.examples],
      approachSummary: [...this.state.approachSummary],
      pinnedFacts: [...this.state.pinnedFacts],
      thoughtNotes: [...this.state.thoughtNotes],
      quickQuestions: [...this.state.quickQuestions],
      requirementChanges: [...this.state.requirementChanges],
      activeFollowUp: this.state.activeFollowUp ? { ...this.state.activeFollowUp } : null,
      phaseHandoffs: clonePhaseHandoffs(this.state.phaseHandoffs),
      phaseDocuments: clonePhaseDocuments(this.state.phaseDocuments),
      controlStripVisibleUntil: this.state.controlStripVisibleUntil,
      controlStripHint: this.state.controlStripHint,
      currentCode: this.state.currentCode ? { ...this.state.currentCode, narration: [...this.state.currentCode.narration], suspectedMistakes: [...this.state.currentCode.suspectedMistakes] } : null,
      latestPayload: this.state.latestPayload ? clonePayload(this.state.latestPayload) : null,
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

function buildFollowUpFromAnalysis(
  analysis: InterviewScreenAnalysis,
  current: InterviewFollowUpState | null
): InterviewFollowUpState | null {
  if (!analysis.hints || analysis.hints.length === 0) {
    return current;
  }

  return {
    request: analysis.hints[0],
    impactedArea: analysis.currentCode ? 'Visible code' : current?.impactedArea || 'Current solution',
    diffRequired: Boolean(analysis.currentCode),
    derivedFrom: 'screen',
  };
}

function withMainScrollOffset(snapshot: InterviewSessionSnapshot): InterviewSessionSnapshot {
  const activeDocument = getActivePhaseDocument(snapshot);
  return {
    ...snapshot,
    mainScrollOffset: activeDocument.scrollOffset,
  };
}

function getActivePhaseDocument(snapshot: InterviewSessionSnapshot): InterviewPhaseDocument {
  return snapshot.phaseDocuments[resolveRenderablePhase(snapshot)];
}

function resolveRenderablePhase(snapshot: InterviewSessionSnapshot): RenderableInterviewPhase {
  const phase = snapshot.manualOverridePhase || snapshot.phase;
  return phase === 'p1_intro' ? 'p2_clarify' : phase;
}

function createEmptyPhaseDocuments(): InterviewPhaseDocumentMap {
  return {
    p2_clarify: createEmptyPhaseDocument('p2_clarify'),
    p3_approach: createEmptyPhaseDocument('p3_approach'),
    p4_code: createEmptyPhaseDocument('p4_code'),
    p5_test: createEmptyPhaseDocument('p5_test'),
    p6_follow_up: createEmptyPhaseDocument('p6_follow_up'),
  };
}

function createEmptyPhaseHandoffs(): InterviewPhaseHandoffMap {
  return {
    p2_clarify: createEmptyPhaseHandoff(),
    p3_approach: createEmptyPhaseHandoff(),
    p4_code: createEmptyPhaseHandoff(),
    p5_test: createEmptyPhaseHandoff(),
    p6_follow_up: createEmptyPhaseHandoff(),
  };
}

function createEmptyPhaseDocument(phase: RenderableInterviewPhase): InterviewPhaseDocument {
  return {
    phase,
    anchor: {
      title: formatPhase(phase),
      items: [],
      writeNow: [],
      note: null,
    },
    mainSections: [],
    quickAnswers: [],
    codePanel: null,
    extractedText: {
      problemText: '',
      requirementDelta: [],
      dryRunInput: '',
      codeObservations: [],
      capturedAt: null,
    },
    updateSummary: {
      status: 'partial',
      updatedSections: [],
      message: 'Waiting for first update',
      at: 0,
    },
    scrollOffset: 0,
    lastUpdatedAt: null,
  };
}

function createEmptyPhaseHandoff(): InterviewPhaseHandoff {
  return {
    summaryLines: [],
    confirmedSpecLines: [],
    openQuestions: [],
    updatedAt: null,
  };
}

function clonePhaseDocuments(documents: InterviewPhaseDocumentMap): InterviewPhaseDocumentMap {
  return {
    p2_clarify: clonePhaseDocument(documents.p2_clarify),
    p3_approach: clonePhaseDocument(documents.p3_approach),
    p4_code: clonePhaseDocument(documents.p4_code),
    p5_test: clonePhaseDocument(documents.p5_test),
    p6_follow_up: clonePhaseDocument(documents.p6_follow_up),
  };
}

function clonePhaseHandoffs(handoffs: InterviewPhaseHandoffMap): InterviewPhaseHandoffMap {
  return {
    p2_clarify: clonePhaseHandoff(handoffs.p2_clarify),
    p3_approach: clonePhaseHandoff(handoffs.p3_approach),
    p4_code: clonePhaseHandoff(handoffs.p4_code),
    p5_test: clonePhaseHandoff(handoffs.p5_test),
    p6_follow_up: clonePhaseHandoff(handoffs.p6_follow_up),
  };
}

function clonePhaseDocument(document: InterviewPhaseDocument): InterviewPhaseDocument {
  return {
    phase: document.phase,
    anchor: {
      title: document.anchor.title,
      items: [...document.anchor.items],
      writeNow: [...document.anchor.writeNow],
      note: document.anchor.note,
    },
    mainSections: document.mainSections.map((section) => ({
      id: section.id,
      title: section.title,
      lines: [...section.lines],
      tone: section.tone,
    })),
    quickAnswers: document.quickAnswers.map((item) => ({ ...item })),
    codePanel: document.codePanel
      ? {
          language: document.codePanel.language,
          mode: document.codePanel.mode,
          content: document.codePanel.content,
          narration: [...document.codePanel.narration],
          suspectedMistakes: [...document.codePanel.suspectedMistakes],
        }
      : null,
    extractedText: {
      problemText: document.extractedText.problemText,
      requirementDelta: [...document.extractedText.requirementDelta],
      dryRunInput: document.extractedText.dryRunInput,
      codeObservations: [...document.extractedText.codeObservations],
      capturedAt: document.extractedText.capturedAt,
    },
    updateSummary: {
      status: document.updateSummary.status,
      updatedSections: [...document.updateSummary.updatedSections],
      message: document.updateSummary.message,
      at: document.updateSummary.at,
    },
    scrollOffset: document.scrollOffset,
    lastUpdatedAt: document.lastUpdatedAt,
  };
}

function cloneClarificationItem(item: InterviewClarificationItem): InterviewClarificationItem {
  return {
    id: item.id,
    text: item.text,
    why: item.why,
    status: item.status,
    answer: item.answer,
    revision: item.revision,
    replacementReason: item.replacementReason,
  };
}

function clonePhaseHandoff(handoff: InterviewPhaseHandoff): InterviewPhaseHandoff {
  return {
    summaryLines: [...handoff.summaryLines],
    confirmedSpecLines: [...handoff.confirmedSpecLines],
    openQuestions: [...handoff.openQuestions],
    updatedAt: handoff.updatedAt,
  };
}

function clonePayload(payload: InterviewOverlayPayload): InterviewOverlayPayload {
  return {
    ...payload,
    speakNow: [...payload.speakNow],
    speakIfAsked: [...payload.speakIfAsked],
    writeNow: [...payload.writeNow],
    thoughtNotes: [...payload.thoughtNotes],
    quickQuestions: [...payload.quickQuestions],
    pinnedFacts: [...payload.pinnedFacts],
    changes: payload.changes.map((item) => ({ ...item })),
    anchor: payload.anchor
      ? {
          title: payload.anchor.title,
          items: [...payload.anchor.items],
          writeNow: [...payload.anchor.writeNow],
          note: payload.anchor.note,
        }
      : undefined,
    mainSections: payload.mainSections
      ? payload.mainSections.map((section) => ({
          id: section.id,
          title: section.title,
          lines: [...section.lines],
          tone: section.tone,
        }))
      : undefined,
    clarificationQuestions: payload.clarificationQuestions
      ? payload.clarificationQuestions.map((item) => ({ ...item }))
      : undefined,
    updateSummary: payload.updateSummary
      ? {
          status: payload.updateSummary.status,
          updatedSections: [...payload.updateSummary.updatedSections],
          message: payload.updateSummary.message,
          at: payload.updateSummary.at,
        }
      : undefined,
    codePanel: payload.codePanel
      ? {
          language: payload.codePanel.language,
          mode: payload.codePanel.mode,
          content: payload.codePanel.content,
          narration: [...payload.codePanel.narration],
          suspectedMistakes: [...payload.codePanel.suspectedMistakes],
        }
      : undefined,
  };
}

function formatPhase(phase: RenderableInterviewPhase): string {
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

function dedupe(items: string[]): string[] {
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
