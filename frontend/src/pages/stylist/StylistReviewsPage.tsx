import { useCallback, useEffect } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchReviews, fetchStylistRating } from '@/features/review/state/review.thunks';
import { useReviewFilters } from '@/features/review/useReviewFilters';
import { Loader } from '@/components/common/Loader';
import Pagination from '@/components/pagination/Pagination';
import { ReviewCard } from '@/components/review/ReviewCard';
import { ReviewFilters } from '@/components/review/ReviewFilters';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const LIMIT = 10;

export default function StylistReviewsPage() {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth.user?.id);
  const { reviews, total, stats, isLoading } = useAppSelector((state) => state.review);

  // Filters live in the address, so a refresh or coming back keeps them
  const filters = useReviewFilters();
  const { page, search, startDate, endDate } = filters;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const average = stats.averageRating || 0;

  const loadReviews = useCallback(() => {
    if (!userId) return;
    dispatch(fetchReviews({ stylistId: userId, page, limit: LIMIT, search, startDate, endDate }));
  }, [dispatch, userId, page, search, startDate, endDate]);

  useEffect(() => {
    if (userId) dispatch(fetchStylistRating(userId));
  }, [dispatch, userId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="break-words text-2xl font-bold sm:text-3xl">My Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See what your customers say about your work
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-50">
            <Star className="size-7 fill-yellow-400 text-yellow-400" />
          </span>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rating Overview</p>
            <p className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{average.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5.0</span>
            </p>
          </div>
        </div>
        <div className="sm:ml-auto sm:text-right">
          <span className="flex sm:justify-end" aria-label={`${average.toFixed(1)} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'size-5',
                  star <= Math.round(average)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/30',
                )}
              />
            ))}
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            From {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      <ReviewFilters filters={filters} />

      {isLoading && reviews.length === 0 ? (
        <div className="flex justify-center py-16">
          <Loader label="Loading reviews" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-12 text-center text-muted-foreground shadow-sm">
          <MessageSquare className="mx-auto mb-4 size-12 opacity-10" />
          <p className="text-sm">No reviews found.</p>
          {filters.hasFilters && (
            <Button variant="outline" className="mt-4 h-10" onClick={filters.clear}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className={cn('space-y-3', isLoading && 'opacity-60')}>
          <h2 className="text-sm font-semibold">
            Reviews <span className="text-muted-foreground">({total})</span>
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
          {totalPages > 1 && (
            <Pagination
              className="mt-2"
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(next) => filters.list.update({}, next)}
            />
          )}
        </div>
      )}
    </div>
  );
}
