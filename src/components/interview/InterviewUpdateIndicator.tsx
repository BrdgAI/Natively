import React from 'react'
import type { InterviewRenderStatus } from '../../types/interview'

interface InterviewUpdateIndicatorProps {
  summary: InterviewRenderStatus
  compact?: boolean
}

const InterviewUpdateIndicator: React.FC<InterviewUpdateIndicatorProps> = ({ summary, compact }) => {
  const isUpdated = summary.status === 'updated'
  const isUnchanged = summary.status === 'unchanged'

  if (compact) {
    const dotColor = isUpdated ? 'text-[#8de0a4]' : isUnchanged ? 'text-[#c5b9aa]' : 'text-[#f2d08a]'

    return (
      <div className={`inline-flex items-center gap-1.5 rounded-[6px] border border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[14px] font-semibold ${dotColor}`}>
        <span>●</span>
        <span className="text-[#f0dfc5] interview-text">{summary.message}</span>
      </div>
    )
  }

  const toneClass = isUnchanged
    ? 'border-[rgba(71,58,48,0.18)] text-[#4a3a28]'
    : summary.status === 'partial'
      ? 'border-[rgba(140,90,20,0.25)] text-[#6a4010]'
      : 'border-[rgba(30,100,50,0.25)] text-[#1a5a28]'

  return (
    <div className={`interview-item-pill inline-flex max-w-full items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[14px] font-semibold ${toneClass}`}>
      <span className="interview-text">{summary.message}</span>
      {summary.updatedSections.length > 0 && (
        <span className="truncate text-[13px] font-semibold text-[#6a5830] interview-text">
          {summary.updatedSections.join(', ')}
        </span>
      )}
    </div>
  )
}

export default InterviewUpdateIndicator
