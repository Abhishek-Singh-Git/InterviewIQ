// InterviewIQ — Core TypeScript types for the interview session.
// These types define the data model from the PRD and are used across
// the orchestrator, UI, and API routes.

export type SkillId =
  | "react"
  | "javascript"
  | "performance"
  | "problem_solving"
  | "communication";

export type EvidenceState = "unverified" | "partial" | "proven";

export interface SkillEvidence {
  skillId: SkillId;
  label: string;
  state: EvidenceState;
  /** Evidence strength signal, 0..1. Not a probability about the candidate. */
  strength: number;
  quote?: string;
  reason?: string;
  updatedAtTurn?: number;
}

export interface QuestionEvent {
  turn: number;
  targetSkill: SkillId;
  proposedQuestion: string;
  deliveredQuestion: string;
  source: "adaptive" | "fallback" | "fixed_opener";
  passed: boolean;
  rejectionReasons: string[];
  latencyMs: number;
  controlledFaultInjection: boolean;
}

export type SessionStatus =
  | "ready"
  | "connecting"
  | "live"
  | "completed"
  | "failed";

export interface TranscriptEntry {
  role: "agent" | "candidate";
  text: string;
  final: boolean;
}

export interface FaultInjection {
  armed: boolean;
  reason?: "low_relevance";
}

export interface InterviewSession {
  id: string;
  status: SessionStatus;
  answerCount: number;
  targetSkill?: SkillId;
  decisionReason?: string;
  skills: Record<SkillId, SkillEvidence>;
  questions: QuestionEvent[];
  transcript: TranscriptEntry[];
  faultInjection: FaultInjection;
}

/** Initial skill evidence state for a new demo session. */
export function createInitialSkills(): Record<SkillId, SkillEvidence> {
  const skills: [SkillId, string][] = [
    ["react", "React"],
    ["javascript", "JavaScript"],
    ["performance", "Performance"],
    ["problem_solving", "Problem Solving"],
    ["communication", "Communication"],
  ];

  return Object.fromEntries(
    skills.map(([id, label]) => [
      id,
      { skillId: id, label, state: "unverified" as EvidenceState, strength: 0 },
    ])
  ) as Record<SkillId, SkillEvidence>;
}
