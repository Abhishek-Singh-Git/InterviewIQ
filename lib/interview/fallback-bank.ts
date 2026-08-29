// InterviewIQ — Static fallback question bank.
// Used by the Reliability Gate when an adaptive question is rejected.
// Each question is vetted, job-relevant, and safe to deliver without further checks.

import type { SkillId } from "./types";

export const fallbackQuestions: Record<SkillId, string> = {
  react:
    "How do you decide whether state should live in a component, in context, or outside React?",
  javascript:
    "A search box sends a request on every keystroke. How would you prevent stale results from replacing newer ones?",
  performance:
    "How would you find the cause of a slow React screen before deciding what to optimize?",
  problem_solving:
    "Tell me the first three steps you take when a bug appears only in production.",
  communication:
    "Explain event delegation as if you were helping a junior developer debug a large list.",
} as const;
