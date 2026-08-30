'use client';

import { useEffect, useRef } from 'react';
import {
  ArrowRight,
  AudioWaveform,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileCheck2,
  Layers3,
  MessageSquareQuote,
  Minus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  demoCandidate,
  demoRole,
  fixedOpeningQuestion,
  scriptedDemoAnswers,
} from '@/data/demo';
import type { InterviewScorecard } from '@/lib/interview/types';

type ScorecardProps = {
  scorecard?: InterviewScorecard;
  onNewInterview: () => void;
};

const DEFAULT_DEMO_SKILLS = [
  { label: 'React', state: 'Proven', strength: 88, tone: 'verified' as const },
  { label: 'Performance', state: 'Partial', strength: 61, tone: 'partial' as const },
  { label: 'JavaScript', state: 'Partial', strength: 46, tone: 'partial' as const },
  { label: 'Problem Solving', state: 'Unverified', strength: 0, tone: 'open' as const },
  { label: 'Communication', state: 'Unverified', strength: 0, tone: 'open' as const },
];

const DEFAULT_DEMO_QUESTIONS = [
  { source: 'Fixed opener', target: 'React', question: fixedOpeningQuestion, gatePassed: true, usedFallback: false, latencyMs: 140 },
  {
    source: 'Adaptive',
    target: 'Performance',
    question: 'When is memoization actually bad for performance?',
    gatePassed: true,
    usedFallback: false,
    latencyMs: 380,
  },
  {
    source: 'Adaptive',
    target: 'JavaScript',
    question: 'How would you keep stale search responses from replacing newer results?',
    gatePassed: true,
    usedFallback: false,
    latencyMs: 410,
  },
];

