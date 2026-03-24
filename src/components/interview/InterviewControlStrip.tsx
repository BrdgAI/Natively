import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Power } from 'lucide-react'
import type { InterviewPhase } from '../../types/interview'

interface InterviewControlStripProps {
  hint: string | null
  activePhase: InterviewPhase
  mousePassthrough: boolean
  onPrevPhase: () => void
  onNextPhase: () => void
  onExitInterviewMode: () => void
}

const InterviewControlStrip: React.FC<InterviewControlStripProps> = ({
  hint,
  activePhase,
  mousePassthrough,
  onPrevPhase,
  onNextPhase,
  onExitInterviewMode,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="interview-surface pointer-events-auto rounded-[10px] px-3 py-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[16px] font-semibold text-[#2a221c]">
          {hint || `Current target: ${formatPhase(activePhase)}. Use Prev or Next to switch phases.`}
        </div>

        {mousePassthrough ? (
          <div className="text-[14px] font-semibold text-[#665950]">
            Optional phase shortcuts can be enabled in settings.
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ControlButton label="Prev" icon={<ArrowLeft size={12} />} onClick={onPrevPhase} />
            <div className="rounded-[8px] border border-[#cfc4ba] bg-[rgba(255,252,248,0.64)] px-2.5 py-1 text-[14px] font-semibold text-[#201915]">
              {formatPhase(activePhase)}
            </div>
            <ControlButton label="Next" icon={<ArrowRight size={12} />} onClick={onNextPhase} />
            <ControlButton label="Leave" icon={<Power size={12} />} onClick={onExitInterviewMode} danger />
          </div>
        )}
      </div>
    </motion.div>
  )
}

const ControlButton = ({
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
      'inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-1.5 text-[14px] font-semibold transition-colors',
      danger
        ? 'border-[#54332d] bg-[#241915] text-[#faf3ec] hover:bg-[#2f201b]'
        : 'border-[#cfc4ba] bg-[rgba(255,252,248,0.7)] text-[#281f1a] hover:bg-[rgba(255,252,248,0.9)]',
    ].join(' ')}
  >
    {icon}
    <span>{label}</span>
  </button>
)

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
    case 'p6_follow_up':
      return 'Follow-up'
    default:
      return 'Clarify'
  }
}

export default InterviewControlStrip
