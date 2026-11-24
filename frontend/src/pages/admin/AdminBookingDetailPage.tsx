import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { matchesBookingRef } from '@/common/utils/bookingRef';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchBookingDetails, updateBookingStatus } from '@/features/booking/booking.thunks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { showApiError, showSuccess, showCancellationConfirm } from '@/common/utils/swal.utils';
import { BookingStatus, BOOKING_MESSAGES } from '@/features/booking/booking.constants';
import { LoadingGate } from '@/components/common/LoadingGate';
import { bookingStatusClass, bookingStatusLabel } from '@/features/booking/bookingStatusStyle';
import { cn } from '@/lib/utils';

const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';
const rupees = (amount?: number) => `₹${(amount ?? 0).toLocaleString('en-IN')}`;
const words = (value?: string) =>
  (value ?? '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function AdminBookingDetailPage() {
  // URL holds the booking number (or the id, for old links)
  const { id: ref } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    currentBooking: storedBooking,
    loading,
    error,
  } = useAppSelector((state) => state.booking);
  // The store keeps the last viewed item until the new one loads; only use it if it matches the URL
  const currentBooking = matchesBookingRef(storedBooking, ref) ? storedBooking : null;

  // Old links use the id: switch the URL to the readable booking number once loaded
  useEffect(() => {
    if (currentBooking?.bookingNumber && ref && ref !== currentBooking.bookingNumber) {
      navigate(location.pathname.replace(ref, currentBooking.bookingNumber), { replace: true });
    }
  }, [currentBooking?.bookingNumber, ref, location.pathname, navigate]);

  useEffect(() => {
    if (ref) dispatch(fetchBookingDetails(ref));
  }, [ref, dispatch]);

  const handleStatusUpdate = async (status: BookingStatus, label: string) => {
    if (!currentBooking) return;
    const result = await dispatch(updateBookingStatus({ bookingId: currentBooking.id, status }));
    if (updateBookingStatus.fulfilled.match(result)) {
      showSuccess('Updated!', `Booking marked as ${label}`);
    } else {
      showApiError(BOOKING_MESSAGES.STATUS_UPDATE_FAILED, `Failed to update status`);
    }
  };

  const handleCancel = async () => {
    if (!currentBooking) return;
    const reason = await showCancellationConfirm();
    if (reason) {
      const result = await dispatch(
        updateBookingStatus({ bookingId: currentBooking.id, status: BookingStatus.CANCELLED }),
      );
      if (updateBookingStatus.fulfilled.match(result))
        showSuccess('Cancelled!', BOOKING_MESSAGES.CANCEL_SUCCESS);
    }
  };

  if (!currentBooking && !loading && !error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Icon icon="solar:calendar-minimalistic-broken" className="size-16 opacity-40" />
        <p className="text-lg font-medium text-muted-foreground">Booking not found</p>
        <Button onClick={() => navigate('/admin/bookings')} variant="outline">
          Back to All Bookings
        </Button>
      </div>
    );
  }

  const b = currentBooking;

  return (
    <LoadingGate
      loading={loading || (!currentBooking && !error)}
      error={error}
      data={currentBooking}
      resetError={() => ref && dispatch(fetchBookingDetails(ref))}
      backPath="/admin/bookings"
    >
      {/* Everything about the booking in one card, like the stylist page */}
      <Card className="w-full overflow-hidden border-border/60 text-foreground shadow-sm">
        <CardContent className="divide-y divide-border/60 !p-0">
          <div className="flex items-start gap-2 p-4 sm:gap-3 sm:p-6">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              className="-ml-2 size-10 shrink-0"
              onClick={() => navigate(-1)}
            >
              <Icon icon="solar:arrow-left-linear" className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="break-words text-2xl font-bold sm:text-3xl">Manage Booking</h1>
              <p className="mt-1 break-all font-mono text-sm text-muted-foreground">
                #{b?.bookingNumber}
              </p>
            </div>
            {b && (
              <Badge variant="outline" className={cn('mt-1 shrink-0', bookingStatusClass(b.status))}>
                {bookingStatusLabel(b.status)}
              </Badge>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 sm:p-6">
            <div className="min-w-0">
              <dt className={LABEL}>Date</dt>
              <dd className="mt-1 font-bold">
                {b?.date ? format(new Date(b.date), 'EEE, d MMM yyyy') : ''}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className={LABEL}>Time</dt>
              <dd className="mt-1 font-bold">
                {b?.startTime} – {b?.endTime}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className={LABEL}>Customer</dt>
              <dd className="mt-1 break-words font-bold">{b?.userName || 'Customer'}</dd>
            </div>
            <div className="min-w-0">
              <dt className={LABEL}>Payment</dt>
              <dd className="mt-1 font-bold">{words(b?.paymentStatus)}</dd>
            </div>
            <div className="min-w-0">
              <dt className={LABEL}>Rescheduled</dt>
              <dd className="mt-1 font-bold">
                {b?.rescheduleCount || 0} {b?.rescheduleCount === 1 ? 'time' : 'times'}
              </dd>
            </div>
          </dl>

          <section className="space-y-4 p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Icon icon="solar:scissors-square-bold-duotone" className="size-5 text-primary" />
              Services &amp; stylists
            </h2>
            <ul className="space-y-2">
              {b?.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 p-3"
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold">{item.serviceName || 'Service'}</p>
                    <p className="mt-0.5 break-words text-xs text-muted-foreground">
                      {item.stylistName} · {item.duration} min · {item.startTime} – {item.endTime}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{rupees(item.price)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-dashed pt-4 text-sm">
              <div className="flex justify-between gap-3 text-muted-foreground">
                <dt>Subtotal</dt>
                <dd>{rupees(b?.totalPrice)}</dd>
              </div>
              {(b?.discountAmount ?? 0) > 0 && (
                <div className="flex justify-between gap-3 text-red-600">
                  <dt>Discount</dt>
                  <dd>- {rupees(b?.discountAmount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="font-bold">Net Total</dt>
                <dd className="break-all text-xl font-bold text-primary sm:text-2xl">
                  {rupees(b?.payableAmount)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                <dt>Advance collected (20%)</dt>
                <dd>{rupees(b?.advanceAmount)}</dd>
              </div>
            </dl>
          </section>

          {b?.notes && (
            <section className="p-4 sm:p-6">
              <div className="rounded-xl border border-yellow-100 bg-yellow-50/60 p-4">
                <p className="mb-1 text-[11px] font-bold uppercase text-yellow-700">Customer note</p>
                <p className="break-words text-sm">“{b.notes}”</p>
              </div>
            </section>
          )}

          {b?.cancelledAt && (
            <section className="p-4 sm:p-6">
              <div className="rounded-xl border border-red-100 bg-red-50/60 p-4 text-sm">
                <p className="mb-1 text-[11px] font-bold uppercase text-red-700">Cancelled</p>
                <p className="text-red-700">
                  By {words(b.cancelledBy)} · {format(new Date(b.cancelledAt), 'd MMM yyyy, h:mm a')}
                </p>
                {b.cancelledReason && (
                  <p className="mt-1 break-words italic text-muted-foreground">
                    “{b.cancelledReason}”
                  </p>
                )}
              </div>
            </section>
          )}

          {b?.status === BookingStatus.CONFIRMED && (
            <div className="grid gap-3 bg-muted/20 p-4 sm:grid-cols-3 sm:p-6">
              <Button
                className="h-11 gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                onClick={() => handleStatusUpdate(BookingStatus.COMPLETED, 'Completed')}
              >
                <Icon icon="solar:check-circle-bold-duotone" className="size-5" />
                Mark as Completed
              </Button>
              <Button
                variant="outline"
                className="h-11 min-w-0 gap-2"
                onClick={() => handleStatusUpdate(BookingStatus.NO_SHOW, 'No Show')}
              >
                <Icon icon="solar:ghost-bold-duotone" className="size-4 shrink-0" />
                No Show
              </Button>
              <Button
                variant="outline"
                className="h-11 min-w-0 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600"
                onClick={handleCancel}
              >
                <Icon icon="solar:close-circle-bold-duotone" className="size-4 shrink-0" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </LoadingGate>
  );
}
