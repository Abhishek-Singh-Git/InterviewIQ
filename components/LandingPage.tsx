'use client';

import { useState, useRef, Suspense, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AudioWaveform, LockKeyhole } from 'lucide-react';
import type { RTMClient } from 'agora-rtm';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '../types/conversation';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSkeleton } from './LoadingSkeleton';
import { QuickstartPreCallCard } from './QuickstartPreCallCard';
import { Scorecard } from './Scorecard';

// Dynamically import the ConversationComponent with ssr disabled
const ConversationComponent = dynamic(() => import('./ConversationComponent'), {
  ssr: false,
});

// Dynamically import AgoraRTCProvider (browser-only).
// The AgoraVoiceAI toolkit is initialized inside ConversationComponent after
// the RTC join succeeds, so this wrapper only needs to provide the RTC client.
const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } =
      await import('agora-rtc-react');
    return {
      default: function AgoraProviders({
        children,
      }: {
        children: React.ReactNode;
      }) {
        // useRef persists across StrictMode's simulated unmount/remount, so only
        // one RTC client is ever created per session (useMemo creates two in StrictMode).
        const clientRef = useRef<ReturnType<
          typeof AgoraRTC.createClient
        > | null>(null);
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          });
        }
        return (
          <AgoraRTCProvider client={clientRef.current}>
            {children}
          </AgoraRTCProvider>
        );
      },
    };
  },
  { ssr: false },
);

