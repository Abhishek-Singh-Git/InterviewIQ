'use client';

import {
  ArrowRight,
  Check,
  Gauge,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const gates = [
  { label: 'Relevance', detail: 'Role aligned' },
  { label: 'Quality', detail: 'Specific + open' },
  { label: 'Latency', detail: '684ms' },
  { label: 'Format', detail: 'Voice ready' },
] as const;

export function DecisionRail() {
  return (
    <section
      className="depth-panel overflow-hidden rounded-[1.35rem]"
      aria-labelledby="decision-rail-title"
      aria-describedby="decision-rail-disclosure"
    >
      <p
        id="decision-rail-disclosure"
        className="border-b border-primary/10 bg-primary/[0.045] px-4 py-2 text-[10px] leading-4 text-[#53617a] sm:px-5"
      >
        <span className="data-type font-semibold uppercase tracking-[0.1em] text-primary">
          Showcase data
        </span>{' '}
        · Sample question and gate states are not derived from this live call.
      </p>
      <div className="grid min-w-0 xl:grid-cols-[minmax(18rem,1.2fr)_auto_minmax(30rem,2fr)_auto_minmax(10rem,0.65fr)] xl:items-stretch">
        <div className="interactive-surface min-w-0 border-b border-border/70 p-4 sm:p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
              Next-best question
            </span>
          </div>
          <h2 id="decision-rail-title" className="mt-2.5 text-sm font-semibold leading-6 text-foreground">
            When is memoization actually bad for performance?
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="rounded-md border border-primary/15 bg-primary/5 px-2 py-1 font-semibold text-primary">
              Performance
            </span>
            <span className="data-type text-muted-foreground">Adaptive · turn 03</span>
          </div>
        </div>

        <div className="hidden items-center justify-center px-3 text-primary/45 xl:flex" aria-hidden="true">
          <ArrowRight className="h-5 w-5" />
        </div>

        <div className="min-w-0 border-b border-border/70 p-4 sm:p-5 xl:border-b-0 xl:border-r xl:border-l">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#087461]">
              <ShieldCheck className="h-4 w-4" />
              <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
                Reliability gate
              </span>
            </div>
            <span className="data-type rounded-md bg-[#0e9f84]/10 px-2 py-1 text-[9px] font-semibold uppercase text-[#087461]">
              4 checks passed
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {gates.map((gate) => (
              <div
                key={gate.label}
                className="interactive-surface rounded-lg border border-[#0e9f84]/15 bg-[#0e9f84]/[0.055] px-3 py-2.5 backdrop-blur"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#174f46]">
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0e9f84] text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {gate.label}
                </div>
                <p className="data-type mt-1.5 text-[9px] text-[#55726d]">{gate.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden items-center justify-center px-3 text-primary/45 xl:flex" aria-hidden="true">
          <ArrowRight className="h-5 w-5" />
        </div>

        <div className="interactive-surface flex items-center justify-between gap-4 p-4 sm:p-5 xl:flex-col xl:items-start xl:justify-center">
          <div>
            <div className="flex items-center gap-2 text-accent">
              <MessageSquareQuote className="h-4 w-4" />
              <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
                Delivery
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">Approved</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-[#f8faff] px-2.5 py-2 data-type text-[9px] text-muted-foreground">
            <Gauge className="h-3 w-3 text-primary" />
            Ready next turn
          </div>
        </div>
      </div>
    </section>
  );
}
