export interface KeywordMatchResult {
  matched_keywords: string[];
  match_count: number;
  text_length: number;
  match_density: number;
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchKeywords(text: string, keywords: string[]): KeywordMatchResult {
  const normalizedText = normalizeText(text);
  const matched_keywords: string[] = [];

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);

    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, 'i');

    if (regex.test(normalizedText)) {
      matched_keywords.push(keyword);
    }
  }

  const match_count = matched_keywords.length;
  const text_length = normalizedText.length;
  const match_density = text_length > 0 ? match_count / (text_length / 100) : 0;

  return {
    matched_keywords,
    match_count,
    text_length,
    match_density
  };
}

export function calculateConfidence(
  matchResult: KeywordMatchResult,
  maxExpectedMatches: number = 5
): number {
  const { match_count, match_density } = matchResult;

  if (match_count === 0) {
    return 0;
  }

  // Base confidence from match count
  let confidence = Math.min(match_count / maxExpectedMatches, 1) * 0.8;

  // Bonus for match density (up to 0.2)
  confidence += Math.min(match_density * 0.1, 0.2);

  // Ensure confidence is between 0 and 1
  return Math.min(Math.max(confidence, 0), 1);
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
