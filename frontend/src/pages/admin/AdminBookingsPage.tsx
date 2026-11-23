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
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end lg:max-w-2xl">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="ml-1 text-xs font-bold uppercase text-muted-foreground">Branch</span>
          <Select
            value={selectedBranch}
            onValueChange={(value) => list.update({ branch: value === 'all' ? undefined : value })}
          >
            <SelectTrigger aria-label="Filter by branch" className="border-border/60 bg-background">
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
          className="h-10"
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
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card
              key={booking.id}
              className="overflow-hidden transition-all border-border/60 hover:shadow-md"
            >
              <div className="flex flex-col lg:flex-row">
                <div className="min-w-0 flex-1 p-4 sm:p-6">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Icon icon="solar:hashtag-bold" className="size-4 text-primary" />
                        <span className="text-lg font-bold">{booking.bookingNumber}</span>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status === BookingStatus.SPECIAL ? 'Special' : booking.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="relative flex items-center gap-1 group">
                          <Icon icon="solar:user-bold" className="size-3.5 text-blue-500" />
                          <span className="font-medium text-foreground">
                            {booking.userName || `User ${booking.userId.slice(-6)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon icon="solar:buildings-bold" className="size-3" />
                          <span>
                            Branch:{' '}
                            {branches.find((b) => b.id === booking.branchId)?.name || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                        Appointment Time
                      </p>
                      <p className="text-lg font-bold">
                        {booking.startTime} - {booking.endTime}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {booking.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 border-border/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center rounded-lg size-8 bg-primary/10">
                            <Icon
                              icon="solar:scissors-square-bold"
                              className="size-4 text-primary"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.serviceName}</p>
                            <p className="text-xs text-muted-foreground">
                              Stylist: {item.stylistName}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold">₹{item.price}</p>
                      </div>
                    ))}
                  </div>

                  {booking.notes && (
                    <div className="p-3 mt-4 border border-yellow-100 rounded-lg bg-yellow-50/50">
                      <p className="text-[10px] font-bold uppercase text-yellow-700 mb-1">
                        Customer Notes
                      </p>
                      <p className="text-sm text-yellow-800">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-4 border-t bg-muted/10 p-4 sm:p-6 lg:w-72 lg:border-t-0 lg:border-l border-border/40">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                        Payment
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {booking.paymentStatus}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                        Total Price
                      </p>
                      <p className="text-2xl font-black text-primary">₹{booking.totalPrice}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {booking.status === BookingStatus.CONFIRMED && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/admin/bookings/${bookingRef(booking)}/reschedule`, {
                              state: { from: location.search },
                            })
                          }
                        >
                          <Icon icon="solar:calendar-rotate-bold" className="mr-2 size-4" />
                          Reschedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-100 hover:bg-red-50"
                          onClick={() => handleCancel(booking)}
                        >
                          <Icon icon="solar:close-circle-bold" className="mr-2 size-4" />
                          Cancel Booking
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/bookings/${bookingRef(booking)}`)}
                    >
                      <Icon icon="solar:document-text-bold" className="mr-2 size-4" />
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
