import {
  InterviewAnchorBlock,
  InterviewMainSection,
  InterviewOverlayPayload,
  InterviewPhase,
  InterviewPhaseDocument,
  InterviewQuickAnswerItem,
  InterviewSessionSnapshot,
  RenderableInterviewPhase,
} from './types';

export class InterviewMainDocComposer {
  public compose(
    snapshot: InterviewSessionSnapshot,
    payload: InterviewOverlayPayload
  ): InterviewPhaseDocument {
    const phase = payload.phase;
    const previous = snapshot.phaseDocuments[phase];
    const anchor = hasAnchorContent(payload.anchor) ? normalizeAnchor(payload.anchor) : buildFallbackAnchor(snapshot, phase, payload);
    const nextSections = payload.mainSections && payload.mainSections.length > 0
      ? payload.mainSections.map(normalizeSection).filter((section) => section.lines.length > 0)
      : buildFallbackSections(snapshot, phase, payload);
    const mainSections = mergeSections(previous.mainSections, nextSections);
    const quickAnswers = buildQuickAnswers(payload.quickQuestions, previous.quickAnswers);
    const codePanel = payload.codePanel ? cloneCodePanel(payload.codePanel) : previous.codePanel;
    const extractedText = { ...previous.extractedText };
    const updateSummary = payload.updateSummary || deriveUpdateSummary(payload);

    return {
      phase,
      anchor,
      mainSections: mainSections.length > 0 ? mainSections : previous.mainSections,
      quickAnswers,
      codePanel,
      extractedText,
      updateSummary,
      scrollOffset: previous.scrollOffset,
      lastUpdatedAt: payload.generatedAt,
    };
  }

  public withUpdatedExtractedText(
    document: InterviewPhaseDocument,
    extractedText: InterviewPhaseDocument['extractedText'],
    message: string,
    updatedSections: string[]
  ): InterviewPhaseDocument {
    return {
      ...document,
      extractedText,
      updateSummary: {
        status: updatedSections.length > 0 ? 'updated' : 'unchanged',
        updatedSections,
        message,
        at: Date.now(),
      },
      lastUpdatedAt: Date.now(),
    };
  }

  public withNoUpdate(document: InterviewPhaseDocument, message: string): InterviewPhaseDocument {
    return {
      ...document,
      updateSummary: {
        status: 'unchanged',
        updatedSections: [],
        message,
        at: Date.now(),
      },
      lastUpdatedAt: Date.now(),
    };
  }
}

function cloneCodePanel(codePanel: NonNullable<InterviewOverlayPayload['codePanel']>): InterviewPhaseDocument['codePanel'] {
  return {
    language: codePanel.language,
    mode: codePanel.mode,
    content: codePanel.content,
    narration: [...codePanel.narration],
    suspectedMistakes: [...codePanel.suspectedMistakes],
  };
}

function hasAnchorContent(anchor: InterviewOverlayPayload['anchor']): anchor is InterviewAnchorBlock {
  if (!anchor) {
    return false;
  }
  return Boolean(anchor.title || anchor.items.length > 0 || anchor.writeNow.length > 0 || anchor.note);
}

function normalizeAnchor(anchor: InterviewAnchorBlock): InterviewAnchorBlock {
  return {
    title: anchor.title.trim() || 'Current focus',
    items: uniqueStrings(anchor.items),
    writeNow: uniqueStrings(anchor.writeNow),
    note: anchor.note ? anchor.note.trim() : null,
  };
}

function normalizeSection(section: InterviewMainSection): InterviewMainSection {
  return {
    id: section.id.trim() || 'section',
    title: section.title.trim() || 'Section',
    lines: uniqueStrings(section.lines),
    tone: section.tone,
  };
}

function mergeSections(previous: InterviewMainSection[], next: InterviewMainSection[]): InterviewMainSection[] {
  const nextById = new Map(next.map((section) => [section.id, section]));
  const merged: InterviewMainSection[] = [];

  for (const section of previous) {
    const replacement = nextById.get(section.id);
    if (replacement) {
      merged.push(replacement);
      nextById.delete(section.id);
    } else {
      merged.push(section);
    }
  }

  for (const section of next) {
    if (nextById.has(section.id)) {
      merged.push(section);
      nextById.delete(section.id);
    }
  }

  return merged;
}

function buildQuickAnswers(nextQuickQuestions: string[], previous: InterviewQuickAnswerItem[]): InterviewQuickAnswerItem[] {
  const normalized = uniqueStrings(nextQuickQuestions);
  if (normalized.length === 0) {
    return previous;
  }

  return normalized.slice(0, 8).map((line, index) => ({
    id: `quick-answer-${index + 1}`,
    line,
  }));
}

