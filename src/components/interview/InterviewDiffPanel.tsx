import React from 'react'
import { GitBranch } from 'lucide-react'
import type { InterviewCodePanel, RenderableInterviewPhase } from '../../types/interview'

interface InterviewDiffPanelProps {
  codePanel: InterviewCodePanel | null
  phase: RenderableInterviewPhase
}

const InterviewDiffPanel: React.FC<InterviewDiffPanelProps> = ({ codePanel, phase }) => {
  if (!codePanel) {
    return (
      <div className="interview-surface-primary pointer-events-auto flex flex-col rounded-[10px] px-2 py-2">
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-[#2a1e14]">
          <GitBranch size={12} />
          <span>Changes</span>
        </div>
        <div className="mt-1.5 flex flex-1 items-center justify-center rounded-[7px] border border-dashed border-[rgba(71,58,48,0.15)] bg-[rgba(255,255,255,0.35)] px-3 py-6 text-center text-[11px] leading-5 text-[#6b5840]">
          {phase === 'p6_follow_up' ? 'Follow-up code changes will appear here.' : 'Code diff will appear here when changes are needed.'}
        </div>
      </div>
    )
  }

  const lines = codePanel.content.split('\n')
  const diffLines = extractDiffContext(lines)

  return (
    <div className="interview-surface-primary pointer-events-auto flex flex-col rounded-[10px] px-2 py-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2a1e14]">
          <GitBranch size={12} />
          <span>Changes</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-semibold">
          <span className="rounded-[4px] border border-[rgba(40,120,60,0.30)] bg-[rgba(40,120,60,0.08)] px-1.5 py-0.5 text-[#1a6b2a]">
            +{diffLines.filter(l => l.type === 'add').length}
          </span>
          <span className="rounded-[4px] border border-[rgba(160,50,40,0.30)] bg-[rgba(160,50,40,0.08)] px-1.5 py-0.5 text-[#7a2218]">
            -{diffLines.filter(l => l.type === 'remove').length}
          </span>
        </div>
      </div>

      <div className="interview-code-surface mt-1.5 min-h-0 flex-1 overflow-auto px-0 py-1">
        {diffLines.map((entry, index) => (
          <div
            key={index}
            className={`grid grid-cols-[30px_minmax(0,1fr)] gap-1.5 px-1 py-[1px] ${diffLineClass(entry.type)}`}
          >
            <span className="select-none text-right text-[10px] font-mono text-[#6a5e50] leading-[1.45]">
              {entry.lineNumber > 0 ? entry.lineNumber : ''}
            </span>
            <span
              className="whitespace-pre text-[13px] font-mono leading-[1.45]"
              style={{ fontFamily: 'var(--font-interview-code)' }}
            >
              {entry.content || ' '}
            </span>
          </div>
        ))}
        {diffLines.length === 0 && (
          <div className="px-3 py-4 text-[11px] text-[#9a8670]">No diff lines found.</div>
        )}
      </div>
    </div>
  )
}

type DiffLineType = 'add' | 'remove' | 'context'

interface DiffEntry {
  lineNumber: number
  content: string
  type: DiffLineType
}

function extractDiffContext(lines: string[]): DiffEntry[] {
  const CONTEXT_RADIUS = 2
  const result: DiffEntry[] = []
  const changeIndices = new Set<number>()

  lines.forEach((line, i) => {
    if (line.startsWith('+') || line.startsWith('-')) {
      for (let j = Math.max(0, i - CONTEXT_RADIUS); j <= Math.min(lines.length - 1, i + CONTEXT_RADIUS); j++) {
        changeIndices.add(j)
      }
    }
  })

  let lastIncluded = -1
  lines.forEach((line, i) => {
    if (!changeIndices.has(i)) return
    if (lastIncluded !== -1 && i > lastIncluded + 1) {
      result.push({ lineNumber: 0, content: '⋯', type: 'context' })
    }
    result.push({
      lineNumber: i + 1,
      content: line,
      type: line.startsWith('+') ? 'add' : line.startsWith('-') ? 'remove' : 'context',
    })
    lastIncluded = i
  })

  return result
}

function diffLineClass(type: DiffLineType): string {
  switch (type) {
    case 'add': return 'interview-code-line-add'
    case 'remove': return 'interview-code-line-remove'
    default: return 'interview-code-line-neutral text-[#e8dece]'
  }
}

export default InterviewDiffPanel
