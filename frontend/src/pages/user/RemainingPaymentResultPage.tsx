import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { APP_ROUTES } from '@/common/constants/app.routes';
import { matchesBookingRef } from '@/common/utils/bookingRef';
import { cleanReason } from '@/features/payment/cleanReason';
import { fetchBookingDetails } from '@/features/booking/booking.thunks';
import { Loader } from '@/components/common/Loader';
import { AmountRow, BookingSummaryCard } from '@/components/payment/BookingSummaryCard';
import { ResultBody, ResultHero } from '@/components/payment/ResultHero';
import { Button } from '@/components/ui/button';

/** Shown after paying the remaining 80% of a booking, by card or wallet. */
export default function RemainingPaymentResultPage({
  outcome,
}: {
  outcome: 'success' | 'failure';
}) {
  // URL holds the booking number (or the id, for old links)
  const { id: ref } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const state = (useLocation().state ?? {}) as { reason?: string; method?: 'wallet' | 'razorpay' };
  const { currentBooking: storedBooking } = useAppSelector((s) => s.booking);
  const booking = matchesBookingRef(storedBooking, ref) ? storedBooking : null;
  const success = outcome === 'success';

  useEffect(() => {
    if (ref) dispatch(fetchBookingDetails(ref));
  }, [ref, dispatch]);

  const remaining = booking ? Math.max(booking.payableAmount - booking.advanceAmount, 0) : 0;
  const detailLink = APP_ROUTES.USER.BOOKING_DETAIL(ref ?? '');

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12">
      <ResultBody>
        <ResultHero
          outcome={outcome}
          title={success ? 'Fully paid' : 'Payment didn’t go through'}
          message={
            success
              ? `The rest of your booking is paid${state.method === 'wallet' ? ' from your wallet' : ''}. Nothing more to pay at the salon.`
              : 'Your booking is still confirmed. You can pay the rest again now or at the salon.'
          }
          reason={success ? null : cleanReason(state.reason)}
        />

        {booking ? (
          <BookingSummaryCard booking={booking}>
            <AmountRow
              label="Advance paid earlier (20%)"
              amount={booking.advanceAmount}
              tone="muted"
            />
            <AmountRow
              label={success ? 'Paid now (80%)' : 'Still to pay (80%)'}
              amount={remaining}
              tone={success ? 'green' : undefined}
              strong={!success}
            />
            <div className="border-t pt-2">
              <AmountRow label="Total" amount={booking.payableAmount} strong />
            </div>
          </BookingSummaryCard>
        ) : (
          <div className="flex justify-center rounded-2xl border bg-white py-16">
            <Loader label="Loading your booking" />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="h-11 font-semibold">
            <Link to={detailLink}>
              <Icon
                icon={success ? 'solar:document-text-bold-duotone' : 'solar:refresh-bold'}
                className="mr-2 size-5"
              />
              {success ? 'View booking' : 'Try again'}
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-11 font-semibold">
            <Link to={APP_ROUTES.USER.BOOKINGS}>My bookings</Link>
          </Button>
        </div>
        {!success && (
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            If money left your account for this attempt, your bank usually returns it within 5–7
            working days.
          </p>
        )}
      </ResultBody>
    </div>
  );
}
