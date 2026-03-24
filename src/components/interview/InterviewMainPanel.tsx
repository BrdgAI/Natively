import React from 'react'
import type { InterviewFeedEntry, InterviewPhaseDocument } from '../../types/interview'

interface InterviewMainPanelProps {
  document: InterviewPhaseDocument
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  onScroll: () => void
  emptyMessage: string
}

const InterviewMainPanel: React.FC<InterviewMainPanelProps> = ({ document, scrollRef, onScroll, emptyMessage }) => {
  let lineNumber = 1

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="interview-surface-primary pointer-events-auto min-h-0 overflow-y-auto rounded-[10px] px-1.5 py-1.5"
    >
      <div className="space-y-0.5">
        {document.mainFeed.length > 0 ? document.mainFeed.map((entry, index) => {
          if (entry.type === 'header') {
            return (
              <div
                key={entry.id}
                className="px-2 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#f2debe] interview-text-heading"
              >
                {entry.text}
              </div>
            )
          }

          if (entry.type === 'divider') {
            return (
              <div
                key={entry.id}
                className="h-px w-full bg-[rgba(255,228,200,0.10)]"
              />
            )
          }

          const currentLineNumber = lineNumber
          lineNumber += 1

          return (
            <FeedLine
              key={`${entry.id}-${index}`}
              entry={entry}
              lineNumber={currentLineNumber}
              alternate={currentLineNumber % 2 === 0}
            />
          )
        }) : (
          <div className="rounded-[7px] border border-dashed border-[rgba(255,228,200,0.14)] px-2.5 py-2 text-[15px] leading-6 text-[#d5c4ae] interview-text">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}

const FeedLine = ({
  entry,
  lineNumber,
  alternate,
}: {
  entry: InterviewFeedEntry
  lineNumber: number
  alternate: boolean
}) => (
  <div
    className={[
      'grid grid-cols-[34px_minmax(0,1fr)] gap-2 rounded-[6px] px-2 py-1.5 text-[15px] leading-[1.6] text-[#efe5d6]',
      alternate ? 'bg-[rgba(255,255,255,0.045)]' : 'bg-[rgba(255,255,255,0.02)]',
    ].join(' ')}
  >
    <div className="flex items-start justify-end pt-[1px]">
      <span className="select-none text-[13px] font-mono font-semibold text-[#8f8376] leading-[1.5]">
        {lineNumber}
      </span>
    </div>
    <div className="font-semibold interview-text">
      {entry.text}
    </div>
  </div>
)

export default InterviewMainPanel
