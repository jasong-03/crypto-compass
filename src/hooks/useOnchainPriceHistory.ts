import { useQuery } from '@tanstack/react-query';

interface PriceHistoryRecord {
  timestamp: string;
  parentProtocol: string;
  [key: string]: unknown;
}

interface PriceHistoryResponse {
  data: PriceHistoryRecord[];
  page: number;
  limit: number;
}

export interface IndicatorHistory {
  [indicatorName: string]: (number | null)[];
}

const API_URL = 'https://mvp-testidea-1094890588015.asia-southeast1.run.app/netflow_intelligence_price';

async function fetchPriceHistory(parentProtocol: string): Promise<IndicatorHistory> {
  const response = await fetch(`${API_URL}?limit=5000`);
  if (!response.ok) {
    throw new Error('Failed to fetch price history');
  }

  const result: PriceHistoryResponse = await response.json();

  // Filter by parentProtocol and sort by timestamp descending (newest first)
  const protocolData = result.data
    .filter(record => record.parentProtocol.toLowerCase() === parentProtocol.toLowerCase())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Take the last 6 records (most recent 6 hours)
  const last6Records = protocolData.slice(0, 6).reverse(); // Reverse to get chronological order

  // Extract indicator values
  const indicatorHistory: IndicatorHistory = {};

  // List of indicators we care about (matching the ones in OnchainDetailModal)
  const indicatorKeys = [
    'exchange_net_flow_usd',
    'exchange_avg_flow_usd',
    'exchange_wallet_count',
    'whale_net_flow_usd',
    'whale_avg_flow_usd',
    'whale_wallet_count',
    'fresh_wallets_net_flow_usd',
    'fresh_wallets_avg_flow_usd',
    'fresh_wallets_wallet_count',
    'top_pnl_net_flow_usd',
    'top_pnl_avg_flow_usd',
    'top_pnl_wallet_count',
    'smart_trader_net_flow_usd',
    'smart_trader_avg_flow_usd',
    'smart_trader_wallet_count',
    'public_figure_net_flow_usd',
    'public_figure_avg_flow_usd',
    'public_figure_wallet_count',
  ];

  for (const key of indicatorKeys) {
    indicatorHistory[key] = last6Records.map(record => {
      const value = record[key];
      return typeof value === 'number' && !isNaN(value) ? value : null;
    });
  }

  return indicatorHistory;
}

export function useOnchainPriceHistory(parentProtocol: string | null) {
  return useQuery({
    queryKey: ['onchain-price-history', parentProtocol],
    queryFn: () => fetchPriceHistory(parentProtocol!),
    enabled: !!parentProtocol,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
