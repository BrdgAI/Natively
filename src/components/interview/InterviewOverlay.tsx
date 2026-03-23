import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import InterviewCodePanel from './InterviewCodePanel'
import InterviewControlStrip from './InterviewControlStrip'
import InterviewExtractedTextPanel from './InterviewExtractedTextPanel'
import InterviewMainPanel from './InterviewMainPanel'
import InterviewNotesRail from './InterviewNotesRail'
import InterviewQuickAnswersPanel from './InterviewQuickAnswersPanel'
import InterviewTopStrip from './InterviewTopStrip'
import type { InterviewPhaseDocumentMap, InterviewPhaseHandoffMap, InterviewSessionSnapshot, RenderableInterviewPhase } from '../../types/interview'

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
  const [textModelLabel, setTextModelLabel] = useState('Text from settings')
  const [sttLabel, setSttLabel] = useState('STT from settings')
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTimerRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    window.electronAPI?.getInterviewState?.().then((nextSnapshot) => {
      if (mounted && nextSnapshot) {
        setSnapshot(nextSnapshot)
      }
    }).catch(() => {})

    window.electronAPI?.getCurrentLlmConfig?.().then((config) => {
      if (mounted && config) {
        setTextModelLabel(`${capitalize(config.provider)} ${config.model}`)
      }
    }).catch(() => {})

    window.electronAPI?.getSttProvider?.().then((provider) => {
      if (mounted && provider) {
        setSttLabel(`STT ${capitalize(provider)}`)
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
        style={{ background: 'rgba(26, 23, 20, 0.14)' }}
      />
      <div className="relative z-10 h-full w-full px-4 pb-4 pt-3">
        <div className="mx-auto flex h-full max-w-[1580px] flex-col gap-3">
          <InterviewTopStrip
            phase={snapshot.phase}
            phaseConfidence={snapshot.phaseConfidence}
            manualOverridePhase={snapshot.manualOverridePhase}
            routingMode={snapshot.routingMode}
            statusMessage={snapshot.statusMessage}
            lastTranscriptSnippet={snapshot.lastTranscriptSnippet}
            lastTranscriptAt={snapshot.lastTranscriptAt}
            lastScreenshotAt={snapshot.lastScreenshotAt}
            mousePassthrough={mousePassthrough}
            textModelLabel={textModelLabel}
            sttLabel={sttLabel}
            updateSummary={activeDocument.updateSummary}
            now={now}
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

          <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_430px]">
            <InterviewMainPanel
              snapshot={snapshot}
              document={activeDocument}
              scrollRef={scrollRef}
              onScroll={handleScroll}
            />

            <div className="grid min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_auto_auto]">
              <InterviewCodePanel snapshot={snapshot} document={activeDocument} />
              <InterviewQuickAnswersPanel items={activeDocument.quickAnswers} />
              <InterviewNotesRail snapshot={snapshot} />
            </div>
          </div>

          <InterviewExtractedTextPanel extractedText={activeDocument.extractedText} />
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

function capitalize(value: string): string {
  if (!value) {
    return ''
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default InterviewOverlay
