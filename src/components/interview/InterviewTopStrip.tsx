import React from 'react'
import { ArrowRight, Monitor, Power, ScanLine } from 'lucide-react'
import InterviewPhaseFlow from './InterviewPhaseFlow'
import InterviewUpdateIndicator from './InterviewUpdateIndicator'
import type { InterviewPhase, InterviewRoutingMode, InterviewUpdateSummary } from '../../types/interview'

interface InterviewTopStripProps {
  phase: InterviewPhase
  phaseConfidence: number
  manualOverridePhase: InterviewPhase | null
  routingMode: InterviewRoutingMode
  statusMessage: string | null
  lastTranscriptSnippet: string
  lastTranscriptAt: number | null
  lastScreenshotAt: number | null
  mousePassthrough: boolean
  textModelLabel: string
  sttLabel: string
  updateSummary: InterviewUpdateSummary
  now: number
  onNext: () => void
  onSync: () => void
  onExitInterviewMode: () => void
  onEndMeeting: () => void
}

const InterviewTopStrip: React.FC<InterviewTopStripProps> = ({
  phase,
  phaseConfidence,
  manualOverridePhase,
  routingMode,
  statusMessage,
  lastTranscriptSnippet,
  lastTranscriptAt,
  lastScreenshotAt,
  mousePassthrough,
  textModelLabel,
  sttLabel,
  updateSummary,
  now,
  onNext,
  onSync,
  onExitInterviewMode,
  onEndMeeting,
}) => {
  const activePhase = manualOverridePhase || phase

  return (
    <div className="interview-surface pointer-events-auto rounded-[10px] px-3.5 py-3">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-[12px] font-bold tracking-[0.01em] text-[#1d1814]">Interview Mode</div>
            <InterviewPhaseFlow activePhase={activePhase} manualOverridePhase={manualOverridePhase} />
          </div>

          <div className="rounded-[8px] border border-[#d8cec5] bg-[rgba(255,253,250,0.62)] px-3 py-2 text-[13px] font-medium leading-5 text-[#221b16]">
            {lastTranscriptSnippet || statusMessage || 'Press Cmd+Enter once the interview problem is visible.'}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#65584e]">
            <MetaPill label={`Confidence ${Math.round(phaseConfidence * 100)}%`} />
            <MetaPill label={`Routing ${routingMode}`} />
            <MetaPill label={`Transcript ${formatFreshness(lastTranscriptAt, now)}`} />
            <MetaPill label={`Screen ${formatFreshness(lastScreenshotAt, now)}`} />
            <MetaPill label={textModelLabel} />
            <MetaPill label={sttLabel} />
            {mousePassthrough && <MetaPill icon={<Monitor size={11} />} label="Click-through on" />}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 xl:items-end">
          <InterviewUpdateIndicator summary={updateSummary} />
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#5f5146]">
            <span className="rounded-[8px] border border-[#cfc4ba] bg-[rgba(255,252,248,0.64)] px-2.5 py-1">Cmd+Enter</span>
            <span>Next</span>
            <span className="rounded-[8px] border border-[#cfc4ba] bg-[rgba(255,252,248,0.64)] px-2.5 py-1">Cmd+Shift+Enter</span>
            <span>Sync</span>
          </div>
          {!mousePassthrough && (
            <div className="flex flex-wrap items-center gap-2">
              <StripButton label="Next" icon={<ArrowRight size={13} />} onClick={onNext} />
              <StripButton label="Sync" icon={<ScanLine size={13} />} onClick={onSync} />
              <StripButton label="Leave" icon={<Power size={13} />} onClick={onExitInterviewMode} />
              <StripButton label="End" icon={<Power size={13} />} onClick={onEndMeeting} danger />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const MetaPill = ({ icon, label }: { icon?: React.ReactNode; label: string }) => (
  <span className="inline-flex items-center gap-1 rounded-[8px] border border-[#d0c6bd] bg-[rgba(255,252,248,0.56)] px-2 py-1">
    {icon}
    <span>{label}</span>
  </span>
)

const StripButton = ({
  label,
  icon,
  onClick,
  danger = false,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
      danger
        ? 'border-[#54332d] bg-[#241915] text-[#faf3ec] hover:bg-[#2f201b]'
        : 'border-[#cfc4ba] bg-[rgba(255,252,248,0.7)] text-[#281f1a] hover:bg-[rgba(255,252,248,0.9)]',
    ].join(' ')}
  >
    {icon}
    <span>{label}</span>
  </button>
)

function formatFreshness(timestamp: number | null, now: number): string {
  if (!timestamp) return 'not synced'
  const deltaSeconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (deltaSeconds < 5) return 'just now'
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`
  const minutes = Math.floor(deltaSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default InterviewTopStrip
