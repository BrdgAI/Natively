import React from 'react'
import type { InterviewSavedContexts } from '../../types/interview'

interface InterviewContextFooterProps {
  savedContexts: InterviewSavedContexts
}

const InterviewContextFooter: React.FC<InterviewContextFooterProps> = ({ savedContexts }) => {
  return (
    <div className="grid gap-2 xl:grid-cols-2">
      <ContextCard title={savedContexts.screen.title} lines={savedContexts.screen.lines} />
      <ContextCard title={savedContexts.normal.title} lines={savedContexts.normal.lines} />
    </div>
  )
}

const ContextCard = ({ title, lines }: { title: string; lines: string[] }) => (
  <div className="interview-surface pointer-events-auto rounded-[8px] px-2 py-1.5">
    <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#f0dfc5] interview-text-heading">
      {title}
    </div>
    <div className="mt-1 divide-y divide-[rgba(255,228,200,0.08)]">
      {lines.length > 0 ? lines.map((line, index) => (
        <div
          key={`${title}-${index}-${line}`}
          className="px-1 py-1 text-[10.5px] font-semibold leading-[1.35] text-[#e3d4bf] interview-text"
        >
          {line}
        </div>
      )) : (
        <div className="rounded-[6px] border border-dashed border-[rgba(255,228,200,0.12)] px-2 py-1 text-[10.5px] leading-[1.35] text-[#cbb9a1] interview-text">
          Waiting for context.
        </div>
      )}
    </div>
  </div>
)

export default InterviewContextFooter
