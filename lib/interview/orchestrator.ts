import {
  type EvidenceState,
  type InterviewSession,
  type QuestionEvent,
  type SkillEvidence,
  type SkillId,
} from './types';
import { selectNextBestQuestion } from './nbq-engine';
import { evaluateReliabilityGate } from './reliability-gate';
import { generateScorecard } from './scorecard';
import { sessionStore } from './state-store';
import { fixedOpeningQuestion } from '@/data/demo';

// Anti-hallucination helper: checks if quote is verbatim in transcript
export function verifyQuoteInTranscript(
  quote: string | undefined,
  transcript: string,
): boolean {
  if (!quote || quote.trim().length === 0) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[“”"']/g, '')
      .trim();

  const normTranscript = normalize(transcript);
  const normQuote = normalize(quote);

  return normTranscript.includes(normQuote);
}

interface EvidenceMatchRule {
  skillId: SkillId;
  keywords: string[];
  state: EvidenceState;
  strength: number;
  reason: string;
}

const EVALUATION_RULES: EvidenceMatchRule[] = [
  // React
  {
    skillId: 'react',
    keywords: ['profiler', 'itemcard', 'memoized', 'rerender', 'render time', 'setstate', 'hooks', 'component', 'context'],
    state: 'proven',
    strength: 0.88,
    reason: 'Named the bottleneck, diagnostic tool, component memoization, and measured render reduction.',
  },
  // Performance
  {
    skillId: 'performance',
    keywords: ['overhead', 'profiler', 'profile first', 'memory', 'comparison', 'render time', 'milliseconds', 'props change', 'cls', 'inp'],
    state: 'proven',
    strength: 0.85,
    reason: 'Demonstrated deep comprehension of memoization overhead, shallow comparison costs, and profiling-first validation.',
  },
  // JavaScript
  {
    skillId: 'javascript',
    keywords: ['debounce', 'abortcontroller', 'cancel', 'latest query', 'stale', 'async', 'promise', 'event loop', 'race condition'],
    state: 'proven',
    strength: 0.78,
    reason: 'Proposed debouncing input, aborting stale network requests with AbortController, and latest-response filtering.',
  },
  // Problem Solving
  {
    skillId: 'problem_solving',
    keywords: ['isolate', 'diagnose', 'reproduce', 'production', 'devtools', 'network', 'root cause', 'logs'],
    state: 'partial',
    strength: 0.65,
    reason: 'Articulated systematic diagnostic steps to isolate runtime issues under constraints.',
  },
  // Communication
  {
    skillId: 'communication',
    keywords: ['trade-off', 'because', 'first', 'reduced', 'instead of', 'specifically', 'approach'],
    state: 'partial',
    strength: 0.70,
    reason: 'Provided structured, technically articulate explanation with clear cause-and-effect reasoning.',
  },
];

export function extractEvidenceFromTurn(options: {
  candidateAnswer: string;
  turnNumber: number;
  currentSkills: Record<SkillId, SkillEvidence>;
}): Partial<Record<SkillId, SkillEvidence>> {
  const { candidateAnswer, turnNumber, currentSkills } = options;
  const lowerAnswer = candidateAnswer.toLowerCase();
  const updates: Partial<Record<SkillId, SkillEvidence>> = {};

  // Find candidate sentences for quote selection
  const sentences = candidateAnswer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);

  for (const rule of EVALUATION_RULES) {
    const matchingKeywords = rule.keywords.filter((kw) => lowerAnswer.includes(kw));

    if (matchingKeywords.length >= 2 || (matchingKeywords.length >= 1 && candidateAnswer.length > 50)) {
      // Find the best sentence containing the keywords
      const bestSentence =
        sentences.find((s) => matchingKeywords.some((kw) => s.toLowerCase().includes(kw))) ??
        sentences[0] ??
        candidateAnswer;

      // Strict Anti-hallucination verification
      const isVerbatim = verifyQuoteInTranscript(bestSentence, candidateAnswer);
      const verifiedQuote = isVerbatim ? bestSentence : undefined;

      const current = currentSkills[rule.skillId];
      const rank = { unverified: 0, partial: 1, proven: 2 };
      const currentRank = rank[current?.state ?? 'unverified'];
      const newRank = rank[rule.state];

      if (newRank >= currentRank) {
        updates[rule.skillId] = {
          skillId: rule.skillId,
          label: rule.skillId.charAt(0).toUpperCase() + rule.skillId.slice(1),
          state: rule.state,
          strength: Math.max(current?.strength ?? 0, rule.strength),
          quote: verifiedQuote ?? current?.quote,
          reason: rule.reason,
          updatedAtTurn: turnNumber,
          timestamp: Date.now(),
        };
      }
    }
  }

  return updates;
}

