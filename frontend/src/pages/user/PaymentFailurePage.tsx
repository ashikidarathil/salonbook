import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/user/Header';
import { Footer } from '@/components/user/Footer';
import { Loader } from '@/components/common/Loader';
import { PaymentCountdown } from '@/components/common/PaymentCountdown';
import { AmountRow, BookingSummaryCard } from '@/components/payment/BookingSummaryCard';
import { APP_ROUTES } from '@/common/constants/app.routes';
import { matchesBookingRef } from '@/common/utils/bookingRef';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchBookingDetails } from '@/features/booking/booking.thunks';
import { BookingStatus } from '@/features/booking/booking.constants';

export default function PaymentFailurePage() {
  // URL holds the booking number (or the id, for old links)
  const { bookingId } = useParams<{ bookingId: string }>();
  const dispatch = useAppDispatch();
  const reason = (useLocation().state as { reason?: string } | null)?.reason;
  const { currentBooking: storedBooking } = useAppSelector((state) => state.booking);
  // The store keeps the last viewed item until the new one loads; only use it if it matches the URL
  const booking = matchesBookingRef(storedBooking, bookingId) ? storedBooking : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (bookingId) dispatch(fetchBookingDetails(bookingId));
  }, [bookingId, dispatch]);

  // Re-check every second so the buttons switch the moment the hold runs out
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const expiresAt = booking?.paymentWindowExpiresAt;
  const canRetry =
    booking?.status === BookingStatus.PENDING_PAYMENT &&
    !!expiresAt &&
    new Date(expiresAt).getTime() > now;
  const ref = booking ? booking.bookingNumber || booking.id : bookingId;
  const shownReason =
    reason && reason !== 'Payment failed' ? reason.replace(/^Payment failed:\s*/, '') : null;

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Header />
      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        <motion.div
          className="w-full max-w-xl space-y-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-rose-50 ring-8 ring-rose-50/50"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-rose-500 shadow-lg shadow-rose-200">
                <Icon icon="solar:close-circle-linear" className="size-8 text-white" />
              </span>
            </motion.span>
            <h1 className="mt-5 text-2xl font-bold sm:text-3xl">Payment didn&apos;t go through</h1>
            <p className="mt-2 text-muted-foreground">
              {!booking || canRetry
                ? 'Your booking isn’t confirmed yet. You can try paying again.'
                : 'Your booking wasn’t confirmed.'}
            </p>
            {shownReason && (
              <p className="mx-auto mt-3 max-w-md rounded-lg bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                Reason: {shownReason}
              </p>
            )}
          </div>

          {!booking ? (
            <div className="flex justify-center rounded-2xl border bg-white py-16">
              <Loader label="Loading your booking" />
            </div>
          ) : canRetry ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center sm:flex-row sm:text-left">
              <Icon
                icon="solar:clock-circle-bold-duotone"
                className="size-8 shrink-0 text-amber-600"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-amber-900">We&apos;re holding your slot</p>
                <p className="text-sm text-amber-800/80">
                  Pay before the timer ends to keep this time.
                </p>
              </div>
              <PaymentCountdown expiresAt={expiresAt!} variant="header" />
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border bg-white p-4">
              <Icon
                icon="solar:calendar-mark-bold-duotone"
                className="size-7 shrink-0 text-muted-foreground"
              />
              <div>
                <p className="font-semibold">This slot has been released</p>
                <p className="text-sm text-muted-foreground">
                  The 15-minute hold has ended. Pick a new time to book again.
                </p>
              </div>
            </div>
          )}

          {booking && (
            <BookingSummaryCard booking={booking}>
              <AmountRow
                label={canRetry ? 'Advance to pay now (20%)' : 'Advance (20%)'}
                amount={booking.advanceAmount}
                strong
              />
              <AmountRow label="Booking total" amount={booking.payableAmount} tone="muted" />
            </BookingSummaryCard>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {canRetry ? (
              <Button asChild className="h-11 font-semibold">
                <Link to={`/checkout/${ref}`}>
                  <Icon icon="solar:refresh-bold" className="mr-2 size-5" />
                  Try payment again
                </Link>
              </Button>
            ) : (
              <Button asChild className="h-11 font-semibold">
                <Link to="/services">
                  <Icon icon="solar:calendar-add-bold-duotone" className="mr-2 size-5" />
                  Book a new time
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="h-11 font-semibold">
              <Link to={APP_ROUTES.USER.BOOKINGS}>My bookings</Link>
            </Button>
          </div>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            If money left your account for this attempt, your bank usually returns it within 5–7
            working days.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
