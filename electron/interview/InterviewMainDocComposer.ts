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
import {
  isRepairableLinePair,
  normalizeInterviewLine,
} from './InterviewContentHealth';

export interface InterviewComposeOptions {
  clarificationItems?: InterviewClarificationItem[];
  savedContexts: InterviewSavedContexts;
  diffText?: string | null;
  forceFreshContent?: boolean;
}

export class InterviewMainDocComposer {
  public compose(
    snapshot: InterviewSessionSnapshot,
    payload: InterviewOverlayPayload,
    options: InterviewComposeOptions
  ): InterviewPhaseDocument {
    const previous = snapshot.phaseDocuments[payload.phase];
    const baseFeed = options.forceFreshContent ? [] : previous.mainFeed;
    const mergedLines = mergeDisplayLines(baseFeed, payload.phase, payload.mainLines, options.clarificationItems);
    const updatedFeed = applyPhaseStateUpdates(
      mergedLines.feed,
      payload.phase,
      options.clarificationItems,
      mergedLines.lines.length > 0
    );
    const nextFeed = mergedLines.lines.length > 0
      ? [...updatedFeed, ...buildBlockEntries(payload.phase, mergedLines.lines, updatedFeed, options.clarificationItems)]
      : updatedFeed;
    const codePanes = buildCodePanes(previous, snapshot, payload, options.diffText || null);
    const mainUpdated = mergedLines.repaired || mergedLines.lines.length > 0 || hasFeedChanged(previous.mainFeed, updatedFeed);
    const status = buildStatus(mainUpdated, codePanes.codeUpdated, payload.generatedAt);

    return {
      phase: payload.phase,
      mainFeed: nextFeed.length > 0 ? nextFeed : baseFeed.length > 0 ? baseFeed : previous.mainFeed,
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

function buildStatus(mainUpdated: boolean, codeUpdated: boolean, generatedAt: number): InterviewRenderStatus {
  const updatedSections: string[] = [];
  if (mainUpdated) {
    updatedSections.push('Main');
  }
  if (codeUpdated) {
    updatedSections.push('Code');
  }

  return {
    status: updatedSections.length > 0 ? 'updated' : 'unchanged',
    updatedSections,
    message: updatedSections.length > 0 ? `Updated: ${updatedSections.join(', ')}` : 'No updates found',
    at: generatedAt,
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
    if (
      normalizedLine === normalizedQuestion
      || normalizedLine.includes(normalizedQuestion)
      || normalizedQuestion.includes(normalizedLine)
      || isRepairableLinePair(normalizedLine, normalizedQuestion)
    ) {
      return item;
    }
  }
  return null;
}

function isNoteLine(line: string): boolean {
  return /^(write|note|input:|output:|values:|return:|constraints?:|edge cases?:|example:|trace:|#)/i.test(line.trim());
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
  const previousContent = previousPrimary?.content.trim() || '';
  const referenceContent = currentContent || previousContent;
  const hasCodeChange = Boolean(nextContent && normalizeContent(referenceContent) !== normalizeContent(nextContent));
  const hasMeaningfulDiff = Boolean(currentContent && nextContent && currentContent !== nextContent);
  const emptyNotes: string[] = [];

  if (!hasGeneratedCode) {
    return {
      primaryCode: previousPrimary || snapshotCode,
      secondaryCode: previous.secondaryCode,
      codeUpdated: false,
    };
  }

  if (!hasCodeChange) {
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
  return normalizeInterviewLine(value);
}

function normalizeContent(value: string): string {
  return value.trim().replace(/\r\n/g, '\n');
}

function mergeDisplayLines(
  feed: InterviewFeedEntry[],
  phase: RenderableInterviewPhase,
  lines: string[],
  clarificationItems?: InterviewClarificationItem[]
): { feed: InterviewFeedEntry[]; lines: string[]; repaired: boolean } {
  const nextFeed = feed.map(cloneFeedEntry);
  const existing = new Set(
    nextFeed
      .filter((entry) => entry.type === 'line' && entry.text)
      .map((entry) => normalize(entry.text as string).toLowerCase())
  );
  const seen = new Set<string>();
  const result: string[] = [];
  let repaired = false;

  for (const line of lines) {
    const normalized = normalize(line);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (existing.has(key) || seen.has(key)) {
      continue;
    }

    const repairIndex = findRepairIndex(nextFeed, normalized);
    if (repairIndex >= 0) {
      const entry = nextFeed[repairIndex];
      const previousText = normalize(entry.text || '');
      if (previousText && previousText.toLowerCase() !== key) {
        existing.delete(previousText.toLowerCase());
      }
      entry.text = normalized;
      repairLineClassification(entry, phase, normalized, clarificationItems);
      existing.add(key);
      repaired = true;
      continue;
    }

    seen.add(key);
    result.push(normalized);
  }

  return {
    feed: nextFeed,
    lines: result,
    repaired,
  };
}

function findRepairIndex(feed: InterviewFeedEntry[], incomingLine: string): number {
  let bestIndex = -1;
  let bestLength = 0;

  for (let index = 0; index < feed.length; index += 1) {
    const entry = feed[index];
    if (entry.type !== 'line' || !entry.text) {
      continue;
    }

    const existingLine = normalize(entry.text);
    if (!isRepairableLinePair(existingLine, incomingLine)) {
      continue;
    }

    if (existingLine.length > bestLength) {
      bestIndex = index;
      bestLength = existingLine.length;
    }
  }

  return bestIndex;
}

function repairLineClassification(
  entry: InterviewFeedEntry,
  phase: RenderableInterviewPhase,
  line: string,
  clarificationItems?: InterviewClarificationItem[]
): void {
  if (phase !== 'p2_clarify' || !clarificationItems) {
    return;
  }

  const clarificationItem = matchClarificationItem(line, clarificationItems);
  if (clarificationItem) {
    entry.state = mapClarificationStatus(clarificationItem.status);
    entry.clarificationId = clarificationItem.id;
    return;
  }

  if (isNoteLine(line)) {
    entry.state = 'note';
    entry.clarificationId = null;
  }
}

function hasFeedChanged(previous: InterviewFeedEntry[], next: InterviewFeedEntry[]): boolean {
  if (previous.length !== next.length) {
    return true;
  }

  for (let index = 0; index < previous.length; index += 1) {
    const left = previous[index];
    const right = next[index];
    if (
      left.id !== right.id
      || left.type !== right.type
      || left.text !== right.text
      || left.state !== right.state
      || left.blockId !== right.blockId
      || left.blockLabel !== right.blockLabel
      || left.clarificationId !== right.clarificationId
    ) {
      return true;
    }
  }

  return false;
}
