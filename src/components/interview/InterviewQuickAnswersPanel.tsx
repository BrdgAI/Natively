import React from 'react'
import type { InterviewQuickAnswerItem } from '../../types/interview'

interface InterviewQuickAnswersPanelProps {
  items: InterviewQuickAnswerItem[]
  embedded?: boolean
}

const InterviewQuickAnswersPanel: React.FC<InterviewQuickAnswersPanelProps> = ({ items, embedded }) => {
  if (items.length === 0) {
    return null
  }

  if (embedded) {
    return (
      <div className="flex flex-wrap gap-1.5 py-1">
        {items.slice(0, 6).map((item) => (
          <div
            key={item.id}
            className="rounded-[6px] border border-[rgba(140,90,20,0.22)] bg-[rgba(200,140,30,0.14)] px-2 py-0.5 text-[11px] font-bold text-[#5a3408] interview-text"
          >
            {item.line}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="interview-surface pointer-events-auto rounded-[10px] px-3 py-3">
      <div className="text-[11px] font-bold tracking-[0.02em] text-[#1a1208] uppercase interview-text-heading">Quick Answers</div>
      <div className="mt-2 space-y-1">
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="interview-item-pill rounded-[7px] border border-[rgba(71,58,48,0.12)] px-2.5 py-1.5 text-[12px] font-semibold leading-5 text-[#1e1408] interview-text">
            {item.line}
          </div>
        ))}
      </div>
    </div>
  )
}

export default InterviewQuickAnswersPanel
