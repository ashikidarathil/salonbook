import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { matchesBookingRef } from '@/common/utils/bookingRef';
import { showApiError, showSuccess } from '@/common/utils/swal.utils';
import { fetchBookingDetails, rescheduleBooking } from '@/features/booking/booking.thunks';
import {
  BOOKING_MESSAGES,
  BOOKING_RULES,
  BookingStatus,
} from '@/features/booking/booking.constants';
import type { BookingItem } from '@/features/booking/booking.types';
import { InnerPageStatus } from '@/components/common/InnerPageStatus';
import { PageHeader } from '@/components/common/PageHeader';
import { SlotPicker, type SlotSelection } from '@/components/booking/SlotPicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// The server refuses a reschedule less than 24 hours before the appointment
const RESCHEDULE_LEAD_HOURS = 24;

const addMinutes = (time: string, minutes: number) => {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

const blockedReason = (booking: BookingItem) => {
  if (booking.status !== BookingStatus.CONFIRMED) {
    return 'Only confirmed bookings can be rescheduled.';
  }
  if ((booking.rescheduleCount ?? 0) >= BOOKING_RULES.MAX_RESCHEDULES) {
    return BOOKING_MESSAGES.RESCHEDULE_LIMIT_REACHED;
  }
  const start = new Date(booking.date);
  const [hours, minutes] = booking.startTime.split(':').map(Number);
  start.setHours(hours, minutes, 0, 0);
  const hoursLeft = (start.getTime() - new Date().getTime()) / 3600000;
  return hoursLeft < RESCHEDULE_LEAD_HOURS
    ? 'Bookings can only be rescheduled at least 24 hours in advance.'
    : null;
};

export default function RescheduleBookingPage() {
  const { id: ref } = useParams<{ id: string }>();
  const { pathname, state } = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentBooking, error } = useAppSelector((store) => store.booking);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = pathname.startsWith('/admin');
  const listPath = isAdmin ? '/admin/bookings' : '/profile/bookings';
  const listSearch = (state as { from?: string } | null)?.from ?? '';
  const listHref = `${listPath}${listSearch}`;
  const detailHref = `${listPath}/${ref}`;
  const breadcrumbs = [
    { label: isAdmin ? 'Bookings' : 'My Bookings', href: listHref },
    { label: ref ?? 'Booking', href: detailHref },
    { label: 'Reschedule' },
  ];
  const booking = matchesBookingRef(currentBooking, ref) ? currentBooking : null;
  // The admin layout already pads its pages; the customer profile layout does not
  const shellPadding = isAdmin ? '' : 'p-4 sm:p-6 lg:p-8';

  useEffect(() => {
    if (ref) dispatch(fetchBookingDetails(ref));
  }, [dispatch, ref]);

  if (!booking) {
    return (
      <div className={shellPadding}>
        <InnerPageStatus
          title="Reschedule Booking"
          breadcrumbs={breadcrumbs}
          backTo={listHref}
          message={error ? 'This booking could not be found.' : undefined}
        />
      </div>
    );
  }

  const blocked = blockedReason(booking);
  if (blocked && !isSaving) {
    return (
      <div className={shellPadding}>
        <InnerPageStatus
          title="Reschedule Booking"
          breadcrumbs={breadcrumbs}
          backTo={detailHref}
          message={blocked}
        />
      </div>
    );
  }

  const submit = async (selection: SlotSelection) => {
    const text = reason.trim();
    if (!text) {
      setReasonError('Reason is required');
      return;
    }
    // Services run one after another from the chosen time
    let startTime = selection.startTime;
    const items = booking.items.map((item) => {
      const entry = {
        serviceId: item.serviceId,
        stylistId: selection.stylistId,
        date: selection.date,
        startTime,
        slotId: selection.slotId,
      };
      startTime = addMinutes(startTime, item.duration || 30);
      return entry;
    });

    setIsSaving(true);
    const result = await dispatch(
      rescheduleBooking({ bookingId: booking.id, data: { reason: text, items } }),
    );
    if (rescheduleBooking.fulfilled.match(result)) {
      showSuccess('Rescheduled!', BOOKING_MESSAGES.RESCHEDULE_SUCCESS);
      navigate(detailHref, { replace: true });
    } else {
      setIsSaving(false);
      showApiError(
        (result.payload as string) || BOOKING_MESSAGES.RESCHEDULE_FAILED,
        'Reschedule Failed',
      );
    }
  };

  return (
    <div className={`w-full space-y-6 ${shellPadding}`}>
      <PageHeader
        title="Reschedule Booking"
        description={`#${booking.bookingNumber} · ${booking.items
          .map((item) => item.serviceName || 'Service')
          .join(', ')}`}
        breadcrumbs={breadcrumbs}
        backTo={detailHref}
      />
      <SlotPicker
        branchId={booking.branchId}
        services={booking.items.map((item) => ({
          serviceId: item.serviceId,
          name: item.serviceName || 'Service',
          price: item.price,
          duration: item.duration,
        }))}
        stylists={[
          {
            userId: booking.stylistId,
            name: booking.stylistName || booking.items[0]?.stylistName || 'Your Stylist',
          },
        ]}
        initialStylistId={booking.stylistId}
        fixedStylist
        submitLabel="Confirm Reschedule"
        isSubmitting={isSaving}
        cancelTo={detailHref}
        onConfirm={submit}
      >
        <div className="space-y-2">
          <Label htmlFor="reschedule-reason">Reason *</Label>
          <Input
            id="reschedule-reason"
            value={reason}
            placeholder="e.g. Change in plans"
            aria-invalid={!!reasonError}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(undefined);
            }}
          />
          {reasonError && <p className="text-sm text-red-600">{reasonError}</p>}
        </div>
      </SlotPicker>
    </div>
  );
}
