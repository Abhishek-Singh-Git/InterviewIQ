import { z } from 'zod';

export type SkillId =
  | 'react'
  | 'javascript'
  | 'performance'
  | 'problem_solving'
  | 'communication';

export const SKILL_IDS: SkillId[] = [
  'react',
  'javascript',
  'performance',
  'problem_solving',
  'communication',
];

export const SKILL_LABELS: Record<SkillId, string> = {
  react: 'React',
  javascript: 'JavaScript',
  performance: 'Performance',
  problem_solving: 'Problem Solving',
  communication: 'Communication',
};

export type EvidenceState = 'unverified' | 'partial' | 'proven';

export interface SkillEvidence {
  skillId: SkillId;
  label: string;
  state: EvidenceState;
  /** Evidence strength signal, 0..1. Not a probability about the candidate. */
  strength: number;
  quote?: string;
  reason?: string;
  updatedAtTurn?: number;
  timestamp?: number;
}

export type GateCheckName =
  | 'Format'
  | 'Relevance'
  | 'Repetition'
  | 'Latency'
  | 'Quality';

export type GateStatus = 'passed' | 'failed' | 'pending';

export interface GateCheckResult {
  name: GateCheckName;
  status: GateStatus;
  reasonCode: string;
  explanation: string;
  measuredValue?: string | number;
}

export interface ReliabilityGateResult {
  passed: boolean;
  checks: GateCheckResult[];
  overallLatencyMs: number;
  proposedQuestion: string;
  deliveredQuestion: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

export interface NBQDecision {
  turnNumber: number;
  targetSkill: SkillId;
  objective: string;
  evidenceGap: string;
  proposedQuestion: string;
  decisionReason: string;
  generationLatencyMs: number;
  candidateContextUsed?: string;
  usedFallback: boolean;
}

export type SessionStatus =
  | 'ready'
  | 'connecting'
  | 'live'
  | 'completed'
  | 'failed';

export interface TranscriptEntry {
  turnId: number;
  role: 'agent' | 'candidate';
  text: string;
  final: boolean;
  timestamp: number;
}

export type FaultInjectionType =
  | 'none'
  | 'multi_question'
  | 'repetition'
  | 'low_relevance'
  | 'artificial_latency'
  | 'yes_no_question';

export interface FaultInjectionConfig {
  armed: boolean;
  type: FaultInjectionType;
  targetTurn?: number;
}

export interface QuestionEvent {
  turn: number;
  targetSkill: SkillId;
  proposedQuestion: string;
  deliveredQuestion: string;
  source: 'adaptive' | 'fallback' | 'fixed_opener';
  passed: boolean;
  rejectionReasons: string[];
  latencyMs: number;
  controlledFaultInjection: boolean;
  gateResult?: ReliabilityGateResult;
  decision?: NBQDecision;
}

export type RecommendationType =
  | 'Advance'
  | 'Targeted follow-up required'
  | 'Insufficient evidence';

export interface ScorecardSkillSummary {
  skillId: SkillId;
  label: string;
  state: EvidenceState;
  strength: number; // 0..100
  tone: 'verified' | 'partial' | 'open';
  quote?: string;
  reason?: string;
  turn?: number;
}

export interface InterviewScorecard {
  sessionId: string;
  candidateName: string;
  roleTitle: string;
  company: string;
  completedTurns: number;
  evidenceCoveragePercent: number;
  touchedSkillsCount: number;
  totalSkillsCount: number;
  overallScore: number; // 0..100
  recommendation: RecommendationType;
  recommendationReason: string;
  skills: ScorecardSkillSummary[];
  questionsAudit: {
    turn: number;
    source: string;
    target: string;
    question: string;
    gatePassed: boolean;
    usedFallback: boolean;
    latencyMs: number;
  }[];
  candidateQuotes: {
    turn: number;
    quote: string;
    skill: string;
  }[];
  reliabilitySummary: {
    totalQuestions: number;
    totalGateChecks: number;
    gatePassRate: number; // 0..100
    fallbacksTriggered: number;
    openSkillsCount: number;
  };
  createdAt: number;
}

export interface InterviewSession {
  id: string;
  channel: string;
  status: SessionStatus;
  answerCount: number;
  targetSkill?: SkillId;
  decisionReason?: string;
  skills: Record<SkillId, SkillEvidence>;
  questions: QuestionEvent[];
  transcript: TranscriptEntry[];
  currentDecision?: NBQDecision;
  currentGateResult?: ReliabilityGateResult;
  faultInjection: FaultInjectionConfig;
  scorecard?: InterviewScorecard;
  createdAt: number;
  updatedAt: number;
}

/** Initial skill evidence state for a new session. */
export function createInitialSkills(): Record<SkillId, SkillEvidence> {
  return Object.fromEntries(
    SKILL_IDS.map((id) => [
      id,
      {
        skillId: id,
        label: SKILL_LABELS[id],
        state: 'unverified' as EvidenceState,
        strength: 0,
        timestamp: Date.now(),
      },
    ]),
  ) as Record<SkillId, SkillEvidence>;
}

// Zod Schemas for Validation
export const CandidateEvidenceExtractionSchema = z.object({
  evaluations: z.array(
    z.object({
      skillId: z.enum([
        'react',
        'javascript',
        'performance',
        'problem_solving',
        'communication',
      ]),
      observedState: z.enum(['unverified', 'partial', 'proven']),
      confidence: z.number().min(0).max(1),
      exactQuote: z.string().optional(),
      reason: z.string(),
    }),
  ),
  suggestedNextTarget: z.enum([
    'react',
    'javascript',
    'performance',
    'problem_solving',
    'communication',
  ]).optional(),
});

export type CandidateEvidenceExtraction = z.infer<
  typeof CandidateEvidenceExtractionSchema
>;
