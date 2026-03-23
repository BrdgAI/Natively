import { EventEmitter } from 'events';
import type { AppState } from '../main';
import { LLMHelper } from '../LLMHelper';
import { InterviewDiffEngine, InterviewDiffResult } from './InterviewDiffEngine';
import { InterviewMemoryLedger } from './InterviewMemoryLedger';
import { InterviewPhaseRouter } from './InterviewPhaseRouter';
import { InterviewPrefetchBuffer } from './InterviewPrefetchBuffer';
import { InterviewVisionSync } from './InterviewVisionSync';
import { Phase2ClarificationGenerator } from './generators/Phase2ClarificationGenerator';
import { Phase3ApproachGenerator } from './generators/Phase3ApproachGenerator';
import { Phase4CodingGenerator } from './generators/Phase4CodingGenerator';
import { Phase5TestingGenerator } from './generators/Phase5TestingGenerator';
import { Phase6ClosingGenerator } from './generators/Phase6ClosingGenerator';
import {
  InterviewBufferEntry,
  InterviewGeneratorContext,
  InterviewModeConfig,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewScreenAnalysis,
  InterviewSessionSnapshot,
  InterviewTranscriptSegment,
  SessionType,
} from './types';

type GeneratorMap = Record<'p2_clarify' | 'p3_approach' | 'p4_code' | 'p5_test' | 'p6_close', { generate: (context: InterviewGeneratorContext) => Promise<InterviewOverlayPayload> }>;
const CONTROL_STRIP_DURATION_MS = 2200;

export class InterviewOrchestrator extends EventEmitter {
  private readonly ledger = new InterviewMemoryLedger();
  private readonly phaseRouter = new InterviewPhaseRouter();
  private readonly buffer = new InterviewPrefetchBuffer();
  private readonly visionSync: InterviewVisionSync;
  private readonly diffEngine = new InterviewDiffEngine();
  private readonly generators: GeneratorMap;

  private prefetchTimer: NodeJS.Timeout | null = null;
  private prefetchInFlight = false;
  private lastScreenAnalysis: InterviewScreenAnalysis | null = null;
  private lastDiffResult: InterviewDiffResult | null = null;
  private lastAdvanceCount = 0;

  constructor(private readonly llmHelper: LLMHelper, private readonly appState: AppState) {
    super();
    this.visionSync = new InterviewVisionSync(llmHelper);
    this.generators = {
      p2_clarify: new Phase2ClarificationGenerator(llmHelper),
      p3_approach: new Phase3ApproachGenerator(llmHelper),
      p4_code: new Phase4CodingGenerator(llmHelper),
      p5_test: new Phase5TestingGenerator(llmHelper),
      p6_close: new Phase6ClosingGenerator(llmHelper),
    };

    this.ledger.on('state-updated', (snapshot: InterviewSessionSnapshot) => {
      this.emit('state-updated', snapshot);
    });
  }

  public startSession(sessionType: SessionType, config?: Partial<InterviewModeConfig>): void {
    this.buffer.invalidateAll();
    this.lastScreenAnalysis = null;
    this.lastDiffResult = null;
    this.lastAdvanceCount = 0;
    this.ledger.startSession(sessionType, config);
    if (sessionType === 'interview') {
      this.schedulePrefetch('start');
    }
  }

