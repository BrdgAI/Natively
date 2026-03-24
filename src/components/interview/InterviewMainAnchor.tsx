import React from 'react'
import type { InterviewAnchorBlock } from '../../types/interview'

interface InterviewMainAnchorProps {
  anchor: InterviewAnchorBlock
}

const InterviewMainAnchor: React.FC<InterviewMainAnchorProps> = ({ anchor }) => {
  return (
    <div className="interview-surface-primary rounded-[8px] px-2.5 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-bold tracking-[0.05em] text-[#1a1208] uppercase interview-text-heading">
          {anchor.title}
        </div>
        {anchor.note && (
          <div className="interview-item-pill rounded-[5px] border border-[rgba(100,70,30,0.18)] px-2 py-0.5 text-[10px] font-semibold text-[#5a3a12] interview-text">
            {anchor.note}
          </div>
        )}
      </div>

      {(anchor.items.length > 0 || anchor.writeNow.length > 0) && (
        <div className="mt-1.5 grid gap-1.5 xl:grid-cols-[minmax(0,1fr)_minmax(150px,210px)]">
          <div className="space-y-1">
            {anchor.items.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="interview-item-pill rounded-[6px] border border-[rgba(71,58,48,0.12)] px-2.5 py-1 text-[12px] font-semibold leading-5 text-[#1e1408] interview-text"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {anchor.writeNow.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-[6px] border border-[rgba(150,90,20,0.22)] bg-[rgba(200,130,30,0.14)] px-2.5 py-1 text-[12px] font-bold leading-5 text-[#5a3008] interview-text"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InterviewMainAnchor
