import React from 'react'
import { BrainCircuit, HelpCircle, Pin, Waypoints } from 'lucide-react'
import type { InterviewSessionSnapshot } from '../../types/interview'

interface InterviewNotesRailProps {
  snapshot: InterviewSessionSnapshot
  mousePassthrough: boolean
}

const InterviewNotesRail: React.FC<InterviewNotesRailProps> = ({ snapshot, mousePassthrough }) => {
  const payload = snapshot.latestPayload
  const thoughtNotes = payload?.thoughtNotes.length ? payload.thoughtNotes : snapshot.thoughtNotes
  const pinnedFacts = payload?.pinnedFacts.length ? payload.pinnedFacts : snapshot.pinnedFacts
  const quickQuestions = payload?.quickQuestions.length ? payload.quickQuestions : snapshot.quickQuestions

  return (
    <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-4 overflow-hidden rounded-[28px] interview-card px-5 py-5 text-[#111827]">
      <RailSection
        title="Thought Notes"
        icon={<BrainCircuit size={15} />}
        items={thoughtNotes}
        empty="Silent prompts for what to think next will stay here."
      />
      <RailSection
        title="Pinned Facts"
        icon={<Pin size={15} />}
        items={pinnedFacts}
        empty="Confirmed facts and constraints will pin here."
      />
      <RailSection
        title="Quick Interrupts"
        icon={<HelpCircle size={15} />}
        items={quickQuestions}
        empty="Fast interviewer questions and rescue lines will queue here."
      />

      <div className="rounded-[22px] border border-black/8 bg-white/52 p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
          <Waypoints size={14} />
          <span>Controls</span>
        </div>
        <div className="mt-3 space-y-2 text-[13px] leading-6 text-[#334155]">
          <div className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2">`Cmd+Enter` moves to the next script chunk or reveals buffered backup lines.</div>
          <div className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2">`Cmd+Shift+Enter` syncs the screen. Press it again right after sync to cycle phases.</div>
          <div className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2">`Cmd+Shift+Up/Down` scrolls the main reading lane.</div>
          <div className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2">
            {mousePassthrough ? 'Click-through is on, so use shortcuts unless you toggle mouse passthrough off.' : 'Click-through is off, so you can use the on-screen interview controls.'}
          </div>
        </div>
      </div>
    </div>
  )
}

const RailSection = ({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: string[]; empty: string }) => (
  <div className="min-h-0 rounded-[22px] border border-black/8 bg-white/52 p-4">
    <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
      {icon}
      <span>{title}</span>
    </div>
    <div className="mt-3 space-y-2">
      {items.length > 0 ? items.slice(0, 6).map((item, index) => (
        <div key={`${title}-${index}-${item}`} className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2 text-[13px] leading-6 text-[#1f2937]">
          {item}
        </div>
      )) : (
        <div className="rounded-[16px] border border-dashed border-black/10 bg-white/35 px-3 py-3 text-[13px] leading-6 text-[#64748b]">
          {empty}
        </div>
      )}
    </div>
  </div>
)

export default InterviewNotesRail
