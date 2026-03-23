import React from 'react'
import type { InterviewExtractedTextSummary } from '../../types/interview'

interface InterviewExtractedTextPanelProps {
  extractedText: InterviewExtractedTextSummary
}

const InterviewExtractedTextPanel: React.FC<InterviewExtractedTextPanelProps> = ({ extractedText }) => {
  const hasContent = Boolean(
    extractedText.problemText ||
    extractedText.requirementDelta.length > 0 ||
    extractedText.dryRunInput ||
    extractedText.codeObservations.length > 0
  )

  return (
    <div className="interview-surface pointer-events-auto rounded-[10px] px-3 py-2.5">
      <div className="grid gap-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)_minmax(220px,0.8fr)]">
        <ExtractBlock
          title="Screen Text"
          value={extractedText.problemText || 'No extracted problem text yet.'}
        />
        <ExtractBlock
          title="Requirement Delta"
          value={extractedText.requirementDelta.length > 0 ? extractedText.requirementDelta.join(' | ') : 'No requirement delta yet.'}
        />
        <ExtractBlock
          title="Dry Run / Code Notes"
          value={[
            extractedText.dryRunInput,
            ...extractedText.codeObservations,
          ].filter(Boolean).join(' | ') || 'No dry-run or code notes yet.'}
        />
      </div>
      {!hasContent && (
        <div className="mt-2 text-[11px] text-[#76675d]">
          This strip updates after `SYNC` so you can confirm what the screenshot analysis actually captured.
        </div>
      )}
    </div>
  )
}

const ExtractBlock = ({ title, value }: { title: string; value: string }) => (
  <div className="rounded-[8px] border border-[#d7cdc4] bg-[rgba(255,253,250,0.68)] px-2.5 py-2">
    <div className="text-[11px] font-bold text-[#544840]">{title}</div>
    <div className="mt-1 text-[12px] leading-5 text-[#241d18]">{value}</div>
  </div>
)

export default InterviewExtractedTextPanel
