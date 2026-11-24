import { bookingRef } from '@/common/utils/bookingRef';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyBookings, cancelBooking } from '@/features/booking/booking.thunks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { LoadingGate } from '@/components/common/LoadingGate';
import { format } from 'date-fns';
import { formatRupees } from '@/common/utils/money';
import { bookingStatusClass, bookingStatusLabel } from '@/features/booking/bookingStatusStyle';
import { cn } from '@/lib/utils';
import { showApiError, showSuccess, showCancellationConfirm } from '@/common/utils/swal.utils';
import { fetchUserRooms, initializeChatRoom } from '@/features/chat/chat.thunks';
import type { ChatRoom } from '@/features/chat/chat.types';
import type { RootState } from '@/app/store';
import type { BookingItem } from '@/features/booking/booking.types';
import {
  BookingStatus,
  PaymentStatus,
  BOOKING_MESSAGES,
  BOOKING_RULES,
} from '@/features/booking/booking.constants';
import { PaymentCountdown } from '@/components/common/PaymentCountdown';

/** PAID → Paid, ADVANCE_PAID → Advance Paid */
const paymentLabel = (status?: string) =>
  (status ?? '')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myBookings, loading, error } = useAppSelector((state) => state.booking);
  const { rooms } = useAppSelector((state: RootState) => state.chat);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    dispatch(fetchMyBookings());
    dispatch(fetchUserRooms());
  }, [dispatch]);

  const handleOpenChat = async (bookingId: string) => {
    let room = rooms.find((r: ChatRoom) => r.bookingId === bookingId);

    if (!room) {
      try {
        const action = await dispatch(initializeChatRoom(bookingId)).unwrap();
        room = action;
        // showSuccess('Room Ready', 'Chat room initialized successfully.');
      } catch {
        showApiError('Chat room not ready yet.', 'Please try again later.');
        return;
      }
    }

    if (room && room.id) {
      navigate(`/chat?roomId=${room.id}`);
    } else {
      showApiError('Chat room not ready yet.', 'Please try again later.');
    }
  };

  useEffect(() => {
    const shouldOpenChat = searchParams.get('openChat') === 'true';
    if (shouldOpenChat) {
      const firstValidBooking = myBookings.find(
        (b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED,
      );

      if (firstValidBooking) {
        const room = rooms.find((r: ChatRoom) => r.bookingId === firstValidBooking.id);

        const openWidget = (r: { id: string }) => {
          navigate(`/profile/chat?roomId=${r.id}`);
        };

        if (room) {
          openWidget(room);
        } else {
          dispatch(initializeChatRoom(firstValidBooking.id))
            .unwrap()
            .then((newRoom) => openWidget(newRoom))
            .catch(() => setSearchParams({}));
        }
      } else {
        setSearchParams({});
      }
    }
  }, [searchParams, rooms, myBookings, dispatch, setSearchParams, navigate]);

  const checkLeadTime = (bookingDate: string, startTime: string) => {
    try {
      // 1. Parse booking date (e.g., "2026-02-28T00:00:00.000Z")
      const appointmentDate = new Date(bookingDate);
      const [hours, minutes] = startTime.split(':').map(Number);

      // 2. Set the appointment time (HH:mm)
      appointmentDate.setHours(hours, minutes, 0, 0);

      // 3. Current time
      const now = new Date();

      // 4. Calculate difference in hours
      const diffMs = appointmentDate.getTime() - now.getTime();
      const diffHrs = diffMs / (1000 * 60 * 60);

      return diffHrs >= BOOKING_RULES.LEAD_TIME_HOURS;
    } catch {
      return false;
    }
  };

  const handleCancelClick = async (booking: BookingItem) => {
    if (!checkLeadTime(booking.date, booking.startTime)) {
      showApiError(BOOKING_MESSAGES.LEAD_TIME_ERROR, 'Cannot Cancel');
      return;
    }

    const reason = await showCancellationConfirm();
    if (reason) {
      const result = await dispatch(cancelBooking({ bookingId: booking.id, reason }));
      if (cancelBooking.fulfilled.match(result)) {
        showSuccess('Cancelled!', 'Your booking has been cancelled.');
      }
    }
  };

  const handleRescheduleClick = (booking: BookingItem) => {
    if (!checkLeadTime(booking.date, booking.startTime)) {
      showApiError(BOOKING_MESSAGES.LEAD_TIME_ERROR, 'Cannot Reschedule');
      return;
    }

    if (booking.rescheduleCount && booking.rescheduleCount >= BOOKING_RULES.MAX_RESCHEDULES) {
      showApiError(BOOKING_MESSAGES.RESCHEDULE_LIMIT_REACHED, 'Limit Reached');
      return;
    }

    navigate(`/profile/bookings/${bookingRef(booking)}/reschedule`);
  };

  return (
    <div className="space-y-6 p-4 text-foreground sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="break-words text-2xl font-bold sm:text-3xl">My Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your salon appointments
          </p>
        </div>
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={myBookings}
        emptyMessage="You don't have any bookings yet."
        emptyIcon="solar:calendar-minimalistic-broken"
      >
        <ul className="grid gap-3 lg:grid-cols-2">
          {myBookings.map((booking) => {
            const items = booking.items ?? [];
            const services =
              items
                .map((item) => item.serviceName)
                .filter(Boolean)
                .join(' + ') || 'Salon appointment';
            const stylists =
              [...new Set(items.map((item) => item.stylistName).filter(Boolean))].join(', ') ||
              booking.stylistName ||
              'Expert Stylist';
            const pending = booking.status === BookingStatus.PENDING_PAYMENT;
            const advancePaid = booking.paymentStatus === PaymentStatus.ADVANCE_PAID;
            const paymentOpen =
              !!booking.paymentWindowExpiresAt &&
              new Date(booking.paymentWindowExpiresAt) > new Date();
            const amountLabel = pending
              ? 'Advance due (20%)'
              : advancePaid
                ? 'Advance paid (20%)'
                : 'Total amount';
            const amount = pending || advancePaid ? booking.advanceAmount : booking.totalPrice;
            return (
              <li
                key={booking.id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs font-bold text-muted-foreground">
                      #{booking.bookingNumber}
                    </p>
                    <p className="mt-1 font-semibold">
                      {booking.date
                        ? format(new Date(booking.date), 'EEE, d MMM yyyy')
                        : 'Date not set'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.startTime} – {booking.endTime}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0', bookingStatusClass(booking.status as BookingStatus))}
                  >
                    {bookingStatusLabel(booking.status as BookingStatus)}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon
                      icon="solar:scissors-square-bold-duotone"
                      className="size-6 text-primary"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold">{services}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Icon icon="solar:user-bold-duotone" className="size-3 shrink-0" />
                      <span className="truncate">{stylists}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <Badge variant="outline" className="mt-1">
                      {paymentLabel(booking.paymentStatus)}
                    </Badge>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-xs text-muted-foreground">{amountLabel}</p>
                    <p
                      className={cn(
                        'break-all text-xl font-bold',
                        advancePaid ? 'text-green-600' : 'text-primary',
                      )}
                    >
                      {formatRupees(amount)}
                    </p>
                    {(pending || advancePaid) && (
                      <p className="text-xs text-muted-foreground">
                        of {formatRupees(booking.totalPrice)} total
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  {pending &&
                    (paymentOpen ? (
                      <>
                        {booking.paymentWindowExpiresAt && (
                          <div className="col-span-2">
                            <PaymentCountdown expiresAt={booking.paymentWindowExpiresAt} />
                          </div>
                        )}
                        <Button
                          className="col-span-2 h-10 gap-2"
                          onClick={() => navigate(`/checkout/${bookingRef(booking)}`)}
                        >
                          <Icon icon="solar:card-2-bold" className="size-4" />
                          Pay Advance Now
                        </Button>
                      </>
                    ) : (
                      <p className="col-span-2 rounded-lg border border-red-100 bg-red-50 p-2 text-center text-sm text-red-600">
                        Payment time ran out, so the slot was released.
                      </p>
                    ))}

                  {booking.status === BookingStatus.COMPLETED && advancePaid && (
                    <Button
                      className="col-span-2 h-10 gap-2"
                      onClick={() => navigate(`/profile/bookings/${bookingRef(booking)}`)}
                    >
                      <Icon icon="solar:wallet-money-bold" className="size-4" />
                      Pay Remaining
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="h-10 min-w-0 gap-2 px-2"
                    onClick={() => navigate(`/profile/bookings/${bookingRef(booking)}`)}
                  >
                    <Icon icon="solar:document-text-linear" className="size-4 shrink-0" />
                    Details
                  </Button>

                  {(booking.status === BookingStatus.CONFIRMED ||
                    booking.status === BookingStatus.COMPLETED) && (
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 gap-2 border-primary/20 px-2 text-primary hover:bg-primary/5 hover:text-primary"
                      onClick={() => handleOpenChat(booking.id)}
                    >
                      <Icon icon="solar:chat-round-bold-duotone" className="size-4 shrink-0" />
                      Chat
                    </Button>
                  )}

                  {booking.status === BookingStatus.CONFIRMED && (
                    <>
                      <Button
                        variant="outline"
                        className="h-10 min-w-0 gap-2 px-2"
                        onClick={() => handleRescheduleClick(booking)}
                        disabled={
                          booking.rescheduleCount
                            ? booking.rescheduleCount >= BOOKING_RULES.MAX_RESCHEDULES
                            : false
                        }
                      >
                        <Icon icon="solar:calendar-rotate-linear" className="size-4 shrink-0" />
                        Reschedule
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 min-w-0 gap-2 border-red-200 px-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleCancelClick(booking)}
                      >
                        <Icon icon="solar:close-circle-linear" className="size-4 shrink-0" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </LoadingGate>
    </div>
  );
}