export default function LandingPage() {
  const [showConversation, setShowConversation] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);

  // Preload heavy modules on mount so they're already cached when the user
  // clicks "Try it Now" — eliminates the ~1.8s dynamic-import delay.
  useEffect(() => {
    import('agora-rtc-react').catch(() => {});
    import('agora-rtm').catch(() => {});
  }, []);

  // Presentation-only spatial response for glass surfaces. Event delegation keeps
  // the effect lightweight as dashboard panels mount and unmount with the session.
  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      window.matchMedia('(pointer: coarse)').matches
    ) {
      return;
    }

    let animationFrame: number | null = null;
    let pendingPointer:
      | { surface: HTMLElement; clientX: number; clientY: number }
      | null = null;

    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const surface = target?.closest<HTMLElement>('.interactive-surface');
      if (!surface) return;

      pendingPointer = {
        surface,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      if (animationFrame !== null) return;

      animationFrame = window.requestAnimationFrame(() => {
        if (pendingPointer) {
          const { surface: activeSurface, clientX, clientY } = pendingPointer;
          const bounds = activeSurface.getBoundingClientRect();
          const x = (clientX - bounds.left) / bounds.width;
          const y = (clientY - bounds.top) / bounds.height;
          activeSurface.style.setProperty('--pointer-x', `${Math.round(x * 100)}%`);
          activeSurface.style.setProperty('--pointer-y', `${Math.round(y * 100)}%`);
          activeSurface.style.setProperty('--tilt-x', `${(0.5 - y) * 3.5}deg`);
          activeSurface.style.setProperty('--tilt-y', `${(x - 0.5) * 4.5}deg`);
        }
        pendingPointer = null;
        animationFrame = null;
      });
    };

    const handlePointerOut = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const surface = target?.closest<HTMLElement>('.interactive-surface');
      if (!surface || surface.contains(event.relatedTarget as Node | null)) return;
      surface.style.removeProperty('--tilt-x');
      surface.style.removeProperty('--tilt-y');
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerout', handlePointerOut);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerout', handlePointerOut);
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
    };
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [agentJoinError, setAgentJoinError] = useState(false);

  const handleStartConversation = async () => {
    setIsLoading(true);
    setError(null);
    setAgentJoinError(false);
    setShowScorecard(false);

    try {
      // 1. Fetch RTC token + channel
      // console.log('Fetching Agora token...');
      const agoraResponse = await fetch('/api/generate-agora-token');
      const responseData = await agoraResponse.json();
      // console.log('Agora token response: uid =', responseData.uid, 'channel =', responseData.channel);

      if (!agoraResponse.ok) {
        throw new Error(
          `Failed to generate Agora token: ${JSON.stringify(responseData)}`,
        );
      }

      // 2. Run agent invite and RTM setup in parallel — both only need the token response.
      //    RTM must be ready before ConversationComponent mounts so AgoraVoiceAI
      //    can subscribe immediately. Agent invite is non-fatal.
      const [agentData, rtm] = await Promise.all([
        // 2a. Start the AI agent
        fetch('/api/invite-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requester_id: responseData.uid,
            channel_name: responseData.channel,
          } as ClientStartRequest),
        })
          .then(async (res) => {
            if (!res.ok) {
              setAgentJoinError(true);
              return null;
            }
            return res.json() as Promise<AgentResponse>;
          })
          .catch((err) => {
            console.error('Failed to start conversation with agent:', err);
            setAgentJoinError(true);
            return null;
          }),

        // 2b. Set up RTM (dynamically imported to keep it client-only)
        (async () => {
          const { default: AgoraRTM } = await import('agora-rtm');
          const rtm: RTMClient = new AgoraRTM.RTM(
            process.env.NEXT_PUBLIC_AGORA_APP_ID!,
            responseData.uid,
          );
          await rtm.login({ token: responseData.token });
          await rtm.subscribe(responseData.channel);
          // console.log('RTM ready, channel:', responseData.channel);
          return rtm;
        })(),
      ]);

      // 3. All dependencies ready — store state and show conversation
      setRtmClient(rtm);
      setAgoraData({ ...responseData, agentId: agentData?.agent_id });
      setShowConversation(true);
    } catch (err) {
      setError('Failed to start conversation. Please try again.');
      console.error('Error starting conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel;
        if (!channel) {
          throw new Error('Missing channel for token renewal');
        }

        // RTC and RTM tokens are renewed independently:
        //   - RTC uses the browser client's assigned UID (passed in from ConversationComponent).
        //   - RTM uses the same UID that was used during RTM login (agoraData.uid).
        // Both are fetched in parallel to stay within the token-expiry grace-period window.
        const [rtcResponse, rtmResponse] = await Promise.all([
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${uid}`),
          fetch(`/api/generate-agora-token?channel=${channel}&uid=${agoraData.uid}`),
        ]);
        const [rtcData, rtmData] = await Promise.all([
          rtcResponse.json(),
          rtmResponse.json(),
        ]);

        if (!rtcResponse.ok || !rtmResponse.ok) {
          throw new Error('Failed to generate renewal tokens');
        }

        return {
          rtcToken: rtcData.token,
          rtmToken: rtmData.token,
        };
      } catch (error) {
        console.error('Error renewing token:', error);
        throw error;
      }
    },
    [agoraData],
  );

  const [scorecard, setScorecard] = useState<import('@/lib/interview/types').InterviewScorecard | null>(null);

  const handleEndConversation = async (finalScorecard?: import('@/lib/interview/types').InterviewScorecard) => {
    if (finalScorecard) {
      setScorecard(finalScorecard);
    }
    // Stop the AI agent
    if (agoraData?.agentId) {
      try {
        // console.log('Stopping agent:', agoraData.agentId);
        const response = await fetch('/api/stop-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agoraData.agentId }),
        });
        if (!response.ok) {
          console.error('Failed to stop agent:', await response.text());
        }
        // else console.log('Agent stopped successfully');
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }

    // Tear down RTM — owned here since we created it here
    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
    setRtmClient(null);
    setShowConversation(false);
    setShowScorecard(true);
  };

  const handleNewInterview = () => {
    setShowScorecard(false);
    setScorecard(null);
    setAgoraData(null);
    setAgentJoinError(false);
    setError(null);
  };

  return (
    <div
      className={`app-canvas relative flex min-h-dvh flex-col overflow-x-hidden text-foreground ${
        showConversation ? 'conversation-app-shell' : ''
      }`}
    >
      {!showConversation && !showScorecard && (
        <header className="relative z-20 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              <AudioWaveform className="h-5 w-5" />
            </span>
            <div>
              <p className="display-type text-[1.05rem] font-semibold tracking-[-0.035em] text-[#101828]">
                Interview<span className="text-primary">IQ</span>
              </p>
              <p className="data-type mt-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                Adaptive interview system
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/65 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur sm:flex">
            <LockKeyhole className="h-3.5 w-3.5 text-accent" />
            Evidence-first evaluation
          </div>
        </header>
      )}

      <main
        className={`relative z-10 flex min-h-0 flex-1 flex-col ${
          showConversation
            ? 'w-full items-stretch xl:h-full'
            : 'mx-auto w-full max-w-[1280px] justify-center px-5 pb-10 sm:px-8 lg:px-12'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          {showScorecard ? (
            <Scorecard scorecard={scorecard ?? undefined} onNewInterview={handleNewInterview} />
          ) : !showConversation ? (
            <QuickstartPreCallCard
              isLoading={isLoading}
              error={error}
              onStartConversation={handleStartConversation}
            />
          ) : agoraData && rtmClient ? (
            <>
              {/* Non-fatal invite warning: the browser session can still render even if agent start failed. */}
              {agentJoinError && (
                <div
                  className="fixed left-1/2 top-20 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-destructive/20 bg-white/95 p-3 text-sm text-destructive shadow-xl backdrop-blur-xl"
                  role="alert"
                >
                  Failed to connect with AI agent. The conversation may not work
                  as expected.
                </div>
              )}
              {/* Browser-only conversation mount: RTC provider, error boundary, and lazy-loaded call UI. */}
              <Suspense fallback={<LoadingSkeleton />}>
                <ErrorBoundary>
                  <AgoraProvider>
                    <ConversationComponent
                      agoraData={agoraData}
                      rtmClient={rtmClient}
                      onTokenWillExpire={handleTokenWillExpire}
                      onEndConversation={handleEndConversation}
                    />
                  </AgoraProvider>
                </ErrorBoundary>
              </Suspense>
            </>
          ) : (
            /* Fallback if session bootstrap partially succeeded but required state is missing. */
            <p className="text-sm text-muted-foreground">
              Failed to load conversation data.
            </p>
          )}
        </div>
      </main>

      {!showConversation && !showScorecard && (
        <footer className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-2 px-5 pb-6 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:gap-4 sm:px-8 lg:px-12">
          <span className="data-type uppercase tracking-[0.13em]">
            Structured evidence · auditable decisions
          </span>
          <a
            href="https://agora.io/en/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            Real-time media by Agora
          </a>
        </footer>
      )}
    </div>
  );
}
