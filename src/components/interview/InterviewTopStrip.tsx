import React from 'react'
import { AlertCircle, ArrowRight, Keyboard, Monitor, Power, ScanLine, Terminal } from 'lucide-react'
import type { InterviewPhase } from '../../types/interview'

interface InterviewTopStripProps {
  phase: InterviewPhase
  phaseConfidence: number
  manualOverridePhase: InterviewPhase | null
  statusMessage: string | null
  lastTranscriptSnippet: string
  lastTranscriptAt: number | null
  lastScreenshotAt: number | null
  isStale: boolean
  mousePassthrough: boolean
  textModelLabel: string
  sttLabel: string
  now: number
  onNext: () => void
  onSync: () => void
  onExitInterviewMode: () => void
  onEndMeeting: () => void
}

const InterviewTopStrip: React.FC<InterviewTopStripProps> = ({
  phase,
  phaseConfidence,
  manualOverridePhase,
  statusMessage,
  lastTranscriptSnippet,
  lastTranscriptAt,
  lastScreenshotAt,
  isStale,
  mousePassthrough,
  textModelLabel,
  sttLabel,
  now,
  onNext,
  onSync,
  onExitInterviewMode,
  onEndMeeting,
}) => {
  return (
    <div className="pointer-events-auto interview-card rounded-[26px] px-5 py-4 text-[#111827]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge icon={<Terminal size={13} />} label="Interview Mode" />
            <Badge label={formatPhase(phase)} tone="strong" />
            <Badge label={`Confidence ${Math.round(phaseConfidence * 100)}%`} />
            {manualOverridePhase && <Badge label={`Manual ${formatPhase(manualOverridePhase)}`} tone="accent" />}
            {isStale && <Badge icon={<AlertCircle size={13} />} label="Needs refresh" tone="warning" />}
            {mousePassthrough && <Badge icon={<Monitor size={13} />} label="Click-through on" />}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[#334155]">
            <span className="font-medium text-[#0f172a]">Heard:</span>
            <span className="max-w-[720px] truncate">{lastTranscriptSnippet || statusMessage || 'Press Cmd+Enter when the interview problem is visible.'}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#475569]">
            <MiniBadge icon={<Keyboard size={12} />} label="Cmd+Enter NEXT" />
            <MiniBadge icon={<ScanLine size={12} />} label="Cmd+Shift+Enter SYNC" />
            <MiniBadge label={`Transcript ${formatFreshness(lastTranscriptAt, now)}`} />
            <MiniBadge label={`Screen ${formatFreshness(lastScreenshotAt, now)}`} />
            <MiniBadge label={textModelLabel} />
            <MiniBadge label={sttLabel} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <StripButton label="Next" icon={<ArrowRight size={14} />} onClick={onNext} />
          <StripButton label="Sync" icon={<ScanLine size={14} />} onClick={onSync} />
          <StripButton label="Leave Interview" icon={<Power size={14} />} onClick={onExitInterviewMode} tone="soft" />
          <StripButton label="End Meeting" icon={<Power size={14} />} onClick={onEndMeeting} tone="danger" />
        </div>
      </div>
    </div>
  )
}

const Badge = ({ icon, label, tone = 'default' }: { icon?: React.ReactNode; label: string; tone?: 'default' | 'strong' | 'accent' | 'warning' | 'soft' }) => {
  const className = tone === 'strong'
    ? 'bg-[#111827] text-white border-[#111827]'
    : tone === 'accent'
      ? 'bg-[#dbeafe] text-[#1d4ed8] border-[#93c5fd]'
      : tone === 'warning'
        ? 'bg-[#fff7ed] text-[#c2410c] border-[#fdba74]'
        : tone === 'soft'
          ? 'bg-white/40 text-[#334155] border-white/40'
          : 'bg-white/55 text-[#1f2937] border-white/50'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  )
}

const MiniBadge = ({ icon, label }: { icon?: React.ReactNode; label: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-white/45 px-2.5 py-1">
    {icon}
    <span>{label}</span>
  </span>
)

const StripButton = ({ label, icon, onClick, tone = 'default' }: { label: string; icon: React.ReactNode; onClick: () => void; tone?: 'default' | 'soft' | 'danger' }) => {
  const className = tone === 'danger'
    ? 'bg-[#111827] text-white border-[#111827] hover:bg-[#1f2937]'
    : tone === 'soft'
      ? 'bg-white/55 text-[#0f172a] border-black/10 hover:bg-white/75'
      : 'bg-[#0f172a] text-white border-[#0f172a] hover:bg-[#1e293b]'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold transition-colors ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function formatPhase(phase: InterviewPhase): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Clarify'
    case 'p3_approach':
      return 'Approach'
    case 'p4_code':
      return 'Code'
    case 'p5_test':
      return 'Test'
    case 'p6_close':
      return 'Close'
    default:
      return 'Clarify'
  }
}

function formatFreshness(timestamp: number | null, now: number): string {
  if (!timestamp) return 'not synced'
  const deltaSeconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (deltaSeconds < 5) return 'just now'
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`
  const minutes = Math.floor(deltaSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export default InterviewTopStrip
