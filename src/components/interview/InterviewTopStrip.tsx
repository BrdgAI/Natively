import React from 'react'
import { ArrowRight, Power, ScanLine } from 'lucide-react'
import InterviewPhaseFlow from './InterviewPhaseFlow'
import InterviewUpdateIndicator from './InterviewUpdateIndicator'
import type { InterviewPhase, InterviewRoutingMode, InterviewUpdateSummary } from '../../types/interview'

interface InterviewTopStripProps {
  phase: InterviewPhase
  manualOverridePhase: InterviewPhase | null
  routingMode: InterviewRoutingMode
  isGenerating: boolean
  mousePassthrough: boolean
  updateSummary: InterviewUpdateSummary
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
  updateSummary,
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
            <span className="text-[10px] font-bold text-[#7a4e10] animate-pulse interview-text">Generating…</span>
          )}
          <InterviewUpdateIndicator summary={updateSummary} compact />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-semibold">
            <span className="interview-item-pill rounded-[5px] border border-[rgba(71,58,48,0.16)] px-1.5 py-0.5 text-[#2a1e10] interview-text">⌘↵</span>
            <span className="text-[#3a2a14] interview-text">Next</span>
            <span className="ml-1 interview-item-pill rounded-[5px] border border-[rgba(71,58,48,0.16)] px-1.5 py-0.5 text-[#2a1e10] interview-text">⌘⇧↵</span>
            <span className="text-[#3a2a14] interview-text">Sync</span>
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
      'inline-flex items-center gap-1 rounded-[6px] border px-2 py-1 text-[10px] font-semibold transition-colors',
      danger
        ? 'border-[#7a3a2a] bg-[rgba(120,40,30,0.75)] text-[#faf0e8] hover:bg-[rgba(140,50,35,0.80)]'
        : 'interview-item-pill border-[rgba(71,58,48,0.18)] text-[#2a1e10] hover:bg-[rgba(255,252,242,0.90)]',
    ].join(' ')}
  >
    {icon}
    <span>{label}</span>
  </button>
)

export default InterviewTopStrip
