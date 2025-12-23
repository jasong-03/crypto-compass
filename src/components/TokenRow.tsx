import { TokenData } from '@/types/crypto';
import { SentimentBadge } from './SentimentBadge';
import { TableCell, TableRow } from '@/components/ui/table';

interface TokenRowProps {
  token: TokenData;
  onRowClick: (token: TokenData) => void;
}

export function TokenRow({ token, onRowClick }: TokenRowProps) {
  return (
    <TableRow 
      className="border-border/50 hover:bg-card/50 transition-colors cursor-pointer"
      onClick={() => onRowClick(token)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          {token.logo ? (
            <img 
              src={token.logo} 
              alt={token.symbol} 
              className="h-8 w-8 rounded-full object-cover bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${token.symbol}&background=random&color=fff&size=32`;
              }}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {token.symbol.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground">{token.symbol}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {token.parentProtocol}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="font-mono text-foreground">{token.price}</span>
      </TableCell>
      <TableCell>
        <SentimentBadge sentiment={token.fundamental} />
      </TableCell>
      <TableCell>
        <SentimentBadge sentiment={token.onchain} />
      </TableCell>
      <TableCell>
        <SentimentBadge sentiment={token.technical} />
      </TableCell>
      <TableCell>
        <SentimentBadge sentiment={token.overall} />
      </TableCell>
    </TableRow>
  );
}
