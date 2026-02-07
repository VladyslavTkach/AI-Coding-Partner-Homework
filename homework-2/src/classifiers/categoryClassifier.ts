import { Category, CategoryClassificationResult } from '../types';
import { CATEGORY_KEYWORDS } from '../utils/constants';
import { matchKeywords, KeywordMatchResult } from './keywordMatcher';

export interface CategoryClassifierInput {
  subject: string;
  description: string;
}

interface CategoryScore {
  category: Category;
  matchResult: KeywordMatchResult;
  score: number;
}

export function classifyCategory(input: CategoryClassifierInput): CategoryClassificationResult {
  // Combine subject (weighted 2x) and description for analysis
  const combinedText = `${input.subject} ${input.subject} ${input.description}`;

  const categoryScores: CategoryScore[] = [];

  // Match against all category keyword lists
  for (const category of Object.values(Category)) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.length === 0) continue;

    const matchResult = matchKeywords(combinedText, keywords);
    const score = matchResult.match_count;

    if (score > 0) {
      categoryScores.push({ category, matchResult, score });
    }
  }

  // Sort by score descending
  categoryScores.sort((a, b) => b.score - a.score);

  // Select best category or default to OTHER
  if (categoryScores.length === 0) {
    return {
      category: Category.OTHER,
      confidence: 0.3,
      keywords_found: [],
      reasoning: generateCategoryReasoning(Category.OTHER, [], 0.3)
    };
  }

  const best = categoryScores[0];
  const confidence = calculateCategoryConfidence(best.matchResult.match_count);

  return {
    category: best.category,
    confidence,
    keywords_found: best.matchResult.matched_keywords,
    reasoning: generateCategoryReasoning(best.category, best.matchResult.matched_keywords, confidence)
  };
}

function calculateCategoryConfidence(matchCount: number): number {
  if (matchCount >= 3) {
    return Math.min(0.9 + (matchCount - 3) * 0.02, 1.0);
  } else if (matchCount === 2) {
    return 0.75;
  } else if (matchCount === 1) {
    return 0.6;
  }
  return 0.3;
}

export function generateCategoryReasoning(
  category: Category,
  keywords: string[],
  confidence: number
): string {
  if (keywords.length === 0) {
    return `No specific keywords matched. Defaulting to '${category}' category with low confidence.`;
  }

  const confidenceLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Moderate' : 'Low';
  const keywordList = keywords.slice(0, 5).join(', ');

  return `${confidenceLevel} confidence match for '${category}' category based on keywords: ${keywordList}.`;
}
