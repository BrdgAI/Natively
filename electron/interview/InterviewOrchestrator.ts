import { EventEmitter } from 'events';
import type { AppState } from '../main';
import { LLMHelper } from '../LLMHelper';
import { InterviewClarifyPlanner } from './InterviewClarifyPlanner';
import { InterviewDiffEngine } from './InterviewDiffEngine';
import { InterviewMainDocComposer } from './InterviewMainDocComposer';
import { InterviewMemoryLedger } from './InterviewMemoryLedger';
import { InterviewPhaseRouter } from './InterviewPhaseRouter';
import { InterviewPrefetchBuffer } from './InterviewPrefetchBuffer';
import { InterviewVisionSync } from './InterviewVisionSync';
import { Phase2ClarificationGenerator } from './generators/Phase2ClarificationGenerator';
import { Phase3ApproachGenerator } from './generators/Phase3ApproachGenerator';
import { Phase4CodingGenerator } from './generators/Phase4CodingGenerator';
import { Phase5TestingGenerator } from './generators/Phase5TestingGenerator';
import { Phase6FollowUpGenerator } from './generators/Phase6FollowUpGenerator';
import {
  InterviewBufferEntry,
  InterviewClarificationCandidate,
  InterviewClarificationItem,
  InterviewGeneratorContext,
  InterviewModeConfig,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewPhaseHandoff,
  InterviewRoutingMode,
  InterviewScreenAnalysis,
  InterviewSessionSnapshot,
  InterviewTranscriptSegment,
  RenderableInterviewPhase,
  SessionType,
} from './types';

type GeneratorMap = Record<
  RenderableInterviewPhase,
  { generate: (context: InterviewGeneratorContext) => Promise<InterviewOverlayPayload> }
>;

const CONTROL_STRIP_DURATION_MS = 2200;

export class InterviewOrchestrator extends EventEmitter {
  private readonly ledger = new InterviewMemoryLedger();
  private readonly phaseRouter = new InterviewPhaseRouter();
  private readonly buffer = new InterviewPrefetchBuffer();
  private readonly visionSync: InterviewVisionSync;
  private readonly diffEngine = new InterviewDiffEngine();
  private readonly clarifyPlanner = new InterviewClarifyPlanner();
  private readonly documentComposer = new InterviewMainDocComposer();
  private readonly generators: GeneratorMap;

  private prefetchTimer: NodeJS.Timeout | null = null;
  private prefetchInFlight = false;
  private lastScreenAnalysis: InterviewScreenAnalysis | null = null;

  constructor(private readonly llmHelper: LLMHelper, private readonly appState: AppState) {
    super();
    this.visionSync = new InterviewVisionSync(llmHelper);
    this.generators = {
      p2_clarify: new Phase2ClarificationGenerator(llmHelper),
      p3_approach: new Phase3ApproachGenerator(llmHelper),
      p4_code: new Phase4CodingGenerator(llmHelper),
      p5_test: new Phase5TestingGenerator(llmHelper),
      p6_follow_up: new Phase6FollowUpGenerator(llmHelper),
    };

    this.ledger.on('state-updated', (snapshot: InterviewSessionSnapshot) => {
      this.emit('state-updated', snapshot);
    });
  }

  public startSession(sessionType: SessionType, config?: Partial<InterviewModeConfig>): void {
    this.buffer.invalidateAll();
    this.lastScreenAnalysis = null;
    this.ledger.startSession(sessionType, config);
    if (sessionType === 'interview') {
      this.schedulePrefetch('start');
    }
  }

  public endSession(): void {
    this.cancelPrefetch();
    this.buffer.invalidateAll();
    this.lastScreenAnalysis = null;
    this.ledger.endSession();
  }

  public exitInterviewMode(): void {
    this.pauseInterviewMode();
  }

  public pauseInterviewMode(): void {
    this.cancelPrefetch();
    this.ledger.pauseInterviewMode();
  }

  public resumeInterviewMode(): void {
    if (!this.ledger.hasPausedInterviewSession()) {
      return;
    }

    this.ledger.resumeInterviewMode();
    this.schedulePrefetch('resume');
  }

  public setSessionType(sessionType: SessionType): void {
    this.ledger.setSessionType(sessionType);
  }

  public setRoutingMode(routingMode: InterviewRoutingMode): InterviewSessionSnapshot {
    this.ledger.setRoutingMode(routingMode);
    if (routingMode === 'auto') {
      this.refreshPhase();
    }
    return this.ledger.getSnapshot();
  }

