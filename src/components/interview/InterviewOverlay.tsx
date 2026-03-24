import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import InterviewCodePanel from './InterviewCodePanel'
import InterviewControlStrip from './InterviewControlStrip'
import InterviewDiffPanel from './InterviewDiffPanel'
import InterviewExtractedTextPanel from './InterviewExtractedTextPanel'
import InterviewMainPanel from './InterviewMainPanel'
import InterviewNotesRail from './InterviewNotesRail'
import InterviewTopStrip from './InterviewTopStrip'
import type {
  InterviewExtractedTextSummary,
  InterviewPhaseDocumentMap,
  InterviewPhaseHandoffMap,
  InterviewSessionSnapshot,
  RenderableInterviewPhase,
} from '../../types/interview'
import { useShortcuts } from '../../hooks/useShortcuts'

interface InterviewOverlayProps {
  overlayOpacity: number
  onEndMeeting: () => void
}

const EMPTY_PHASE_DOCUMENTS: InterviewPhaseDocumentMap = {
  p2_clarify: createEmptyPhaseDocument('p2_clarify'),
  p3_approach: createEmptyPhaseDocument('p3_approach'),
  p4_code: createEmptyPhaseDocument('p4_code'),
  p5_test: createEmptyPhaseDocument('p5_test'),
  p6_follow_up: createEmptyPhaseDocument('p6_follow_up'),
}

const EMPTY_PHASE_HANDOFFS: InterviewPhaseHandoffMap = {
  p2_clarify: createEmptyPhaseHandoff(),
  p3_approach: createEmptyPhaseHandoff(),
  p4_code: createEmptyPhaseHandoff(),
  p5_test: createEmptyPhaseHandoff(),
  p6_follow_up: createEmptyPhaseHandoff(),
}

const EMPTY_SNAPSHOT: InterviewSessionSnapshot = {
  active: true,
  sessionType: 'interview',
  routingMode: 'manual',
  phase: 'p2_clarify',
  phaseConfidence: 0,
  manualOverridePhase: null,
  controlStripVisibleUntil: null,
  controlStripHint: null,
  meetingStartedAt: null,
  inputRevision: 0,
  lastGeneratedRevision: 0,
  isGenerating: false,
  isSyncing: false,
  statusMessage: 'Interview mode is getting ready.',
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
  phaseHandoffs: EMPTY_PHASE_HANDOFFS,
  phaseDocuments: EMPTY_PHASE_DOCUMENTS,
  lastTranscriptAt: null,
  lastScreenshotAt: null,
  lastTranscriptSnippet: '',
  currentCode: null,
  latestPayload: null,
  mainScrollOffset: 0,
  lastScreenshotPath: null,
  lastScreenshotPreview: null,
}

const SCROLL_STEP = 220

