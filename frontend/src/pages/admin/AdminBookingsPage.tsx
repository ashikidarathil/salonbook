'use client';
import { bookingRef } from '@/common/utils/bookingRef';

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useListParams } from '@/hooks/useListParams';
import { PageHeader } from '@/components/common/PageHeader';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAdminBookings, cancelBooking } from '@/features/booking/booking.thunks';
import { fetchBranches } from '@/features/branch/branch.thunks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { LoadingGate } from '@/components/common/LoadingGate';
import { format } from 'date-fns';
import { showSuccess, showCancellationConfirm } from '@/common/utils/swal.utils';
import type { BookingItem } from '@/features/booking/booking.types';
import { BookingStatus, BOOKING_MESSAGES } from '@/features/booking/booking.constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const statusLabel = (status: string) => status.replace(/_/g, ' ');

export default function AdminBookingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myBookings: bookings, loading, error } = useAppSelector((state) => state.booking);
  const { branches } = useAppSelector((state) => state.branch);

  const location = useLocation();
  const list = useListParams();
  const branchParam = list.value('branch');
  const dateParam = list.value('date');
  const selectedBranch = branchParam === 'ALL' ? 'all' : branchParam;
  const selectedDate = dateParam === 'ALL' ? format(new Date(), 'yyyy-MM-dd') : dateParam;

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchAdminBookings({
        branchId: selectedBranch === 'all' ? undefined : selectedBranch,
        date: selectedDate,
      }),
    );
  }, [dispatch, selectedBranch, selectedDate]);

  const handleCancel = async (booking: BookingItem) => {
    const reason = await showCancellationConfirm();
    if (reason) {
      const result = await dispatch(cancelBooking({ bookingId: booking.id, reason }));
      if (cancelBooking.fulfilled.match(result)) {
        showSuccess('Cancelled', BOOKING_MESSAGES.CANCEL_SUCCESS);
      }
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return 'bg-green-100 text-green-700 border-green-200';
      case BookingStatus.PENDING_PAYMENT:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-700 border-red-200';
      case BookingStatus.COMPLETED:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case BookingStatus.NO_SHOW:
        return 'bg-gray-200 text-gray-600 border-gray-300';
      case BookingStatus.SPECIAL:
        return 'bg-primary/20 text-primary border-primary/30';
      case BookingStatus.FAILED:
        return 'bg-red-50 text-red-500 border-red-100';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Booking Management"
        description="Monitor and manage all salon appointments"
        breadcrumbs={[{ label: 'Bookings' }]}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border bg-card p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:p-4">
        <div className="col-span-2 flex min-w-0 flex-col gap-1.5 sm:col-span-1">
          <span className="ml-1 text-xs font-bold uppercase text-muted-foreground">Branch</span>
          <Select
            value={selectedBranch}
            onValueChange={(value) => list.update({ branch: value === 'all' ? undefined : value })}
          >
            <SelectTrigger
              aria-label="Filter by branch"
              className="h-10 border-border/60 bg-background"
            >
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="ml-1 text-xs font-bold uppercase text-muted-foreground">Date</span>
          <input
            type="date"
            aria-label="Filter by date"
            value={selectedDate}
            onChange={(e) => list.update({ date: e.target.value })}
            className="h-10 w-full rounded-md border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          variant="outline"
          className="h-10 self-end"
          aria-label="Refresh bookings"
          onClick={() =>
            dispatch(
              fetchAdminBookings({
                branchId: selectedBranch === 'all' ? undefined : selectedBranch,
                date: selectedDate,
              }),
            )
          }
        >
          <Icon icon="solar:restart-bold" className="size-4" />
        </Button>
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={bookings}
        emptyMessage="No bookings found for the selected criteria."
      >
        <div className="grid gap-4 2xl:grid-cols-2">
          {bookings.map((booking) => (
            <Card key={booking.id} className="min-w-0 overflow-hidden border-border/60 shadow-sm">
              <div className="flex h-full flex-col lg:flex-row">
                <div className="min-w-0 flex-1 space-y-3 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all text-base font-bold sm:text-lg">
                        #{booking.bookingNumber}
                      </p>
                      <p className="mt-0.5 break-words text-sm font-medium">
                        {booking.userName || `User ${booking.userId.slice(-6)}`}
                      </p>
                    </div>
                    <Badge
                      className={`max-w-[55%] shrink-0 whitespace-normal text-center text-[10px] leading-tight ${getStatusColor(booking.status)}`}
                    >
                      {statusLabel(booking.status)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
                      <Icon
                        icon="solar:clock-circle-bold"
                        className="size-3.5 shrink-0 text-primary"
                      />
                      <span className="font-semibold text-foreground">
                        {booking.startTime} - {booking.endTime}
                      </span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
                      <Icon icon="solar:buildings-bold" className="size-3.5 shrink-0" />
                      <span className="break-words">
                        {branches.find((b) => b.id === booking.branchId)?.name || 'Unknown'}
                      </span>
                    </span>
                  </div>

                  <ul className="divide-y rounded-lg border border-border/40 bg-muted/20">
                    {booking.items.map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold">{item.serviceName}</p>
                          <p className="break-words text-xs text-muted-foreground">
                            {item.stylistName}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-bold">{money(item.price)}</p>
                      </li>
                    ))}
                  </ul>

                  {booking.notes && (
                    <div className="rounded-lg border border-yellow-100 bg-yellow-50/50 p-3">
                      <p className="mb-1 text-[10px] font-bold uppercase text-yellow-700">
                        Customer Notes
                      </p>
                      <p className="break-words text-sm text-yellow-800">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-col justify-between gap-3 border-t border-border/40 bg-muted/10 p-4 sm:p-5 lg:w-60 lg:border-l lg:border-t-0">
                  <div className="flex items-end justify-between gap-3 lg:flex-col lg:items-start">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Payment
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-1 whitespace-normal text-[10px] leading-tight"
                      >
                        {statusLabel(booking.paymentStatus)}
                      </Badge>
                    </div>
                    <div className="shrink-0 text-right lg:text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Total
                      </p>
                      <p className="text-xl font-black text-primary">{money(booking.totalPrice)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                    {booking.status === BookingStatus.CONFIRMED && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 px-2"
                          onClick={() =>
                            navigate(`/admin/bookings/${bookingRef(booking)}/reschedule`, {
                              state: { from: location.search },
                            })
                          }
                        >
                          <Icon icon="solar:calendar-mark-bold" className="mr-1.5 size-4" />
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-10 border-red-100 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleCancel(booking)}
                        >
                          <Icon icon="solar:close-circle-bold" className="mr-1.5 size-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      className="col-span-2 h-10 lg:col-span-1"
                      onClick={() => navigate(`/admin/bookings/${bookingRef(booking)}`)}
                    >
                      <Icon icon="solar:document-text-bold" className="mr-1.5 size-4" />
                      Full Details
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </LoadingGate>
    </div>
  );
}
