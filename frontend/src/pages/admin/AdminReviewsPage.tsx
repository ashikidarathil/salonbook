import { useCallback, useEffect } from 'react';
import { MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchReviews,
  deleteReviewThunk,
  restoreReviewThunk,
} from '@/features/review/state/review.thunks';
import { useReviewFilters } from '@/features/review/useReviewFilters';
import { Loader } from '@/components/common/Loader';
import { PageHeader } from '@/components/common/PageHeader';
import Pagination from '@/components/pagination/Pagination';
import { ReviewCard } from '@/components/review/ReviewCard';
import { ReviewFilters } from '@/components/review/ReviewFilters';
import { Button } from '@/components/ui/button';
import { showConfirm, showSuccess, showApiError } from '@/common/utils/swal.utils';

const LIMIT = 10;
export default function AdminReviewsPage() {
  const dispatch = useAppDispatch();
  const { reviews, total, isLoading } = useAppSelector((state) => state.review);

  const filters = useReviewFilters();
  const { page, search, startDate, endDate } = filters;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const loadReviews = useCallback(() => {
    dispatch(
      fetchReviews({ page, limit: LIMIT, search, startDate, endDate, includeDeleted: true }),
    );
  }, [dispatch, page, search, startDate, endDate]);

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

      <ReviewFilters filters={filters} />

      {isLoading ? (
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
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">
            Reviews <span className="text-muted-foreground">({total})</span>
          </h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                actions={
                  review.isDeleted ? (
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
                  )
                }
              />
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