const InterviewOverlay: React.FC<InterviewOverlayProps> = ({ overlayOpacity, onEndMeeting }) => {
  const [snapshot, setSnapshot] = useState<InterviewSessionSnapshot>(EMPTY_SNAPSHOT)
  const [now, setNow] = useState(Date.now())
  const [mousePassthrough, setMousePassthrough] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<number | null>(null)
  const { isShortcutPressed } = useShortcuts()
  const isReservedShortcutPressed = (event: KeyboardEvent | React.KeyboardEvent) => {
    return isShortcutPressed(event, 'reservedShortcut1')
      || isShortcutPressed(event, 'reservedShortcut2')
      || isShortcutPressed(event, 'reservedShortcut3')
      || isShortcutPressed(event, 'reservedShortcut4')
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isReservedShortcutPressed(event)) {
        event.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isShortcutPressed])

  useEffect(() => {
    let mounted = true

    window.electronAPI?.getInterviewState?.().then((nextSnapshot) => {
      if (mounted && nextSnapshot) {
        setSnapshot(nextSnapshot)
      }
    }).catch(() => {})

    window.electronAPI?.getOverlayMousePassthrough?.().then((enabled) => {
      if (mounted) {
        setMousePassthrough(enabled)
      }
    }).catch(() => {})

    const cleanupState = window.electronAPI?.onInterviewStateUpdated?.((nextSnapshot) => {
      if (mounted) {
        setSnapshot(nextSnapshot)
      }
    })

    const cleanupMouse = window.electronAPI?.onOverlayMousePassthroughChanged?.((enabled) => {
      if (mounted) {
        setMousePassthrough(enabled)
      }
    })

    const cleanupShortcuts = window.electronAPI?.onGlobalShortcut?.(({ action }) => {
      if (action === 'interviewScrollUp') {
        scrollMain(-SCROLL_STEP)
      } else if (action === 'interviewScrollDown') {
        scrollMain(SCROLL_STEP)
      }
    })

    const interval = window.setInterval(() => {
      if (mounted) {
        setNow(Date.now())
      }
    }, 500)

    return () => {
      mounted = false
      if (cleanupState) cleanupState()
      if (cleanupMouse) cleanupMouse()
      if (cleanupShortcuts) cleanupShortcuts()
      window.clearInterval(interval)
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current)
      }
    }
  }, [])

  const activePhase = useMemo<RenderableInterviewPhase>(
    () => normalizePhase(snapshot.manualOverridePhase || snapshot.phase),
    [snapshot.manualOverridePhase, snapshot.phase]
  )

  const activeDocument = useMemo(
    () => snapshot.phaseDocuments[activePhase],
    [activePhase, snapshot.phaseDocuments]
  )

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    if (Math.abs(scrollRef.current.scrollTop - activeDocument.scrollOffset) > 120) {
      scrollRef.current.scrollTop = activeDocument.scrollOffset
    }
  }, [activeDocument.scrollOffset])

  const isControlStripVisible = Boolean(snapshot.controlStripVisibleUntil && snapshot.controlStripVisibleUntil > now)

  const showDiffPanel = Boolean(
    activeDocument.codePanel?.mode === 'diff'
      && (activePhase === 'p4_code' || activePhase === 'p6_follow_up')
  )

  const showExtractedText = hasExtractedContent(activeDocument.extractedText)

  const handleNext = async () => {
    const nextSnapshot = await window.electronAPI?.interviewNext?.()
    if (nextSnapshot) {
      setSnapshot(nextSnapshot)
    }
  }

  const handleSync = async () => {
    const nextSnapshot = await window.electronAPI?.interviewSync?.()
    if (nextSnapshot) {
      setSnapshot(nextSnapshot)
    }
  }

  const handlePhaseShift = async (direction: -1 | 1) => {
    const nextSnapshot = await window.electronAPI?.interviewShiftPhase?.(direction)
    if (nextSnapshot) {
      setSnapshot(nextSnapshot)
    }
  }

  const handleExitInterviewMode = async () => {
    await window.electronAPI?.toggleInterviewMode?.()
  }

  const handleScroll = () => {
    persistScroll(scrollRef.current?.scrollTop || 0)
  }

  const persistScroll = (offset: number) => {
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current)
    }
    scrollTimerRef.current = window.setTimeout(() => {
      window.electronAPI?.interviewSetScrollOffset?.(offset).catch(() => {})
    }, 90)
  }

  const scrollMain = (delta: number) => {
    const target = scrollRef.current
    if (!target) {
      return
    }

    const nextOffset = Math.max(0, target.scrollTop + delta)
    target.scrollTo({ top: nextOffset, behavior: 'smooth' })
    persistScroll(nextOffset)
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ opacity: Math.max(0.72, Math.min(1, 0.7 + overlayOpacity * 0.28)) }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.04)' }}
      />
      <div className="relative z-10 h-full w-full px-3 pb-2 pt-2">
        <div className="mx-auto flex h-full max-w-[1640px] flex-col gap-2">
          <InterviewTopStrip
            phase={snapshot.phase}
            manualOverridePhase={snapshot.manualOverridePhase}
            routingMode={snapshot.routingMode}
            isGenerating={snapshot.isGenerating}
            mousePassthrough={mousePassthrough}
            updateSummary={activeDocument.updateSummary}
            onNext={handleNext}
            onSync={handleSync}
            onExitInterviewMode={handleExitInterviewMode}
            onEndMeeting={onEndMeeting}
          />

          <AnimatePresence>
            {isControlStripVisible && (
              <InterviewControlStrip
                hint={snapshot.controlStripHint}
                activePhase={activePhase}
                mousePassthrough={mousePassthrough}
                onPrevPhase={() => handlePhaseShift(-1)}
                onNextPhase={() => handlePhaseShift(1)}
                onExitInterviewMode={handleExitInterviewMode}
              />
            )}
          </AnimatePresence>

          <div
            className={[
              'grid min-h-0 flex-1 gap-2',
              showDiffPanel
                ? 'xl:grid-cols-[minmax(0,1fr)_500px_280px]'
                : 'xl:grid-cols-[minmax(0,1fr)_500px]',
            ].join(' ')}
          >
            <InterviewMainPanel
              snapshot={snapshot}
              document={activeDocument}
              scrollRef={scrollRef}
              onScroll={handleScroll}
            />

            <div className="grid min-h-0 gap-2 xl:grid-rows-[minmax(0,1fr)_auto]">
              <InterviewCodePanel snapshot={snapshot} document={activeDocument} />
              <InterviewNotesRail snapshot={snapshot} phase={activePhase} />
            </div>

            {showDiffPanel && (
              <InterviewDiffPanel
                codePanel={activeDocument.codePanel}
                phase={activePhase}
              />
            )}
          </div>

          {showExtractedText && (
            <InterviewExtractedTextPanel extractedText={activeDocument.extractedText} />
          )}
        </div>
      </div>
    </div>
  )
}

function createEmptyPhaseDocument(phase: RenderableInterviewPhase) {
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
      status: 'partial' as const,
      updatedSections: [],
      message: 'Waiting for first update',
      at: 0,
    },
    scrollOffset: 0,
    lastUpdatedAt: null,
  }
}

function createEmptyPhaseHandoff() {
  return {
    summaryLines: [],
    confirmedSpecLines: [],
    openQuestions: [],
    updatedAt: null,
  }
}

function normalizePhase(phase: InterviewSessionSnapshot['phase']): RenderableInterviewPhase {
  return phase === 'p1_intro' ? 'p2_clarify' : phase
}

function formatPhase(phase: RenderableInterviewPhase): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Clarify'
    case 'p3_approach':
      return 'Approach'
    case 'p4_code':
      return 'Code'
    case 'p5_test':
      return 'Test'
    case 'p6_follow_up':
      return 'Follow-up'
  }
}

function hasExtractedContent(e: InterviewExtractedTextSummary): boolean {
  return Boolean(
    e.problemText
    || e.requirementDelta.length > 0
    || e.dryRunInput
    || e.codeObservations.length > 0
  )
}

export default InterviewOverlay
