import {
  type InterviewScorecard,
  type InterviewSession,
  type RecommendationType,
  type ScorecardSkillSummary,
  SKILL_IDS,
} from './types';
import { demoCandidate, demoRole } from '@/data/demo';

const SKILL_WEIGHTS = {
  react: 0.30,
  performance: 0.25,
  javascript: 0.20,
  problem_solving: 0.15,
  communication: 0.10,
};

export function generateScorecard(session: InterviewSession): InterviewScorecard {
  const skillsList: ScorecardSkillSummary[] = SKILL_IDS.map((id) => {
    const evidence = session.skills[id];
    const state = evidence?.state ?? 'unverified';
    const strength = Math.round((evidence?.strength ?? 0) * 100);

    let tone: 'verified' | 'partial' | 'open' = 'open';
    if (state === 'proven') tone = 'verified';
    else if (state === 'partial') tone = 'partial';

    return {
      skillId: id,
      label: evidence?.label ?? id,
      state,
      strength,
      tone,
      quote: evidence?.quote,
      reason: evidence?.reason,
      turn: evidence?.updatedAtTurn,
    };
  });

  const touchedSkills = skillsList.filter((s) => s.state !== 'unverified');
  const touchedSkillsCount = touchedSkills.length;
  const totalSkillsCount = SKILL_IDS.length;
  const evidenceCoveragePercent = Math.round(
    (touchedSkillsCount / totalSkillsCount) * 100,
  );

  // Compute weighted score (0..100)
  let weightedSum = 0;
  for (const skill of skillsList) {
    const weight = SKILL_WEIGHTS[skill.skillId] ?? 0.2;
    weightedSum += (skill.strength / 100) * weight;
  }
  const overallScore = Math.round(weightedSum * 100);

  // Determine Recruiter Recommendation
  let recommendation: RecommendationType = 'Targeted follow-up required';
  let recommendationReason = '';

  const provenCount = skillsList.filter((s) => s.state === 'proven').length;

  if (provenCount >= 2 && overallScore >= 60) {
    recommendation = 'Advance';
    recommendationReason =
      'Candidate provided verifiable evidence with measured performance benchmarks and strong trade-off reasoning across core competencies.';
  } else if (touchedSkillsCount >= 2 && overallScore >= 35) {
    recommendation = 'Targeted follow-up required';
    recommendationReason =
      'Candidate demonstrated solid technical instincts, but deeper validation is needed on asynchronous edge cases and production debugging.';
  } else {
    recommendation = 'Insufficient evidence';
    recommendationReason =
      'The short screening session produced insufficient concrete evidence across required role competencies for an advance decision.';
  }

  // Compile questions audit
  const questionsAudit = session.questions.map((q) => ({
    turn: q.turn,
    source: q.source === 'fixed_opener' ? 'Fixed opener' : q.source === 'fallback' ? 'Safe fallback' : 'Adaptive',
    target: q.targetSkill.charAt(0).toUpperCase() + q.targetSkill.slice(1),
    question: q.deliveredQuestion,
    gatePassed: q.passed,
    usedFallback: q.source === 'fallback' || Boolean(q.gateResult?.usedFallback),
    latencyMs: q.latencyMs,
  }));

  // Compile candidate quotes
  const candidateQuotes = session.transcript
    .filter((t) => t.role === 'candidate' && t.text.length > 20)
    .map((t, idx) => {
      // Find associated skill
      const matchingSkill = skillsList.find((s) => s.turn === t.turnId || s.quote?.includes(t.text.slice(0, 30)));
      return {
        turn: t.turnId || idx + 1,
        quote: t.text,
        skill: matchingSkill?.label ?? 'General',
      };
    });

  // Reliability telemetry summary
  const totalQuestions = session.questions.length;
  const passedGatesCount = session.questions.filter((q) => q.passed).length;
  const totalGateChecks = totalQuestions * 4; // 4 active gates per turn
  const fallbacksTriggered = session.questions.filter(
    (q) => q.source === 'fallback' || q.gateResult?.usedFallback,
  ).length;

  return {
    sessionId: session.id,
    candidateName: demoCandidate.name,
    roleTitle: demoRole.title,
    company: demoRole.company,
    completedTurns: session.answerCount,
    evidenceCoveragePercent,
    touchedSkillsCount,
    totalSkillsCount,
    overallScore,
    recommendation,
    recommendationReason,
    skills: skillsList,
    questionsAudit,
    candidateQuotes,
    reliabilitySummary: {
      totalQuestions,
      totalGateChecks,
      gatePassRate: totalQuestions > 0 ? Math.round((passedGatesCount / totalQuestions) * 100) : 100,
      fallbacksTriggered,
      openSkillsCount: totalSkillsCount - touchedSkillsCount,
    },
    createdAt: Date.now(),
  };
}
