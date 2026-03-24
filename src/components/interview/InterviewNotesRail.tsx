import React from 'react'
import { BrainCircuit, GitBranch } from 'lucide-react'
import type { InterviewSessionSnapshot, RenderableInterviewPhase } from '../../types/interview'

interface InterviewNotesRailProps {
  snapshot: InterviewSessionSnapshot
  phase: RenderableInterviewPhase
}

const InterviewNotesRail: React.FC<InterviewNotesRailProps> = ({ snapshot, phase }) => {
  const followUpItems = phase === 'p6_follow_up' ? buildFollowUpItems(snapshot) : []
  const thoughtNotes = snapshot.thoughtNotes.slice(0, 3)
  const sections = [
    ...(followUpItems.length > 0
      ? [{ title: 'Follow-up', icon: <GitBranch size={11} />, items: followUpItems, tone: 'follow-up' as const }]
      : []),
    ...(thoughtNotes.length > 0
      ? [{ title: 'Notes', icon: <BrainCircuit size={11} />, items: thoughtNotes, tone: 'notes' as const }]
      : []),
  ]

  if (sections.length === 0) {
    return null
  }

  return (
    <div className="interview-surface pointer-events-auto rounded-[8px] px-2 py-2">
      <div className="space-y-2">
        {sections.map((section) => (
          <section key={section.title} className="space-y-1">
            <div className="flex items-center gap-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#2a1e10] interview-text-heading">
              {section.icon}
              <span>{section.title}</span>
            </div>
            <div className="space-y-1">
              {section.items.map((item, index) => (
                <div
                  key={`${section.title}-${index}-${item}`}
                  className={[
                    'rounded-[6px] border px-2 py-1 text-[11px] font-semibold leading-5 interview-text',
                    section.tone === 'follow-up'
                      ? 'border-[rgba(140,90,20,0.18)] bg-[rgba(200,130,30,0.12)] text-[#5a3008]'
                      : 'interview-item-pill border-[rgba(71,58,48,0.12)] text-[#2a1e10]',
                  ].join(' ')}
                >
                  {item}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function buildFollowUpItems(snapshot: InterviewSessionSnapshot): string[] {
  if (!snapshot.activeFollowUp) {
    return []
  }

  return [
    snapshot.activeFollowUp.request ? `Request: ${snapshot.activeFollowUp.request}` : '',
    snapshot.activeFollowUp.impactedArea ? `Impact: ${snapshot.activeFollowUp.impactedArea}` : '',
    snapshot.activeFollowUp.diffRequired ? 'Code diff required' : 'Explain the change without code',
  ].filter(Boolean)
}

export default InterviewNotesRail
