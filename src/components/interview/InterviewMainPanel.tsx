import React from 'react'
import InterviewMainAnchor from './InterviewMainAnchor'
import type { InterviewPhaseDocument, InterviewSessionSnapshot } from '../../types/interview'

interface InterviewMainPanelProps {
  snapshot: InterviewSessionSnapshot
  document: InterviewPhaseDocument
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  onScroll: () => void
}

const InterviewMainPanel: React.FC<InterviewMainPanelProps> = ({ snapshot, document, scrollRef, onScroll }) => {
  let lineNumber = 1

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="interview-surface pointer-events-auto min-h-0 overflow-y-auto rounded-[10px] px-3 py-3"
    >
      <div className="sticky top-0 z-10 bg-transparent pb-2">
        <InterviewMainAnchor anchor={document.anchor} />
      </div>

      <div className="space-y-3">
        {document.mainSections.length > 0 ? document.mainSections.map((section) => {
          const startLineNumber = lineNumber
          lineNumber += section.lines.length

          return (
            <section key={section.id} className="rounded-[10px] border border-[#d7cdc4] bg-[rgba(255,253,250,0.62)]">
              <div className="border-b border-[#e2d8cf] px-3 py-2 text-[12px] font-bold tracking-[0.01em] text-[#221b17]">
                {section.title}
              </div>
              <div>
                {section.lines.map((line, index) => (
                  <div
                    key={`${section.id}-${index}-${line}`}
                    className={[
                      'grid grid-cols-[48px_minmax(0,1fr)] gap-3 px-3 py-2 text-[13px] leading-6',
                      index % 2 === 0 ? 'bg-[rgba(255,252,248,0.62)]' : 'bg-[rgba(247,242,236,0.72)]',
                      section.tone === 'warning' ? 'text-[#6a411b]' : 'text-[#211a15]',
                    ].join(' ')}
                  >
                    <div className="text-right text-[11px] font-semibold text-[#7a6b60]">{startLineNumber + index}</div>
                    <div className="font-medium">{line}</div>
                  </div>
                ))}
              </div>
            </section>
          )
        }) : (
          <div className="rounded-[10px] border border-dashed border-[#d0c6bd] bg-[rgba(255,252,248,0.55)] px-3 py-3 text-[13px] leading-6 text-[#6f6258]">
            {snapshot.statusMessage || 'Press Cmd+Enter when you want the current phase document to load.'}
          </div>
        )}
      </div>
    </div>
  )
}

export default InterviewMainPanel