  public hasPausedSession(): boolean {
    return this.ledger.hasPausedInterviewSession();
  }

  public getState(): InterviewSessionSnapshot {
    return this.ledger.getSnapshot();
  }

  public handleTranscript(segment: InterviewTranscriptSegment): void {
    if (!this.ledger.hasRetainedInterviewSession()) {
      return;
    }

    this.ledger.addTranscript(segment);

    if (!segment.final) {
      return;
    }

    if (!this.ledger.getSnapshot().active) {
      return;
    }

    this.refreshPhase();
    this.schedulePrefetch('transcript');
  }

  public async handleNext(): Promise<InterviewSessionSnapshot> {
    const snapshot = this.ledger.getSnapshot();
    if (!snapshot.active || snapshot.sessionType !== 'interview') {
      return snapshot;
    }

    const currentPhase = normalizePhase(snapshot.manualOverridePhase || snapshot.phase);
    if (
      snapshot.latestPayload &&
      snapshot.latestPayload.inputRevision === snapshot.inputRevision &&
      snapshot.latestPayload.phase === currentPhase
    ) {
      this.publishNoUpdate(snapshot.latestPayload);
      return this.ledger.getSnapshot();
    }

    const buffered = this.buffer.get(currentPhase, snapshot.inputRevision);

    if (buffered) {
      this.publishBufferedPayload(buffered);
      return this.ledger.getSnapshot();
    }

    this.ledger.setGenerating(true, 'Preparing the next script...');
    const payload = await this.generatePayload(currentPhase);
    this.buffer.set(currentPhase, snapshot.inputRevision, payload);
    const entry = this.buffer.get(currentPhase, snapshot.inputRevision);
    if (entry) {
      this.publishBufferedPayload(entry);
    }
    return this.ledger.getSnapshot();
  }

  public async handleSync(): Promise<InterviewSessionSnapshot> {
    const snapshot = this.ledger.getSnapshot();
    if (!snapshot.active || snapshot.sessionType !== 'interview') {
      return snapshot;
    }

    this.ledger.setSyncing(true, 'Syncing screen context...');
    try {
      const screenshotPath = await this.appState.takeScreenshot(false);
      const preview = await this.appState.getImagePreview(screenshotPath);
      const analysis = await this.visionSync.analyze(snapshot.phase, screenshotPath, preview, this.ledger.getRecentTranscript());
      this.lastScreenAnalysis = analysis;

      this.ledger.applyScreenAnalysis(analysis);
      this.refreshPhase();
      this.buffer.invalidateAll();
      this.schedulePrefetch('sync');
      this.ledger.showControlStrip(buildControlStripHint(this.ledger.getSnapshot()), CONTROL_STRIP_DURATION_MS);
      this.ledger.setSyncing(false, 'Screen synced');
      return this.ledger.getSnapshot();
    } catch (error) {
      this.ledger.setSyncing(false, `Screen sync failed: ${toErrorMessage(error)}`);
      return this.ledger.getSnapshot();
    }
  }

  public async handleSyncShortcut(): Promise<InterviewSessionSnapshot> {
    const snapshot = this.ledger.getSnapshot();
    if (!snapshot.active || snapshot.sessionType !== 'interview') {
      return snapshot;
    }

    if (snapshot.routingMode === 'auto' && isControlStripVisible(snapshot) && !snapshot.isSyncing) {
      const nextSnapshot = this.shiftManualPhase(1);
      this.ledger.showControlStrip(buildControlStripHint(nextSnapshot), CONTROL_STRIP_DURATION_MS);
      return this.ledger.getSnapshot();
    }

    return this.handleSync();
  }

  public shiftManualPhase(direction: -1 | 1): InterviewSessionSnapshot {
    const snapshot = this.ledger.getSnapshot();
    const next = this.phaseRouter.shift(snapshot.manualOverridePhase || snapshot.phase, direction);
    this.ledger.setManualOverridePhase(next);
    this.ledger.setPhase(next, 1);
    this.ledger.showControlStrip(buildControlStripHint(this.ledger.getSnapshot()), CONTROL_STRIP_DURATION_MS);
    this.buffer.invalidateAll();
    this.schedulePrefetch('manual-phase');
    return this.ledger.getSnapshot();
  }

  public clearManualPhase(): void {
    this.ledger.setManualOverridePhase(null);
    this.refreshPhase();
  }

