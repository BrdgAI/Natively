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
              <span className="text-[13px] text-[#a89070] select-none interview-text">·</span>
            )}
            <div
              className={[
                'inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[14px] font-semibold interview-text',
                isActive
                  ? 'border-[rgba(229,183,111,0.60)] bg-[rgba(206,143,59,0.22)] text-[#fff0d2]'
                  : 'border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.04)] text-[#d8c4aa]',
              ].join(' ')}
            >
              <span>{phase.label}</span>
              {isManual && <span className="text-[13px] text-[#f2ddb6]">M</span>}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default InterviewPhaseFlow
