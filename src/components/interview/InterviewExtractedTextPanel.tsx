import React from 'react'
import type { InterviewExtractedTextSummary } from '../../types/interview'

interface InterviewExtractedTextPanelProps {
  extractedText: InterviewExtractedTextSummary
}

const InterviewExtractedTextPanel: React.FC<InterviewExtractedTextPanelProps> = ({ extractedText }) => {
  const dryRunValue = [extractedText.dryRunInput, ...extractedText.codeObservations]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="interview-surface pointer-events-auto rounded-[8px] px-2.5 py-1.5">
      <div className="grid gap-1.5 xl:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)]">
        <ExtractBlock title="Screen Text" value={extractedText.problemText} />
        <ExtractBlock
          title="Δ Requirements"
          value={extractedText.requirementDelta.length > 0 ? extractedText.requirementDelta.join(' · ') : ''}
        />
        <ExtractBlock title="Dry Run / Code" value={dryRunValue} />
      </div>
    </div>
  )
}

const ExtractBlock = ({ title, value }: { title: string; value: string }) => (
  <div className="interview-item-pill min-w-0 rounded-[6px] border border-[rgba(71,58,48,0.10)] px-2 py-1">
    <span className="text-[10px] font-bold text-[#2a1e10] interview-text-heading">{title}: </span>
    <span className="text-[10px] leading-[1.45] text-[#1e1408] font-semibold interview-text">
      {value || <span className="text-[#8a7860] font-normal italic">—</span>}
    </span>
  </div>
)

export default InterviewExtractedTextPanel
