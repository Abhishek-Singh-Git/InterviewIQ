'use client';

import { ArrowRight, CircleDot } from 'lucide-react';

export type QuickstartAgentMetric = {
  type: string;
  name: string;
  value: number;
  timestamp: number;
};

type QuickstartPipelineMetricsProps = {
  metrics: QuickstartAgentMetric[];
};

const PIPELINE = [
  { key: 'stt', short: 'STT', provider: 'Deepgram Nova-3', metricTypes: ['stt', 'asr'] },
  { key: 'llm', short: 'LLM', provider: 'GPT-4o mini', metricTypes: ['llm', 'mllm'] },
  { key: 'tts', short: 'TTS', provider: 'MiniMax', metricTypes: ['tts'] },
] as const;

export function QuickstartPipelineMetrics({ metrics }: QuickstartPipelineMetricsProps) {
  const latestByType = new Map<string, QuickstartAgentMetric>();
  for (const metric of metrics) {
    latestByType.set(metric.type.toLowerCase(), metric);
  }

  return (
    <div
      className="grid min-w-0 grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2"
      aria-label="Live voice pipeline latency"
    >
      {PIPELINE.map((step, index) => {
        const metric = step.metricTypes
          .map((type) => latestByType.get(type))
          .find(Boolean);

        return (
          <div key={step.key} className="contents">
            {index > 0 && (
              <ArrowRight className="h-3.5 w-3.5 text-[#9aa8bf]" aria-hidden="true" />
            )}
            <div className="interactive-surface min-w-0 rounded-lg border border-border/75 bg-white/65 px-2.5 py-2 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-2">
                <span className="data-type text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
                  {step.short}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${metric ? 'bg-accent' : 'bg-[#c7d0df]'}`} />
              </div>
              <p className="mt-1 truncate text-[10px] font-medium text-[#40506b]">
                {step.provider}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <CircleDot className="h-3 w-3 text-muted-foreground" />
                <span className="data-type text-[10px] font-semibold text-foreground">
                  {metric ? `${Math.round(metric.value)}ms` : '—'}
                </span>
                <span className="hidden text-[9px] text-muted-foreground sm:inline">
                  {metric ? 'latest' : 'awaiting'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
