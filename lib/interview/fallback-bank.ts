import type { SkillId } from './types';

export const fallbackQuestionBank: Record<SkillId, string[]> = {
  react: [
    'How do you decide whether state should live in a component, in context, or outside React?',
    'When would using a custom hook be better than component composition for sharing logic?',
    'What specific problems happen if you mutate React state directly instead of using setState?',
  ],
  javascript: [
    'A search box sends a request on every keystroke. How would you prevent stale results from replacing newer ones?',
    'How does JavaScript event loop prioritization differ between Microtasks and Macrotasks during high-frequency UI events?',
    'How do you manage memory leaks when attaching event listeners to long-lived DOM elements or window?',
  ],
  performance: [
    'How would you find the cause of a slow React screen before deciding what to optimize?',
    'When is memoization actually counterproductive and harmful for React rendering performance?',
    'How do you measure and diagnose Cumulative Layout Shift and Interaction to Next Paint in a web app?',
  ],
  problem_solving: [
    'Tell me the first three steps you take when a bug appears only in production and not locally.',
    'How do you isolate whether a slowdown is caused by network latency, JavaScript execution, or DOM layout thrashing?',
    'How do you handle a scenario where a third-party dependency crashes only in certain client browsers?',
  ],
  communication: [
    'Explain event delegation as if you were helping a junior developer debug an unresponsive list item.',
    'How would you explain the trade-offs of Client-Side Rendering versus Server-Side Rendering to a product manager?',
    'How do you structure code review feedback when proposing a major architectural refactor to a teammate?',
  ],
};

export const emergencyFallbackQuestion =
  'Looking back at your most complex frontend project, what is one architectural trade-off you would approach differently today?';

/**
 * Returns a vetted, unused fallback question for the given target skill.
 * If all questions for that skill were already asked, selects from other unverified skills or the emergency question.
 */
export function getUnusedFallback(
  targetSkill: SkillId,
  alreadyAskedQuestions: string[],
): string {
  const normalizedAsked = new Set(
    alreadyAskedQuestions.map((q) => q.toLowerCase().trim()),
  );

  // 1. Try target skill pool
  const skillPool = fallbackQuestionBank[targetSkill] ?? [];
  for (const question of skillPool) {
    if (!normalizedAsked.has(question.toLowerCase().trim())) {
      return question;
    }
  }

  // 2. Try any other skill pool
  for (const questions of Object.values(fallbackQuestionBank)) {
    for (const question of questions) {
      if (!normalizedAsked.has(question.toLowerCase().trim())) {
        return question;
      }
    }
  }

  // 3. Emergency fallback
  return emergencyFallbackQuestion;
}

// Backward-compatible single map
export const fallbackQuestions: Record<SkillId, string> = {
  react: fallbackQuestionBank.react[0],
  javascript: fallbackQuestionBank.javascript[0],
  performance: fallbackQuestionBank.performance[0],
  problem_solving: fallbackQuestionBank.problem_solving[0],
  communication: fallbackQuestionBank.communication[0],
};
