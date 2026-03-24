import React from 'react'
import type { InterviewFeedEntry, InterviewPhaseDocument } from '../../types/interview'

interface InterviewMainPanelProps {
  document: InterviewPhaseDocument
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  onScroll: () => void
  emptyMessage: string
}

const LINE_STATE_STYLES: Record<string, { label: string; className: string }> = {
  active: { label: '', className: 'text-[#efe5d6]' },
  open: { label: '[open]', className: 'text-[#f6e7b3]' },
  answered: { label: '[answered]', className: 'text-[#b8e2c0]' },
  replaced: { label: '[replaced]', className: 'text-[#d9b4aa] opacity-70 line-through' },
  update: { label: '[update]', className: 'text-[#d9d2ff]' },
  note: { label: '[note]', className: 'text-[#f0d7aa]' },
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
                className="px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#f2debe] interview-text-heading"
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

          const style = LINE_STATE_STYLES[entry.state || 'active']
          const currentLineNumber = lineNumber
          lineNumber += 1

          return (
            <FeedLine
              key={`${entry.id}-${index}`}
              entry={entry}
              lineNumber={currentLineNumber}
              label={style.label}
              className={style.className}
              alternate={currentLineNumber % 2 === 0}
            />
          )
        }) : (
          <div className="rounded-[7px] border border-dashed border-[rgba(255,228,200,0.14)] px-2.5 py-2 text-[12px] leading-5 text-[#d5c4ae] interview-text">
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
  label,
  className,
  alternate,
}: {
  entry: InterviewFeedEntry
  lineNumber: number
  label: string
  className: string
  alternate: boolean
}) => (
  <div
    className={[
      'grid grid-cols-[44px_minmax(0,1fr)] gap-2 rounded-[6px] px-2 py-1.5 text-[12px] leading-[1.42]',
      alternate ? 'bg-[rgba(255,255,255,0.045)]' : 'bg-[rgba(255,255,255,0.02)]',
      className,
    ].join(' ')}
  >
    <div className="flex items-start justify-end gap-1 pt-[1px]">
      <span className="select-none text-[10px] font-mono text-[#8f8376] leading-[1.4]">
        {lineNumber}
      </span>
      {label && (
        <span className="select-none text-[10px] font-bold leading-[1.4]">
          {label}
        </span>
      )}
    </div>
    <div className="font-semibold interview-text">
      {entry.text}
    </div>
  </div>
)

export default InterviewMainPanel
