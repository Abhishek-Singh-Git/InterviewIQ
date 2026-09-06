'use client';

import { useCallback, useRef, useState } from 'react';
import {
  ArrowUpRight,
  AudioLines,
  BriefcaseBusiness,
  Check,
  FileCheck,
  FileText,
  Github,
  Loader2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoRole, demoCandidate } from '@/data/demo';

export type ParsedCvData = {
  candidateName: string | null;
  resumeSummary: string;
  extractedLength: number;
  fileName: string;
};

type QuickstartPreCallCardProps = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
  parsedCv: ParsedCvData | null;
  onCvParsed: (data: ParsedCvData | null) => void;
};

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
  parsedCv,
  onCvParsed,
}: QuickstartPreCallCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvParsing, setCvParsing] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);

  const handleCvUpload = useCallback(
    async (file: File) => {
      setCvParsing(true);
      setCvError(null);

      try {
        const formData = new FormData();
        formData.append('cv', file);

        const response = await fetch('/api/parse-cv', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to parse CV');
        }

        onCvParsed({
          candidateName: data.candidate_name,
          resumeSummary: data.resume_summary,
          extractedLength: data.extracted_length,
          fileName: file.name,
        });
      } catch (err) {
        setCvError(err instanceof Error ? err.message : 'Failed to parse CV');
        onCvParsed(null);
      } finally {
        setCvParsing(false);
      }
    },
    [onCvParsed],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleCvUpload(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleCvUpload],
  );

  const handleRemoveCv = useCallback(() => {
    onCvParsed(null);
    setCvError(null);
  }, [onCvParsed]);

  // Determine display values based on whether a CV was uploaded
  const displayName = parsedCv?.candidateName ?? demoCandidate.name;
  const displayExperience = parsedCv ? 'From uploaded CV' : demoCandidate.experience;
  const displayResume = parsedCv?.resumeSummary ?? demoCandidate.resumeSummary;

  return (
    <section className="mx-auto grid w-full max-w-[1180px] items-center gap-12 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(28rem,0.95fr)] lg:gap-16 lg:py-14">
      <div className="max-w-2xl">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Interview intelligence, live and auditable
        </div>

        <h1 className="display-type max-w-[13ch] text-[clamp(2.65rem,6vw,5.45rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[#101828]">
          Every answer becomes evidence.
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          InterviewIQ listens, verifies, and adapts in real time—so every next
          question has a reason and every hiring signal has a source.
        </p>

        <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
          {[
            ['01', 'Live evidence'],
            ['02', 'Gate-checked'],
            ['03', 'Decision ready'],
          ].map(([number, label]) => (
            <div
              key={number}
              className="interactive-surface instrument-surface rounded-xl px-4 py-3"
            >
              <span className="data-type text-[10px] font-semibold text-primary">
                {number}
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="perspective-stage relative mx-auto w-full max-w-[34rem] lg:mx-0">
        <div className="absolute -left-5 top-12 h-[82%] w-[96%] rotate-[-2deg] rounded-[1.65rem] border border-primary/10 bg-primary/5" />
        <div className="absolute -right-4 top-6 h-[88%] w-[94%] rotate-[2.5deg] rounded-[1.65rem] border border-accent/10 bg-accent/5" />

        <div className="briefing-depth depth-panel relative overflow-hidden rounded-[1.55rem] p-5 sm:p-7">
          <div className="micro-grid absolute right-0 top-0 h-40 w-40 opacity-50 [mask-image:linear-gradient(225deg,black,transparent_72%)]" />

          <div className="relative flex items-center justify-between gap-4 border-b border-border/70 pb-5">
            <div>
              <p className="data-type text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                Session briefing
              </p>
              <h2 className="display-type mt-1.5 text-xl font-semibold tracking-[-0.025em]">
                Frontend interview
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-accent/15 bg-accent/5 px-3 py-1.5 text-xs font-semibold text-accent">
              <span className="status-dot h-1.5 w-1.5 rounded-full bg-accent" />
              Ready
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
            <div className="interactive-surface instrument-surface rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BriefcaseBusiness className="h-4 w-4 text-primary" />
                <span className="data-type text-[10px] uppercase tracking-[0.12em]">
                  Role
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {demoRole.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {demoRole.company}
              </p>
            </div>

            <div className="interactive-surface instrument-surface rounded-xl p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserRound className="h-4 w-4 text-primary" />
                <span className="data-type text-[10px] uppercase tracking-[0.12em]">
                  Candidate
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {displayExperience}
              </p>
            </div>
          </div>

          <div className="interactive-surface relative mt-3 rounded-xl border border-border/70 bg-white/55 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span className="data-type text-[10px] uppercase tracking-[0.12em]">
                Resume signal
              </span>
              {parsedCv && (
                <span className="data-type ml-auto rounded-md border border-accent/15 bg-accent/5 px-1.5 py-0.5 text-[8px] uppercase text-accent">
                  From CV
                </span>
              )}
            </div>
            <p className="mt-2.5 text-sm leading-6 text-[#40506b]">
              {displayResume.length > 300 ? displayResume.slice(0, 300) + '…' : displayResume}
            </p>
          </div>

          <div className="relative mt-3 grid gap-2.5 sm:grid-cols-2" aria-label="Candidate source options">
            <div
              className="interactive-surface group flex min-h-14 items-center gap-3 rounded-xl border border-border/75 bg-white/55 px-3.5 py-3 text-left backdrop-blur-md"
              aria-label="GitHub repository showcase preview. Repository linking is not connected yet."
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#101828] text-white shadow-sm">
                <Github className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground">GitHub repository</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">Add project context</span>
              </span>
              <span className="data-type rounded-md border border-border bg-white/70 px-1.5 py-1 text-[8px] uppercase text-muted-foreground">
                Showcase
              </span>
            </div>

            {/* Hidden file input for PDF upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload candidate CV in PDF format"
            />

            {parsedCv ? (
              /* CV uploaded successfully — show confirmation */
              <div
                className="interactive-surface group flex min-h-14 items-center gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] px-3.5 py-3 text-left backdrop-blur-md"
                role="status"
                aria-label={`CV uploaded: ${parsedCv.fileName}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                  <FileCheck className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {parsedCv.fileName}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    {parsedCv.candidateName ?? 'Candidate'} · {Math.round(parsedCv.extractedLength / 100) / 10}k chars
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleRemoveCv}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border/70 bg-white/70 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remove uploaded CV"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              /* CV not yet uploaded — show upload button */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={cvParsing}
                className="interactive-surface group flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-primary/25 bg-primary/[0.035] px-3.5 py-3 text-left backdrop-blur-md transition-colors hover:border-primary/40 hover:bg-primary/[0.06] disabled:opacity-60"
                aria-label="Upload candidate CV as PDF"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  {cvParsing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-foreground">
                    {cvParsing ? 'Parsing CV…' : 'Upload candidate CV'}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                    PDF format
                  </span>
                </span>
              </button>
            )}
          </div>

          {cvError && (
            <p className="relative mt-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">
              {cvError}
            </p>
          )}

          <div className="relative mt-5">
            <div className="flex items-center justify-between gap-3">
              <span className="data-type text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Evidence targets
              </span>
              <span className="data-type text-[10px] text-muted-foreground">
                {demoRole.requiredSkills.length} skills
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {demoRole.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-white px-2.5 py-1.5 text-xs font-medium text-[#35415a] shadow-[0_1px_2px_rgba(16,24,40,0.03)]"
                >
                  <Check className="h-3 w-3 text-accent" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-6 rounded-xl bg-[#101828] p-1.5 shadow-[0_16px_30px_rgba(16,24,40,0.18)]">
            <Button
              onClick={onStartConversation}
              disabled={isLoading}
              aria-busy={isLoading}
              className="h-[3.25rem] w-full justify-between rounded-[0.72rem] bg-primary px-4 text-sm font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.24)_inset] transition-all hover:-translate-y-0.5 hover:bg-[#3549bd] disabled:hover:translate-y-0 sm:h-14 sm:px-5"
              aria-label={isLoading ? 'Initializing interview session' : 'Launch interview'}
            >
              <span className="flex items-center gap-2.5">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <AudioLines className="h-4 w-4" />
                )}
                {isLoading ? 'Initializing session…' : 'Launch interview'}
              </span>
              {!isLoading && <ArrowUpRight className="h-4 w-4" />}
            </Button>
          </div>

          <div className="relative mt-4 flex items-start gap-2.5 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {parsedCv
              ? 'Questions will be tailored to the uploaded CV. Evidence targets and reliability gates remain active.'
              : 'Workflow preview: questions can be checked for relevance, quality, latency, and format before delivery.'}
          </div>

          {error && (
            <p
              className="relative mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
