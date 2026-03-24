import React from 'react'
import { ArrowRight, Power, ScanLine } from 'lucide-react'
import InterviewPhaseFlow from './InterviewPhaseFlow'
import InterviewUpdateIndicator from './InterviewUpdateIndicator'
import type { InterviewPhase, InterviewRenderStatus } from '../../types/interview'

interface InterviewTopStripProps {
  phase: InterviewPhase
  manualOverridePhase: InterviewPhase | null
  isGenerating: boolean
  mousePassthrough: boolean
  status: InterviewRenderStatus
  onNext: () => void
  onSync: () => void
  onExitInterviewMode: () => void
  onEndMeeting: () => void
}

const InterviewTopStrip: React.FC<InterviewTopStripProps> = ({
  phase,
  manualOverridePhase,
  isGenerating,
  mousePassthrough,
  status,
  onNext,
  onSync,
  onExitInterviewMode,
  onEndMeeting,
}) => {
  return (
    <div className="interview-surface-strip pointer-events-auto rounded-[8px] px-3 py-1.5">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <InterviewPhaseFlow activePhase={manualOverridePhase || phase} manualOverridePhase={manualOverridePhase} />

        <div className="flex items-center justify-center gap-2">
          {isGenerating && (
            <span className="text-[14px] font-bold text-[#f0d6a3] animate-pulse interview-text">Generating…</span>
          )}
          <InterviewUpdateIndicator summary={status} compact />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[14px] font-semibold">
            <span className="rounded-[5px] border border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[#f0dfc5] interview-text">⌘↵</span>
            <span className="text-[#e7d7c0] interview-text">Next</span>
            <span className="ml-1 rounded-[5px] border border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[#f0dfc5] interview-text">⌘⇧↵</span>
            <span className="text-[#e7d7c0] interview-text">Sync</span>
          </div>

          {!mousePassthrough && (
            <div className="flex items-center gap-1">
              <StripButton label="Next" icon={<ArrowRight size={11} />} onClick={onNext} />
              <StripButton label="Sync" icon={<ScanLine size={11} />} onClick={onSync} />
              <StripButton label="Leave" icon={<Power size={11} />} onClick={onExitInterviewMode} />
              <StripButton label="End" icon={<Power size={11} />} onClick={onEndMeeting} danger />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
      'inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1.5 text-[14px] font-semibold transition-colors',
      danger
        ? 'border-[rgba(180,100,90,0.55)] bg-[rgba(140,52,40,0.72)] text-[#fff3eb] hover:bg-[rgba(155,58,44,0.78)]'
        : 'border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] text-[#f0dfc5] hover:bg-[rgba(255,255,255,0.10)]',
    ].join(' ')}
  >
    {icon}
    <span>{label}</span>
  </button>
)

export default InterviewTopStrip
