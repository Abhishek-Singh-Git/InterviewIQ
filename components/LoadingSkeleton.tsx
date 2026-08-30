'use client';

const BARS = [34, 58, 42, 76, 55, 88, 63, 44, 71, 52];

export function LoadingSkeleton() {
  return (
    <div className="flex min-h-dvh w-full animate-pulse flex-col p-3 sm:p-4">
      <div className="h-16 rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl" />

      <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(21rem,0.78fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="depth-panel flex min-h-80 flex-1 flex-col items-center justify-center rounded-[1.35rem] p-6">
            <div className="h-3 w-28 rounded bg-primary/10" />
            <div className="mt-8 flex h-24 items-end justify-center gap-2">
              {BARS.map((height, index) => (
                <div
                  key={`${height}-${index}`}
                  className="w-2 rounded-full bg-primary/15"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="mt-6 h-5 w-32 rounded bg-muted" />
            <div className="mt-3 h-3 w-52 rounded bg-muted/80" />
          </div>
          <div className="depth-panel min-h-80 flex-1 rounded-[1.35rem] p-5">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="mt-7 space-y-3">
              {[80, 64, 90].map((width) => (
                <div key={width} className="rounded-xl border border-border/60 bg-white/60 p-4">
                  <div className="h-3 w-24 rounded bg-muted" />
                  <div className="mt-3 h-3 rounded bg-muted/80" style={{ width: `${width}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="depth-panel min-h-[34rem] rounded-[1.35rem] p-5">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="mt-7 space-y-3">
            {[88, 61, 46, 0, 0].map((value, index) => (
              <div key={`${value}-${index}`} className="rounded-xl border border-border/60 bg-white/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-28 rounded bg-muted" />
                  <div className="h-3 w-8 rounded bg-muted" />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary/20" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
