import React from 'react'
import { ArrowRight, Lightbulb, PencilLine } from 'lucide-react'
import type { InterviewSessionSnapshot } from '../../types/interview'

interface InterviewMainPanelProps {
  snapshot: InterviewSessionSnapshot
  scrollRef: React.RefObject<HTMLDivElement>
  onScroll: () => void
}

const InterviewMainPanel: React.FC<InterviewMainPanelProps> = ({ snapshot, scrollRef, onScroll }) => {
  const payload = snapshot.latestPayload

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="pointer-events-auto min-h-0 overflow-y-auto interview-card rounded-[30px] px-6 py-6 text-[#111827]"
    >
      {!payload ? (
        <div className="space-y-5">
          <Hero
            eyebrow="Ready"
            title="Interview guidance is standing by."
            body={snapshot.statusMessage || 'Press Cmd+Enter as soon as the problem appears. Press Cmd+Shift+Enter only when screen context matters.'}
          />
          <Section title="What To Do Next" icon={<ArrowRight size={15} />}>
            {[
              'Press Cmd+Enter early to prewarm the clarification script.',
              'Press Cmd+Enter again after verbal requirements land so the structure refreshes.',
              'Use Cmd+Shift+Enter when the on-screen problem, code, or dry run input matters.',
            ]}
          </Section>
          <ContextSection snapshot={snapshot} />
        </div>
      ) : (
        <div className="space-y-5">
          <Hero
            eyebrow={phaseLabel(payload.phase)}
            title={headlineForPhase(payload.phase)}
            body={snapshot.statusMessage || 'Speak from the main lane, glance at the side rail for thought prompts, and use the code panel when you start typing.'}
          />

          <Section title="Speak Now" icon={<Lightbulb size={15} />} large>
            {payload.speakNow.length > 0 ? payload.speakNow : ['No primary script yet. Press Cmd+Enter to generate the next spoken chunk.']}
          </Section>

          {payload.writeNow.length > 0 && (
            <Section title="Write Now" icon={<PencilLine size={15} />}>
              {payload.writeNow}
            </Section>
          )}

          {payload.speakIfAsked.length > 0 && (
            <Section title="Keep Ready" icon={<ArrowRight size={15} />}>
              {payload.speakIfAsked}
            </Section>
          )}

          {payload.changes.length > 0 && (
            <Section title="What Changed" icon={<ArrowRight size={15} />}>
              {payload.changes.map((item) => `${item.label}: ${item.detail}`)}
            </Section>
          )}

          <ContextSection snapshot={snapshot} />
        </div>
      )}
    </div>
  )
}

const Hero = ({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) => (
  <div className="rounded-[28px] border border-black/8 bg-[linear-gradient(135deg,rgba(255,255,255,0.68),rgba(252,246,232,0.62))] px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748b]">{eyebrow}</div>
    <h1 className="mt-2 font-celeb text-[34px] leading-[1.02] text-[#0f172a] sm:text-[40px]">{title}</h1>
    <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#334155]">{body}</p>
  </div>
)

const Section = ({ title, icon, children, large = false }: { title: string; icon: React.ReactNode; children: string[]; large?: boolean }) => (
  <section className="rounded-[26px] border border-black/8 bg-white/58 px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
    <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
      {icon}
      <span>{title}</span>
    </div>
    <div className="mt-4 space-y-3">
      {children.map((line, index) => (
        <div
          key={`${title}-${index}-${line}`}
          className={`rounded-[20px] border border-black/7 bg-[#fffdf9]/90 px-4 py-3 ${large ? 'text-[17px] leading-8 text-[#0f172a]' : 'text-[14px] leading-7 text-[#1f2937]'}`}
        >
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#111827] text-[11px] font-semibold text-white">{index + 1}</span>
            <span>{line}</span>
          </div>
        </div>
      ))}
    </div>
  </section>
)

const ContextSection = ({ snapshot }: { snapshot: InterviewSessionSnapshot }) => {
  const items = [
    snapshot.problemStatement && `Problem: ${snapshot.problemStatement}`,
    ...snapshot.constraints.slice(0, 4).map((item) => `Constraint: ${item}`),
    ...snapshot.examples.slice(0, 3).map((item) => `Example: ${item}`),
  ].filter(Boolean) as string[]

  if (items.length === 0) {
    return null
  }

  return <Section title="Context On Screen" icon={<ArrowRight size={15} />}>{items}</Section>
}

function phaseLabel(phase: InterviewSessionSnapshot['phase']): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Clarify'
    case 'p3_approach':
      return 'Approach'
    case 'p4_code':
      return 'Coding'
    case 'p5_test':
      return 'Testing'
    case 'p6_close':
      return 'Closing'
    default:
      return 'Interview'
  }
}

function headlineForPhase(phase: InterviewSessionSnapshot['phase']): string {
  switch (phase) {
    case 'p2_clarify':
      return 'Lead with a crisp restatement, then ask the highest-value questions.'
    case 'p3_approach':
      return 'Walk from brute force to the chosen approach without sounding rushed.'
    case 'p4_code':
      return 'Type in a top-down flow and narrate the intent of each chunk.'
    case 'p5_test':
      return 'Dry run with confidence, cover edge cases, and land the complexity cleanly.'
    case 'p6_close':
      return 'Handle the follow-up change, summarize impact, and close professionally.'
    default:
      return 'Keep the interview moving in calm, structured steps.'
  }
}

export default InterviewMainPanel