  public setMainScrollOffset(offset: number): void {
    this.ledger.setMainScrollOffset(offset);
  }

  private refreshPhase(): void {
    const snapshot = this.ledger.getSnapshot();
    if (snapshot.routingMode !== 'auto') {
      return;
    }
    const phaseResult = this.phaseRouter.infer(snapshot, this.ledger.getRecentTranscript());
    this.ledger.setPhase(phaseResult.phase, phaseResult.confidence);
  }

  private schedulePrefetch(reason: 'start' | 'resume' | 'transcript' | 'sync' | 'manual-phase'): void {
    const snapshot = this.ledger.getSnapshot();
    if (!snapshot.active || snapshot.sessionType !== 'interview') {
      return;
    }

    if (this.prefetchTimer) {
      clearTimeout(this.prefetchTimer);
    }

    this.prefetchTimer = setTimeout(async () => {
      if (this.prefetchInFlight) {
        return;
      }

      this.prefetchInFlight = true;
      try {
        const current = this.ledger.getSnapshot();
        const phase = normalizePhase(current.manualOverridePhase || current.phase);
        if (this.buffer.get(phase, current.inputRevision)) {
          return;
        }

        const payload = await this.generatePayload(phase);
        this.buffer.set(phase, current.inputRevision, payload);
        this.ledger.setStatusMessage(reason === 'start' ? 'Interview mode ready' : 'Next script prefetched');
      } catch (error) {
        this.ledger.setStatusMessage(`Prefetch failed: ${toErrorMessage(error)}`);
      } finally {
        this.prefetchInFlight = false;
      }
    }, 450);
  }

  private cancelPrefetch(): void {
    if (this.prefetchTimer) {
      clearTimeout(this.prefetchTimer);
      this.prefetchTimer = null;
    }
  }

  private async generatePayload(phase: RenderableInterviewPhase): Promise<InterviewOverlayPayload> {
    const snapshot = this.ledger.getSnapshot();
    const context: InterviewGeneratorContext = {
      snapshot,
      recentTranscript: this.ledger.getRecentTranscript(),
      screenAnalysis: this.lastScreenAnalysis,
      previousPayload: snapshot.latestPayload,
    };

    const payload = await this.generators[phase].generate(context);

    if (payload.mainLines.length === 0) {
      payload.mainLines = fallbackMainLines(phase, snapshot);
    }

    if (payload.pinnedFacts.length === 0) {
      payload.pinnedFacts = compactFacts(snapshot);
    }

    return payload;
  }

  private publishBufferedPayload(entry: InterviewBufferEntry): void {
    const snapshot = this.ledger.getSnapshot();
    const clarificationItems = entry.phase === 'p2_clarify'
      ? this.clarifyPlanner.plan(
          snapshot,
          buildClarificationCandidates(entry.payload),
          this.ledger.getRecentTranscript()
        )
      : undefined;
    const composedSnapshot = clarificationItems
      ? {
          ...snapshot,
          clarificationItems,
          openQuestions: clarificationItems
            .filter((item) => item.status === 'pending' || item.status === 'asked')
            .map((item) => item.text),
        }
      : snapshot;
    const previousDocument = composedSnapshot.phaseDocuments[entry.phase];
    const diffText = this.buildDiffText(composedSnapshot, entry.payload);
    const phaseDocument = this.documentComposer.compose(composedSnapshot, entry.payload, {
      clarificationItems,
      savedContexts: previousDocument.savedContexts,
      diffText,
    });
    const phaseHandoff = buildPhaseHandoff(composedSnapshot, entry.payload, phaseDocument, clarificationItems);

    this.ledger.applyGeneratedPayload(entry.payload, phaseDocument, clarificationItems, phaseHandoff);
  }

  private buildDiffText(snapshot: InterviewSessionSnapshot, payload: InterviewOverlayPayload): string | null {
    if (!payload.code?.content || !snapshot.currentCode?.content) {
      return null;
    }

    if (normalizeContent(payload.code.content) === normalizeContent(snapshot.currentCode.content)) {
      return null;
    }

    const diffResult = this.diffEngine.diffText(snapshot.currentCode.content, payload.code.content);
    return diffResult.diffText || null;
  }

