import { SentimentType } from '@/types/crypto';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentBadgeProps {
  sentiment: SentimentType;
  showIcon?: boolean;
  className?: string;
}

const sentimentConfig = {
  bullish: {
    label: 'Bullish',
    icon: TrendingUp,
    classes: 'bg-bullish/20 text-bullish border-bullish/30',
  },
  bearish: {
    label: 'Bearish',
    icon: TrendingDown,
    classes: 'bg-bearish/20 text-bearish border-bearish/30',
  },
  neutral: {
    label: 'Neutral',
    icon: Minus,
    classes: 'bg-neutral/20 text-neutral-foreground border-neutral/30',
  },
};

export function SentimentBadge({ sentiment, showIcon = true, className }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.classes,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