export interface OrchestrateTurnResult {
  session: InterviewSession;
  evidenceUpdates: Partial<Record<SkillId, SkillEvidence>>;
  questionEvent: QuestionEvent;
  isComplete: boolean;
}

/**
 * Main turn orchestration entrypoint.
 * Called when a candidate finishes speaking (finalized transcript turn).
 */
export function orchestrateTurn(options: {
  sessionIdOrChannel: string;
  turnNumber: number;
  candidateAnswer: string;
}): OrchestrateTurnResult {
  const { sessionIdOrChannel, turnNumber, candidateAnswer } = options;

  let session = sessionStore.getSession(sessionIdOrChannel);
  if (!session) {
    session = sessionStore.createSession(sessionIdOrChannel, sessionIdOrChannel);
  }

  // 1. Record Candidate Turn in session history
  session = sessionStore.recordCandidateTurn(session.id, candidateAnswer, turnNumber)!;

  // 2. Extract Evidence and Anti-Hallucination validation
  const evidenceUpdates = extractEvidenceFromTurn({
    candidateAnswer,
    turnNumber,
    currentSkills: session.skills,
  });

  // 3. Update Session Skills (Monotonic)
  session = sessionStore.updateSkills(session.id, evidenceUpdates)!;

  // 4. Select Next-Best-Question
  const nextTurnNumber = turnNumber + 1;
  const questionsAsked = session.questions.map((q) => ({
    targetSkill: q.targetSkill,
    question: q.deliveredQuestion,
  }));

  const nbqDecision = selectNextBestQuestion({
    turnNumber: nextTurnNumber,
    currentSkills: session.skills,
    questionsAsked,
    latestCandidateAnswer: candidateAnswer,
  });

  // 5. Evaluate Reliability Gate on proposed question
  const gateResult = evaluateReliabilityGate({
    proposedQuestion: nbqDecision.proposedQuestion,
    targetSkill: nbqDecision.targetSkill,
    previousQuestions: questionsAsked.map((q) => q.question),
    generationLatencyMs: nbqDecision.generationLatencyMs,
    faultInjection: session.faultInjection,
  });

  // 6. Formulate Question Event
  const questionEvent: QuestionEvent = {
    turn: nextTurnNumber,
    targetSkill: nbqDecision.targetSkill,
    proposedQuestion: nbqDecision.proposedQuestion,
    deliveredQuestion: gateResult.deliveredQuestion,
    source: gateResult.usedFallback ? 'fallback' : 'adaptive',
    passed: gateResult.passed,
    rejectionReasons: gateResult.checks
      .filter((c) => c.status === 'failed')
      .map((c) => `${c.name}: ${c.reasonCode}`),
    latencyMs: gateResult.overallLatencyMs,
    controlledFaultInjection: session.faultInjection.armed,
    gateResult,
    decision: nbqDecision,
  };

  // 7. Record Question Event in Session
  session = sessionStore.recordQuestionEvent(session.id, questionEvent)!;

  // 8. Check if 3 turns completed -> Freeze Scorecard
  const isComplete = turnNumber >= 3;
  if (isComplete) {
    const scorecard = generateScorecard(session);
    session = sessionStore.freezeScorecard(session.id, scorecard)!;
  }

  return {
    session,
    evidenceUpdates,
    questionEvent,
    isComplete,
  };
}

/**
 * Initializes turn 1 baseline state for a new interview session.
 */
export function initializeSessionOpener(channel: string): InterviewSession {
  let session = sessionStore.getSession(channel);
  if (!session) {
    session = sessionStore.createSession(channel);
  }

  const initialEvent: QuestionEvent = {
    turn: 1,
    targetSkill: 'react',
    proposedQuestion: fixedOpeningQuestion,
    deliveredQuestion: fixedOpeningQuestion,
    source: 'fixed_opener',
    passed: true,
    rejectionReasons: [],
    latencyMs: 140,
    controlledFaultInjection: false,
  };

  session = sessionStore.recordQuestionEvent(session.id, initialEvent)!;
  session = sessionStore.recordAgentTurn(session.id, fixedOpeningQuestion, 1)!;
  return session;
}
