import { Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  tokenCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({ tokenCount, isLoading, onRefresh }: DashboardHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/20">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Crypto Sentinel</h1>
          <p className="text-sm text-muted-foreground">
            {tokenCount > 0 ? `${tokenCount} tokens tracked` : 'Market Sentiment Dashboard'}
          </p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isLoading}
        className="gap-2 border-border/50 bg-card/50 hover:bg-card"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </header>
  );
}
