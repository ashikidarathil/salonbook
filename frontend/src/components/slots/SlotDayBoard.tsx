import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { SlotItem } from '@/features/slot/slot.types';
import { SLOT_PERIODS, formatSlotTime, slotPeriod } from '@/features/slot/slotBoard';
import { SlotTile } from './SlotTile';

export interface BoardStylist {
  id: string;
  name: string;
  /** Leave, day off or missing schedule */
  dayLabel?: string;
}

interface SlotDayBoardProps {
  stylists: BoardStylist[];
  slots: SlotItem[];
  bookingHref: (bookingId: string) => string;
  onSelect: (slot: SlotItem) => void;
  specialHref?: (stylistId: string) => string;
}

/** Laptop view: times down the side and one column per stylist. */
export function SlotDayBoard({
  stylists,
  slots,
  bookingHref,
  onSelect,
  specialHref,
}: SlotDayBoardProps) {
  const times = [...new Set(slots.map((slot) => slot.startTime))].sort();
  const cell = (stylistId: string, time: string) =>
    slots.filter((slot) => slot.stylistId === stylistId && slot.startTime === time);

  return (
    <div className="max-h-[72vh] overflow-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 w-24 border-b bg-white px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
              Time
            </th>
            {stylists.map((stylist) => (
              <th
                key={stylist.id}
                className="sticky top-0 z-20 min-w-44 border-b border-l bg-white px-3 py-2 text-left align-top"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold" title={stylist.name}>
                      {stylist.name}
                    </span>
                    {stylist.dayLabel && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {stylist.dayLabel}
                      </span>
                    )}
                  </span>
                  {specialHref && (
                    <Link
                      to={specialHref(stylist.id)}
                      aria-label={`Create special slot for ${stylist.name}`}
                      title="Create special slot"
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border text-primary hover:bg-muted"
                    >
                      <Plus className="size-4" />
                    </Link>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOT_PERIODS.map((period) => {
            const periodTimes = times.filter((time) => slotPeriod(time) === period);
            if (!periodTimes.length) return null;
            return (
              <Fragment key={period}>
                <tr>
                  <td
                    colSpan={stylists.length + 1}
                    className="border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    {period}
                  </td>
                </tr>
                {periodTimes.map((time) => (
                  <tr key={time}>
                    <td className="sticky left-0 z-10 whitespace-nowrap border-b bg-white px-3 py-1.5 text-xs font-medium">
                      {formatSlotTime(time)}
                    </td>
                    {stylists.map((stylist) => (
                      <td key={stylist.id} className="border-b border-l p-1.5 align-top">
                        <div className="grid gap-1">
                          {cell(stylist.id, time).map((slot) => (
                            <SlotTile
                              key={slot.id}
                              slot={slot}
                              hideTime
                              bookingHref={bookingHref}
                              onSelect={onSelect}
                            />
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
