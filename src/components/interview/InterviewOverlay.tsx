import React, { useEffect, useMemo, useRef, useState } from 'react'
import InterviewCodePanel from './InterviewCodePanel'
import InterviewContextFooter from './InterviewContextFooter'
import InterviewMainPanel from './InterviewMainPanel'
import InterviewTopStrip from './InterviewTopStrip'
import type {
  InterviewFetchIndicators,
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

const EMPTY_FETCH_INDICATORS: InterviewFetchIndicators = {
  next: {
    state: 'idle',
    message: 'Waiting',
    triggeredAt: null,
  },
  sync: {
    state: 'idle',
    message: 'Waiting',
    triggeredAt: null,
  },
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
  fetchIndicators: EMPTY_FETCH_INDICATORS,
}

const SCROLL_STEP = 220

const InterviewOverlay: React.FC<InterviewOverlayProps> = ({ overlayOpacity, onEndMeeting }) => {
  const [snapshot, setSnapshot] = useState<InterviewSessionSnapshot>(EMPTY_SNAPSHOT)
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

    return () => {
      mounted = false
      if (cleanupState) cleanupState()
      if (cleanupMouse) cleanupMouse()
      if (cleanupShortcuts) cleanupShortcuts()
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

  const hasSecondaryCode = Boolean(activeDocument.secondaryCode?.content.trim())

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
      style={{ opacity: Math.max(0.76, Math.min(1, 0.72 + overlayOpacity * 0.26)) }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(8, 6, 4, 0.24)' }}
      />
      <div className="relative z-10 h-full w-full px-2 pb-2 pt-2">
        <div className="mx-auto flex h-full max-w-[2025px] flex-col gap-2">
          <InterviewTopStrip
            phase={snapshot.phase}
            manualOverridePhase={snapshot.manualOverridePhase}
            isGenerating={snapshot.isGenerating}
            mousePassthrough={mousePassthrough}
            status={activeDocument.status}
            onNext={handleNext}
            onSync={handleSync}
            onExitInterviewMode={handleExitInterviewMode}
            onEndMeeting={onEndMeeting}
          />

          <div
            className={[
              'grid min-h-0 flex-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(680px,44%)] 2xl:grid-cols-[minmax(0,1fr)_900px]',
            ].join(' ')}
          >
            <InterviewMainPanel
              document={activeDocument}
              scrollRef={scrollRef}
              onScroll={handleScroll}
              emptyMessage={snapshot.statusMessage || 'Press Cmd+Enter when you want the current phase document to load.'}
            />

            <div
              className={[
                'grid min-h-0 gap-2',
                hasSecondaryCode
                  ? 'grid-cols-[minmax(0,1fr)_300px]'
                  : 'grid-cols-1',
              ].join(' ')}
            >
              <InterviewCodePanel
                codePane={activeDocument.primaryCode}
                emptyMessage="Primary code will appear here once coding starts or after screen sync captures visible code."
              />

              {hasSecondaryCode && (
                <InterviewCodePanel
                  codePane={activeDocument.secondaryCode}
                  emptyMessage="No changes yet."
                />
              )}
            </div>
          </div>

          <InterviewContextFooter fetchIndicators={snapshot.fetchIndicators} />
        </div>
      </div>
    </div>
  )
}

function createEmptyPhaseDocument(phase: RenderableInterviewPhase) {
  return {
    phase,
    mainFeed: [],
    primaryCode: null,
    secondaryCode: null,
    savedContexts: {
      screen: {
        title: 'Last screen context saved',
        lines: [],
        updatedAt: null,
      },
      normal: {
        title: 'Last normal context saved',
        lines: [],
        updatedAt: null,
      },
    },
    status: {
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

export default InterviewOverlay
