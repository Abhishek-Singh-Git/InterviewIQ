import {
  createInitialSkills,
  type InterviewScorecard,
  type InterviewSession,
  type QuestionEvent,
  type SkillEvidence,
  type SkillId,
  type TranscriptEntry,
  type FaultInjectionConfig,
} from './types';

export interface ISessionStore {
  createSession(channel: string, id?: string): InterviewSession;
  getSession(sessionIdOrChannel: string): InterviewSession | undefined;
  updateSession(sessionIdOrChannel: string, update: Partial<InterviewSession>): InterviewSession | undefined;
  recordCandidateTurn(
    sessionIdOrChannel: string,
    transcript: string,
    turnId: number,
  ): InterviewSession | undefined;
  recordAgentTurn(
    sessionIdOrChannel: string,
    questionText: string,
    turnId: number,
  ): InterviewSession | undefined;
  updateSkills(
    sessionIdOrChannel: string,
    skills: Partial<Record<SkillId, SkillEvidence>>,
  ): InterviewSession | undefined;
  recordQuestionEvent(
    sessionIdOrChannel: string,
    event: QuestionEvent,
  ): InterviewSession | undefined;
  freezeScorecard(
    sessionIdOrChannel: string,
    scorecard: InterviewScorecard,
  ): InterviewSession | undefined;
  setFaultInjection(
    sessionIdOrChannel: string,
    config: FaultInjectionConfig,
  ): InterviewSession | undefined;
  deleteSession(sessionIdOrChannel: string): boolean;
}

class InMemorySessionStore implements ISessionStore {
  private sessions = new Map<string, InterviewSession>();
  private channelIndex = new Map<string, string>(); // channel -> sessionId

  createSession(channel: string, id?: string): InterviewSession {
    const sessionId = id ?? `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const session: InterviewSession = {
      id: sessionId,
      channel,
      status: 'live',
      answerCount: 0,
      skills: createInitialSkills(),
      questions: [],
      transcript: [],
      faultInjection: {
        armed: false,
        type: 'none',
      },
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(sessionId, session);
    this.channelIndex.set(channel, sessionId);
    return session;
  }

  getSession(sessionIdOrChannel: string): InterviewSession | undefined {
    const sessionId = this.channelIndex.get(sessionIdOrChannel) ?? sessionIdOrChannel;
    return this.sessions.get(sessionId);
  }

  updateSession(
    sessionIdOrChannel: string,
    update: Partial<InterviewSession>,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const updated: InterviewSession = {
      ...session,
      ...update,
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  recordCandidateTurn(
    sessionIdOrChannel: string,
    transcript: string,
    turnId: number,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const entry: TranscriptEntry = {
      turnId,
      role: 'candidate',
      text: transcript.trim(),
      final: true,
      timestamp: Date.now(),
    };

    // Deduplicate identical turn entries if arrived twice
    const existingIndex = session.transcript.findIndex(
      (t) => t.turnId === turnId && t.role === 'candidate',
    );

    let updatedTranscript = [...session.transcript];
    if (existingIndex >= 0) {
      updatedTranscript[existingIndex] = entry;
    } else {
      updatedTranscript.push(entry);
    }

    const updated: InterviewSession = {
      ...session,
      answerCount: updatedTranscript.filter((t) => t.role === 'candidate').length,
      transcript: updatedTranscript,
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  recordAgentTurn(
    sessionIdOrChannel: string,
    questionText: string,
    turnId: number,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const entry: TranscriptEntry = {
      turnId,
      role: 'agent',
      text: questionText.trim(),
      final: true,
      timestamp: Date.now(),
    };

    const existingIndex = session.transcript.findIndex(
      (t) => t.turnId === turnId && t.role === 'agent',
    );

    let updatedTranscript = [...session.transcript];
    if (existingIndex >= 0) {
      updatedTranscript[existingIndex] = entry;
    } else {
      updatedTranscript.push(entry);
    }

    const updated: InterviewSession = {
      ...session,
      transcript: updatedTranscript,
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  updateSkills(
    sessionIdOrChannel: string,
    skillsUpdate: Partial<Record<SkillId, SkillEvidence>>,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const currentSkills = { ...session.skills };

    for (const [key, evidence] of Object.entries(skillsUpdate)) {
      const skillId = key as SkillId;
      if (!evidence) continue;

      const current = currentSkills[skillId];
      if (!current) {
        currentSkills[skillId] = evidence;
        continue;
      }

      // Monotonic guard: do not downgrade proven state to partial/unverified
      const rank = { unverified: 0, partial: 1, proven: 2 };
      const currentRank = rank[current.state];
      const newRank = rank[evidence.state];

      if (newRank > currentRank) {
        currentSkills[skillId] = evidence;
      } else if (newRank === currentRank) {
        // Retain higher strength score
        currentSkills[skillId] = {
          ...evidence,
          strength: Math.max(current.strength, evidence.strength),
          state: current.state,
          quote: evidence.quote || current.quote,
          reason: evidence.reason || current.reason,
        };
      }
    }

    const updated: InterviewSession = {
      ...session,
      skills: currentSkills,
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  recordQuestionEvent(
    sessionIdOrChannel: string,
    event: QuestionEvent,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const updated: InterviewSession = {
      ...session,
      targetSkill: event.targetSkill,
      currentDecision: event.decision,
      currentGateResult: event.gateResult,
      questions: [...session.questions, event],
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  freezeScorecard(
    sessionIdOrChannel: string,
    scorecard: InterviewScorecard,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const updated: InterviewSession = {
      ...session,
      status: 'completed',
      scorecard,
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  setFaultInjection(
    sessionIdOrChannel: string,
    config: FaultInjectionConfig,
  ): InterviewSession | undefined {
    const session = this.getSession(sessionIdOrChannel);
    if (!session) return undefined;

    const updated: InterviewSession = {
      ...session,
      faultInjection: config,
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, updated);
    return updated;
  }

  deleteSession(sessionIdOrChannel: string): boolean {
    const sessionId = this.channelIndex.get(sessionIdOrChannel) ?? sessionIdOrChannel;
    const session = this.sessions.get(sessionId);
    if (session) {
      this.channelIndex.delete(session.channel);
    }
    return this.sessions.delete(sessionId);
  }
}

// Scoped singleton for server runtime
export const sessionStore: ISessionStore = new InMemorySessionStore();
