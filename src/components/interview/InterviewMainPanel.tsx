import React from 'react'
import { Pin } from 'lucide-react'
import InterviewMainAnchor from './InterviewMainAnchor'
import InterviewQuickAnswersPanel from './InterviewQuickAnswersPanel'
import type { InterviewPhaseDocument, InterviewSessionSnapshot } from '../../types/interview'

interface InterviewMainPanelProps {
  snapshot: InterviewSessionSnapshot
  document: InterviewPhaseDocument
  scrollRef: React.MutableRefObject<HTMLDivElement | null>
  onScroll: () => void
}

const STATUS_PREFIXES: Record<string, { symbol: string; extraClass: string }> = {
  '[✓]': { symbol: '✓', extraClass: 'text-[#1a5e28]' },
  '[✗]': { symbol: '✗', extraClass: 'line-through opacity-50 text-[#6b3a2a]' },
  '[→]': { symbol: '→', extraClass: '' },
  '[↺]': { symbol: '↺', extraClass: 'text-[#7a4a08]' },
}

function parseLine(line: string): { prefix: string | null; text: string; extraClass: string } {
  for (const [key, val] of Object.entries(STATUS_PREFIXES)) {
    if (line.startsWith(key)) {
      return { prefix: val.symbol, text: line.slice(key.length).trimStart(), extraClass: val.extraClass }
    }
  }
  return { prefix: null, text: line, extraClass: '' }
}

const InterviewMainPanel: React.FC<InterviewMainPanelProps> = ({ snapshot, document, scrollRef, onScroll }) => {
  let lineNumber = 1

  const payload = snapshot.latestPayload
  const pinnedFacts = payload?.pinnedFacts.length ? payload.pinnedFacts : snapshot.pinnedFacts

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="interview-surface-primary pointer-events-auto min-h-0 overflow-y-auto rounded-[10px] px-2 py-2"
    >
      <div className="sticky top-0 z-10 pb-2">
        <InterviewMainAnchor anchor={document.anchor} />
        {document.quickAnswers.length > 0 && (
          <div className="mt-1.5 px-0.5">
            <InterviewQuickAnswersPanel items={document.quickAnswers} embedded />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {document.mainSections.length > 0 ? document.mainSections.map((section) => {
          const startLineNumber = lineNumber
          lineNumber += section.lines.length

          return (
            <section key={section.id} className="rounded-[8px] overflow-hidden border border-[rgba(71,58,48,0.08)]">
              <div className="interview-row-alt px-3 py-1.5 text-[10px] font-bold tracking-[0.05em] text-[#1a1208] uppercase interview-text-heading">
                {section.title}
              </div>
              <div>
                {section.lines.map((line, index) => {
                  const { prefix, text, extraClass } = parseLine(line)
                  const warningColor = section.tone === 'warning' ? 'text-[#7a3c08]' : 'text-[#1e1408]'
                  return (
                    <div
                      key={`${section.id}-${index}-${line}`}
                      className={[
                        'grid grid-cols-[40px_minmax(0,1fr)] gap-2 px-2.5 py-1.5 text-[13px] leading-[1.55]',
                        index % 2 === 0 ? 'interview-row' : 'interview-row-alt',
                        warningColor,
                        extraClass,
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-1 justify-end pt-[1px]">
                        <span className="text-[10px] font-mono text-[#8a7660] select-none leading-[1.55] interview-text">
                          {startLineNumber + index}
                        </span>
                        {prefix && (
                          <span className="text-[10px] font-bold select-none leading-[1.55]">{prefix}</span>
                        )}
                      </div>
                      <div className="font-semibold interview-text">{text}</div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        }) : (
          <div className="interview-row rounded-[8px] border border-dashed border-[rgba(71,58,48,0.14)] px-3 py-3 text-[13px] leading-6 text-[#5a4030] interview-text">
            {snapshot.statusMessage || 'Press Cmd+Enter when you want the current phase document to load.'}
          </div>
        )}

        {pinnedFacts.length > 0 && (
          <div className="rounded-[8px] border border-[rgba(120,80,20,0.18)] overflow-hidden">
            <div className="interview-row-alt px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.04em] text-[#5a3a10] uppercase interview-text-heading">
              <Pin size={10} />
              <span>Pinned</span>
            </div>
            <div className="space-y-[1px]">
              {pinnedFacts.map((fact, index) => (
                <div
                  key={`pinned-${index}-${fact}`}
                  className={[
                    'px-3 py-1.5 text-[12px] font-semibold leading-[1.45] text-[#2a1a08] interview-text',
                    index % 2 === 0 ? 'interview-row' : 'interview-row-alt',
                  ].join(' ')}
                >
                  {fact}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InterviewMainPanel
