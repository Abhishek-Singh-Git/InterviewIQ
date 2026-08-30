import {
  verifyQuoteInTranscript,
  extractEvidenceFromTurn,
  orchestrateTurn,
  initializeSessionOpener,
} from '../lib/interview/orchestrator';
import {
  validateQuestionFormat,
  validateQuestionRelevance,
  validateQuestionRepetition,
  validateQuestionLatency,
  validateQuestionQuality,
  evaluateReliabilityGate,
} from '../lib/interview/reliability-gate';
import { selectNextBestQuestion } from '../lib/interview/nbq-engine';
import { generateScorecard } from '../lib/interview/scorecard';
import { createInitialSkills } from '../lib/interview/types';
import { scriptedDemoAnswers } from '../data/demo';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('=== Starting InterviewIQ Intelligence Test Suite ===\n');

// 1. Anti-Hallucination: Verbatim Quote Verification
console.log('Test 1: Anti-hallucination quote validation...');
{
  const transcript =
    'The product list rerendered on every filter change. I used React DevTools Profiler, memoized ItemCard, and reduced render time from about 180 milliseconds to 70.';

  const exactExcerpt = 'I used React DevTools Profiler, memoized ItemCard';
  assert(
    verifyQuoteInTranscript(exactExcerpt, transcript) === true,
    'Exact verbatim quote should pass validation',
  );

  const fabricatedQuote = 'I refactored the entire Redux store to Zustand';
  assert(
    verifyQuoteInTranscript(fabricatedQuote, transcript) === false,
    'Fabricated quote should fail validation',
  );

  const slightlyAlteredQuote = 'I used React DevTools to optimize ItemCards';
  assert(
    verifyQuoteInTranscript(slightlyAlteredQuote, transcript) === false,
    'Paraphrased quote must be rejected',
  );
  console.log('✓ Anti-hallucination tests passed.');
}

// 2. Monotonic Skill Progression
console.log('\nTest 2: Monotonic evidence state progression...');
{
  const skills = createInitialSkills();
  assert(skills.react.state === 'unverified', 'React starts unverified');

  // Turn 1
  const turn1Updates = extractEvidenceFromTurn({
    candidateAnswer: scriptedDemoAnswers[0],
    turnNumber: 1,
    currentSkills: skills,
  });

  assert(turn1Updates.react?.state === 'proven', 'Turn 1 promotes React to proven');
  assert(turn1Updates.react?.strength! >= 0.8, 'React strength should be high');
  assert(
    turn1Updates.react?.quote !== undefined &&
      verifyQuoteInTranscript(turn1Updates.react.quote, scriptedDemoAnswers[0]),
    'Extracted quote must exist verbatim',
  );

  // Turn 2 with weaker answer shouldn't downgrade React
  const currentSkillsAfterTurn1 = { ...skills, ...turn1Updates };
  const turn2Updates = extractEvidenceFromTurn({
    candidateAnswer: 'I just wrote simple code.',
    turnNumber: 2,
    currentSkills: currentSkillsAfterTurn1,
  });

  assert(
    turn2Updates.react === undefined,
    'Subsequent turn must not downgrade established proven React evidence',
  );
  console.log('✓ Monotonic evidence progression tests passed.');
}

// 3. Reliability Gate 5-Point Sentinel
console.log('\nTest 3: Reliability Gate checks...');
{
  // 3a. Format Check
  const validQuestion = 'When is memoization actually bad for performance?';
  const formatPass = validateQuestionFormat(validQuestion);
  assert(formatPass.status === 'passed', 'Valid question must pass format check');

  const compoundQuestion = 'What is memoization? And why do you use it?';
  const formatFailCompound = validateQuestionFormat(compoundQuestion);
  assert(
    formatFailCompound.status === 'failed' &&
      formatFailCompound.reasonCode === 'COMPOUND_QUESTION',
    'Compound question must fail format check',
  );

  const preambleQuestion = 'Great answer! How does React DevTools work?';
  const formatFailPreamble = validateQuestionFormat(preambleQuestion);
  assert(
    formatFailPreamble.status === 'failed' &&
      formatFailPreamble.reasonCode === 'CONVERSATIONAL_PREAMBLE',
    'Conversational filler preamble must fail format check',
  );

  // 3b. Relevance Check
  const relevantQ = validateQuestionRelevance(
    'How do you handle React component state?',
    'react',
  );
  assert(relevantQ.status === 'passed', 'Technical question must pass relevance');

  const irrelevantQ = validateQuestionRelevance(
    'What is your favorite cooking recipe?',
    'react',
  );
  assert(
    irrelevantQ.status === 'failed' &&
      irrelevantQ.reasonCode === 'IRRELEVANT_TOPIC',
    'Non-technical trivia must fail relevance',
  );

  // 3c. Repetition Check
  const previous = ['How do you optimize React render performance?'];
  const uniqueQ = validateQuestionRepetition(
    'How do you prevent stale search results in JavaScript?',
    previous,
  );
  assert(uniqueQ.status === 'passed', 'Distinct question passes repetition check');

  const repeatQ = validateQuestionRepetition(
    'How do you optimize React render performance?',
    previous,
  );
  assert(
    repeatQ.status === 'failed' &&
      repeatQ.reasonCode === 'REPETITIVE_QUESTION',
    'Duplicate question must fail repetition check',
  );

  // 3d. Latency Check
  assert(validateQuestionLatency(450).status === 'passed', '450ms within budget');
  assert(
    validateQuestionLatency(1950).status === 'failed',
    '1950ms exceeds budget',
  );

  // 3e. Quality Check
  const openEnded = validateQuestionQuality(
    'How do you decide between context and local state?',
  );
  assert(openEnded.status === 'passed', 'Open-ended question passes quality');

  const closedYesNo = validateQuestionQuality('Do you like React hooks?');
  assert(
    closedYesNo.status === 'failed' &&
      closedYesNo.reasonCode === 'BINARY_QUESTION',
    'Yes/No question must fail quality check',
  );

  console.log('✓ All 5 Reliability Gate check units passed.');
}

