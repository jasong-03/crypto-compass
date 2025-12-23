import { useQuery } from '@tanstack/react-query';
import { OnchainToken } from '@/types/crypto';

const ONCHAIN_API = 'https://mvp-testidea-1094890588015.asia-southeast1.run.app/netflow_intelligence';

async function fetchOnchainDataByProtocol(parentProtocol: string): Promise<OnchainToken | null> {
  if (!parentProtocol) return null;

  try {
    // Try fetching with parentProtocol filter first
    // If API doesn't support it, fetch all and filter client-side
    const url = `${ONCHAIN_API}?limit=100`; // Fetch more to ensure we find the token
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch onchain data');
    }
    
    const json = await response.json();
    const data = json.data || json;
    
    // Filter to find the matching protocol
    if (Array.isArray(data)) {
      const found = data.find(
        (token: OnchainToken) => 
          token.parentProtocol?.toLowerCase() === parentProtocol.toLowerCase()
      );
      return found || null;
    }
    
    // If API returns single object, check if it matches
    if (data && data.parentProtocol?.toLowerCase() === parentProtocol.toLowerCase()) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching onchain data:', error);
    return null;
  }
}

export function useOnchainData(parentProtocol: string | null) {
  return useQuery({
    queryKey: ['onchain', parentProtocol],
    queryFn: () => fetchOnchainDataByProtocol(parentProtocol!),
    enabled: !!parentProtocol, // Only fetch when parentProtocol is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

