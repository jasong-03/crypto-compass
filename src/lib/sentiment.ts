import { SentimentType, FundamentalToken, OnchainToken } from '@/types/crypto';

export function calculateFundamentalSentiment(rankDescription: string): SentimentType {
  const desc = rankDescription.toLowerCase();

  if (desc.includes('top 5%') || desc.includes('top 10%')) {
    return 'bullish';
  }

  if (desc.includes('top 20%') || desc.includes('top 30%') ||
    desc.includes('top 40%') || desc.includes('top 50%')) {
    if (!desc.includes('top 50% +') && !desc.includes('top 50%+')) {
      return 'neutral';
    }
  }

  if (desc.includes('top 50% +') || desc.includes('top 50%+') ||
    desc.includes('bottom') || desc.includes('top 60%') ||
    desc.includes('top 70%') || desc.includes('top 80%') ||
    desc.includes('top 90%')) {
    return 'bearish';
  }

  return 'neutral';
}

export function calculateOnchainSentiment(token: OnchainToken): SentimentType {
  const chgFields = Object.keys(token).filter(key => key.endsWith('_chg_7h'));

  // Count sentiments for each indicator
  // Match SQL logic: NULL or 0 → neutral, < 0 → bullish, > 0 → bearish
  let bullishCount = 0;
  let bearishCount = 0;
  let neutralCount = 0;
  const fieldSentiments: Record<string, SentimentType> = {};
  
  for (const field of chgFields) {
    const value = token[field];
    
    // Handle NULL or undefined as neutral
    if (value === null || value === undefined || isNaN(value as number)) {
      neutralCount++;
      fieldSentiments[field] = 'neutral';
      continue;
    }
    
    // Handle number values
    if (typeof value === 'number') {
      let sentiment: SentimentType;
      if (value === 0) {
        sentiment = 'neutral';
        neutralCount++;
      } else if (value < 0) {
        sentiment = 'bullish';
        bullishCount++;
      } else {
        sentiment = 'bearish';
        bearishCount++;
      }
      fieldSentiments[field] = sentiment;
    }
  }

  // Debug logging
  console.log('🔍 Onchain Sentiment Debug:', {
    parentProtocol: token.parentProtocol,
    chgFieldsCount: chgFields.length,
    fieldSentiments,
    counts: { bullish: bullishCount, bearish: bearishCount, neutral: neutralCount },
  });

  // Match SQL logic:
  // CASE
  //   WHEN bullish_count >= neutral_count AND bullish_count >= bearish_count THEN 'bullish'
  //   WHEN neutral_count > bullish_count AND neutral_count >= bearish_count THEN 'neutral'
  //   ELSE 'bearish'
  // END
  if (bullishCount >= neutralCount && bullishCount >= bearishCount) {
    return 'bullish';
  }
  if (neutralCount > bullishCount && neutralCount >= bearishCount) {
    return 'neutral';
  }
  return 'bearish';
}

export function calculateOverallSentiment(
  fundamental: SentimentType,
  onchain: SentimentType,
  technical: SentimentType
): SentimentType {
  const counts = {
    bullish: 0,
    bearish: 0,
    neutral: 0
  };

  counts[fundamental]++;
  counts[onchain]++;
  counts[technical]++;

  // Find the maximum count
  const maxCount = Math.max(counts.bullish, counts.bearish, counts.neutral);

  // Check for ties
  const maxSentiments = (Object.keys(counts) as SentimentType[]).filter(
    key => counts[key] === maxCount
  );

  // If there's a 3-way tie or any tie involving neutral, default to neutral
  if (maxSentiments.length > 1) {
    return 'neutral';
  }

  return maxSentiments[0];
}