// 4. Fallback Routing on Gate Failure & Fault Injection
console.log('\nTest 4: Fallback activation and fault injection...');
{
  const gateResultFailed = evaluateReliabilityGate({
    proposedQuestion: 'Do you like JavaScript?', // Yes/No -> fails Quality gate
    targetSkill: 'javascript',
    previousQuestions: [],
    generationLatencyMs: 320,
  });

  assert(gateResultFailed.passed === false, 'Gate must fail for binary question');
  assert(gateResultFailed.usedFallback === true, 'Fallback must be activated');
  assert(
    gateResultFailed.deliveredQuestion.length > 20,
    'Delivered question must be a valid vetted fallback',
  );

  // Controlled Fault Injection test
  const faultResult = evaluateReliabilityGate({
    proposedQuestion: 'How do you profile rendering performance?',
    targetSkill: 'performance',
    previousQuestions: [],
    generationLatencyMs: 300,
    faultInjection: {
      armed: true,
      type: 'artificial_latency',
    },
  });

  assert(faultResult.passed === false, 'Fault injection must trigger failure');
  assert(faultResult.usedFallback === true, 'Fault injection must trigger fallback');
  console.log('✓ Fallback and fault injection tests passed.');
}

// 5. Next-Best-Question Selector
console.log('\nTest 5: NBQ gap selection...');
{
  const skills = createInitialSkills();
  skills.react.state = 'proven';
  skills.performance.state = 'partial';

  const nbq = selectNextBestQuestion({
    turnNumber: 2,
    currentSkills: skills,
    questionsAsked: [{ targetSkill: 'react', question: 'Opener' }],
  });

  assert(nbq.targetSkill === 'performance', 'NBQ must target partial performance gap');
  assert(nbq.proposedQuestion.length > 10, 'NBQ must propose concrete question');
  console.log('✓ NBQ gap prioritization tests passed.');
}

// 6. Full 3-Turn Session Simulation & Scorecard Freeze
console.log('\nTest 6: Full 3-Turn interview simulation & Scorecard generation...');
{
  const channel = `test-interview-${Date.now()}`;
  const initialSession = initializeSessionOpener(channel);
  assert(initialSession.questions.length === 1, 'Initial session has turn 1 opener');

  // Candidate Turn 1
  const turn1 = orchestrateTurn({
    sessionIdOrChannel: channel,
    turnNumber: 1,
    candidateAnswer: scriptedDemoAnswers[0],
  });
  assert(turn1.session.skills.react.state === 'proven', 'React proven after turn 1');
  assert(turn1.isComplete === false, 'Turn 1 is not complete');

  // Candidate Turn 2
  const turn2 = orchestrateTurn({
    sessionIdOrChannel: channel,
    turnNumber: 2,
    candidateAnswer: scriptedDemoAnswers[1],
  });
  assert(
    turn2.session.skills.performance.state === 'proven',
    'Performance proven after turn 2',
  );
  assert(turn2.isComplete === false, 'Turn 2 is not complete');

  // Candidate Turn 3
  const turn3 = orchestrateTurn({
    sessionIdOrChannel: channel,
    turnNumber: 3,
    candidateAnswer: scriptedDemoAnswers[2],
  });
  assert(
    turn3.session.skills.javascript.state === 'proven',
    'JavaScript proven after turn 3',
  );
  assert(turn3.isComplete === true, 'Turn 3 finishes interview');
  assert(turn3.session.status === 'completed', 'Session status is completed');
  assert(turn3.session.scorecard !== undefined, 'Scorecard is frozen');

  const sc = turn3.session.scorecard!;
  assert(sc.evidenceCoveragePercent >= 60, 'Coverage should be >= 60%');
  const directScorecard = generateScorecard(turn3.session);
  assert(
    directScorecard.evidenceCoveragePercent === sc.evidenceCoveragePercent,
    'Standalone generateScorecard matches session frozen scorecard',
  );
  console.log('✓ Full 3-Turn simulation and Scorecard generation passed.');
}

console.log('\n🎉 ALL INTERVIEW INTELLIGENCE TESTS PASSED SUCCESSFULLY! 🎉');
