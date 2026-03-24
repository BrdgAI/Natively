import React from 'react'
import type { InterviewUpdateSummary } from '../../types/interview'

interface InterviewUpdateIndicatorProps {
  summary: InterviewUpdateSummary
  compact?: boolean
}

const InterviewUpdateIndicator: React.FC<InterviewUpdateIndicatorProps> = ({ summary, compact }) => {
  const isUpdated = summary.status === 'updated'
  const isUnchanged = summary.status === 'unchanged'

  if (compact) {
    const dotColor = isUpdated ? 'text-[#1a6b28]' : isUnchanged ? 'text-[#8a7860]' : 'text-[#8a5010]'

    return (
      <div className={`interview-item-pill inline-flex items-center gap-1.5 rounded-[6px] border border-[rgba(71,58,48,0.12)] px-2 py-0.5 text-[10px] font-semibold ${dotColor}`}>
        <span>●</span>
        <span className="text-[#3a2a10] interview-text">{summary.message}</span>
      </div>
    )
  }

  const toneClass = isUnchanged
    ? 'border-[rgba(71,58,48,0.18)] text-[#4a3a28]'
    : summary.status === 'partial'
      ? 'border-[rgba(140,90,20,0.25)] text-[#6a4010]'
      : 'border-[rgba(30,100,50,0.25)] text-[#1a5a28]'

  return (
    <div className={`interview-item-pill inline-flex max-w-full items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold ${toneClass}`}>
      <span className="interview-text">{summary.message}</span>
      {summary.updatedSections.length > 0 && (
        <span className="truncate text-[10px] font-medium text-[#6a5830] interview-text">
          {summary.updatedSections.join(', ')}
        </span>
      )}
    </div>
  )
}

export default InterviewUpdateIndicator
