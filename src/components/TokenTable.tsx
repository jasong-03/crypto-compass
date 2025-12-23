import { useState } from 'react';
import { TokenData } from '@/types/crypto';
import { TokenRow } from './TokenRow';
import { OnchainDetailModal } from './OnchainDetailModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface TokenTableProps {
  tokens: TokenData[];
  isLoading: boolean;
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-border/50">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function TokenTable({ tokens, isLoading }: TokenTableProps) {
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleRowClick = (token: TokenData) => {
    setSelectedToken(token);
    setModalOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold">Token</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Price</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Fundamental</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Onchain</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Technical</TableHead>
              <TableHead className="text-muted-foreground font-semibold">Overall</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingSkeleton />
            ) : tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No tokens found
                </TableCell>
              </TableRow>
            ) : (
              tokens.map((token) => (
                <TokenRow 
                  key={token.parentProtocol} 
                  token={token} 
                  onRowClick={handleRowClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OnchainDetailModal 
        token={selectedToken} 
        open={modalOpen} 
        onOpenChange={setModalOpen}
      />
    </>
  );
}
