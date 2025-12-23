import { SentimentBadge } from './SentimentBadge';

export function SentimentLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 rounded-lg bg-card/30 border border-border/30">
      <span className="text-sm text-muted-foreground font-medium">Legend:</span>
      <div className="flex flex-wrap gap-3">
        <SentimentBadge sentiment="bullish" />
        <SentimentBadge sentiment="neutral" />
        <SentimentBadge sentiment="bearish" />
      </div>
    </div>
  );
}
