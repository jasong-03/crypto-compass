import { useState } from 'react';
import { useCryptoData } from '@/hooks/useCryptoData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SentimentLegend } from '@/components/SentimentLegend';
import { TokenTable } from '@/components/TokenTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const Index = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { tokens, pagination, isLoading, isError, error, refetch } = useCryptoData(currentPage);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <DashboardHeader 
          tokenCount={tokens.length} 
          isLoading={isLoading}
          onRefresh={refetch}
        />

        <SentimentLegend />

        {isError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load market data'}
            </AlertDescription>
          </Alert>
        )}

        <TokenTable tokens={tokens} isLoading={isLoading} />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.hasPrevPage) {
                        setCurrentPage(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={!pagination.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {pagination.totalPages > 5 && currentPage < pagination.totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.hasNextPage) {
                        setCurrentPage(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Showing page {pagination?.page || 1} of {pagination?.totalPages || 1} 
            {pagination?.total && ` (${pagination.total} total tokens)`}
          </p>
          <p className="mt-2">Data refreshes every 5 minutes. Prices are hardcoded for demo purposes.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