  private publishNoUpdate(payload: InterviewOverlayPayload): void {
    const snapshot = this.ledger.getSnapshot();
    const phaseDocument = this.documentComposer.withNoUpdate(
      snapshot.phaseDocuments[payload.phase],
      'No updates'
    );
    const derived: InterviewOverlayPayload = {
      ...payload,
      generatedAt: Date.now(),
      freshness: {
        ...payload.freshness,
        generatedMsAgo: 0,
      },
    };
    const phaseHandoff = buildPhaseHandoff(snapshot, derived, phaseDocument);
    this.ledger.applyGeneratedPayload(derived, phaseDocument, undefined, phaseHandoff);
  }
}

function normalizePhase(phase: InterviewPhase): RenderableInterviewPhase {
  return phase === 'p1_intro' ? 'p2_clarify' : phase;
}

function buildClarificationCandidates(payload: InterviewOverlayPayload): InterviewClarificationCandidate[] {
  return payload.clarificationQuestions || [];
}

function buildPhaseHandoff(
  snapshot: InterviewSessionSnapshot,
  payload: InterviewOverlayPayload,
  phaseDocument: InterviewSessionSnapshot['phaseDocuments'][RenderableInterviewPhase],
  clarificationItems?: InterviewClarificationItem[]
): InterviewPhaseHandoff {
  const clarifyHandoff = snapshot.phaseHandoffs.p2_clarify;
  const summaryLines = dedupe(payload.mainLines).slice(0, 8);
  const specLines = extractSpecLines(payload.mainLines);
  const confirmedSpecLines = payload.phase === 'p2_clarify'
    ? dedupe([
        ...specLines,
        ...snapshot.constraints,
        ...snapshot.clarifiedFacts,
        ...payload.pinnedFacts,
      ]).slice(0, 10)
    : dedupe([
        ...clarifyHandoff.confirmedSpecLines,
        ...specLines,
        ...payload.pinnedFacts,
      ]).slice(0, 10);
  const openQuestions = payload.phase === 'p2_clarify'
    ? dedupe(
        (clarificationItems || snapshot.clarificationItems)
          .filter((item) => item.status === 'pending' || item.status === 'asked')
          .map((item) => item.text)
      ).slice(0, 10)
    : dedupe([
        ...clarifyHandoff.openQuestions,
        ...snapshot.openQuestions,
      ]).slice(0, 10);

  return {
    summaryLines: summaryLines.length > 0 ? summaryLines : phaseDocument.mainFeed
      .filter((entry) => entry.type === 'line' && entry.text)
      .slice(-6)
      .map((entry) => entry.text as string),
    confirmedSpecLines,
    openQuestions,
    updatedAt: payload.generatedAt,
  };
}

function extractSpecLines(lines: string[]): string[] {
  return lines.filter((line) => /(input|output|constraint|return|edge|example|complexity|time|space|approach|write)/i.test(line));
}

function fallbackMainLines(phase: RenderableInterviewPhase, snapshot: InterviewSessionSnapshot): string[] {
  switch (phase) {
    case 'p2_clarify':
      return [
        snapshot.problemStatement
          ? `Let me restate the problem first to make sure I have it right: ${snapshot.problemStatement}`
          : 'Let me restate the problem first so I can confirm the input, output, and constraints before coding.',
        'I want to ask a few quick clarification questions before I choose an approach.',
      ];
    case 'p3_approach':
      return [
        'I will start with the brute-force idea and then move to the optimized approach.',
        'I want to confirm the final time and space complexity before I code.',
      ];
    case 'p4_code':
      return [
        'I am going to write the structure first and then fill in the core logic.',
      ];
    case 'p5_test':
      return [
        'Let me dry run the code with one concrete example and then cover edge cases.',
      ];
    case 'p6_follow_up':
      return [
        'I can make that follow-up change and then summarize the impact clearly.',
      ];
  }
}

function compactFacts(snapshot: InterviewSessionSnapshot): string[] {
  const facts = [
    snapshot.problemStatement,
    ...snapshot.constraints,
    ...snapshot.requirementChanges,
  ].filter(Boolean);
  return dedupe(facts).slice(0, 6);
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

function normalizeContent(value: string): string {
  return value.trim().replace(/\r\n/g, '\n');
}

function buildControlStripHint(snapshot: InterviewSessionSnapshot): string {
  const phase = normalizePhase(snapshot.manualOverridePhase || snapshot.phase);
  return `Current phase: ${formatPhaseLabel(phase)}`;
}

function isControlStripVisible(snapshot: InterviewSessionSnapshot): boolean {
  return Boolean(snapshot.controlStripVisibleUntil && snapshot.controlStripVisibleUntil > Date.now());
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

function toErrorMessage(error: Error | string | number | boolean | null | undefined): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
