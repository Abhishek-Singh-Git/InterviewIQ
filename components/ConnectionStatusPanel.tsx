'use client';

import { useEffect, useRef } from 'react';
import { ChevronDown, Wifi, WifiOff, X } from 'lucide-react';
import { ConversationErrorCard, type ConnectionIssue } from './ConversationErrorCard';

type ConnectionStatusPanelProps = {
  connectionState: string;
  connectionSeverity: 'normal' | 'warning' | 'error';
  connectionIssues: ConnectionIssue[];
  isOpen: boolean;
  onToggle: () => void;
};

function getConnectionLabel(
  connectionState: string,
  connectionSeverity: 'normal' | 'warning' | 'error',
): string {
  if (connectionSeverity !== 'normal' && connectionState === 'CONNECTED') {
    return 'Connected · issues detected';
  }
  if (connectionState === 'CONNECTED') return 'Connected';
  if (connectionState === 'CONNECTING') return 'Connecting';
  if (connectionState === 'RECONNECTING') return 'Reconnecting';
  if (connectionState === 'DISCONNECTING') return 'Disconnecting';
  return 'Disconnected';
}

export function ConnectionStatusPanel({
  connectionState,
  connectionSeverity,
  connectionIssues,
  isOpen,
  onToggle,
}: ConnectionStatusPanelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const label = getConnectionLabel(connectionState, connectionSeverity);
  const isDisconnected =
    connectionState === 'DISCONNECTED' || connectionState === 'DISCONNECTING';

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) onToggle();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      onToggle();
      triggerRef.current?.focus();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onToggle]);

  const tone =
    connectionSeverity === 'normal'
      ? 'border-[#0e9f84]/20 bg-[#0e9f84]/[0.06] text-[#087461]'
      : connectionSeverity === 'warning'
        ? 'border-[#d9772b]/20 bg-[#d9772b]/[0.07] text-[#9a4f1c]'
        : 'border-destructive/20 bg-destructive/[0.06] text-destructive';

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Connection status: {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        className={`flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl border px-2.5 text-xs font-semibold transition-colors sm:px-3 ${tone}`}
        aria-label={`Connection status: ${label}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={isOpen ? 'connection-details-panel' : undefined}
        onClick={onToggle}
      >
        {isDisconnected ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
        <span className="hidden lg:inline">{label}</span>
        <ChevronDown className={`hidden h-3 w-3 transition-transform lg:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="connection-details-panel"
          className="fixed left-3 right-3 top-24 z-50 rounded-xl border border-border bg-white/95 p-4 shadow-[0_24px_70px_rgba(24,37,67,0.2)] backdrop-blur-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[25rem]"
          role="dialog"
          aria-label="Connection details"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-3">
            <div>
              <p className="data-type text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                Channel health
              </p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">{label}</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                RTC state: {connectionState.toLowerCase()}
              </p>
            </div>
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={onToggle}
              aria-label="Close connection details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {connectionIssues.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#0e9f84]/15 bg-[#0e9f84]/[0.05] px-3 py-3 text-xs text-[#315f57]">
              <span className="h-2 w-2 rounded-full bg-accent" />
              No RTM or voice-agent issues reported.
            </div>
          ) : (
            <div className="scrollbar-thin mt-3 max-h-64 space-y-2 overflow-auto pr-1">
              {connectionIssues.map((issue) => (
                <ConversationErrorCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
