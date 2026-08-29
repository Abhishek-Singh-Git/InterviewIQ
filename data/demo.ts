// InterviewIQ — Preloaded demo data for the Frontend Developer interview.
// This file is the single source of truth for the demo role, candidate, and scripted answers.

export const demoRole = {
  title: "Frontend Developer",
  company: "NovaCart",
  requiredSkills: [
    "React",
    "JavaScript",
    "Performance",
    "Problem Solving",
    "Communication",
  ] as const,
  summary:
    "Build reliable, responsive commerce experiences and diagnose frontend issues.",
} as const;

export const demoCandidate = {
  name: "Arjun Mehta",
  experience: "Final-year engineering student",
  resumeSummary:
    "Built ShopFlow in React and claims a 35% performance improvement using profiling and memoization. Also built a JavaScript search interface with API integration.",
} as const;

export const fixedOpeningQuestion =
  "You mentioned improving ShopFlow's React performance. What was slow, what did you change, and how did you prove it improved?";

/**
 * Scripted demo answers used by the mock replay engine.
 * Each entry corresponds to one candidate turn in the three-question interview.
 */
export const scriptedDemoAnswers = [
  "The product list rerendered on every filter change. I used React DevTools Profiler, memoized ItemCard, and reduced render time from about 180 milliseconds to 70.",
  "Memoization adds comparison and memory overhead, so I would profile first and avoid it when renders are already cheap or props change constantly.",
  "I would debounce input, cancel the previous request with AbortController, and only render the result belonging to the latest query.",
] as const;
