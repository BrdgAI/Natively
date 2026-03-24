import React, { useEffect, useState } from 'react'
import type { InterviewFetchIndicator, InterviewFetchIndicators } from '../../types/interview'

interface InterviewContextFooterProps {
  fetchIndicators: InterviewFetchIndicators
}

const InterviewContextFooter: React.FC<InterviewContextFooterProps> = ({ fetchIndicators }) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 15000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="grid gap-2 xl:grid-cols-2">
      <StatusCard
        title="Last Normal Fetch"
        shortcut="⌘↵"
        indicator={fetchIndicators.next}
        now={now}
      />
      <StatusCard
        title="Last Screen Sync"
        shortcut="⌘⇧↵"
        indicator={fetchIndicators.sync}
        now={now}
      />
    </div>
  )
}

const StatusCard = ({
  title,
  shortcut,
  indicator,
  now,
}: {
  title: string
  shortcut: string
  indicator: InterviewFetchIndicator
  now: number
}) => (
  <div className="interview-surface pointer-events-auto rounded-[8px] px-2 py-1.5">
    <div className="flex items-center justify-between gap-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#f0dfc5] interview-text-heading">
        {title}
      </div>
      <span className="rounded-[5px] border border-[rgba(255,220,180,0.12)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 text-[9px] font-semibold text-[#f0dfc5] interview-text">
        {shortcut}
      </span>
    </div>

    <div className="mt-1 flex items-center justify-between gap-3 rounded-[7px] border border-[rgba(255,220,180,0.10)] bg-[rgba(255,255,255,0.04)] px-2 py-1.5">
      <span className={statusClassName(indicator.state)}>
        {indicator.message}
      </span>
      <span className="shrink-0 text-[10px] font-semibold text-[#cebca4] interview-text">
        {formatTriggeredAt(indicator.triggeredAt, now)}
      </span>
    </div>
  </div>
)

function statusClassName(state: InterviewFetchIndicator['state']): string {
  switch (state) {
    case 'running':
      return 'text-[10.5px] font-semibold text-[#f1d595] interview-text'
    case 'updated':
      return 'text-[10.5px] font-semibold text-[#c6efcd] interview-text'
    case 'unchanged':
      return 'text-[10.5px] font-semibold text-[#dfcdb2] interview-text'
    default:
      return 'text-[10.5px] font-semibold text-[#cebca4] interview-text'
  }
}

function formatTriggeredAt(triggeredAt: number | null, now: number): string {
  if (!triggeredAt) {
    return 'Not yet'
  }

  const diffSeconds = Math.max(0, Math.floor((now - triggeredAt) / 1000))
  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  return `${diffHours}h ago`
}

export default InterviewContextFooter
