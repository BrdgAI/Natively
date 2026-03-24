import React from 'react'
import { Bug, FileCode2 } from 'lucide-react'
import type { InterviewPhaseDocument, InterviewSessionSnapshot } from '../../types/interview'

interface InterviewCodePanelProps {
  snapshot: InterviewSessionSnapshot
  document: InterviewPhaseDocument
}

const InterviewCodePanel: React.FC<InterviewCodePanelProps> = ({ snapshot, document }) => {
  const codePanel = resolveCodePanel(snapshot, document)

  return (
    <div className="interview-surface-primary pointer-events-auto flex flex-col rounded-[10px] px-2 py-2">
      <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1e1408] interview-text-heading">
          <FileCode2 size={12} />
          <span>Code</span>
        </div>
        {codePanel && (
          <div className="flex items-center gap-1.5">
            <span className="interview-item-pill rounded-[4px] border border-[rgba(71,58,48,0.14)] px-1.5 py-0.5 text-[9px] font-semibold text-[#5a4828] interview-text">{codePanel.language.toUpperCase()}</span>
            <span className="interview-item-pill rounded-[4px] border border-[rgba(71,58,48,0.14)] px-1.5 py-0.5 text-[9px] font-semibold text-[#5a4828] interview-text">{codePanel.mode.toUpperCase()}</span>
          </div>
        )}
      </div>

      {codePanel ? (
        <>
          <div className="interview-code-surface min-h-0 flex-1 overflow-auto px-0 py-1">
            {codePanel.content.split('\n').map((line, index) => (
              <div
                key={`${index}-${line}`}
                className={`grid grid-cols-[30px_minmax(0,1fr)] gap-1.5 px-1 py-[1px] ${lineClassName(codePanel.mode, line)}`}
              >
                <span className="select-none text-right text-[10px] font-mono text-[#6a5e50] leading-[1.45]">{index + 1}</span>
                <span
                  className="whitespace-pre text-[13px] font-mono leading-[1.45] text-[#e8dece]"
                  style={{ fontFamily: 'var(--font-interview-code)' }}
                >
                  {line || ' '}
                </span>
              </div>
            ))}
          </div>

          {codePanel.suspectedMistakes.length > 0 && (
            <div className="mt-1.5 rounded-[7px] border border-[rgba(160,60,40,0.22)] bg-[rgba(250,235,228,0.82)] px-2 py-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#7a2818] interview-text-heading">
                <Bug size={11} />
                <span>Likely Mistakes</span>
              </div>
              <div className="mt-1 space-y-1">
                {codePanel.suspectedMistakes.map((line, index) => (
                  <div key={`${line}-${index}`} className="text-[11px] leading-5 text-[#5a2010] font-semibold interview-text">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-[7px] border border-dashed border-[rgba(71,58,48,0.14)] px-3 py-6 text-center text-[11px] leading-5 text-[#5a4030] interview-text">
          Code panel loads once coding begins or after SYNC captures visible code.
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

function resolveCodePanel(
  snapshot: InterviewSessionSnapshot,
  document: InterviewPhaseDocument
): InterviewPhaseDocument['codePanel'] {
  if (
    document.codePanel?.mode === 'diff'
    && snapshot.currentCode
    && snapshot.currentCode.mode !== 'diff'
  ) {
    return {
      language: document.codePanel.language,
      mode: snapshot.currentCode.mode,
      content: snapshot.currentCode.content,
      narration: snapshot.currentCode.narration,
      suspectedMistakes: document.codePanel.suspectedMistakes.length > 0
        ? document.codePanel.suspectedMistakes
        : snapshot.currentCode.suspectedMistakes,
    }
  }

  return document.codePanel || mapSnapshotCode(snapshot)
}

function lineClassName(mode: string, line: string): string {
  if (mode !== 'diff') return ''
  if (line.startsWith('+')) return 'interview-code-line-add'
  if (line.startsWith('-')) return 'interview-code-line-remove'
  return 'interview-code-line-neutral'
}

export default InterviewCodePanel
