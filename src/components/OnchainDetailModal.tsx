import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SentimentBadge } from './SentimentBadge';
import { TokenData, SentimentType, OnchainToken } from '@/types/crypto';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useOnchainData } from '@/hooks/useOnchainData';
import { calculateOnchainSentiment } from '@/lib/sentiment';
import { Skeleton } from '@/components/ui/skeleton';

interface OnchainDetailModalProps {
  token: TokenData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface IndicatorRow {
  name: string;
  currentValue: number | null;
}

function formatIndicatorName(key: string): string {
  // Remove chg7h/chg_7h suffix and convert snake_case to Title Case
  const withoutSuffix = key
    .replace(/_?chg_?7h$/i, '')
    .replace(/_chg_7h$/i, '');
  return withoutSuffix
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  const absValue = Math.abs(value);
  if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (absValue >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (absValue >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPercentage(value: number): string {
  const percent = value * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(0)}%`;
}

function getIndicatorRows(onchainData: OnchainToken): IndicatorRow[] {
  const rows: IndicatorRow[] = [];

  for (const key of Object.keys(onchainData)) {
    // Take all indicators whose field name contains "chg7h" (or "_chg_7h", etc.)
    if (/chg_?7h/i.test(key)) {
      // Find corresponding current value field (same name without _chg_7h)
      const baseKey = key.replace(/_chg_7h$/i, '').replace(/_chg7h$/i, '');
      const currentValueKey = baseKey;
      const currentValue = onchainData[currentValueKey] as number | null | undefined;
      
      rows.push({
        name: formatIndicatorName(key),
        currentValue: (typeof currentValue === 'number' && !isNaN(currentValue)) ? currentValue : null,
      });
    }
  }

  return rows;
}

export function OnchainDetailModal({ token, open, onOpenChange }: OnchainDetailModalProps) {
  // Fetch onchain data on demand when modal opens
  const { data: onchainData, isLoading, isError } = useOnchainData(
    token?.parentProtocol || null
  );

  // Calculate sentiment from fetched data
  const onchainSentiment = onchainData 
    ? calculateOnchainSentiment(onchainData)
    : 'neutral';

  if (!token) return null;

  const indicatorRows = onchainData ? getIndicatorRows(onchainData) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {token.logo ? (
              <img
                src={token.logo}
                alt={token.symbol}
                className="h-10 w-10 rounded-full object-cover bg-muted"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&color=fff&size=40`;
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {token.symbol.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <DialogTitle className="text-xl">{token.symbol} Onchain Movement</DialogTitle>
              <p className="text-sm text-muted-foreground">{token.parentProtocol}</p>
            </div>
          </div>

          {/* Overall sentiment badge */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Overall Onchain:</span>
            {isLoading ? (
              <Skeleton className="h-6 w-20 rounded-full" />
            ) : (
              <SentimentBadge sentiment={onchainSentiment} />
            )}
          </div>
        </DialogHeader>

        <div className="mt-4 rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold">Indicator</TableHead>
                <TableHead className="text-muted-foreground font-semibold">Current Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border/50">
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    Failed to load onchain data
                  </TableCell>
                </TableRow>
              ) : indicatorRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                    No onchain indicators available
                  </TableCell>
                </TableRow>
              ) : (
                indicatorRows.map((row) => (
                  <TableRow key={row.name} className="border-border/50">
                    <TableCell className="font-medium text-foreground">
                      {row.name}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {formatCurrency(row.currentValue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