function deriveUpdateSummary(payload: InterviewOverlayPayload): InterviewPhaseDocument['updateSummary'] {
  const updatedSections: string[] = [];
  if (payload.mainSections && payload.mainSections.length > 0) {
    updatedSections.push('Main');
  } else if (payload.speakNow.length > 0 || payload.writeNow.length > 0) {
    updatedSections.push('Main');
  }
  if (payload.codePanel?.content) {
    updatedSections.push('Code');
  }
  if (payload.quickQuestions.length > 0) {
    updatedSections.push('Quick Answers');
  }

  return {
    status: updatedSections.length > 0 ? 'updated' : 'unchanged',
    updatedSections,
    message: updatedSections.length > 0 ? `Updated: ${updatedSections.join(', ')}` : 'No updates',
    at: payload.generatedAt,
  };
}

function buildFallbackAnchor(
  snapshot: InterviewSessionSnapshot,
  phase: RenderableInterviewPhase,
  payload: InterviewOverlayPayload
): InterviewAnchorBlock {
  switch (phase) {
    case 'p2_clarify':
      return {
        title: 'Clarify',
        items: uniqueStrings([
          snapshot.problemStatement,
          ...snapshot.clarifiedFacts.slice(0, 2),
          ...payload.pinnedFacts.slice(0, 2),
        ]),
        writeNow: uniqueStrings(payload.writeNow.slice(0, 3)),
        note: snapshot.openQuestions.length > 0 ? `${snapshot.openQuestions.length} open questions tracked` : null,
      };
    case 'p3_approach':
      return {
        title: 'Approach',
        items: uniqueStrings([
          ...snapshot.approachSummary.slice(0, 2),
          ...payload.speakNow.slice(0, 1),
        ]),
        writeNow: uniqueStrings(payload.writeNow.slice(0, 2)),
        note: payload.speakIfAsked[0] || null,
      };
    case 'p4_code':
      return {
        title: 'Code',
        items: uniqueStrings([
          ...payload.pinnedFacts.slice(0, 2),
          ...snapshot.requirementChanges.slice(0, 1),
        ]),
        writeNow: uniqueStrings(payload.writeNow.slice(0, 3)),
        note: payload.codePanel?.mode === 'diff' ? 'Diff mode active' : 'Full solution visible',
      };
    case 'p5_test':
      return {
        title: 'Test',
        items: uniqueStrings([
          snapshot.phaseDocuments.p5_test.extractedText.dryRunInput,
          ...payload.quickQuestions.slice(0, 1),
        ]),
        writeNow: [],
        note: payload.speakIfAsked[0] || null,
      };
    case 'p6_follow_up':
      return {
        title: 'Follow-up',
        items: uniqueStrings([
          snapshot.activeFollowUp?.request || '',
          snapshot.activeFollowUp?.impactedArea || '',
          ...snapshot.requirementChanges.slice(0, 1),
        ]),
        writeNow: uniqueStrings(payload.writeNow.slice(0, 2)),
        note: snapshot.activeFollowUp?.diffRequired ? 'Diff required' : payload.codePanel?.mode === 'diff' ? 'Diff ready' : null,
      };
  }
}

function buildFallbackSections(
  snapshot: InterviewSessionSnapshot,
  phase: RenderableInterviewPhase,
  payload: InterviewOverlayPayload
): InterviewMainSection[] {
  const sections: InterviewMainSection[] = [];
  const primaryTitle = phase === 'p2_clarify'
    ? 'Ask in this order'
    : phase === 'p3_approach'
      ? 'Speak through the approach'
      : phase === 'p4_code'
        ? 'Narrate while coding'
        : phase === 'p5_test'
          ? 'Dry run and edge cases'
          : 'Respond to the follow-up';

  const primaryLines = phase === 'p2_clarify'
    ? uniqueStrings([
        ...payload.speakNow,
        ...snapshot.clarificationItems
          .filter((item) => item.status === 'pending' || item.status === 'asked')
          .slice(0, 6)
          .map((item) => `${item.text}${item.why ? ` (${item.why})` : ''}`),
      ])
    : uniqueStrings(payload.speakNow);

  if (primaryLines.length > 0) {
    sections.push({
      id: `${phase}-primary`,
      title: primaryTitle,
      lines: primaryLines,
      tone: 'primary',
    });
  }

  if (payload.writeNow.length > 0) {
    sections.push({
      id: `${phase}-write`,
      title: phase === 'p4_code' ? 'Type this structure' : 'Write in your notes',
      lines: uniqueStrings(payload.writeNow),
      tone: 'secondary',
    });
  }

  if (payload.speakIfAsked.length > 0) {
    sections.push({
      id: `${phase}-backup`,
      title: 'Keep ready',
      lines: uniqueStrings(payload.speakIfAsked),
      tone: 'secondary',
    });
  }

  if (payload.changes.length > 0) {
    sections.push({
      id: `${phase}-changes`,
      title: 'What changed',
      lines: payload.changes.map((item) => `${item.label}: ${item.detail}`),
      tone: payload.changes.some((item) => item.severity === 'warning') ? 'warning' : 'secondary',
    });
  }

  return sections;
}

function uniqueStrings(items: string[]): string[] {
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
