import React from 'react'
import type { InterviewAnchorBlock } from '../../types/interview'

interface InterviewMainAnchorProps {
  anchor: InterviewAnchorBlock
}

const InterviewMainAnchor: React.FC<InterviewMainAnchorProps> = ({ anchor }) => {
  return (
    <div className="interview-surface rounded-[10px] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12px] font-bold tracking-[0.01em] text-[#211c18]">{anchor.title}</div>
        {anchor.note && (
          <div className="rounded-[7px] border border-[#cdbfb4] bg-[rgba(255,252,248,0.64)] px-2 py-1 text-[11px] font-medium text-[#594a40]">
            {anchor.note}
          </div>
        )}
      </div>

      {(anchor.items.length > 0 || anchor.writeNow.length > 0) && (
        <div className="mt-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
          <div className="space-y-1.5">
            {anchor.items.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-[8px] border border-[#d7cdc4] bg-[rgba(255,253,250,0.68)] px-2.5 py-1.5 text-[12px] font-medium leading-5 text-[#2c241f]">
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {anchor.writeNow.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-[8px] border border-[#d6c4ae] bg-[rgba(250,244,235,0.76)] px-2.5 py-1.5 text-[12px] font-semibold leading-5 text-[#5a4020]">
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
