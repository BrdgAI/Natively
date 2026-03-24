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
    <div className="flex items-center gap-1">
      {PHASES.map((phase, index) => {
        const isActive = activePhase === phase.id
        const isManual = manualOverridePhase === phase.id
        return (
          <React.Fragment key={phase.id}>
            {index > 0 && (
              <span className="text-[9px] text-[#a89070] select-none interview-text">·</span>
            )}
            <div
              className={[
                'inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold interview-text',
                isActive
                  ? 'border-[rgba(120,80,20,0.30)] bg-[rgba(200,130,25,0.18)] text-[#5a3208]'
                  : 'interview-item-pill border-[rgba(71,58,48,0.12)] text-[#6a5030]',
              ].join(' ')}
            >
              <span>{phase.label}</span>
              {isManual && <span className="text-[9px] text-[#8a7050]">M</span>}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default InterviewPhaseFlow
