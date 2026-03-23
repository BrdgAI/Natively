import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import InterviewCodePanel from './InterviewCodePanel'
import InterviewControlStrip from './InterviewControlStrip'
import InterviewMainPanel from './InterviewMainPanel'
import InterviewNotesRail from './InterviewNotesRail'
import InterviewTopStrip from './InterviewTopStrip'
import type { InterviewSessionSnapshot } from '../../types/interview'

interface InterviewOverlayProps {
  overlayOpacity: number
  onEndMeeting: () => void
}

const EMPTY_SNAPSHOT: InterviewSessionSnapshot = {
  active: true,
  sessionType: 'interview',
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
  constraints: [],
  examples: [],
  approachSummary: [],
  pinnedFacts: [],
  thoughtNotes: [],
  quickQuestions: [],
  requirementChanges: [],
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

  useEffect(() => {
    if (!scrollRef.current) {
      return
    }

    if (Math.abs(scrollRef.current.scrollTop - snapshot.mainScrollOffset) > 120) {
      scrollRef.current.scrollTop = snapshot.mainScrollOffset
    }
  }, [snapshot.mainScrollOffset])

  const isControlStripVisible = !!snapshot.controlStripVisibleUntil && snapshot.controlStripVisibleUntil > now
  const isStale = !snapshot.latestPayload || snapshot.latestPayload.inputRevision < snapshot.inputRevision

  const activePhase = useMemo(
    () => snapshot.manualOverridePhase || snapshot.phase,
    [snapshot.manualOverridePhase, snapshot.phase]
  )

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
    await window.electronAPI?.exitInterviewMode?.()
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

    target.scrollBy({ top: delta, behavior: 'smooth' })
    persistScroll(target.scrollTop + delta)
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ opacity: Math.max(0.7, Math.min(1, 0.65 + overlayOpacity * 0.35)) }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,250,240,0.34),transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-[38vh] bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.2),transparent_60%)]" />
      <div className="relative z-10 h-full w-full px-6 pb-6 pt-5">
        <div className="mx-auto flex h-full max-w-[1540px] flex-col gap-4">
          <InterviewTopStrip
            phase={snapshot.phase}
            phaseConfidence={snapshot.phaseConfidence}
            manualOverridePhase={snapshot.manualOverridePhase}
            statusMessage={snapshot.statusMessage}
            lastTranscriptSnippet={snapshot.lastTranscriptSnippet}
            lastTranscriptAt={snapshot.lastTranscriptAt}
            lastScreenshotAt={snapshot.lastScreenshotAt}
            isStale={isStale}
            mousePassthrough={mousePassthrough}
            textModelLabel={textModelLabel}
            sttLabel={sttLabel}
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
                onPrevPhase={() => handlePhaseShift(-1)}
                onNextPhase={() => handlePhaseShift(1)}
                onExitInterviewMode={handleExitInterviewMode}
              />
            )}
          </AnimatePresence>

          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.28fr)_420px]">
            <InterviewMainPanel
              snapshot={snapshot}
              scrollRef={scrollRef}
              onScroll={handleScroll}
            />

            <div className="flex min-h-0 flex-col gap-4">
              <InterviewCodePanel snapshot={snapshot} />
              <InterviewNotesRail snapshot={snapshot} mousePassthrough={mousePassthrough} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function capitalize(value: string): string {
  if (!value) {
    return ''
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export default InterviewOverlay
