'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn('mt-8 flex items-center justify-center gap-1 sm:gap-2', className)}
    >
      <Button
        variant="outline"
        size="sm"
        aria-label="Previous page"
        className="size-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:px-3"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {getPageNumbers().map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? 'default' : 'outline'}
          size="sm"
          aria-label={`Page ${page}`}
          aria-current={currentPage === page ? 'page' : undefined}
          className="size-9 shrink-0 p-0"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        aria-label="Next page"
        className="size-9 shrink-0 p-0 sm:h-9 sm:w-auto sm:px-3"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
