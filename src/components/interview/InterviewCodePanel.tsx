import React from 'react'
import { FileCode2 } from 'lucide-react'
import type { InterviewCodePane } from '../../types/interview'

interface InterviewCodePanelProps {
  codePane: InterviewCodePane | null
  emptyMessage: string
}

const InterviewCodePanel: React.FC<InterviewCodePanelProps> = ({ codePane, emptyMessage }) => {
  return (
    <div className="interview-surface-primary pointer-events-auto flex min-h-0 flex-col rounded-[10px] px-1.5 py-1.5">
      <div className="mb-1 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#f0e4d2] interview-text-heading">
          <FileCode2 size={12} />
          <span>{codePane?.title || 'Code'}</span>
        </div>
        {codePane && (
          <div className="flex items-center gap-1.5">
            <span className="rounded-[4px] border border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[9px] font-semibold text-[#e6d4b8]">
              {codePane.language.toUpperCase()}
            </span>
            <span className="rounded-[4px] border border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[9px] font-semibold text-[#e6d4b8]">
              {codePane.kind.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {codePane ? (
        <>
          <div className="interview-code-surface min-h-0 flex-1 overflow-auto px-0 py-0.5">
            {codePane.content.split('\n').map((line, index) => (
              <div
                key={`${index}-${line}`}
                className={`grid grid-cols-[34px_minmax(0,1fr)] gap-1.5 px-1 py-[1px] ${lineClassName(codePane.kind, line)}`}
              >
                <span className="select-none text-right text-[10px] font-mono text-[#8e8276] leading-[1.45]">
                  {index + 1}
                </span>
                <span
                  className="whitespace-pre text-[12px] font-mono leading-[1.45] text-[#eadfcd]"
                  style={{ fontFamily: 'var(--font-interview-code)' }}
                >
                  {line || ' '}
                </span>
              </div>
            ))}
          </div>

          {codePane.notes.length > 0 && (
            <div className="mt-1 space-y-0.5 rounded-[7px] border border-[rgba(255,220,180,0.10)] bg-[rgba(255,255,255,0.04)] px-2 py-1.5">
              {codePane.notes.map((line, index) => (
                <div key={`${line}-${index}`} className="text-[10.5px] font-semibold leading-[1.35] text-[#ddcdb5] interview-text">
                  {line}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-[7px] border border-dashed border-[rgba(255,228,200,0.14)] px-3 py-5 text-center text-[10.5px] leading-[1.35] text-[#d5c4ae] interview-text">
          {emptyMessage}
        </div>
      )}
    </div>
  )
}

function lineClassName(kind: InterviewCodePane['kind'], line: string): string {
  if (kind !== 'diff') {
    return ''
  }
  if (line.startsWith('+')) return 'interview-code-line-add'
  if (line.startsWith('-')) return 'interview-code-line-remove'
  return 'interview-code-line-neutral'
}

export default InterviewCodePanel