export function Scorecard({ scorecard, onNewInterview }: ScorecardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const isLiveScorecard = Boolean(scorecard);

  const candidateName = scorecard?.candidateName ?? demoCandidate.name;
  const roleTitle = scorecard?.roleTitle ?? demoRole.title;
  const company = scorecard?.company ?? demoRole.company;
  const coveragePercent = scorecard?.evidenceCoveragePercent ?? 60;
  const touchedSkillsCount = scorecard?.touchedSkillsCount ?? 3;
  const totalSkillsCount = scorecard?.totalSkillsCount ?? 5;
  const recommendation = scorecard?.recommendation ?? 'Evidence ready for recruiter review.';
  const recommendationReason =
    scorecard?.recommendationReason ??
    'The interview touched three of five target skills. One is supported by strong transcript evidence; two need follow-up before a hiring decision.';

  const skills = scorecard?.skills ?? DEFAULT_DEMO_SKILLS;
  const questions = scorecard?.questionsAudit ?? DEFAULT_DEMO_QUESTIONS;
  const candidateQuotes =
    scorecard?.candidateQuotes && scorecard.candidateQuotes.length > 0
      ? scorecard.candidateQuotes
      : scriptedDemoAnswers.map((answer, index) => ({
          turn: index + 1,
          quote: answer,
          skill: ['React', 'Performance', 'JavaScript'][index] || 'General',
        }));

  const reliabilitySummary = scorecard?.reliabilitySummary ?? {
    totalQuestions: 3,
    totalGateChecks: 12,
    fallbacksTriggered: 0,
    openSkillsCount: 2,
  };

  return (
    <section
      className="mx-auto w-full max-w-[1240px] py-4 sm:py-8 lg:py-10"
      aria-labelledby="scorecard-title"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="brand-mark" aria-hidden="true">
            <AudioWaveform className="h-5 w-5" />
          </span>
          <div>
            <p className="display-type text-base font-semibold tracking-[-0.035em]">
              Interview<span className="text-primary">IQ</span>
            </p>
            <p className="data-type mt-0.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
              Evidence review
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onNewInterview}
          className="h-11 rounded-xl border-border bg-white/65 text-xs font-semibold shadow-sm backdrop-blur"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New interview
        </Button>
      </div>

      <div className="depth-panel relative overflow-hidden rounded-[1.65rem] p-5 sm:p-7 lg:p-9">
        <div className="micro-grid absolute right-0 top-0 h-64 w-72 opacity-35 [mask-image:linear-gradient(225deg,black,transparent_74%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)] lg:items-end">
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                isLiveScorecard
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-accent/15 bg-accent/5 text-[#087461]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isLiveScorecard ? 'Live Session Scorecard' : 'Showcase scorecard · sample data'}
            </div>
            <h1
              id="scorecard-title"
              ref={headingRef}
              tabIndex={-1}
              className="display-type mt-5 max-w-[18ch] text-3xl font-semibold leading-[1.06] tracking-[-0.05em] text-foreground sm:text-5xl"
            >
              {isLiveScorecard ? `Recommendation: ${recommendation}` : 'Evidence ready for recruiter review.'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              {recommendationReason}
            </p>
            {!isLiveScorecard && (
              <p className="mt-3 max-w-2xl rounded-lg border border-primary/12 bg-primary/[0.045] px-3 py-2 text-[11px] leading-5 text-[#53617a]">
                These sample results demonstrate the review experience and were not generated from the interview that just ended.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/65 px-3 py-2 text-[#40506b]">
                <UserRoundCheck className="h-3.5 w-3.5 text-primary" />
                {candidateName}
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-white/65 px-3 py-2 text-[#40506b]">
                <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                {roleTitle} · {company}
              </span>
            </div>
          </div>

          <div className="interactive-surface instrument-surface rounded-2xl p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="data-type text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                  Evidence coverage
                </p>
                <p className="data-type mt-3 text-5xl font-semibold tracking-[-0.06em] text-foreground">
                  {coveragePercent}
                  <span className="text-xl text-primary">%</span>
                </p>
              </div>
              <span className="rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1.5 data-type text-[9px] font-semibold uppercase text-primary">
                {touchedSkillsCount} / {totalSkillsCount} skills
              </span>
            </div>
            <div className="mt-5 grid h-20 grid-cols-5 items-end gap-2" aria-hidden="true">
              {skills.map((skill, index) => (
                <div
                  key={skill.label}
                  className="flex h-full items-end rounded-lg border border-border/70 bg-white/70 p-1.5 shadow-inner"
                  style={{ transform: `translateY(${index % 2 ? 3 : 0}px)` }}
                >
                  <span
                    className={`w-full rounded-md ${
                      skill.tone === 'verified'
                        ? 'bg-accent'
                        : skill.tone === 'partial'
                          ? 'bg-primary'
                          : 'bg-[#d5deeb]'
                    }`}
                    style={{ height: `${Math.max(10, skill.strength)}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] leading-4 text-muted-foreground">
              Coverage reflects the share of role skills with transcript support, not a candidate score.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <section
          className="depth-panel overflow-hidden rounded-[1.35rem]"
          aria-labelledby="skill-review-title"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Layers3 className="h-4 w-4" />
                <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
                  Skill review
                </span>
              </div>
              <h2 id="skill-review-title" className="mt-1.5 text-base font-semibold text-foreground">
                Evidence by requirement
              </h2>
            </div>
            <span className="data-type text-[10px] text-muted-foreground">
              {isLiveScorecard ? 'Verified Session Record' : 'Demo dataset'}
            </span>
          </div>

          <div className="divide-y divide-border/65 px-4 sm:px-5">
            {skills.map((skill) => {
              const Icon =
                skill.tone === 'verified'
                  ? CheckCircle2
                  : skill.tone === 'partial'
                    ? Minus
                    : CircleDashed;
              return (
                <div
                  key={skill.label}
                  className="grid gap-3 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_5.5rem] sm:items-center"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 ${
                        skill.tone === 'verified'
                          ? 'text-accent'
                          : skill.tone === 'partial'
                            ? 'text-primary'
                            : 'text-[#9aa8bf]'
                      }`}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {skill.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8edf5]"
                      role="progressbar"
                      aria-label={`${skill.label} evidence strength`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={skill.strength}
                    >
                      <div
                        className={`h-full rounded-full ${
                          skill.tone === 'verified'
                            ? 'bg-accent'
                            : skill.tone === 'partial'
                              ? 'bg-primary'
                              : 'bg-[#cbd5e3]'
                        }`}
                        style={{ width: `${skill.strength}%` }}
                      />
                    </div>
                    <span className="data-type w-9 text-right text-[10px] font-semibold text-[#40506b]">
                      {skill.strength}%
                    </span>
                  </div>
                  <span className="data-type justify-self-start rounded-md border border-border bg-white/70 px-2 py-1 text-[9px] uppercase text-muted-foreground sm:justify-self-end">
                    {skill.state}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className="depth-panel rounded-[1.35rem] p-5 sm:p-6"
          aria-labelledby="reliability-summary-title"
        >
          <div className="flex items-center gap-2 text-[#087461]">
            <ShieldCheck className="h-4 w-4" />
            <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
              Interview integrity
            </span>
          </div>
          <h2 id="reliability-summary-title" className="mt-1.5 text-base font-semibold text-foreground">
            Reliability summary
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              ['Questions', String(reliabilitySummary.totalQuestions).padStart(2, '0')],
              ['Gate checks', String(reliabilitySummary.totalGateChecks).padStart(2, '0')],
              ['Fallbacks', String(reliabilitySummary.fallbacksTriggered).padStart(2, '0')],
              ['Open skills', String(reliabilitySummary.openSkillsCount).padStart(2, '0')],
            ].map(([label, value]) => (
              <div key={label} className="interactive-surface instrument-surface rounded-xl p-3.5">
                <span className="data-type text-xl font-semibold text-foreground">{value}</span>
                <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {['Relevance', 'Quality', 'Latency', 'Format'].map((gate) => (
              <div
                key={gate}
                className="flex items-center justify-between rounded-lg border border-[#0e9f84]/15 bg-[#0e9f84]/[0.045] px-3 py-2.5"
              >
                <span className="text-xs font-medium text-[#315f57]">{gate}</span>
                <span className="flex items-center gap-1.5 data-type text-[9px] font-semibold uppercase text-[#087461]">
                  <Check className="h-3 w-3" /> Passed
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section
        className="depth-panel mt-5 overflow-hidden rounded-[1.35rem]"
        aria-labelledby="decision-trace-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
                Decision trace
              </span>
            </div>
            <h2 id="decision-trace-title" className="mt-1.5 text-base font-semibold text-foreground">
              Why each question was asked
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Auditable turn history</span>
        </div>

        <div className="grid divide-y divide-border/65 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {questions.map((item, index) => (
            <article key={item.question} className="interactive-surface min-w-0 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="data-type text-[10px] font-semibold text-primary">
                  TURN {String(index + 1).padStart(2, '0')}
                </span>
                <span className="rounded-md bg-[#f0f3f9] px-2 py-1 data-type text-[8px] uppercase text-muted-foreground">
                  {item.source}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-foreground">{item.question}</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Target</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-semibold text-primary">{item.target}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="depth-panel mt-5 rounded-[1.35rem] p-5 sm:p-6"
        aria-labelledby="evidence-excerpts-title"
      >
        <div className="flex items-center gap-2 text-primary">
          <MessageSquareQuote className="h-4 w-4" />
          <span className="data-type text-[10px] font-semibold uppercase tracking-[0.15em]">
            Evidence excerpts
          </span>
        </div>
        <h2 id="evidence-excerpts-title" className="mt-1.5 text-base font-semibold text-foreground">
          Candidate statements linked to the review
        </h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {candidateQuotes.map((quoteItem) => (
            <blockquote
              key={`${quoteItem.turn}-${quoteItem.quote.slice(0, 20)}`}
              className="interactive-surface instrument-surface rounded-xl p-4 text-xs leading-5 text-[#40506b]"
            >
              “{quoteItem.quote}”
              <footer className="data-type mt-3 flex items-center justify-between text-[9px] font-semibold uppercase text-primary">
                <span>Turn {String(quoteItem.turn).padStart(2, '0')}</span>
                <span className="text-muted-foreground">{quoteItem.skill}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#101828] px-5 py-5 text-white shadow-[0_20px_45px_rgba(16,24,40,0.18)] sm:flex-row sm:px-6">
        <div>
          <p className="display-type text-base font-semibold">Continue with human judgment.</p>
          <p className="mt-1 text-xs text-white/60">
            InterviewIQ surfaces evidence; the recruiter owns the hiring decision.
          </p>
        </div>
        <Button
          onClick={onNewInterview}
          className="h-11 w-full justify-between rounded-xl bg-white px-4 text-xs font-semibold text-[#101828] hover:bg-[#f3f6fb] sm:w-auto sm:min-w-48"
        >
          Start another interview
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}