  public endSession(): void {
    this.cancelPrefetch();
    this.buffer.invalidateAll();
    this.lastScreenAnalysis = null;
    this.lastDiffResult = null;
    this.lastAdvanceCount = 0;
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

    const currentPhase = normalizePhase(snapshot.phase);
    const buffered = this.buffer.get(currentPhase, snapshot.inputRevision);

    if (buffered) {
      this.publishBufferedPayload(buffered);
      return this.ledger.getSnapshot();
    }

    if (snapshot.latestPayload && snapshot.latestPayload.inputRevision === snapshot.inputRevision) {
      this.advancePublishedPayload();
      return this.ledger.getSnapshot();
    }

    this.ledger.setGenerating(true, 'Preparing the next script...');
    const payload = await this.generatePayload(currentPhase);
    this.buffer.set(currentPhase, snapshot.inputRevision, payload);
    this.publishBufferedPayload(this.buffer.get(currentPhase, snapshot.inputRevision)!);
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

      const previousCode = snapshot.currentCode?.content || '';
      const nextCode = analysis.currentCode || '';
      if (previousCode && nextCode && previousCode !== nextCode) {
        this.lastDiffResult = this.diffEngine.diffText(previousCode, nextCode);
      }

      this.ledger.applyScreenAnalysis(analysis);
      this.refreshPhase();
      this.buffer.invalidateAll();
      this.schedulePrefetch('sync');
      this.ledger.showControlStrip(buildControlStripHint(this.ledger.getSnapshot()), CONTROL_STRIP_DURATION_MS);
      this.ledger.setSyncing(false, 'Screen synced');
      return this.ledger.getSnapshot();
    } catch (error: any) {
      this.ledger.setSyncing(false, `Screen sync failed: ${error.message || 'unknown error'}`);
      return this.ledger.getSnapshot();
    }
  }

  public async handleSyncShortcut(): Promise<InterviewSessionSnapshot> {
    const snapshot = this.ledger.getSnapshot();
    if (!snapshot.active || snapshot.sessionType !== 'interview') {
      return snapshot;
    }

    if (isControlStripVisible(snapshot) && !snapshot.isSyncing) {
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
    const phaseResult = this.phaseRouter.infer(snapshot, this.ledger.getRecentTranscript());
    this.ledger.setPhase(phaseResult.phase, phaseResult.confidence);
  }

  private schedulePrefetch(reason: string): void {
    const snapshot = this.ledger.getSnapshot();
    if (!snapshot.active || snapshot.sessionType !== 'interview') {
      return;
    }

    if (this.prefetchTimer) {
      clearTimeout(this.prefetchTimer);
    }

    this.prefetchTimer = setTimeout(async () => {
      if (this.prefetchInFlight) return;
      this.prefetchInFlight = true;
      try {
        const current = this.ledger.getSnapshot();
        const phase = normalizePhase(current.phase);
        if (this.buffer.get(phase, current.inputRevision)) {
          return;
        }
        const payload = await this.generatePayload(phase);
        this.buffer.set(phase, current.inputRevision, payload);
        this.ledger.setStatusMessage(reason === 'start' ? 'Interview mode ready' : 'Next script prefetched');
      } catch (error: any) {
        this.ledger.setStatusMessage(`Prefetch failed: ${error.message || 'unknown error'}`);
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

  private async generatePayload(phase: Exclude<InterviewPhase, 'p1_intro'>): Promise<InterviewOverlayPayload> {
    const snapshot = this.ledger.getSnapshot();
    const context: InterviewGeneratorContext = {
      snapshot,
      recentTranscript: this.ledger.getRecentTranscript(),
      screenAnalysis: this.lastScreenAnalysis,
      previousPayload: snapshot.latestPayload,
    };

    const payload = await this.generators[phase].generate(context);

    if (this.lastDiffResult && phase === 'p4_code' && payload.codePanel) {
      payload.codePanel.mode = 'diff';
      payload.codePanel.content = this.lastDiffResult.diffText || payload.codePanel.content;
      payload.changes = [
        ...payload.changes,
        ...this.lastDiffResult.summary.map((detail) => ({
          label: 'Code change',
          detail,
          severity: 'updated' as const,
        })),
      ];
    }

    if (payload.speakNow.length === 0) {
      payload.speakNow = fallbackSpeakNow(phase, snapshot);
    }

    if (payload.pinnedFacts.length === 0) {
      payload.pinnedFacts = compactFacts(snapshot);
    }

    if (phase === 'p3_approach' && payload.speakNow.length > 0) {
      this.ledger.setApproachSummary(payload.speakNow.slice(0, 4));
    }

    if (phase === 'p2_clarify' && snapshot.problemStatement === '' && payload.writeNow.length > 0) {
      this.ledger.setOpenQuestions(payload.quickQuestions);
    }

    return payload;
  }

  private publishBufferedPayload(entry: InterviewBufferEntry): void {
    this.lastAdvanceCount = 0;
    if (this.ledger.getSnapshot().manualOverridePhase) {
      this.ledger.clearManualOverridePhase();
    }
    this.ledger.applyGeneratedPayload(entry.payload);
  }

  private advancePublishedPayload(): void {
    const snapshot = this.ledger.getSnapshot();
    const payload = snapshot.latestPayload;
    if (!payload) return;

    const nextAdvanceCount = this.lastAdvanceCount + 1;
    const promoted = payload.speakIfAsked.slice(0, nextAdvanceCount);
    if (promoted.length === 0) {
      this.ledger.setStatusMessage('No new context yet. Current script is still the freshest.');
      return;
    }

    this.lastAdvanceCount = promoted.length;
    const derived: InterviewOverlayPayload = {
      ...payload,
      speakNow: dedupe([...payload.speakNow, ...promoted]),
      changes: [
        ...payload.changes,
        {
          label: 'Expanded script',
          detail: `Added ${promoted.length} backup line${promoted.length === 1 ? '' : 's'} to the main script.`,
          severity: 'updated',
        },
      ],
      generatedAt: Date.now(),
      freshness: {
        ...payload.freshness,
        generatedMsAgo: 0,
      },
    };

    this.ledger.applyGeneratedPayload(derived);
  }
}

function normalizePhase(phase: InterviewPhase): Exclude<InterviewPhase, 'p1_intro'> {
  return phase === 'p1_intro' ? 'p2_clarify' : phase;
}

function fallbackSpeakNow(phase: InterviewPhase, snapshot: InterviewSessionSnapshot): string[] {
  switch (phase) {
    case 'p2_clarify':
      return [
        'Let me restate the problem to make sure I have it right.',
        snapshot.problemStatement || 'I want to confirm the exact input, output, and constraints before I start.',
      ];
    case 'p3_approach':
      return [
        'I will start with the brute-force idea and then move to the optimized approach.',
        'Before I code, I want to confirm the tradeoff and the target complexity.',
      ];
    case 'p4_code':
      return [
        'I am going to write the top-down structure first and then fill in the helpers.',
        'I will keep the code aligned with the approach we just agreed on.',
      ];
    case 'p5_test':
      return [
        'Let me dry run this with a concrete example and then cover edge cases and complexity.',
      ];
    case 'p6_close':
      return [
        'I can make that change, and then I will quickly summarize the impact.',
      ];
    default:
      return ['I am going to move one step at a time and keep the explanation clear.'];
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
  return Array.from(new Set(items.filter(Boolean)));
}

function isControlStripVisible(snapshot: InterviewSessionSnapshot): boolean {
  return !!snapshot.controlStripVisibleUntil && snapshot.controlStripVisibleUntil > Date.now();
}

function buildControlStripHint(snapshot: InterviewSessionSnapshot): string {
  const activePhase = snapshot.manualOverridePhase || snapshot.phase;
  return `SYNC again to cycle phase. Current target: ${formatPhase(activePhase)}.`;
}

function formatPhase(phase: InterviewPhase): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Clarify';
    case 'p3_approach':
      return 'Approach';
    case 'p4_code':
      return 'Code';
    case 'p5_test':
      return 'Test';
    case 'p6_close':
      return 'Close';
    default:
      return 'Clarify';
  }
}
