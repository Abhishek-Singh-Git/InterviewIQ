import { NextRequest, NextResponse } from 'next/server';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Extracts plain text from a PDF buffer using pdf-parse.
 * Returns cleaned, condensed text suitable for an interview system prompt.
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamic import keeps pdf-parse out of the client bundle.
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Best-effort extraction of a candidate name from the first few lines of CV text.
 * Resumes typically have the name as the first non-empty line.
 */
function extractCandidateName(text: string): string | undefined {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines.slice(0, 5)) {
    // Skip lines that look like headers, emails, phones, or URLs
    if (line.includes('@') || line.includes('http') || /^\+?\d[\d\s()-]{6,}$/.test(line)) {
      continue;
    }
    // Skip lines that are too long (likely a paragraph) or too short (likely a section header like "Resume")
    if (line.length > 60 || line.length < 3) continue;
    // Skip lines with too many words (likely a title or description)
    const words = line.split(/\s+/);
    if (words.length > 5) continue;
    // Skip common resume section headers
    const lowerLine = line.toLowerCase();
    if (
      ['resume', 'curriculum vitae', 'cv', 'profile', 'summary', 'objective', 'contact'].some(
        (header) => lowerLine === header || lowerLine.startsWith(header + ':'),
      )
    ) {
      continue;
    }
    // This line is likely the candidate's name
    return line;
  }
  return undefined;
}

/**
 * Condenses raw CV text into a resume summary suitable for an LLM system prompt.
 * Keeps the first ~2000 characters, strips excessive whitespace, and truncates cleanly.
 */
function condenseResumeSummary(rawText: string, maxLength = 2000): string {
  const cleaned = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) return cleaned;

  // Truncate at the last sentence boundary within the limit
  const truncated = cleaned.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutoff = Math.max(lastPeriod, lastNewline);

  return cutoff > maxLength * 0.5
    ? truncated.slice(0, cutoff + 1).trim()
    : truncated.trim() + '…';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a PDF file as the "cv" form field.' },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported. Please upload a .pdf file.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawText = await extractTextFromPdf(buffer);

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from this PDF. It may be image-based or empty.' },
        { status: 422 },
      );
    }

    const candidateName = extractCandidateName(rawText);
    const resumeSummary = condenseResumeSummary(rawText);

    return NextResponse.json({
      candidate_name: candidateName ?? null,
      resume_summary: resumeSummary,
      extracted_length: rawText.length,
    });
  } catch (error) {
    console.error('CV parse error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to parse CV. Please try a different PDF file.',
      },
      { status: 500 },
    );
  }
}
