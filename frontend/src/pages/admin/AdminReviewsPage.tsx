import { useCallback, useEffect } from 'react';
import { endOfDay, format, parseISO, startOfDay, subDays } from 'date-fns';
import { MessageSquare, RotateCcw, Search, Star, Trash2, User, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchReviews,
  deleteReviewThunk,
  restoreReviewThunk,
} from '@/features/review/state/review.thunks';
import type { ReviewPaginationParams } from '@/features/review/review.types';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import Pagination from '@/components/pagination/Pagination';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showConfirm, showSuccess, showApiError } from '@/common/utils/swal.utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';

const LIMIT = 10;
const RANGES = [
  { value: 'ALL', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 days' },
  { value: 'month', label: '30 days' },
] as const;

const todayValue = () => format(new Date(), 'yyyy-MM-dd');
const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default function AdminReviewsPage() {
  const dispatch = useAppDispatch();
  const { reviews, total, isLoading } = useAppSelector((state) => state.review);

  // Filters live in the address, so a refresh or coming back keeps them
  const list = useListParams();
  const debouncedSearch = useDebounce(list.search, 500);
  const day = isDay(list.value('day')) ? list.value('day') : '';
  const range = day ? 'day' : list.value('range');
  const page = list.page;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const hasFilters = !!list.search || range !== 'ALL';

  const loadReviews = useCallback(() => {
    const params: ReviewPaginationParams = {
      page,
      limit: LIMIT,
      search: debouncedSearch.trim() || undefined,
      includeDeleted: true,
    };
    const now = new Date();
    let start: Date | undefined;
    let end = endOfDay(now);
    if (range === 'day') {
      start = startOfDay(parseISO(day));
      end = endOfDay(parseISO(day));
    } else if (range === 'today') start = startOfDay(now);
    else if (range === 'week') start = startOfDay(subDays(now, 7));
    else if (range === 'month') start = startOfDay(subDays(now, 30));
    if (start) {
      params.startDate = start.toISOString();
      params.endDate = end.toISOString();
    }
    dispatch(fetchReviews(params));
  }, [dispatch, page, debouncedSearch, range, day]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Delete Review?',
      'It will be hidden from public view. You can restore it later.',
      'Yes, Delete',
      'Cancel',
      '#ef4444',
    );
    if (!confirmed) return;
    try {
      await dispatch(deleteReviewThunk(id)).unwrap();
      showSuccess('Deleted', 'Review has been hidden.');
    } catch (error) {
      showApiError(error, 'Failed to delete review');
    }
  };

  const handleRestore = async (id: string) => {
    const confirmed = await showConfirm(
      'Restore Review?',
      'It will be visible to everyone again.',
      'Yes, Restore',
      'Cancel',
      '#10b981',
    );
    if (!confirmed) return;
    try {
      await dispatch(restoreReviewThunk(id)).unwrap();
      showSuccess('Restored', 'Review is visible again.');
    } catch (error) {
      showApiError(error, 'Failed to restore review');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Review Management"
        description="Monitor and manage customer feedback across the salon."
        breadcrumbs={[{ label: 'Reviews' }]}
      />

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
            max={todayValue()}
            value={day}
            onChange={(event) =>
              list.update({ day: event.target.value || undefined, range: undefined })
            }
            className={cn('h-10 min-w-0', range === 'day' && 'border-primary')}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader label="Loading reviews" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
          <MessageSquare className="mx-auto mb-4 size-12 opacity-10" />
          <p className="text-sm">No reviews found.</p>
          {hasFilters && (
            <Button
              variant="outline"
              className="mt-4 h-10"
              onClick={() => list.update({ q: undefined, range: undefined, day: undefined })}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            Reviews <span className="text-muted-foreground">({total})</span>
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {reviews.map((review) => (
              <li
                key={review.id}
                className={cn(
                  'flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5',
                  review.isDeleted && 'bg-muted/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 shrink-0 border">
                    <AvatarImage src={review.userId?.profilePicture} />
                    <AvatarFallback>
                      <User className="size-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-semibold">
                        {review.userId?.name || 'Anonymous User'}
                      </p>
                      {review.isDeleted && (
                        <Badge variant="destructive" className="shrink-0">
                          Deleted
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="flex" aria-label={`${review.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'size-4',
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30',
                            )}
                          />
                        ))}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.createdAt), 'd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment ? (
                  <p className="break-words border-l-2 border-muted pl-3 text-sm text-muted-foreground">
                    “{review.comment}”
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">No comment</p>
                )}
                {review.isDeleted ? (
                  <Button
                    variant="outline"
                    className="mt-auto h-10 w-full gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700 sm:w-auto sm:self-end"
                    onClick={() => handleRestore(review.id)}
                  >
                    <RotateCcw className="size-4" />
                    Restore
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-auto h-10 w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600 sm:w-auto sm:self-end"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              className="mt-2"
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(next) => list.update({}, next)}
            />
          )}
        </div>
      )}
    </div>
  );
}
