import { Priority, PriorityClassificationResult } from '../types';
import { PRIORITY_KEYWORDS } from '../utils/constants';
import { matchKeywords } from './keywordMatcher';

export interface PriorityClassifierInput {
  subject: string;
  description: string;
}

export function classifyPriority(input: PriorityClassifierInput): PriorityClassificationResult {
  // Combine subject and description for analysis
  const combinedText = `${input.subject} ${input.description}`;

  // Check priorities in order: URGENT → HIGH → LOW → MEDIUM (default)
  const priorityOrder = [Priority.URGENT, Priority.HIGH, Priority.LOW];

  for (const priority of priorityOrder) {
    const keywords = PRIORITY_KEYWORDS[priority];
    if (keywords.length === 0) continue;

    const matchResult = matchKeywords(combinedText, keywords);

    if (matchResult.match_count > 0) {
      const confidence = calculatePriorityConfidence(matchResult.match_count);

      return {
        priority,
        confidence,
        keywords_found: matchResult.matched_keywords,
        reasoning: generatePriorityReasoning(priority, matchResult.matched_keywords, confidence)
      };
    }
  }

  // Default to MEDIUM if no matches
  return {
    priority: Priority.MEDIUM,
    confidence: 0.5,
    keywords_found: [],
    reasoning: generatePriorityReasoning(Priority.MEDIUM, [], 0.5)
  };
}

function calculatePriorityConfidence(matchCount: number): number {
  if (matchCount >= 2) {
    return Math.min(0.9 + (matchCount - 2) * 0.03, 1.0);
  } else if (matchCount === 1) {
    return 0.8;
  }
  return 0.5;
}

export function generatePriorityReasoning(
  priority: Priority,
  keywords: string[],
  confidence: number
): string {
  if (keywords.length === 0) {
    return `No priority keywords detected. Defaulting to '${priority}' priority.`;
  }

  const keywordList = keywords.slice(0, 5).join(', ');

  switch (priority) {
    case Priority.URGENT:
      return `Urgent priority assigned due to critical keywords: ${keywordList}. Immediate attention required.`;
    case Priority.HIGH:
      return `High priority assigned based on keywords: ${keywordList}. This issue is significant and should be addressed soon.`;
    case Priority.LOW:
      return `Low priority assigned based on keywords: ${keywordList}. This can be addressed when time permits.`;
    default:
      return `Medium priority assigned. Keywords found: ${keywordList}.`;
  }
}
