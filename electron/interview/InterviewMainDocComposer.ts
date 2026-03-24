import {
  InterviewClarificationItem,
  InterviewCodePane,
  InterviewFeedEntry,
  InterviewFeedLineState,
  InterviewOverlayPayload,
  InterviewPhaseDocument,
  InterviewRenderStatus,
  InterviewSavedContext,
  InterviewSavedContexts,
  InterviewSessionSnapshot,
  RenderableInterviewPhase,
} from './types';

export interface InterviewComposeOptions {
  clarificationItems?: InterviewClarificationItem[];
  savedContexts: InterviewSavedContexts;
  diffText?: string | null;
}

export class InterviewMainDocComposer {
  public compose(
    snapshot: InterviewSessionSnapshot,
    payload: InterviewOverlayPayload,
    options: InterviewComposeOptions
  ): InterviewPhaseDocument {
    const previous = snapshot.phaseDocuments[payload.phase];
    const updatedFeed = applyPhaseStateUpdates(
      previous.mainFeed,
      payload.phase,
      options.clarificationItems,
      payload.mainLines.length > 0
    );
    const nextFeed = payload.mainLines.length > 0
      ? [...updatedFeed, ...buildBlockEntries(payload.phase, payload.mainLines, updatedFeed, options.clarificationItems)]
      : updatedFeed;
    const codePanes = buildCodePanes(previous, snapshot, payload, options.diffText || null);
    const status = buildStatus(payload, codePanes.codeUpdated);

    return {
      phase: payload.phase,
      mainFeed: nextFeed.length > 0 ? nextFeed : previous.mainFeed,
      primaryCode: codePanes.primaryCode,
      secondaryCode: codePanes.secondaryCode,
      savedContexts: cloneSavedContexts(options.savedContexts),
      status,
      scrollOffset: previous.scrollOffset,
      lastUpdatedAt: payload.generatedAt,
    };
  }

  public withSavedScreenContext(
    document: InterviewPhaseDocument,
    screenContext: InterviewSavedContext,
    message: string
  ): InterviewPhaseDocument {
    return {
      ...document,
      savedContexts: {
        ...cloneSavedContexts(document.savedContexts),
        screen: cloneSavedContext(screenContext),
      },
      status: buildContextStatus('Screen Context', message),
      lastUpdatedAt: Date.now(),
    };
  }

  public withSavedNormalContext(
    document: InterviewPhaseDocument,
    normalContext: InterviewSavedContext,
    message: string
  ): InterviewPhaseDocument {
    return {
      ...document,
      savedContexts: {
        ...cloneSavedContexts(document.savedContexts),
        normal: cloneSavedContext(normalContext),
      },
      status: buildContextStatus('Normal Context', message),
      lastUpdatedAt: Date.now(),
    };
  }

  public withNoUpdate(document: InterviewPhaseDocument, message: string): InterviewPhaseDocument {
    return {
      ...document,
      status: {
        status: 'unchanged',
        updatedSections: [],
        message,
        at: Date.now(),
      },
      lastUpdatedAt: Date.now(),
    };
  }
}

function buildContextStatus(section: string, message: string): InterviewRenderStatus {
  return {
    status: 'updated',
    updatedSections: [section],
    message,
    at: Date.now(),
  };
}

function buildStatus(payload: InterviewOverlayPayload, codeUpdated: boolean): InterviewRenderStatus {
  const updatedSections: string[] = [];
  if (payload.mainLines.length > 0) {
    updatedSections.push('Main');
  }
  if (codeUpdated) {
    updatedSections.push('Code');
  }

  return {
    status: updatedSections.length > 0 ? 'updated' : 'unchanged',
    updatedSections,
    message: updatedSections.length > 0 ? `Updated: ${updatedSections.join(', ')}` : 'No updates',
    at: payload.generatedAt,
  };
}

function applyPhaseStateUpdates(
  feed: InterviewFeedEntry[],
  phase: RenderableInterviewPhase,
  clarificationItems?: InterviewClarificationItem[],
  hasNewLines?: boolean
): InterviewFeedEntry[] {
  const nextFeed = feed.map(cloneFeedEntry);

  if (phase === 'p2_clarify' && clarificationItems) {
    const itemsById = new Map(clarificationItems.map((item) => [item.id, item]));
    for (const entry of nextFeed) {
      if (entry.type !== 'line' || !entry.clarificationId) {
        continue;
      }

      const item = itemsById.get(entry.clarificationId);
      if (!item) {
        continue;
      }

      entry.state = mapClarificationStatus(item.status);
    }
  }

  if (phase === 'p5_test' && hasNewLines) {
    for (const entry of nextFeed) {
      if (entry.type !== 'line' || entry.state === 'answered' || entry.state === 'replaced') {
        continue;
      }
      entry.state = 'replaced';
    }
  }

  return nextFeed;
}

function buildBlockEntries(
  phase: RenderableInterviewPhase,
  lines: string[],
  previousFeed: InterviewFeedEntry[],
  clarificationItems?: InterviewClarificationItem[]
): InterviewFeedEntry[] {
  const blockIndex = previousFeed.filter((entry) => entry.type === 'header').length + 1;
  const blockId = `${phase}-block-${blockIndex}`;
  const blockLabel = buildBlockLabel(phase, blockIndex);
  const hasPreviousContent = previousFeed.some((entry) => entry.type === 'line');
  const entries: InterviewFeedEntry[] = [
    {
      id: `${blockId}-header`,
      blockId,
      type: 'header',
      blockLabel,
      text: blockLabel,
      state: null,
      clarificationId: null,
    },
    {
      id: `${blockId}-divider`,
      blockId,
      type: 'divider',
      blockLabel,
      text: null,
      state: null,
      clarificationId: null,
    },
  ];

  lines.forEach((line, index) => {
    const classification = classifyLine(phase, line, index, hasPreviousContent, clarificationItems);
    entries.push({
      id: `${blockId}-line-${index + 1}`,
      blockId,
      type: 'line',
      blockLabel,
      text: normalize(line),
      state: classification.state,
      clarificationId: classification.clarificationId,
    });
  });

  return entries;
}

