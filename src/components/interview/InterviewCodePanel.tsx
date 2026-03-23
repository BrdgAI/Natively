import React from 'react'
import { Braces, Bug, FileCode2 } from 'lucide-react'
import type { InterviewCodePanel as InterviewCodePanelData, InterviewSessionSnapshot } from '../../types/interview'

interface InterviewCodePanelProps {
  snapshot: InterviewSessionSnapshot
}

const InterviewCodePanel: React.FC<InterviewCodePanelProps> = ({ snapshot }) => {
  const payload = snapshot.latestPayload
  const codePanel = payload?.codePanel || mapSnapshotCode(snapshot)
  const narration = codePanel?.narration || []
  const mistakes = codePanel?.suspectedMistakes || snapshot.currentCode?.suspectedMistakes || []
  const changes = payload?.changes || []

  return (
    <div className="pointer-events-auto flex min-h-[320px] flex-col overflow-hidden interview-card rounded-[28px] px-5 py-5 text-[#111827]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
          <FileCode2 size={15} />
          <span>Code</span>
        </div>
        {codePanel && (
          <div className="flex items-center gap-2 text-[11px] text-[#475569]">
            <span className="rounded-full border border-black/8 bg-white/50 px-2.5 py-1 font-semibold">{codePanel.language.toUpperCase()}</span>
            <span className="rounded-full border border-black/8 bg-white/50 px-2.5 py-1 font-semibold">{codePanel.mode.toUpperCase()}</span>
          </div>
        )}
      </div>

      {codePanel ? (
        <>
          <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-[22px] border border-black/8 bg-[#fffdfa]/92 p-3 font-mono text-[12px] leading-6 text-[#0f172a]">
            {codePanel.content.split('\n').map((line, index) => (
              <div key={`${index}-${line}`} className={`grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-md px-2 ${lineClassName(codePanel, line)}`}>
                <span className="select-none text-right text-[#94a3b8]">{index + 1}</span>
                <span className="whitespace-pre-wrap break-words">{line || ' '}</span>
              </div>
            ))}
          </div>

          {changes.length > 0 && (
            <div className="mt-4 rounded-[20px] border border-black/8 bg-white/58 p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
                <Braces size={14} />
                <span>Change Summary</span>
              </div>
              <div className="mt-3 space-y-2">
                {changes.slice(0, 4).map((item, index) => (
                  <div key={`${item.label}-${index}`} className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2 text-[13px] leading-6 text-[#1f2937]">
                    <span className="font-semibold text-[#0f172a]">{item.label}:</span> {item.detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {narration.length > 0 && (
            <div className="mt-4 rounded-[20px] border border-black/8 bg-white/58 p-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">Say While Typing</div>
              <div className="mt-3 space-y-2">
                {narration.map((line, index) => (
                  <div key={`${line}-${index}`} className="rounded-[16px] border border-black/6 bg-[#fffdf9]/90 px-3 py-2 text-[13px] leading-6 text-[#1f2937]">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mistakes.length > 0 && (
            <div className="mt-4 rounded-[20px] border border-[#fdba74] bg-[#fff7ed]/88 p-4">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#9a3412]">
                <Bug size={14} />
                <span>Likely Mistakes</span>
              </div>
              <div className="mt-3 space-y-2">
                {mistakes.slice(0, 4).map((line, index) => (
                  <div key={`${line}-${index}`} className="rounded-[16px] border border-[#fdba74]/60 bg-white/70 px-3 py-2 text-[13px] leading-6 text-[#7c2d12]">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-[22px] border border-dashed border-black/12 bg-white/44 px-5 text-center text-[14px] leading-7 text-[#475569]">
          The code panel will stay pinned here once the coding phase begins or a synced screenshot shows visible code.
        </div>
      )}
    </div>
  )
}

function mapSnapshotCode(snapshot: InterviewSessionSnapshot): InterviewCodePanelData | null {
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

function lineClassName(codePanel: InterviewCodePanelData, line: string): string {
  if (codePanel.mode !== 'diff') {
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
