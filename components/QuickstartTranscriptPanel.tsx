'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, AudioLines, Radio } from 'lucide-react';
import { demoCandidate } from '@/data/demo';

type TranscriptMessage = {
  turn_id?: string | number;
  uid: number;
  text?: string;
  createdAt?: number;
};

type QuickstartTranscriptPanelProps = {
  messageList: TranscriptMessage[];
  currentInProgressMessage: TranscriptMessage | null;
  agentUID: string;
};

function formatMessageTime(createdAt?: number) {
  if (!createdAt) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(createdAt));
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

export function QuickstartTranscriptPanel({
  messageList,
  currentInProgressMessage,
  agentUID,
}: QuickstartTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const announcedTurnCountRef = useRef(0);
  const [isFollowing, setIsFollowing] = useState(true);
  const [turnAnnouncement, setTurnAnnouncement] = useState('');
  const messages = useMemo(
    () =>
      currentInProgressMessage
        ? [...messageList, currentInProgressMessage]
        : messageList,
    [currentInProgressMessage, messageList],
  );

  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !isFollowing) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: preferredScrollBehavior(),
    });
  }, [messages, isFollowing]);

  useEffect(() => {
    const nextCount = messageList.length;
    if (nextCount > announcedTurnCountRef.current) {
      const latestMessage = messageList[nextCount - 1];
      const speaker =
        String(latestMessage?.uid) === agentUID
          ? 'Interviewer'
          : demoCandidate.name;
      const text = latestMessage?.text?.trim();
      if (text) setTurnAnnouncement(`${speaker}: ${text}`);
    }
    announcedTurnCountRef.current = nextCount;
  }, [agentUID, messageList]);

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const distanceFromBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
    setIsFollowing(distanceFromBottom < 72);
  };

  const jumpToLive = () => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({
      top: node.scrollHeight,
      behavior: preferredScrollBehavior(),
    });
    setIsFollowing(true);
  };

  return (
    <section
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden"
      aria-labelledby="transcript-title"
    >
      <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/15 bg-primary/5 text-primary">
            <AudioLines className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="transcript-title" className="text-sm font-semibold text-foreground">
                Live transcript
              </h2>
              <span className="data-type rounded-md bg-[#f0f3f9] px-1.5 py-0.5 text-[9px] text-muted-foreground">
                {messageList.length} turns
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Source record for evidence extraction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-accent/15 bg-accent/5 px-2.5 py-1.5 text-[#087461]">
          <Radio className="h-3 w-3" />
          <span className="data-type text-[9px] font-semibold uppercase tracking-[0.1em]">
            Capturing
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4"
        role="log"
        aria-live="off"
        aria-relevant="additions"
        aria-label="Interview transcript"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center px-6 text-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl border border-primary/15 bg-primary/5 text-primary shadow-[0_12px_24px_rgba(66,86,208,0.1)]">
              <AudioLines className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-accent" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">Transcript standing by</p>
            <p className="mt-1.5 max-w-xs text-xs leading-5 text-muted-foreground">
              The candidate’s first answer will appear here as a structured interview record.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {messages.map((message, index) => {
              const isAgent = String(message.uid) === agentUID;
              const isStreaming = message === currentInProgressMessage;
              const label = isAgent ? 'Interviewer' : demoCandidate.name;
              const text = message.text?.trim();
              const time = formatMessageTime(message.createdAt);

              return (
                <article
                  key={`${message.turn_id ?? message.uid}-${index}`}
                  className={`grid min-w-0 gap-2.5 rounded-xl border px-3 py-3 sm:grid-cols-[6.8rem_minmax(0,1fr)] sm:gap-4 sm:px-4 ${
                    isAgent
                      ? 'border-primary/12 bg-primary/[0.035]'
                      : 'border-border/80 bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 sm:block">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isAgent ? 'bg-primary' : 'bg-accent'
                        }`}
                      />
                      <span className="text-[11px] font-semibold text-[#35415a]">{label}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 pl-4 sm:pl-0">
                      {time && (
                        <span className="data-type text-[9px] text-muted-foreground">{time}</span>
                      )}
                      {isStreaming && (
                        <span className="data-type text-[8px] font-semibold uppercase tracking-[0.1em] text-primary">
                          Live
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="min-w-0 whitespace-pre-wrap text-sm leading-6 text-[#2d3950]">
                    {text || (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
                        <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
                        <span className="h-1 w-1 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
                      </span>
                    )}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {turnAnnouncement}
      </p>

      {!isFollowing && (
        <button
          type="button"
          onClick={jumpToLive}
          className="absolute bottom-4 left-1/2 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-2 text-xs font-semibold text-primary shadow-lg"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Jump to live
        </button>
      )}
    </section>
  );
}
