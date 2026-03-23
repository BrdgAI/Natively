import React from 'react'
import { BrainCircuit, Pin } from 'lucide-react'
import type { InterviewSessionSnapshot } from '../../types/interview'

interface InterviewNotesRailProps {
  snapshot: InterviewSessionSnapshot
}

const InterviewNotesRail: React.FC<InterviewNotesRailProps> = ({ snapshot }) => {
  const payload = snapshot.latestPayload
  const thoughtNotes = payload?.thoughtNotes.length ? payload.thoughtNotes : snapshot.thoughtNotes
  const pinnedFacts = payload?.pinnedFacts.length ? payload.pinnedFacts : snapshot.pinnedFacts

  return (
    <div className="grid min-h-[180px] gap-3 xl:grid-cols-1">
      <RailSection
        title="Thought Notes"
        icon={<BrainCircuit size={14} />}
        items={thoughtNotes}
        empty="Short internal prompts for what to think next will stay here."
      />
      <RailSection
        title="Pinned Facts"
        icon={<Pin size={14} />}
        items={pinnedFacts}
        empty="Confirmed facts and constraints will stay pinned here."
      />
    </div>
  )
}

const RailSection = ({
  title,
  icon,
  items,
  empty,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
  empty: string
}) => (
  <div className="interview-surface pointer-events-auto rounded-[10px] px-3 py-3">
    <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.01em] text-[#211c18]">
      {icon}
      <span>{title}</span>
    </div>
    <div className="mt-2 space-y-1.5">
      {items.length > 0 ? items.slice(0, 6).map((item, index) => (
        <div key={`${title}-${index}-${item}`} className="rounded-[8px] border border-[#d7cdc4] bg-[rgba(255,253,250,0.68)] px-2.5 py-2 text-[12px] leading-5 text-[#2b241f]">
          {item}
        </div>
      )) : (
        <div className="rounded-[8px] border border-dashed border-[#d0c6bd] bg-[rgba(255,252,248,0.55)] px-2.5 py-2 text-[12px] leading-5 text-[#6c5f55]">
          {empty}
        </div>
      )}
    </div>
  </div>
)

export default InterviewNotesRail
