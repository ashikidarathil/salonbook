import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/user/Header';
import { Footer } from '@/components/user/Footer';
import { Loader } from '@/components/common/Loader';
import { AmountRow, BookingSummaryCard } from '@/components/payment/BookingSummaryCard';
import { APP_ROUTES } from '@/common/constants/app.routes';
import { matchesBookingRef } from '@/common/utils/bookingRef';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchBookingDetails } from '@/features/booking/booking.thunks';
import type { BookingItem } from '@/features/booking/booking.types';

/** Google Calendar "add event" link, in salon time. Opens Google, nothing is sent from here. */
const calendarLink = (booking: BookingItem) => {
  const day = booking.date.slice(0, 10).replace(/-/g, '');
  const time = (t: string) => `${t.replace(':', '')}00`;
  const services = booking.items
    .map((item) => item.serviceName)
    .filter(Boolean)
    .join(', ');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `SalonBook: ${services || 'Salon appointment'}`,
    dates: `${day}T${time(booking.startTime)}/${day}T${time(booking.endTime)}`,
    ctz: 'Asia/Kolkata',
    details: `Booking #${booking.bookingNumber}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export default function PaymentSuccessPage() {
  // URL holds the booking number (or the id, for old links)
  const { bookingId } = useParams<{ bookingId: string }>();
  const dispatch = useAppDispatch();
  const { currentBooking: storedBooking } = useAppSelector((state) => state.booking);
  // The store keeps the last viewed item until the new one loads; only use it if it matches the URL
  const booking = matchesBookingRef(storedBooking, bookingId) ? storedBooking : null;

  useEffect(() => {
    if (bookingId) dispatch(fetchBookingDetails(bookingId));
  }, [bookingId, dispatch]);

  const fullyPaid = booking?.paymentStatus === 'PAID';
  const paidNow = booking ? (fullyPaid ? booking.payableAmount : booking.advanceAmount) : 0;
  const atSalon = booking ? Math.max(booking.payableAmount - paidNow, 0) : 0;

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
              className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
                <Icon icon="solar:check-read-linear" className="size-8 text-white" />
              </span>
            </motion.span>
            <h1 className="mt-5 text-2xl font-bold sm:text-3xl">You&apos;re booked!</h1>
            <p className="mt-2 text-muted-foreground">
              Your payment went through and your appointment is confirmed.
            </p>
          </div>

          {booking ? (
            <BookingSummaryCard booking={booking}>
              <AmountRow
                label={fullyPaid ? 'Paid in full' : 'Paid now (20% advance)'}
                amount={paidNow}
                tone="green"
              />
              {atSalon > 0 && <AmountRow label="Pay at the salon" amount={atSalon} />}
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
              <Link
                to={
                  booking
                    ? APP_ROUTES.USER.BOOKING_DETAIL(booking.bookingNumber || booking.id)
                    : APP_ROUTES.USER.BOOKINGS
                }
                replace
                state={{ fromPayment: true }}
              >
                <Icon icon="solar:document-text-bold-duotone" className="mr-2 size-5" />
                View booking
              </Link>
            </Button>
            {booking && (
              <Button asChild variant="outline" className="h-11 font-semibold">
                <a href={calendarLink(booking)} target="_blank" rel="noreferrer">
                  <Icon icon="solar:calendar-add-bold-duotone" className="mr-2 size-5" />
                  Add to calendar
                </a>
              </Button>
            )}
          </div>
          <p className="text-center text-sm">
            <Link to="/" className="font-medium text-muted-foreground hover:text-primary">
              Back to home
            </Link>
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
