import { EventEmitter } from 'events';
import { InterviewContextDeltaBuilder } from './InterviewContextDeltaBuilder';
import { isLikelyIncompletePhaseDocument } from './InterviewContentHealth';
import { InterviewMainDocComposer } from './InterviewMainDocComposer';
import { InterviewTranscriptMemoryManager } from './InterviewTranscriptMemoryManager';
import {
  InterviewClarificationItem,
  InterviewCodeSnapshot,
  InterviewFetchIndicator,
  InterviewFetchIndicators,
  InterviewFollowUpState,
  InterviewLiveTranscriptState,
  InterviewModeConfig,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewPhaseDocument,
  InterviewPhaseDocumentMap,
  InterviewPhaseHandoff,
  InterviewPhaseHandoffMap,
  InterviewRoutingMode,
  InterviewSavedContext,
  InterviewScreenAnalysis,
  InterviewSessionSnapshot,
  InterviewTranscriptCompactionPlan,
  InterviewTranscriptEpoch,
  InterviewTranscriptMemoryStats,
  InterviewTranscriptSegment,
  RenderableInterviewPhase,
  SessionType,
} from './types';

const DEFAULT_CONFIG: InterviewModeConfig = {
  codingLanguage: 'python',
};

export class InterviewMemoryLedger extends EventEmitter {
  private transcript: InterviewTranscriptSegment[] = [];
  private liveTranscript: InterviewLiveTranscriptState = createEmptyLiveTranscriptState();
  private transcriptEpochs: InterviewTranscriptEpoch[] = [];
  private transcriptCompactionInFlight = false;
  private transcriptCompactionQueued = false;
  private pausedInterviewSession = false;
  private readonly contextDeltaBuilder = new InterviewContextDeltaBuilder();
  private readonly documentComposer = new InterviewMainDocComposer();
  private readonly transcriptMemoryManager = new InterviewTranscriptMemoryManager();
  private phaseRefreshTargets: Record<RenderableInterviewPhase, number | null> = createEmptyPhaseRefreshTargets();

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
    fetchIndicators: createEmptyFetchIndicators(),
    transcriptMemory: createEmptyTranscriptMemoryStats(),
  };

  private config: InterviewModeConfig = DEFAULT_CONFIG;

  public startSession(sessionType: SessionType, config?: Partial<InterviewModeConfig>): void {
    this.transcript = [];
    this.liveTranscript = createEmptyLiveTranscriptState();
    this.transcriptEpochs = [];
    this.transcriptCompactionInFlight = false;
    this.transcriptCompactionQueued = false;
    this.pausedInterviewSession = false;
    this.phaseRefreshTargets = createEmptyPhaseRefreshTargets();
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
      fetchIndicators: createEmptyFetchIndicators(),
      transcriptMemory: createEmptyTranscriptMemoryStats(),
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
    this.liveTranscript = createEmptyLiveTranscriptState();
    this.transcriptEpochs = [];
    this.transcriptCompactionInFlight = false;
    this.transcriptCompactionQueued = false;
    this.pausedInterviewSession = false;
    this.phaseRefreshTargets = createEmptyPhaseRefreshTargets();
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
      requirementChanges: [],
      activeFollowUp: null,
      phaseHandoffs: createEmptyPhaseHandoffs(),
      phaseDocuments: createEmptyPhaseDocuments(),
      lastScreenshotPath: null,
      lastScreenshotPreview: null,
      lastScreenshotAt: null,
      mainScrollOffset: 0,
      fetchIndicators: createEmptyFetchIndicators(),
      transcriptMemory: createEmptyTranscriptMemoryStats(),
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

  public getRecentFinalTranscript(limit: number = 40): InterviewTranscriptSegment[] {
    return this.transcript.slice(-limit);
  }

  public getRecentTranscript(limit: number = 40): InterviewTranscriptSegment[] {
    return this.getRecentFinalTranscript(limit);
  }

  public getActiveInterims(): InterviewLiveTranscriptState {
    return cloneLiveTranscriptState(this.liveTranscript);
  }

  public getTranscriptEpochs(limit?: number): InterviewTranscriptEpoch[] {
    const epochs = limit === undefined
      ? this.transcriptEpochs
      : this.transcriptEpochs.slice(-limit);
    return epochs.map(cloneTranscriptEpoch);
  }

  public getPromptTranscriptEpochs(): InterviewTranscriptEpoch[] {
    return this.transcriptMemoryManager.getPromptEpochs(this.transcriptEpochs);
  }

  public getVisionTranscriptEpochs(
    phase: InterviewPhase,
    problemStatement: string
  ): InterviewTranscriptEpoch[] {
    return this.transcriptMemoryManager.getVisionEpochs(this.transcriptEpochs, phase, problemStatement);
  }

  public getTranscriptMemoryStats(): InterviewTranscriptMemoryStats {
    return cloneTranscriptMemoryStats(this.state.transcriptMemory);
  }

  public beginTranscriptCompaction(): InterviewTranscriptCompactionPlan | null {
    if (this.transcriptCompactionInFlight) {
      this.transcriptCompactionQueued = true;
      return null;
    }

    const plan = this.transcriptMemoryManager.planCompaction(this.transcript, this.transcriptEpochs);
    if (!plan) {
      return null;
    }

    this.transcriptCompactionInFlight = true;
    this.transcriptCompactionQueued = false;
    return cloneTranscriptCompactionPlan(plan);
  }

  public completeTranscriptCompaction(
    plan: InterviewTranscriptCompactionPlan,
    summary: {
      summaryLines: string[];
      carryForwardFacts: string[];
      openQuestions: string[];
      source: 'llm' | 'fallback';
    },
    dominantPhases: RenderableInterviewPhase[]
  ): boolean {
    this.transcriptCompactionInFlight = false;

    if (!matchesTranscriptCompactionPlan(this.transcript, plan)) {
      const shouldContinue = this.transcriptCompactionQueued
        || this.transcriptMemoryManager.needsCompaction(this.transcript, this.transcriptEpochs);
      this.transcriptCompactionQueued = false;
      this.refreshTranscriptMemoryStats();
      return shouldContinue;
    }

    this.transcript = this.transcript.slice(plan.endIndexExclusive);
    this.transcriptEpochs = this.transcriptMemoryManager.appendEpoch(this.transcriptEpochs, {
      id: plan.id,
      createdAt: Date.now(),
      fromTimestamp: plan.fromTimestamp,
      toTimestamp: plan.toTimestamp,
      compactedSegmentCount: plan.compactedSegments.length,
      dominantPhases: normalizeDominantPhases(dominantPhases),
      summaryLines: dedupe(summary.summaryLines).slice(0, 4),
      carryForwardFacts: dedupe(summary.carryForwardFacts).slice(0, 6),
      openQuestions: dedupe(summary.openQuestions).slice(0, 4),
      source: summary.source,
    });

    const shouldContinue = this.transcriptCompactionQueued
      || this.transcriptMemoryManager.needsCompaction(this.transcript, this.transcriptEpochs);
    this.transcriptCompactionQueued = false;
    this.refreshTranscriptMemoryStats();
    return shouldContinue;
  }

  public failTranscriptCompaction(): boolean {
    this.transcriptCompactionInFlight = false;
    const shouldContinue = this.transcriptCompactionQueued
      || this.transcriptMemoryManager.needsCompaction(this.transcript, this.transcriptEpochs);
    this.transcriptCompactionQueued = false;
    this.refreshTranscriptMemoryStats();
    return shouldContinue;
  }

  public addTranscript(segment: InterviewTranscriptSegment): void {
    const trimmedText = segment.text.trim();
    this.liveTranscript = updateLiveTranscriptState(this.liveTranscript, {
      ...segment,
      text: trimmedText,
    });

    let nextState: InterviewSessionSnapshot = {
      ...this.state,
      lastTranscriptAt: segment.timestamp,
      lastTranscriptSnippet: trimmedText || this.state.lastTranscriptSnippet,
    };

    if (segment.final && trimmedText) {
      this.transcript = this.transcriptMemoryManager.trimFinalTranscript([
        ...this.transcript,
        {
          ...segment,
          text: trimmedText,
        },
      ]);

      const activePhase = resolveRenderablePhase(nextState);
      const previousDocument = nextState.phaseDocuments[activePhase];
      const normalContext = this.contextDeltaBuilder.buildSavedNormalContext(
        previousDocument.savedContexts.normal,
        nextState,
        this.getRecentTranscript()
      );
      const nextDocument = this.documentComposer.withSavedNormalContext(
        previousDocument,
        normalContext,
        'Updated: Normal Context'
      );
      nextState = withMainScrollOffset({
        ...nextState,
        phaseDocuments: {
          ...nextState.phaseDocuments,
          [activePhase]: nextDocument,
        },
        transcriptMemory: this.buildTranscriptMemoryStats(),
      });
      this.requestFreshPhaseGeneration(activePhase, nextState.inputRevision + 1, previousDocument);
      this.state = nextState;
      this.bumpRevision();
      return;
    }

    this.state = nextState;
    this.emitUpdate();
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

  public applyScreenAnalysis(analysis: InterviewScreenAnalysis): boolean {
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
    const screenContext = this.contextDeltaBuilder.buildSavedScreenContext(
      previousDocument.savedContexts.screen,
      analysis
    );
    const screenUpdated = hasScreenAnalysisUpdate(this.state, previousDocument, screenContext, nextCode, analysis);
    const nextDocument = this.documentComposer.withSavedScreenContext(
      previousDocument,
      screenContext,
      screenUpdated ? 'Updated: Screen Sync' : 'No updates found'
    );

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
      activeFollowUp: buildFollowUpFromAnalysis(analysis, this.state.activeFollowUp),
      phaseDocuments: {
        ...this.state.phaseDocuments,
        [activePhase]: {
          ...nextDocument,
          primaryCode: nextCode
            ? {
                language: 'python',
                kind: 'full',
                title: 'Current code',
                content: nextCode.content,
                notes: [...nextCode.suspectedMistakes],
              }
            : nextDocument.primaryCode,
        },
      },
      currentCode: nextCode,
      lastScreenshotAt: analysis.capturedAt,
      lastScreenshotPath: analysis.screenshotPath,
      lastScreenshotPreview: analysis.screenshotPreview || this.state.lastScreenshotPreview,
    });
    if (screenUpdated) {
      this.requestFreshPhaseGeneration(activePhase, this.state.inputRevision + 1, previousDocument);
    }
    this.bumpRevision();
    return screenUpdated;
  }

  public applyGeneratedPayload(
    payload: InterviewOverlayPayload,
    phaseDocument: InterviewPhaseDocument,
    clarificationItems?: InterviewClarificationItem[],
    phaseHandoff?: InterviewPhaseHandoff
  ): void {
    const nextCode: InterviewCodeSnapshot | null = payload.code
      ? {
          content: payload.code.content,
          narration: [],
          mode: 'full',
          capturedAt: payload.generatedAt,
          suspectedMistakes: [],
          source: 'generator',
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
    const diffShown = Boolean(phaseDocument.secondaryCode);

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
        ? dedupe(payload.mainLines).slice(0, 10)
        : this.state.approachSummary,
      activeFollowUp: payload.phase === 'p6_follow_up'
        ? buildFollowUpFromPayload(payload, this.state.activeFollowUp, diffShown)
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
      requirementChanges: [...this.state.requirementChanges],
      activeFollowUp: this.state.activeFollowUp ? { ...this.state.activeFollowUp } : null,
      phaseHandoffs: clonePhaseHandoffs(this.state.phaseHandoffs),
      phaseDocuments: clonePhaseDocuments(this.state.phaseDocuments),
      controlStripVisibleUntil: this.state.controlStripVisibleUntil,
      controlStripHint: this.state.controlStripHint,
      currentCode: this.state.currentCode
        ? {
            ...this.state.currentCode,
            narration: [...this.state.currentCode.narration],
            suspectedMistakes: [...this.state.currentCode.suspectedMistakes],
          }
        : null,
      latestPayload: this.state.latestPayload ? clonePayload(this.state.latestPayload) : null,
      fetchIndicators: cloneFetchIndicators(this.state.fetchIndicators),
      transcriptMemory: cloneTranscriptMemoryStats(this.state.transcriptMemory),
    };
  }

  public beginFetch(kind: keyof InterviewFetchIndicators, message: string): void {
    const current = this.state.fetchIndicators[kind];
    const nextIndicator: InterviewFetchIndicator = {
      state: 'running',
      message,
      triggeredAt: Date.now(),
    };

    this.state = {
      ...this.state,
      fetchIndicators: {
        ...cloneFetchIndicators(this.state.fetchIndicators),
        [kind]: nextIndicator,
      },
    };
    this.emitUpdate();
  }

  public completeFetch(
    kind: keyof InterviewFetchIndicators,
    state: InterviewFetchIndicator['state'],
    message: string
  ): void {
    const current = this.state.fetchIndicators[kind];
    const nextIndicator: InterviewFetchIndicator = {
      state,
      message,
      triggeredAt: current.triggeredAt || Date.now(),
    };

    this.state = {
      ...this.state,
      fetchIndicators: {
        ...cloneFetchIndicators(this.state.fetchIndicators),
        [kind]: nextIndicator,
      },
    };
    this.emitUpdate();
  }

  public consumeFreshPhaseGeneration(phase: RenderableInterviewPhase, revision: number): boolean {
    const targetRevision = this.phaseRefreshTargets[phase];
    if (targetRevision === null || revision < targetRevision) {
      return false;
    }

    this.phaseRefreshTargets[phase] = null;
    return true;
  }

  public markPhaseForFreshGeneration(phase: RenderableInterviewPhase, targetRevision: number): void {
    const currentTarget = this.phaseRefreshTargets[phase];
    this.phaseRefreshTargets[phase] = currentTarget === null
      ? targetRevision
      : Math.max(currentTarget, targetRevision);
  }

  private buildTranscriptMemoryStats(): InterviewTranscriptMemoryStats {
    return this.transcriptMemoryManager.buildStats(this.transcript, this.transcriptEpochs);
  }

  private refreshTranscriptMemoryStats(): void {
    this.state = {
      ...this.state,
      transcriptMemory: this.buildTranscriptMemoryStats(),
    };
    this.emitUpdate();
  }

  private requestFreshPhaseGeneration(
    phase: RenderableInterviewPhase,
    targetRevision: number,
    previousDocument: InterviewPhaseDocument
  ): void {
    if (phase === 'p2_clarify') {
      return;
    }

    if (!shouldForceFreshGeneration(previousDocument)) {
      return;
    }

    const currentTarget = this.phaseRefreshTargets[phase];
    this.phaseRefreshTargets[phase] = currentTarget === null
      ? targetRevision
      : Math.max(currentTarget, targetRevision);
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

function buildFollowUpFromPayload(
  payload: InterviewOverlayPayload,
  current: InterviewFollowUpState | null,
  diffShown: boolean
): InterviewFollowUpState | null {
  const request = payload.mainLines[0] || current?.request || '';
  if (!request) {
    return current;
  }

  return {
    request,
    impactedArea: diffShown ? 'Code diff' : current?.impactedArea || 'Current solution',
    diffRequired: diffShown,
    derivedFrom: current?.derivedFrom || 'transcript',
  };
}

function hasScreenAnalysisUpdate(
  snapshot: InterviewSessionSnapshot,
  previousDocument: InterviewPhaseDocument,
  nextScreenContext: InterviewSavedContext,
  nextCode: InterviewCodeSnapshot | null,
  analysis: InterviewScreenAnalysis
): boolean {
  return !savedContextEquals(previousDocument.savedContexts.screen, nextScreenContext)
    || (nextCode?.content || '') !== (snapshot.currentCode?.content || '')
    || Boolean(analysis.problemStatement && analysis.problemStatement !== snapshot.problemStatement)
    || hasNovelValues(snapshot.constraints, analysis.givenConstraints)
    || hasNovelValues(snapshot.examples, analysis.examples)
    || hasNovelValues(snapshot.openQuestions, analysis.visibleQuestions)
    || hasNovelValues(snapshot.requirementChanges, analysis.hints)
    || hasNovelValues(snapshot.clarifiedFacts, analysis.givenConstraints);
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

function createEmptyFetchIndicators(): InterviewFetchIndicators {
  return {
    next: createEmptyFetchIndicator(),
    sync: createEmptyFetchIndicator(),
  };
}

function createEmptyFetchIndicator(): InterviewFetchIndicator {
  return {
    state: 'idle',
    message: 'Waiting',
    triggeredAt: null,
  };
}

function createEmptyPhaseRefreshTargets(): Record<RenderableInterviewPhase, number | null> {
  return {
    p2_clarify: null,
    p3_approach: null,
    p4_code: null,
    p5_test: null,
    p6_follow_up: null,
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
    mainFeed: [],
    primaryCode: null,
    secondaryCode: null,
    savedContexts: {
      screen: createEmptySavedContext('Last screen context saved'),
      normal: createEmptySavedContext('Last normal context saved'),
    },
    status: {
      status: 'partial',
      updatedSections: [],
      message: 'Waiting for first update',
      at: 0,
    },
    scrollOffset: 0,
    lastUpdatedAt: null,
  };
}

function createEmptySavedContext(title: string): InterviewSavedContext {
  return {
    title,
    lines: [],
    updatedAt: null,
  };
}

function createEmptyLiveTranscriptState(): InterviewLiveTranscriptState {
  return {
    interviewerInterim: null,
    userInterim: null,
  };
}

function createEmptyTranscriptMemoryStats(): InterviewTranscriptMemoryStats {
  return {
    finalSegmentCount: 0,
    epochCount: 0,
    compactedSegmentCount: 0,
    lastCompactedAt: null,
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

function cloneFetchIndicators(indicators: InterviewFetchIndicators): InterviewFetchIndicators {
  return {
    next: { ...indicators.next },
    sync: { ...indicators.sync },
  };
}

function cloneLiveTranscriptState(state: InterviewLiveTranscriptState): InterviewLiveTranscriptState {
  return {
    interviewerInterim: state.interviewerInterim
      ? { ...state.interviewerInterim }
      : null,
    userInterim: state.userInterim
      ? { ...state.userInterim }
      : null,
  };
}

function cloneTranscriptEpoch(epoch: InterviewTranscriptEpoch): InterviewTranscriptEpoch {
  return {
    id: epoch.id,
    createdAt: epoch.createdAt,
    fromTimestamp: epoch.fromTimestamp,
    toTimestamp: epoch.toTimestamp,
    compactedSegmentCount: epoch.compactedSegmentCount,
    dominantPhases: [...epoch.dominantPhases],
    summaryLines: [...epoch.summaryLines],
    carryForwardFacts: [...epoch.carryForwardFacts],
    openQuestions: [...epoch.openQuestions],
    source: epoch.source,
  };
}

function cloneTranscriptCompactionPlan(
  plan: InterviewTranscriptCompactionPlan
): InterviewTranscriptCompactionPlan {
  return {
    id: plan.id,
    createdAt: plan.createdAt,
    startIndex: plan.startIndex,
    endIndexExclusive: plan.endIndexExclusive,
    compactedSegments: plan.compactedSegments.map((segment) => ({
      speaker: segment.speaker,
      text: segment.text,
      timestamp: segment.timestamp,
      final: segment.final,
      confidence: segment.confidence,
    })),
    fromTimestamp: plan.fromTimestamp,
    toTimestamp: plan.toTimestamp,
  };
}

function cloneTranscriptMemoryStats(
  stats: InterviewTranscriptMemoryStats
): InterviewTranscriptMemoryStats {
  return {
    finalSegmentCount: stats.finalSegmentCount,
    epochCount: stats.epochCount,
    compactedSegmentCount: stats.compactedSegmentCount,
    lastCompactedAt: stats.lastCompactedAt,
  };
}

function clonePhaseDocument(document: InterviewPhaseDocument): InterviewPhaseDocument {
  return {
    phase: document.phase,
    mainFeed: document.mainFeed.map((entry) => ({
      id: entry.id,
      blockId: entry.blockId,
      type: entry.type,
      blockLabel: entry.blockLabel,
      text: entry.text,
      state: entry.state,
      clarificationId: entry.clarificationId,
    })),
    primaryCode: document.primaryCode
      ? {
          language: document.primaryCode.language,
          kind: document.primaryCode.kind,
          title: document.primaryCode.title,
          content: document.primaryCode.content,
          notes: [...document.primaryCode.notes],
        }
      : null,
    secondaryCode: document.secondaryCode
      ? {
          language: document.secondaryCode.language,
          kind: document.secondaryCode.kind,
          title: document.secondaryCode.title,
          content: document.secondaryCode.content,
          notes: [...document.secondaryCode.notes],
        }
      : null,
    savedContexts: {
      screen: {
        title: document.savedContexts.screen.title,
        lines: [...document.savedContexts.screen.lines],
        updatedAt: document.savedContexts.screen.updatedAt,
      },
      normal: {
        title: document.savedContexts.normal.title,
        lines: [...document.savedContexts.normal.lines],
        updatedAt: document.savedContexts.normal.updatedAt,
      },
    },
    status: {
      status: document.status.status,
      updatedSections: [...document.status.updatedSections],
      message: document.status.message,
      at: document.status.at,
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
    mainLines: [...payload.mainLines],
    pinnedFacts: [...payload.pinnedFacts],
    clarificationQuestions: payload.clarificationQuestions
      ? payload.clarificationQuestions.map((item) => ({ ...item }))
      : undefined,
    code: payload.code
      ? {
          language: payload.code.language,
          content: payload.code.content,
        }
      : undefined,
  };
}

function shouldForceFreshGeneration(document: InterviewPhaseDocument): boolean {
  const hasLines = document.mainFeed.some((entry) => entry.type === 'line' && Boolean(entry.text));
  if (!hasLines) {
    return false;
  }

  const blockCount = document.mainFeed.filter((entry) => entry.type === 'header').length;
  return blockCount <= 1 || isLikelyIncompletePhaseDocument(document);
}

function matchesTranscriptCompactionPlan(
  transcript: InterviewTranscriptSegment[],
  plan: InterviewTranscriptCompactionPlan
): boolean {
  if (plan.endIndexExclusive > transcript.length) {
    return false;
  }

  for (let index = 0; index < plan.compactedSegments.length; index += 1) {
    const current = transcript[index];
    const expected = plan.compactedSegments[index];
    if (!current || current.speaker !== expected.speaker || current.text !== expected.text || current.timestamp !== expected.timestamp || current.final !== expected.final) {
      return false;
    }
  }

  return true;
}

function normalizeDominantPhases(phases: RenderableInterviewPhase[]): RenderableInterviewPhase[] {
  const ordered: RenderableInterviewPhase[] = phases.length > 0 ? phases : ['p2_clarify'];
  const seen = new Set<RenderableInterviewPhase>();
  const result: RenderableInterviewPhase[] = [];

  for (const phase of ordered) {
    if (seen.has(phase)) {
      continue;
    }

    seen.add(phase);
    result.push(phase);
  }

  return result;
}

function updateLiveTranscriptState(
  current: InterviewLiveTranscriptState,
  segment: InterviewTranscriptSegment
): InterviewLiveTranscriptState {
  const key = resolveLiveTranscriptSpeakerKey(segment.speaker);
  if (!key) {
    return current;
  }

  return {
    interviewerInterim: key === 'interviewerInterim'
      ? (segment.final ? null : { ...segment })
      : current.interviewerInterim,
    userInterim: key === 'userInterim'
      ? (segment.final ? null : { ...segment })
      : current.userInterim,
  };
}

function resolveLiveTranscriptSpeakerKey(
  speaker: string
): keyof InterviewLiveTranscriptState | null {
  const normalizedSpeaker = speaker.trim().toLowerCase();
  if (normalizedSpeaker === 'user') {
    return 'userInterim';
  }
  if (normalizedSpeaker === 'interviewer') {
    return 'interviewerInterim';
  }
  return null;
}

function savedContextEquals(left: InterviewSavedContext, right: InterviewSavedContext): boolean {
  if (left.updatedAt !== right.updatedAt || left.lines.length !== right.lines.length) {
    return false;
  }

  for (let index = 0; index < left.lines.length; index += 1) {
    if (left.lines[index] !== right.lines[index]) {
      return false;
    }
  }

  return true;
}

function hasNovelValues(existing: string[], incoming: string[] | undefined): boolean {
  if (!incoming || incoming.length === 0) {
    return false;
  }

  const existingKeys = new Set(existing.map((item) => item.trim().toLowerCase()).filter(Boolean));
  return incoming.some((item) => {
    const normalized = item.trim().toLowerCase();
    return Boolean(normalized) && !existingKeys.has(normalized);
  });
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
