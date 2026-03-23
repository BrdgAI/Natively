import React from 'react'
import type { InterviewPhase } from '../../types/interview'

interface InterviewPhaseFlowProps {
  activePhase: InterviewPhase
  manualOverridePhase: InterviewPhase | null
}

const PHASES: Array<{ id: Exclude<InterviewPhase, 'p1_intro'>; label: string }> = [
  { id: 'p2_clarify', label: 'Clarify' },
  { id: 'p3_approach', label: 'Approach' },
  { id: 'p4_code', label: 'Code' },
  { id: 'p5_test', label: 'Test' },
  { id: 'p6_follow_up', label: 'Follow-up' },
]

const InterviewPhaseFlow: React.FC<InterviewPhaseFlowProps> = ({ activePhase, manualOverridePhase }) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PHASES.map((phase) => {
        const isActive = activePhase === phase.id
        const isManual = manualOverridePhase === phase.id
        return (
          <div
            key={phase.id}
            className={[
              'inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-1 text-[11px] font-semibold',
              isActive
                ? 'border-[#3c332d] bg-[#201b18] text-[#f6f0ea]'
                : 'border-[#b9aea4] bg-[rgba(252,249,244,0.58)] text-[#43362d]',
            ].join(' ')}
          >
            <span>{phase.label}</span>
            {isManual && <span className="text-[10px] text-[#9f8572]">manual</span>}
          </div>
        )
      })}
    </div>
  )
}

export default InterviewPhaseFlow
