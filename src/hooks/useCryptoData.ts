import { useQuery } from '@tanstack/react-query';
import { FundamentalToken, OnchainToken, TokenData } from '@/types/crypto';
import {
  calculateFundamentalSentiment,
  calculateOnchainSentiment,
  calculateOverallSentiment
} from '@/lib/sentiment';
import { mockFundamentalData, mockOnchainData } from '@/data/mockData';

// Base APIs
const FUNDAMENTAL_API = 'https://mvp-testidea-1094890588015.asia-southeast1.run.app/fact_q_score';
const ONCHAIN_API = 'https://mvp-testidea-1094890588015.asia-southeast1.run.app/netflow_intelligence';

// Pagination settings
const LIMIT = 200; // Fetch all fundamental data to ensure complete matching

// Flag to use mock data (set to false to try real APIs)
const USE_MOCK_DATA = false;

interface FundamentalApiResponse {
  data: FundamentalToken[];
  page?: number;
  limit?: number;
  total?: number;
}

async function fetchFundamentalData(page: number = 1): Promise<FundamentalApiResponse> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      data: mockFundamentalData,
      page: 1,
      limit: LIMIT,
      total: mockFundamentalData.length,
    };
  }

  const url = `${FUNDAMENTAL_API}?page=${page}&limit=${LIMIT}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch fundamental data');
  }
  const json = await response.json();
  
  // Return both data and pagination info
  return {
    data: json.data || json,
    page: json.page || page,
    limit: json.limit || LIMIT,
    total: json.total || (Array.isArray(json.data) ? json.data.length : 0),
  };
}

async function fetchOnchainData(): Promise<OnchainToken[]> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOnchainData;
  }

  // Fetch all onchain data (or with high limit) to match with fundamental tokens
  // Use high limit to get all tokens (48 tokens in DB)
  const url = `${ONCHAIN_API}?limit=100`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch onchain data');
  }
  const json = await response.json();
  return json.data || json;
}

export function useCryptoData(page: number = 1) {
  const fundamentalQuery = useQuery({
    queryKey: ['fundamental', page],
    queryFn: () => fetchFundamentalData(page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Fetch onchain data to calculate sentiment for table
  const onchainQuery = useQuery({
    queryKey: ['onchain'],
    queryFn: fetchOnchainData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const isLoading = fundamentalQuery.isLoading || onchainQuery.isLoading;
  const isPending = fundamentalQuery.isPending || onchainQuery.isPending;
  const isError = fundamentalQuery.isError || onchainQuery.isError;
  const error = fundamentalQuery.error || onchainQuery.error;

  let tokens: TokenData[] = [];
  
  // Use onchain data total count if available, otherwise use fundamental
  const onchainTotal = onchainQuery.data && Array.isArray(onchainQuery.data) 
    ? onchainQuery.data.length 
    : 0;
  
  const paginationInfo = {
    page: 1, // Always show all tokens from onchain API
    limit: onchainTotal || LIMIT,
    total: onchainTotal || fundamentalQuery.data?.total || 0,
  };

  // Rank priority: A+ > A > B+ > B > C+ > C > D (higher is better)
  const rankPriority: Record<string, number> = {
    'A+': 7, 'A': 6, 'B+': 5, 'B': 4, 'C+': 3, 'C': 2, 'D': 1
  };

  // Build fundamental map for quick lookup - keep best rank for duplicates
  const fundamentalMap = new Map<string, FundamentalToken>();
  if (fundamentalQuery.data?.data && Array.isArray(fundamentalQuery.data.data)) {
    for (const fundToken of fundamentalQuery.data.data) {
      if (fundToken.parentProtocol) {
        const key = fundToken.parentProtocol.toLowerCase();
        const existing = fundamentalMap.get(key);

        if (!existing) {
          fundamentalMap.set(key, fundToken);
        } else {
          // Keep the one with better rank
          const existingPriority = rankPriority[existing.rank] || 0;
          const newPriority = rankPriority[fundToken.rank] || 0;
          if (newPriority > existingPriority) {
            fundamentalMap.set(key, fundToken);
          }
        }
      }
    }
  }

  // Use onchain data as primary source (48 tokens) and match with fundamental data
  if (onchainQuery.data && Array.isArray(onchainQuery.data)) {
    const seenProtocols = new Set<string>();

    for (const onchainToken of onchainQuery.data) {
      if (!onchainToken.parentProtocol) continue;

      const protocolKey = onchainToken.parentProtocol.toLowerCase();
      if (seenProtocols.has(protocolKey)) continue; // Deduplicate
      seenProtocols.add(protocolKey);

      // Get fundamental data if available
      const fundToken = fundamentalMap.get(protocolKey);
      const fundamental = fundToken
        ? calculateFundamentalSentiment(fundToken.rank_description || '')
        : 'neutral';
      
      // Use overall_sentiment from API if available, otherwise calculate
      const onchain = onchainToken.overall_sentiment 
        ? onchainToken.overall_sentiment
        : calculateOnchainSentiment(onchainToken);
      
      const technical = 'neutral' as const; // Hardcoded as per requirements
      const overall = calculateOverallSentiment(fundamental, onchain, technical);

      tokens.push({
        parentProtocol: onchainToken.parentProtocol,
        symbol: fundToken?.symbol || onchainToken.parentProtocol.replace('parent#', '').toUpperCase(),
        logo: fundToken?.logo || '',
        price: '$100K', // Hardcoded as per requirements
        fundamental,
        onchain,
        technical,
        overall,
        onchainData: onchainToken, // Store for detail modal
      });
    }
  }

  const totalPages = Math.ceil(paginationInfo.total / paginationInfo.limit);

  return {
    tokens,
    pagination: {
      ...paginationInfo,
      totalPages,
      hasNextPage: paginationInfo.page < totalPages,
      hasPrevPage: paginationInfo.page > 1,
    },
    isLoading: isLoading || isPending,
    isError,
    error,
    refetch: () => {
      fundamentalQuery.refetch();
      onchainQuery.refetch();
    }
  };
}
