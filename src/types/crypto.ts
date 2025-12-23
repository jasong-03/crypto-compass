export type SentimentType = 'bullish' | 'bearish' | 'neutral';

export interface FundamentalToken {
  parentProtocol: string;
  symbol: string;
  logo: string;
  rank_description: string;
  [key: string]: unknown;
}

export interface OnchainToken {
  parentProtocol: string;
  overall_sentiment?: SentimentType;
  [key: string]: unknown;
}

export interface TokenData {
  parentProtocol: string;
  symbol: string;
  logo: string;
  price: string;
  fundamental: SentimentType;
  onchain: SentimentType;
  technical: SentimentType;
  overall: SentimentType;
  onchainData?: OnchainToken;
}
