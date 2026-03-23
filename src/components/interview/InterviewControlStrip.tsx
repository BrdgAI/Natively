import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Power } from 'lucide-react'
import type { InterviewPhase } from '../../types/interview'

interface InterviewControlStripProps {
  hint: string | null
  activePhase: InterviewPhase
  onPrevPhase: () => void
  onNextPhase: () => void
  onExitInterviewMode: () => void
}

const InterviewControlStrip: React.FC<InterviewControlStripProps> = ({
  hint,
  activePhase,
  onPrevPhase,
  onNextPhase,
  onExitInterviewMode,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="pointer-events-auto interview-card rounded-[22px] px-4 py-3 text-[#0f172a]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#475569]">Phase Control</span>
          <span className="mt-1 text-[13px] font-medium">{hint || `SYNC fallback is active. Current phase target: ${formatPhase(activePhase)}.`}</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onPrevPhase} className="interview-control-button">
            <ArrowLeft size={14} />
            <span>Prev</span>
          </button>
          <span className="rounded-full border border-black/10 bg-white/55 px-3 py-2 text-[12px] font-semibold text-[#0f172a]">
            {formatPhase(activePhase)}
          </span>
          <button type="button" onClick={onNextPhase} className="interview-control-button">
            <ArrowRight size={14} />
            <span>Next</span>
          </button>
          <button type="button" onClick={onExitInterviewMode} className="interview-control-button bg-[#111827] text-white border-[#111827] hover:bg-[#1f2937]">
            <Power size={14} />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function formatPhase(phase: InterviewPhase): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Clarify'
    case 'p3_approach':
      return 'Approach'
    case 'p4_code':
      return 'Code'
    case 'p5_test':
      return 'Test'
    case 'p6_close':
      return 'Close'
    default:
      return 'Clarify'
  }
}

export default InterviewControlStrip
