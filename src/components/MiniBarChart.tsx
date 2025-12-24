import { cn } from '@/lib/utils';

interface MiniBarChartProps {
  values: (number | null)[];
  className?: string;
}

export function MiniBarChart({ values, className }: MiniBarChartProps) {
  // Filter out nulls for calculating max
  const validValues = values.filter((v): v is number => v !== null);

  if (validValues.length === 0) {
    return <span className="text-muted-foreground text-xs">N/A</span>;
  }

  const maxAbsValue = Math.max(...validValues.map(v => Math.abs(v)), 1);

  return (
    <div className={cn('flex items-end gap-0.5 h-6', className)}>
      {values.map((value, index) => {
        if (value === null) {
          // Empty/null value - show gray placeholder
          return (
            <div
              key={index}
              className="w-2 h-1 bg-muted-foreground/30 rounded-sm"
            />
          );
        }

        // Calculate height based on absolute value (min 20%, max 100%)
        const heightPercent = Math.max(20, (Math.abs(value) / maxAbsValue) * 100);

        // Determine color: negative = bullish (green), positive = bearish (red)
        // This follows the convention: outflow (positive) = bearish, inflow (negative) = bullish
        const isPositive = value >= 0;
        const colorClass = isPositive ? 'bg-bearish' : 'bg-bullish';

        return (
          <div
            key={index}
            className={cn('w-2 rounded-sm transition-all', colorClass)}
            style={{ height: `${heightPercent}%` }}
            title={`${value >= 0 ? '+' : ''}${value.toLocaleString()}`}
          />
        );
      })}
    </div>
  );
}
