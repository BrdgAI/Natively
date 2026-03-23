import React from 'react'
import { Bug, FileCode2 } from 'lucide-react'
import type { InterviewPhaseDocument, InterviewSessionSnapshot } from '../../types/interview'

interface InterviewCodePanelProps {
  snapshot: InterviewSessionSnapshot
  document: InterviewPhaseDocument
}

const InterviewCodePanel: React.FC<InterviewCodePanelProps> = ({ snapshot, document }) => {
  const codePanel = document.codePanel || mapSnapshotCode(snapshot)

  return (
    <div className="interview-surface pointer-events-auto flex min-h-[280px] flex-col rounded-[10px] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.01em] text-[#211c18]">
          <FileCode2 size={14} />
          <span>Code</span>
        </div>
        {codePanel && (
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#5f5146]">
            <span className="rounded-[7px] border border-[#d0c6bd] bg-[rgba(255,252,248,0.6)] px-2 py-1">{codePanel.language.toUpperCase()}</span>
            <span className="rounded-[7px] border border-[#d0c6bd] bg-[rgba(255,252,248,0.6)] px-2 py-1">{codePanel.mode.toUpperCase()}</span>
          </div>
        )}
      </div>

      {codePanel ? (
        <>
          <div className="mt-2 min-h-0 flex-1 overflow-auto rounded-[9px] border border-[#d7cdc4] bg-[rgba(255,253,250,0.72)] px-2 py-2 font-mono text-[11px] leading-[1.45] text-[#1f1a17]">
            {codePanel.content.split('\n').map((line, index) => (
              <div key={`${index}-${line}`} className={`grid grid-cols-[32px_minmax(0,1fr)] gap-2 px-1 py-[1px] ${lineClassName(codePanel.mode, line)}`}>
                <span className="select-none text-right text-[10px] text-[#8b7e72]">{index + 1}</span>
                <span className="whitespace-pre">{line || ' '}</span>
              </div>
            ))}
          </div>

          {codePanel.suspectedMistakes.length > 0 && (
            <div className="mt-2 rounded-[9px] border border-[#d7c09e] bg-[rgba(250,241,229,0.8)] px-2.5 py-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#69441f]">
                <Bug size={12} />
                <span>Likely Mistakes</span>
              </div>
              <div className="mt-1.5 space-y-1.5">
                {codePanel.suspectedMistakes.map((line, index) => (
                  <div key={`${line}-${index}`} className="text-[12px] leading-5 text-[#613d1d]">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 flex flex-1 items-center justify-center rounded-[9px] border border-dashed border-[#d0c6bd] bg-[rgba(255,252,248,0.55)] px-3 text-center text-[12px] leading-5 text-[#6c5f55]">
          The code panel will stay here once coding begins or once `SYNC` captures visible code.
        </div>
      )}
    </div>
  )
}

function mapSnapshotCode(snapshot: InterviewSessionSnapshot): InterviewPhaseDocument['codePanel'] {
  if (!snapshot.currentCode) {
    return null
  }

  return {
    language: 'python',
    mode: snapshot.currentCode.mode,
    content: snapshot.currentCode.content,
    narration: snapshot.currentCode.narration,
    suspectedMistakes: snapshot.currentCode.suspectedMistakes,
  }
}

function lineClassName(mode: string, line: string): string {
  if (mode !== 'diff') {
    return ''
  }
  if (line.startsWith('+')) {
    return 'interview-code-line-add'
  }
  if (line.startsWith('-')) {
    return 'interview-code-line-remove'
  }
  return 'interview-code-line-neutral'
}

export default InterviewCodePanel
