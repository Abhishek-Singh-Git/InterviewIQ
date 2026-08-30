import type {
  GateCheckResult,
  ReliabilityGateResult,
  SkillId,
  FaultInjectionConfig,
} from './types';
import { getUnusedFallback } from './fallback-bank';

export const GATE_LATENCY_BUDGET_MS = 1500;
export const MAX_QUESTION_WORD_COUNT = 32;
export const REPETITION_SIMILARITY_THRESHOLD = 0.65;

// Jaccard similarity between two tokenized sentences
function computeJaccardSimilarity(textA: string, textB: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionCount++;
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize === 0 ? 0 : intersectionCount / unionSize;
}

export function validateQuestionFormat(question: string): GateCheckResult {
  const trimmed = question.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);

  // 1. Must end with a question mark
  if (!trimmed.endsWith('?')) {
    return {
      name: 'Format',
      status: 'failed',
      reasonCode: 'MISSING_QUESTION_MARK',
      explanation: 'Question must terminate with a question mark.',
      measuredValue: `${words.length} words`,
    };
  }

  // 2. No multiple question marks (compound questions)
  const questionMarkCount = (trimmed.match(/\?/g) || []).length;
  if (questionMarkCount > 1) {
    return {
      name: 'Format',
      status: 'failed',
      reasonCode: 'COMPOUND_QUESTION',
      explanation: 'Contains multiple questions in a single turn.',
      measuredValue: `${questionMarkCount} questions`,
    };
  }

  // 3. Word count check
  if (words.length > MAX_QUESTION_WORD_COUNT) {
    return {
      name: 'Format',
      status: 'failed',
      reasonCode: 'EXCEEDS_WORD_LIMIT',
      explanation: `Question exceeds ${MAX_QUESTION_WORD_COUNT} word voice-conciseness limit.`,
      measuredValue: `${words.length} words`,
    };
  }

  // 4. No coaching / chat preamble
  const bannedPreambles = [
    'great answer',
    'good job',
    'that is right',
    'you are correct',
    'nice explanation',
    'as an ai',
    'i think that',
  ];
  const lower = trimmed.toLowerCase();
  for (const preamble of bannedPreambles) {
    if (lower.startsWith(preamble)) {
      return {
        name: 'Format',
        status: 'failed',
        reasonCode: 'CONVERSATIONAL_PREAMBLE',
        explanation: 'Contains conversational filler or coaching preamble.',
      };
    }
  }

  return {
    name: 'Format',
    status: 'passed',
    reasonCode: 'FORMAT_VALID',
    explanation: 'Single concise voice-ready question.',
    measuredValue: `${words.length} words`,
  };
}

export function validateQuestionRelevance(
  question: string,
  targetSkill: SkillId,
): GateCheckResult {
  const lower = question.toLowerCase();

  // Protected characteristic checks
  const protectedTerms = [
    'age',
    'gender',
    'religion',
    'marital',
    'nationality',
    'salary',
    'political',
  ];
  for (const term of protectedTerms) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(lower)) {
      return {
        name: 'Relevance',
        status: 'failed',
        reasonCode: 'PROTECTED_CHARACTERISTIC',
        explanation: 'Question references non-job-related personal characteristics.',
      };
    }
  }

  // General technical vocabulary baseline
  const technicalKeywords = [
    'react',
    'javascript',
    'component',
    'state',
    'props',
    'hook',
    'render',
    'performance',
    'memory',
    'profiler',
    'memo',
    'async',
    'promise',
    'event',
    'dom',
    'api',
    'debug',
    'error',
    'production',
    'cache',
    'optimization',
    'trade-off',
    'measure',
    'test',
    'architect',
    'shopflow',
    'code',
    'frontend',
    'css',
    'html',
    'typescript',
    'bundle',
    'network',
    'latency',
  ];

  const hasTechnicalAnchor = technicalKeywords.some((kw) => lower.includes(kw));

  if (!hasTechnicalAnchor) {
    return {
      name: 'Relevance',
      status: 'failed',
      reasonCode: 'IRRELEVANT_TOPIC',
      explanation: 'Question lacks core technical vocabulary relevant to role.',
    };
  }

  return {
    name: 'Relevance',
    status: 'passed',
    reasonCode: 'RELEVANT',
    explanation: `Aligned with ${targetSkill} competency evaluation.`,
  };
}

export function validateQuestionRepetition(
  question: string,
  previousQuestions: string[],
): GateCheckResult {
  if (!previousQuestions || previousQuestions.length === 0) {
    return {
      name: 'Repetition',
      status: 'passed',
      reasonCode: 'NO_PREVIOUS_QUESTIONS',
      explanation: 'Initial turn in session.',
      measuredValue: '0.00 similarity',
    };
  }

  let maxSimilarity = 0;
  let mostSimilarQuestion = '';

  for (const prev of previousQuestions) {
    const sim = computeJaccardSimilarity(question, prev);
    if (sim > maxSimilarity) {
      maxSimilarity = sim;
      mostSimilarQuestion = prev;
    }
  }

  if (maxSimilarity >= REPETITION_SIMILARITY_THRESHOLD) {
    return {
      name: 'Repetition',
      status: 'failed',
      reasonCode: 'REPETITIVE_QUESTION',
      explanation: `High similarity (${Math.round(maxSimilarity * 100)}%) with prior turn: "${mostSimilarQuestion.slice(0, 35)}..."`,
      measuredValue: `${Math.round(maxSimilarity * 100)}% match`,
    };
  }

  return {
    name: 'Repetition',
    status: 'passed',
    reasonCode: 'UNIQUE_QUESTION',
    explanation: 'Distinct from all previously delivered questions.',
    measuredValue: `${Math.round(maxSimilarity * 100)}% max match`,
  };
}

