import { demoCandidate, demoRole, fixedOpeningQuestion } from '@/data/demo';

export interface PromptContextOptions {
  candidateName?: string;
  candidateExperience?: string;
  resumeSummary?: string;
  roleTitle?: string;
  company?: string;
  openingQuestion?: string;
}

/**
 * When a real CV is provided, generate a dynamic opening instruction that
 * tells the LLM to craft its first question from the candidate's actual
 * projects and claims rather than using the fixed demo opener.
 */
function buildDynamicOpenerInstruction(_resumeSummary: string): string {
  return (
    'Read the candidate\'s resume context carefully. Start the interview by asking about ' +
    'the most specific, verifiable technical project or performance claim in their background. ' +
    'Probe for what they built, what was the bottleneck or challenge, what they changed, and how they measured the result. ' +
    'Keep it to one concise question.'
  );
}

export function buildInterviewerPrompt(options?: PromptContextOptions): {
  instructions: string;
  greeting: string;
  openingQuestion: string;
} {
  const name = options?.candidateName ?? demoCandidate.name;
  const role = options?.roleTitle ?? demoRole.title;
  const company = options?.company ?? demoRole.company;
  const resume = options?.resumeSummary ?? demoCandidate.resumeSummary;

  // If a real resume was uploaded (not using the hardcoded demo), generate
  // a dynamic opener instruction. Otherwise fall back to the fixed demo question.
  const hasRealResume = options?.resumeSummary && options.resumeSummary !== demoCandidate.resumeSummary;
  const opener = options?.openingQuestion
    ?? (hasRealResume ? buildDynamicOpenerInstruction(resume) : fixedOpeningQuestion);

  const greeting = hasRealResume
    ? `Hi ${name}, welcome to your technical interview for the ${role} position at ${company}. I'm your InterviewIQ AI interviewer. Today we will go through a focused technical screening based on your background. Let me begin with my first question.`
    : `Hi ${name}, welcome to your technical interview for the ${role} position at ${company}. I'm your InterviewIQ AI interviewer. Today we will go through three focused technical questions. To begin: ${fixedOpeningQuestion}`;

  const instructions = `You are the lead AI Technical Interviewer for InterviewIQ conducting a live voice screening for the **${role}** role at **${company}**.

# Candidate Context
- Candidate: ${name}
- Candidate Background & Claims: ${resume}

# Interview Scope & Competencies
You are evaluating five competencies:
1. **React**: Component lifecycle, state management, hooks, render optimization.
2. **JavaScript**: Asynchronous patterns, closures, event loop, data manipulation.
3. **Performance**: Bottleneck diagnosis, profiling tools, memory/comparison trade-offs.
4. **Problem Solving**: Systematic debugging, handling edge cases, production root-cause analysis.
5. **Communication**: Clear, structured, technically precise verbal explanations.

# Critical Interview Policy & Rules
1. **One Question Per Turn**: Ask exactly one concise, unambiguous technical question at a time. Never ask multi-part compound questions.
2. **No Hints or Coaching**: Never supply answers, validate candidate guesses, or praise prematurely. Remain neutral, professional, and rigorous.
3. **Evidence-Seeking Follow-Ups**: Follow up directly on the candidate's stated experience, architectural decisions, and trade-offs. Probe for "why" and "how did you measure it", not just "what".
4. **Voice Conciseness**: Keep your speech brief and conversational (1–2 sentences maximum per question).
5. **Interview Limit**: The interview consists of 3 distinct technical turns. After the candidate answers the 3rd question, briefly thank them and conclude the interview cleanly.
6. **Opening**: ${hasRealResume ? opener : `The interview begins with the designated opening question: "${opener}".`}
7. **CV-Driven Questions**: Base your questions on the candidate's specific background, projects, and claims listed above. Ask about their real projects, the technologies they used, the problems they solved, and how they measured results. Do NOT ask generic textbook questions when the candidate's CV provides specific context to probe.`;

  return {
    instructions,
    greeting,
    openingQuestion: opener,
  };
}
