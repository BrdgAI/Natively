import React from 'react'
import type { InterviewQuickAnswerItem } from '../../types/interview'

interface InterviewQuickAnswersPanelProps {
  items: InterviewQuickAnswerItem[]
}

const InterviewQuickAnswersPanel: React.FC<InterviewQuickAnswersPanelProps> = ({ items }) => {
  return (
    <div className="interview-surface pointer-events-auto min-h-[120px] rounded-[10px] px-3 py-3">
      <div className="text-[12px] font-bold tracking-[0.01em] text-[#211c18]">Quick Answers</div>
      <div className="mt-2 space-y-1.5">
        {items.length > 0 ? items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-[8px] border border-[#d7cdc4] bg-[rgba(255,253,250,0.68)] px-2.5 py-2 text-[12px] font-medium leading-5 text-[#2b241f]">
            {item.line}
          </div>
        )) : (
          <div className="rounded-[8px] border border-dashed border-[#d0c6bd] bg-[rgba(255,252,248,0.55)] px-2.5 py-2 text-[12px] leading-5 text-[#67594e]">
            Interruption-ready answers will appear here when the interviewer asks something before you finish the main lane.
          </div>
        )}
      </div>
    </div>
  )
}

export default InterviewQuickAnswersPanel
