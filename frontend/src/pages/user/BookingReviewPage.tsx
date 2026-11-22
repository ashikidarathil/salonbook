import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { matchesBookingRef } from '@/common/utils/bookingRef';
import { showApiError, showSuccess } from '@/common/utils/swal.utils';
import { fetchBookingDetails } from '@/features/booking/booking.thunks';
import { BookingStatus } from '@/features/booking/booking.constants';
import { createReviewThunk } from '@/features/review/state/review.thunks';
import { FormPage } from '@/components/common/FormPage';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const TITLE = 'Rate Your Experience';

export default function BookingReviewPage() {
  const { id: ref } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentBooking, error } = useAppSelector((state) => state.booking);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backTo = `/profile/bookings/${ref}`;
  const breadcrumbs = [
    { label: 'My Bookings', href: '/profile/bookings' },
    { label: ref ?? 'Booking', href: backTo },
    { label: 'Review' },
  ];
  const booking = matchesBookingRef(currentBooking, ref) ? currentBooking : null;

  useEffect(() => {
    if (ref) dispatch(fetchBookingDetails(ref));
  }, [dispatch, ref]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!booking) return;
    if (rating === 0) {
      setRatingError('Please select a rating');
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(createReviewThunk({ bookingId: booking.id, rating, comment })).unwrap();
      showSuccess('Review Submitted', 'Thank you for your feedback!');
      navigate(backTo, { replace: true });
    } catch (err) {
      showApiError(err, 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking || booking.status !== BookingStatus.COMPLETED) {
    const message = booking
      ? 'You can review a booking after it is completed.'
      : error
        ? 'This booking could not be found.'
        : undefined;
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <InnerPageStatus
          title={TITLE}
          breadcrumbs={breadcrumbs}
          backTo={backTo}
          message={message}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FormPage
        title={TITLE}
        description={`Booking #${booking.bookingNumber}. Your feedback helps us improve.`}
        breadcrumbs={breadcrumbs}
        backTo={backTo}
        submitLabel={isSubmitting ? 'Submitting...' : 'Submit Review'}
        isSubmitting={isSubmitting}
        onSubmit={submit}
      >
        <fieldset className="flex flex-col items-center gap-3 py-2">
          <legend className="sr-only">Rating</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                aria-pressed={rating === star}
                className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  setRating(star);
                  setRatingError(undefined);
                }}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star
                  className={`size-9 sm:size-11 ${
                    (hover || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
          </span>
          {ratingError && <p className="text-sm text-red-600">{ratingError}</p>}
        </fieldset>
        <div className="space-y-2">
          <Label htmlFor="review-comment">Comments (optional)</Label>
          <Textarea
            id="review-comment"
            rows={5}
            placeholder="Share more about your experience..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
      </FormPage>
    </div>
  );
}
