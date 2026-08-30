'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Layers3,
  Minus,
} from 'lucide-react';
import {
  createInitialSkills,
  type EvidenceState,
  type SkillEvidence,
} from '@/lib/interview/types';
import { scriptedDemoAnswers } from '@/data/demo';

type EvidenceMapProps = {
  skills?: SkillEvidence[];
};

const STATE_META: Record<
  EvidenceState,
  {
    label: string;
    bar: string;
    badge: string;
    icon: typeof CheckCircle2;
  }
> = {
  proven: {
    label: 'Proven',
    bar: 'bg-[#0e9f84]',
    badge: 'border-[#0e9f84]/20 bg-[#0e9f84]/10 text-[#087461]',
    icon: CheckCircle2,
  },
  partial: {
    label: 'Partial',
    bar: 'bg-[#4256d0]',
    badge: 'border-[#4256d0]/20 bg-[#4256d0]/10 text-[#3549bd]',
    icon: Minus,
  },
  unverified: {
    label: 'Unverified',
    bar: 'bg-[#c8d2e2]',
    badge: 'border-border bg-[#f3f6fb] text-[#67758e]',
    icon: CircleDashed,
  },
};

function createDemoEvidence(): SkillEvidence[] {
  const skills = createInitialSkills();

  skills.react = {
    ...skills.react,
    state: 'proven',
    strength: 0.88,
    quote: scriptedDemoAnswers[0],
    reason: 'Named the bottleneck, diagnostic tool, intervention, and measured result.',
    updatedAtTurn: 1,
  };
  skills.performance = {
    ...skills.performance,
    state: 'partial',
    strength: 0.61,
    quote: scriptedDemoAnswers[1],
    reason: 'Recognized memoization trade-offs and anchored the answer in profiling.',
    updatedAtTurn: 2,
  };
  skills.javascript = {
    ...skills.javascript,
    state: 'partial',
    strength: 0.46,
    quote: scriptedDemoAnswers[2],
    reason: 'Proposed debounce, cancellation, and latest-response protection.',
    updatedAtTurn: 3,
  };

  return Object.values(skills);
}

export function EvidenceMap({ skills }: EvidenceMapProps) {
  const [expandedSkill, setExpandedSkill] = useState<string>('react');
  const items = useMemo(() => skills ?? createDemoEvidence(), [skills]);
  const evidencedCount = items.filter((skill) => skill.state !== 'unverified').length;

  return (
    <section
      className="depth-panel flex h-full min-h-0 flex-col overflow-hidden rounded-[1.35rem]"
      aria-labelledby="evidence-map-title"
      aria-describedby={!skills ? 'evidence-map-disclosure' : undefined}
    >
      {!skills && (
        <p
          id="evidence-map-disclosure"
          className="border-b border-primary/10 bg-primary/[0.045] px-5 py-2 text-[10px] leading-4 text-[#53617a]"
        >
          <span className="data-type font-semibold uppercase tracking-[0.1em] text-primary">
            Showcase data
          </span>{' '}
          · Sample evidence, not extracted from this call.
        </p>
      )}
      <div className="relative overflow-hidden border-b border-border/70 px-5 py-5 sm:px-6">
        <div className="micro-grid absolute right-0 top-0 h-32 w-40 opacity-45 [mask-image:linear-gradient(225deg,black,transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Layers3 className="h-4 w-4" />
              <span className="data-type text-[10px] font-semibold uppercase tracking-[0.16em]">
                Signature signal
              </span>
            </div>
            <h2
              id="evidence-map-title"
              className="display-type mt-2 text-xl font-semibold tracking-[-0.035em] text-foreground"
            >
              Evidence stack
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Skill claims rise only when the transcript supplies proof.
            </p>
          </div>

          <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-right shadow-sm">
            <span className="data-type block text-lg font-semibold text-primary">
              {evidencedCount}/{items.length}
            </span>
            <span className="data-type text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
              touched
            </span>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-5 gap-1.5" aria-hidden="true">
          {items.map((skill, index) => {
            const height = Math.max(14, Math.round(skill.strength * 54));
            const meta = STATE_META[skill.state];
            return (
              <div
                key={skill.skillId}
                className="flex h-14 items-end rounded-md border border-border/60 bg-white/70 p-1 shadow-[0_6px_12px_rgba(38,51,82,0.05)]"
                style={{ transform: `translateY(${index % 2 === 0 ? 0 : 2}px)` }}
              >
                <div
                  className={`w-full rounded-[0.2rem] ${meta.bar} opacity-90 shadow-[0_-4px_12px_rgba(66,86,208,0.16)]`}
                  style={{ height }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3.5 sm:p-4">
        {items.map((skill) => {
          const meta = STATE_META[skill.state];
          const Icon = meta.icon;
          const percent = Math.round(skill.strength * 100);
          const isExpanded = expandedSkill === skill.skillId;
          const hasEvidence = Boolean(skill.quote || skill.reason);

          return (
            <article
              key={skill.skillId}
              className={`interactive-surface relative overflow-hidden rounded-xl border bg-white/80 backdrop-blur transition-[border-color,box-shadow,transform] ${
                isExpanded
                  ? 'border-primary/25 shadow-[0_12px_26px_rgba(37,54,96,0.09)]'
                  : 'border-border/80 shadow-[0_4px_10px_rgba(37,54,96,0.04)]'
              }`}
            >
              <button
                type="button"
                className="flex w-full items-center gap-3 px-3.5 py-3.5 text-left sm:px-4"
                onClick={() =>
                  hasEvidence &&
                  setExpandedSkill((current) =>
                    current === skill.skillId ? '' : skill.skillId,
                  )
                }
                aria-expanded={hasEvidence ? isExpanded : undefined}
                disabled={!hasEvidence}
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${meta.badge}`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-foreground">
                      {skill.label}
                    </span>
                    <span className="data-type text-xs font-semibold text-[#40506b]">
                      {percent}%
                    </span>
                  </span>
                  <span
                    className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#e9eef6] shadow-[0_1px_2px_rgba(37,51,83,0.08)_inset]"
                    role="progressbar"
                    aria-label={`${skill.label} evidence strength`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                  >
                    <span
                      className={`block h-full rounded-full ${meta.bar} shadow-[0_2px_8px_currentColor] transition-[width] duration-700`}
                      style={{ width: `${percent}%` }}
                    />
                  </span>
                </span>

                <span className="flex w-[5.5rem] shrink-0 items-center justify-end gap-1.5">
                  <span className={`rounded-md border px-2 py-1 data-type text-[9px] font-semibold uppercase ${meta.badge}`}>
                    {meta.label}
                  </span>
                  {hasEvidence && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </span>
              </button>

              {isExpanded && hasEvidence && (
                <div className="border-t border-border/70 bg-[#f8faff] px-4 py-3.5">
                  {skill.quote && (
                    <blockquote className="border-l-2 border-primary/40 pl-3 text-xs leading-5 text-[#40506b]">
                      “{skill.quote}”
                    </blockquote>
                  )}
                  {skill.reason && (
                    <div className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                      {skill.reason}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="border-t border-border/70 px-5 py-3 text-[10px] leading-4 text-muted-foreground">
        Evidence strength measures support in the interview record—not candidate probability.
      </div>
    </section>
  );
}