export function validateQuestionLatency(latencyMs: number): GateCheckResult {
  if (latencyMs > GATE_LATENCY_BUDGET_MS) {
    return {
      name: 'Latency',
      status: 'failed',
      reasonCode: 'LATENCY_BUDGET_EXCEEDED',
      explanation: `Generation time exceeded ${GATE_LATENCY_BUDGET_MS}ms SLA.`,
      measuredValue: `${latencyMs}ms`,
    };
  }

  return {
    name: 'Latency',
    status: 'passed',
    reasonCode: 'WITHIN_SLA',
    explanation: `Delivered within sub-second voice latency window.`,
    measuredValue: `${latencyMs}ms`,
  };
}

export function validateQuestionQuality(question: string): GateCheckResult {
  const lower = question.trim().toLowerCase();

  // Rejects binary Yes/No questions that fail to generate evidence
  const binaryStarters = [
    'do you ',
    'did you ',
    'is it ',
    'are you ',
    'can you ',
    'have you ',
    'will you ',
    'would you say yes',
  ];

  for (const starter of binaryStarters) {
    if (lower.startsWith(starter)) {
      return {
        name: 'Quality',
        status: 'failed',
        reasonCode: 'BINARY_QUESTION',
        explanation: 'Question is closed-ended and answerable with simple Yes/No.',
      };
    }
  }

  return {
    name: 'Quality',
    status: 'passed',
    reasonCode: 'OPEN_ENDED',
    explanation: 'Open-ended and probes for architectural decision-making.',
  };
}

/**
 * Runs all 5 reliability checks against a proposed question.
 * If any check fails (or fault injection is armed), routes to safe fallback.
 */
export function evaluateReliabilityGate(options: {
  proposedQuestion: string;
  targetSkill: SkillId;
  previousQuestions: string[];
  generationLatencyMs: number;
  faultInjection?: FaultInjectionConfig;
}): ReliabilityGateResult {
  const {
    proposedQuestion,
    targetSkill,
    previousQuestions,
    generationLatencyMs,
    faultInjection,
  } = options;

  let effectiveQuestion = proposedQuestion;

  // Handle Controlled Fault Injection for Testing/Demo
  if (faultInjection?.armed) {
    switch (faultInjection.type) {
      case 'multi_question':
        effectiveQuestion = `${proposedQuestion} And what about Redux vs Zustand?`;
        break;
      case 'repetition':
        effectiveQuestion = previousQuestions[0] ?? proposedQuestion;
        break;
      case 'low_relevance':
        effectiveQuestion = 'What is your favorite video game engine physics model?';
        break;
      case 'artificial_latency':
        // Simulates a slow LLM turn
        return {
          passed: false,
          checks: [
            validateQuestionFormat(proposedQuestion),
            validateQuestionRelevance(proposedQuestion, targetSkill),
            validateQuestionRepetition(proposedQuestion, previousQuestions),
            {
              name: 'Latency',
              status: 'failed',
              reasonCode: 'ARTIFICIAL_LATENCY_TIMEOUT',
              explanation: 'Injected artificial latency breach (>1500ms).',
              measuredValue: '2840ms',
            },
            validateQuestionQuality(proposedQuestion),
          ],
          overallLatencyMs: 2840,
          proposedQuestion,
          deliveredQuestion: getUnusedFallback(targetSkill, previousQuestions),
          usedFallback: true,
          fallbackReason: 'Artificial latency fault injection triggered safe fallback.',
        };
      case 'yes_no_question':
        effectiveQuestion = 'Do you like using React for web apps?';
        break;
    }
  }

  const checks: GateCheckResult[] = [
    validateQuestionFormat(effectiveQuestion),
    validateQuestionRelevance(effectiveQuestion, targetSkill),
    validateQuestionRepetition(effectiveQuestion, previousQuestions),
    validateQuestionLatency(generationLatencyMs),
    validateQuestionQuality(effectiveQuestion),
  ];

  const failedChecks = checks.filter((c) => c.status === 'failed');
  const passed = failedChecks.length === 0;

  if (passed) {
    return {
      passed: true,
      checks,
      overallLatencyMs: generationLatencyMs,
      proposedQuestion,
      deliveredQuestion: effectiveQuestion,
      usedFallback: false,
    };
  }

  // Gate Failed: Pull safe fallback question
  const fallbackQuestion = getUnusedFallback(targetSkill, previousQuestions);
  const fallbackReason = failedChecks.map((c) => `${c.name}: ${c.explanation}`).join('; ');

  return {
    passed: false,
    checks,
    overallLatencyMs: generationLatencyMs,
    proposedQuestion,
    deliveredQuestion: fallbackQuestion,
    usedFallback: true,
    fallbackReason,
  };
}