function classifyLine(
  phase: RenderableInterviewPhase,
  line: string,
  index: number,
  hasPreviousContent: boolean,
  clarificationItems?: InterviewClarificationItem[]
): { state: InterviewFeedLineState; clarificationId: string | null } {
  if (phase === 'p2_clarify' && clarificationItems) {
    const clarificationItem = matchClarificationItem(line, clarificationItems);
    if (clarificationItem) {
      return {
        state: mapClarificationStatus(clarificationItem.status),
        clarificationId: clarificationItem.id,
      };
    }

    if (index === 0 || isNoteLine(line)) {
      return {
        state: 'note',
        clarificationId: null,
      };
    }
  }

  return {
    state: hasPreviousContent ? 'update' : 'active',
    clarificationId: null,
  };
}

function matchClarificationItem(
  line: string,
  clarificationItems: InterviewClarificationItem[]
): InterviewClarificationItem | null {
  const normalizedLine = normalize(line);
  for (const item of clarificationItems) {
    const normalizedQuestion = normalize(item.text);
    if (!normalizedQuestion) {
      continue;
    }
    if (normalizedLine === normalizedQuestion || normalizedLine.includes(normalizedQuestion)) {
      return item;
    }
  }
  return null;
}

function isNoteLine(line: string): boolean {
  return /^(write|note|input:|output:|constraints?:|edge cases?:|example:|trace:|#)/i.test(line.trim());
}

function mapClarificationStatus(status: InterviewClarificationItem['status']): InterviewFeedLineState {
  switch (status) {
    case 'answered':
      return 'answered';
    case 'replaced':
    case 'retired':
      return 'replaced';
    default:
      return 'open';
  }
}

function buildBlockLabel(phase: RenderableInterviewPhase, blockIndex: number): string {
  if (blockIndex === 1) {
    return `${formatPhaseLabel(phase)} - Initial`;
  }

  if (phase === 'p5_test') {
    return `${formatPhaseLabel(phase)} - New dry run`;
  }

  return `${formatPhaseLabel(phase)} - Update ${blockIndex}`;
}

function buildCodePanes(
  previous: InterviewPhaseDocument,
  snapshot: InterviewSessionSnapshot,
  payload: InterviewOverlayPayload,
  diffText: string | null
): { primaryCode: InterviewCodePane | null; secondaryCode: InterviewCodePane | null; codeUpdated: boolean } {
  const snapshotCode = mapSnapshotCode(snapshot);
  const previousPrimary = previous.primaryCode;
  const hasGeneratedCode = Boolean(payload.code?.content.trim());
  const currentContent = snapshot.currentCode?.content.trim() || '';
  const nextContent = payload.code?.content.trim() || '';
  const hasMeaningfulDiff = Boolean(currentContent && nextContent && currentContent !== nextContent);
  const emptyNotes: string[] = [];

  if (!hasGeneratedCode) {
    return {
      primaryCode: previousPrimary || snapshotCode,
      secondaryCode: previous.secondaryCode,
      codeUpdated: false,
    };
  }

  const generatedPrimary: InterviewCodePane = {
    language: payload.code?.language || 'python',
    kind: 'full',
    title: payload.phase === 'p6_follow_up' ? 'Updated code' : 'Current code',
    content: payload.code?.content || '',
    notes: emptyNotes,
  };

  const secondaryKind: InterviewCodePane['kind'] = diffText ? 'diff' : 'replacement';
  const secondaryCode: InterviewCodePane | null = hasMeaningfulDiff
    ? {
        language: payload.code?.language || 'python',
        kind: secondaryKind,
        title: payload.phase === 'p6_follow_up' ? 'Follow-up changes' : 'Changes',
        content: diffText || payload.code?.content || '',
        notes: emptyNotes,
      }
    : null;

  if (payload.phase === 'p6_follow_up' && snapshotCode) {
    return {
      primaryCode: snapshotCode,
      secondaryCode,
      codeUpdated: true,
    };
  }

  return {
    primaryCode: generatedPrimary,
    secondaryCode,
    codeUpdated: true,
  };
}

function mapSnapshotCode(snapshot: InterviewSessionSnapshot): InterviewCodePane | null {
  if (!snapshot.currentCode) {
    return null;
  }

  return {
    language: 'python',
    kind: 'full',
    title: 'Current code',
    content: snapshot.currentCode.content,
    notes: [...snapshot.currentCode.suspectedMistakes],
  };
}

function cloneFeedEntry(entry: InterviewFeedEntry): InterviewFeedEntry {
  return {
    id: entry.id,
    blockId: entry.blockId,
    type: entry.type,
    blockLabel: entry.blockLabel,
    text: entry.text,
    state: entry.state,
    clarificationId: entry.clarificationId,
  };
}

function cloneSavedContexts(savedContexts: InterviewSavedContexts): InterviewSavedContexts {
  return {
    screen: cloneSavedContext(savedContexts.screen),
    normal: cloneSavedContext(savedContexts.normal),
  };
}

function cloneSavedContext(savedContext: InterviewSavedContext): InterviewSavedContext {
  return {
    title: savedContext.title,
    lines: [...savedContext.lines],
    updatedAt: savedContext.updatedAt,
  };
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

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
