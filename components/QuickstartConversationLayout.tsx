'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AudioWaveform, Clock3, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoCandidate, demoRole } from '@/data/demo';
import { EvidenceMap } from './EvidenceMap';
import { DecisionRail } from './DecisionRail';
import type {
  NBQDecision,
  ReliabilityGateResult,
  SkillEvidence,
} from '@/lib/interview/types';

type QuickstartConversationLayoutProps = {
  statusPanel: ReactNode;
  pipelineMetrics: ReactNode;
  transcriptPanel: ReactNode;
  visualizer: ReactNode;
  controls: ReactNode;
  skills?: SkillEvidence[];
  currentDecision?: NBQDecision;
  currentGateResult?: ReliabilityGateResult;
  turnNumber?: number;
  onEndConversation: () => void;
};

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function QuickstartConversationLayout({
  statusPanel,
  pipelineMetrics,
  transcriptPanel,
  visualizer,
  controls,
  skills,
  currentDecision,
  currentGateResult,
  turnNumber,
  onEndConversation,
}: QuickstartConversationLayoutProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="conversation-dashboard-shell flex min-h-dvh w-full flex-col text-left">
      <a
        href="#live-transcript"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to live transcript
      </a>

      <header className="relative z-30 mx-3 mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 px-3.5 py-3 shadow-[0_12px_30px_rgba(37,51,83,0.08)] backdrop-blur-xl sm:mx-4 sm:px-5 xl:mx-5 xl:mt-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="brand-mark shrink-0" aria-hidden="true">
            <AudioWaveform className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="display-type text-base font-semibold tracking-[-0.035em] text-foreground">
                Interview<span className="text-primary">IQ</span>
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {demoRole.title} · {demoRole.company}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground sm:hidden">
              <UserRound className="h-3 w-3" />
              <span className="truncate">{demoCandidate.name}</span>
            </div>
          </div>
        </div>

        <div className="order-3 flex w-full items-center justify-between gap-3 border-t border-border/60 pt-3 sm:order-none sm:w-auto sm:border-t-0 sm:pt-0">
          <div className="hidden items-center gap-3 border-r border-border/70 pr-4 md:flex">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f3f9] text-primary">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{demoCandidate.name}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Candidate · live session</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 items-center gap-2 rounded-xl border border-border/75 bg-[#f8faff] px-3">
              <Clock3 className="h-3.5 w-3.5 text-primary" />
              <span
                className="data-type text-xs font-semibold text-foreground"
                aria-label={`${elapsedSeconds} seconds elapsed`}
              >
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            {statusPanel}
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="h-11 rounded-xl px-3.5 text-xs font-semibold shadow-[0_8px_18px_rgba(217,86,99,0.18)]"
            onClick={() => {
              if (isEnding) return;
              setIsEnding(true);
              onEndConversation();
            }}
            disabled={isEnding}
            aria-busy={isEnding}
            aria-label={isEnding ? 'Ending interview' : 'End interview'}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {isEnding ? 'Ending…' : 'End interview'}
            </span>
            <span className="sm:hidden">{isEnding ? 'Ending…' : 'End'}</span>
          </Button>
        </div>
      </header>

      <div className="dashboard-grid grid min-w-0 flex-1 gap-4 p-3 pb-24 sm:p-4 sm:pb-24 lg:grid-cols-[minmax(0,1.42fr)_minmax(19rem,0.78fr)] lg:grid-rows-[minmax(0,1fr)_auto] lg:pb-4 xl:gap-4 xl:p-5">
        <main className="dashboard-primary flex min-w-0 flex-col gap-4">
          <section
            className="dashboard-voice interactive-surface depth-panel relative min-h-[20rem] overflow-hidden rounded-[1.35rem] px-4 pb-4 pt-5 sm:px-5"
            aria-label="Live interview voice state"
          >
            <div className="micro-grid absolute inset-y-0 right-0 w-1/2 opacity-35 [mask-image:linear-gradient(90deg,transparent,black)]" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="data-type text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Live voice channel
                </p>
                <h1 className="display-type mt-1.5 text-lg font-semibold tracking-[-0.03em] text-foreground">
                  Interview in progress
                </h1>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/5 px-2.5 py-1.5 data-type text-[9px] font-semibold uppercase tracking-[0.1em] text-[#087461]">
                <span className="status-dot h-1.5 w-1.5 rounded-full bg-accent" />
                Live
              </span>
            </div>

            <div className="relative flex min-h-[12rem] items-center justify-center py-3 sm:min-h-[14rem]">
              {visualizer}
            </div>

            <div className="relative grid gap-3 border-t border-border/70 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              {pipelineMetrics}
              <div className="hidden justify-end lg:flex">{controls}</div>
            </div>
          </section>

          <section
            id="live-transcript"
            tabIndex={-1}
            className="dashboard-transcript depth-panel h-[32rem] min-h-[26rem] overflow-hidden rounded-[1.35rem] focus-visible:ring-2 focus-visible:ring-primary lg:h-[34rem]"
          >
            {transcriptPanel}
          </section>
        </main>

        <aside className="dashboard-evidence min-h-[34rem] min-w-0 lg:min-h-0" aria-label="Interview evidence">
          <EvidenceMap skills={skills} />
        </aside>

        <div className="min-w-0 lg:col-span-2">
          <DecisionRail
            decision={currentDecision}
            gateResult={currentGateResult}
            turnNumber={turnNumber}
            isLive={Boolean(skills)}
          />
        </div>
      </div>

      <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center rounded-2xl border border-white/75 bg-white/82 p-2 shadow-[0_18px_48px_rgba(24,37,67,0.2)] backdrop-blur-xl lg:hidden">
        {controls}
      </div>
    </div>
  );
}
