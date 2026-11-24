import { useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import type { RootState } from '@/app/store';
import { bookingRef } from '@/common/utils/bookingRef';
import { showApiError, showSuccess } from '@/common/utils/swal.utils';
import { LoadingGate } from '@/components/common/LoadingGate';
import Pagination from '@/components/pagination/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BOOKING_MESSAGES, BookingStatus } from '@/features/booking/booking.constants';
import { fetchStylistBookings, updateBookingStatus } from '@/features/booking/booking.thunks';
import { bookingStatusClass, bookingStatusLabel } from '@/features/booking/bookingStatusStyle';
import { fetchStylistRooms, initializeChatRoom } from '@/features/chat/chat.thunks';
import type { ChatRoom } from '@/features/chat/chat.types';
import { useDebounce } from '@/hooks/useDebounce';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';

const LIMIT = 5;
const rupees = (amount?: number) => `₹${(amount ?? 0).toLocaleString('en-IN')}`;
const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export default function StylistAppointmentsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { myBookings: bookingsList, pagination, loading, error } = useAppSelector((s) => s.booking);
  // Filters live in the address, so a refresh or coming back keeps them
  const list = useListParams();
  const day = isDay(list.value('date')) ? list.value('date') : '';
  const showAll = list.value('view') === 'all' || !!day;
  const debouncedSearch = useDebounce(list.search, 500);
  const page = list.page;

  const { rooms } = useAppSelector((state: RootState) => state.chat);

  useEffect(() => {
    dispatch(fetchStylistRooms());
  }, [dispatch]);

  const fetchBookings = useCallback(() => {
    // Today is the salon's local day, not the UTC one
    const date = day || (showAll ? undefined : format(new Date(), 'yyyy-MM-dd'));
    dispatch(
      fetchStylistBookings({ page, limit: LIMIT, search: debouncedSearch || undefined, date }),
    );
  }, [dispatch, page, debouncedSearch, showAll, day]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusUpdate = async (bookingId: string, status: BookingStatus, label: string) => {
    const result = await dispatch(updateBookingStatus({ bookingId, status }));
    if (updateBookingStatus.fulfilled.match(result)) {
      showSuccess('Updated!', BOOKING_MESSAGES.STATUS_UPDATE_SUCCESS);
      fetchBookings();
    } else {
      showApiError(BOOKING_MESSAGES.STATUS_UPDATE_FAILED, `Failed to mark ${label}`);
    }
  };

  const handleOpenChat = async (bookingId: string) => {
    let room = rooms.find((r: ChatRoom) => r.bookingId === bookingId);

    if (!room) {
      try {
        const action = await dispatch(initializeChatRoom(bookingId)).unwrap();
        room = action;
        showSuccess('Room Ready', 'Chat room initialized successfully.');
      } catch {
        showApiError('Chat room not ready yet.', 'Please try again later.');
        return;
      }
    }

    if (room && room.id) {
      navigate(`/stylist/chat?roomId=${room.id}`);
    } else {
      showApiError('Chat room not ready yet.', 'Please try again later.');
    }
  };

  // A notification link can ask to open the newest chat straight away
  const openChatRequested = list.value('openChat') === 'true';
  const updateList = list.update;
  useEffect(() => {
    if (!openChatRequested) return;
    const clearRequest = () => updateList({ openChat: undefined });
    const firstValidBooking = bookingsList.find(
      (b) => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED,
    );
    if (!firstValidBooking) {
      clearRequest();
      return;
    }
    const room = rooms.find((r: ChatRoom) => r.bookingId === firstValidBooking.id);
    if (room) {
      navigate(`/stylist/chat?roomId=${room.id}`);
    } else {
      dispatch(initializeChatRoom(firstValidBooking.id))
        .unwrap()
        .then((newRoom) => navigate(`/stylist/chat?roomId=${newRoom.id}`))
        .catch(clearRequest);
    }
  }, [openChatRequested, rooms, bookingsList, dispatch, navigate, updateList]);

  return (
    <div className="space-y-5 text-foreground">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="break-words text-2xl font-bold sm:text-3xl">Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your appointment schedule</p>
        </div>
        <Button onClick={fetchBookings} variant="outline" className="h-10 w-full gap-2 sm:w-auto">
          <Icon icon="solar:refresh-linear" className="size-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[auto_12rem_minmax(0,1fr)]">
        <div
          className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1"
          role="group"
          aria-label="Which appointments"
        >
          {[
            { label: 'Today', all: false },
            { label: 'All Appointments', all: true },
          ].map((tab) => {
            const active = tab.all ? showAll && !day : !showAll;
            return (
              <button
                key={tab.label}
                type="button"
                aria-pressed={active}
                onClick={() => list.update({ view: tab.all ? 'all' : undefined, date: undefined })}
                className={cn(
                  'h-8 min-w-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors',
                  active ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)] lg:contents">
          <Input
            type="date"
            aria-label="Choose a day"
            value={day}
            onChange={(e) => list.update({ date: e.target.value || undefined })}
            className={cn('h-10 min-w-0', day && 'border-primary')}
          />
          <div className="relative min-w-0">
            <Icon
              icon="solar:magnifer-linear"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Search appointments"
              placeholder="Search by customer name..."
              value={list.search}
              onChange={(e) => list.update({ q: e.target.value })}
              className="h-10 pl-9"
            />
          </div>
        </div>
      </div>

      <LoadingGate
        loading={loading}
        error={error}
        data={bookingsList}
        emptyMessage={showAll ? 'No appointments found.' : 'No appointments today.'}
        emptyIcon="solar:calendar-minimalistic-broken"
        resetError={fetchBookings}
        backPath="/stylist"
        role="STYLIST"
      >
        <ul className="grid gap-3 xl:grid-cols-2">
          {bookingsList.map((booking) => {
            const services =
              booking.items
                .map((item) => item.serviceName)
                .filter(Boolean)
                .join(' + ') || 'Appointment';
            const canChat =
              booking.status === BookingStatus.CONFIRMED ||
              booking.status === BookingStatus.COMPLETED;
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
                    className={cn('shrink-0', bookingStatusClass(booking.status))}
                  >
                    {bookingStatusLabel(booking.status)}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon
                      icon="solar:scissors-square-bold-duotone"
                      className="size-6 text-primary"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">{services}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Icon icon="solar:user-bold-duotone" className="size-3 shrink-0" />
                      <span className="truncate">{booking.userName || 'Customer'}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-primary">
                    {rupees(booking.totalPrice)}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-10 min-w-0 gap-2 px-2" asChild>
                    <Link to={`/stylist/appointments/${bookingRef(booking)}`}>
                      <Icon icon="solar:document-text-linear" className="size-4 shrink-0" />
                      Details
                    </Link>
                  </Button>
                  {canChat ? (
                    <Button
                      variant="outline"
                      className="h-10 min-w-0 gap-2 border-primary/20 px-2 text-primary hover:bg-primary/5 hover:text-primary"
                      onClick={() => handleOpenChat(booking.id)}
                    >
                      <Icon icon="solar:chat-round-bold-duotone" className="size-4 shrink-0" />
                      Chat
                    </Button>
                  ) : (
                    <span />
                  )}
                  {booking.status === BookingStatus.CONFIRMED && (
                    <>
                      <Button
                        className="h-10 min-w-0 gap-2 bg-emerald-600 px-2 text-white hover:bg-emerald-700"
                        onClick={() =>
                          handleStatusUpdate(booking.id, BookingStatus.COMPLETED, 'Completed')
                        }
                      >
                        <Icon icon="solar:check-circle-bold-duotone" className="size-4 shrink-0" />
                        Completed
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 min-w-0 gap-2 border-red-200 px-2 text-red-600 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          handleStatusUpdate(booking.id, BookingStatus.NO_SHOW, 'No Show')
                        }
                      >
                        <Icon icon="solar:ghost-bold-duotone" className="size-4 shrink-0" />
                        No Show
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            className="mt-4"
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(next) => list.update({}, next)}
          />
        )}
      </LoadingGate>
    </div>
  );
}
