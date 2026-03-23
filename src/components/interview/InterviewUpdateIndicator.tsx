import React from 'react'
import type { InterviewUpdateSummary } from '../../types/interview'

interface InterviewUpdateIndicatorProps {
  summary: InterviewUpdateSummary
}

const InterviewUpdateIndicator: React.FC<InterviewUpdateIndicatorProps> = ({ summary }) => {
  const toneClass = summary.status === 'unchanged'
    ? 'border-[#c9bfb5] bg-[rgba(250,248,244,0.7)] text-[#5b5047]'
    : summary.status === 'partial'
      ? 'border-[#d1b897] bg-[rgba(250,243,229,0.82)] text-[#6f4d1f]'
      : 'border-[#b49f8d] bg-[rgba(244,238,231,0.84)] text-[#3d342d]'

  return (
    <div className={`inline-flex max-w-full items-center gap-2 rounded-[8px] border px-3 py-1.5 text-[11px] font-semibold ${toneClass}`}>
      <span>{summary.message}</span>
      {summary.updatedSections.length > 0 && (
        <span className="truncate text-[10px] font-medium text-[#7b6d61]">
          {summary.updatedSections.join(', ')}
        </span>
      )}
    </div>
  )
}

export default InterviewUpdateIndicator
