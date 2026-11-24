import { format } from 'date-fns';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { useReviewFilters } from '@/features/review/useReviewFilters';

const RANGES = [
  { value: 'ALL', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
] as const;

/** Search box, All / Today / 7 days / 30 days, and a single day. */
export function ReviewFilters({ filters }: { filters: ReturnType<typeof useReviewFilters> }) {
  const { list, range, day } = filters;
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_12rem]">
      <div className="relative min-w-0">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search reviews"
          placeholder="Search reviews..."
          value={list.search}
          onChange={(event) => list.update({ q: event.target.value })}
          className="h-10 pl-9 pr-10"
        />
        {list.search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => list.update({ q: undefined })}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem] xl:contents">
        <div
          className="grid grid-cols-4 gap-1 rounded-xl border bg-muted/40 p-1"
          role="group"
          aria-label="Filter by date"
        >
          {RANGES.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={range === item.value}
              onClick={() => list.update({ range: item.value, day: undefined })}
              className={cn(
                'h-8 min-w-0 rounded-lg px-2 text-xs font-semibold transition-colors xl:px-3',
                range === item.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Input
          type="date"
          aria-label="Choose a day"
          max={format(new Date(), 'yyyy-MM-dd')}
          value={day}
          onChange={(event) =>
            list.update({ day: event.target.value || undefined, range: undefined })
          }
          className={cn('h-10 min-w-0', range === 'day' && 'border-primary')}
        />
      </div>
    </div>
  );
}
