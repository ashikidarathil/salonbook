import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarOff, Plus, RefreshCw } from 'lucide-react';
import { Loader } from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { SlotItem } from '@/features/slot/slot.types';
import {
  SLOT_FILTERS,
  SLOT_PERIODS,
  countSlots,
  isDayStatus,
  slotKind,
  slotPeriod,
} from '@/features/slot/slotBoard';
import type { SlotFilter } from '@/features/slot/slotBoard';
import { SlotDayBoard } from './SlotDayBoard';
import type { BoardStylist } from './SlotDayBoard';
import { SlotStatusChips } from './SlotStatusChips';
import { SlotTile } from './SlotTile';

type Perspective = 'admin' | 'self';

const DAY_COPY: Record<string, Record<Perspective, { title: string; text: string }>> = {
  OFF_DAY: {
    admin: { title: 'On leave', text: 'This stylist has an approved off-day on this date.' },
    self: { title: 'You are on leave', text: 'You have an approved off-day on this date.' },
  },
  NON_WORKING: {
    admin: { title: 'Not a working day', text: 'This stylist does not work on this day.' },
    self: { title: 'Not a working day', text: 'You are not scheduled to work on this day.' },
  },
  NO_SCHEDULE: {
    admin: { title: 'No schedule', text: 'Set a weekly schedule for this stylist first.' },
    self: { title: 'No schedule', text: 'Ask your manager to set your working hours.' },
  },
};

interface SlotDayPanelProps {
  slots: SlotItem[];
  loading: boolean;
  failed: boolean;
  onRefresh: () => void;
  filter: SlotFilter;
  onFilterChange: (filter: SlotFilter) => void;
  bookingHref: (bookingId: string) => string;
  onSelect: (slot: SlotItem) => void;
  perspective: Perspective;
  specialHref?: (stylistId: string) => string;
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border bg-white px-6 py-12 text-center shadow-sm">
      <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
        <CalendarOff className="size-6 text-muted-foreground" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm break-words text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

/** The chips and slots for one day, as a board on laptops and a grouped list on phones. */
export function SlotDayPanel({
  slots,
  loading,
  failed,
  onRefresh,
  filter,
  onFilterChange,
  bookingHref,
  onSelect,
  perspective,
  specialHref,
}: SlotDayPanelProps) {
  const isLaptop = useMediaQuery('(min-width: 1280px)');
  const [focusId, setFocusId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader label="Loading slots" />
      </div>
    );
  }
  if (failed) {
    return (
      <div className="space-y-3 rounded-2xl border bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">The slots could not be loaded.</p>
        <Button variant="outline" className="h-10" onClick={onRefresh}>
          Try again
        </Button>
      </div>
    );
  }

  const holiday = slots.find((slot) => slot.status === 'HOLIDAY');
  if (holiday) {
    return (
      <Notice
        title="Salon holiday"
        text={holiday.note || 'This day is marked as a holiday. No slots are available.'}
      />
    );
  }

  const stylists: BoardStylist[] = [];
  slots.forEach((slot) => {
    if (stylists.some((stylist) => stylist.id === slot.stylistId)) return;
    const marker = slots.find((item) => item.stylistId === slot.stylistId && isDayStatus(item));
    stylists.push({
      id: slot.stylistId,
      name: slot.stylistName || 'Stylist',
      dayLabel: marker ? DAY_COPY[marker.status]?.admin.title : undefined,
    });
  });
  stylists.sort((a, b) => a.name.localeCompare(b.name));

  const useBoard = isLaptop && stylists.length > 1;
  const focused = stylists.find((stylist) => stylist.id === focusId) ?? stylists[0];
  const scope = useBoard ? slots : slots.filter((slot) => slot.stylistId === focused?.id);
  const timeSlots = scope.filter((slot) => !isDayStatus(slot));
  const visible = timeSlots.filter((slot) => filter === 'ALL' || slotKind(slot) === filter);
  const dayMarker = useBoard ? undefined : scope.find(isDayStatus);
  const dayCopy = dayMarker ? DAY_COPY[dayMarker.status]?.[perspective] : undefined;
  const filterLabel = SLOT_FILTERS.find((item) => item.value === filter)?.label.toLowerCase();

  return (
    <div className="space-y-4">
      {!useBoard && stylists.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
          role="group"
          aria-label="Choose a stylist"
        >
          {stylists.map((stylist) => (
            <button
              key={stylist.id}
              type="button"
              aria-pressed={stylist.id === focused?.id}
              onClick={() => setFocusId(stylist.id)}
              className={cn(
                'h-10 max-w-52 shrink-0 truncate rounded-full border px-4 text-sm font-medium transition-colors',
                stylist.id === focused?.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'bg-white hover:bg-muted',
              )}
            >
              {stylist.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {dayCopy && !timeSlots.length ? (
          <span />
        ) : (
          <SlotStatusChips
            value={filter}
            counts={countSlots(timeSlots)}
            onChange={onFilterChange}
          />
        )}
        <div className="flex shrink-0 gap-2">
          {specialHref && !useBoard && focused && (
            <Button variant="outline" className="h-10 min-w-0 flex-1 gap-2 xl:flex-none" asChild>
              <Link to={specialHref(focused.id)}>
                <Plus className="size-4" />
                Special Slot
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            className="h-10 min-w-0 flex-1 gap-2 xl:flex-none"
            onClick={onRefresh}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!stylists.length ? (
        <Notice title="No slots" text="There are no slots left for this branch on this date." />
      ) : dayCopy && !timeSlots.length ? (
        <Notice title={dayCopy.title} text={dayCopy.text} />
      ) : !visible.length ? (
        <Notice
          title={filter === 'ALL' ? 'No slots' : `No ${filterLabel} slots`}
          text={
            filter === 'ALL'
              ? 'There are no slots left on this date.'
              : 'Try another status or another date.'
          }
        />
      ) : useBoard ? (
        <SlotDayBoard
          stylists={stylists}
          slots={visible}
          bookingHref={bookingHref}
          onSelect={onSelect}
          specialHref={specialHref}
        />
      ) : (
        <div className="space-y-5">
          {dayCopy && (
            <p className="rounded-xl border bg-muted/40 px-3 py-2 text-sm">{dayCopy.text}</p>
          )}
          {SLOT_PERIODS.map((period) => {
            const items = visible.filter((slot) => slotPeriod(slot.startTime) === period);
            if (!items.length) return null;
            return (
              <section key={period} className="space-y-2">
                <h2 className="text-sm font-semibold">
                  {period} <span className="text-muted-foreground">({items.length})</span>
                </h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {items.map((slot) => (
                    <SlotTile
                      key={slot.id}
                      slot={slot}
                      bookingHref={bookingHref}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
